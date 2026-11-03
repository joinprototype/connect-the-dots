// What the picture beside the words shows (lib/dotfield.ts): a story's opening and each of its scenes, a
// name the reader opened, and the way between two names. Scenes on the Earth stand where the story's
// camera stood; the others draw the story's names as a small web of their own, laid out once per story.
import { fit, project, zoomScale, type Line, type Mark, type Scene, type View } from '../lib/dotfield';
import type { GraphIndex } from '../lib/data';
import type { GEdge, GNode, SourceDef } from '../lib/types';

/** One scene's picture, as read.rs writes it. */
export interface ScenePic {
  v: 'map' | 'graph';
  /** The camera: [lon, lat, web map zoom]. */
  c?: [number, number, number];
  p?: string[];
  w?: [string, string][];
  f?: string;
  r?: string[];
  x?: string[];
  t?: string;
}

/** A story's own data, in its page (`script.read-data`). */
export interface StoryData {
  id: string;
  title: string;
  scenes: ScenePic[];
  /** Where entries stand on the Earth, for those whose coordinates are their own. */
  at: Record<string, [number, number]>;
  data: { nodes: GNode[]; edges: GEdge[]; sources: Record<string, SourceDef> };
}

/** The closest a story's map comes: past it the dots would be few and far apart. */
const NEAREST = 7.6;
/** How far a phone draws out from the camera the story's maps chose, in web map zoom. */
const PHONE_OUT = 0.45;
/** Entries a story's web lays out, first seen first. */
const WEB_MOST = 140;
const GOLDEN = 2.39996;

export const phone = (): boolean => innerWidth <= 900;

/** The camera on the Earth at a web map zoom, a little further out on a phone. */
function earthView(lon: number, lat: number, z: number): (size: [number, number]) => View {
  const [x, y] = project(lon, lat);
  return () => ({ x, y, scale: zoomScale(z - (phone() ? PHONE_OUT : 0)) });
}

/** Whether a point is inside a view of this size, short of its edge. */
function inView(x: number, y: number, v: View, [w, h]: [number, number]): boolean {
  return Math.abs(x - v.x) * v.scale < w * 0.48 && Math.abs(y - v.y) * v.scale < h * 0.48;
}

/** The world as the opening move starts from it. */
export function wide(): Scene {
  return { key: 'wide', world: 'earth', view: ([w]) => ({ x: 0.5, y: 0.4, scale: Math.min(w * 1.5, zoomScale(1)) }), marks: [] };
}

/** One story's pictures. */
export class StoryPictures {
  readonly nodes: Map<string, GNode>;
  /** A story's links by the id its scenes name them by: "<entity>#<claim>" holds its "/<n>" targets. */
  readonly claims = new Map<string, GEdge[]>();
  private web?: Map<string, { x: number; y: number }>;

  constructor(
    readonly d: StoryData,
    private readonly ink: (type: string) => string,
  ) {
    this.nodes = new Map(d.data.nodes.map((n) => [n.id, n]));
    for (const e of d.data.edges) {
      const ref = e.id.split('/')[0];
      this.claims.set(ref, [...(this.claims.get(ref) ?? []), e]);
    }
  }

  private mark(id: string, x: number, y: number, more: Partial<Mark> = {}): Mark | null {
    const n = this.nodes.get(id);
    return n ? { id, name: n.name, x, y, ink: this.ink(n.type), ...more } : null;
  }

  private onEarth(id: string, more: Partial<Mark> = {}): Mark | null {
    const at = this.d.at[id];
    if (!at) return null;
    const [x, y] = project(at[0], at[1]);
    return this.mark(id, x, y, more);
  }

  /** The cover: the story's first places, far out; or its whole web, when it never visits the Earth. */
  cover(): Scene {
    const key = `c:${this.d.id}`;
    const first = this.d.scenes.find((s) => s.v === 'map' && s.c);
    if (first?.c) {
      const z = Math.max(2.6, Math.min(first.c[2] - 8, 3.4));
      const marks = (first.p ?? []).map((id) => this.onEarth(id, { label: 'strong', rank: 10, r: 9 })).filter((m): m is Mark => !!m);
      return { key, world: 'earth', view: earthView(first.c[0], first.c[1], z), marks };
    }
    const web = this.layout();
    const marks = [...web].map(([id, p]) => this.mark(id, p.x, p.y, { r: 4 })).filter((m): m is Mark => !!m);
    return { key, world: `g:${this.d.id}`, view: (size) => fit([...web.values()], size, 0.74), marks };
  }

  scene(i: number, size: [number, number]): Scene {
    const sc = this.d.scenes[i];
    const key = `s:${this.d.id}:${i}`;
    const hot = new Set([...(sc.r ?? []), ...(sc.p ?? []), ...(sc.f ? [sc.f] : [])]);
    if (sc.v === 'map' && sc.c) {
      const z = Math.min(sc.c[2], NEAREST);
      const view = earthView(sc.c[0], sc.c[1], z);
      const target = view(size);
      const marks: Mark[] = [];
      const seen = new Set<string>();
      // one dot to a spot: an event and the town it happened in are one place at this distance
      const spots = new Set<string>();
      for (const id of new Set([...(sc.p ?? []), ...hot])) {
        const at = this.d.at[id];
        const m = this.onEarth(id, { label: (sc.p ?? []).includes(id) ? 'strong' : 'plain', rank: 10 });
        if (!at || !m || seen.has(id)) continue;
        const spot = `${at[0].toFixed(1)},${at[1].toFixed(1)}`;
        if (spots.has(spot) || !inView(m.x, m.y, target, size)) continue;
        spots.add(spot);
        seen.add(id);
        marks.push(m);
      }
      const lines: Line[] = [];
      for (const way of sc.w ?? []) {
        for (let j = 0; j + 1 < way.length; j++) {
          const [a, b] = [way[j], way[j + 1]];
          for (const id of [a, b]) {
            const m = !seen.has(id) && this.onEarth(id, { label: 'strong', rank: 10 });
            if (m) {
              seen.add(id);
              marks.push(m);
            }
          }
          if (seen.has(a) && seen.has(b)) lines.push({ a, b, strong: true });
        }
      }
      return { key, world: 'earth', view, marks, lines, places: phone() ? 6 : 12 };
    }
    // the web: everything named so far, this scene's own names bright and named
    const web = this.layout();
    const earlier = new Set<string>();
    for (const s of this.d.scenes.slice(0, i + 1)) [...(s.r ?? []), ...(s.f ? [s.f] : [])].forEach((id) => earlier.add(id));
    const marks: Mark[] = [];
    const bright: { x: number; y: number }[] = [];
    for (const id of earlier) {
      const p = web.get(id);
      if (!p) continue;
      const on = hot.has(id);
      const m = this.mark(id, p.x, p.y, {
        label: id === sc.f || (!sc.f && on) ? 'strong' : on ? 'plain' : undefined,
        rank: id === sc.f ? 20 : on ? 10 : 0,
        dim: !on,
        r: id === sc.f ? 10 : on ? 7 : 3.5,
      });
      if (!m) continue;
      if (on) bright.push(p);
      marks.push(m);
    }
    const have = new Set(marks.map((m) => m.id));
    const lines: Line[] = [];
    const drawn = new Set<string>();
    const join = (ref: string, strong: boolean) => {
      for (const e of this.claims.get(ref) ?? []) {
        const pair = [e.from, e.to].sort().join('\n');
        if (e.from === e.to || !have.has(e.from) || !have.has(e.to) || drawn.has(pair)) continue;
        drawn.add(pair);
        lines.push({ a: e.from, b: e.to, strong, faint: !strong });
      }
    };
    (sc.x ?? []).forEach((ref) => join(ref, true));
    this.d.scenes.slice(0, i).forEach((s) => (s.x ?? []).forEach((ref) => join(ref, false)));
    return { key, world: `g:${this.d.id}`, view: (sz) => fit(bright, sz), marks, lines };
  }

  /** Where each of the story's names sits in its web: a seed head, then a few hundred rounds of
   *  pushing apart and pulling along the links the scenes reveal. The same story always gives the same
   *  web, and it is worked out once, the first time it is needed. */
  private layout(): Map<string, { x: number; y: number }> {
    if (this.web) return this.web;
    const ids: string[] = [];
    const add = (id: string) => this.nodes.has(id) && !ids.includes(id) && ids.push(id);
    for (const s of this.d.scenes) {
      if (s.f) add(s.f);
      (s.r ?? []).forEach(add);
    }
    const n = Math.min(ids.length, WEB_MOST);
    const P = ids.slice(0, n).map((id, i) => ({ id, x: Math.cos(i * GOLDEN) * 0.12 * Math.sqrt(i + 1), y: Math.sin(i * GOLDEN) * 0.12 * Math.sqrt(i + 1), vx: 0, vy: 0 }));
    const at = new Map(P.map((p, i) => [p.id, i]));
    const springs: [number, number, number][] = [];
    const pairs = new Set<string>();
    for (const s of this.d.scenes) {
      for (const ref of s.x ?? []) {
        for (const e of this.claims.get(ref) ?? []) {
          const [a, b] = [at.get(e.from), at.get(e.to)];
          if (a == null || b == null || a === b || pairs.has(`${Math.min(a, b)}:${Math.max(a, b)}`)) continue;
          pairs.add(`${Math.min(a, b)}:${Math.max(a, b)}`);
          springs.push([a, b, 0.2]);
        }
      }
      const f = s.f != null ? at.get(s.f) : undefined;
      if (f != null) for (const id of s.r ?? []) if (at.has(id) && id !== s.f) springs.push([f, at.get(id)!, 0.32]);
    }
    const ROUNDS = 280;
    for (let it = 0; it < ROUNDS; it++) {
      const k = 0.012 * (1 - it / ROUNDS) + 0.002;
      for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
          const [a, b] = [P[i], P[j]];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const d2 = dx * dx + dy * dy + 1e-4;
          if (d2 > 1.6) continue;
          const f = (k * 0.75) / d2;
          a.vx += dx * f;
          a.vy += dy * f;
          b.vx -= dx * f;
          b.vy -= dy * f;
        }
      }
      for (const [i, j, len] of springs) {
        const [p, q] = [P[i], P[j]];
        const dx = q.x - p.x;
        const dy = q.y - p.y;
        const d = Math.hypot(dx, dy) + 1e-6;
        const f = (d - len) * 0.06;
        p.vx += (dx / d) * f;
        p.vy += (dy / d) * f;
        q.vx -= (dx / d) * f;
        q.vy -= (dy / d) * f;
      }
      for (const p of P) {
        p.vx -= p.x * 0.012;
        p.vy -= p.y * 0.012;
        p.x += p.vx * 0.5;
        p.y += p.vy * 0.5;
        p.vx *= 0.6;
        p.vy *= 0.6;
      }
    }
    this.web = new Map(P.map((p) => [p.id, { x: p.x, y: p.y }]));
    return this.web;
  }
}

/** Coordinates of an entry's own, not its place's (graph-slim gives an entry its place's when it has none). */
export function ownCoords(idx: GraphIndex, n: GNode): [number, number] | null {
  if (!n.coords) return null;
  const place = n.place ? idx.nodes.get(n.place) : undefined;
  return place?.coords === n.coords ? null : n.coords;
}

/** A name the reader opened, with what it links to: on the Earth around it when it has a place of its
 *  own, else as a small web of its own. `before`: where the reader came from, joined to it by a line. */
export function entryScene(idx: GraphIndex, id: string, others: GNode[], before: string | null, ink: (t: string) => string): Scene {
  const n = idx.nodes.get(id)!;
  const key = `e:${id}:${before ?? ''}`;
  const here = ownCoords(idx, n);
  const mk = (o: GNode, x: number, y: number, more: Partial<Mark>): Mark => ({ id: o.id, name: o.name, x, y, ink: ink(o.type), ...more });
  if (here) {
    const [hx, hy] = project(here[0], here[1]);
    const marks: Mark[] = [mk(n, hx, hy, { label: 'strong', rank: 30, r: 10 })];
    const lines: Line[] = [];
    const near: { x: number; y: number; d: number }[] = [];
    for (const o of before ? [idx.nodes.get(before)!, ...others] : others) {
      const c = o && o.id !== id && !marks.some((m) => m.id === o.id) ? ownCoords(idx, o) : null;
      if (!c || marks.length > 24) continue;
      const [x, y] = project(c[0], c[1]);
      marks.push(mk(o, x, y, { label: 'plain', rank: o.id === before ? 12 : 8 }));
      near.push({ x, y, d: Math.hypot(x - hx, y - hy) });
    }
    if (before && marks.some((m) => m.id === before)) lines.push({ a: before, b: id, strong: true });
    // as close as the six nearest of what it links to allow, between a country's view and a town's
    near.sort((a, b) => a.d - b.d);
    const six = near.slice(0, 6);
    const view = ([w, h]: [number, number]): View => {
      const dx = Math.max(1e-9, ...six.map((p) => Math.abs(p.x - hx)));
      const dy = Math.max(1e-9, ...six.map((p) => Math.abs(p.y - hy)));
      const scale = six.length ? Math.min((w * 0.4) / dx, (h * 0.4) / dy) : zoomScale(6);
      return { x: hx, y: hy, scale: Math.max(zoomScale(3), Math.min(scale, zoomScale(8.2 - (phone() ? PHONE_OUT : 0)))) };
    };
    return { key, world: 'earth', view, marks, lines, places: phone() ? 5 : 10 };
  }
  // no place on the Earth: it, and what it links to round it
  const marks: Mark[] = [mk(n, 0, 0, { label: 'strong', rank: 30, r: 11 })];
  const lines: Line[] = [];
  const list = before && before !== id ? [idx.nodes.get(before)!, ...others.filter((o) => o.id !== before)] : others;
  const N = Math.min(list.length, 44);
  list.slice(0, N).forEach((o, i) => {
    const a = i * GOLDEN + 0.7;
    const r = (N < 6 ? 0.62 : 0.36) + (N < 6 ? 0.2 : 0.64) * Math.sqrt(i / Math.max(1, N - 1));
    marks.push(mk(o, Math.cos(a) * r, Math.sin(a) * r, { label: i < 8 ? 'plain' : undefined, rank: 8 - i * 0.1, r: i < 8 ? 6.5 : 4.5 }));
    lines.push({ a: id, b: o.id, strong: o.id === before, faint: o.id !== before });
  });
  return { key, world: `n:${id}`, view: ([w, h]) => ({ x: 0, y: 0, scale: Math.min(w, h) * 0.42 }), marks, lines };
}

/** The way between two names: its stops on an arc, each named, first and last bright. */
export function wayScene(idx: GraphIndex, stops: string[], ink: (t: string) => string): Scene {
  const key = `w:${stops.join(',')}`;
  const flat = stops.length <= 4;
  const marks: Mark[] = stops.map((id, i) => {
    const n = idx.nodes.get(id)!;
    const t = stops.length > 1 ? i / (stops.length - 1) : 0;
    const a = Math.PI * (flat ? 0.75 - 0.5 * t : 0.92 - 1.84 * t);
    const end = i === 0 || i === stops.length - 1;
    return { id, name: n.name, ink: ink(n.type), x: Math.cos(a), y: -Math.sin(a) * (flat ? 0.6 : 0.85), label: end ? 'strong' : 'plain', over: true, rank: end ? 20 : 10 - i * 0.1, r: 8 };
  });
  const lines: Line[] = stops.slice(1).map((id, i) => ({ a: stops[i], b: id, strong: true }));
  return { key, world: key, view: (size) => fit(marks, size, 0.58), marks, lines };
}
