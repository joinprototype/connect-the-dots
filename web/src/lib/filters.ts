import type { GraphIndex } from './data';
import { laterState, timeState, type TimeState } from './dates';
import type { GEdge } from './types';

/**
 * show = normal; past = ended before the time filter, drawn faded; dim = drawn faded because a lens
 * or perspective sets it aside; hide = not drawn (other lens, other perspective under "facts only",
 * or not yet begun at the time filter).
 */
export type Vis = 'show' | 'past' | 'dim' | 'hide';

export interface Filters {
  /** Lens id; "all" (or an unknown id) shows every layer. */
  lens: string;
  /** "all", "facts" or a perspective entity id. */
  perspective: string;
  /** Decimal year, or null for no time filter. */
  t: number | null;
}

/** Layers shown by a lens, or null when the lens shows everything. */
export function lensLayers(idx: GraphIndex, lensId: string | null | undefined): Set<string> | null {
  if (!lensId || lensId === 'all') return null;
  const lens = idx.lenses.get(lensId);
  return lens ? new Set(lens.layers) : null;
}

export const isAttributed = (e: GEdge): boolean => e.according_to.length > 0;

/** Attributed and draft claims are drawn fainter than documented facts. */
export const isFaint = (e: GEdge): boolean => isAttributed(e) || e.status === 'draft';

/**
 * A claim "as of t": future if it, or either entity, has not begun yet; past if it, or either entity,
 * is over (a claim cannot outlive what it connects); current otherwise. Undated parts count as current.
 */
export function edgeTime(idx: GraphIndex, e: GEdge, t: number | null): TimeState {
  if (t == null) return 'current';
  return laterState(timeState(e.when, t), timeState(idx.nodes.get(e.from)?.when, t), timeState(idx.nodes.get(e.to)?.when, t));
}

export function nodeTime(idx: GraphIndex, id: string, t: number | null): TimeState {
  return timeState(idx.nodes.get(id)?.when, t);
}

/** Visibility of one claim under lens, time and perspective filters. */
export function edgeVis(idx: GraphIndex, e: GEdge, f: Filters, layers: Set<string> | null): Vis {
  if (layers && !e.layers.some((l) => layers.has(l))) return 'hide';
  const time = edgeTime(idx, e, f.t);
  if (time === 'future') return 'hide';
  if (isAttributed(e)) {
    if (f.perspective === 'facts') return 'hide';
    if (f.perspective !== 'all' && !e.according_to.includes(f.perspective)) return 'dim';
  }
  if (e.status === 'deprecated') return 'dim';
  return time === 'past' ? 'past' : 'show';
}

// --- passive holdings ("index funds") -------------------------------------------------------------

export const META_ID = '__index_funds';
export const META_LABEL = 'Index funds';

export interface PassiveModel {
  edges: GEdge[];
  /** Organizations holding shares passively, sorted. */
  holders: string[];
  /** Holders whose every claim is passive: they fold into the meta-node when collapsed. */
  absorbed: Set<string>;
  /** Held entity -> passive claims pointing at it. */
  byTarget: Map<string, GEdge[]>;
}

export function passiveModel(idx: GraphIndex): PassiveModel {
  const edges = [...idx.edges.values()].filter((e) => e.passive);
  const holders = [...new Set(edges.map((e) => e.from))].sort();
  const absorbed = new Set(holders.filter((h) => (idx.incident.get(h) ?? []).every((e) => e.passive)));
  const byTarget = new Map<string, GEdge[]>();
  for (const e of edges) {
    const list = byTarget.get(e.to) ?? [];
    list.push(e);
    byTarget.set(e.to, list);
  }
  return { edges, holders, absorbed, byTarget };
}

export const metaEdgeId = (target: string): string => `${META_ID}>${target}`;

/** Best of several visibilities. */
export function bestVis(list: Vis[]): Vis {
  if (list.includes('show')) return 'show';
  if (list.includes('past')) return 'past';
  if (list.includes('dim')) return 'dim';
  return 'hide';
}
