// Path finder for the explorer. `crates/ctd/src/paths.rs` is its twin for stories and the home page:
// `tools/qa/paths-golden.mjs` checks that they agree.
//
// cost(hop) = w_rel * (1 + beta * (1 - p))
//           + lambda * 0.5 * (ln(1 + deg_rel(u)) + ln(1 + deg_rel(v)))
//           + delta_undated            (only while a time filter is active and the claim is undated)
//
// p       = methodology.evidence[tier], times draft_factor for draft claims
// deg_rel = degree of the node counting only claims of that relation
//
// Search: Dijkstra over (node, hops) on an undirected view of the traversable claims, capped at
// max_hops. k diverse paths come from the penalty method: each later search pays reuse_penalty per
// earlier use of an intermediate node. All ties break on ids, so results are deterministic.

import type { GraphIndex } from './data';
import type { GEdge, Methodology } from './types';

export interface PathOptions {
  /** Traverse passive holdings ("index funds"). Default false. */
  includePassive?: boolean;
  /** Current view filters; return false for claims the view hides. */
  allowEdge?: (e: GEdge) => boolean;
  /** A time filter is active, so undated claims pay delta_undated. */
  timeFilterActive?: boolean;
}

export interface PathHop {
  edge: GEdge;
  /** Traversal order (not necessarily the claim's direction). */
  from: string;
  to: string;
  cost: number;
}

export interface PathResult {
  nodes: string[];
  hops: PathHop[];
  /** Methodology cost without diversity penalties. */
  cost: number;
  flags: string[];
}

const EPS = 1e-9;

export function evidenceStrength(m: Methodology, e: GEdge): number {
  const base = (e.tier && m.evidence[e.tier]) || 0;
  return e.status === 'draft' ? base * (m.evidence.draft_factor ?? 0.5) : base;
}

/** node -> relation -> number of claims of that relation touching the node. */
export function relationDegrees(idx: GraphIndex): Map<string, Map<string, number>> {
  const deg = new Map<string, Map<string, number>>();
  const bump = (n: string, rel: string) => {
    let m = deg.get(n);
    if (!m) deg.set(n, (m = new Map()));
    m.set(rel, (m.get(rel) ?? 0) + 1);
  };
  for (const e of idx.edges.values()) {
    bump(e.from, e.rel);
    if (e.to !== e.from) bump(e.to, e.rel);
  }
  return deg;
}

export function hopCost(
  m: Methodology,
  e: GEdge,
  degU: number,
  degV: number,
  timeFilterActive: boolean,
): number {
  const w = m.weights[e.rel] ?? m.default_weight;
  const p = evidenceStrength(m, e);
  let cost = w * (1 + m.beta * (1 - p)) + m.lambda * 0.5 * (Math.log1p(degU) + Math.log1p(degV));
  if (timeFilterActive && !e.when) cost += m.delta_undated;
  return cost;
}

interface Arc {
  to: string;
  edge: GEdge;
  cost: number;
}

interface Label {
  node: string;
  hops: number;
  cost: number;
  tie: string;
  prev: Label | null;
  arc: Arc | null;
}

function cmp(a: Label, b: Label): number {
  const d = a.cost - b.cost;
  if (Math.abs(d) > EPS) return d;
  if (a.hops !== b.hops) return a.hops - b.hops;
  return a.tie < b.tie ? -1 : a.tie > b.tie ? 1 : 0;
}

class Heap {
  private items: Label[] = [];
  get size(): number {
    return this.items.length;
  }
  push(x: Label): void {
    const a = this.items;
    a.push(x);
    let i = a.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (cmp(a[i], a[p]) >= 0) break;
      [a[i], a[p]] = [a[p], a[i]];
      i = p;
    }
  }
  pop(): Label | undefined {
    const a = this.items;
    if (!a.length) return undefined;
    const top = a[0];
    const last = a.pop()!;
    if (a.length) {
      a[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < a.length && cmp(a[l], a[m]) < 0) m = l;
        if (r < a.length && cmp(a[r], a[m]) < 0) m = r;
        if (m === i) break;
        [a[i], a[m]] = [a[m], a[i]];
        i = m;
      }
    }
    return top;
  }
}

/** Undirected adjacency of the claims the path finder may use, with per-hop costs. */
export function buildArcs(idx: GraphIndex, opts: PathOptions = {}): Map<string, Arc[]> {
  const m = idx.data.methodology;
  const deg = relationDegrees(idx);
  const arcs = new Map<string, Arc[]>();
  const add = (u: string, a: Arc) => {
    let list = arcs.get(u);
    if (!list) arcs.set(u, (list = []));
    list.push(a);
  };
  const edges = [...idx.edges.values()].sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  for (const e of edges) {
    if (!e.traversable || e.from === e.to) continue;
    if (e.status === 'deprecated') continue;
    if (e.passive && !opts.includePassive) continue;
    if (opts.allowEdge && !opts.allowEdge(e)) continue;
    const du = deg.get(e.from)?.get(e.rel) ?? 0;
    const dv = deg.get(e.to)?.get(e.rel) ?? 0;
    const cost = hopCost(m, e, du, dv, !!opts.timeFilterActive);
    add(e.from, { to: e.to, edge: e, cost });
    add(e.to, { to: e.from, edge: e, cost });
  }
  return arcs;
}

function search(
  arcs: Map<string, Arc[]>,
  source: string,
  target: string,
  maxHops: number,
  nodePenalty: (n: string) => number,
  pairPenalty: (a: string, b: string) => number,
): Label | null {
  const best = new Map<string, number[]>();
  const dominated = (n: string, hops: number, cost: number) => {
    const row = best.get(n);
    if (!row) return false;
    for (let h = 0; h <= hops; h++) if (row[h] !== undefined && row[h] <= cost + EPS) return true;
    return false;
  };
  const record = (n: string, hops: number, cost: number) => {
    let row = best.get(n);
    if (!row) best.set(n, (row = []));
    row[hops] = cost;
  };
  const heap = new Heap();
  heap.push({ node: source, hops: 0, cost: 0, tie: source, prev: null, arc: null });
  record(source, 0, 0);
  while (heap.size) {
    const cur = heap.pop()!;
    if (cur.node === target) return cur;
    if (cur.hops >= maxHops) continue;
    const row = best.get(cur.node);
    if (row && row[cur.hops] !== undefined && row[cur.hops] < cur.cost - EPS) continue; // stale
    for (const arc of arcs.get(cur.node) ?? []) {
      if (arc.to === source) continue;
      let cost = cur.cost + arc.cost + pairPenalty(cur.node, arc.to);
      if (arc.to !== target) cost += nodePenalty(arc.to);
      const hops = cur.hops + 1;
      if (dominated(arc.to, hops, cost)) continue;
      record(arc.to, hops, cost);
      heap.push({ node: arc.to, hops, cost, tie: `${arc.to}\u0000${arc.edge.id}`, prev: cur, arc });
    }
  }
  return null;
}

function unwind(idx: GraphIndex, end: Label): PathResult {
  const hops: PathHop[] = [];
  for (let l: Label | null = end; l && l.arc && l.prev; l = l.prev) {
    hops.push({ edge: l.arc.edge, from: l.prev.node, to: l.node, cost: l.arc.cost });
  }
  hops.reverse();
  const nodes = hops.length ? [hops[0].from, ...hops.map((h) => h.to)] : [end.node];
  const m = idx.data.methodology;
  const flags: string[] = [];
  if (hops.some((h) => h.edge.passive)) flags.push('through index funds');
  const hub = m.hub_threshold ?? 500;
  if (nodes.slice(1, -1).some((n) => (idx.nodes.get(n)?.degree ?? 0) > hub)) flags.push('through a very connected hub');
  return {
    nodes,
    hops,
    cost: hops.reduce((s, h) => s + h.cost, 0),
    flags,
  };
}

/** Up to k diverse, ranked paths between two entities. */
export function findPaths(idx: GraphIndex, from: string, to: string, opts: PathOptions = {}): PathResult[] {
  if (!idx.nodes.has(from) || !idx.nodes.has(to) || from === to) return [];
  const m = idx.data.methodology;
  const k = Math.max(1, m.k_paths ?? 5);
  const maxHops = Math.max(1, m.max_hops ?? 10);
  const penalty = m.reuse_penalty ?? 3;
  const arcs = buildArcs(idx, opts);

  const nodeUses = new Map<string, number>();
  const pairUses = new Map<string, number>();
  const pairKey = (a: string, b: string) => (a < b ? `${a}\u0000${b}` : `${b}\u0000${a}`);
  const results: PathResult[] = [];
  const seen = new Set<string>();

  for (let round = 0; round < k * 3 && results.length < k; round++) {
    const end = search(
      arcs,
      from,
      to,
      maxHops,
      (n) => penalty * (nodeUses.get(n) ?? 0),
      (a, b) => penalty * (pairUses.get(pairKey(a, b)) ?? 0),
    );
    if (!end) break;
    const path = unwind(idx, end);
    const sig = path.nodes.join('>');
    for (const n of path.nodes.slice(1, -1)) nodeUses.set(n, (nodeUses.get(n) ?? 0) + 1);
    if (seen.has(sig)) {
      // Same route again (e.g. a direct link with no intermediates): make its links costlier too.
      for (let i = 0; i + 1 < path.nodes.length; i++) {
        const key = pairKey(path.nodes[i], path.nodes[i + 1]);
        pairUses.set(key, (pairUses.get(key) ?? 0) + 1);
      }
      continue;
    }
    seen.add(sig);
    results.push(path);
  }

  return results.sort(
    (a, b) =>
      (Math.abs(a.cost - b.cost) > EPS ? a.cost - b.cost : 0) ||
      a.hops.length - b.hops.length ||
      (a.nodes.join('>') < b.nodes.join('>') ? -1 : 1),
  );
}
