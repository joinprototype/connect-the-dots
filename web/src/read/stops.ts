// What a door opens, as HTML (main.ts places it): the step that joins a name to where the reader was,
// with its proof open; the name itself; and what goes on from it, each with its reason. Every name and
// word here comes from the data files, never from the address.
import type { GraphIndex } from '../lib/data';
import { kinshipRole, sentence, sourceView } from '../lib/claims';
import type { PathResult } from '../lib/paths';
import { claimNotes, NOTICE, statusWords, tierLabel } from '../lib/plain';
import type { GEdge, GNode } from '../lib/types';

/** Each kind's ink, which every Read page carries (`#read-site`), and data/read.json (read.rs), which
 *  comes with the record: until then its lists are empty. */
export interface SiteData {
  inks: Record<string, string>;
  /** Every written story: id, title, subtitle, scenes. */
  stories: [string, string, string | null, number][];
  /** Sealed entries and what is about them: no step goes on from them (ADR-0027). */
  sealed: string[];
  /** Relations a place or a school does not list as its own links (born in, citizen of: ADR-0016). */
  background: string[];
}

/** A story an entry is in, as data/stories.json lists them: title and address. */
export type StoryRow = [string, string];

/** A link of an entry's, and how much it is worth showing first. */
export interface Row {
  e: GEdge;
  other: GNode;
  score: number;
}

/** Types that join nothing: a people or a faith is never a step from one person to another (ADR-0016). */
const ALONE = new Set(['group', 'tradition']);

export function esc(s: string | null | undefined): string {
  return String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);
}

function el(tag: string, cls: string, html: string): HTMLElement {
  const e = document.createElement(tag);
  e.className = cls;
  e.innerHTML = html;
  return e;
}

/** No step goes on from it: it is sealed, about a sealed entry, or a people or a faith. */
export function joinsNothing(idx: GraphIndex, site: SiteData, id: string): boolean {
  return site.sealed.includes(id) || ALONE.has(idx.nodes.get(id)?.type ?? '');
}

export const inkOf = (site: SiteData, type: string | undefined): string => site.inks[type ?? ''] ?? 'currentColor';

const mark = (site: SiteData, n: GNode | undefined, cls = '') => `<i class="read-mark${cls}" style="--c: ${esc(inkOf(site, n?.type))}"></i>`;

/** A door to a name in the thread, or the plain name where no step may go. */
function door(idx: GraphIndex, site: SiteData, n: GNode, from: string, e: GEdge | null): string {
  if (joinsNothing(idx, site, n.id) || joinsNothing(idx, site, from) || e?.status === 'deprecated') return esc(n.name);
  return `<a class="read-door" href="/e/${esc(n.id)}/" style="--door: ${esc(inkOf(site, n.type))}"${e ? ` data-edge="${esc(e.id)}"` : ''}>${esc(n.name)}</a>`;
}

/** Whose account a link is, and what stands against it, in plain words. */
function standing(idx: GraphIndex, e: GEdge): string {
  const said = e.according_to.map((p) => idx.nodes.get(p)?.name ?? idx.perspectives.get(p)?.name ?? p);
  const bits = [...(said.length ? [`According to ${said.join(' and ')}`] : []), ...statusWords(e), ...claimNotes(e)];
  return bits.map((b) => esc(/[.!?]$/.test(b) ? b : `${b}.`)).join(' ');
}

/** The quoted words of a link's sources, on grey, each with where it is from. */
export function proofHTML(idx: GraphIndex, e: GEdge, most = 3): string {
  const out = e.sources.slice(0, most).map((ref) => {
    const s = sourceView(idx, ref.id, ref.at, ref.quote);
    const by = ref.by ? `${esc(idx.nodes.get(ref.by)?.name ?? '')}, in: ` : '';
    const what = [s.title, s.publisher && s.publisher !== s.title ? s.publisher : '', s.published].filter(Boolean).join(', ');
    const links = [s.url && `<a href="${esc(s.url)}" target="_blank" rel="noopener">Open the source</a>`, s.archive && `<a href="${esc(s.archive)}" target="_blank" rel="noopener">Archived copy</a>`].filter(Boolean).join(' ');
    return `<figure class="read-quote">${s.quote ? `<blockquote><mark>${esc(s.quote)}</mark></blockquote>` : ''}<figcaption>${by}${esc(what)}.${s.at ? ` ${esc(s.at)}.` : ''} ${esc(tierLabel(idx.data, s.tier))}. ${links}</figcaption></figure>`;
  });
  const more = e.sources.length - most;
  if (more > 0) out.push(`<p class="read-more-src">And ${more} more ${more === 1 ? 'source' : 'sources'}.</p>`);
  return out.join('') || '<p class="read-more-src">This link has no quote on file.</p>';
}

/** How a link reads from `from`: its phrase alone when `from` says it, else the whole sentence. */
function said(idx: GraphIndex, e: GEdge, from: string | null): string {
  const s = sentence(idx, e, from ?? undefined);
  const line = s.subjectId === from ? esc(s.phrase) : `${esc(s.subject)}${s.apposition ? ',' : ''} ${esc(s.phrase)} ${esc(s.object)}`;
  return `${line}${s.detail ? `, ${esc(s.detail)}` : ''}${e.when ? `<small>${esc(e.when.label)}</small>` : ''}`;
}

/** The step from where the reader was to the name: the link's words and its proof, open. Without a
 *  link, only that the story names it. */
export function stepEl(idx: GraphIndex, site: SiteData, e: GEdge | null, from: string | null, named: string): HTMLElement {
  const f = from ? idx.nodes.get(from) : undefined;
  let html = f ? `<p class="read-from">${mark(site, f)}${esc(f.name)}</p>` : `<p class="read-from">${mark(site, undefined, ' small')}${esc(named)}</p>`;
  if (!e) html += `<p class="read-rel">names it</p>`;
  else {
    html += `<p class="read-rel">${said(idx, e, from)}</p>`;
    const note = standing(idx, e);
    if (note) html += `<p class="read-note">${note}</p>`;
    html += proofHTML(idx, e);
  }
  return el('div', 'read-step', html);
}

/** The way between two names, step by step, each step's proof one tap away. */
export function wayEl(idx: GraphIndex, site: SiteData, path: PathResult): HTMLElement {
  const [a, b] = [path.nodes[0], path.nodes[path.nodes.length - 1]].map((id) => idx.nodes.get(id)!);
  const n = path.hops.length;
  let html = `<p class="read-lead">From ${esc(a.name)} to ${esc(b.name)}, ${n === 1 ? 'one step' : `${n} steps`}.</p>`;
  const long = n > 5;
  if (long) {
    const beads = path.nodes.map((id) => `<i style="--c: ${esc(inkOf(site, idx.nodes.get(id)?.type))}"></i>`).join('');
    html += `<button class="read-showway" type="button" aria-expanded="false"><span class="read-chain">${beads}</span>Show the ${n} steps</button>`;
  }
  html += `<div class="read-hops"${long ? ' hidden' : ''}>`;
  for (const hop of path.hops) {
    const f = idx.nodes.get(hop.from)!;
    html += `<div class="read-hop">${mark(site, f)}<p class="read-hop-nm">${esc(f.name)}</p>
      <div class="read-ln" data-edge="${esc(hop.edge.id)}"><span>${said(idx, hop.edge, hop.from)}</span><button class="read-pf" type="button" aria-expanded="false">proof</button><div class="read-pr" hidden></div></div></div>`;
  }
  html += `</div><p class="read-caveat">Each step is on the record, with its proof. ${NOTICE}</p>`;
  return el('div', 'read-way', html);
}

/** The name the reader landed on. */
export function headEl(idx: GraphIndex, site: SiteData, n: GNode, summary: string | null): HTMLElement {
  const kind = [idx.data.types[n.type]?.label, n.when?.label].filter(Boolean).join(', ');
  return el('header', 'read-head', `${mark(site, n, ' big')}<h2 tabindex="-1">${esc(n.name)}</h2><p class="read-kind">${esc(kind)}</p>${summary ? `<p class="read-sum">${esc(summary)}</p>` : ''}`);
}

/** Its links, the ones worth showing first on top: links routes may use, to names in stories, with the
 *  strongest proof. A place's births and passports and a school's pupils are not its links (ADR-0016). */
export function rowsOf(idx: GraphIndex, site: SiteData, id: string, inStories: (id: string) => number): Row[] {
  const tiers = Object.keys(idx.data.tiers ?? {});
  const seen = new Set<string>();
  const out: Row[] = [];
  for (const e of idx.incident.get(id) ?? []) {
    const o = e.from === id ? e.to : e.from;
    const other = idx.nodes.get(o);
    if (!other || o === id || (e.to === id && site.background.includes(e.rel))) continue;
    const rank = e.tier ? tiers.indexOf(e.tier) + 1 || 4 : 4;
    const score =
      (seen.has(o) ? -3 : 0) + (e.traversable ? 2 : 0) + (e.status === 'deprecated' ? -4 : 0) + (e.passive ? -3 : 0) + Math.min(inStories(o), 4) * 0.6 + (4 - rank) * 0.5 + Math.min(other.degree, 40) / 40;
    seen.add(o);
    out.push({ e, other, score });
  }
  return out.sort((a, b) => b.score - a.score);
}

/** The phrase over a row, read from the entry's side: "founded", "founded by", "mother". */
function rowPhrase(idx: GraphIndex, e: GEdge, id: string): string {
  const role = kinshipRole(idx, e);
  const rel = idx.data.relations[e.rel];
  if (role) return e.from === id ? `${role} of` : role;
  return e.from === id ? (rel?.label ?? e.label) : (rel?.inverse ?? e.label);
}

export function rowEl(idx: GraphIndex, site: SiteData, id: string, r: Row): HTMLElement {
  const aside = [...(r.e.according_to.length ? [`According to ${r.e.according_to.map((p) => idx.nodes.get(p)?.name ?? idx.perspectives.get(p)?.name ?? p).join(' and ')}`] : []), ...statusWords(r.e)];
  const li = el(
    'li',
    'read-row',
    `<i class="read-dot" style="--c: ${esc(inkOf(site, r.other.type))}"></i><div><span class="read-ph">${esc(rowPhrase(idx, r.e, id))}${r.e.when ? ` <span>${esc(r.e.when.label)}</span>` : ''}</span>
    <span class="read-nm">${door(idx, site, r.other, id, r.e)}</span>${aside.length ? `<span class="read-aside">${esc(aside.join('. '))}.</span>` : ''}</div>
    <button class="read-pf" type="button" aria-expanded="false">proof</button><div class="read-pr" hidden></div>`,
  );
  li.dataset.edge = r.e.id;
  li.dataset.other = r.other.id;
  return li;
}

/** What goes on from a name: the way back to the story first, then a story it is in, with why that
 *  one is offered, then its links on the record, then how much open data holds that nobody here read. */
export function doorsEl(
  idx: GraphIndex,
  site: SiteData,
  n: GNode,
  opts: { back: string; left: number; book: { title: string; subtitle: string | null; url: string } | null; also: StoryRow[]; rows: Row[]; open: number | null },
): HTMLElement {
  const box = el('div', 'read-doors', '');
  let html = `<p class="read-back-line"><button class="read-back" type="button">Back to ${esc(opts.back)}</button>${opts.left ? `, ${opts.left === 1 ? 'one scene' : `${opts.left} scenes`} left` : ''}.</p>`;
  if (opts.book) {
    html += `<a class="read-book" href="${esc(opts.book.url)}"><b>${esc(opts.book.title)}</b>${opts.book.subtitle ? `<span>${esc(opts.book.subtitle)}</span>` : ''}</a>`;
    html += `<p class="read-why">${esc(n.name)} is in this story too, and that is all this says.</p>`;
  }
  if (opts.also.length) html += `<p class="read-also">${opts.book ? 'Also in' : 'In'} ${opts.also.map(([title, url]) => `<a href="${esc(url)}">${esc(title)}</a>`).join(', ')}.</p>`;
  box.innerHTML = html;
  const { rows } = opts;
  if (rows.length) {
    box.append(el('h3', 'read-links', rows.length === 1 ? 'One link on the record' : `${rows.length.toLocaleString('en')} links on the record`));
    const ul = el('ul', 'read-rows', '');
    rows.slice(0, 8).forEach((r) => ul.append(rowEl(idx, site, n.id, r)));
    box.append(ul);
    if (rows.length > 8) {
      const more = el('button', 'read-showall', `and ${(rows.length - 8).toLocaleString('en')} more`);
      more.setAttribute('type', 'button');
      more.addEventListener('click', () => {
        // all of them, by what they say
        const groups = new Map<string, Row[]>();
        for (const r of rows) {
          const k = rowPhrase(idx, r.e, n.id);
          groups.set(k, [...(groups.get(k) ?? []), r]);
        }
        ul.textContent = '';
        for (const [k, list] of [...groups].sort((x, y) => y[1].length - x[1].length)) {
          ul.append(el('li', 'read-grp', `${esc(k)} <span>${list.length.toLocaleString('en')}</span>`));
          list.forEach((r) => ul.append(rowEl(idx, site, n.id, r)));
        }
        more.remove();
      });
      box.append(more);
    }
  }
  if (opts.open) {
    box.append(el('p', 'read-open', `Open data holds ${opts.open.toLocaleString('en')} more ${opts.open === 1 ? 'link' : 'links'} for ${esc(n.name)}, which nobody here has read. <a href="/e/${esc(n.id)}/">They are on its page</a>.`));
  }
  box.append(el('p', 'read-caveat', NOTICE));
  return box;
}
