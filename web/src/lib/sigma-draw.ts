// Canvas label and hover renderers for sigma, themed from the site's CSS tokens.
/** The part of sigma's settings the drawers read (keeps them usable with any graph attribute types). */
type Settings = { labelSize: number; labelWeight: string };
import type { Attributes } from 'graphology-types';
import type Sigma from 'sigma';
import type { NodeDisplayData, PartialButFor } from 'sigma/types';
import { cssRgba, type RGB } from './color';
import { canvasAnchor, measureText, placeLabels, Spot, type PlacedLabel } from './labels';

type DrawData = PartialButFor<NodeDisplayData, 'x' | 'y' | 'size' | 'label' | 'color'>;

export interface LabelTheme {
  ink: RGB;
  /** Halo / background behind text (paper or night). */
  ground: RGB;
  muted: RGB;
  font: string;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

const labelWidths = new Map<string, number>();

type Box = { x0: number; y0: number; x1: number; y1: number };

/**
 * Where makeHoverDrawer's card goes for a dot at (x, y) of radius r in a view `width` wide: right of
 * the dot, else left of it, else (a long name on a phone) below it, kept inside the view.
 */
function cardBox(x: number, y: number, r: number, w: number, h: number, width: number): Box {
  const right = x + r + 6;
  const left = x - r - 6 - w;
  if (right + w <= width - 4) return { x0: right, y0: y - h / 2, x1: right + w, y1: y + h / 2 };
  if (left >= 4) return { x0: left, y0: y - h / 2, x1: left + w, y1: y + h / 2 };
  const x0 = Math.max(4, Math.min(x - w / 2, width - 4 - w));
  return { x0, y0: y + r + 8, x1: x0 + w, y1: y + r + 8 + h };
}

function textWidth(text: string, px: number, family: string, weight: number): number {
  const key = `${weight} ${px} ${text}`;
  let w = labelWidths.get(key);
  if (w === undefined) labelWidths.set(key, (w = measureText(text, px, family, weight)));
  return w;
}

/**
 * Node labels that never overlap: right of the dot, else left, above or below; one that fits nowhere is
 * left out (sigma's own label grid does not measure text). Run it on sigma's 'afterRender', with
 * `renderLabels: false`. A highlighted or hovered dot gets sigma's hover card instead, kept clear of names.
 * `priority` ranks who gets the free spots first.
 */
export function drawPlacedLabels<N extends Attributes, E extends Attributes>(
  sigma: Sigma<N, E>,
  theme: LabelTheme,
  o: {
    px: number;
    weight: number;
    priority: (node: string, d: NodeDisplayData) => number;
    hovered?: string;
    /** Whole labels only: none may run past the edges (a view that cannot pan). */
    inside?: boolean;
    /** Boxes drawn over the view (a story's time pills or quote card), kept clear of names. */
    avoid?: Box[];
  },
): void {
  const ctx = sigma.getCanvases().labels?.getContext('2d');
  if (!ctx) return;
  const { width, height } = sigma.getDimensions();
  const { px, weight } = o;
  const avoid: Box[] = [...(o.avoid ?? [])];
  const cands: (PlacedLabel & { x: number; y: number; alpha: number })[] = [];
  sigma.getGraph().forEachNode((node) => {
    const d = sigma.getNodeDisplayData(node);
    if (!d || d.hidden) return;
    const { x, y } = sigma.framedGraphToViewport(d);
    const r = sigma.scaleSize(d.size);
    avoid.push({ x0: x - r, y0: y - r, x1: x + r, y1: y + r });
    const label = d.label ?? '';
    if (!label) return;
    if (node === o.hovered || d.highlighted) {
      // Sigma draws makeHoverDrawer's card beside these dots (name, and a smaller line under it); keep
      // other labels off it.
      const sub = (d as unknown as { subLabel?: string }).subLabel ?? '';
      const cw = Math.max(textWidth(label, px, theme.font, 600), sub ? textWidth(sub, px - 2, theme.font, 400) : 0) + 20;
      const ch = sub ? px * 2 + 12 : px + 12;
      const b = cardBox(x, y, r, cw, ch, width);
      avoid.push({ x0: b.x0 - 4, y0: b.y0 - 4, x1: b.x1 + 4, y1: b.y1 + 4 });
      return;
    }
    const w = textWidth(label, px, theme.font, weight);
    cands.push({
      key: node,
      text: label,
      position: [x, y],
      size: r,
      cluster: false,
      priority: o.priority(node, d),
      w: w + 2,
      h: px + 3,
      spot: Spot.Hidden,
      r: 0,
      x,
      y,
      alpha: Number((d as unknown as { labelAlpha?: number }).labelAlpha ?? 1),
    });
  });
  cands.sort((a, b) => b.priority - a.priority || (a.key < b.key ? -1 : 1));
  placeLabels(cands, { project: (p) => p, width, height, radius: (r) => r, avoid, inside: o.inside });
  ctx.font = `${weight} ${px}px ${theme.font}`;
  ctx.lineJoin = 'round';
  for (const l of cands) {
    if (l.spot === Spot.Hidden) continue;
    const at = canvasAnchor(l, l.x, l.y);
    ctx.textAlign = at.align;
    ctx.textBaseline = at.baseline;
    ctx.lineWidth = 4;
    ctx.strokeStyle = cssRgba(theme.ground, 0.85 * l.alpha);
    ctx.strokeText(l.text, at.x, at.y);
    ctx.fillStyle = cssRgba(theme.ink, l.alpha);
    ctx.fillText(l.text, at.x, at.y);
  }
}

export function makeHoverDrawer(theme: LabelTheme) {
  return (ctx: CanvasRenderingContext2D, data: DrawData, settings: Settings): void => {
    const size = settings.labelSize;
    const label = data.label ?? '';
    const sub = (data.subLabel as string | undefined) ?? '';
    ctx.font = `600 ${size}px ${theme.font}`;
    const w1 = ctx.measureText(label).width;
    ctx.font = `400 ${size - 2}px ${theme.font}`;
    const w2 = sub ? ctx.measureText(sub).width : 0;
    const padX = 10;
    const h = sub ? size * 2 + 12 : size + 12;
    const w = Math.max(w1, w2) + padX * 2;
    const { x0: x, y0: y } = cardBox(data.x, data.y, data.size, w, h, ctx.canvas.clientWidth || Infinity);

    // ring around the node
    ctx.beginPath();
    ctx.arc(data.x, data.y, data.size + 3, 0, Math.PI * 2);
    ctx.lineWidth = 2;
    ctx.strokeStyle = data.color;
    ctx.stroke();

    if (!label) return;
    // A small card: white (or the dark surface), soft shadow, hairline; no colour.
    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.14)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 4;
    roundRect(ctx, x, y, w, h, 10);
    ctx.fillStyle = cssRgba(theme.ground, 0.98);
    ctx.fill();
    ctx.restore();
    roundRect(ctx, x, y, w, h, 10);
    ctx.lineWidth = 1;
    ctx.strokeStyle = cssRgba(theme.ink, 0.08);
    ctx.stroke();

    ctx.textBaseline = 'middle';
    ctx.fillStyle = cssRgba(theme.ink, 1);
    ctx.font = `600 ${size}px ${theme.font}`;
    ctx.fillText(label, x + padX, sub ? y + size / 2 + 6 : y + h / 2);
    if (sub) {
      ctx.fillStyle = cssRgba(theme.muted, 1);
      ctx.font = `400 ${size - 2}px ${theme.font}`;
      ctx.fillText(sub, x + padX, y + size * 1.5 + 7);
    }
  };
}

/**
 * Cap sigma's pixel ratio (default 2). Sigma reads window.devicePixelRatio on every resize; at 3x
 * (phones) its three WebGL layers and two 2D layers cost 2.25x the memory of 2x for no visible gain.
 */
export function capPixelRatio(renderer: { resize(force?: boolean): unknown }, cap = 2): void {
  const original = renderer.resize.bind(renderer);
  renderer.resize = (force?: boolean) => {
    if ((window.devicePixelRatio || 1) <= cap) return original(force);
    // Override the getter for the duration of this synchronous call only, then restore it exactly
    // (on Window it is an own, configurable accessor; elsewhere it may live on the prototype).
    const own = Object.getOwnPropertyDescriptor(window, 'devicePixelRatio');
    if (own && !own.configurable) return original(force);
    Object.defineProperty(window, 'devicePixelRatio', { configurable: true, enumerable: true, get: () => cap });
    try {
      return original(force);
    } finally {
      if (own) Object.defineProperty(window, 'devicePixelRatio', own);
      else delete (window as { devicePixelRatio?: number }).devicePixelRatio;
    }
  };
  if ((window.devicePixelRatio || 1) > cap) renderer.resize(true);
}
