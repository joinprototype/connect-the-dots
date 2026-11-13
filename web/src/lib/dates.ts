export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Astronomical year number -> display text. 1962 -> "1962", 30 -> "30 CE", -449 -> "450 BCE". */
export function formatYearNumber(year: number): string {
  if (year <= 0) return `${1 - year} BCE`;
  if (year < 1000) return `${year} CE`;
  return String(year);
}


/** The daily puzzle's number from 0 on the reader's own calendar, puzzle 1 being on `first` (YYYY-MM-DD). */
export function puzzleDay(first: string, now = new Date()): number {
  const [y, m, d] = first.split('-').map(Number);
  return Math.round((Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) - Date.UTC(y, m - 1, d)) / 86_400_000);
}
