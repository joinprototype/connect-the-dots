// The explorer's world state: graphology graph + sigma renderer + filters.
// React owns the controls and calls setView(); it never holds per-node state.
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import Sigma from 'sigma';
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types';
import { FADED_TEXT_ALPHA, glColor, mix, tokenRgb, tokenString, type RGB } from '../lib/color';
import type { GraphIndex } from '../lib/data';
import { timeState } from '../lib/dates';
import {
  bestVis,
  edgeVis,
  isFaint,
  lensLayers,
  META_ID,
  META_LABEL,
  metaEdgeId,
  passiveModel,
  type Filters,
  type PassiveModel,
  type Vis,
} from '../lib/filters';
import type { PathResult } from '../lib/paths';
import { hash01 } from '../lib/hash';
import { capPixelRatio, drawPlacedLabels, makeHoverDrawer } from '../lib/sigma-draw';
import type { GEdge } from '../lib/types';

/** Below this width the labels stay whole, inside the view. */
const PHONE_WIDTH = 600;

export type Selection = { kind: 'node'; id: string } | { kind: 'edge'; id: string } | null;

export interface EngineView {
  filters: Filters;
  /**
   * Entities that may be drawn (the explored neighbourhood and any routes); null draws everything.
   * The explorer never starts from the whole graph: an empty set draws nothing.
   */
  scope?: Set<string> | null;
  /** Show passive holders instead of the "Index funds" meta-node. */
  expandPassive: boolean;
  selection: Selection;
  path: PathResult | null;
}

interface NodeAttrs {
  x: number;
  y: number;
  size: number;
  color: string;
  rgb: RGB;
  label: string;
  subLabel: string;
  meta: boolean;
  [key: string]: unknown;
}

interface EdgeAttrs {
  size: number;
  color: string;
  rgb: RGB;
  faint: boolean;
  meta: boolean;
  weight: number;
  [key: string]: unknown;
}

export class ExplorerEngine {
  readonly graph: Graph<NodeAttrs, EdgeAttrs>;
  readonly sigma: Sigma<NodeAttrs, EdgeAttrs>;
  private readonly idx: GraphIndex;
  private readonly pm: PassiveModel;
  /** Canvas background: fades mix towards it. */
  private readonly night: RGB;
  private readonly accent: RGB;
  private readonly ink: RGB;
  private readonly nodeGray: RGB;
  private readonly edgeGray: RGB;
  private view: EngineView;
  private nodeVis = new Map<string, Vis>();
  private edgeVisMap = new Map<string, Vis>();
  private emphasis: { nodes: Set<string>; edges: Set<string>; strong: boolean } | null = null;
  /** Fund holdings drawn as their own line although grouped: see ownLines(). */
  private ungrouped = new Set<string>();
  /** Links between the same two entries are drawn as one line: each hidden one → the drawn one. */
  private drawnAs = new Map<string, string>();
  /** A drawn line that stands for several links → how many. */
  private parallel = new Map<string, number>();
  private hovered: string | null = null;
  private selectListeners: ((s: Selection) => void)[] = [];
  private ro: ResizeObserver;
  private labelTheme!: { ink: RGB; ground: RGB; muted: RGB; font: string };
  private reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(container: HTMLElement, idx: GraphIndex, view: EngineView) {
    this.idx = idx;
    this.view = view;
    this.pm = passiveModel(idx);
    // Neutral graph: gray dots and lines, one accent for selection and paths (tokens, light or dark).
    const theme = {
      ink: tokenRgb('--night-ink', [29, 29, 31], container),
      // The canvas sits on the page surface (white, or #111113 in dark mode): fades and label halos use it.
      ground: tokenRgb('--paper', [255, 255, 255], container),
      muted: tokenRgb('--night-muted', [110, 110, 115], container),
      font: tokenString('--font-ui', 'system-ui, sans-serif', container),
    };
    this.night = theme.ground;
    this.ink = theme.ink;
    this.accent = tokenRgb('--accent', [0, 102, 204], container);
    this.nodeGray = tokenRgb('--graph-node', [142, 142, 147], container);
    this.edgeGray = tokenRgb('--graph-edge', [199, 199, 204], container);
    const hoverTheme = { ...theme, ground: tokenRgb('--night-2', [255, 255, 255], container) };

    this.graph = new Graph<NodeAttrs, EdgeAttrs>({ multi: true, type: 'directed', allowSelfLoops: false });
    this.buildGraph();
    this.layout();

    this.recompute();

    this.sigma = new Sigma<NodeAttrs, EdgeAttrs>(this.graph, container, {
      allowInvalidContainer: true,
      enableEdgeEvents: true,
      defaultEdgeType: 'line',
      labelFont: theme.font,
      labelSize: 14,
      labelWeight: '500',
      // Labels are placed by drawLabels() so they never overlap (sigma's label grid does not measure text).
      renderLabels: false,
      zIndex: true,
      stagePadding: 48,
      minCameraRatio: 0.08,
      maxCameraRatio: 4,
      minEdgeThickness: 1,
      defaultDrawNodeHover: makeHoverDrawer(hoverTheme),
      nodeReducer: (node, data) => this.reduceNode(node, data),
      edgeReducer: (edge, data) => this.reduceEdge(edge, data),
    });

    capPixelRatio(this.sigma);
    this.labelTheme = theme;
    this.sigma.on('afterRender', () => this.drawLabels());
    this.sigma.on('clickNode', ({ node }) => this.emitSelect({ kind: 'node', id: node }));
    this.sigma.on('clickEdge', ({ edge }) => {
      if (this.graph.getEdgeAttribute(edge, 'meta')) this.emitSelect({ kind: 'node', id: META_ID });
      else this.emitSelect({ kind: 'edge', id: edge });
    });
    this.sigma.on('clickStage', () => this.emitSelect(null));
    this.sigma.on('enterNode', ({ node }) => {
      this.hovered = node;
      container.style.cursor = 'pointer';
      this.sigma.refresh();
    });
    this.sigma.on('leaveNode', () => {
      this.hovered = null;
      container.style.cursor = '';
      this.sigma.refresh();
    });
    this.sigma.on('enterEdge', () => (container.style.cursor = 'pointer'));
    this.sigma.on('leaveEdge', () => (container.style.cursor = ''));

    this.ro = new ResizeObserver(() => {
      if (container.offsetWidth && container.offsetHeight) this.sigma.refresh();
    });
    this.ro.observe(container);
  }

  // ------------------------------------------------------------------ build and layout

  private buildGraph(): void {
    const { idx, graph } = this;
    const maxDeg = Math.max(1, ...idx.data.nodes.map((n) => n.degree));
    for (const n of idx.data.nodes) {
      const type = idx.data.types[n.type];
      const rgb = this.nodeGray;
      graph.addNode(n.id, {
        x: 0,
        y: 0,
        size: 3.5 + 9 * Math.sqrt(n.degree / maxDeg),
        color: glColor(rgb),
        rgb,
        label: n.name,
        subLabel: [type?.label ?? n.type, n.when?.label].filter(Boolean).join(' · '),
        meta: false,
      });
    }
    for (const e of idx.edges.values()) {
      if (e.from === e.to) continue;
      const rgb = this.edgeGray;
      graph.addDirectedEdgeWithKey(e.id, e.from, e.to, {
        size: e.passive ? 1 : 1.6,
        color: glColor(rgb),
        rgb,
        faint: isFaint(e),
        meta: false,
        weight: e.passive ? 0.3 : 1,
      });
    }
    if (this.pm.edges.length) {
      const rgb = this.nodeGray;
      graph.addNode(META_ID, {
        x: 0,
        y: 0,
        size: 7 + Math.min(8, this.pm.holders.length * 1.5),
        color: glColor(rgb),
        rgb,
        label: `${META_LABEL} (${this.pm.holders.length})`,
        subLabel: 'Passive holdings, collapsed',
        meta: true,
      });
      for (const target of [...this.pm.byTarget.keys()].sort()) {
        graph.addDirectedEdgeWithKey(metaEdgeId(target), META_ID, target, {
          size: 1.2,
          color: glColor(this.edgeGray),
          rgb: this.edgeGray,
          faint: false,
          meta: true,
          weight: 0.5,
        });
      }
    }
  }

  /** Seeded positions + synchronous ForceAtlas2: same input, same picture. */
  private layout(): void {
    const { graph } = this;
    graph.forEachNode((id) => {
      const a = hash01(id) * Math.PI * 2;
      const r = 0.5 + hash01(id, 7) * 0.5;
      graph.mergeNodeAttributes(id, { x: Math.cos(a) * r * 100, y: Math.sin(a) * r * 100 });
    });
    const n = graph.order;
    const settings = forceAtlas2.inferSettings(graph);
    forceAtlas2.assign(graph, {
      iterations: n > 2000 ? 120 : 600,
      getEdgeWeight: 'weight',
      settings: { ...settings, gravity: 1.2, scalingRatio: 14, strongGravityMode: true, slowDown: 3, barnesHutOptimize: n > 2000 },
    });
  }

  // ------------------------------------------------------------------ state

  onSelect(cb: (s: Selection) => void): () => void {
    this.selectListeners.push(cb);
    return () => (this.selectListeners = this.selectListeners.filter((x) => x !== cb));
  }

  private emitSelect(s: Selection): void {
    for (const cb of this.selectListeners) cb(s);
  }

  setView(view: Partial<EngineView>): void {
    this.view = { ...this.view, ...view };
    this.recompute();
  }

  private collapsed(): boolean {
    return !this.view.expandPassive && (this.idx.data.methodology.collapse_passive ?? true) && this.pm.edges.length > 0;
  }

  /** Node drawn for an entity (absorbed passive holders are drawn as the meta-node). */
  displayNode(id: string): string {
    return this.collapsed() && this.pm.absorbed.has(id) ? META_ID : id;
  }

  /** Edge drawn for a claim (collapsed passive claims are drawn as meta-edges). */
  displayEdge(claimId: string): string {
    const e = this.idx.edges.get(claimId);
    if (e && e.passive && this.collapsed() && !this.ungrouped.has(claimId)) return metaEdgeId(e.to);
    return this.drawnAs.get(claimId) ?? claimId;
  }

  /**
   * Holdings on the route, or the selected link, whose holder is drawn as itself (it has links of its
   * own, so it is not folded into the group): drawn as the holder's own line, or the highlighted line
   * would leave the holder and start from the faded group dot instead.
   */
  private ownLines(): Set<string> {
    const sel = this.view.selection;
    const ids = [...(this.view.path?.hops.map((h) => h.edge.id) ?? []), ...(sel?.kind === 'edge' ? [sel.id] : [])];
    return new Set(
      ids.filter((id) => {
        const e = this.idx.edges.get(id);
        return !!e?.passive && !this.pm.absorbed.has(e.from);
      }),
    );
  }

  private recompute(): void {
    const { idx, view } = this;
    const f = view.filters;
    const layers = lensLayers(idx, f.lens);
    const collapsed = this.collapsed();
    this.ungrouped = collapsed ? this.ownLines() : new Set();
    const ev = new Map<string, Vis>();
    const underlying = new Map<string, Vis[]>();
    const scope = view.scope ?? null;
    for (const e of idx.edges.values()) {
      if (e.from === e.to) continue;
      const v = scope && (!scope.has(e.from) || !scope.has(e.to)) ? 'hide' : edgeVis(idx, e, f, layers);
      if (e.passive && collapsed && !this.ungrouped.has(e.id)) {
        underlying.set(e.to, [...(underlying.get(e.to) ?? []), v]);
        ev.set(e.id, 'hide');
      } else ev.set(e.id, v);
    }
    for (const target of this.pm.byTarget.keys()) {
      ev.set(metaEdgeId(target), collapsed ? bestVis(underlying.get(target) ?? []) : 'hide');
    }
    const nv = new Map<string, Vis>();
    for (const n of idx.data.nodes) {
      // As of t: not yet begun = hidden, already over = faded ("past"), undated = always shown.
      const time = timeState(n.when, f.t);
      if (time === 'future' || (scope && !scope.has(n.id)) || (collapsed && this.pm.absorbed.has(n.id))) {
        nv.set(n.id, 'hide');
        continue;
      }
      const inc = idx.incident.get(n.id) ?? [];
      const list = inc.map((e) => ev.get(e.id) ?? 'hide');
      if (collapsed && this.pm.byTarget.has(n.id)) list.push(ev.get(metaEdgeId(n.id)) ?? 'hide');
      const lit = inc.length === 0 || list.includes('show') || list.includes('past');
      nv.set(n.id, !lit ? 'dim' : time === 'past' ? 'past' : 'show');
    }
    if (this.graph.hasNode(META_ID)) {
      const any = [...this.pm.byTarget.keys()].some((t) => ev.get(metaEdgeId(t)) !== 'hide');
      nv.set(META_ID, collapsed && any ? 'show' : 'hide');
    }
    this.mergeParallel(ev);
    this.edgeVisMap = ev;
    this.nodeVis = nv;
    this.emphasis = this.computeEmphasis();
    this.sigma?.refresh();
  }

  /**
   * Several links shown between the same two entries are drawn as one line, a little thicker for each
   * (the panel lists them all, under "Also between them"). The line drawn is the most visible one,
   * documented fact before an account or a draft.
   */
  private mergeParallel(ev: Map<string, Vis>): void {
    this.drawnAs = new Map();
    this.parallel = new Map();
    const pairs = new Map<string, GEdge[]>();
    for (const [id, v] of ev) {
      const e = this.idx.edges.get(id);
      if (!e || v === 'hide') continue;
      const key = e.from < e.to ? `${e.from} ${e.to}` : `${e.to} ${e.from}`;
      pairs.set(key, [...(pairs.get(key) ?? []), e]);
    }
    const rank: Record<Vis, number> = { show: 0, past: 1, dim: 2, hide: 3 };
    for (const list of pairs.values()) {
      if (list.length < 2) continue;
      list.sort(
        (a, b) =>
          rank[ev.get(a.id)!] - rank[ev.get(b.id)!] ||
          Number(isFaint(a)) - Number(isFaint(b)) ||
          Number(a.passive) - Number(b.passive) ||
          (a.id < b.id ? -1 : 1),
      );
      const [drawn, ...rest] = list;
      this.parallel.set(drawn.id, list.length);
      for (const e of rest) {
        this.drawnAs.set(e.id, drawn.id);
        ev.set(e.id, 'hide');
      }
    }
  }

  private computeEmphasis(): { nodes: Set<string>; edges: Set<string>; strong: boolean } | null {
    const { view, graph } = this;
    if (view.path) {
      const nodes = new Set(view.path.nodes.map((n) => this.displayNode(n)));
      const edges = new Set(view.path.hops.map((h) => this.displayEdge(h.edge.id)));
      return { nodes, edges, strong: true };
    }
    const sel = view.selection;
    if (!sel) return null;
    if (sel.kind === 'edge') {
      if (!graph.hasEdge(sel.id)) return null;
      const id = this.displayEdge(sel.id);
      return { nodes: new Set([graph.source(id), graph.target(id)]), edges: new Set([id]), strong: false };
    }
    const node = this.displayNode(sel.id);
    if (!graph.hasNode(node)) return null;
    const nodes = new Set([node]);
    const edges = new Set<string>();
    graph.forEachEdge(node, (edge, _a, s, t) => {
      if ((this.edgeVisMap.get(edge) ?? 'hide') === 'hide') return;
      edges.add(edge);
      nodes.add(s === node ? t : s);
    });
    return { nodes, edges, strong: false };
  }

  // ------------------------------------------------------------------ reducers

  private reduceNode(node: string, data: NodeAttrs): Partial<NodeDisplayData> {
    const res: Partial<NodeDisplayData> & Record<string, unknown> = { ...data };
    const vis = this.nodeVis.get(node) ?? 'show';
    if (vis === 'hide') {
      res.hidden = true;
      return res;
    }
    let fade = vis === 'dim' ? 0.7 : vis === 'past' ? 0.55 : 0;
    let rgb = data.rgb;
    const emph = this.emphasis;
    if (emph) {
      if (emph.nodes.has(node)) {
        res.zIndex = 2;
        res.forceLabel = true;
        fade = Math.min(fade, 0.3);
        // A path is drawn in the accent, dots and lines alike.
        if (emph.strong) rgb = this.accent;
      } else fade = Math.max(fade, emph.strong ? 0.85 : 0.75);
    }
    const sel = this.view.selection;
    if (sel?.kind === 'node' && this.displayNode(sel.id) === node && !this.view.path) {
      res.highlighted = true;
      res.size = data.size * 1.25;
      rgb = this.accent;
      fade = 0;
    }
    if (this.view.path && emph?.nodes.has(node)) {
      const ends = [this.view.path.nodes[0], this.view.path.nodes[this.view.path.nodes.length - 1]].map((n) => this.displayNode(n));
      if (ends.includes(node)) res.highlighted = true;
    }
    if (this.hovered === node) {
      fade = 0;
      res.zIndex = 3;
    }
    res.color = glColor(fade > 0 ? mix(rgb, this.night, fade) : rgb);
    if (fade > 0.5) res.label = '';
    else if (vis === 'past') res.labelAlpha = FADED_TEXT_ALPHA;
    return res;
  }

  private reduceEdge(edge: string, data: EdgeAttrs): Partial<EdgeDisplayData> {
    const res: Partial<EdgeDisplayData> & Record<string, unknown> = { ...data };
    const vis = this.edgeVisMap.get(edge) ?? 'hide';
    if (vis === 'hide') {
      res.hidden = true;
      return res;
    }
    // Attributed and draft claims are a lighter gray, never another hue.
    let alpha = data.faint ? 0.5 : 1;
    let rgb = data.rgb;
    if (vis === 'dim') alpha *= 0.35;
    else if (vis === 'past') alpha *= 0.45;
    // a line that stands for several links is a little thicker for each
    const size = data.size + Math.min(2.4, ((this.parallel.get(edge) ?? 1) - 1) * 0.6);
    res.size = size;
    const emph = this.emphasis;
    if (emph) {
      if (emph.edges.has(edge)) {
        alpha = data.faint ? 0.75 : 1;
        res.size = size * (emph.strong ? 2.4 : 1.8);
        res.zIndex = 2;
        rgb = emph.strong ? this.accent : mix(rgb, this.ink, 0.45);
      } else alpha *= emph.strong ? 0.15 : 0.25;
    }
    if (this.hovered && (this.graph.source(edge) === this.hovered || this.graph.target(edge) === this.hovered)) {
      alpha = Math.max(alpha, 0.95);
      if (!emph?.strong || !emph.edges.has(edge)) rgb = mix(rgb, this.ink, 0.45);
      res.size = Math.max(res.size ?? size, size + 0.6);
    }
    res.color = glColor(rgb, alpha);
    return res;
  }

  // ------------------------------------------------------------------ labels

  /**
   * Labels without overlaps: emphasized entries first, then the biggest dots, each in the first free
   * spot (right, left, above, below its dot), clear of every dot and of the cards sigma draws for the
   * hovered and highlighted entries. Labels that fit nowhere are left out; hover shows any of them.
   */
  private drawLabels(): void {
    const emph = this.emphasis;
    drawPlacedLabels(this.sigma, this.labelTheme, {
      px: 14,
      weight: 500,
      priority: (node, d) => (emph?.nodes.has(node) ? 1e6 : 0) + (d.forceLabel ? 5e5 : 0) + this.sigma.scaleSize(d.size),
      hovered: this.hovered ?? undefined,
      // a phone has room for few names, and a cut-off name reads as a fault
      inside: this.sigma.getDimensions().width < PHONE_WIDTH,
    });
  }

  // ------------------------------------------------------------------ camera

  private frame(ids: string[]): void {
    const pts = ids.map((n) => this.sigma.getNodeDisplayData(n)).filter((d): d is NodeDisplayData => !!d && !d.hidden);
    if (!pts.length) return;
    const xs = pts.map((p) => p.x);
    const ys = pts.map((p) => p.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    const ratio = Math.max(pts.length === 1 ? 0.6 : 0.2, Math.min(1.2, Math.max(x1 - x0, y1 - y0) * 1.5 + 0.08));
    const state = { x: (x0 + x1) / 2, y: (y0 + y1) / 2, ratio };
    const cam = this.sigma.getCamera();
    if (this.reducedMotion) cam.setState(state);
    else void cam.animate(state, { duration: 650, easing: 'quadraticInOut' });
  }

  fitPath(path: PathResult): void {
    this.frame([...new Set(path.nodes.map((n) => this.displayNode(n)))]);
  }

  /** Frame everything that is drawn (after the explored neighbourhood grows). */
  fitVisible(): void {
    const ids: string[] = [];
    this.graph.forEachNode((node) => {
      if ((this.nodeVis.get(node) ?? 'hide') !== 'hide') ids.push(node);
    });
    this.frame(ids);
  }

  zoom(factor: number): void {
    const cam = this.sigma.getCamera();
    if (factor > 1) void cam.animatedZoom({ duration: this.reducedMotion ? 0 : 250, factor });
    else void cam.animatedUnzoom({ duration: this.reducedMotion ? 0 : 250, factor: 1 / factor });
  }

  destroy(): void {
    this.ro.disconnect();
    this.selectListeners = [];
    this.sigma.kill();
    this.graph.clear();
  }
}
