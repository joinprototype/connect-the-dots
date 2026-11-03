// What the Stories surface draws: every entry and link of graph-slim.json (through the shared graph index),
// placed by data/islands.json (docs/data-contract.md), as flat arrays a frame can run through quickly.
import { loadGraphIndex, loadJson, type GraphIndex } from '../lib/data';
import type { GEdge } from '../lib/types';

/** One story's island: its centre and land radius in the map's units, the dots on its land, and its trail, the
 *  subject of each scene in order. Dots by index. */
export interface Isle {
  id: string;
  title: string;
  subtitle: string | null;
  scenes: number;
  x: number;
  y: number;
  r: number;
  land: number[];
  trail: number[];
  /** Every dot it tells of, on its land or in the water (from `told`). */
  named: number[];
  /** Its trail as drawn: the subjects near the island, so that the road stays on and around it. */
  road: number[];
}

/** `[a, b, strength 1 to 3, 1 when it shows at rest]`, islands by index. */
type Bridge = [number, number, number, number];

interface Picture {
  w: number;
  h: number;
  coast: number;
  at: number[];
  sealed: number[];
  /** The stories that tell of each dot, the one with the most scenes on it first. */
  told: number[][];
  stories: Omit<Isle, 'named' | 'road'>[];
  lines: Bridge[];
}

/** The nearness, in pixels per map unit, at which a dot is drawn at its own size and the names are planned. */
export const K0 = 0.2;
/** The hit grid's cell, in map units. */
const CELL = 60;

export interface World {
  idx: GraphIndex;
  /** The map's size, and how far land reaches around a dot on it, in its units. */
  w: number;
  h: number;
  coast: number;
  n: number;
  ids: string[];
  names: string[];
  /** A dot's kind, by index into `kinds`. */
  kind: Uint8Array;
  kinds: { id: string; label: string; ink: string }[];
  degree: Uint16Array;
  when: string[];
  x: Float32Array;
  y: Float32Array;
  /** The island whose land a dot lies on, or -1 in the water. */
  home: Int16Array;
  /** Sealed (ADR-0027): never named unless opened, and no line of theirs is drawn unless their entry is open. */
  sealed: Uint8Array;
  links: GEdge[];
  la: Int32Array;
  lb: Int32Array;
  /** Drawn dashed: one side's account, being verified, or disputed. */
  dashed: Uint8Array;
  /** Left out of the picture at rest: withdrawn, or touching a sealed entry. */
  quiet: Uint8Array;
  /** The links at each dot, withdrawn ones left out. */
  adj: number[][];
  isles: Isle[];
  /** The stories that name each dot. */
  told: number[][];
  bridges: Bridge[];
  byId: Map<string, number>;
  isleById: Map<string, number>;
  linkById: Map<string, number>;
  /** The level (log2 of the nearness over K0) from which each dot's name shows; Infinity: only when opened. */
  nameFrom: Float32Array;
  grid: Map<number, number[]>;
}

const cellOf = (x: number, y: number): number => Math.floor(x / CELL) * 65536 + Math.floor(y / CELL);

export async function loadWorld(): Promise<World> {
  const [idx, pic] = await Promise.all([loadGraphIndex(), loadJson<Picture>('/data/islands.json')]);
  const nodes = idx.data.nodes;
  const n = nodes.length;
  const kinds = Object.entries(idx.data.types).map(([id, t]) => ({ id, label: t.label, ink: t.color }));
  const kindAt = new Map(kinds.map((k, i) => [k.id, i]));
  const byId = new Map(nodes.map((v, i) => [v.id, i]));
  const w: World = {
    idx,
    w: pic.w,
    h: pic.h,
    coast: pic.coast,
    n,
    ids: nodes.map((v) => v.id),
    names: nodes.map((v) => v.name),
    kind: Uint8Array.from(nodes, (v) => kindAt.get(v.type) ?? 0),
    kinds,
    degree: Uint16Array.from(nodes, (v) => Math.min(65535, v.degree)),
    when: nodes.map((v) => v.when?.label ?? ''),
    x: Float32Array.from({ length: n }, (_, i) => pic.at[2 * i] ?? 0),
    y: Float32Array.from({ length: n }, (_, i) => pic.at[2 * i + 1] ?? 0),
    home: new Int16Array(n).fill(-1),
    sealed: new Uint8Array(n),
    links: idx.data.edges,
    la: Int32Array.from(idx.data.edges, (e) => byId.get(e.from) ?? 0),
    lb: Int32Array.from(idx.data.edges, (e) => byId.get(e.to) ?? 0),
    dashed: Uint8Array.from(idx.data.edges, (e) => Number(e.according_to.length > 0 || e.status === 'draft' || e.status === 'disputed')),
    quiet: new Uint8Array(idx.data.edges.length),
    adj: Array.from({ length: n }, () => []),
    isles: pic.stories.map((s) => ({ ...s, named: [], road: s.trail.filter((i) => Math.hypot((pic.at[2 * i] ?? 0) - s.x, (pic.at[2 * i + 1] ?? 0) - s.y) < s.r * 2.5) })),
    told: Array.from({ length: n }, (_, i) => pic.told[i] ?? []),
    bridges: pic.lines,
    byId,
    isleById: new Map(pic.stories.map((s, i) => [s.id, i])),
    linkById: new Map(idx.data.edges.map((e, i) => [e.id, i])),
    nameFrom: new Float32Array(n).fill(Infinity),
    grid: new Map(),
  };
  for (const i of pic.sealed) w.sealed[i] = 1;
  w.isles.forEach((s, si) => s.land.forEach((i) => (w.home[i] = si)));
  w.told.forEach((stories, i) => stories.forEach((s) => w.isles[s]?.named.push(i)));
  w.links.forEach((e, l) => {
    const [a, b] = [w.la[l], w.lb[l]];
    const withdrawn = e.status === 'deprecated';
    w.quiet[l] = Number(withdrawn || a === b || w.sealed[a] === 1 || w.sealed[b] === 1);
    if (withdrawn || a === b) return;
    w.adj[a].push(l);
    w.adj[b].push(l);
  });
  for (let i = 0; i < n; i++) {
    const key = cellOf(w.x[i], w.y[i]);
    const list = w.grid.get(key);
    if (list) list.push(i);
    else w.grid.set(key, [i]);
  }
  return w;
}

/** The dot nearest a point of the map, within `reach` units, or -1. */
export function dotNear(w: World, x: number, y: number, reach: number): number {
  let best = -1;
  let least = reach * reach;
  const s = Math.ceil(reach / CELL);
  const [gx, gy] = [Math.floor(x / CELL), Math.floor(y / CELL)];
  for (let cx = gx - s; cx <= gx + s; cx++) {
    for (let cy = gy - s; cy <= gy + s; cy++) {
      for (const i of w.grid.get(cx * 65536 + cy) ?? []) {
        const d = (w.x[i] - x) ** 2 + (w.y[i] - y) ** 2;
        if (d < least) [best, least] = [i, d];
      }
    }
  }
  return best;
}

/** The other end of a link. */
export const across = (w: World, l: number, i: number): number => (w.la[l] === i ? w.lb[l] : w.la[l]);

/**
 * Plans every dot's name once, for every nearness, as a printed map's are, so that names never jitter: from
 * the best-connected down, a name shows from the first level at which its box is clear of the names before
 * it. `wide` is a name's width in pixels. A sealed entry is named only when it is opened.
 */
export function planNames(w: World, wide: (i: number) => number): void {
  const order = Array.from({ length: w.n }, (_, i) => i)
    .filter((i) => !w.sealed[i])
    .sort((a, b) => w.degree[b] - w.degree[a] || w.names[a].length - w.names[b].length || a - b);
  const width = Float32Array.from({ length: w.n }, (_, i) => (w.sealed[i] ? 0 : wide(i)));
  const placed: number[] = [];
  for (let level = 1.6; level <= 6.6; level += 0.4) {
    const k = K0 * 2 ** level;
    const cell = 140 / k;
    const pad = level < 3 ? 12 : 3;
    const taken = new Map<number, number[][]>();
    const box = (i: number): number[] => [w.x[i] - pad / k, w.y[i] - (8 + pad) / k, w.x[i] + (width[i] + 10 + pad) / k, w.y[i] + (8 + pad) / k];
    const cells = function* (b: number[]): Generator<number> {
      for (let cx = Math.floor(b[0] / cell); cx <= Math.floor(b[2] / cell); cx++) for (let cy = Math.floor(b[1] / cell); cy <= Math.floor(b[3] / cell); cy++) yield cx * 65536 + cy;
    };
    const put = (b: number[]): void => {
      for (const c of cells(b)) {
        const list = taken.get(c);
        if (list) list.push(b);
        else taken.set(c, [b]);
      }
    };
    const hit = (b: number[]): boolean => {
      for (const c of cells(b)) for (const o of taken.get(c) ?? []) if (b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]) return true;
      return false;
    };
    for (const i of placed) put(box(i));
    // far out, a few names say where things are; nearer, every name that fits
    let budget = level < 1.9 ? 40 : Infinity;
    for (const i of order) {
      if (w.nameFrom[i] < Infinity || budget <= 0) continue;
      const b = box(i);
      if (hit(b)) continue;
      put(b);
      w.nameFrom[i] = level;
      placed.push(i);
      budget--;
    }
  }
}
