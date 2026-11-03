// The one picture beside the answers. A scene is dots, lines and perhaps the world under them; a new scene
// is one eased move from the last (a dot that stays glides straight to its new place, a new one grows where
// it will stand, a gone one fades), and each new line draws itself once. Then nothing runs: no loop, no
// drift. Out of view it does not draw. With reduced motion every scene is simply there, finished.
import { hash01 } from '../lib/hash';
import { drawField, moveField, type Mark, type View } from './field';

export interface Dot {
  id: string;
  name: string;
  ink: string;
  x: number;
  y: number;
  r: number;
  /** 0: no name until pointed at, 1: a name, 2: a name in large type. */
  label: number;
  alpha?: number;
  /** Where its name goes: 0 by itself, -1 left, 1 right, 2 above, 3 below. */
  side?: number;
}

export interface Line {
  a: string;
  b: string;
  alpha: number;
  width: number;
  /** Drawn in ink, as a link of the answer, not grey as one around it. */
  dark?: boolean;
  /** One side's account, or open data nobody here has read. */
  dash?: boolean;
  /** Milliseconds after the move starts that it begins to draw. */
  delay?: number;
}

export interface Scene {
  dots: Dot[];
  lines: Line[];
  /** The world under the dots: its view and its marks. */
  world?: { view: View; marks: Mark[] };
  /** A year, large in a corner. */
  clock?: string;
}

/** A scene for a picture of this size. */
export type Build = (w: number, h: number) => Scene;

interface Live extends Dot {
  from: { x: number; y: number; r: number; alpha: number };
  to: { x: number; y: number; r: number; alpha: number };
}

interface LiveLine extends Line {
  key: string;
  from: number;
  /** Its own alpha now; the move takes it to `alpha`. */
  now: number;
  /** How much of it is drawn, and when it starts. */
  drawn: number;
  start: number;
}

const MOVE_MS = 460;
const DRAW_MS = 340;
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
const ease = (t: number) => (t >= 1 ? 1 : 1 - (1 - t) ** 3);
export const phone = () => innerWidth <= 860;

export class Stage {
  private ink: CanvasRenderingContext2D;
  private dots = new Map<string, Live>();
  private lines = new Map<string, LiveLine>();
  private build: Build | null = null;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private t0 = 0;
  private raf = 0;
  private seen = true;
  private hot: string | null = null;
  private hover: string | null = null;
  private view: View | null = null;
  private tok = { ink: '#000', paper: '#fff', pale: '#8c8c8c' };

  constructor(
    private wrap: HTMLElement,
    private map: HTMLCanvasElement,
    private canvas: HTMLCanvasElement,
    private clock: HTMLElement,
    private pick: (id: string) => void,
  ) {
    this.ink = canvas.getContext('2d')!;
    this.colours();
    new ResizeObserver(() => this.resized()).observe(wrap);
    new IntersectionObserver(([e]) => {
      this.seen = e.isIntersecting;
      if (this.seen) this.kick();
    }).observe(wrap);
    canvas.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      const id = this.nearest(e, 15)?.id ?? null;
      if (id !== this.hover) {
        this.hover = id;
        canvas.style.cursor = id ? 'pointer' : '';
        this.kick();
      }
    });
    canvas.addEventListener('pointerleave', () => {
      if (this.hover) {
        this.hover = null;
        this.kick();
      }
    });
    canvas.addEventListener('click', (e) => {
      const d = this.nearest(e, e.pointerType === 'touch' ? 24 : 15);
      if (d) this.pick(d.id);
    });
  }

  /** Moves to a new scene. */
  set(build: Build): void {
    this.build = build;
    this.hot = null;
    this.apply(false);
  }

  /** Brings one dot forward (a stop scrolled to, a row pointed at); null puts it back. */
  hi(id: string | null): void {
    if (id !== this.hot) {
      this.hot = id;
      this.kick();
    }
  }

  private colours(): void {
    const css = getComputedStyle(this.wrap);
    const get = (k: string, or: string) => css.getPropertyValue(k).trim() || or;
    this.tok = { ink: get('--ink', '#000'), paper: get('--paper', '#fff'), pale: get('--ask-line', '#8c8c8c') };
  }

  private size(): boolean {
    const r = this.wrap.getBoundingClientRect();
    if (!r.width || !r.height) return false;
    const d = Math.min(2, devicePixelRatio || 1);
    if (r.width === this.w && r.height === this.h && d === this.dpr) return true;
    [this.w, this.h, this.dpr] = [r.width, r.height, d];
    this.canvas.width = Math.round(this.w * d);
    this.canvas.height = Math.round(this.h * d);
    return true;
  }

  private resized(): void {
    const [w, h] = [this.w, this.h];
    if (this.size() && (w !== this.w || h !== this.h)) this.apply(true);
  }

  /** Lays the scene out for this size and starts the move to it; `jump` lands at once. */
  private apply(jump: boolean): void {
    if (!this.build || !this.size()) return;
    const s = this.build(this.w, this.h);
    const now = performance.now();
    const still = jump || calm();
    this.t0 = now - (still ? MOVE_MS : 0);
    const wanted = new Set(s.dots.map((d) => d.id));
    for (const [id, d] of this.dots) {
      if (wanted.has(id)) continue;
      d.from = { x: d.x, y: d.y, r: d.r, alpha: d.alpha ?? 1 };
      d.to = { ...d.from, alpha: 0 };
      d.label = 0;
    }
    for (const t of s.dots) {
      const old = this.dots.get(t.id);
      const to = { x: t.x, y: t.y, r: t.r, alpha: t.alpha ?? 1 };
      const from = old ? { x: old.x, y: old.y, r: old.r, alpha: old.alpha ?? 1 } : { x: t.x, y: t.y, r: 0, alpha: 0 };
      this.dots.set(t.id, { ...t, ...(still ? to : from), from: still ? to : from, to });
    }
    const keep = new Set<string>();
    for (const l of s.lines) {
      const key = `${l.a}|${l.b}`;
      keep.add(key);
      const old = this.lines.get(key);
      const drawn = old || still ? 1 : 0;
      this.lines.set(key, { ...l, key, from: old?.now ?? l.alpha, now: old?.now ?? l.alpha, drawn, start: now + (l.delay ?? 0) });
    }
    for (const [key, l] of this.lines) {
      if (keep.has(key)) continue;
      if (still) this.lines.delete(key);
      else Object.assign(l, { from: l.now, alpha: 0 });
    }
    this.world(s.world, jump);
    this.clock.textContent = s.clock ?? '';
    this.kick();
  }

  /** The world under the dots: drawn when a scene first shows it, then moved. */
  private world(w: Scene['world'], jump: boolean): void {
    if (!w) {
      delete this.wrap.dataset.world;
      this.view = null;
      return;
    }
    if (this.view && !jump && !calm()) {
      drawField(this.map, this.view, w.marks);
      moveField(this.map, w.view, MOVE_MS * 2);
    } else drawField(this.map, w.view, w.marks);
    this.view = w.view;
    this.wrap.dataset.world = '';
  }

  private kick(): void {
    if (!this.raf && this.seen) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private frame(now: number): void {
    this.raf = 0;
    const p = ease(Math.min(1, (now - this.t0) / MOVE_MS));
    let busy = p < 1;
    for (const [id, d] of this.dots) {
      const lerp = (k: 'x' | 'y' | 'r' | 'alpha') => d.from[k] + (d.to[k] - d.from[k]) * p;
      [d.x, d.y, d.r, d.alpha] = [lerp('x'), lerp('y'), lerp('r'), lerp('alpha')];
      if (p >= 1 && d.to.alpha === 0) this.dots.delete(id);
    }
    for (const [key, l] of this.lines) {
      l.now = l.from + (l.alpha - l.from) * p;
      if (l.drawn < 1) {
        l.drawn = ease(Math.max(0, (now - l.start) / DRAW_MS));
        busy ||= l.drawn < 1;
      }
      if (p >= 1 && l.alpha === 0) this.lines.delete(key);
    }
    this.draw();
    if (busy) this.kick();
  }

  private draw(): void {
    const c = this.ink;
    const { ink, paper, pale } = this.tok;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.clearRect(0, 0, this.w, this.h);
    c.lineCap = 'round';
    for (const l of this.lines.values()) {
      const a = this.dots.get(l.a);
      const b = this.dots.get(l.b);
      if (!a || !b) continue;
      const lit = this.hot !== null && (l.a === this.hot || l.b === this.hot);
      const alpha = (lit ? Math.max(l.now, 0.85) : l.now) * Math.min(a.alpha ?? 1, b.alpha ?? 1);
      if (alpha < 0.01 || l.drawn <= 0) continue;
      c.globalAlpha = alpha;
      c.strokeStyle = l.dark || lit ? ink : pale;
      c.lineWidth = lit ? Math.max(l.width, 1.6) : l.width;
      c.setLineDash(l.dash ? [5, 5] : []);
      c.beginPath();
      c.moveTo(a.x, a.y);
      c.lineTo(a.x + (b.x - a.x) * l.drawn, a.y + (b.y - a.y) * l.drawn);
      c.stroke();
    }
    c.setLineDash([]);
    const list = [...this.dots.values()].sort((a, b) => a.r - b.r);
    for (const d of list) {
      if ((d.alpha ?? 1) < 0.01 || d.r < 0.2) continue;
      const r = d.id === this.hot || d.id === this.hover ? d.r * 1.35 + 1 : d.r;
      c.globalAlpha = d.alpha ?? 1;
      if (r > 3) {
        c.beginPath();
        c.arc(d.x, d.y, r + 1.6, 0, 7);
        c.fillStyle = paper;
        c.fill();
      }
      c.beginPath();
      c.arc(d.x, d.y, r, 0, 7);
      c.fillStyle = d.ink;
      c.fill();
    }
    this.names(list);
    c.globalAlpha = 1;
  }

  /** Names, the most wanted first, never on top of each other: a minor one that does not fit waits. */
  private names(list: Live[]): void {
    const c = this.ink;
    const rank = (d: Live) => (d.id === this.hover ? 9 : d.id === this.hot ? 8 : d.label) * 100 + d.r;
    const want = list.filter((d) => (d.alpha ?? 1) > 0.15 && (d.label > 0 || d.id === this.hot || d.id === this.hover)).sort((a, b) => rank(b) - rank(a));
    const taken: number[][] = [];
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    for (const d of want) {
      const strong = d.label >= 2 || d.id === this.hot;
      c.font = strong ? `700 ${phone() ? 14 : 16}px "Bricolage Grotesque", system-ui, sans-serif` : '500 12.5px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
      const most = phone() ? 24 : 32;
      const text = d.name.length > most ? `${d.name.slice(0, most - 2).trimEnd()}…` : d.name;
      const tw = c.measureText(text).width;
      const h = strong ? 18 : 15;
      let side = d.side === 2 || d.side === 3 ? 1 : d.side || (d.x > this.w * 0.6 ? -1 : 1);
      if (side > 0 && d.x + d.r + 6 + tw > this.w - 4 && d.x - d.r - 6 - tw > 4) side = -1;
      if (side < 0 && d.x - d.r - 6 - tw < 4 && d.x + d.r + 6 + tw < this.w - 4) side = 1;
      let x = side > 0 ? d.x + d.r + 6 : d.x - d.r - 6 - tw;
      let y = d.y;
      if (d.side === 2) [x, y] = [d.x - tw / 2, d.y - d.r - 11];
      if (d.side === 3) [x, y] = [d.x - tw / 2, d.y + d.r + 11];
      x = Math.max(4, Math.min(x, this.w - 4 - tw));
      const box = [x - 3, y - h / 2, x + tw + 3, y + h / 2];
      const hit = taken.some((b) => box[0] < b[2] && box[2] > b[0] && box[1] < b[3] && box[3] > b[1]);
      if (hit && d.label < 2 && d.id !== this.hot && d.id !== this.hover) continue;
      taken.push(box);
      c.globalAlpha = Math.min(1, (d.alpha ?? 1) * 1.2);
      c.lineWidth = 4;
      c.strokeStyle = this.tok.paper;
      c.strokeText(text, x, y);
      c.fillStyle = this.tok.ink;
      c.fillText(text, x, y);
    }
  }

  private nearest(e: MouseEvent, reach: number): Live | null {
    const r = this.canvas.getBoundingClientRect();
    const [x, y] = [e.clientX - r.left, e.clientY - r.top];
    let best: Live | null = null;
    let bd = reach * reach;
    for (const d of this.dots.values()) {
      if ((d.alpha ?? 1) < 0.25) continue;
      const dd = (d.x - x) ** 2 + (d.y - y) ** 2;
      if (dd < bd) [bd, best] = [dd, d];
    }
    return best;
  }
}

/** A point of a layout, in its own units until `fit` maps it to the picture. */
export interface Point {
  id: string;
  x?: number;
  y?: number;
  /** Stays where it is put: the middle of a web. */
  pin?: boolean;
}

/** [a, b, strength, length] by index into the points. */
export type Spring = [number, number, number, number];

/** Dots push apart and links pull together, the same way every time: seeds come from the ids. */
export function relax(P: Point[], springs: Spring[], rounds = 150): void {
  const n = P.length;
  P.forEach((p, i) => {
    if (p.pin || p.x !== undefined) return;
    const a = i * 2.39996 + hash01(p.id);
    const r = 0.1 + 0.9 * Math.sqrt(i / n);
    [p.x, p.y] = [Math.cos(a) * r, Math.sin(a) * r];
  });
  const at = P as Required<Point>[];
  for (let it = 0; it < rounds; it++) {
    const cap = 0.09 * (1 - it / rounds) + 0.004;
    const fx = new Float64Array(n);
    const fy = new Float64Array(n);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = at[i].x - at[j].x;
        const dy = at[i].y - at[j].y;
        const f = 0.0042 / Math.max(0.0009, dx * dx + dy * dy);
        fx[i] += dx * f;
        fy[i] += dy * f;
        fx[j] -= dx * f;
        fy[j] -= dy * f;
      }
    }
    for (const [a, b, w, len] of springs) {
      const dx = at[b].x - at[a].x;
      const dy = at[b].y - at[a].y;
      const d = Math.hypot(dx, dy) || 0.001;
      const f = (d - len) * 0.22 * w;
      fx[a] += (dx / d) * f;
      fy[a] += (dy / d) * f;
      fx[b] -= (dx / d) * f;
      fy[b] -= (dy / d) * f;
    }
    for (let i = 0; i < n; i++) {
      if (at[i].pin) continue;
      let vx = fx[i] - at[i].x * 0.03;
      let vy = fy[i] - at[i].y * 0.03;
      const v = Math.hypot(vx, vy);
      if (v > cap) [vx, vy] = [(vx * cap) / v, (vy * cap) / v];
      at[i].x += vx;
      at[i].y += vy;
    }
  }
}

/** Maps a layout into a picture of w by h, `pad` from its edges, stretched at most half again one way. */
export function fit(P: Point[], w: number, h: number, pad: number, most = 420): (p: Point) => [number, number] {
  let [x0, x1, y0, y1] = [Infinity, -Infinity, Infinity, -Infinity];
  for (const p of P) {
    [x0, x1, y0, y1] = [Math.min(x0, p.x!), Math.max(x1, p.x!), Math.min(y0, p.y!), Math.max(y1, p.y!)];
  }
  const sx = (w - pad * 2) / Math.max(0.001, x1 - x0);
  const sy = (h - pad * 2) / Math.max(0.001, y1 - y0);
  const lo = Math.min(sx, sy, most);
  const [kx, ky] = [Math.min(sx, most, lo * 1.5), Math.min(sy, most, lo * 1.5)];
  const [cx, cy] = [(x0 + x1) / 2, (y0 + y1) / 2];
  return (p) => [(p.x! - cx) * kx + w / 2, (p.y! - cy) * ky + h / 2];
}

/** A dot's size from how many links it has. */
export const radius = (degree: number) => Math.max(3.2, Math.min(11, 2.8 + Math.sqrt(degree) * 1.05));
