// Search by word range (docs/data-contract.md, "search/"). index.json lists each file's first word; a file
// holds the entries filed under its words, each under every word and every pair of neighbouring words of its
// names. While everything fits in one file, that file is every entry and has no words.
import { loadJson } from './data';
import type { SearchEntry } from './types';

interface SearchFile {
  entries: SearchEntry[];
  words?: [string, number[]][];
}

/** A text's words as the engine files them (crates/ctd/src/site/data.rs, `words`): lower case, accents
 *  dropped, apostrophes and full stops removed, split at everything else that is not a letter or digit. */
export function words(text: string): string[] {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[.'’]/g, '')
    .split(/[^\p{Alphabetic}\p{N}]+/u)
    .filter(Boolean);
}

const file = (n: number) => loadJson<SearchFile>(`/data/search/${n}.json`);

/**
 * The entries that may match `text`, best-connected first (`rank`): every entry while there is one file;
 * else those filed under a word, or a pair of neighbouring words, that starts like one of the text's
 * words or pairs. Matching and ranking them is the caller's (fuzzySearch, Ask).
 */
export async function candidates(text: string): Promise<SearchEntry[]> {
  const { files } = await loadJson<{ files: string[] }>('/data/search/index.json');
  if (files.length === 1) return (await file(0)).entries;
  const w = words(text);
  const keys = [...new Set([...w, ...w.slice(1).map((x, i) => `${w[i]} ${x}`)])];
  const found = new Map<number, SearchEntry>();
  await Promise.all(
    keys.map(async (key) => {
      // the file `key` falls in, and the next one when words starting with `key` run on into it
      const first = Math.max(0, files.findLastIndex((f) => f <= key));
      const range = first + 1 < files.length && files[first + 1].startsWith(key) ? [first, first + 1] : [first];
      for (const f of await Promise.all(range.map(file))) {
        for (const [word, at] of f.words ?? []) {
          if (word.startsWith(key)) for (const j of at) found.set(f.entries[j].rank, f.entries[j]);
        }
      }
    }),
  );
  return [...found.values()].sort((a, b) => a.rank - b.rank);
}
