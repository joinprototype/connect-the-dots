// Small fuzzy matcher for names and aliases. No dependencies; used by the search island and the explorer.

export interface Searchable {
  id: string;
  name: string;
  aliases?: string[];
}

export interface FuzzyHit<T> {
  item: T;
  score: number;
  /** The string that matched (the name or an alias). */
  text: string;
  isAlias: boolean;
  /** [start, end) ranges in `text` to highlight. */
  ranges: [number, number][];
}

const MARKS = /[̀-ͯ]/g;

/** Lowercase, strip diacritics; keep a map from normalized index to original index. */
function fold(s: string): { folded: string; map: number[] } {
  let folded = '';
  const map: number[] = [];
  for (let i = 0; i < s.length; i++) {
    const f = s[i].normalize('NFD').replace(MARKS, '').toLowerCase();
    for (let j = 0; j < f.length; j++) {
      folded += f[j];
      map.push(i);
    }
  }
  return { folded, map };
}

export function foldQuery(q: string): string {
  return q.normalize('NFD').replace(MARKS, '').toLowerCase().replace(/\s+/g, ' ').trim();
}

function mapRanges(ranges: [number, number][], map: number[]): [number, number][] {
  return ranges.map(([a, b]) => [map[a], map[b - 1] + 1]);
}

/** Score one candidate string. Higher is better; null = no match. */
export function scoreText(query: string, text: string): { score: number; ranges: [number, number][] } | null {
  if (!query) return null;
  const { folded, map } = fold(text);
  if (folded === query) return { score: 1000, ranges: [[0, text.length]] };
  if (folded.startsWith(query)) return { score: 900 - (folded.length - query.length), ranges: mapRanges([[0, query.length]], map) };
  const idx = folded.indexOf(query);
  if (idx >= 0) {
    const atWord = idx > 0 && /[\s\-'’(.,]/.test(folded[idx - 1]);
    return { score: (atWord ? 700 : 500) - idx, ranges: mapRanges([[idx, idx + query.length]], map) };
  }
  // Subsequence match with gap penalties ("blkrck" -> "BlackRock").
  const q = query.replace(/ /g, '');
  let qi = 0;
  let score = 300;
  let last = -1;
  const ranges: [number, number][] = [];
  for (let i = 0; i < folded.length && qi < q.length; i++) {
    if (folded[i] !== q[qi]) continue;
    if (last >= 0) {
      const gap = i - last - 1;
      score -= Math.min(gap, 8) * 6;
    } else {
      score -= Math.min(i, 10) * 3;
    }
    if (i === 0 || /[\s\-]/.test(folded[i - 1])) score += 8;
    if (ranges.length && ranges[ranges.length - 1][1] === i) ranges[ranges.length - 1][1] = i + 1;
    else ranges.push([i, i + 1]);
    last = i;
    qi++;
  }
  if (qi < q.length || score <= 40) return null;
  return { score, ranges: mapRanges(ranges, map) };
}

export function fuzzySearch<T extends Searchable>(items: readonly T[], rawQuery: string, limit = 8): FuzzyHit<T>[] {
  const query = foldQuery(rawQuery);
  if (!query) return [];
  const hits: FuzzyHit<T>[] = [];
  for (const item of items) {
    let best: FuzzyHit<T> | null = null;
    const consider = (text: string, isAlias: boolean) => {
      const r = scoreText(query, text);
      if (!r) return;
      const score = isAlias ? r.score - 25 : r.score;
      if (!best || score > best.score) best = { item, score, text, isAlias, ranges: r.ranges };
    };
    consider(item.name, false);
    for (const a of item.aliases ?? []) consider(a, true);
    if (best) hits.push(best);
  }
  hits.sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name) || (a.item.id < b.item.id ? -1 : 1));
  // Scattered-letter (subsequence) matches only help when nothing matches as a word or a substring:
  // "gates" should find Bill Gates, not "federal Government of the united sTATES".
  const SUBSTRING = 400;
  const strong = hits.filter((h) => h.score >= SUBSTRING - 25);
  return (strong.length ? strong : hits).slice(0, limit);
}

/** Split text into plain and highlighted parts. */
export function splitRanges(text: string, ranges: [number, number][]): { text: string; hit: boolean }[] {
  const parts: { text: string; hit: boolean }[] = [];
  let pos = 0;
  for (const [a, b] of ranges) {
    if (a > pos) parts.push({ text: text.slice(pos, a), hit: false });
    parts.push({ text: text.slice(a, b), hit: true });
    pos = b;
  }
  if (pos < text.length) parts.push({ text: text.slice(pos), hit: false });
  return parts;
}
