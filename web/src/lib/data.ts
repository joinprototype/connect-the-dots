// Loading the data files (docs/data-contract.md, ADR-0017). Pages load what they show: the vocabulary
// (schema.json), the slim structure for the explorer and the Map (graph-slim.json), one entry's words and
// proof when it is opened (e/<id>.json), and a story's own data from its page.
import type { CtdDate, GEdge, GNode, GraphData, LensDef, Perspective, SourceDef, SourceRef } from './types';

const SCHEMA_URL = '/data/schema.json';
const SLIM_URL = '/data/graph-slim.json';
const WAYS_URL = '/data/ways.json';

/** The vocabulary: everything a graph needs but its entries, links and sources. */
type Schema = Omit<GraphData, 'nodes' | 'edges' | 'sources'>;

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

/** Files that entries share (ADR-0026). */
const ENTRY_PACKS = 256;

/** The pack an entry's files live in: 32-bit FNV-1a of its id, as `site/data.rs` computes it. */
export function packOf(id: string): number {
  let h = 0x811c9dc5;
  for (const byte of new TextEncoder().encode(id)) h = Math.imul(h ^ byte, 0x01000193);
  return (h >>> 0) % ENTRY_PACKS;
}

/** One entry's detail file, from the pack it shares. */
export function loadEntryFile(id: string): Promise<Details> {
  return loadJson<Record<string, Details>>(`/data/e/${packOf(id)}.json`).then((pack) => {
    const details = pack[id];
    if (!details) throw new Error(`no details for ${id}`);
    return details;
  });
}

/** One entry's words and proof (in data/e/<pack>.json). */
export interface Details {
  id: string;
  name: string;
  type: string;
  summary: string | null;
  aliases: string[];
  /** Its life story, if the build made one. */
  story: string | null;
  /** The question pages about it. */
  asked: { q: string; title: string; url: string; links: number; accounts: number; counts: string }[];
  /** How many more links open data holds for it; the explorer stays on the record (ADR-0023). */
  open: number | null;
  /** Its Wikidata id, the way from here into open data (`/r/`); null without one. */
  w: string | null;
  /** Its links' words and proof; a hub's file holds the strongest 100 of each kind. */
  links: DetailLink[];
  sources: Record<string, SourceDef>;
}

/** A link in a detail file, in full. */
interface DetailLink extends LinkExtras {
  id: string;
  to: string;
  rel: string;
  when: SlimDate;
  tier: string | null;
  sources: SourceRef[];
  detail?: string;
  qualifiers?: Record<string, unknown>;
  note?: string;
  reason?: string;
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

/** `[start, end, label]`, plus 1 when only the end is known; 0 when undated. */
type SlimDate = [number, number | null, string, 1?] | 0;
/** What a link says besides its ends, relation, date and tier, when not the default. */
interface LinkExtras {
  according_to?: string[];
  status?: string;
  voices?: string[];
}
/** graph-slim.json: entries `[id, name, type, degree, when, coords, place]`, links `[from, to, relation,
 *  claim, when, tier, extra?]` with entry indexes for ends and places (docs/data-contract.md). */
interface Slim {
  nodes: [string, string, string, number, SlimDate, [number, number] | 0, number][];
  edges: [number, number, string, string, SlimDate, string | null, LinkExtras?][];
}
/** ways.json: entries `[id, type, degree]`, and the links routes may use, `[from, to, relation, claim,
 *  tier, extra?]`. */
interface Ways {
  nodes: [string, string, number][];
  edges: [number, number, string, string, string | null, LinkExtras?][];
}

const date = (w: SlimDate): CtdDate | null => (w ? { start: w[0], end: w[1], label: w[2], ...(w[3] ? { open_start: true } : {}) } : null);

/** A link from what the data files give, its vocabulary from the schema. */
function linkOf(schema: Schema, id: string, from: string, to: string, rel: string, when: SlimDate, tier: string | null, more?: LinkExtras): GEdge {
  const r = schema.relations[rel];
  return {
    id,
    from,
    to,
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
    caveat: r?.caveat ?? null,
    qualifiers: {},
  };
}

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
  const edges = slim.edges.map(([f, t, rel, claim, when, tier, more]) => linkOf(schema, `${nodes[f].id}#${claim}`, nodes[f].id, nodes[t].id, rel, when, tier, more));
  return { nodes, edges };
}

/** ways.json's rows as a slim file with holes: no names, no dates, only the links a route may use. */
export function decodeWays(schema: Schema, ways: Ways): Pick<GraphData, 'nodes' | 'edges'> {
  return decodeSlim(schema, {
    nodes: ways.nodes.map(([id, type, degree]) => [id, id, type, degree, 0, 0, -1]),
    edges: ways.edges.map(([f, t, rel, claim, tier, more]) => [f, t, rel, claim, 0, tier, more]),
  });
}

/** What routes need, for one answer: a way is found here, and its words come from its stops' details. */
export function loadWaysIndex(): Promise<GraphIndex> {
  return once('ways', async () => {
    const [schema, ways] = await Promise.all([loadSchema(), loadJson<Ways>(WAYS_URL)]);
    return indexGraph({ ...schema, ...decodeWays(schema, ways), sources: {} });
  });
}

/** A small graph read from detail files alone: these entries, the links between them, and their proof. */
export function detailsIndex(schema: Schema, files: Details[]): GraphIndex {
  const nodes: GNode[] = files.map((d) => ({ id: d.id, name: d.name, type: d.type, degree: 0, when: null, coords: null, place: null, url: `/e/${d.id}/`, summary: d.summary, aliases: d.aliases }));
  const links = new Map<string, GEdge>();
  for (const w of files.flatMap((d) => d.links)) {
    const e = linkOf(schema, w.id, w.id.split('#')[0], w.to, w.rel, w.when, w.tier, w);
    links.set(w.id, { ...e, sources: w.sources, qualifiers: w.qualifiers ?? {}, detail: w.detail, note: w.note, reason: w.reason, full: true });
  }
  const idx = indexGraph({ ...schema, nodes, edges: [...links.values()], sources: Object.assign({}, ...files.map((d) => d.sources)) });
  for (const d of files) idx.details.set(d.id, d);
  return idx;
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
  return loadEntryFile(id).then(
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
