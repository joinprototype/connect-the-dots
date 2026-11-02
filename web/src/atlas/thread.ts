// The picture of a pair: its stops as dots on one line. The way draws once, from the first stop to the
// last, and then holds still. A dot fades in where it stays, and nothing moves, ever: no layout settles,
// and opening a proof touches nothing here. With reduced motion it is simply there, finished (site.css).
import { hash01 } from '../lib/hash';
import { canvasAnchor, measureText, placeLabels, Spot, type Box, type PlacedLabel } from '../lib/labels';

export interface Dot {
  name: string;
  url: string;
  /** Its colour, a CSS value. */
  ink: string;
  /** The inks of a little of what it also touches, drawn faint around it. */
  also: string[];
}

/** The record in black, one side's account dashed, open data grey and dashed. */
export type Line = 'read' | 'account' | 'unread';

export interface Thread {
  stops: Dot[];
  /** The line from each stop to the next; null when nothing joins them. */
  lines: (Line | null)[];
}

const NS = 'http://www.w3.org/2000/svg';
/** As wide as the page gets a column for the picture (atlas.css). */
const BESIDE = '(min-width: 1000px)';
const EDGE = 16;
/** One line of the way takes this long at most, and the whole way this long. */
const STEP_MS = 280;
const WAY_MS = 1500;
const START_MS = 120;
const END_PX = 15;
const END_FONT = '"Bricolage Grotesque", sans-serif';
const MID_PX = 12.5;

const make = (tag: string, attrs: Record<string, string | number>, parent?: Element): SVGElement => {
  const node = document.createElementNS(NS, tag) as SVGElement;
  for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
  parent?.append(node);
  return node;
};

/** A name that fits a label: the full one is in the heading and the list. */
const short = (name: string, most: number) => (name.length > most ? `${name.slice(0, most - 1).trimEnd()}…` : name);

/** Where the stops sit: a fixed curve, from the page's left edge across, or down the column beside. */
function layout(n: number, w: number, tall: boolean): { h: number; at: [number, number][] } {
  const wave = (t: number) => (n > 2 ? Math.sin(t * Math.PI * 2.4 + 0.6) : 0);
  const steps = Array.from({ length: n }, (_, i) => i / (n - 1));
  if (tall) {
    const h = Math.min(640, 150 + (n - 1) * 96);
    return { h, at: steps.map((t) => [w * 0.42 + wave(t) * w * 0.14, 28 + t * (h - 56)]) };
  }
  const h = n > 2 ? Math.max(170, Math.min(230, w * 0.5)) : 116;
  const run = Math.min(w - 2 * EDGE, 180 + (n - 1) * 130);
  return { h, at: steps.map((t) => [EDGE + t * run, h / 2 + wave(t) * (h / 2 - 50)]) };
}

/** The points along a line, so that no name sits on it. */
function along([x0, y0]: [number, number], [x1, y1]: [number, number]): Box[] {
  const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 10);
  return Array.from({ length: n + 1 }, (_, i) => {
    const [x, y] = [x0 + ((x1 - x0) * i) / n, y0 + ((y1 - y0) * i) / n];
    return { x0: x - 3, y0: y - 3, x1: x + 3, y1: y + 3 };
  });
}

function picture({ stops, lines }: Thread, w: number, tall: boolean, still: boolean): SVGElement {
  const n = stops.length;
  const { h, at } = layout(n, w, tall);
  const svg = make('svg', { width: w, height: h, viewBox: `0 0 ${w} ${h}`, class: `thread${still ? ' is-still' : ''}` });
  const radius = (i: number) => (i === 0 || i === n - 1 ? 11 : 7.5);
  const step = Math.min(STEP_MS, WAY_MS / Math.max(1, n - 1));
  const reached = (i: number) => (i === 0 ? 0 : START_MS + i * step - 60);
  const finished = START_MS + (n - 1) * step;

  const faint = make('g', { class: 'thread-also' }, svg);
  faint.style.setProperty('--d', `${finished + 80}ms`);

  lines.forEach((kind, i) => {
    if (!kind) return;
    const d = `M ${at[i][0]} ${at[i][1]} L ${at[i + 1][0]} ${at[i + 1][1]}`;
    const timing = `--d:${START_MS + i * step}ms;--t:${step}ms`;
    if (kind === 'read') {
      make('path', { d, pathLength: 1, class: 'thread-draw thread-read', style: timing }, svg);
      return;
    }
    // dashes cannot also draw the line, so a mask draws it
    const mask = make('mask', { id: `thread-${i}`, maskUnits: 'userSpaceOnUse', x: 0, y: 0, width: w, height: h }, svg);
    make('path', { d, pathLength: 1, class: 'thread-draw thread-reveal', style: timing }, mask);
    make('path', { d, class: `thread-${kind}`, mask: `url(#thread-${i})` }, svg);
  });

  stops.forEach((s, i) => {
    const dot = make('circle', { cx: at[i][0], cy: at[i][1], r: radius(i), class: 'thread-dot' }, svg);
    dot.style.fill = s.ink;
    dot.style.setProperty('--d', `${reached(i)}ms`);
  });

  const name = (text: string, x: number, y: number, anchor: string, base: string, i: number, end: boolean) => {
    const label = make('text', { x, y, 'text-anchor': anchor, 'dominant-baseline': base, class: `thread-name${end ? ' is-end' : ''}` }, svg);
    label.textContent = text;
    label.style.setProperty('--d', `${reached(i)}ms`);
  };
  // the two ends are named first, on the side away from their line
  const most = w < 420 ? 22 : 30;
  const [first, last] = [short(stops[0].name, most), short(stops[n - 1].name, most)];
  const wide = [first, last].map((t) => measureText(t, END_PX, END_FONT, 700) * 1.06);
  const names: Box[] = [];
  const avoid: Box[] = at.slice(1).flatMap((p, i) => along(at[i], p));
  const placeEnd = (i: number, text: string, width: number, under: boolean) => {
    const [x, y] = at[i];
    const r = radius(i);
    if (tall) {
      // on its right, unless it runs out of room
      const right = x + r + 8 + width <= w;
      const left = right ? x + r + 8 : x - r - 8 - width;
      name(text, right ? left : x - r - 8, y, right ? 'start' : 'end', 'central', i, true);
      names.push({ x0: left, y0: y - 10, x1: left + width, y1: y + 10 });
      return;
    }
    const top = under ? y + r + 8 : y - r - 8 - END_PX;
    const left = i === 0 ? x - r : x + r - width;
    name(text, i === 0 ? x - r : x + r, under ? top : y - r - 8, i === 0 ? 'start' : 'end', under ? 'hanging' : 'auto', i, true);
    names.push({ x0: left, y0: top, x1: left + width, y1: top + END_PX + 4 });
  };
  const clash = !tall && n === 2 && wide[0] + wide[1] > at[1][0] - at[0][0];
  placeEnd(0, first, wide[0], at[1][1] < at[0][1]);
  placeEnd(n - 1, last, wide[1], clash || at[n - 2][1] < at[n - 1][1]);

  // the stops between are named where there is room, and the list below names them all
  if (n > 2 && (tall || w >= 480 || n <= 4)) {
    const labels: PlacedLabel[] = stops.slice(1, -1).map((s, i) => {
      const text = short(s.name, 26);
      return { key: String(i + 1), text, position: at[i + 1], size: radius(i + 1), priority: 1, w: measureText(text, MID_PX, 'system-ui') * 1.06, h: 16, spot: Spot.Hidden, r: 0 };
    });
    placeLabels(labels, { project: (p) => p, width: w, height: h, radius: (r) => r, avoid: [...avoid, ...names], inside: true });
    const ANCHOR = { left: 'start', right: 'end', center: 'middle' } as Record<string, string>;
    const BASE = { top: 'hanging', bottom: 'auto', middle: 'central' } as Record<string, string>;
    labels.forEach((l, i) => {
      if (l.spot === Spot.Hidden) return;
      const c = canvasAnchor(l, l.position[0], l.position[1]);
      name(l.text, c.x, c.y, ANCHOR[c.align], BASE[c.baseline], i + 1, false);
      const left = c.align === 'left' ? c.x : c.align === 'right' ? c.x - l.w : c.x - l.w / 2;
      names.push({ x0: left, y0: c.y - 16, x1: left + l.w, y1: c.y + 16 });
    });
  }

  // a little of what each stop also touches, never under a name
  stops.forEach((s, i) => {
    s.also.forEach((ink, j) => {
      const seed = `${s.name}${j}`;
      const turn = hash01(seed) * Math.PI * 2;
      const far = radius(i) + 16 + hash01(seed, 1) * (tall ? 44 : 30);
      const x = Math.max(6, Math.min(w - 6, at[i][0] + Math.cos(turn) * far));
      const y = Math.max(6, Math.min(h - 6, at[i][1] + Math.sin(turn) * far * 0.8));
      if (names.some((b) => x > b.x0 - 6 && x < b.x1 + 6 && y > b.y0 - 6 && y < b.y1 + 6)) return;
      make('line', { x1: at[i][0], y1: at[i][1], x2: x, y2: y }, faint);
      make('circle', { cx: x, cy: y, r: 3 }, faint).style.fill = ink;
    });
  });

  // a dot is a door to its page, with room for a finger
  stops.forEach((s, i) => {
    const door = make('a', { href: s.url, tabindex: -1 }, svg);
    make('circle', { cx: at[i][0], cy: at[i][1], r: 22, class: 'thread-door' }, door);
  });
  return svg;
}

let watching: ResizeObserver | null = null;

/** Draws the thread in `box`. A window of a new width gets the finished picture at once. */
export function drawThread(box: HTMLElement, thread: Thread): void {
  watching?.disconnect();
  let width = box.clientWidth;
  const draw = (still: boolean) => box.replaceChildren(picture(thread, width, matchMedia(BESIDE).matches, still));
  draw(false);
  watching = new ResizeObserver(() => {
    if (box.clientWidth === width) return;
    width = box.clientWidth;
    draw(true);
  });
  watching.observe(box);
}
