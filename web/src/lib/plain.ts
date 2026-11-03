// Plain words for the reader. Readers never see tier codes, "claims", "edges", costs or hops.
import type { GraphData, GEdge } from './types';

/** Shown wherever connections are: on Ask's ways, on Stories, in stories and on the map. */
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
function ownNotes(e: GEdge): string[] {
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

/** What a link's card says besides its proof, closing on the sentence its relation asks for (ADR-0027). */
export function claimNotes(e: GEdge): string[] {
  return e.caveat ? [...ownNotes(e), e.caveat] : ownNotes(e);
}
