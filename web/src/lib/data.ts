import type { GEdge, GNode, GraphData, LensDef, Perspective, SearchEntry } from './types';

export const GRAPH_URL = '/data/graph.json';
export const SEARCH_URL = '/data/search.json';

interface DataCache {
  graph?: Promise<GraphData>;
  search?: Promise<SearchEntry[]>;
  index?: Promise<GraphIndex>;
}

// One cache per page, shared by every bundle (islands, explorer, story) that runs on it.
const g = globalThis as typeof globalThis & { __ctdData?: DataCache };
const cache: DataCache = (g.__ctdData ??= {});

export async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'same-origin' });
  if (!res.ok) throw new Error(`connect-the-dot: ${url} returned ${res.status}`);
  return (await res.json()) as T;
}

function retryable<T>(key: 'graph' | 'search', url: string): Promise<T> {
  const p = fetchJson<T>(url);
  // A failed request should not poison the cache for the rest of the page's life.
  p.catch(() => {
    if (cache[key] === (p as unknown)) delete cache[key];
  });
  return p;
}

export function loadGraph(): Promise<GraphData> {
  return (cache.graph ??= retryable<GraphData>('graph', GRAPH_URL));
}

export function loadSearch(): Promise<SearchEntry[]> {
  return (cache.search ??= retryable<SearchEntry[]>('search', SEARCH_URL));
}

/** Lookup tables derived once from graph.json. */
export interface GraphIndex {
  data: GraphData;
  nodes: Map<string, GNode>;
  edges: Map<string, GEdge>;
  lenses: Map<string, LensDef>;
  perspectives: Map<string, Perspective>;
  /** Edges touching each node, in both directions, sorted by edge id. */
  incident: Map<string, GEdge[]>;
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
  };
}

export function loadGraphIndex(): Promise<GraphIndex> {
  if (!cache.index) {
    const p = loadGraph().then(indexGraph);
    p.catch(() => {
      if (cache.index === p) delete cache.index;
    });
    cache.index = p;
  }
  return cache.index;
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
