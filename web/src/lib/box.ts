// The box (ADR-0028): what a person typed, read against the search entries. No page and no fetch here:
// `candidates` (lib/search.ts) brings the entries a text may name, `lookupOf` files them, and `understand`
// says what was asked. A reading holds entries, a year or fixed words, never the typed text, so nothing
// typed can come back as a heading or an answer.
import { formatYearNumber } from './dates';
import { fuzzySearch, type FuzzyHit } from './fuzzy';
import { words } from './search';
import type { SearchEntry } from './types';

/** The search entries of a text, filed for reading it. Each map keeps the best-connected entry of a name. */
export interface Lookup {
  /** Folded name or alias -> entry. */
  names: Map<string, SearchEntry>;
  /** A person's last name -> the best-connected person written by hand. */
  surnames: Map<string, SearchEntry>;
  /** A story's title or an asked sentence -> its page. */
  pages: Map<string, SearchEntry>;
  all: readonly SearchEntry[];
}

/** A name in a text, and where it stands there. */
export interface Found {
  entry: SearchEntry;
  at: number;
  end: number;
}

export type Reading =
  | { kind: 'empty'; url: string }
  | { kind: 'year'; year: number; url: string }
  | { kind: 'name'; entry: SearchEntry; url: string }
  | { kind: 'pair'; a: SearchEntry; b: SearchEntry; url: string }
  | { kind: 'question'; entry: SearchEntry; ask: string; url: string }
  /** Nothing the box can answer: the names it did find, if any. */
  | { kind: 'unknown'; found: SearchEntry[] };

/** One suggestion. `focus`: the entry the Map and Stories may show in place. */
export interface Row {
  label: string;
  url: string;
  /** The entries it names, for their dots. */
  ends: SearchEntry[];
  sub?: string | null;
  /** The alias that matched. */
  also?: string;
  focus?: string;
}

export interface Suggestions {
  rows: Row[];
  /** The first row is what Enter does. */
  firm: boolean;
}

/** Words of a sentence that are never a name on their own. */
const STOP = new Set(
  `a about an and are as at be been behind benefited benefitted between by connect connected connection connects
   did do does for founded from funded funds gained happen happened has have her his how in is it its link linked
   links me of on or owned owns profited ran related relationship runs show so tell that the their this to versus
   vs was were what when where who whom why with`.split(/\s+/),
);

/** The four questions, in folded words. `q` is a question's id in content/schema/questions.yaml. */
const STEMS = [
  { q: 'behind', re: /^who(?: is| are| was| were|s)? behind |^who (?:owns|owned|runs|ran|funds|funded|founded) /, ask: (x: string) => `Who is behind ${x}?` },
  { q: 'benefited', re: /^who (?:has )?(?:benefited|benefitted|gained|profited)(?: from)? /, ask: (x: string) => `Who benefited from ${x}?` },
  { q: 'why', re: /^why /, ask: (x: string) => `Why did ${x} happen?` },
];

/** What may stand between two names while the second is still being typed. */
const JOINS = /^\s*(?:[,&+/]|and\b|to\b|with\b|vs\b|versus\b|connected\b|linked\b)/i;
/** The longest name looked for, in words. */
const MAX_WORDS = 8;
const ROWS = 8;

const key = (s: string) => words(s).join(' ');
const isOpenData = (e: SearchEntry) => /^Q\d+$/.test(e.id);
const isPage = (e: SearchEntry) => e.type === 'chapter' || e.type === 'question';
/** What may be one end of a pair. Open data goes unread, and its concepts name peoples ("Israelis"), so none
 *  is read as a name in a sentence or makes a pair, and no route starts at a heritage (ADR-0016). */
const canPair = (e: SearchEntry) => !isPage(e) && !(isOpenData(e) && e.type === 'concept');

/** Which of a text's search keys to read: a word or pair that starts with a stop word costs a file and finds no name. */
export const worthReading = (searchKey: string) => !STOP.has(searchKey.split(' ')[0]);

export function lookupOf(entries: readonly SearchEntry[]): Lookup {
  const lookup: Lookup = { names: new Map(), surnames: new Map(), pages: new Map(), all: entries };
  const file = (map: Map<string, SearchEntry>, name: string, e: SearchEntry) => {
    const k = key(name);
    for (const form of [k, k.replace(/^the /, '')]) if (form && !map.has(form)) map.set(form, e);
  };
  for (const e of entries) {
    const map = isPage(e) ? lookup.pages : lookup.names;
    for (const name of [e.name, ...(e.aliases ?? [])]) {
      file(map, name, e);
      file(map, name.replace(/\s*\(.*\)$/, ''), e);
    }
    const last = words(e.name).at(-1) ?? '';
    if (e.type === 'person' && !isOpenData(e) && e.name.includes(' ') && last.length > 3 && !STOP.has(last) && !lookup.surnames.has(last)) lookup.surnames.set(last, e);
  }
  return lookup;
}

interface Token {
  word: string;
  at: number;
  end: number;
}

function tokens(text: string): Token[] {
  return [...text.matchAll(/[\p{L}\p{M}\p{N}.'’]+/gu)].flatMap((m) => words(m[0]).map((word) => ({ word, at: m.index, end: m.index + m[0].length })));
}

/** The known names in a text, longest first where they overlap. */
export function findNames(text: string, lookup: Lookup): Found[] {
  const ts = tokens(text);
  const whole = ts.map((t) => t.word).join(' ');
  const out: Found[] = [];
  for (let i = 0; i < ts.length; ) {
    let len = 0;
    for (let n = Math.min(MAX_WORDS, ts.length - i); n >= 1 && !len; n--) {
      const part = ts.slice(i, i + n);
      const k = part.map((t) => t.word).join(' ');
      if (part.every((t) => STOP.has(t.word)) && (n === 1 || k !== whole)) continue;
      const e = lookup.names.get(k);
      // a phrase that may not stand here is passed over whole: its last word is no surname
      if (e && k !== whole && !canPair(e)) {
        len = n;
        break;
      }
      // One word that is a surname, or an everyday word that is an open-data title somewhere, counts only
      // standing alone: the text ends, or a join or a stop word follows. So "black people" is no Leon Black
      // and "White people" no Swedish firm, and no word for a people starts a pair (ADR-0016). An open-data
      // title also needs a capital, or to be all there is.
      const capital = text[part[0].at] !== text[part[0].at].toLowerCase();
      const after = ts[i + n];
      const alone = !after || STOP.has(after.word) || /[,&+/?!;:]/.test(text.slice(part[n - 1].end, after.at));
      const word = n === 1 && k !== whole;
      const hit = e && (!word || !isOpenData(e) || (capital && alone)) ? e : n === 1 && alone ? lookup.surnames.get(k) : undefined;
      if (hit) {
        len = n;
        out.push({ entry: hit, at: part[0].at, end: part[n - 1].end });
      }
    }
    i += len || 1;
  }
  return out;
}

function yearOf(t: string, now: number): number | null {
  const m = /^(?:what happened in |in (?:the year )?|the year |year )?([1-9]\d{2,3})(?: (bce|bc|ce|ad))?$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]);
  if (m[2] === 'bce' || m[2] === 'bc') return 1 - n;
  return n <= now ? n : null;
}

/** The sentence a question page is asked in, as search has it when it brought the page. */
function asked(lookup: Lookup, stem: (typeof STEMS)[number], entry: SearchEntry): { ask: string; url: string } {
  const url = `/q/${stem.q}/${entry.id}/`;
  return { ask: lookup.all.find((e) => e.url === url)?.name ?? stem.ask(entry.name), url };
}

const pairUrl = (a: SearchEntry, b: SearchEntry) => `/ask/?a=${encodeURIComponent(a.id)}&b=${encodeURIComponent(b.id)}`;
const distinct = (found: Found[]) => [...new Map(found.map((f) => [f.entry.id, f.entry])).values()];

/** What a text asks. */
export function understand(text: string, lookup: Lookup, now = new Date().getFullYear()): Reading {
  const t = key(text);
  if (!t) return { kind: 'empty', url: '/c/' };
  const year = yearOf(t, now);
  if (year !== null) return { kind: 'year', year, url: `/w/?t=${year}` };
  const page = lookup.pages.get(t);
  if (page) return { kind: 'name', entry: page, url: page.url };
  const found = findNames(text, lookup);
  const names = distinct(found);
  const [a, b] = names;
  const stem = STEMS.find((s) => s.re.test(t));
  if (stem) return a?.q?.includes(stem.q) ? { kind: 'question', entry: a, ...asked(lookup, stem, a) } : { kind: 'unknown', found: names };
  if (b) return { kind: 'pair', a, b, url: pairUrl(a, b) };
  // one name, and nothing else that means anything: "Is she a spy?" asks more than the name can answer
  const rest = tokens(text).filter((tk) => !STOP.has(tk.word) && !found.some((f) => tk.at >= f.at && tk.at < f.end));
  return a && !rest.length ? { kind: 'name', entry: a, url: a.url } : { kind: 'unknown', found: names };
}

/** What is left of a text after `from`, without its leading stop words: the name still being typed. */
function tail(text: string, from: number): string {
  const next = tokens(text).find((t) => t.at >= from && !STOP.has(t.word));
  return next ? text.slice(next.at).replace(/[?.!\s]+$/, '') : '';
}

const hits = (lookup: Lookup, text: string, n = ROWS): FuzzyHit<SearchEntry>[] => fuzzySearch(lookup.all, text, n);

const hitRow = ({ item, isAlias, text }: FuzzyHit<SearchEntry>): Row => ({ label: item.name, url: item.url, ends: [item], sub: item.summary, also: isAlias ? text : undefined, focus: item.id });
const nameRow = (e: SearchEntry): Row => ({ label: e.name, url: e.url, ends: [e], sub: e.summary, focus: e.id });
const pairRow = (a: SearchEntry, b: SearchEntry): Row => ({ label: `${a.name} and ${b.name}`, url: pairUrl(a, b), ends: [a, b], sub: 'How they connect' });

/**
 * What to offer under the field. The first row, when `firm`, is the reading or the best guess at a name still
 * being typed. A sealed entry can be searched for and asked about, but no row offers a pair through one (ADR-0027).
 */
export function suggest(text: string, lookup: Lookup, reading: Reading = understand(text, lookup)): Suggestions {
  const also = (first: Row, of: string): Row[] => [first, ...hits(lookup, of).map(hitRow).filter((r) => r.url !== first.url)].slice(0, ROWS);
  switch (reading.kind) {
    case 'empty':
      return { rows: [], firm: false };
    case 'year':
    {
      // a story can be titled with its year, and comes second: search would also list everything dated then
      const story = lookup.pages.get(key(text));
      return { rows: [{ label: `${formatYearNumber(reading.year)} on the Map`, url: reading.url, ends: [] }, ...(story ? [nameRow(story)] : [])], firm: true };
    }
    case 'question':
      return { rows: [{ label: reading.ask, url: reading.url, ends: [reading.entry], sub: reading.entry.summary }], firm: true };
    case 'pair': {
      const { a, b } = reading;
      if (a.sealed || b.sealed) return { rows: [], firm: false };
      // "Bill Gates and IB" is two names, but IB is an open-data title and the person is still typing IBM
      const last = findNames(text, lookup).at(-1);
      const typing = last?.entry === b && isOpenData(b) && !text.slice(last.end).trim();
      const written = typing ? hits(lookup, text.slice(last.at), 50).filter(({ item }) => canPair(item) && !isOpenData(item) && !item.sealed && item.id !== a.id) : [];
      return { rows: [...written.slice(0, ROWS - 1).map(({ item }) => pairRow(a, item)), pairRow(a, b)], firm: true };
    }
    case 'name':
      return { rows: also(nameRow(reading.entry), reading.entry.name), firm: true };
  }
  const t = key(text);
  const stem = STEMS.find((s) => s.re.test(t));
  const found = findNames(text, lookup);
  const last = found.at(-1);
  if (stem) {
    // "Who is behind Met": the names that have a page for this question
    const pages = last ? [] : hits(lookup, tail(text, 0), 50).filter((h) => h.item.q?.includes(stem.q));
    const rows = pages.slice(0, ROWS).map(({ item }): Row => {
      const { ask, url } = asked(lookup, stem, item);
      return { label: ask, url, ends: [item], sub: item.summary };
    });
    return rows.length ? { rows, firm: true } : { rows: reading.found.map(nameRow), firm: false };
  }
  if (last) {
    // "Bill Gates and IB": the second name, still being typed
    const a = found[0].entry;
    const second = JOINS.test(text.slice(last.end)) && !a.sealed ? tail(text, last.end) : '';
    const others = second ? hits(lookup, second, 50).filter(({ item }) => canPair(item) && !item.sealed && item.id !== a.id) : [];
    const rows = others.slice(0, ROWS).map(({ item }) => pairRow(a, item));
    return rows.length ? { rows, firm: true } : { rows: reading.found.map(nameRow), firm: false };
  }
  const guess = tail(text, 0);
  const rows = guess ? hits(lookup, guess).map(hitRow) : [];
  return { rows, firm: rows.length > 0 };
}
