export const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Astronomical year number -> display text. 1962 -> "1962", 30 -> "30 CE", -449 -> "450 BCE". */
export function formatYearNumber(year: number): string {
  if (year <= 0) return `${1 - year} BCE`;
  if (year < 1000) return `${year} CE`;
  return String(year);
}

