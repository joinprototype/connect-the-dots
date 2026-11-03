// Paints one frame of the Stories surface on one canvas: land, the lines between islands, links, dots, then
// what the reader came to see in ink, then the names. Nothing here keeps time; place.ts asks for a frame only
// while the camera moves, so at rest nothing runs.
import { clamp, smooth, type Cam, type Rect } from './camera';
import { cellsIn, type Field } from '../lib/dotfield';
import { K0, type World } from './model';

/** What the camera came to see: one stop on the surface. */
export interface Scene {
  kind: 'island' | 'entry' | 'line' | 'way';
  /** Where the camera rests for it. */
  cam: Cam;
  /** Where the picture lies beside its words. */
  free: Rect;
  /** The entry it is about, or -1. */
  dot: number;
  /** Dots named and in full ink, with how much each matters. */
  focus: Map<number, number>;
  /** Links drawn in ink. */
  lines: number[];
  /** The link drawn heavy, or -1. */
  hot: number;
  /** A line's phrase, drawn at its middle. */
  word: string;
  /** A way, through these dots. */
  path: number[] | null;
  /** A story's trail, through these dots. */
  trail: number[] | null;
  /** Off-picture neighbours are named where their line leaves it. */
  pins: boolean;
  /** The island it is about, when it is one. */
  isle?: number;
  /** How far the rest steps back, 0 to 1. */
  dim: number;
  /** Where zooming out goes. */
  parent: string;
}

export interface Look {
  scene: Scene | null;
  /** How far the rest has stepped back, 0 to 1. */
  dim: number;
  hover: number;
  /** A link a pointer rests on, in the words. */
  hot: number;
  /** An island a pointer rests on, far out. */
  isle: number;
  /** How much of a way is drawn, 0 to 1. */
  drawn: number;
  moving: boolean;
  /** A card over the picture, in its pixels: no island is named under it. */
  avoid: Box | null;
  /** How far the dots stand on the Earth instead of on their islands, 0 to 1. */
  earth: number;
  /** The dots are moving between arrangements: no names until they land. */
  morph: boolean;
}

interface Tokens {
  paper: string;
  ink: string;
  land: string;
  line: string;
  road: string;
}

interface Sprite {
  c: HTMLCanvasElement;
  w: number;
  h: number;
  pad: number;
}

export type Box = [number, number, number, number];

const TAU = Math.PI * 2;
const NAME = '600 12px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
const FOCUS = '600 12.5px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
const HERE = '700 14px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
const WORD = 'italic 400 16px Literata, Georgia, serif';
/** The largest an island's name is set, in pixels. */
const TITLE = 20;
/** The land's pixels per map unit: about one pixel a point at the whole map's nearness. */
const LAND = 0.3;

const inside = (b: Box, x: number, y: number): boolean => x >= b[0] && x <= b[2] && y >= b[1] && y <= b[3];
const clear = (placed: Box[], b: Box): boolean => !placed.some((o) => b[0] < o[2] && b[2] > o[0] && b[1] < o[3] && b[3] > o[1]);
const short = (s: string, most = 30): string => (s.length > most ? s.slice(0, most - 1).trimEnd() + '…' : s);

export class Painter {
  private c: CanvasRenderingContext2D;
  private sx: Float32Array;
  private sy: Float32Array;
  private radius: Float32Array;
  private tok: Tokens = { paper: '#fff', ink: '#000', land: '#efefef', line: '#c4c4c4', road: '#cfcfcf' };
  private sprites = new Map<number, Sprite>();
  /** While the dots leave for the Earth: which of them it will draw. */
  going: Uint8Array | null = null;
  private picture: HTMLCanvasElement | null = null;
  /** The Earth's land as dots (data/field.bin), drawn once at LAND pixels per map unit; nearer, the dots
   *  themselves, from `field`. `at` and `square` turn the field's square into the map and back. */
  private land: HTMLCanvasElement | null = null;
  private field: Field | null = null;
  private at: ((mx: number, my: number) => [number, number] | null) | null = null;
  private square: ((x: number, y: number) => [number, number]) | null = null;
  private scale = 1;
  private far = K0;
  private W = 0;
  private H = 0;
  private dpr = 1;
  /** Island names and named dots as last drawn, for the pointer. */
  titles: { box: Box; isle: number }[] = [];
  pins: { box: Box; dot: number }[] = [];

  constructor(
    private canvas: HTMLCanvasElement,
    private w: World,
  ) {
    this.c = canvas.getContext('2d', { alpha: false })!;
    this.sx = new Float32Array(w.n);
    this.sy = new Float32Array(w.n);
    this.radius = Float32Array.from(w.degree, (d) => 1.15 + Math.min(2.4, Math.sqrt(d) * 0.36));
  }

  /** The stage's size; `far` is the nearness of the whole map, which the moving picture is painted for. */
  size(W: number, H: number, dpr: number, far: number): void {
    [this.W, this.H, this.dpr] = [W, H, dpr];
    this.canvas.width = Math.round(W * dpr);
    this.canvas.height = Math.round(H * dpr);
    const scale = Math.min(0.5, far * dpr * 1.25);
    if (Math.abs(scale - this.scale) > 0.01 || far !== this.far) {
      [this.scale, this.far] = [scale, far];
      this.picture = null;
    }
  }

  theme(from: Element): void {
    const css = getComputedStyle(from);
    const v = (name: string): string => css.getPropertyValue(name).trim();
    this.tok = { paper: v('--paper'), ink: v('--ink'), land: v('--place-land'), line: v('--place-line'), road: v('--place-road') };
    this.sprites.clear();
    this.picture = null;
  }

  /** The whole map once, as an image, for frames far out and in motion: then a move costs one image. Call it
   *  when the page has a moment, or the first move paints it. */
  prepare(): void {
    this.picture ??= this.paintPicture();
  }

  /** The dots moved to another arrangement: the moving picture is painted again when it is next needed. */
  moved(): void {
    this.picture = null;
  }

  /** The Earth's land: every dot of the field (the Web Mercator square), at its place on the map. */
  setLand(field: Field, at: (mx: number, my: number) => [number, number] | null, square: (x: number, y: number) => [number, number]): void {
    const { w } = this;
    const { xs, ys } = field;
    [this.field, this.at, this.square] = [field, at, square];
    const pic = document.createElement('canvas');
    [pic.width, pic.height] = [Math.ceil(w.w * LAND), Math.ceil(w.h * LAND)];
    const c = pic.getContext('2d')!;
    const img = c.createImageData(pic.width, pic.height);
    const px = new Uint32Array(img.data.buffer);
    // the more things a pixel holds, the darker its grey, so that the land shows itself where things are dense
    const count = new Uint16Array(pic.width * pic.height);
    for (let j = 0; j < xs.length; j++) {
      const p = at(xs[j], ys[j]);
      if (!p) continue;
      const [x, y] = [Math.floor(p[0] * LAND), Math.floor(p[1] * LAND)];
      if (x >= 0 && y >= 0 && x < pic.width && y < pic.height) count[y * pic.width + x]++;
    }
    for (let q = 0; q < count.length; q++) {
      if (!count[q]) continue;
      const v = Math.max(150, 222 - 12 * count[q]);
      // little-endian: alpha, blue, green, red
      px[q] = 0xff000000 | (v << 16) | (v << 8) | v;
    }
    c.putImageData(img, 0, 0);
    this.land = pic;
  }

  private paintPicture(): HTMLCanvasElement {
    const { w, scale: s } = this;
    const pic = document.createElement('canvas');
    pic.width = Math.ceil(w.w * s);
    pic.height = Math.ceil(w.h * s);
    const c = pic.getContext('2d')!;
    // drawn at the whole map's nearness, a dot is its own size
    const f = s / this.far;
    c.fillStyle = this.tok.land;
    c.beginPath();
    for (const isle of w.isles) {
      for (const i of isle.land) {
        c.moveTo(w.x[i] * s + w.coast * s, w.y[i] * s);
        c.arc(w.x[i] * s, w.y[i] * s, w.coast * s, 0, TAU);
      }
    }
    c.fill();
    c.strokeStyle = this.tok.line;
    c.lineWidth = 0.6 * f;
    c.globalAlpha = 0.55;
    c.beginPath();
    w.links.forEach((_, l) => {
      const [a, b] = [w.la[l], w.lb[l]];
      if (w.quiet[l] || w.home[a] < 0 || w.home[a] !== w.home[b]) return;
      c.moveTo(w.x[a] * s, w.y[a] * s);
      c.lineTo(w.x[b] * s, w.y[b] * s);
    });
    c.stroke();
    c.globalAlpha = 1;
    w.kinds.forEach((kind, t) => {
      c.fillStyle = kind.ink;
      c.beginPath();
      for (let i = 0; i < w.n; i++) {
        if (w.kind[i] !== t) continue;
        const r = this.radius[i] * f;
        c.moveTo(w.x[i] * s + r, w.y[i] * s);
        c.arc(w.x[i] * s, w.y[i] * s, r, 0, TAU);
      }
      c.fill();
    });
    return pic;
  }

  frame(cam: Cam, look: Look): void {
    const { c, w, W, H, sx, sy } = this;
    const k = cam.k;
    const L = Math.log2(k / K0);
    const scene = look.scene;
    c.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    c.globalAlpha = 1;
    c.fillStyle = this.tok.paper;
    c.fillRect(0, 0, W, H);
    for (let i = 0; i < w.n; i++) {
      sx[i] = W / 2 + (w.x[i] - cam.x) * k;
      sy[i] = H / 2 + (w.y[i] - cam.y) * k;
    }
    // zoomed away from a stop by hand, what it lit fades with the zoom
    const near = scene ? smooth(0.5, 0.82, k / scene.cam.k) : 0;
    const dim = look.dim * (scene ? near : 1);
    const rest = 1 - dim * (scene?.kind === 'line' ? 0.92 : 0.84);
    const grow = 1 + clamp(L, 0, 6) * 0.42;
    const seen = (x: number, y: number, m: number): boolean => x > -m && x < W + m && y > -m && y < H + m;
    // on the Earth the islands step away, and so do the dots that have no place there
    const e = look.earth;
    const isles = 1 - e;
    const vis = w.vis ?? this.going;
    const shown = (i: number): boolean => !vis || vis[i] === 1;

    if (e > 0.01 && this.land) {
      if (k > LAND * 1.6) this.landDots(cam, e);
      else {
        c.globalAlpha = e;
        c.imageSmoothingEnabled = true;
        c.drawImage(this.land, W / 2 - cam.x * k, H / 2 - cam.y * k, w.w * k, w.h * k);
      }
    }

    // the lines between islands, far out: each island's strongest, across the water and under the land
    const seaA = (1 - smooth(1.2, 2.3, L)) * rest * isles;
    if (seaA > 0.01) {
      c.strokeStyle = this.tok.line;
      for (const [a, b, strength, atRest] of w.bridges) {
        if (!atRest && look.isle !== a && look.isle !== b) continue;
        const [p, q] = [w.isles[a], w.isles[b]];
        const [x0, y0, x1, y1] = [W / 2 + (p.x - cam.x) * k, H / 2 + (p.y - cam.y) * k, W / 2 + (q.x - cam.x) * k, H / 2 + (q.y - cam.y) * k];
        c.globalAlpha = seaA * (atRest ? 0.7 : 1);
        c.lineWidth = 0.5 + strength * 0.25;
        c.beginPath();
        c.moveTo(x0, y0);
        c.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.09, (y0 + y1) / 2 - (x1 - x0) * 0.09, x1, y1);
        c.stroke();
      }
    }

    if (look.moving && L < 1 && e === 0) {
      const [s, pic] = [this.scale, (this.picture ??= this.paintPicture())];
      c.globalAlpha = rest;
      c.imageSmoothingEnabled = true;
      c.drawImage(pic, W / 2 - cam.x * k, H / 2 - cam.y * k, (pic.width / s) * k, (pic.height / s) * k);
      this.trail(look, k, rest);
    } else {
      // land: a disc around every dot on an island, filled as one
      const coast = w.coast * k;
      c.globalAlpha = Math.max(0.4, rest) * isles;
      c.fillStyle = this.tok.land;
      c.beginPath();
      for (const isle of w.isles) {
        for (const i of isle.land) {
          if (!seen(sx[i], sy[i], coast)) continue;
          c.moveTo(sx[i] + coast, sy[i]);
          c.arc(sx[i], sy[i], coast, 0, TAU);
        }
      }
      c.fill();
      if (isles > 0.01) this.trail(look, k, rest * isles);
      // links on one island always; the rest as one comes nearer
      c.strokeStyle = this.tok.line;
      c.lineWidth = L > 3 ? 0.9 : 0.6;
      c.globalAlpha = (0.55 + 0.45 * smooth(1, 3, L)) * rest * isles;
      c.beginPath();
      const far = smooth(1.8, 3, L) * 0.18;
      const across: number[] = [];
      w.links.forEach((_, l) => {
        if (w.quiet[l]) return;
        const [a, b] = [w.la[l], w.lb[l]];
        if (!seen(sx[a], sy[a], 0) && !seen(sx[b], sy[b], 0) && !this.crosses(a, b)) return;
        if (w.home[a] >= 0 && w.home[a] === w.home[b]) {
          c.moveTo(sx[a], sy[a]);
          c.lineTo(sx[b], sy[b]);
        } else if (far > 0.01 && !look.moving) across.push(l);
      });
      c.stroke();
      if (across.length) {
        c.globalAlpha = far * rest;
        c.beginPath();
        for (const l of across) {
          c.moveTo(sx[w.la[l]], sy[w.la[l]]);
          c.lineTo(sx[w.lb[l]], sy[w.lb[l]]);
        }
        c.stroke();
      }
      // the dots: those the arrangement draws, then those leaving it, fading
      for (const [alpha, here] of [[rest, true], [rest * isles, false]] as const) {
        if (alpha < 0.01 || (!here && !vis)) continue;
        c.globalAlpha = alpha;
        w.kinds.forEach((kind, t) => {
          c.fillStyle = kind.ink;
          c.beginPath();
          for (let i = 0; i < w.n; i++) {
            if (w.kind[i] !== t || shown(i) !== here || !seen(sx[i], sy[i], 12)) continue;
            const r = this.radius[i] * grow;
            c.moveTo(sx[i] + r, sy[i]);
            c.arc(sx[i], sy[i], r, 0, TAU);
          }
          c.fill();
        });
      }
    }

    // what the camera came to see, in ink
    if (scene) this.inInk(scene, look, near, grow);
    if (look.hover >= 0) {
      c.globalAlpha = 0.9;
      for (const l of w.adj[look.hover]) if (!w.quiet[l] || look.hover === scene?.dot) this.link(l, 0.9);
      c.globalAlpha = 1;
      c.fillStyle = w.kinds[w.kind[look.hover]].ink;
      c.beginPath();
      c.arc(sx[look.hover], sy[look.hover], this.radius[look.hover] * grow * 1.3, 0, TAU);
      c.fill();
    }

    // names
    c.textBaseline = 'alphabetic';
    c.lineJoin = 'round';
    // an island stays named over its own stop; elsewhere the names step back with the rest
    if (isles > 0.01) this.islandNames(cam, L, (!scene ? 1 : scene.kind === 'island' ? Math.max(rest, 0.25) : rest * 0.6) * isles, look);
    else this.titles.length = 0;
    if (!look.morph) this.dotNames(L, dim, look, grow);
    this.pins.length = 0;
    if (scene) this.focusNames(scene, look, near, grow);
    else if (look.hover >= 0) this.focusNames(null, look, 1, grow);
    if (scene?.kind === 'line' && scene.hot >= 0) this.word(scene, near);
    c.globalAlpha = 1;
  }

  /** Near in, the land as its own dots, those in view only: a dense place reads by its many dots. */
  private landDots(cam: Cam, alpha: number): void {
    const { c, W, H } = this;
    const [field, at, square] = [this.field!, this.at!, this.square!];
    const k = cam.k;
    const [x0, y0] = square(cam.x - W / 2 / k, cam.y - H / 2 / k);
    const [x1, y1] = square(cam.x + W / 2 / k, cam.y + H / 2 / k);
    const ranges: [number, number][] = [];
    let total = 0;
    cellsIn(field, x0, x1, y0, y1, (start, end) => {
      ranges.push([start, end]);
      total += end - start;
    });
    // a frame draws about as many as a frame can: in a dense place, every second or third looks the same
    const stride = Math.max(1, Math.ceil(total / 40000));
    const size = Math.min(2.2, 0.9 + k * 0.4);
    c.globalAlpha = alpha * 0.85;
    c.fillStyle = this.tok.line;
    c.beginPath();
    for (const [start, end] of ranges) {
      for (let i = start; i < end; i += stride) {
        const p = at(field.xs[i], field.ys[i]);
        if (!p) continue;
        const [px, py] = [W / 2 + (p[0] - cam.x) * k, H / 2 + (p[1] - cam.y) * k];
        if (px < -2 || py < -2 || px > W || py > H) continue;
        c.rect(px, py, size, size);
      }
    }
    c.fill();
  }

  /** A link whose ends are both off the stage may still cross it. */
  private crosses(a: number, b: number): boolean {
    const { sx, sy, W, H } = this;
    return !((sx[a] < 0 && sx[b] < 0) || (sx[a] > W && sx[b] > W) || (sy[a] < 0 && sy[b] < 0) || (sy[a] > H && sy[b] > H));
  }

  private link(l: number, width: number): void {
    const { c, w, sx, sy } = this;
    const [a, b] = [w.la[l], w.lb[l]];
    c.strokeStyle = this.tok.ink;
    c.lineWidth = width;
    if (w.dashed[l]) c.setLineDash([6, 4]);
    c.beginPath();
    c.moveTo(sx[a], sy[a]);
    c.lineTo(sx[b], sy[b]);
    c.stroke();
    if (w.dashed[l]) c.setLineDash([]);
  }

  /** A story's trail: a road under everything, through the subject of each scene. */
  private trail(look: Look, k: number, rest: number): void {
    const ids = look.scene?.trail ?? (look.isle >= 0 && !look.scene ? this.w.isles[look.isle].road : null);
    if (!ids || ids.length < 2) return;
    const { c, sx, sy } = this;
    c.globalAlpha = Math.max(rest, 0.6);
    c.strokeStyle = this.tok.road;
    c.lineWidth = 1.6 + clamp(Math.log2(k / K0), 0, 4) * 0.3;
    c.lineCap = c.lineJoin = 'round';
    c.beginPath();
    c.moveTo(sx[ids[0]], sy[ids[0]]);
    for (let j = 1; j < ids.length; j++) {
      const [px, py, x, y] = [sx[ids[j - 1]], sy[ids[j - 1]], sx[ids[j]], sy[ids[j]]];
      const [dx, dy] = [x - px, y - py];
      c.quadraticCurveTo(px + dx * 0.5 + dy * 0.1, py + dy * 0.5 - dx * 0.1, x, y);
    }
    c.stroke();
    c.lineCap = 'butt';
  }

  private inInk(scene: Scene, look: Look, near: number, grow: number): void {
    const { c, w, sx, sy } = this;
    // it comes in as the rest steps back
    const a = Math.max(0.15, near) * Math.min(1, (look.dim / scene.dim) * 1.4);
    if (scene.lines.length || scene.path) {
      const f = scene.free;
      c.save();
      c.beginPath();
      c.rect(f.x - 6, f.y - 8, f.w + 40, f.h + 16);
      c.clip();
      const many = scene.lines.length > 24;
      c.globalAlpha = a * (many ? 0.45 : 1);
      for (const l of scene.lines) if (l !== scene.hot && l !== look.hot) this.link(l, many ? 0.8 : 1.15);
      if (scene.path && scene.path.length > 1 && look.drawn > 0) {
        const ids = scene.path;
        const to = look.drawn * (ids.length - 1);
        c.globalAlpha = a;
        c.strokeStyle = this.tok.ink;
        c.lineWidth = scene.hot >= 0 ? 1.6 : 2.6;
        c.lineCap = c.lineJoin = 'round';
        c.beginPath();
        c.moveTo(sx[ids[0]], sy[ids[0]]);
        for (let j = 1; j <= Math.ceil(to); j++) {
          const f2 = Math.min(1, to - (j - 1));
          c.lineTo(sx[ids[j - 1]] + (sx[ids[j]] - sx[ids[j - 1]]) * f2, sy[ids[j - 1]] + (sy[ids[j]] - sy[ids[j - 1]]) * f2);
        }
        c.stroke();
        c.lineCap = 'butt';
      }
      c.globalAlpha = a;
      for (const l of [scene.hot, look.hot]) if (l >= 0) this.link(l, 2.4);
      c.restore();
    }
    c.globalAlpha = a;
    for (const i of scene.focus.keys()) {
      if (sx[i] < -20 || sx[i] > this.W + 20 || sy[i] < -20 || sy[i] > this.H + 20) continue;
      const here = i === scene.dot;
      const r = this.radius[i] * grow * (here ? 1.5 : 1.15);
      c.fillStyle = w.kinds[w.kind[i]].ink;
      c.beginPath();
      c.arc(sx[i], sy[i], r, 0, TAU);
      c.fill();
      if (here) {
        c.strokeStyle = this.tok.ink;
        c.lineWidth = 1.5;
        c.beginPath();
        c.arc(sx[i], sy[i], r + 3.5, 0, TAU);
        c.stroke();
      }
    }
  }

  /** An island's name, set once at its largest and scaled down as drawn, so that a zoom sets no type. */
  private sprite(isle: number): Sprite {
    let s = this.sprites.get(isle);
    if (s) return s;
    const px = TITLE;
    const title = this.w.isles[isle].title;
    const font = `italic 500 ${px}px Literata, Georgia, serif`;
    this.c.font = font;
    const [w, h, pad, S] = [Math.ceil(this.c.measureText(title).width), Math.ceil(px * 1.5), 5, 2];
    const canvas = document.createElement('canvas');
    canvas.width = (w + pad * 2) * S;
    canvas.height = (h + pad * 2) * S;
    const x = canvas.getContext('2d')!;
    x.scale(S, S);
    x.font = font;
    x.lineJoin = 'round';
    x.strokeStyle = this.tok.land;
    x.lineWidth = 5;
    x.strokeText(title, pad, pad + px * 1.05);
    x.fillStyle = this.tok.ink;
    x.fillText(title, pad, pad + px * 1.05);
    s = { c: canvas, w, h, pad };
    this.sprites.set(isle, s);
    return s;
  }

  /** Every island's name, far out: the biggest first, each on its island where it is clear of those before
   *  it, in the middle or a line above or below. */
  private islandNames(cam: Cam, L: number, rest: number, look: Look): void {
    this.titles.length = 0;
    const a = (1 - smooth(1.5, 2.2, L)) * rest;
    if (a < 0.02) return;
    const { c, w, W, H } = this;
    const placed: Box[] = [];
    c.globalAlpha = a;
    const order = w.isles.map((_, i) => i).sort((p, q) => w.isles[q].r - w.isles[p].r || p - q);
    for (const i of order) {
      if (i === look.scene?.isle) continue; // its own stop names it in words
      const isle = w.isles[i];
      const [cx, cy] = [W / 2 + (isle.x - cam.x) * cam.k, H / 2 + (isle.y - cam.y) * cam.k];
      const px = clamp(isle.r * cam.k * 0.3, 13, TITLE);
      const s = this.sprite(i);
      const f = px / TITLE;
      const [sw, sh, pad] = [s.w * f, s.h * f, s.pad * f];
      const free = (y: number): Box | null => {
        const box: Box = [cx - sw / 2 - 3, y - sh / 2, cx + sw / 2 + 3, y + sh / 2];
        const off = box[2] < 0 || box[0] > W || box[3] < 0 || box[1] > H;
        return off || !clear(placed, box) || (look.avoid && !clear([look.avoid], box)) ? null : box;
      };
      const y = [cy, cy - sh * 0.8, cy + sh * 0.8].find((at) => free(at));
      if (y === undefined) continue;
      const [x, box] = [cx, free(y)!];
      placed.push(box);
      c.drawImage(s.c, x - sw / 2 - pad, y - sh / 2 - pad, sw + pad * 2, sh + pad * 2);
      if (i === look.isle) {
        c.fillStyle = this.tok.ink;
        c.fillRect(x - sw / 2, y + px * 0.62, sw, 1);
      }
      this.titles.push({ box, isle: i });
    }
  }

  /** The dots' own names, nearer in: each from the level planned for it. */
  private dotNames(L: number, dim: number, look: Look, grow: number): void {
    const base = 1 - dim * 0.95;
    if (L < 1.5 || base < 0.05) return;
    const { c, w, sx, sy, W, H } = this;
    c.font = NAME;
    c.lineWidth = 3;
    for (let i = 0; i < w.n; i++) {
      const d = L - w.nameFrom[i];
      if (d < 0 || sx[i] < -160 || sx[i] > W + 10 || sy[i] < -14 || sy[i] > H + 14) continue;
      if (look.scene?.focus.has(i) || i === look.hover) continue;
      c.globalAlpha = smooth(0, 0.3, d) * base;
      const [x, y, name] = [sx[i] + this.radius[i] * grow + 4, sy[i] + 4, short(w.names[i])];
      if (!look.moving) {
        c.strokeStyle = w.home[i] >= 0 && !w.vis ? this.tok.land : this.tok.paper;
        c.strokeText(name, x, y);
      }
      c.fillStyle = this.tok.ink;
      c.fillText(name, x, y);
    }
  }

  /** The names of what the camera came to see, most important first, each where it fits inside the picture;
   *  a neighbour off the picture is named at the edge where its line leaves. */
  private focusNames(scene: Scene | null, look: Look, near: number, grow: number): void {
    const { c, w, sx, sy, W } = this;
    const free = scene?.free;
    const list = scene ? [...scene.focus.entries()].sort((a, b) => b[1] - a[1] || a[0] - b[0]) : [];
    if (look.hover >= 0 && !scene?.focus.has(look.hover)) list.unshift([look.hover, Infinity]);
    const placed: Box[] = [];
    c.lineWidth = 3.5;
    c.globalAlpha = Math.max(0.1, near);
    let named = 0;
    for (const [i, weight] of list) {
      if (named >= 60) break;
      if (scene?.kind === 'line' && i !== look.hover && scene.hot >= 0) {
        // a line's two ends are named above their dots
        this.endName(i, placed);
        continue;
      }
      const here = i === scene?.dot;
      const [x, y] = [sx[i], sy[i]];
      const within = free ? x >= free.x && x <= free.x + free.w && y >= free.y && y <= free.y + free.h : x > 0 && x < W && y > 0 && y < this.H;
      if (!within) {
        if (scene?.pins && !here && free) this.edgePin(scene, i, placed);
        continue;
      }
      c.font = here || weight === Infinity ? HERE : FOCUS;
      const name = short(w.names[i], 34);
      const tw = c.measureText(name).width;
      const gap = this.radius[i] * grow + 6 + (here ? 6 : 0);
      const tries: [number, number][] = [
        [x + gap, y + 4],
        [x - gap - tw, y + 4],
        [x - tw / 2, y - gap - 2],
        [x - tw / 2, y + gap + 10],
      ];
      for (const [tx, ty] of tries) {
        if (tx + tw > W - 4 || tx < (free ? free.x - 6 : 4)) continue;
        const b: Box = [tx - 2, ty - 12, tx + tw + 2, ty + 4];
        if (!clear(placed, b)) continue;
        placed.push(b);
        named++;
        if (!here) this.pins.push({ box: b, dot: i });
        c.strokeStyle = w.home[i] >= 0 && !w.vis ? this.tok.land : this.tok.paper;
        c.strokeText(name, tx, ty);
        c.fillStyle = this.tok.ink;
        c.fillText(name, tx, ty);
        break;
      }
    }
  }

  private endName(i: number, placed: Box[]): void {
    const { c, w, sx, sy, W } = this;
    c.font = HERE;
    const name = short(w.names[i], 34);
    const tw = c.measureText(name).width;
    const [tx, ty] = [clamp(sx[i] - tw / 2, 4, W - tw - 4), sy[i] - 14];
    const b: Box = [tx - 2, ty - 13, tx + tw + 2, ty + 4];
    placed.push(b);
    this.pins.push({ box: b, dot: i });
    c.strokeStyle = this.tok.paper;
    c.strokeText(name, tx, ty);
    c.fillStyle = this.tok.ink;
    c.fillText(name, tx, ty);
  }

  /** A neighbour off the picture: its name where the line to it leaves, with a dot in its ink. */
  private edgePin(scene: Scene, i: number, placed: Box[]): void {
    const { c, w, sx, sy } = this;
    const f = scene.free;
    const [ax, ay] = [sx[scene.dot], sy[scene.dot]];
    const [dx, dy] = [sx[i] - ax, sy[i] - ay];
    let t = 1;
    if (dx > 0) t = Math.min(t, (f.x + f.w - ax) / dx);
    else if (dx < 0) t = Math.min(t, (f.x - ax) / dx);
    if (dy > 0) t = Math.min(t, (f.y + f.h - ay) / dy);
    else if (dy < 0) t = Math.min(t, (f.y - ay) / dy);
    if (t <= 0 || t >= 1) return;
    const [px, py] = [ax + dx * t, ay + dy * t];
    c.font = NAME;
    const name = short(w.names[i], 24);
    const tw = c.measureText(name).width;
    const tx = clamp(dx > 0 && px > f.x + f.w - tw - 12 ? px - tw - 10 : px + 8, f.x + 2, f.x + f.w - tw - 2);
    const ty = clamp(py + 4, f.y + 12, f.y + f.h - 4);
    const b: Box = [tx - 12, ty - 12, tx + tw + 2, ty + 4];
    if (!clear(placed, b)) return;
    placed.push(b);
    c.strokeStyle = this.tok.paper;
    c.strokeText(name, tx, ty);
    c.fillStyle = this.tok.ink;
    c.fillText(name, tx, ty);
    c.fillStyle = w.kinds[w.kind[i]].ink;
    c.beginPath();
    c.arc(px, py, 3.5, 0, TAU);
    c.fill();
    this.pins.push({ box: b, dot: i });
  }

  /** A line's phrase at its middle, on paper. */
  private word(scene: Scene, near: number): void {
    const { c, w, sx, sy } = this;
    const [a, b] = [w.la[scene.hot], w.lb[scene.hot]];
    const [mx, my] = [(sx[a] + sx[b]) / 2, (sy[a] + sy[b]) / 2];
    c.globalAlpha = Math.max(0.1, near);
    c.font = WORD;
    const tw = c.measureText(scene.word).width;
    c.fillStyle = this.tok.paper;
    c.fillRect(mx - tw / 2 - 8, my - 13, tw + 16, 26);
    c.fillStyle = this.tok.ink;
    c.fillText(scene.word, mx - tw / 2, my + 5);
  }

  /** The island name or named dot under a point, if any. */
  titleAt(x: number, y: number): number {
    return this.titles.find((t) => inside(t.box, x, y))?.isle ?? -1;
  }

  pinAt(x: number, y: number): number {
    return this.pins.find((t) => inside(t.box, x, y))?.dot ?? -1;
  }

  /** The link of a scene nearest a point, within 8 pixels, or -1. */
  lineAt(lines: number[], x: number, y: number): number {
    const { w, sx, sy } = this;
    let [best, least] = [-1, 64];
    for (const l of lines) {
      const [a, b] = [w.la[l], w.lb[l]];
      const [dx, dy] = [sx[b] - sx[a], sy[b] - sy[a]];
      const t = clamp(((x - sx[a]) * dx + (y - sy[a]) * dy) / (dx * dx + dy * dy || 1), 0.06, 0.94);
      const d = (sx[a] + t * dx - x) ** 2 + (sy[a] + t * dy - y) ** 2;
      if (d < least) [best, least] = [l, d];
    }
    return best;
  }
}
