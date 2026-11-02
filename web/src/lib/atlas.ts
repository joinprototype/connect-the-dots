// The atlas (ADR-0023, docs/data-contract.md): entries packed by Wikidata number into 4,096 files, so
// reading one costs one small file, whatever the total.
import { loadJson } from './data';

const SHARDS = 4096;
export const KINDS = ['Person', 'Event', 'Work', 'Place', 'Organization', 'Artifact', 'Tradition', 'Concept'];
export const INKS = ['--tomato', '--amber', '--plum', '--leaf', '--cobalt', '--sky', '--plum', '--plum'];

/** Where an entry sits on the Map, in 65,535ths of the square. */
export type Spot = [number, number];
/** [Wikidata number, name, kind, place on the Map, id of the entry written by hand] */
export type Neighbour = [number, string, number, Spot, string?];
export type Group = [string, Neighbour[], number];
export interface Entry {
  n: string;
  k: number;
  g: Group[];
  d?: string;
  y?: string;
  c?: [number, number];
  i?: string;
  u?: string;
  p?: Spot;
  /** The next step towards the nearest landmark: [Wikidata number, phrase] (docs/data-contract.md). */
  r?: [number, number];
}

/** A written story, and the link it comes through when the entry is not in it itself. */
export interface Story {
  title: string;
  url: string;
  via?: string;
}

/** How many stories an entry offers. */
const STORIES = 3;

const shards = new Map<number, Promise<Record<string, Entry>>>();

export function atlasEntry(q: string): Promise<Entry | undefined> {
  const n = Number(q.slice(1)) % SHARDS;
  let got = shards.get(n);
  if (!got) {
    got = fetch(`/data/a/${n}.json`).then((r) => (r.ok ? r.json() : {}), () => ({}));
    shards.set(n, got);
  }
  return got.then((s) => s[q]);
}

/**
 * The written stories an entry is in, then those one link away: most dots of a million are in none,
 * and many reach one through what they link to. `id` is its id if written by hand.
 */
export async function storiesOf(id: string | null, e?: Entry): Promise<Story[]> {
  const file = await loadJson<Record<string, [string, string][]>>('/data/stories.json').catch(() => ({}) as Record<string, [string, string][]>);
  const own = file[id ?? e?.u?.split('/')[2] ?? ''] ?? [];
  const found: Story[] = own.map(([title, url]) => ({ title, url }));
  for (const n of e?.g.flatMap((g) => g[1]) ?? []) {
    if (found.length >= STORIES) break;
    for (const [title, url] of file[n[4] ?? ''] ?? []) if (!found.some((s) => s.url === url)) found.push({ title, url, via: n[1] });
  }
  return found.slice(0, STORIES);
}

export const hrefOf = (n: Neighbour) => (n[4] ? `/e/${n[4]}/` : `/a/?q=Q${n[0]}`);
