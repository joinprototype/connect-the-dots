// Plain words for the reader. Readers never see tier codes, "claims", "edges", costs or hops.
import type { GraphIndex } from './data';
import type { GraphData, GEdge } from './types';
import type { PathResult } from './paths';

/** Shown wherever connections are: on route explanations, under the explorer and on the map. */
export const NOTICE = 'A connection is not evidence of wrongdoing.';

/** Fallback for a schema.json without `tiers` (content/schema/source-tiers.yaml is the source). */
const TIER_LABELS: Record<string, string> = {
  T1: 'Primary record',
  T2: 'Scholarship & press',
  T3: 'Self-published',
  T4: 'Withdrawn source',
};

export function tierLabel(data: GraphData | null | undefined, tier: string | null | undefined): string {
  if (!tier) return '';
  return data?.tiers?.[tier]?.label ?? TIER_LABELS[tier] ?? '';
}

/** The life story of an entry, once its details are loaded, if the build made one. */
export function entityStoryUrl(idx: GraphIndex, id: string): string | null {
  return idx.details.get(id)?.story ?? null;
}

/** The story of a route, if one exists for this direction (path stories are directional: a--b only). */
export function routeStoryUrl(data: GraphData, from: string, to: string): string | null {
  const key = `${from}--${to}`;
  return data.stories?.paths.includes(key) ? `/p/${encodeURIComponent(from)}--${encodeURIComponent(to)}/` : null;
}

const RANK: Record<string, number> = { T1: 1, T2: 2, T3: 3, T4: 4 };

/** "2 links, all backed by primary records", "3 links, backed by primary records and scholarship & press; 1 being verified". */
export function routeSummary(data: GraphData, path: PathResult): string {
  const hops = path.hops;
  const n = hops.length;
  const links = `${n} ${n === 1 ? 'link' : 'links'}`;
  const tiers = hops.map((h) => (h.edge.tier && RANK[h.edge.tier]) || 9);
  const worst = Math.max(...tiers, 1);
  const best = Math.min(...tiers, 9);
  let backing: string;
  if (worst === 1) backing = n === 1 ? 'backed by a primary record' : 'all backed by primary records';
  else if (worst === 2 && best === 2) backing = n === 1 ? 'backed by scholarship & press' : 'all backed by scholarship & press';
  else if (worst === 2) backing = 'backed by primary records and scholarship & press';
  else {
    const weak = tiers.filter((r) => r >= 3).length;
    backing = `${weak} backed only by ${tierLabel(data, 'T3').toLowerCase() || 'self-published'} sources`;
  }
  const extra: string[] = [];
  const draft = hops.filter((h) => h.edge.status === 'draft').length;
  const side = hops.filter((h) => h.edge.according_to.length > 0).length;
  if (side) extra.push(`${side} ${side === 1 ? "is one side's account" : "are one side's accounts"}`);
  if (draft) extra.push(`${draft} being verified`);
  return [`${links}, ${backing}`, ...extra].join('; ');
}

/** The word for a link that is no longer plain fact, as on its badge. */
const STATUS_WORD = new Map([
  ['disputed', 'Disputed'],
  ['deprecated', 'Withdrawn'],
]);

/** Status words for a link (badges). */
export function statusWords(e: GEdge): string[] {
  const out: string[] = [];
  if (e.cross_confirmed) out.push('Both sides agree');
  if (e.status === 'draft') out.push('Being verified');
  const word = STATUS_WORD.get(e.status);
  if (word) out.push(word);
  return out;
}

/**
 * The lines under a link, as on its entry page: why it is disputed or withdrawn ("Disputed: <reason>"),
 * then the author's note when it says something the reason does not. A note that only repeats the reason
 * is left out; one that repeats it and says more replaces it.
 */
export function claimNotes(e: GEdge): string[] {
  const word = STATUS_WORD.get(e.status);
  const unprefixed = (s: string) => (word ? s.replace(new RegExp(`^${word}\\s*:\\s*`, 'i'), '') : s);
  const reason = unprefixed(e.reason?.trim() ?? '');
  const note = e.note?.trim() ?? '';
  const why = (s: string) => (word ? `${word}: ${unprefixed(s)}` : s);
  if (!reason) return note ? [note] : [];
  if (!note) return [why(reason)];
  const plain = (s: string) => unprefixed(s).toLowerCase().replace(/\s+/g, ' ').replace(/[\s.…]+$/, '');
  if (plain(reason).includes(plain(note))) return [why(reason)];
  if (plain(note).includes(plain(reason))) return [why(note)];
  return [why(reason), note];
}
