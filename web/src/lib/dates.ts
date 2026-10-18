import type { CtdDate, GEdge, GraphData } from './types';

export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Astronomical year number -> display text. 1962 -> "1962", 30 -> "30 CE", -449 -> "450 BCE". */
export function formatYearNumber(year: number): string {
  if (year <= 0) return `${1 - year} BCE`;
  if (year < 1000) return `${year} CE`;
  return String(year);
}

/** Decimal year -> readable label. With `month`, recent dates show the month too ("Oct 1962"). */
export function formatYear(t: number, month = false): string {
  const year = Math.floor(t);
  if (!month || year <= 0) return formatYearNumber(year);
  const m = Math.min(11, Math.max(0, Math.floor((t - year) * 12 + 1e-6)));
  return `${MONTHS[m]} ${formatYearNumber(year)}`;
}

/** Times after this year show their month ("Oct 1962"); earlier ones only the year ("1066"). */
export const MONTHS_AFTER = 1800;

/** A time the explorer is "as of", as shown. */
export function formatAsOf(t: number): string {
  return formatYear(t, t > MONTHS_AFTER);
}

/**
 * The world "as of t": current = its interval contains t (inclusive of `end`), past = it ended
 * before t, future = it starts after t. Undated things, and every thing when no t is set, are current.
 */
export type TimeState = 'current' | 'past' | 'future';

export function timeState(when: CtdDate | null | undefined, t: number | null | undefined): TimeState {
  if (t == null || !when) return 'current';
  if (t < when.start && !when.open_start) return 'future';
  if (when.end != null && t > when.end) return 'past';
  return 'current';
}

/** The latest of several states: future beats past beats current. */
export function laterState(...states: TimeState[]): TimeState {
  return states.includes('future') ? 'future' : states.includes('past') ? 'past' : 'current';
}

/** Min and max decimal years found in nodes and edges (or null when nothing is dated). */
export function dataYearRange(data: GraphData): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  const visit = (w: CtdDate | null | undefined) => {
    if (!w) return;
    min = Math.min(min, w.start);
    max = Math.max(max, w.start, w.end ?? w.start);
  };
  for (const n of data.nodes) visit(n.when);
  for (const e of data.edges) visit(e.when);
  if (!Number.isFinite(min)) return null;
  return [Math.floor(min), Math.ceil(max)];
}

/**
 * The years that matter to one entry: its own dates and its links', with a little room on each side,
 * and up to today when the entry is still going ("1988 –"). Null when none of them is dated, so a
 * person born in 1940 is not shown on a slider that starts in 3000 BCE.
 */
export function entryYearRange(when: CtdDate | null | undefined, links: GEdge[]): [number, number] | null {
  let min = Infinity;
  let max = -Infinity;
  for (const w of [when, ...links.map((e) => e.when)]) {
    if (!w) continue;
    min = Math.min(min, w.start);
    max = Math.max(max, w.start, w.end ?? w.start);
  }
  if (!Number.isFinite(min)) return null;
  const now = new Date().getFullYear();
  if (when && when.end == null && when.label.endsWith('–')) max = now;
  const pad = Math.max(2, Math.round((max - min) * 0.05));
  return [Math.floor(min - pad), Math.min(now, Math.ceil(max + pad))];
}

/** Round a decimal year for URLs. */
export function roundYear(t: number): number {
  return Math.round(t * 100) / 100;
}
