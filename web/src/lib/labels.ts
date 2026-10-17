// Label placement: greedy, by priority, on the CPU. Used by the world viewer, the explorer and story graphs.
//
// A few hundred labels are cheap to place exactly: project, then try right / left / above / below the
// dot against a grid of already placed boxes (and the dots themselves). Labels that fit nowhere are
// left out. (deck.gl's CollisionFilterExtension samples only each label's anchor point, so it cannot
// handle labels drawn beside their dot and lets partially overlapping labels through.)

export const Spot = { Hidden: 0, Right: 1, Left: 2, Above: 3, Below: 4, Center: 5 } as const;
export type Spot = (typeof Spot)[keyof typeof Spot];

export interface PlacedLabel {
  key: string;
  text: string;
  /** Position in the caller's space; PlaceOptions.project turns it into screen pixels. */
  position: [number, number];
  /** Node size in the caller's units; PlaceOptions.radius turns it into a pixel radius. */
  size: number;
  cluster: boolean;
  priority: number;
  /** Text box in pixels at the drawn font size. */
  w: number;
  h: number;
  /** Result of the last placement, and the dot radius it assumed. */
  spot: Spot;
  r: number;
}

export const NODE_FONT_PX = 12.5;
export const CLUSTER_FONT_PX = 14;
const GAP = 4;

let ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D | null | undefined;

/** Text width in px with the label font (canvas measureText; the SDF atlas uses the same metrics). */
export function measureText(text: string, px: number, family: string, weight = 500): number {
  if (ctx === undefined) {
    ctx =
      typeof OffscreenCanvas !== 'undefined'
        ? new OffscreenCanvas(1, 1).getContext('2d')
        : typeof document !== 'undefined'
          ? document.createElement('canvas').getContext('2d')
          : null;
  }
  if (!ctx) return text.length * px * 0.5;
  ctx.font = `${weight} ${px}px ${family}`;
  return ctx.measureText(text).width;
}

interface Box {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

/** Uniform grid of boxes, rebuilt per placement. */
class Grid {
  private cells = new Map<number, Box[]>();
  private cell: number;
  constructor(cell: number) {
    this.cell = cell;
  }
  private *keys(b: Box): Generator<number> {
    const c = this.cell;
    for (let gx = Math.floor(b.x0 / c); gx <= Math.floor(b.x1 / c); gx++) {
      for (let gy = Math.floor(b.y0 / c); gy <= Math.floor(b.y1 / c); gy++) yield gx * 100003 + gy;
    }
  }
  hits(b: Box): boolean {
    for (const k of this.keys(b)) {
      const list = this.cells.get(k);
      if (!list) continue;
      for (const o of list) if (b.x0 < o.x1 && b.x1 > o.x0 && b.y0 < o.y1 && b.y1 > o.y0) return true;
    }
    return false;
  }
  add(b: Box): void {
    for (const k of this.keys(b)) {
      const list = this.cells.get(k);
      if (list) list.push(b);
      else this.cells.set(k, [b]);
    }
  }
}

export interface PlaceOptions {
  /** Screen position of a common-space point. */
  project: (p: [number, number]) => [number, number];
  width: number;
  height: number;
  /** Drawn core radius (px) of a node of this size at the current zoom. */
  radius: (size: number) => number;
  /** Boxes to keep clear (e.g. the selection card), in px. */
  avoid?: Box[];
  /** The first `cover` labels (the most important) may sit over other dots, never over names. */
  cover?: number;
  /** Whole labels only: none may run past the edges (a view that cannot pan). */
  inside?: boolean;
}

/**
 * Place labels (already sorted by priority, highest first). Mutates spot/r; returns a hash of the
 * result so callers only push new attributes to the GPU when something changed.
 */
export function placeLabels(labels: PlacedLabel[], o: PlaceOptions): number {
  // names and overlays: never covered
  const taken = new Grid(64);
  for (const b of o.avoid ?? []) taken.add(b);
  // Keep labelled dots themselves clear of other labels.
  const dots = new Grid(64);
  const screen: [number, number][] = labels.map((l) => o.project(l.position));
  labels.forEach((l, i) => {
    if (l.cluster) return;
    const r = o.radius(l.size);
    const [x, y] = screen[i];
    dots.add({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
  });
  const cover = o.cover ?? 0;
  let hash = 2166136261;
  const margin = 40;
  labels.forEach((l, i) => {
    const [x, y] = screen[i];
    l.r = l.cluster ? 0 : o.radius(l.size);
    let spot: Spot = Spot.Hidden;
    if (x > -margin && y > -margin && x < o.width + margin && y < o.height + margin) {
      const { w, h, r } = l;
      const candidates: [Spot, Box][] = l.cluster
        ? [[Spot.Center, { x0: x - w / 2, y0: y - h / 2, x1: x + w / 2, y1: y + h / 2 }]]
        : [
            [Spot.Right, { x0: x + r + GAP, y0: y - h / 2, x1: x + r + GAP + w, y1: y + h / 2 }],
            [Spot.Left, { x0: x - r - GAP - w, y0: y - h / 2, x1: x - r - GAP, y1: y + h / 2 }],
            [Spot.Above, { x0: x - w / 2, y0: y - r - GAP - h, x1: x + w / 2, y1: y - r - GAP }],
            [Spot.Below, { x0: x - w / 2, y0: y + r + GAP, x1: x + w / 2, y1: y + r + GAP + h }],
          ];
      // Regions get more air than dot labels, like map lettering.
      const pad = l.cluster ? 10 : 3;
      for (const [s, b] of candidates) {
        const padded = { x0: b.x0 - pad, y0: b.y0 - pad, x1: b.x1 + pad, y1: b.y1 + pad };
        if (o.inside && (b.x0 < 0 || b.y0 < 0 || b.x1 > o.width || b.y1 > o.height)) continue;
        if (!taken.hits(padded) && (i < cover || !dots.hits(padded))) {
          taken.add(padded);
          spot = s;
          break;
        }
      }
    }
    l.spot = spot;
    hash = Math.imul(hash ^ (spot + 1) ^ (Math.round(l.r) << 4) ^ (i << 12), 16777619);
  });
  return hash >>> 0;
}

/** deck.gl TextLayer accessors for a placed label. */
export function anchorOf(l: PlacedLabel): 'start' | 'end' | 'middle' {
  return l.spot === Spot.Right ? 'start' : l.spot === Spot.Left ? 'end' : 'middle';
}

export function baselineOf(l: PlacedLabel): 'center' | 'top' | 'bottom' {
  return l.spot === Spot.Above ? 'bottom' : l.spot === Spot.Below ? 'top' : 'center';
}

export function offsetOf(l: PlacedLabel): [number, number] {
  switch (l.spot) {
    case Spot.Right:
      return [l.r + GAP, 0];
    case Spot.Left:
      return [-l.r - GAP, 0];
    case Spot.Above:
      return [0, -l.r - GAP];
    case Spot.Below:
      return [0, l.r + GAP];
    default:
      return [0, 0];
  }
}

/** Canvas 2D text position for a placed label whose dot is at (x, y) in pixels. */
export function canvasAnchor(l: PlacedLabel, x: number, y: number): { x: number; y: number; align: CanvasTextAlign; baseline: CanvasTextBaseline } {
  const [dx, dy] = offsetOf(l);
  const align: CanvasTextAlign = l.spot === Spot.Right ? 'left' : l.spot === Spot.Left ? 'right' : 'center';
  const baseline: CanvasTextBaseline = l.spot === Spot.Above ? 'bottom' : l.spot === Spot.Below ? 'top' : 'middle';
  return { x: x + dx, y: y + dy, align, baseline };
}
