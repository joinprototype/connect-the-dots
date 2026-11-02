// Routes between any two entries of the atlas, with no server (docs/data-contract.md). As a game finds
// its way across a huge map, a route climbs from one entry to its nearest landmark, runs from landmark
// to landmark over a table worked out at build time, and comes down to the other entry. It costs a few
// small files, whatever the size of the graph.
import { atlasEntry, type Entry } from './atlas';

interface Table {
  /** Landmarks, by Wikidata number. */
  l: number[];
  /** Phrases: [read one way, read the other]. */
  p: [string, string][];
  /** next[i][j]: the landmark after i on the way to j. */
  n: number[][];
  /** "i:j", i < j: the crossing between two landmarks' territories: [number, number, phrase * 2 + flip]. */
  b: Record<string, [number, number, number]>;
}

/** A hop reads phrase `said`, the way round given by `flip`. */
interface Hop {
  said: number;
  flip: boolean;
}

/** Stops, and the hop from each stop to the next. */
interface Path {
  stops: number[];
  hops: Hop[];
}

export interface Stop {
  q: number;
  entry: Entry;
  /** How this stop leads to the next one; none on the last. */
  via: string | null;
}

let table: Promise<Table> | null = null;
const loadTable = () => (table ??= fetch('/data/routes.json').then((r) => r.json() as Promise<Table>));

const QUIET = 40;

/** From an entry up to its landmark. */
async function climb(q: number): Promise<Path> {
  const path: Path = { stops: [q], hops: [] };
  for (let at = q, i = 0; i < QUIET; i++) {
    const step = (await atlasEntry(`Q${at}`))?.r;
    if (!step) break;
    path.hops.push({ said: step[1], flip: false });
    path.stops.push(step[0]);
    at = step[0];
  }
  return path;
}

const back = (p: Path): Path => ({ stops: [...p.stops].reverse(), hops: [...p.hops].reverse().map((h) => ({ said: h.said, flip: !h.flip })) });

/** Joins two paths where one ends and the other starts. */
const join = (a: Path, b: Path): Path => ({ stops: [...a.stops, ...b.stops.slice(1)], hops: [...a.hops, ...b.hops] });

/** Cuts every loop out of a path: a route never passes through the same entry twice. */
function untangle(p: Path): Path {
  const out: Path = { stops: [p.stops[0]], hops: [] };
  p.stops.slice(1).forEach((q, i) => {
    const seen = out.stops.indexOf(q);
    if (seen >= 0) {
      out.stops.length = seen + 1;
      out.hops.length = seen;
    } else {
      out.stops.push(q);
      out.hops.push(p.hops[i]);
    }
  });
  return out;
}

async function walk(a: number, b: number, t: Table): Promise<Path | null> {
  const [up, down] = await Promise.all([climb(a), climb(b)]);
  const from = t.l.indexOf(up.stops[up.stops.length - 1]);
  const to = t.l.indexOf(down.stops[down.stops.length - 1]);
  if (from < 0 || to < 0) return null;
  let path = up;
  for (let i = from, guard = 0; i !== to && guard < t.l.length; guard++) {
    const j = t.n[i]?.[to];
    if (j === undefined || j === 65535) return null;
    const crossing = t.b[`${Math.min(i, j)}:${Math.max(i, j)}`];
    if (!crossing) return null;
    const [x, y, said] = crossing;
    const onward = i < j;
    const [u, v] = onward ? [x, y] : [y, x];
    const hop: Hop = { said: said >> 1, flip: Boolean(said & 1) !== !onward };
    const [left, right] = await Promise.all([climb(u), climb(v)]);
    path = join(path, back(left));
    path = join(path, { stops: [u, v], hops: [hop] });
    path = join(path, right);
    i = j;
  }
  return untangle(join(path, back(down)));
}

/** The route between two entries, stop by stop; null when there is none. */
export async function routeBetween(a: number, b: number): Promise<Stop[] | null> {
  const t = await loadTable();
  const path = await walk(a, b, t);
  if (!path) return null;
  const entries = await Promise.all(path.stops.map((q) => atlasEntry(`Q${q}`)));
  if (entries.some((e) => !e)) return null;
  return path.stops.map((q, i) => {
    const hop = path.hops[i];
    return { q, entry: entries[i]!, via: hop ? t.p[hop.said][hop.flip ? 1 : 0] : null };
  });
}
