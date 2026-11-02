// The atlas (ADR-0023, docs/data-contract.md): entries packed by Wikidata number into 4,096 files, so
// reading one costs one small file, whatever the total.
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

export const hrefOf = (n: Neighbour) => (n[4] ? `/e/${n[4]}/` : `/a/?q=Q${n[0]}`);
