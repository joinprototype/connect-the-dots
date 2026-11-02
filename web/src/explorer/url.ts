import type { GraphIndex } from '../lib/data';
import { roundYear } from '../lib/dates';
import { currentUrl, pushUrl, replaceUrl } from '../lib/history';
import { candidates } from '../lib/search';

/** Explorer state in the query string: focus, link, lens, p, t, from, to. */
export interface UrlState {
  focus: string | null;
  /** The link whose proof is open. */
  link: string | null;
  lens: string;
  p: string;
  t: number | null;
  from: string | null;
  to: string | null;
}

/** An entity id, or a name or alias typed by a person ("Bill Gates", "JFK"), resolved to an id. Aliases
 *  are looked up through search (the slim file has names only). */
async function resolveEntity(idx: GraphIndex, value: string | null | undefined): Promise<string | null> {
  const v = (value ?? '').trim();
  if (!v) return null;
  if (idx.nodes.has(v)) return v;
  const key = v.toLocaleLowerCase();
  for (const n of idx.data.nodes) if (n.name.toLocaleLowerCase() === key) return n.id;
  const found = await candidates(v).catch(() => []);
  return found.find((e) => idx.nodes.has(e.id) && e.aliases?.some((a) => a.toLocaleLowerCase() === key))?.id ?? null;
}

export async function readUrl(idx: GraphIndex): Promise<UrlState> {
  const q = new URLSearchParams(location.search);
  const [focus, from, to] = await Promise.all(['focus', 'from', 'to'].map((k) => resolveEntity(idx, q.get(k))));
  const lens = q.get('lens');
  const p = q.get('p');
  const t = q.get('t');
  const tn = t != null && t !== '' ? Number(t) : NaN;
  const link = q.get('link');
  return {
    focus,
    link: link && idx.edges.has(link) ? link : null,
    lens: lens && idx.lenses.has(lens) ? lens : 'all',
    p: p === 'facts' || (p && idx.perspectives.has(p)) ? p : 'all',
    t: Number.isFinite(tn) ? tn : null,
    from,
    to,
  };
}

/** Where an address stands: a change here is a step Back can undo, a filter's is not. */
const placeOf = (url: URL) => ['focus', 'link', 'from', 'to'].map((k) => url.searchParams.get(k)).join(' ');

export function writeUrl(s: UrlState, tidy = false): void {
  const q = new URLSearchParams();
  if (s.focus) q.set('focus', s.focus);
  if (s.link) q.set('link', s.link);
  if (s.lens && s.lens !== 'all') q.set('lens', s.lens);
  if (s.p && s.p !== 'all') q.set('p', s.p);
  if (s.t != null) q.set('t', String(roundYear(s.t)));
  if (s.from) q.set('from', s.from);
  if (s.to) q.set('to', s.to);
  const qs = q.toString();
  const before = currentUrl();
  const url = new URL(before);
  url.search = qs;
  if (url.href === before.href) return;
  if (!tidy && placeOf(url) !== placeOf(before)) pushUrl(url);
  // Coalesced and guarded: Safari throws after 100 history writes in 10 s (the time slider used to hit it).
  else replaceUrl(url);
}

export function explorerHref(s: Partial<UrlState>): string {
  const q = new URLSearchParams();
  for (const k of ['focus', 'link', 'lens', 'p', 't', 'from', 'to'] as const) {
    const v = s[k];
    if (v != null && v !== '') q.set(k, typeof v === 'number' ? String(roundYear(v)) : v);
  }
  const qs = q.toString();
  return `/x/${qs ? `?${qs}` : ''}`;
}
