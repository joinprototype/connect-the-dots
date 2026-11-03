// What Ask reads (docs/data-contract.md): every entry and link from graph-slim.json, an entry's words and
// proof from its detail file when an answer shows it, and data/ask.json for the stories and for what no
// answer may run through. The featured pairs come in the page itself.
import { loadGraphIndex, loadJson, type GraphIndex } from '../lib/data';

/** Words, or a name: `[text]`, or `[text, id, ink]`. A name's id may be empty: inked, with no dot. */
export type Part = [string] | [string, string, string];

/** A featured pair, asked as the route question. */
export interface Pick {
  a: string;
  b: string;
  text: string;
  parts: Part[];
  note: string | null;
}

export interface Story {
  id: string;
  title: string;
  subtitle: string | null;
  years: Set<number>;
  names: Set<string>;
}

interface AskFile {
  stories: [string, string, string | null, number[], string[]][];
  sealed: string[];
}

export interface Stories {
  /** The written stories free of sealed entries, in the library's order. */
  list: Story[];
  /** What no answer may run through (ADR-0027): sealed, about one, or named after one. */
  out: Set<string>;
}

let stories: Promise<Stories> | null = null;

export function loadStories(): Promise<Stories> {
  stories ??= loadJson<AskFile>('/data/ask.json').then((f) => ({
    list: f.stories.map(([id, title, subtitle, years, names]) => ({ id, title, subtitle, years: new Set(years), names: new Set(names) })),
    out: new Set(f.sealed),
  }));
  stories.catch(() => (stories = null));
  return stories;
}

export interface Record extends Stories {
  idx: GraphIndex;
}

export async function loadRecord(): Promise<Record> {
  const [idx, s] = await Promise.all([loadGraphIndex(), loadStories()]);
  return { idx, ...s };
}

/** A kind's ink, as a colour a canvas can use. */
export const inkOf = (idx: GraphIndex, type: string | undefined) => (type && idx.data.types[type]?.color) || GREY;

/** Open data, which nobody here has read. */
export const GREY = '#8c8c8c';

/** The stories that name every one of `ids`. */
export const storiesWith = (s: Stories, ...ids: string[]) => s.list.filter((st) => ids.every((id) => st.names.has(id)));
