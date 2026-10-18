import type { GraphIndex } from '../lib/data';
import { roundYear } from '../lib/dates';
import { currentUrl, replaceUrl } from '../lib/history';
import { candidates } from '../lib/search';

/** Explorer state in the query string: focus, lens, p, t, from, to, view. */
export interface UrlState {
  focus: string | null;
  lens: string;
  p: string;
  t: number | null;
  from: string | null;
  to: string | null;
  /** "graph" (default) or "world": the whole-map tile viewer. */
  view: 'graph' | 'world';
}

/** An entity id, or a name or alias typed by a person ("Bill Gates", "JFK"), resolved to an id. Aliases
 *  are looked up through search (the slim file has names only). */
export async function resolveEntity(idx: GraphIndex, value: string | null | undefined): Promise<string | null> {
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
  return {
    focus,
    lens: lens && idx.lenses.has(lens) ? lens : 'all',
    p: p === 'facts' || (p && idx.perspectives.has(p)) ? p : 'all',
    t: Number.isFinite(tn) ? tn : null,
    from,
    to,
    view: q.get('view') === 'world' ? 'world' : 'graph',
  };
}

export function writeUrl(s: UrlState): void {
  const q = new URLSearchParams();
  if (s.focus) q.set('focus', s.focus);
  if (s.lens && s.lens !== 'all') q.set('lens', s.lens);
  if (s.p && s.p !== 'all') q.set('p', s.p);
  if (s.t != null) q.set('t', String(roundYear(s.t)));
  if (s.from) q.set('from', s.from);
  if (s.to) q.set('to', s.to);
  if (s.view === 'world') q.set('view', 'world');
  const qs = q.toString();
  // Coalesced and guarded: Safari throws after 100 history writes in 10 s (the time slider used to hit it).
  const url = currentUrl();
  url.search = qs;
  replaceUrl(url);
}

export function explorerHref(s: Partial<UrlState>): string {
  const q = new URLSearchParams();
  for (const k of ['focus', 'lens', 'p', 't', 'from', 'to', 'view'] as const) {
    const v = s[k];
    if (k === 'view' && v === 'graph') continue;
    if (v != null && v !== '') q.set(k, typeof v === 'number' ? String(roundYear(v)) : v);
  }
  const qs = q.toString();
  return `/x/${qs ? `?${qs}` : ''}`;
}
