// The words that lie on the Stories surface beside what they speak of: an island, an entry and its links, a
// link and its proof, a way between two entries. Plain HTML from the data, every value escaped; nothing from
// the address or a field is ever printed (BUILD.md).
import { sentence, sourceView } from '../lib/claims';
import type { Details } from '../lib/data';
import { claimNotes, NOTICE, statusWords, tierLabel } from '../lib/plain';
import { across, type World } from './model';

const esc = (s: unknown): string => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);
const part = (id: string): string => encodeURIComponent(id);

/** Most rows a group of links shows; the rest are on the entry's page. */
const ROWS = 12;
/** Most stories an entry lists. */
const TALES = 5;

export const entryHref = (w: World, i: number): string => `#/e/${part(w.ids[i])}`;
export const lineHref = (w: World, l: number, from: number): string => `#/l/${part(w.links[l].id)}/${part(w.ids[from])}`;
export const wayHref = (w: World, a: number, b: number, step?: number): string =>
  `#/w/${part(w.ids[a])}/${part(w.ids[b])}${step === undefined ? '' : `/${step}`}`;

const pip = (w: World, i: number): string => `<span class="place-pip" style="--c: ${esc(w.kinds[w.kind[i]].ink)}"></span>`;

function row(href: string, lead: string, name: string, tail: string, attrs = ''): string {
  return `<a class="place-row" href="${href}"${attrs}>${lead}<span class="place-name">${name}</span><small>${esc(tail)}</small></a>`;
}

function taleRows(w: World, stories: number[]): string {
  const shown = stories.slice(0, TALES).map((s) => {
    const isle = w.isles[s];
    return `<a class="place-row place-tale" href="/c/${part(isle.id)}/"><span></span><span class="place-name">${esc(isle.title)}</span><small>${isle.scenes} scenes</small></a>`;
  });
  const more = stories.length - TALES;
  return shown.join('') + (more > 0 ? `<p class="place-note">And ${more} more ${more === 1 ? 'story' : 'stories'}, on its page.</p>` : '');
}

/** An island: its story's name on a black band, as a story opens, the way in, and the subjects of its scenes. */
export function isleWords(w: World, s: number): string {
  const isle = w.isles[s];
  const subjects = [...new Set(isle.trail)].slice(0, 16);
  return `<div class="place-band"><p>Story, ${isle.scenes} scenes</p><h2>${esc(isle.title)}</h2>${isle.subtitle ? `<p class="place-sub">${esc(isle.subtitle)}</p>` : ''}</div>
    <p><a class="place-read" href="/c/${part(isle.id)}/">Read the story</a></p>
    ${subjects.length ? `<p class="place-head">What its scenes are about</p>${subjects.map((i) => row(entryHref(w, i), pip(w, i), esc(w.names[i]), w.when[i])).join('')}` : ''}`;
}

/** An entry: what it is, the stories through it, the way to another, and its links grouped by what they say.
 *  Its summary and what open data holds arrive with its detail file (`fill`). */
export function entryWords(w: World, i: number, uid: number): string {
  const { relations } = w.idx.data;
  const id = w.ids[i];
  const groups = new Map<string, { label: string; caveat: string | null; links: number[] }>();
  for (const l of w.adj[i]) {
    const e = w.links[l];
    const out = w.la[l] === i;
    const key = (out ? '>' : '<') + e.rel;
    const r = relations[e.rel];
    if (!groups.has(key)) groups.set(key, { label: (out ? r?.label : r?.inverse) ?? e.rel.replace(/_/g, ' '), caveat: r?.caveat ?? null, links: [] });
    groups.get(key)!.links.push(l);
  }
  let links = '';
  for (const g of [...groups.values()].sort((a, b) => b.links.length - a.links.length || a.label.localeCompare(b.label))) {
    // one row for each entry at the other end, the best-connected first
    const ends = new Map<number, number[]>();
    for (const l of g.links) {
      const o = across(w, l, i);
      ends.set(o, [...(ends.get(o) ?? []), l]);
    }
    const sorted = [...ends].sort((a, b) => w.degree[b[0]] - w.degree[a[0]] || a[0] - b[0]);
    links += `<p class="place-head">${esc(cap(g.label))}</p>${g.caveat ? `<p class="place-note">${esc(g.caveat)}</p>` : ''}`;
    links += sorted
      .slice(0, ROWS)
      .map(([o, ls]) => row(lineHref(w, ls[0], i), pip(w, o), esc(w.names[o]), ls.length > 1 ? `${ls.length} links` : (w.links[ls[0]].when?.label ?? ''), ` data-line="${ls[0]}"`))
      .join('');
    if (sorted.length > ROWS) links += `<p class="place-note"><a href="/e/${part(id)}/">And ${sorted.length - ROWS} more, on its page</a></p>`;
  }
  const kind = w.kinds[w.kind[i]].label;
  const stories = w.told[i];
  return `<h2>${esc(w.names[i])}</h2><p class="place-what">${esc(kind + (w.when[i] ? `, ${w.when[i]}` : ''))}</p>
    <div class="place-lede" data-sum></div>
    <p class="place-go"><a href="/e/${part(id)}/">Its page</a><a href="/x/?focus=${part(id)}">Walk from here</a></p>
    <form class="place-way" role="search" autocomplete="off"><label for="place-to-${uid}">The way from ${esc(w.names[i])} to</label>
      <input id="place-to-${uid}" type="search" placeholder="Another name" enterkeyhint="go" spellcheck="false" role="combobox" aria-expanded="false" aria-controls="place-hits-${uid}" aria-autocomplete="list">
      <ul id="place-hits-${uid}" class="place-hits" role="listbox" hidden></ul></form>
    ${stories.length ? `<hr><p class="place-head">${stories.length > 1 ? 'Stories through here' : 'The story through here'}</p>${taleRows(w, stories)}` : ''}
    <hr>${links || '<p class="place-note">No written link reaches this dot yet.</p>'}<p class="place-open" data-open hidden></p>`;
}

/** What arrives with an entry's detail file: its summary, and how much open data holds that nobody read. */
export function fillEntry(el: HTMLElement, d: Details | null): void {
  const sum = el.querySelector<HTMLElement>('[data-sum]');
  if (sum && d?.summary) sum.innerHTML = `<p>${esc(d.summary)}</p>`;
  const open = el.querySelector<HTMLElement>('[data-open]');
  if (open && d?.open && d.w) {
    open.innerHTML = `<span class="place-unread">Not read yet</span> Open data holds ${d.open} more ${d.open === 1 ? 'link' : 'links'} for it. <a href="/a/?q=${part(d.w)}">See them</a>`;
    open.hidden = false;
  }
}

/** A link read as a sentence from `from`'s side, with its proof under it: each source and its quote. */
export function lineWords(w: World, l: number, from: number, step = ''): string {
  const { idx } = w;
  const e = w.links[l];
  const s = sentence(idx, e, w.ids[from]);
  const name = (id: string, text: string): string => (w.byId.has(id) ? `<a href="${entryHref(w, w.byId.get(id)!)}">${esc(text)}</a>` : `<b>${esc(text)}</b>`);
  let h = `${step}<p class="place-say">${name(s.subjectId, s.subject)}${s.apposition ? ',' : ''} <i>${esc(s.phrase)}</i> ${name(s.objectId, s.object)}</p>`;
  const facts = [s.detail, e.when?.label].filter(Boolean).map(esc);
  if (facts.length) h += `<p class="place-status">${facts.join(', ')}</p>`;
  if (e.according_to.length) h += `<p class="place-status"><b>One side's account:</b> according to ${e.according_to.map((a) => esc(idx.perspectives.get(a)?.name ?? idx.nodes.get(a)?.name ?? a)).join(', ')}.</p>`;
  for (const word of statusWords(e)) h += `<p class="place-status"><span class="${word === 'Both sides agree' ? 'place-agree' : 'place-unread'}">${esc(word)}</span></p>`;
  for (const note of claimNotes(e)) h += `<p class="place-status">${esc(note)}</p>`;
  for (const ref of e.sources) {
    const v = sourceView(idx, ref.id, ref.at, ref.quote);
    const by = [v.publisher, v.published, v.at, tierLabel(idx.data, v.tier)].filter(Boolean).map(esc).join('. ');
    const open = [v.url ? `<a href="${esc(v.url)}" target="_blank" rel="external noopener noreferrer">Open the source</a>` : '', v.archive ? `<a href="${esc(v.archive)}" target="_blank" rel="external noopener noreferrer">Archived copy</a>` : '']
      .filter(Boolean)
      .join('');
    h += `<figure class="place-quote">${v.quote ? `<blockquote><mark>${esc(v.quote)}</mark></blockquote>` : ''}<figcaption><b>${esc(v.title)}</b>${by ? `. ${by}` : ''}.${open ? `<span class="place-go">${open}</span>` : ''}</figcaption></figure>`;
  }
  if (!e.sources.length) h += `<p class="place-status">Its proof is on <a href="/e/${part(e.from)}/">${esc(w.names[w.byId.get(e.from) ?? from])}'s page</a>.</p>`;
  const other = across(w, l, from);
  const more = w.adj[from].filter((x) => x !== l && across(w, x, from) === other);
  if (more.length) {
    const list = more.slice(0, 6).map((x) => `<a href="${lineHref(w, x, from)}">${esc(sentence(idx, w.links[x], w.ids[from]).phrase)}</a>`);
    h += `<p class="place-note">More links between them: ${list.join(', ')}.</p>`;
  }
  return h;
}

/** A step of a way, how to go on, and the step's proof. */
export function stepWords(w: World, a: number, b: number, steps: number[], j: number, from: number): string {
  const on = j < steps.length ? `<a href="${wayHref(w, a, b, j + 1)}">Next step</a>` : `<a href="${entryHref(w, b)}">Go to ${esc(w.names[b])}</a>`;
  const back = j > 1 ? `<a href="${wayHref(w, a, b, j - 1)}">Step back</a>` : `<a href="${wayHref(w, a, b)}">The whole way</a>`;
  const head = `<p class="place-what">Step ${j} of ${steps.length}, from ${esc(w.names[a])} to ${esc(w.names[b])}</p>`;
  return lineWords(w, steps[j - 1], from, head) + `<p class="place-go">${back}${on}</p>`;
}

/** The way between two entries: their own ties first, then the way, each step to its proof. */
export function wayWords(w: World, a: number, b: number, nodes: number[] | null, steps: number[], ties: number[]): string {
  let h = `<p class="place-what">The way between them</p><h2>${esc(w.names[a])} to ${esc(w.names[b])}</h2>`;
  if (ties.length) {
    h += `<p class="place-head">${ties.length === 1 ? 'Their own link' : 'Their own links'}</p>`;
    h += ties.map((l) => row(lineHref(w, l, a), pip(w, b), `<i>${esc(sentence(w.idx, w.links[l], w.ids[a]).phrase)}</i> ${esc(w.names[b])}`, w.links[l].when?.label ?? '', ` data-line="${l}"`)).join('');
  }
  if (nodes) {
    h += `<p class="place-head">${steps.length} ${steps.length === 1 ? 'step' : 'steps'}, each with its proof</p>`;
    h += `<div class="place-row place-start">${pip(w, a)}<span class="place-name">${esc(w.names[a])}</span><small></small></div>`;
    h += steps
      .map((l, j) => {
        const [left, right] = [nodes[j], nodes[j + 1]];
        const s = sentence(w.idx, w.links[l], w.ids[left]);
        const says = s.subjectId === w.ids[left] ? `<i>${esc(s.phrase)}</i> ${esc(w.names[right])}` : `${esc(w.names[right])}, <i>${esc(s.phrase)}</i>`;
        return row(wayHref(w, a, b, j + 1), pip(w, right), says, '', ` data-line="${l}"`);
      })
      .join('');
  } else {
    h += `<p class="place-lede">No written way joins them yet.</p><p class="place-note">A way leaves out places, legal cases and one side's accounts, so that a birthplace or a shared lawyer never reads as a tie.</p>`;
  }
  h += `<p class="place-notice">${NOTICE}</p>`;
  h += `<p class="place-go"><a href="/r/?a=${part(w.ids[a])}&amp;b=${part(w.ids[b])}">The full answer</a><a href="${entryHref(w, b)}">Go to ${esc(w.names[b])}</a></p>`;
  return h;
}
