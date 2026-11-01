// Eras for the map's era slider (/w/): windows two stops wide, one stop apart, closer together as
// history comes closer. DOM-free, so it also runs in Node.
import { formatYearNumber } from '../lib/dates';
import type { WorldEntity } from './tiles';

export interface Era {
  /** Plain text: "1910–1930", "Before 3000 BCE", "Since 2010". */
  label: string;
  /** The window [from, to) in decimal years; ±Infinity at an open end. */
  from: number;
  to: number;
  /** The year whose world borders the Earth draws (its middle), or null past LAST_BORDERS. */
  year: number | null;
}

/** How a dot outside the era (or undated) is drawn: 0 would be gone, 1 is as usual. */
export const ERA_DIM = 0.3;

const span = (from: number, to: number, step: number) => Array.from({ length: (to - from) / step + 1 }, (_, i) => from + i * step);

/** The slider's stops, in the site's years (0 is 1 BCE). tools/borders.py cuts a world for each, to LAST_BORDERS. */
const TICKS = [-2999, -2499, -1999, -1499, -999, -499, 1, 500, 1000, ...span(1100, 1800, 100), 1825, 1850, 1875, 1900, ...span(1910, 2020, 10)];
/** Later worlds would have to draw today's contested borders (ADR-0021): the basemap stays. */
const LAST_BORDERS = 1990;

/**
 * An era per stop from the first dated entry to the last. Entries before the first stop share one
 * "Before …" era, and the last era reads "Since …" once it reaches the present. Fewer than two dated
 * entries: none.
 */
export function erasOf(entities: readonly WorldEntity[], now = new Date().getFullYear()): Era[] {
  const starts = entities.flatMap((e) => (e.start != null ? [e.start] : [])).sort((a, b) => a - b);
  if (starts.length < 2) return [];
  let last = starts[starts.length - 1];
  for (const e of entities) if (e.start != null && e.end != null) last = Math.max(last, e.end);
  last = Math.min(last, now);
  const year = formatYearNumber;
  const world = (y: number) => (y <= LAST_BORDERS ? y : null);
  const eras: Era[] = [];
  if (starts[0] < TICKS[0]) eras.push({ label: `Before ${year(TICKS[0])}`, from: -Infinity, to: TICKS[0], year: world(TICKS[0]) });
  const first = Math.max(0, TICKS.findLastIndex((t) => t <= starts[0]));
  for (let i = first; i < TICKS.length && TICKS[i] <= last; i++) {
    const [from, middle, to] = TICKS.slice(i);
    const open = to === undefined || to > now;
    eras.push({ label: open ? `Since ${year(from)}` : `${year(from)}–${year(to)}`, from, to: open ? Infinity : to, year: open ? null : world(middle) });
    if (open) break;
  }
  return eras;
}

/** 1 when the entry's own dates overlap the era, else ERA_DIM. Undated entries are always faint. */
export function eraAlpha(e: WorldEntity | undefined, era: Era): number {
  if (!e || e.start == null) return ERA_DIM;
  return e.start < era.to && (e.end ?? Infinity) > era.from ? 1 : ERA_DIM;
}
