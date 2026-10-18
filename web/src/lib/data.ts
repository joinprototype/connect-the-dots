// Loading the data files (docs/data-contract.md, ADR-0017). Pages load what they show: the vocabulary
// (schema.json), the slim structure for the explorer and the Map (graph-slim.json), one entry's words and
// proof when it is opened (e/<id>.json), and a story's own data from its page.
import type { CtdDate, GEdge, GNode, GraphData, LensDef, Perspective, SourceDef, SourceRef } from './types';

export const SCHEMA_URL = '/data/schema.json';
export const SLIM_URL = '/data/graph-slim.json';

/** The vocabulary: everything a graph needs but its entries, links and sources. */
export type Schema = Omit<GraphData, 'nodes' | 'edges' | 'sources'>;

// One cache per page, shared by every bundle (islands, explorer, story) that runs on it.
const g = globalThis as typeof globalThis & { __ctdData?: Map<string, Promise<unknown>> };
const cache: Map<string, Promise<unknown>> = (g.__ctdData ??= new Map());

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`connect-the-dot: ${url} returned ${res.status}`);
  return (await res.json()) as T;
}

/** `make()` once per page under `key`; a failure is not kept, so the next call tries again. */
function once<T>(key: string, make: () => Promise<T>): Promise<T> {
  let p = cache.get(key) as Promise<T> | undefined;
  if (!p) {
    const made = make();
    made.catch(() => {
      if (cache.get(key) === made) cache.delete(key);
    });
    cache.set(key, (p = made));
  }
  return p;
}

/** A data file, fetched once per page. */
export function loadJson<T>(url: string): Promise<T> {
  return once(url, () => fetchJson<T>(url));
}

export function loadSchema(): Promise<Schema> {
  return loadJson<Schema>(SCHEMA_URL);
}

/** One entry's words and proof (data/e/<id>.json). */
export interface Details {
  id: string;
  summary: string | null;
  aliases: string[];
  /** Its life story, if the build made one. */
  story: string | null;
  /** The question pages about it. */
  asked: { q: string; title: string; url: string; links: number; accounts: number; counts: string }[];
  /** Its links' words and proof; a hub's file holds the strongest 100 of each kind. */
  links: { id: string; sources: SourceRef[]; detail?: string; qualifiers?: Record<string, unknown>; note?: string; reason?: string }[];
  sources: Record<string, SourceDef>;
}

/** Lookup tables over a graph. */
export interface GraphIndex {
  data: GraphData;
  nodes: Map<string, GNode>;
  edges: Map<string, GEdge>;
  lenses: Map<string, LensDef>;
  perspectives: Map<string, Perspective>;
  /** Edges touching each node, in both directions, sorted by edge id. */
  incident: Map<string, GEdge[]>;
  /** Detail files merged in so far, by entry id (see loadDetails). */
  details: Map<string, Details>;
}

export function indexGraph(data: GraphData): GraphIndex {
  const nodes = new Map(data.nodes.map((n) => [n.id, n]));
  const edges = new Map<string, GEdge>();
  const incident = new Map<string, GEdge[]>();
  for (const n of data.nodes) incident.set(n.id, []);
  for (const e of data.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) continue;
    edges.set(e.id, e);
    incident.get(e.from)!.push(e);
    if (e.to !== e.from) incident.get(e.to)!.push(e);
  }
  for (const list of incident.values()) list.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return {
    data,
    nodes,
    edges,
    lenses: new Map(data.lenses.map((l) => [l.id, l])),
    perspectives: new Map(data.perspectives.map((p) => [p.id, p])),
    incident,
    details: new Map(),
  };
}

type SlimDate = [number, number | null, string] | 0;
/** graph-slim.json: entries `[id, name, type, degree, when, coords, place]`, links `[from, to, relation,
 *  claim, when, tier, extra?]` with entry indexes for ends and places (docs/data-contract.md). */
interface Slim {
  nodes: [string, string, string, number, SlimDate, [number, number] | 0, number][];
  edges: [number, number, string, string, SlimDate, string | null, { according_to?: string[]; status?: string; voices?: string[] }?][];
}

const date = (w: SlimDate): CtdDate | null => (w ? { start: w[0], end: w[1], label: w[2] } : null);

/** The slim file's rows as entries and links: structure only, until an entry's details are loaded. */
export function decodeSlim(schema: Schema, slim: Slim): Pick<GraphData, 'nodes' | 'edges'> {
  const nodes: GNode[] = slim.nodes.map(([id, name, type, degree, when, coords, place]) => ({
    id,
    name,
    type,
    degree,
    when: date(when),
    // an entry without coords of its own is drawn at its place's
    coords: coords || (place >= 0 && slim.nodes[place][5]) || null,
    place: place >= 0 ? slim.nodes[place][0] : null,
    url: `/e/${id}/`,
  }));
  const edges: GEdge[] = slim.edges.map(([f, t, rel, claim, when, tier, more]) => {
    const r = schema.relations[rel];
    const from = nodes[f].id;
    return {
      id: `${from}#${claim}`,
      from,
      to: nodes[t].id,
      rel,
      label: r?.label ?? rel,
      layers: r?.layers ?? [],
      when: date(when),
      according_to: more?.according_to ?? [],
      sources: [],
      tier,
      voices: more?.voices ?? [],
      cross_confirmed: !!more?.voices,
      status: more?.status ?? 'published',
      passive: !!r?.passive,
      traversable: r?.traversable ?? true,
      qualifiers: {},
    };
  });
  return { nodes, edges };
}

/** Every entry and link (the slim file) with the vocabulary: the explorer's and the Map's graph. */
export function loadGraphIndex(): Promise<GraphIndex> {
  return once('index', async () => {
    const [schema, slim] = await Promise.all([loadSchema(), loadJson<Slim>(SLIM_URL)]);
    return indexGraph({ ...schema, ...decodeSlim(schema, slim), sources: {} });
  });
}

/** A story's own entries, links and sources (embedded in its page) with the vocabulary. */
export async function storyIndex(own: Pick<GraphData, 'nodes' | 'edges' | 'sources'>): Promise<GraphIndex> {
  return indexGraph({ ...(await loadSchema()), ...own });
}

/**
 * Loads an entry's detail file into the index: its summary and aliases, and its links' qualifiers,
 * notes and sources (the links then have `full`). Resolves null when it cannot be loaded.
 */
export function loadDetails(idx: GraphIndex, id: string): Promise<Details | null> {
  return loadJson<Details>(`/data/e/${encodeURIComponent(id)}.json`).then(
    (d) => {
      if (!idx.details.has(id)) {
        idx.details.set(id, d);
        const n = idx.nodes.get(id);
        if (n) Object.assign(n, { summary: d.summary, aliases: d.aliases });
        Object.assign(idx.data.sources, d.sources);
        for (const w of d.links) {
          const e = idx.edges.get(w.id);
          if (e) Object.assign(e, { sources: w.sources, qualifiers: w.qualifiers ?? {}, detail: w.detail, note: w.note, reason: w.reason, full: true });
        }
      }
      return d;
    },
    () => null,
  );
}

/** Display name for an entity id that may or may not be a node (perspectives, publishers). */
export function nameOf(idx: GraphIndex, id: string | null | undefined): string {
  if (!id) return '';
  return idx.nodes.get(id)?.name ?? idx.perspectives.get(id)?.name ?? prettifyId(id);
}

export function prettifyId(id: string): string {
  const s = id.replace(/[-_]+/g, ' ').trim();
  return s.charAt(0).toUpperCase() + s.slice(1);
}
