// Reading claims as sentences, shared by the explorer and the story player.
import { nameOf, type GraphIndex } from './data';
import type { GEdge, SourceDef } from './types';

export interface Sentence {
  subject: string;
  subjectId: string;
  phrase: string;
  object: string;
  objectId: string;
  detail: string | null;
  /** A comma follows the subject: "Mary Maxwell Gates, mother of Bill Gates". */
  apposition: boolean;
}

/**
 * The `role` of a kinship claim ("mother"), or null. It describes the claim's owner (`from`), never
 * the target: `mary-maxwell-gates relative_of bill-gates, role: mother` means Mary is Bill's mother.
 */
export function kinshipRole(idx: GraphIndex, e: GEdge): string | null {
  const role = idx.data.relations[e.rel]?.kinship ? e.qualifiers?.role : null;
  return typeof role === 'string' && role.trim() ? role.trim() : null;
}

/** The claim's qualifiers as text, less a kinship role (which belongs next to the owner's name). */
export function detailOf(idx: GraphIndex, e: GEdge): string | null {
  const detail = e.detail?.trim() || null;
  const role = kinshipRole(idx, e);
  if (!role || !detail) return detail;
  // The engine writes the role first: "mother" or "mother, as of 1990".
  if (detail === role) return null;
  return detail.startsWith(`${role}, `) ? detail.slice(role.length + 2) : detail;
}

/**
 * "Elon Musk founded SpaceX" when read from the claim's own side (or with no side given);
 * "SpaceX founded by Elon Musk" when read from the target's side, using relations[rel].inverse.
 * A kinship claim with a role reads from its owner whichever side asks, because the role only
 * describes the owner: "Mary Maxwell Gates, mother of Bill Gates".
 */
export function sentence(idx: GraphIndex, e: GEdge, readFrom?: string): Sentence {
  const role = kinshipRole(idx, e);
  const reverse = !role && readFrom != null && readFrom === e.to && e.to !== e.from;
  const rel = idx.data.relations[e.rel];
  const phrase = role ? `${role} of` : reverse ? (rel?.inverse ?? e.label) : (e.label || rel?.label || e.rel.replace(/_/g, ' '));
  const [a, b] = reverse ? [e.to, e.from] : [e.from, e.to];
  return {
    subject: nameOf(idx, a),
    subjectId: a,
    phrase,
    object: nameOf(idx, b),
    objectId: b,
    detail: detailOf(idx, e),
    apposition: !!role,
  };
}

export function sentenceText(s: Sentence): string {
  return `${s.subject}${s.apposition ? ',' : ''} ${s.phrase} ${s.object}${s.detail ? ` (${s.detail})` : ''}`;
}

/** A reveal_claims entry "<entity>#<claim>" matches that edge and any "<entity>#<claim>/<n>" edges. */
export function claimRefMatches(edgeId: string, ref: string): boolean {
  return edgeId === ref || edgeId.startsWith(ref + '/');
}

export function edgesForRef(idx: GraphIndex, ref: string): GEdge[] {
  const exact = idx.edges.get(ref);
  if (exact) return [exact];
  const out: GEdge[] = [];
  for (const [id, e] of idx.edges) if (claimRefMatches(id, ref)) out.push(e);
  return out;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "1962-10-22" -> "22 Oct 1962"; "2026-08" -> "Aug 2026"; anything else unchanged. */
export function prettyDate(s: string | null | undefined): string {
  if (!s) return '';
  const m = /^(-?\d{4})(?:-(\d{2}))?(?:-(\d{2}))?$/.exec(s);
  if (!m) return s;
  const y = Number(m[1]);
  const year = y <= 0 ? `${1 - y} BCE` : String(y);
  if (!m[2]) return year;
  const mon = MONTHS[Number(m[2]) - 1] ?? '';
  return m[3] ? `${Number(m[3])} ${mon} ${year}` : `${mon} ${year}`;
}

export interface SourceView {
  id: string;
  title: string;
  url: string | null;
  publisher: string;
  published: string;
  tier: string;
  at: string | null;
  quote: string | null;
  archive: string | null;
}

export function sourceView(idx: GraphIndex, id: string, at?: string | null, quote?: string | null): SourceView {
  const s: SourceDef | undefined = idx.data.sources[id];
  return {
    id,
    title: s?.title ?? id,
    url: s?.url ?? null,
    publisher: s?.publisher_name ?? (s?.publisher ? nameOf(idx, s.publisher) : ''),
    published: s?.published_label ?? prettyDate(s?.published),
    tier: s?.tier ?? '',
    at: at ?? null,
    quote: quote ?? null,
    archive: s?.archive_url ?? null,
  };
}
