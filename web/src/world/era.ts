// Eras for the map's era slider (/w/): windows two steps wide, one step apart, over the dated entries.
// DOM-free, so it also runs in Node.
import { formatYearNumber } from '../lib/dates';
import type { WorldEntity } from './tiles';

export interface Era {
  /** Plain text: "1910–1930", "Before 1860", "Since 2010". */
  label: string;
  /** The window [from, to) in decimal years; ±Infinity at an open end. */
  from: number;
  to: number;
}

/** How a dot outside the era (or undated) is drawn: 0 would be gone, 1 is as usual. */
export const ERA_DIM = 0.3;

/** Decade steps when they fit, else the first step that keeps the slider under MAX_ERAS stops. */
const STEPS = [10, 20, 50, 100, 250, 500, 1000];
const MAX_ERAS = 40;

/**
 * Twenty-year eras a decade apart (wider steps for very long spans), from the decade of the
 * 5th-percentile start to the present. The few entries earlier than that share one "Before …" era,
 * and the last era reads "Since …" once it reaches the present. Fewer than two dated entries: none.
 */
export function erasOf(entities: readonly WorldEntity[], now = new Date().getFullYear()): Era[] {
  const starts = entities.flatMap((e) => (e.start != null ? [e.start] : [])).sort((a, b) => a - b);
  if (starts.length < 2) return [];
  let last = starts[starts.length - 1];
  for (const e of entities) if (e.start != null && e.end != null) last = Math.max(last, e.end);
  last = Math.min(last, now);
  const first = starts[Math.floor((starts.length - 1) * 0.05)];
  const step = STEPS.find((s) => (last - first) / s <= MAX_ERAS) ?? STEPS[STEPS.length - 1];
  const floor = (y: number) => Math.floor(y / step) * step;
  const lo = floor(first);
  const hi = Math.max(lo, floor(last) - step);
  const year = formatYearNumber;
  const eras: Era[] = [];
  if (starts[0] < lo) eras.push({ label: `Before ${year(lo)}`, from: -Infinity, to: lo });
  for (let d = lo; d <= hi; d += step) {
    const open = d + 2 * step > now;
    eras.push({ label: open ? `Since ${year(d)}` : `${year(d)}–${year(d + 2 * step)}`, from: d, to: open ? Infinity : d + 2 * step });
  }
  return eras;
}

/** 1 when the entry's own dates overlap the era, else ERA_DIM. Undated entries are always faint. */
export function eraAlpha(e: WorldEntity | undefined, era: Era): number {
  if (!e || e.start == null) return ERA_DIM;
  return e.start < era.to && (e.end ?? Infinity) > era.from ? 1 : ERA_DIM;
}
