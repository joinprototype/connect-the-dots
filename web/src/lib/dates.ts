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

/**
 * The world "as of t": current = its interval contains t (inclusive of `end`), past = it ended
 * before t, future = it starts after t. Undated things, and every thing when no t is set, are current.
 */
export type TimeState = 'current' | 'past' | 'future';

