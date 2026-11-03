// The camera over the Stories surface: where it looks (x, y, in the map's units) and how near (k, pixels per
// unit). Every move is one straight eased move (ADR-0029): the view scales about the one point that keeps its
// place on the screen, so every dot travels a straight line, and nothing arcs, swings, overshoots or settles.

export interface Cam {
  x: number;
  y: number;
  k: number;
}

/** A part of the stage, in CSS pixels from its top left. */
export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));

/** 0 below a, 1 above b, smooth between. */
export const smooth = (a: number, b: number, v: number): number => {
  const t = clamp((v - a) / (b - a), 0, 1);
  return t * t * (3 - 2 * t);
};

/** Slow out, slow in: the one curve every move takes. */
export const ease = (t: number): number => (t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2);

/** The way from one view to another, as a camera for each moment from 0 to 1. */
export function straight(a: Cam, b: Cam): (t: number) => Cam {
  const ratio = b.k / a.k;
  if (Math.abs(Math.log(ratio)) < 1e-4) return (t) => ({ x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t, k: a.k + (b.k - a.k) * t });
  // the point of the map that both views show at the same place on the screen
  const px = (a.x * a.k - b.x * b.k) / (a.k - b.k);
  const py = (a.y * a.k - b.y * b.k) / (a.k - b.k);
  return (t) => {
    const s = ratio ** t;
    return { x: px - (px - a.x) / s, y: py - (py - a.y) / s, k: a.k * s };
  };
}

/** How long a move takes, in milliseconds: longer for a deeper zoom or a longer way, never long. */
export function moveTime(a: Cam, b: Cam, screen: number): number {
  const zoom = Math.abs(Math.log2(b.k / a.k));
  const screens = (Math.hypot(b.x - a.x, b.y - a.y) * Math.min(a.k, b.k)) / screen;
  return clamp(380 + 90 * zoom + 200 * Math.log2(1 + screens), 420, 900);
}

/** The camera that puts a point in the middle of `free`, with `reach` around it in view. */
export function around(x: number, y: number, reach: number, free: Rect, w: number, h: number, lo: number, hi: number, pad = 26): Cam {
  const k = clamp(Math.min(free.w / 2 - pad, free.h / 2 - pad) / Math.max(reach, 1e-3), lo, hi);
  return { x: x - (free.x + free.w / 2 - w / 2) / k, y: y - (free.y + free.h / 2 - h / 2) / k, k };
}

/** The camera that shows these points inside `free`, on a stage `w` by `h`, no nearer than `hi` nor further
 *  than `lo`. */
export function fit(points: [number, number][], free: Rect, w: number, h: number, lo: number, hi: number, pad = 26): Cam {
  let [x0, y0, x1, y1] = [Infinity, Infinity, -Infinity, -Infinity];
  for (const [x, y] of points) {
    x0 = Math.min(x0, x);
    x1 = Math.max(x1, x);
    y0 = Math.min(y0, y);
    y1 = Math.max(y1, y);
  }
  const k = clamp(Math.min((free.w - 2 * pad) / Math.max(x1 - x0, 1e-3), (free.h - 2 * pad) / Math.max(y1 - y0, 1e-3)), lo, hi);
  const fx = free.x + free.w / 2;
  const fy = free.y + free.h / 2;
  return { x: (x0 + x1) / 2 - (fx - w / 2) / k, y: (y0 + y1) / 2 - (fy - h / 2) / k, k };
}
