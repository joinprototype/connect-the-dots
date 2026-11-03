// The answers under the box, one for each thing it understands: two names, a name, a question, a year,
// nothing yet, or nothing it can answer. Each says in the box's own words what the record holds, every
// link opens its proof, and each comes with its picture. Words come from entries and from fixed sentences
// here, never from the address. What is sealed, or about or named after something sealed, is no stop of
// a way, no dot around one, and no story or question offered next (ADR-0027).
import { atlasEntry, KINDS } from '../lib/atlas';
import { routeBetween } from '../lib/atlas-route';
import { detailOf, kinshipRole, sentence, sentenceText, sourceView } from '../lib/claims';
import { loadDetails, nameOf, type GraphIndex } from '../lib/data';
import { formatYearNumber } from '../lib/dates';
import { el } from '../lib/dom';
import { hash01 } from '../lib/hash';
import { findPaths, type PathResult } from '../lib/paths';
import { claimNotes, NOTICE, routeStoryUrl, statusWords, tierLabel } from '../lib/plain';
import type { GEdge, GNode, SearchEntry } from '../lib/types';
import type { Mark, View } from './field';
import { GREY, inkOf, loadRecord, storiesWith, type Part, type Pick, type Record, type Story } from './record';
import { fit, phone, radius, relax, type Build, type Dot, type Line, type Point, type Spring } from './stage';

export type State =
  | { kind: 'pair'; a: string; b: string; way: number }
  | { kind: 'name'; id: string }
  | { kind: 'question'; q: string; id: string }
  | { kind: 'year'; year: number }
  | { kind: 'empty' }
  /** What was typed found nothing to answer: the names it did find. It has no address. */
  | { kind: 'none'; found: SearchEntry[] };

export interface Answer {
  /** What was asked, rebuilt from the entries: the box shows it. */
  parts: Part[];
  body: Node[];
  scene: Build;
  /** The stops of a way, which bring their dots forward as the reader reaches them. */
  steps?: { els: HTMLElement[]; ids: string[] };
}

const enc = encodeURIComponent;

/** A state's address: entry ids and numbers only, so that no address can put words on the page. */
export function addressOf(s: State): string {
  switch (s.kind) {
    case 'pair':
      return `/ask/?a=${enc(s.a)}&b=${enc(s.b)}${s.way ? `&way=${s.way}` : ''}`;
    case 'name':
      return `/ask/?a=${enc(s.id)}`;
    case 'question':
      return `/ask/?q=${enc(s.q)}&a=${enc(s.id)}`;
    case 'year':
      return `/ask/?y=${s.year}`;
    default:
      return '/ask/';
  }
}

/** The state an address asks for, or null for the page as it arrives. */
export function stateOf(search: string): State | null {
  const p = new URLSearchParams(search);
  const [a, b, q, y] = ['a', 'b', 'q', 'y'].map((k) => p.get(k));
  if (a && b) return { kind: 'pair', a, b, way: Math.max(0, Math.floor(Number(p.get('way'))) || 0) };
  if (a && q) return { kind: 'question', q, id: a };
  if (a) return { kind: 'name', id: a };
  if (y && /^-?\d{1,4}$/.test(y)) return { kind: 'year', year: Number(y) };
  return null;
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const count = (n: number) => NUMBERS[n] ?? String(n);
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const times = (n: number) => (n === 1 ? 'once' : n === 2 ? 'twice' : `${count(n)} times`);
const short = (s: string) => (s.length > 130 ? `${s.slice(0, 128).replace(/\s+\S*$/, '')}…` : s);

/** Faint dots around each stop of a way, and the dots of a web. */
const context = () => (phone() ? 4 : 9);
const webSize = () => (phone() ? 26 : 42);

const link = (text: string, href: string, cls = ''): HTMLAnchorElement => {
  const a = el('a', cls, text);
  a.href = href;
  return a;
};

const outside = (text: string, href: string): HTMLAnchorElement => {
  const a = link(text, href);
  a.target = '_blank';
  a.rel = 'external noopener noreferrer';
  return a;
};

const dot = (ink: string, open = false): HTMLElement => {
  const d = el('i', `ask-dot${open ? ' is-open' : ''}`);
  d.style.setProperty('--c', ink);
  return d;
};

const other = (e: GEdge, id: string) => (e.from === id ? e.to : e.from);
/** A link a way may use: what stays off ways stays off the pictures too. */
const walks = (e: GEdge) => e.traversable && !e.passive && e.status !== 'deprecated';
const asName = (idx: GraphIndex, id: string): Part => [idx.nodes.get(id)?.name ?? id, id, inkOf(idx, idx.nodes.get(id)?.type)];

/** What an entry also touches, best-connected first, along links a way may use, leaving out `skip`. */
function around(rec: Record, id: string, most: number, skip: Set<string> = new Set()): GNode[] {
  const near = new Set<string>();
  for (const e of rec.idx.incident.get(id) ?? []) {
    const o = other(e, id);
    if (walks(e) && o !== id && !skip.has(o) && !rec.out.has(o)) near.add(o);
  }
  return [...near]
    .map((n) => rec.idx.nodes.get(n)!)
    .sort((a, b) => b.degree - a.degree || (a.id < b.id ? -1 : 1))
    .slice(0, most);
}

// ---------------------------------------------------------------- proof

function sourceLine(idx: GraphIndex, id: string, at?: string | null): HTMLElement {
  const s = sourceView(idx, id, at);
  const p = el('p', 'ask-src');
  p.append(s.url ? outside(s.title, s.url) : s.title);
  const rest = [s.title.startsWith(s.publisher) ? '' : s.publisher, s.published].filter(Boolean).join(', ');
  const strength = tierLabel(idx.data, s.tier);
  p.append(rest ? `, ${rest}.` : '.', strength ? ` ${strength}.` : '', s.at ? ` ${s.at}.` : '');
  if (s.archive) p.append(' ', outside('Saved copy', s.archive), '.');
  return p;
}

/** What opens under a link: what to know about it, then its first source with its quote, the rest folded. */
async function proofOf(idx: GraphIndex, e: GEdge): Promise<HTMLElement> {
  if (!e.full) await Promise.all([loadDetails(idx, e.from), loadDetails(idx, e.to)]);
  const body = el('div', 'ask-proof');
  if (e.according_to.length) body.append(el('p', 'ask-note', 'One side’s account, not settled fact.'));
  if (e.status === 'draft') body.append(el('p', 'ask-note', 'Being verified. Not yet checked against its sources.'));
  for (const text of claimNotes(e)) body.append(el('p', 'ask-note', text));
  const rows = [...e.sources].sort((x, y) => Number(!!y.quote) - Number(!!x.quote)).map((ref) => {
    const part = el('div');
    if (ref.quote) {
      const q = el('p', 'ask-q');
      q.append(el('mark', '', ref.quote));
      part.append(q);
    }
    part.append(sourceLine(idx, ref.id, ref.at));
    return part;
  });
  if (!rows.length) body.append(el('p', 'ask-note', 'No proof in this copy of the record.'));
  body.append(...rows.slice(0, 1));
  if (rows.length > 1) {
    const rest = el('div');
    rest.hidden = true;
    rest.append(...rows.slice(1));
    const n = rows.length - 1;
    body.append(rest, more(n === 1 ? 'One more source' : `${capital(count(n))} more sources`, 'is-small'));
  }
  return body;
}

/** "Show all": opens what the element before it holds (main.ts). */
function more(text: string, cls = ''): HTMLButtonElement {
  const b = el('button', `ask-more ${cls}`.trim(), text);
  b.type = 'button';
  b.dataset.open = '';
  return b;
}

/** The button that opens a link's proof in its row (main.ts). */
function proofButton(e: GEdge): HTMLButtonElement {
  const b = el('button', 'ask-pf', 'Proof');
  b.type = 'button';
  b.dataset.proof = e.id;
  b.setAttribute('aria-expanded', 'false');
  return b;
}

/** Opens or closes a row's proof. */
export async function toggleProof(idx: GraphIndex, b: HTMLButtonElement): Promise<void> {
  const row = b.closest<HTMLElement>('.ask-ln');
  const e = idx.edges.get(b.dataset.proof ?? '');
  if (!row || !e) return;
  const open = b.getAttribute('aria-expanded') === 'true';
  row.querySelector('.ask-proof')?.remove();
  b.setAttribute('aria-expanded', String(!open));
  b.textContent = open ? 'Proof' : 'Close';
  row.classList.toggle('is-on', !open);
  if (!open) row.append(await proofOf(idx, e));
}

// ---------------------------------------------------------------- lists

/** Flags under a link: whose account it is, and whether it is settled. */
function flags(idx: GraphIndex, e: GEdge): HTMLElement[] {
  const out = e.according_to.length ? [`According to ${e.according_to.map((p) => nameOf(idx, p)).join(', ')}`] : [];
  return [...out, ...statusWords(e)].map((f) => el('span', 'ask-flag', f));
}

/** One link of an entry, read from its side: "founded SpaceX", with its year, detail, flags and proof. */
function linkRow(rec: Record, e: GEdge, from: string, href: (id: string) => string): HTMLLIElement {
  const { idx } = rec;
  const o = other(e, from);
  const r = idx.data.relations[e.rel];
  const role = kinshipRole(idx, e);
  const phrase = role ? (e.from === from ? `${role} of` : role) : e.from === from ? (r?.label ?? e.label) : (r?.inverse ?? e.label);
  const li = el('li', 'ask-ln');
  li.dataset.o = o;
  li.append(dot(inkOf(idx, idx.nodes.get(o)?.type)));
  const t = el('p', 'ask-said');
  if (e.when) t.append(el('span', 'ask-yr', e.when.label), ' ');
  t.append(el('span', 'ask-rl', phrase), ' ', link(nameOf(idx, o), href(o)));
  const detail = detailOf(idx, e);
  if (detail) t.append(el('span', 'ask-dt', detail));
  t.append(...flags(idx, e));
  li.append(t, proofButton(e));
  return li;
}

/** A titled list that shows its first `cut` and opens the rest. */
function section(title: string, rows: HTMLElement[], cut = 24, cls = 'ask-links'): Node[] {
  if (!rows.length) return [];
  const h = el('h2', '', title);
  if (rows.length > 8) h.append(' ', el('small', '', String(rows.length)));
  const list = el('ul', cls);
  list.append(...rows.slice(0, cut));
  if (rows.length <= cut) return [h, list];
  const rest = el('div');
  rest.hidden = true;
  const hidden = el('ul', cls);
  hidden.append(...rows.slice(cut));
  rest.append(hidden);
  return [h, list, rest, more(`Show all ${rows.length}`)];
}

/** An entry's links under a title, then, once each, what their relations ask to be said with them (ADR-0027):
 *  in the open, not only inside a proof. */
function linkSection(rec: Record, title: string, edges: GEdge[], from: string, href: (id: string) => string, cut = 24): Node[] {
  const out = section(title, edges.map((e) => linkRow(rec, e, from, href)), cut);
  for (const c of new Set(edges.flatMap((e) => e.caveat ?? []))) out.push(el('p', 'ask-fine', c));
  return out;
}

/** A row that leads somewhere: a name, with a line under it. */
function row(name: string, href: string, sub?: string | null, ink?: string): HTMLLIElement {
  const li = el('li');
  const a = link('', href, 'ask-item');
  if (ink) a.append(dot(ink));
  a.append(el('span', 'ask-item-n', name));
  if (sub) a.append(el('span', 'ask-item-s', short(sub)));
  li.append(a);
  return li;
}

const storyRow = (s: Story, via?: string) => row(s.title, `/c/${s.id}/`, `${via ? `Through ${via}. ` : ''}${s.subtitle ?? ''}`);

function names(rec: Record, list: GNode[], href: (id: string) => string): HTMLLIElement[] {
  return list.map((n) => {
    const li = el('li');
    li.append(dot(inkOf(rec.idx, n.type)), link(n.name, href(n.id)));
    return li;
  });
}

/** What to ask next: big links under a rule. */
function next(asks: [string, string][]): Node[] {
  if (!asks.length) return [];
  const nav = el('nav', 'ask-next');
  nav.setAttribute('aria-label', 'Ask next');
  nav.append(...asks.map(([t, href]) => link(t, href)));
  return [nav];
}

const notice = () => el('p', 'ask-warn', NOTICE);

/** The question pages about an entry, as things to ask next. */
async function askedOf(rec: Record, id: string): Promise<[string, string][]> {
  if (rec.out.has(id)) return [];
  const d = await loadDetails(rec.idx, id);
  return (d?.asked ?? []).filter((a) => a.q !== 'connected').map((a) => [a.title, addressOf({ kind: 'question', q: a.q, id })]);
}

// ---------------------------------------------------------------- pictures

/** A thing and what it links to: a web, the thing pinned in the middle, its neighbours named. */
function webOf(rec: Record, id: string): Build {
  return (w, h) => {
    const { idx } = rec;
    const list = rec.out.has(id) ? [] : around(rec, id, webSize());
    const P: Point[] = [{ id, x: 0, y: 0, pin: true }, ...list.map((n) => ({ id: n.id }))];
    const at = new Map(P.map((p, i) => [p.id, i]));
    const springs: Spring[] = list.map((n, i) => [0, i + 1, 1, 0.3 + hash01(n.id) * 0.24]);
    for (const n of list) {
      for (const e of idx.incident.get(n.id) ?? []) {
        const o = other(e, n.id);
        if (walks(e) && o !== id && at.has(o) && o > n.id) springs.push([at.get(n.id)!, at.get(o)!, 0.3, 0.24]);
      }
    }
    relax(P, springs);
    const f = fit(P, w, h, phone() ? 34 : 64);
    const named = phone() ? 4 : 11;
    const dots: Dot[] = P.map((p, i) => {
      const n = idx.nodes.get(p.id)!;
      const [x, y] = f(p);
      return { id: p.id, name: n.name, ink: inkOf(idx, n.type), x, y, r: i ? radius(n.degree) : 15, label: i ? (i <= named ? 1 : 0) : 2, alpha: i ? 0.95 : 1 };
    });
    const lines: Line[] = springs.map(([a, b, s]) => ({ a: P[a].id, b: P[b].id, alpha: s === 1 ? 0.55 : 0.22, width: s === 1 ? 1 : 0.8 }));
    return { dots, lines };
  };
}

interface Stop {
  id: string;
  name: string;
  ink: string;
}

interface Thread extends Stop {
  /** A little of what it also touches. */
  around: Stop[];
}

const stopOf = (rec: Record, id: string): Stop => {
  const n = rec.idx.nodes.get(id)!;
  return { id, name: n.name, ink: inkOf(rec.idx, n.type) };
};

/** Stops on a line, and a little of what each one also touches. Each step draws in turn. */
function threadOf(stops: Thread[], dashed: boolean[], unread = false): Build {
  return (w, h) => {
    const tall = h > w * 0.9;
    const n = stops.length;
    const span = Math.min(1, 0.36 + n * 0.12);
    const pad = (phone() ? 30 : 74) + (tall ? h : w) * (1 - span) * 0.5;
    const dots: Dot[] = [];
    const lines: Line[] = [];
    const seen = new Set(stops.map((s) => s.id));
    const wave = (t: number) => Math.sin(t * Math.PI * 2.4 + 0.6);
    stops.forEach((s, i) => {
      const t = n > 1 ? i / (n - 1) : 0.5;
      const x = tall ? w * 0.47 + wave(t) * w * 0.25 : pad + t * (w - pad * 2);
      const y = tall ? pad + t * (h - pad * 2) : h * 0.47 + wave(t) * h * 0.24;
      // an end's name goes above or below, away from its line
      const toward = n > 1 ? h * 0.47 + wave(i === 0 ? 1 / (n - 1) : (n - 2) / (n - 1)) * h * 0.24 : y;
      const end = i === 0 || i === n - 1;
      dots.push({ id: s.id, name: s.name, ink: s.ink, x, y, r: end ? 13 : 9, label: end ? 2 : phone() ? 0 : 1, side: tall || !end ? 0 : toward > y ? 2 : 3 });
      if (i) lines.push({ a: stops[i - 1].id, b: s.id, alpha: 1, width: unread ? 1.2 : 2, dark: !unread, dash: dashed[i - 1], delay: 120 * i });
      for (const c of s.around) {
        if (seen.has(c.id)) continue;
        seen.add(c.id);
        const a = hash01(c.id) * Math.PI * 2;
        const d = (phone() ? 26 : 44) + hash01(c.id, 1) * (phone() ? 26 : 46);
        dots.push({ ...c, x: x + Math.cos(a) * d * (tall ? 1.15 : 1), y: y + Math.sin(a) * d * 0.8, r: 3.2, label: 0, alpha: 0.7 });
        lines.push({ a: s.id, b: c.id, alpha: 0.4, width: 0.8, delay: 120 * i + 200 });
      }
    });
    return { dots, lines };
  };
}

/** A subject and the entries that answer a question about it, in a ring. */
function starOf(rec: Record, id: string, ids: string[]): Build {
  return (w, h) => {
    const { idx } = rec;
    const P: Point[] = [{ id, x: 0, y: 0, pin: true }, ...ids.map((o) => ({ id: o }))];
    relax(P, ids.map((_, i) => [0, i + 1, 1, 0.36]));
    const f = fit(P, w, h, phone() ? 36 : 70);
    const dots: Dot[] = P.map((p, i) => {
      const n = idx.nodes.get(p.id)!;
      const [x, y] = f(p);
      return { id: p.id, name: n.name, ink: inkOf(idx, n.type), x, y, r: i ? radius(n.degree) + 1 : 15, label: i ? 1 : 2 };
    });
    return { dots, lines: ids.map((o) => ({ a: id, b: o, alpha: 0.75, width: 1.2, dark: true })) };
  };
}

/** The world, with written entries marked on it: `strong` named, the rest small. */
function worldOf(rec: Record, view: ((w: number, h: number) => View) | null, strong: GNode[], faint: GNode[], clock?: string): Build {
  return (w, h) => {
    const seen = new Set<string>();
    const marks: Mark[] = [];
    const add = (n: GNode, named: boolean) => {
      if (!n.coords || seen.has(n.id) || rec.out.has(n.id)) return;
      seen.add(n.id);
      marks.push({ lon: n.coords[0], lat: n.coords[1], ink: inkOf(rec.idx, n.type), ...(named ? { name: n.name, strong: true } : {}) });
    };
    strong.forEach((n, i) => add(n, i < 10));
    faint.forEach((n) => add(n, false));
    return { dots: [], lines: [], world: { view: view ? view(w, h) : wide(w), marks }, clock };
  };
}

/** The whole world across the picture. */
const wide = (w: number): View => ({ lon: 12, lat: 26, zoom: Math.log2((w * 1.3) / 512) });

const inked = (rec: Record) => rec.idx.data.nodes.filter((n) => n.coords);

// ---------------------------------------------------------------- two names

interface End {
  /** Its id, or Q and its Wikidata number for open data. */
  key: string;
  name: string;
  ink: string;
  /** Written by hand, with an entry here. */
  hand: boolean;
  /** Its Wikidata number, for a way through open data. */
  q: number | null;
}

async function endOf(rec: Record, raw: string): Promise<End | null> {
  const hand = (id: string): End | null => {
    const n = rec.idx.nodes.get(id);
    return n ? { key: id, name: n.name, ink: inkOf(rec.idx, n.type), hand: true, q: null } : null;
  };
  if (!/^Q\d+$/.test(raw)) return hand(raw);
  const e = await atlasEntry(raw);
  if (!e) return null;
  const written = e.u ? hand(e.u.split('/')[2]) : null;
  return written ? { ...written, q: Number(raw.slice(1)) } : { key: raw, name: e.n, ink: GREY, hand: false, q: Number(raw.slice(1)) };
}

/** The way through open data, when both ends are in it and neither is kept out. */
async function openWay(rec: Record, a: End, b: End): Promise<Awaited<ReturnType<typeof routeBetween>> | null> {
  const number = async (e: End) => {
    if (!e.hand) return e.q;
    const d = await loadDetails(rec.idx, e.key);
    return d?.open && d.w ? Number(d.w.slice(1)) : null;
  };
  const [x, y] = await Promise.all([number(a), number(b)]);
  return x === null || y === null ? null : routeBetween(x, y).catch(() => null);
}

/** A sentence for one link, read in its own direction, with its date. */
const said = (idx: GraphIndex, e: GEdge) => `${sentenceText(sentence(idx, e))}${e.when ? `, ${e.when.label}` : ''}.`;

async function pairAnswer(rec: Record, s: Extract<State, { kind: 'pair' }>, pick: Pick | undefined, picks: [string, string][]): Promise<Answer> {
  const { idx } = rec;
  const [a, b] = await Promise.all([endOf(rec, s.a), endOf(rec, s.b)]);
  if (!a || !b || a.key === b.key) return noneAnswer(rec, [], picks, a && b ? 'That is one entry, twice.' : 'We could not find one of those.');
  const parts: Part[] = pick?.parts ?? [[a.name, a.hand ? a.key : '', a.ink], [' and '], [b.name, b.hand ? b.key : '', b.ink]];
  const kept = rec.out.has(a.key) || rec.out.has(b.key);
  const both = a.hand && b.hand;
  const ties = both ? (idx.incident.get(a.key) ?? []).filter((e) => other(e, a.key) === b.key && e.status !== 'deprecated') : [];
  ties.sort((x, y) => (x.when?.start ?? Infinity) - (y.when?.start ?? Infinity));
  const paths: PathResult[] = both && !kept ? findPaths(idx, a.key, b.key).filter((p) => p.nodes.every((n) => !rec.out.has(n))) : [];
  const ways = paths.filter((p) => p.hops.length > 1);
  const at = Math.min(s.way, ways.length - 1);
  const way = ways[at] ?? null;
  const open = !paths.length && !kept && !ties.length ? await openWay(rec, a, b) : null;
  // the words of the way and its ties are in its stops' files
  await Promise.all([...new Set([...(way?.nodes ?? []), ...(both ? [a.key, b.key] : [])])].map((id) => loadDetails(idx, id)));
  const body: Node[] = [];
  const hops = way?.hops.length ?? 0;
  const direct = ties.length ? `${a.name} and ${b.name} are linked directly, ${times(ties.length)}` : '';
  if (ties.length) body.push(el('p', 'ask-lead', hops ? `${direct}, and ${count(hops)} links apart another way.` : `${direct}.`));
  else if (way) body.push(el('p', 'ask-lead', `${a.name} and ${b.name} are ${count(hops)} links apart. Every link has its proof.`));
  else if (open) body.push(el('p', 'ask-lead', `${a.name} and ${b.name} are ${count(open.length - 1)} links apart, through open data.`));
  else body.push(el('p', 'ask-lead', `No way between ${a.name} and ${b.name} yet, on the written record or in open data.`));
  if (pick?.note) body.push(el('p', 'ask-fine', pick.note));
  const href = (id: string) => addressOf({ kind: 'name', id });
  let steps: Answer['steps'];
  if (ties.length) {
    const part = linkSection(rec, 'Directly', ties, a.key, href, 12);
    body.push(...part);
    // with no way to show, the first tie's proof is open
    const opens = !way && (part[1] as HTMLElement).querySelector<HTMLButtonElement>('.ask-pf');
    if (opens) await toggleProof(idx, opens);
    if (!way && !ties.some(walks)) body.push(el('p', 'ask-fine', 'No way joins them: links like these stay off ways on purpose.'));
  }
  if (way) {
    if (ties.length) body.push(el('h2', '', 'Another way'));
    const list = el('ol', 'ask-way');
    // proof before anyone asks for it: the first step with a quote opens
    const first = way.hops.findIndex((h) => idx.edges.get(h.edge.id)?.sources.some((x) => x.quote));
    const els = way.nodes.map((id, i) => {
      const n = idx.nodes.get(id)!;
      const li = el('li', 'ask-stop');
      li.dataset.o = id;
      const h3 = el('h3');
      h3.append(link(n.name, href(id)));
      li.append(dot(inkOf(idx, n.type)), h3);
      const hop = way.hops[i];
      if (hop) {
        const e = idx.edges.get(hop.edge.id) ?? hop.edge;
        const step = el('div', 'ask-ln ask-hop');
        step.dataset.o = way.nodes[i + 1];
        const t = el('p', 'ask-said', said(idx, e));
        t.append(...flags(idx, e));
        step.append(t, proofButton(e));
        li.append(step);
      }
      list.append(li);
      return li;
    });
    const opens = els[first]?.querySelector<HTMLButtonElement>('.ask-pf');
    if (opens) await toggleProof(idx, opens);
    body.push(list);
    steps = { els, ids: way.nodes };
  } else if (open) {
    body.push(el('p', 'ask-fine', 'Nobody here has read these links yet, so they show no proof. A dot with a colour is an entry written by hand, and its page has the proof.'));
    const list = el('ol', 'ask-way is-open');
    for (const st of open) {
      const li = el('li', 'ask-stop');
      const h3 = el('h3');
      const hand = st.entry.u?.split('/')[2];
      h3.append(link(st.entry.n, hand && idx.nodes.has(hand) ? href(hand) : `/a/?q=Q${st.q}`));
      li.append(dot(hand && idx.nodes.has(hand) ? inkOf(idx, idx.nodes.get(hand)!.type) : GREY, !hand), h3, el('p', 'ask-kind', KINDS[st.entry.k] ?? ''));
      if (st.via) li.append(el('p', 'ask-said ask-hop', st.via));
      list.append(li);
    }
    body.push(list);
  } else if (!ties.length) {
    const p = el('p', 'ask-plain', 'Some links stay off ways on purpose. Each page has them: ');
    p.append(link(a.name, a.hand ? `/e/${a.key}/` : `/a/?q=${a.key}`), ' and ', link(b.name, b.hand ? `/e/${b.key}/` : `/a/?q=${b.key}`), '.');
    body.push(p);
  }
  body.push(notice());
  if (ways.length > 1) {
    const rows = ways
      .map((w, i) => ({ w, i }))
      .filter(({ i }) => i !== at)
      .map(({ w, i }) => {
        const mid = w.nodes.slice(1, -1).map((id) => idx.nodes.get(id)?.name ?? id);
        const through = mid.length > 3 ? `${mid.slice(0, 3).join(', ')} and ${mid.length - 3} more` : mid.join(', ');
        return row(`Through ${through}`, addressOf({ ...s, way: i }), `${capital(count(w.hops.length))} links`);
      });
    body.push(...section('Other ways', rows, 8, 'ask-list is-t'));
  }
  const shared = both && !kept ? storiesWith(rec, a.key, b.key) : [];
  if (shared.length) body.push(...section('Stories that hold both', shared.map((st) => storyRow(st)), 6, 'ask-list is-t'));
  const story = both ? (routeStoryUrl(idx.data, a.key, b.key) ?? routeStoryUrl(idx.data, b.key, a.key)) : null;
  if (story && !kept) {
    const p = el('p', 'ask-actions');
    p.append(link('Play the way as a story', story, 'button'));
    body.push(p);
  }
  // next: what the stops are asked about, a story the way ends in, then another question
  const asks: [string, string][] = [];
  for (const id of [...(way?.nodes ?? [])].reverse()) for (const q of await askedOf(rec, id)) if (asks.length < 2) asks.push(q);
  const end = way && storiesWith(rec, way.nodes[way.nodes.length - 1])[0];
  if (end) asks.push([end.title, `/c/${end.id}/`]);
  body.push(...next([...asks, ...picks].slice(0, 3)));

  let scene: Build;
  if (way) {
    const on = new Set(way.nodes);
    scene = threadOf(
      way.nodes.map((id) => ({ ...stopOf(rec, id), around: around(rec, id, context(), on).map((o) => stopOf(rec, o.id)) })),
      way.hops.map((h) => !!h.edge.according_to.length),
    );
  } else if (open) {
    scene = threadOf(
      open.map((st) => {
        const hand = st.entry.u?.split('/')[2];
        const n = hand ? idx.nodes.get(hand) : undefined;
        return { id: n ? n.id : `Q${st.q}`, name: st.entry.n, ink: n ? inkOf(idx, n.type) : GREY, around: [] };
      }),
      open.slice(1).map(() => true),
      true,
    );
  } else {
    const side = (e: End): Thread => ({
      id: e.key,
      name: e.name,
      ink: e.ink,
      around: e.hand && !kept ? around(rec, e.key, context(), new Set([a.key, b.key])).map((o) => stopOf(rec, o.id)) : [],
    });
    const two = threadOf([side(a), side(b)], [ties.length > 0 && ties.every((e) => e.according_to.length > 0)]);
    // with no tie the two stand apart, and nothing is drawn between them
    scene = ties.length ? two : (w, h) => ({ ...two(w, h), lines: [] });
  }
  return { parts, body, scene, steps };
}

// ---------------------------------------------------------------- one name

async function nameAnswer(rec: Record, id: string, picks: [string, string][]): Promise<Answer> {
  const { idx } = rec;
  const n = idx.nodes.get(id);
  if (!n) return noneAnswer(rec, [], picks, 'We could not find that.');
  const d = await loadDetails(idx, id);
  const kept = rec.out.has(id);
  const href = (o: string) => addressOf({ kind: 'name', id: o });
  const body: Node[] = [el('p', 'ask-kind', `${idx.data.types[n.type]?.label ?? 'Entry'}${n.when ? `, ${n.when.label}` : ''}`)];
  if (d?.summary) body.push(el('p', 'ask-lead', d.summary));
  const told = storiesWith(rec, id);
  if (told.length) body.push(...section('Told in', told.map((st) => storyRow(st)), 6, 'ask-list is-t'));
  else if (!kept) {
    const via: [Story, string][] = [];
    for (const o of around(rec, id, 60)) for (const st of storiesWith(rec, o.id)) if (!via.some(([x]) => x === st)) via.push([st, o.name]);
    if (via.length) {
      body.push(el('h2', '', 'No story here yet'), el('p', 'ask-fine', 'The nearest are one link away.'));
      const list = el('ul', 'ask-list is-t');
      list.append(...via.slice(0, 3).map(([st, o]) => storyRow(st, o)));
      body.push(list);
    }
  }
  const edges = idx.incident.get(id) ?? [];
  const kin = (e: GEdge) => !!idx.data.relations[e.rel]?.kinship;
  const phrase = (e: GEdge) => (e.from === id ? e.label : (idx.data.relations[e.rel]?.inverse ?? e.label));
  const family = edges.filter(kin);
  const dated = edges.filter((e) => !kin(e) && e.when).sort((x, y) => x.when!.start - y.when!.start);
  const rest = edges.filter((e) => !kin(e) && !e.when).sort((x, y) => phrase(x).localeCompare(phrase(y)));
  body.push(...linkSection(rec, 'Family', family, id, href));
  body.push(...linkSection(rec, 'Over time', dated, id, href, 30));
  body.push(...linkSection(rec, dated.length ? 'Also linked' : 'Linked to', rest, id, href, 30));
  if (d?.open && d.w) {
    const p = el('p', 'ask-fine', `Open data holds ${d.open.toLocaleString('en')} more links for it, which nobody here has read. `);
    p.append(link('See them', `/a/?q=${d.w}`), '.');
    body.push(p);
  }
  const page = el('p', 'ask-actions');
  page.append(link(`Everything on ${n.name}’s page`, n.url, 'button'));
  body.push(page, ...next([...(await askedOf(rec, id)), ...picks].slice(0, 3)));
  const scene =
    n.type === 'place' && n.coords && !kept
      ? worldOf(rec, () => ({ lon: n.coords![0], lat: n.coords![1], zoom: 6.5 }), [n, ...around(rec, id, 60).filter((o) => o.coords)], inked(rec))
      : webOf(rec, id);
  return { parts: [asName(idx, id)], body, scene };
}

// ---------------------------------------------------------------- a question

async function questionAnswer(rec: Record, q: string, id: string, picks: [string, string][]): Promise<Answer> {
  const { idx } = rec;
  const d = idx.nodes.has(id) ? await loadDetails(idx, id) : null;
  const page = d?.asked.find((a) => a.q === q);
  const def = idx.data.questions.find((x) => x.id === q);
  // a question is answered here only where it has its own page
  if (!page || !def) return nameAnswer(rec, id, picks);
  const name = idx.nodes.get(id)!.name;
  const at = page.title.indexOf(name);
  const parts: Part[] = at < 0 ? [[page.title]] : [[page.title.slice(0, at)], asName(idx, id), [page.title.slice(at + name.length)]];
  const href = (o: string) => addressOf({ kind: 'name', id: o });
  const body: Node[] = [el('p', 'ask-lead', `Shows ${def.shows}. Not ${def.not}.`)];
  const ids: string[] = [];
  for (const g of def.groups) {
    const lines = (idx.incident.get(id) ?? []).filter((e) => e.status !== 'deprecated' && ((e.to === id && g.in?.includes(e.rel)) || (e.from === id && g.out?.includes(e.rel))));
    lines.forEach((e) => ids.push(other(e, id)));
    if (lines.length) body.push(...linkSection(rec, g.label, lines, id, href));
    else if (g.empty) body.push(el('h2', '', g.label), el('p', 'ask-fine', g.empty));
  }
  body.push(notice());
  const whole = el('p', 'ask-actions');
  whole.append(link('The whole answer, account by account', page.url, 'button'));
  body.push(whole, ...next([[name, href(id)] as [string, string], ...picks].slice(0, 3)));
  const shown = [...new Set(ids)].filter((o) => o !== id && !rec.out.has(o)).slice(0, webSize());
  return { parts, body, scene: starOf(rec, id, shown) };
}

// ---------------------------------------------------------------- a year

function yearAnswer(rec: Record, y: number, picks: [string, string][]): Answer {
  const { idx } = rec;
  const label = formatYearNumber(y);
  const href = (o: string) => addressOf({ kind: 'name', id: o });
  const kept = (id: string) => rec.out.has(id);
  const within = (n: GNode) => n.when && n.type !== 'person' && n.when.start < y + 1 && (n.when.end ?? n.when.start + 1) > y && (n.when.end ?? n.when.start + 1) - n.when.start < 6;
  const hit = idx.data.nodes.filter((n) => within(n) && !kept(n.id)).sort((a, b) => b.degree - a.degree);
  const told = rec.list.filter((st) => st.years.has(y));
  const links = idx.data.edges
    .filter((e) => e.when && Math.floor(e.when.start) === y && (e.when.end ?? y + 1) - e.when.start < 2 && !kept(e.from) && !kept(e.to) && e.status !== 'deprecated')
    .sort((a, b) => a.when!.start - b.when!.start);
  const body: Node[] = [];
  if (hit.length) body.push(...section(`On the record in ${label}`, names(rec, hit, href), 16, 'ask-names'));
  else body.push(el('p', 'ask-lead', `Nothing written yet is dated ${label}.`));
  if (told.length) body.push(...section(`Stories with a scene in ${label}`, told.map((st) => storyRow(st)), 6, 'ask-list is-t'));
  const rows = links.map((e) => {
    const li = el('li', 'ask-ln');
    li.dataset.o = e.to;
    li.append(dot(inkOf(idx, idx.nodes.get(e.to)?.type)));
    const t = el('p', 'ask-said');
    t.append(el('span', 'ask-yr', e.when!.label), ' ', link(nameOf(idx, e.from), href(e.from)), ' ', el('span', 'ask-rl', e.label), ' ', link(nameOf(idx, e.to), href(e.to)));
    t.append(...flags(idx, e));
    li.append(t, proofButton(e));
    return li;
  });
  body.push(...section(`Links dated ${label}`, rows, 20));
  const map = el('p', 'ask-actions');
  map.append(link(`${label} on the Map`, `/w/?t=${y}`, 'button'));
  body.push(map, ...next([[formatYearNumber(y + 1), addressOf({ kind: 'year', year: y + 1 })] as [string, string], ...picks].slice(0, 3)));
  const ends = links.flatMap((e) => [idx.nodes.get(e.from)!, idx.nodes.get(e.to)!]);
  return { parts: [[label, '', '']], body, scene: worldOf(rec, null, [...hit, ...ends], inked(rec), label) };
}

// ---------------------------------------------------------------- nothing yet, nothing found

function emptyAnswer(rec: Record): Answer {
  const body: Node[] = [el('p', 'ask-lead', 'Type a name, two names, a year or a question. Or start from a story.')];
  body.push(...section('Stories', rec.list.map((st) => storyRow(st)), rec.list.length, 'ask-list is-t'));
  const all = el('p', 'ask-fine');
  all.append(link('Every story, on the Stories page', '/c/'), '.');
  body.push(all);
  return { parts: [], body, scene: worldOf(rec, null, [], inked(rec)) };
}

function noneAnswer(rec: Record, found: SearchEntry[], picks: [string, string][], why = 'Nothing here answers that yet.'): Answer {
  const body: Node[] = [el('p', 'ask-lead', why), el('p', 'ask-plain', 'The box knows names, two names, a year, and four questions: how two things connect, who is behind something, why it happened, and who benefited. It cannot think past those.')];
  const near = found.filter((e) => e.type !== 'question');
  if (near.length) {
    const list = el('ul', 'ask-list is-t');
    list.append(...near.slice(0, 4).map((e) => row(e.name, /^Q\d+$/.test(e.id) || e.type === 'chapter' ? e.url : addressOf({ kind: 'name', id: e.id }), e.summary)));
    body.push(el('h2', '', 'Closest'), list);
  }
  body.push(...next(picks.slice(0, 2)));
  return { parts: [], body, scene: worldOf(rec, null, [], inked(rec)) };
}

/** The answer to a state, once the record has loaded. `picks` are the featured questions to offer next. */
export async function answer(s: State, pick: Pick | undefined, picks: [string, string][]): Promise<Answer> {
  const rec = await loadRecord();
  switch (s.kind) {
    case 'pair':
      return pairAnswer(rec, s, pick, picks);
    case 'name':
      return /^Q\d+$/.test(s.id) ? noneAnswer(rec, [], picks, 'We could not find that.') : nameAnswer(rec, s.id, picks);
    case 'question':
      return questionAnswer(rec, s.q, s.id, picks);
    case 'year':
      return yearAnswer(rec, s.year, picks);
    case 'empty':
      return emptyAnswer(rec);
    case 'none':
      return noneAnswer(rec, s.found, picks);
  }
}

/** The web of a name being typed, for the picture beside the suggestions. */
export async function preview(id: string): Promise<Build | null> {
  const rec = await loadRecord();
  return rec.idx.nodes.has(id) ? webOf(rec, id) : null;
}
