// The dot field: the world as hundreds of thousands of grey dots, darker where things are dense, with a
// few named, coloured dots on top and one eased move between views. Read draws it behind a story, and any
// page may reuse it. Its data, data/field.bin and data/field.json (docs/data-contract.md), loads once per
// page, when the first field is made: make it after the page's words have painted.
//
//   const field = new DotField(host, { onPick, fade })
//       adds a canvas (.dotfield-dots) and an SVG (.dotfield-marks) to `host`. The page's CSS sizes and
//       places the two, one exactly over the other; the canvas draws in its CSS `color`.
//   field.show(scene, ms?)
//       draws a scene. In the same world it moves there in one straight eased move (`ms`, MOVE by
//       default; 0, or reduced motion, goes at once); into another world it cuts, the marks fading.
//   field.light(id | null)   marks one dot as the one a pointer is on elsewhere (a row in a list)
//   field.size               [width, height] of the canvas, in CSS px
//   field.destroy()
//   loadField()              the dots and the named places, fetched once per page
//   project(lon, lat), zoomScale(zoom), fit(points, size, pad)   views on the Earth and on a plane
//
// A scene is { key, world, view, marks, lines?, places? }. A scene with the same key as the one shown
// changes nothing. The world 'earth' is the web map's square (`project`), drawn with the dots, and its
// view is { x, y, scale } with `scale` = zoomScale(z) for a web map zoom z; any other world is a plane
// of the caller's own (a story's web of names), with no dots. `view` may be a function of the size, for
// a view that fits. `places`: on the Earth, name up to that many written places in view, quietly.
//
// What it looks like: dots, lines and names in the canvas's colour, each name with the page showing
// through around it, a halo; marks in their own ink, ringed in the page's colour. Nothing else. Nothing
// runs at rest: a frame is drawn when the scene, the size or the data changes, and on each frame of a
// move, and none while the canvas is out of view.
//
// Its look is dotfield.css, which each page's own style sheet @imports: imported here, two pages would
// share it as a file of its own that no page links.
import { loadJson } from './data';

/** Where the camera looks: a point on the plane, and CSS pixels per unit of the plane. */
export interface View {
  x: number;
  y: number;
  scale: number;
}

/** A named, coloured dot. */
export interface Mark {
  id: string;
  name: string;
  /** Its place on the plane: `project(lon, lat)` on the Earth. */
  x: number;
  y: number;
  /** A CSS colour: its kind's ink. */
  ink: string;
  /** Radius in CSS px (5 by default). */
  r?: number;
  /** Its name is shown, in this weight: `strong` for what the scene is about, `quiet` for a place
   *  named only to say where things are. Without it, the name shows only on hover. */
  label?: 'strong' | 'plain' | 'quiet';
  /** Names are placed highest rank first, and a name with no room is left out. */
  rank?: number;
  /** Open data, which nobody here has read: a grey, dashed ring. */
  open?: boolean;
  /** Seen before, not what the scene is about. */
  dim?: boolean;
  /** Its name goes above or below it first, for marks in a row. */
  over?: boolean;
}

/** A line between two marks, by id. */
export interface Line {
  a: string;
  b: string;
  /** The scene's own line, drawn thicker; `faint`, one from before. */
  strong?: boolean;
  faint?: boolean;
  /** Open data, unread. */
  dashed?: boolean;
}

export interface Scene {
  key: string;
  /** 'earth', or the name of a plane of the caller's own. */
  world: string;
  view: View | ((size: [number, number]) => View);
  marks: Mark[];
  lines?: Line[];
  places?: number;
}

/** `[id, name, lon, lat, rank]`: a written place, best connected first. */
type Place = [string, string, number, number, number];

export interface Field {
  xs: Float32Array;
  ys: Float32Array;
  /** Where each cell of a GRID x GRID cut of the square starts in xs and ys, and where the last ends. */
  cells: Uint32Array;
  places: Place[];
  /** The places' ink. */
  ink: string;
}

const BIN_URL = '/data/field.bin';
const META_URL = '/data/field.json';
/** The square is cut into GRID x GRID cells, so that a frame reads only the dots in view: the file's
 *  order (a Z curve) keeps each cell's dots together. */
const GRID = 64;
/** A move's length, in milliseconds. */
export const MOVE = 1100;
/** How dark a dot draws, out of 1. */
const STRENGTH = 0.78;
/** How long a cut's marks take to fade out, in milliseconds. */
const CUT = 170;

const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A point on the web map's square, 0 to 1 each way (Web Mercator, as field.bin and the story maps). */
export function project(lon: number, lat: number): [number, number] {
  const s = Math.sin((Math.max(-85, Math.min(85, lat)) * Math.PI) / 180);
  return [(lon + 180) / 360, 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)];
}

/** CSS pixels across the whole square at a web map zoom, as MapLibre counts them. */
export const zoomScale = (zoom: number): number => 512 * 2 ** zoom;

/** The view that holds these points, with `pad` of the room around them; a box smaller than `least`
 *  units each way is taken as that, and the view never comes closer than `most` px per unit. */
export function fit(points: { x: number; y: number }[], [w, h]: [number, number], pad = 0.66, least = 0.3, most = Math.min(w, h) * 1.5): View {
  if (!points.length) return { x: 0, y: 0, scale: Math.min(w, h) * 0.4 };
  const xs = points.map((p) => p.x);
  const ys = points.map((p) => p.y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, scale: Math.min((w * pad) / Math.max(least, x1 - x0), (h * pad) / Math.max(least, y1 - y0), most) };
}

/** Every other bit of a Z-curve code, back as one number. */
function gather(code: number): number {
  let v = code & 0x55555555;
  v = (v | (v >>> 1)) & 0x33333333;
  v = (v | (v >>> 2)) & 0x0f0f0f0f;
  v = (v | (v >>> 4)) & 0x00ff00ff;
  return (v | (v >>> 8)) & 0xffff;
}

/** A cell's place in `cells`: its column's and row's bits interleaved, as the top of a dot's code. */
const CELL = Array.from({ length: GRID }, (_, i) => [0, 1, 2, 3, 4, 5].reduce((v, b) => v | (((i >> b) & 1) << (2 * b)), 0));

/** A small hash of a dot's number, for where it sits inside its 65,536th. */
function scatter(i: number): number {
  let h = Math.imul(i ^ (i >>> 15), 0x2c1b3c6d);
  h ^= h >>> 12;
  h = Math.imul(h, 0x297a2d39);
  return (h ^ (h >>> 15)) >>> 0;
}

/** Dots decoded before the page gets a turn: a slow phone takes about 30 ms for these. */
const SLICE = 40000;

/** field.bin: each dot's step along the Z curve from the one before, as a varint (LEB128). Decoded a
 *  slice at a time, so that no task is long enough to hold up a tap or a scroll. */
async function decode(bytes: Uint8Array, n: number): Promise<Pick<Field, 'xs' | 'ys' | 'cells'>> {
  const xs = new Float32Array(n);
  const ys = new Float32Array(n);
  const cells = new Uint32Array(GRID * GRID + 1);
  let code = 0;
  let step = 0;
  let shift = 1;
  let i = 0;
  for (let k = 0; k < bytes.length && i < n; k++) {
    const b = bytes[k];
    step += (b & 0x7f) * shift;
    shift *= 128;
    if (b >= 0x80) continue;
    code += step;
    step = 0;
    shift = 1;
    // spread inside its 65,536th, so that no grid shows close up
    const h = scatter(i);
    xs[i] = (gather(code) + (h >>> 16) / 65536) / 65536;
    ys[i] = (gather(code >>> 1) + (h & 0xffff) / 65536) / 65536;
    cells[(code >>> 20) + 1]++;
    if (++i % SLICE === 0) await new Promise((r) => setTimeout(r));
  }
  for (let c = 0; c < GRID * GRID; c++) cells[c + 1] += cells[c];
  return { xs: xs.subarray(0, i), ys: ys.subarray(0, i), cells };
}

let loading: Promise<Field> | undefined;

/** The dots and the named places, fetched once per page; a failure is not kept. */
export function loadField(): Promise<Field> {
  loading ??= (async () => {
    const [meta, buf] = await Promise.all([
      loadJson<{ dots: number; ink: string | null; places: Place[] }>(META_URL),
      fetch(BIN_URL, { credentials: 'same-origin' }).then((r) => {
        if (!r.ok) throw new Error(`connect-the-dot: ${BIN_URL} returned ${r.status}`);
        return r.arrayBuffer();
      }),
    ]);
    return { ...(await decode(new Uint8Array(buf), meta.dots)), places: meta.places, ink: meta.ink ?? 'currentColor' };
  })();
  loading.catch(() => (loading = undefined));
  return loading;
}

/** A name where it was placed: its offset from its mark, and what it takes to draw it. */
interface Name {
  dx: number;
  dy: number;
  align: CanvasTextAlign;
  font: string;
  alpha: number;
  /** The halo: the box around the name, from the mark, in CSS px. */
  box: [number, number, number, number];
}

interface Drawn {
  mark: Mark;
  g: SVGGElement;
  name?: Name;
}

const NS = 'http://www.w3.org/2000/svg';
function svg<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
  const e = document.createElementNS(NS, tag);
  for (const k in attrs) e.setAttribute(k, String(attrs[k]));
  return e;
}

/** The ease of every move: slow out, slow in. */
const ease = (u: number): number => (u < 0.5 ? 4 * u * u * u : 1 - (-2 * u + 2) ** 3 / 2);

export class DotField {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private readonly svg: SVGSVGElement;
  private readonly onPick?: (m: Mark) => void;
  /** Dots fade in over this many CSS px from the canvas's left edge, where it meets words. */
  private readonly fade: number;
  private w = 0;
  private h = 0;
  private dpr = 1;
  private img?: ImageData;
  private cam: View = { x: 0.5, y: 0.4, scale: 1024 };
  private move: { from: View; to: View; t0: number; ms: number } | null = null;
  private scene: Scene | null = null;
  private drawn: Drawn[] = [];
  private lines: [Drawn, Drawn, Line][] = [];
  private field: Field | null = null;
  private raf = 0;
  private cutting = 0;
  private seen = true;
  private lit: SVGGElement | null = null;
  /** The canvas's CSS colour, read when a scene is built. */
  private color = 'rgb(0, 0, 0)';
  private readonly watch: ResizeObserver;
  private readonly view: IntersectionObserver;

  constructor(host: HTMLElement, opts: { onPick?: (m: Mark) => void; fade?: number } = {}) {
    this.onPick = opts.onPick;
    this.fade = opts.fade ?? 0;
    this.canvas = document.createElement('canvas');
    this.canvas.className = 'dotfield-dots';
    this.ctx = this.canvas.getContext('2d')!;
    this.svg = svg('svg', { class: 'dotfield-marks', 'aria-hidden': 'true' });
    host.append(this.canvas, this.svg);
    this.svg.addEventListener('click', (ev) => {
      const g = (ev.target as Element).closest('g[data-n]');
      const d = g && this.drawn[Number(g.getAttribute('data-n'))];
      if (d && this.onPick) this.onPick(d.mark);
    });
    this.resize();
    this.watch = new ResizeObserver(() => this.resize());
    this.watch.observe(this.canvas);
    this.view = new IntersectionObserver(([e]) => {
      this.seen = e.isIntersecting;
      if (this.seen) this.kick();
    });
    this.view.observe(this.canvas);
    void loadField().then((f) => {
      this.field = f;
      // the places in view can be named now
      if (this.scene?.places) this.build(this.scene, this.move?.to ?? this.cam);
      this.kick();
    });
    // names are measured in their own face once it has come
    void document.fonts?.ready.then(() => {
      if (this.scene) this.build(this.scene, this.move?.to ?? this.cam);
      this.kick();
    });
  }

  get size(): [number, number] {
    return [this.w, this.h];
  }

  show(scene: Scene, ms = MOVE): void {
    if (scene.key === this.scene?.key) return;
    const before = this.scene;
    this.scene = scene;
    clearTimeout(this.cutting);
    this.canvas.classList.remove('dotfield-cut');
    this.svg.classList.remove('dotfield-cut');
    const target = this.viewOf(scene);
    if (before && before.world === scene.world) {
      this.build(scene, target);
      this.moveTo(target, ms);
      return;
    }
    const cut = (): void => {
      this.move = null;
      this.cam = target;
      this.build(scene, target);
      this.canvas.classList.remove('dotfield-cut');
      this.svg.classList.remove('dotfield-cut');
      this.kick();
    };
    if (!before || calm()) return cut();
    this.canvas.classList.add('dotfield-cut');
    this.svg.classList.add('dotfield-cut');
    this.cutting = window.setTimeout(cut, CUT);
  }

  light(id: string | null): void {
    this.lit?.classList.remove('lit');
    const d = id == null ? undefined : this.drawn.find((x) => x.mark.id === id);
    this.lit = d?.g ?? null;
    this.lit?.classList.add('lit');
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
    clearTimeout(this.cutting);
    this.watch.disconnect();
    this.view.disconnect();
    this.canvas.remove();
    this.svg.remove();
  }

  private viewOf(scene: Scene): View {
    return typeof scene.view === 'function' ? scene.view([this.w || 1, this.h || 1]) : scene.view;
  }

  private moveTo(to: View, ms: number): void {
    if (ms <= 0 || calm()) {
      this.move = null;
      this.cam = to;
    } else {
      this.move = { from: { ...this.cam }, to, t0: performance.now(), ms };
    }
    this.kick();
  }

  private resize(): void {
    const r = this.canvas.getBoundingClientRect();
    this.w = Math.max(1, r.width);
    this.h = Math.max(1, r.height);
    this.dpr = Math.min(devicePixelRatio || 1, 2);
    this.canvas.width = Math.round(this.w * this.dpr);
    this.canvas.height = Math.round(this.h * this.dpr);
    this.img = this.ctx.createImageData(this.canvas.width, this.canvas.height);
    this.svg.setAttribute('viewBox', `0 0 ${this.w} ${this.h}`);
    if (this.scene) {
      // a view that fits is fitted again; names find room again
      const target = this.viewOf(this.scene);
      if (this.move) this.move.to = target;
      else this.cam = target;
      this.build(this.scene, target);
    }
    this.kick();
  }

  private kick(): void {
    if (!this.raf) this.raf = requestAnimationFrame((t) => this.frame(t));
  }

  private frame(t: number): void {
    this.raf = 0;
    const m = this.move;
    if (m) {
      const u = Math.min(1, (t - m.t0) / m.ms);
      const e = ease(u);
      const ls = Math.log2(m.from.scale) + (Math.log2(m.to.scale) - Math.log2(m.from.scale)) * e;
      this.cam = { x: m.from.x + (m.to.x - m.from.x) * e, y: m.from.y + (m.to.y - m.from.y) * e, scale: 2 ** ls };
      if (u >= 1 || !this.seen) {
        this.cam = m.to;
        this.move = null;
      }
    }
    if (!this.seen || !this.img) return;
    this.paint();
    this.place();
    if (this.move) this.kick();
  }

  private toScreen(x: number, y: number): [number, number] {
    return [(x - this.cam.x) * this.cam.scale + this.w / 2, (y - this.cam.y) * this.cam.scale + this.h / 2];
  }

  /** The dots, then the lines, then each name in its halo. */
  private paint(): void {
    const { ctx, img, color } = this;
    if (!img) return;
    const [r, g, b] = (color.match(/\d+(\.\d+)?/g) ?? ['0', '0', '0']).map(Number);
    const px = new Uint32Array(img.data.buffer);
    // the canvas's colour, fully clear; each dot adds to a pixel's alpha
    px.fill(((b & 255) << 16) | ((g & 255) << 8) | (r & 255));
    if (this.scene?.world === 'earth' && this.field) this.plot(img.data);
    ctx.putImageData(img, 0, 0);
    ctx.save();
    ctx.scale(this.dpr, this.dpr);
    ctx.strokeStyle = ctx.fillStyle = color;
    for (const [a, b2, line] of this.lines) {
      const [x1, y1] = this.toScreen(a.mark.x, a.mark.y);
      const [x2, y2] = this.toScreen(b2.mark.x, b2.mark.y);
      ctx.globalAlpha = line.strong ? 1 : line.faint ? 0.22 : 0.5;
      ctx.lineWidth = line.strong ? 2 : 1;
      ctx.setLineDash(line.dashed ? [3, 4] : []);
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.textBaseline = 'alphabetic';
    for (const d of this.drawn) {
      if (!d.name) continue;
      const [x, y] = this.toScreen(d.mark.x, d.mark.y);
      const [bx, by, bw, bh] = d.name.box;
      ctx.clearRect(x + bx, y + by, bw, bh);
    }
    for (const d of this.drawn) {
      if (!d.name) continue;
      const [x, y] = this.toScreen(d.mark.x, d.mark.y);
      ctx.font = d.name.font;
      ctx.textAlign = d.name.align;
      ctx.globalAlpha = d.name.alpha;
      ctx.fillText(d.mark.name, x + d.name.dx, y + d.name.dy);
    }
    ctx.restore();
  }

  /** Each dot in view adds to the alpha of a square of pixels: where things are dense, it darkens. */
  private plot(a: Uint8ClampedArray): void {
    const { xs, ys, cells } = this.field!;
    const W = this.canvas.width;
    const H = this.canvas.height;
    const s = this.cam.scale * this.dpr;
    const { x: cx, y: cy } = this.cam;
    const z = Math.log2(this.cam.scale / 512);
    const size = Math.round(Math.max(1, Math.min(4, (z < 4 ? 1 : z < 6 ? 1.5 : z < 8 ? 2 : 2.6) * this.dpr)));
    // the whole world is many dots to a pixel: every second or fourth one, each counting for as many, looks
    // the same and costs a half or a quarter
    const stride = z < 1 ? 4 : z < 2 ? 2 : 1;
    const inc = Math.min(255, Math.round((z < 3 ? 22 : z < 3.6 ? 40 : z < 5 ? 70 : z < 7 ? 120 : 190) * STRENGTH * stride));
    const fade = this.fade * this.dpr;
    const cell = (v: number) => Math.max(0, Math.min(GRID - 1, Math.floor(v * GRID)));
    const [c0, c1] = [cell(cx - W / 2 / s), cell(cx + W / 2 / s)];
    const [r0, r1] = [cell(cy - H / 2 / s), cell(cy + H / 2 / s)];
    for (let row = r0; row <= r1; row++) {
      for (let col = c0; col <= c1; col++) {
        const m = CELL[col] | (CELL[row] << 1);
        for (let i = cells[m], end = cells[m + 1]; i < end; i += stride) {
          const px = ((xs[i] - cx) * s + W / 2) | 0;
          if (px < 0 || px >= W - size) continue;
          const py = ((ys[i] - cy) * s + H / 2) | 0;
          if (py < 0 || py >= H - size) continue;
          const add = px < fade ? ((inc * px) / fade) | 0 : inc;
          for (let dy = 0; dy < size; dy++) {
            let o = ((py + dy) * W + px) * 4 + 3;
            for (let dx = 0; dx < size; dx++, o += 4) a[o] += add;
          }
        }
      }
    }
  }

  private place(): void {
    for (const d of this.drawn) {
      const [x, y] = this.toScreen(d.mark.x, d.mark.y);
      d.g.setAttribute('transform', `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
    }
  }

  /** The scene's marks as SVG, its lines, and where each name goes, against the view it ends on. */
  private build(scene: Scene, target: View): void {
    this.svg.textContent = '';
    this.lit = null;
    const marks = [...scene.marks];
    if (scene.world === 'earth' && scene.places && this.field) marks.push(...this.places(scene, target, scene.places));
    this.drawn = marks.map((mark, n) => {
      const g = svg('g', { 'data-n': n });
      const r = mark.r ?? 5;
      if (mark.open) g.append(svg('circle', { class: 'ring', r: Math.max(3, r - 1) }));
      else g.append(svg('circle', { class: mark.dim ? 'dot dim' : 'dot', r, fill: mark.ink }));
      const hit = svg('circle', { class: 'hit', r: 15 });
      const title = svg('title', {});
      title.textContent = mark.name;
      hit.append(title);
      g.append(hit);
      this.svg.append(g);
      return { mark, g };
    });
    const byId = new Map(this.drawn.map((d) => [d.mark.id, d]));
    this.lines = (scene.lines ?? []).flatMap((l): [Drawn, Drawn, Line][] => {
      const a = byId.get(l.a);
      const b = byId.get(l.b);
      return a && b && a !== b ? [[a, b, l]] : [];
    });
    this.name(target);
    this.place();
  }

  /** The written places in a view, best connected first, that no mark already shows. */
  private places(scene: Scene, view: View, most: number): Mark[] {
    const taken = new Set(scene.marks.map((m) => m.id));
    const out: Mark[] = [];
    for (const [id, name, lon, lat, rank] of this.field!.places) {
      if (out.length >= most) break;
      if (taken.has(id)) continue;
      const [x, y] = project(lon, lat);
      if (Math.abs(x - view.x) * view.scale > this.w * 0.46 || Math.abs(y - view.y) * view.scale > this.h * 0.46) continue;
      out.push({ id, name, x, y, ink: this.field!.ink, r: 3.5, label: 'quiet', rank: 1 + rank / 1000 });
    }
    return out;
  }

  /** Names go right of their dot, else left, below or above (marks in a row: above or below first),
   *  never over another name or dot nor past the edge; a name with no room is left out. */
  private name(view: View): void {
    const { ctx } = this;
    const css = getComputedStyle(this.canvas);
    this.color = css.color;
    const display = css.getPropertyValue('--font-display').trim() || 'system-ui, sans-serif';
    const ui = css.getPropertyValue('--font-ui').trim() || 'system-ui, sans-serif';
    const small = this.w < 600;
    const at = (d: Drawn) => [(d.mark.x - view.x) * view.scale + this.w / 2, (d.mark.y - view.y) * view.scale + this.h / 2];
    const taken: [number, number, number, number][] = this.drawn.map((d) => {
      const [x, y] = at(d);
      const r = (d.mark.r ?? 5) + 1;
      return [x - r, y - r, x + r, y + r];
    });
    const hits = (b: [number, number, number, number]) => taken.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
    const order = this.drawn.filter((d) => d.mark.label).sort((a, b) => (b.mark.rank ?? 0) - (a.mark.rank ?? 0));
    for (const d of order) {
      const kind = d.mark.label!;
      const fs = kind === 'strong' ? (small ? 13.5 : 15) : kind === 'quiet' ? 11.5 : small ? 12 : 13;
      const font = kind === 'strong' ? `700 ${fs}px ${display}` : `500 ${fs}px ${ui}`;
      ctx.font = font;
      const w = ctx.measureText(d.mark.name).width;
      const r = d.mark.r ?? 5;
      const [x, y] = at(d);
      const spots: [number, number, CanvasTextAlign][] = d.mark.over
        ? [[0, -r - 8, 'center'], [0, r + fs + 4, 'center'], [r + 6, fs * 0.35, 'left'], [-r - 6, fs * 0.35, 'right']]
        : [[r + 6, fs * 0.35, 'left'], [-r - 6, fs * 0.35, 'right'], [0, r + fs + 4, 'center'], [0, -r - 8, 'center']];
      d.name = undefined;
      for (const [dx, dy, align] of spots) {
        const left = align === 'left' ? dx : align === 'right' ? dx - w : dx - w / 2;
        // the halo: three pixels round the letters
        const box: [number, number, number, number] = [left - 3, dy - fs - 1, w + 6, fs + 6];
        const abs: [number, number, number, number] = [x + box[0], y + box[1], x + box[0] + box[2], y + box[1] + box[3]];
        if (abs[0] < 4 || abs[2] > this.w - 4 || abs[1] < 4 || abs[3] > this.h - 4 || hits(abs)) continue;
        taken.push(abs);
        d.name = { dx, dy, align, font, alpha: kind === 'quiet' ? 0.62 : 1, box };
        // the name answers a pointer as its dot does
        d.g.append(svg('rect', { class: 'hit', x: box[0], y: box[1], width: box[2], height: box[3] }));
        break;
      }
    }
  }
}
