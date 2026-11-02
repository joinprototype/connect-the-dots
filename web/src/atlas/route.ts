// route.js: the one answer for any two entries (/r/?a=<id or Qn>&b=<id or Qn>, ADR-0028). Their direct tie
// first, in any relation, with its caveat and proof. Then the way between them on the written record, or
// failing that through open data, drawn grey. Or a plain no. The two fields search the same index as the
// header. Names come from the data, never from the address, so no address can put words in our mouth.
//
// It loads what this pair needs: the two ends' detail files hold their ties, an end with no link a route
// may use costs no search, and a way reads ways.json and its own stops, never the whole graph.
import './atlas.css';
import { atlasEntry, INKS, KINDS } from '../lib/atlas';
import { routeBetween, type Stop } from '../lib/atlas-route';
import { sentence, sentenceText, sourceView } from '../lib/claims';
import { detailsIndex, loadEntryFile, loadSchema, loadWaysIndex, nameOf, type Details, type GraphIndex } from '../lib/data';
import { el } from '../lib/dom';
import { fuzzySearch } from '../lib/fuzzy';
import { findPaths, type PathResult } from '../lib/paths';
import { claimNotes, NOTICE, routeStoryUrl, routeSummary, statusWords, tierLabel } from '../lib/plain';
import { candidates } from '../lib/search';
import type { GEdge, GraphData, SearchEntry, SourceRef } from '../lib/types';
import { drawThread, type Dot, type Line, type Thread } from './thread';

/** One end of a pair: what the data holds. */
interface End {
  /** Its details, when it was written by hand. */
  hand: Details | null;
  /** Its Wikidata number, when the address gave one. */
  q: number | null;
  name: string;
  url: string;
  ink: string;
}

/** What the data says about a pair. */
interface Found {
  /** The stops and the two ends, in full; null when an end is open data. */
  idx: GraphIndex | null;
  /** What routes may use; null when no way was looked for. */
  graph: GraphIndex | null;
  ties: GEdge[];
  /** The ways of two links or more: a single link is a tie. */
  ways: PathResult[];
  /** The one shown, its links in full, and its place in `ways`. */
  way: PathResult | null;
  at: number;
  open: Stop[] | null;
}

const NUMBERS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
const count = (n: number) => NUMBERS[n] ?? String(n);
const links = (n: number) => `${count(n)} ${n === 1 ? 'link' : 'links'}`;
const capital = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Past this many letters, two names take a smaller heading. */
const LONG_NAMES = 44;
/** Faint dots around each stop of the way. */
const ALSO = innerWidth < 640 ? 3 : 5;
/** Names an alternative spells out. */
const NAMED = 3;

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

const inkOf = (data: Pick<GraphData, 'types'>, type: string | undefined): string => {
  const layer = type && data.types[type]?.layer;
  return layer ? `var(--layer-${layer})` : 'var(--muted)';
};

const inkOfKind = (kind: number) => `var(${INKS[kind] ?? '--cobalt'})`;

async function handEnd(id: string, q: number | null): Promise<End | null> {
  const [d, schema] = await Promise.all([loadEntryFile(id).catch(() => null), loadSchema()]);
  // any object answers to `constructor`: only an entry's own file will do
  if (d?.id !== id) return null;
  return { hand: d, q, name: d.name, url: `/e/${id}/`, ink: inkOf(schema, d.type) };
}

/** The entry an address names, or null when the data holds none: an unknown id is never repeated. */
async function endOf(raw: string | null): Promise<End | null> {
  if (!raw) return null;
  if (!/^Q\d+$/.test(raw)) return handEnd(raw, null);
  const e = await atlasEntry(raw);
  if (!e) return null;
  const q = Number(raw.slice(1));
  const hand = e.u ? await handEnd(e.u.split('/')[2], q) : null;
  return hand ?? { hand: null, q, name: e.n, url: e.u ?? `/a/?q=${raw}`, ink: inkOfKind(e.k) };
}

const keyOf = (e: End) => e.hand?.id ?? `Q${e.q}`;

const addressOf = (a: End, b: End, way = 0) => `/r/?a=${encodeURIComponent(keyOf(a))}&b=${encodeURIComponent(keyOf(b))}${way ? `&way=${way}` : ''}`;

/** The way through open data, read only when both ends are in it: a sealed end costs nothing here. */
async function openWay(a: End, b: End): Promise<Stop[] | null> {
  const number = (e: End) => (e.hand ? (e.hand.open && e.hand.w ? Number(e.hand.w.slice(1)) : null) : e.q);
  const [x, y] = [number(a), number(b)];
  return x === null || y === null ? null : routeBetween(x, y).catch(() => null);
}

async function find(a: End, b: End, wanted: number): Promise<Found> {
  if (!a.hand || !b.hand) return { idx: null, graph: null, ties: [], ways: [], way: null, at: 0, open: await openWay(a, b) };
  const [x, y] = [a.hand.id, b.hand.id];
  const schema = await loadSchema();
  // a way starts on a link routes may use: an entry with none costs no search
  const walks = (d: Details) => d.links.some((l) => schema.relations[l.rel]?.traversable && !schema.relations[l.rel]?.passive);
  const graph = walks(a.hand) && walks(b.hand) ? await loadWaysIndex() : null;
  const paths = graph ? findPaths(graph, x, y) : [];
  const ways = paths.filter((p) => p.hops.length > 1);
  const at = Math.min(wanted, ways.length - 1);
  const shown = ways[at];
  // every link is in the file of one end or the other, so the stops' files hold the whole way
  const idx = detailsIndex(schema, shown ? await Promise.all(shown.nodes.map(loadEntryFile)) : [a.hand, b.hand]);
  const way = shown ? { ...shown, hops: shown.hops.map((h) => ({ ...h, edge: idx.edges.get(h.edge.id)! })) } : null;
  const ties = (idx.incident.get(x) ?? []).filter((e) => (e.from === x ? e.to : e.from) === y);
  ties.sort((p, q) => (p.when?.start ?? Infinity) - (q.when?.start ?? Infinity));
  return { idx, graph, ties, ways, way, at, open: paths.length ? null : await openWay(a, b) };
}

const pickable = (e: SearchEntry) => e.type !== 'chapter' && e.type !== 'question';

/** One field: a name, its suggestions, and the entry picked (an id or a Wikidata number). */
class Field {
  readonly node = el('label', 'connect-field');
  readonly input = document.createElement('input');
  private hits = el('ul', 'connect-hits');
  private best: SearchEntry | null = null;
  picked: string | null = null;

  constructor(
    label: string,
    private changed: () => void,
  ) {
    this.input.type = 'search';
    this.input.placeholder = label;
    this.input.setAttribute('aria-label', label);
    this.input.autocomplete = 'off';
    this.input.spellcheck = false;
    this.hits.hidden = true;
    this.node.append(this.input, this.hits);
    this.input.addEventListener('input', () => {
      this.picked = null;
      void this.suggest();
    });
    this.hits.addEventListener('pointerdown', (e) => e.preventDefault());
    this.input.addEventListener('blur', () => (this.hits.hidden = true));
  }

  private async suggest(): Promise<void> {
    const q = this.input.value;
    this.best = null;
    if (!q.trim()) {
      this.hits.hidden = true;
      return;
    }
    const entries = await candidates(q).catch(() => [] as SearchEntry[]);
    if (q !== this.input.value) return;
    const hits = fuzzySearch(entries.filter(pickable), q, 6);
    this.best = hits[0]?.item ?? null;
    this.hits.replaceChildren(
      ...hits.map(({ item }) => {
        const li = el('li');
        const b = el('button');
        b.type = 'button';
        b.append(item.name, el('span', '', item.summary ?? ''));
        b.addEventListener('click', () => this.choose(item));
        li.append(b);
        return li;
      }),
    );
    this.hits.hidden = !hits.length;
  }

  private choose(item: SearchEntry): void {
    this.show(item.id, item.name);
    this.changed();
  }

  /** Enter takes the best suggestion. */
  settle(): void {
    if (this.best && !this.picked) this.show(this.best.id, this.best.name);
  }

  /** Shows an entry, without asking anything. */
  show(id: string | null, name: string): void {
    this.picked = id;
    this.input.value = name;
    this.hits.hidden = true;
  }
}

function sourceRow(idx: GraphIndex, ref: SourceRef): HTMLElement {
  const s = sourceView(idx, ref.id, ref.at, ref.quote);
  const li = el('li');
  if (s.quote) {
    const quote = el('p', 'pair-quote');
    quote.append(el('mark', '', s.quote));
    li.append(quote);
  }
  const line = el('p', 'pair-source');
  line.append(s.url ? outside(s.title, s.url) : s.title);
  const rest = [s.title.startsWith(s.publisher) ? '' : s.publisher, s.published, s.at].filter(Boolean).join(', ');
  const strength = tierLabel(idx.data, s.tier);
  line.append(rest ? `, ${rest}.` : '.', strength ? ` ${strength}.` : '');
  if (s.archive) line.append(' ', outside('Saved copy', s.archive), '.');
  li.append(line);
  return li;
}

/** What opens under a link: its notes, then each source, those with a quote first. */
function proofOf(idx: GraphIndex, e: GEdge, notes: string[]): HTMLElement {
  const body = el('div', 'pair-proof');
  for (const text of notes) body.append(el('p', 'pair-note', text));
  const list = el('ul');
  list.append(...[...e.sources].sort((x, y) => Number(!!y.quote) - Number(!!x.quote)).map((ref) => sourceRow(idx, ref)));
  body.append(list);
  return body;
}

const said = (idx: GraphIndex, e: GEdge) => `${sentenceText(sentence(idx, e))}${e.when ? `, ${e.when.label}` : ''}.`;

const marks = (idx: GraphIndex, e: GEdge) => [...e.according_to.map((who) => `${nameOf(idx, who)}'s account`), ...statusWords(e)].join(' · ');

/** The word to open a fold, and "Close" once it is open. */
function opener(word: string): HTMLElement {
  const words = el('span', 'pair-opener');
  words.append(el('span', 'pair-shut', word), el('span', 'pair-opened', 'Close'));
  return words;
}

/** One step of the way: the dot's line says what joins this stop to the next, and opens its proof. */
function step(idx: GraphIndex, e: GEdge, open: boolean): HTMLElement {
  const fold = el('details', 'pair-step');
  fold.open = open;
  const summary = el('summary');
  const words = el('span', 'pair-said', said(idx, e));
  const mark = marks(idx, e);
  if (mark) words.append(el('span', 'pair-marks', mark));
  summary.append(words, opener('Proof'));
  fold.append(summary, proofOf(idx, e, claimNotes(e)));
  return fold;
}

function wayList(idx: GraphIndex, path: PathResult): HTMLElement {
  const list = el('ol', 'connect-route');
  // proof before anyone asks for it
  const first = path.hops.findIndex((h) => h.edge.sources.some((s) => s.quote));
  path.nodes.forEach((id, i) => {
    const n = idx.nodes.get(id)!;
    const hop = path.hops[i];
    const li = el('li', `connect-stop${hop?.edge.according_to.length ? ' is-account' : ''}`);
    li.style.setProperty('--c', inkOf(idx.data, n.type));
    li.append(link(n.name, n.url, 'connect-name'));
    if (hop) li.append(step(idx, hop.edge, i === first));
    list.append(li);
  });
  return list;
}

/** The way through open data: grey and dashed, a colour only where an entry was written by hand. */
function openList(stops: Stop[]): HTMLElement {
  const list = el('ol', 'connect-route is-open');
  for (const s of stops) {
    const li = el('li', 'connect-stop');
    li.style.setProperty('--c', s.entry.u ? inkOfKind(s.entry.k) : 'var(--muted)');
    li.append(link(s.entry.n, s.entry.u ?? `/a/?q=Q${s.q}`, 'connect-name'), el('span', 'connect-kind', KINDS[s.entry.k] ?? ''));
    if (s.via) li.append(el('span', 'connect-via', s.via));
    list.append(li);
  }
  return list;
}

const part = (title: string, ...rest: Node[]): HTMLElement => {
  const section = el('section', 'pair-part');
  section.append(el('h2', '', title), ...rest);
  return section;
};

/** Their direct ties, each with its date and proof, and the sentence its relation asks for, once. */
function tiesPart(idx: GraphIndex, ties: GEdge[], offRoutes: boolean): HTMLElement {
  const list = el('ul', 'pair-ties');
  const caveats = new Set<string>();
  ties.forEach((e, i) => {
    const li = el('li');
    li.append(el('p', 'pair-said', said(idx, e)));
    const mark = marks(idx, e);
    if (mark) li.append(el('p', 'pair-marks', mark));
    if (e.caveat && !caveats.has(e.caveat)) li.append(el('p', 'pair-caveat', e.caveat));
    if (e.caveat) caveats.add(e.caveat);
    const fold = el('details', 'pair-step');
    fold.open = i < 3;
    const summary = el('summary');
    summary.append(opener('Proof'));
    fold.append(summary, proofOf(idx, e, claimNotes(e).filter((text) => text !== e.caveat)));
    li.append(fold);
    list.append(li);
  });
  const section = part('Directly', list);
  if (offRoutes) section.append(el('p', 'pair-none', 'No route joins them: links like this one stay off routes on purpose.'));
  return section;
}

/** The other ways, folded: their names cost their stops' files, so those load when a reader opens it. */
function othersPart(a: End, b: End, found: Found, go: (url: string) => void): HTMLElement {
  const others = found.ways.map((w, i) => ({ w, i })).filter(({ i }) => i !== found.at);
  const fold = el('details', 'pair-others');
  const summary = el('summary');
  const title = `${capital(count(others.length))} other ${others.length === 1 ? 'way' : 'ways'}`;
  summary.append(el('h2', '', title), opener('Show'));
  const list = el('ul');
  fold.append(summary, list);
  const fill = async () => {
    const ids = others.flatMap(({ w }) => w.nodes.slice(1, 1 + NAMED));
    const files = await Promise.all([...new Set(ids)].map(loadEntryFile)).catch(() => [] as Details[]);
    const names = new Map(files.map((d) => [d.id, d.name]));
    list.replaceChildren(
      ...others.map(({ w, i }) => {
        const more = w.nodes.length - 2 - NAMED;
        const through = w.nodes.slice(1, -1).slice(0, NAMED).flatMap((id) => names.get(id) ?? []).join(', ');
        const row = link('', addressOf(a, b, i));
        row.append(el('span', 'pair-through', through ? `Through ${through}${more > 0 ? ` and ${more} more` : ''}` : 'Another way'), el('span', 'pair-length', links(w.hops.length)));
        row.addEventListener('click', (e) => {
          e.preventDefault();
          go(row.href);
        });
        const li = el('li');
        li.append(row);
        return li;
      }),
    );
  };
  fold.addEventListener('toggle', () => void fill(), { once: true });
  return fold;
}

/** What each stop also touches, from what routes may use: what stays off routes stays off this picture. */
function alsoOf(graph: GraphIndex | null, id: string, on: string[]): string[] {
  if (!graph) return [];
  const near = new Set<string>();
  for (const e of graph.incident.get(id) ?? []) {
    const other = e.from === id ? e.to : e.from;
    if (!on.includes(other)) near.add(other);
  }
  const degree = (n: string) => graph.nodes.get(n)?.degree ?? 0;
  return [...near]
    .sort((x, y) => degree(y) - degree(x) || (x < y ? -1 : 1))
    .slice(0, ALSO)
    .map((n) => inkOf(graph.data, graph.nodes.get(n)?.type));
}

const lineOf = (e: GEdge): Line => (e.according_to.length ? 'account' : 'read');

function threadOf(a: End, b: End, { idx, graph, ties, way, open }: Found): Thread {
  if (way && idx) {
    const stops: Dot[] = way.nodes.map((id) => {
      const n = idx.nodes.get(id)!;
      return { name: n.name, url: n.url, ink: inkOf(idx.data, n.type), also: alsoOf(graph, id, way.nodes) };
    });
    return { stops, lines: way.hops.map((h) => lineOf(h.edge)) };
  }
  if (open) {
    const stops: Dot[] = open.map((s) => ({ name: s.entry.n, url: s.entry.u ?? `/a/?q=Q${s.q}`, ink: s.entry.u ? inkOfKind(s.entry.k) : 'var(--muted)', also: [] }));
    return { stops, lines: stops.slice(1).map(() => 'unread') };
  }
  const end = (e: End): Dot => ({ name: e.name, url: e.url, ink: e.ink, also: e.hand ? alsoOf(graph, e.hand.id, [keyOf(a), keyOf(b)]) : [] });
  return { stops: [end(a), end(b)], lines: [ties.length ? (ties.some((e) => !e.according_to.length) ? 'read' : 'account') : null] };
}

function leadOf({ idx, ties, way, open }: Found): string {
  const hops = way?.hops.length ?? 0;
  const far = open ? open.length - 1 : 0;
  if (ties.length) {
    const direct = ties.length > 1 ? `Linked directly, ${count(ties.length)} times` : 'Linked directly';
    if (hops) return `${direct}, and ${links(hops)} apart another way.`;
    return far ? `${direct}, and ${links(far)} apart through open data.` : `${direct}.`;
  }
  if (way && idx) {
    // what backs the way: the summary's words after its count
    const summary = routeSummary(idx.data, way);
    return `${capital(links(hops))} apart, ${summary.slice(summary.indexOf(', ') + 2)}.`;
  }
  if (far) return `${capital(links(far))} apart, through open data. Nobody here has read them.`;
  return 'No way between them yet, on the written record or in open data.';
}

/** "Play the story" where one was written, "See it on the Map" where every stop has a place there. */
function actionsOf(a: End, b: End, { idx, way, open }: Found): HTMLElement | null {
  const story = idx && a.hand && b.hand ? (routeStoryUrl(idx.data, a.hand.id, b.hand.id) ?? routeStoryUrl(idx.data, b.hand.id, a.hand.id)) : null;
  // an entry with no open data has no dot of its own to stop at, and the line would jump over it
  const inAtlas = (d?: Details) => (d?.open ? d.w : null);
  const stops = way ? way.nodes.map((id) => inAtlas(idx?.details.get(id))) : (open?.map((s) => `Q${s.q}`) ?? []);
  const map = stops.length && stops.every(Boolean) ? `/w/?route=${stops.join(',')}` : null;
  if (!story && !map) return null;
  const actions = el('p', 'atlas-actions');
  if (story) actions.append(link('Play the story', story, 'button primary'));
  if (map) actions.append(link('See it on the Map', map, story ? 'button' : 'button primary'));
  return actions;
}

function answerOf(a: End, b: End, found: Found, go: (url: string) => void): Node[] {
  const { idx, ties, way, open } = found;
  const parts: Node[] = [];
  if (idx && ties.length) parts.push(tiesPart(idx, ties, !way && !open && !ties.some((e) => e.traversable)));
  if (idx && way) {
    parts.push(part(ties.length ? 'Another way' : 'The way', wayList(idx, way)));
    if (found.ways.length > 1) parts.push(othersPart(a, b, found, go));
  } else if (open) {
    const note = el('p', 'connect-note', 'These links come from open data, and nobody here has read them, so they show no proof. A dot with a colour is an entry written by hand, and its page has the proof.');
    parts.push(part('Through open data', openList(open), note));
  } else if (!ties.length) {
    const none = el('p', 'pair-none', 'Some links stay off routes on purpose. Each page has them: ');
    none.append(link(a.name, a.url), ' and ', link(b.name, b.url), '.');
    parts.push(none);
  }
  return parts;
}

function start(root: HTMLElement): void {
  const title = document.title;
  let asked = 0;
  const go = (url: string) => {
    history.pushState(null, '', url);
    window.scrollTo({ top: 0 });
    void show();
  };
  const connect = () => {
    if (from.picked && to.picked) go(`/r/?a=${encodeURIComponent(from.picked)}&b=${encodeURIComponent(to.picked)}`);
  };
  const from = new Field('Anyone or anything', connect);
  const to = new Field('Anyone or anything else', connect);
  const form = el('form', 'connect-form');
  const button = el('button', 'button primary', 'Connect');
  button.type = 'submit';
  form.append(from.node, to.node, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    from.settle();
    to.settle();
    connect();
  });

  /** No pair to answer: the fixed words, the fields, and a fixed reason if the address named something. */
  const ask = (reason: string | null) => {
    document.title = title;
    const head = el('header', 'atlas-words');
    head.append(el('h1', '', 'Connect any two.'), el('p', 'atlas-summary', 'Pick any two of a million things, and see the way between them.'));
    root.replaceChildren(head, ...(reason ? [el('p', 'connect-status', reason)] : []), form);
  };

  const show = async () => {
    const mine = ++asked;
    const q = new URLSearchParams(location.search);
    const [rawA, rawB] = [q.get('a'), q.get('b')];
    const [a, b] = await Promise.all([endOf(rawA), endOf(rawB)]);
    if (mine !== asked) return;
    from.show(a && keyOf(a), a?.name ?? '');
    to.show(b && keyOf(b), b?.name ?? '');
    if (!a || !b) return ask((rawA && !a) || (rawB && !b) ? 'We could not find one of those. Try its name here.' : null);
    if (keyOf(a) === keyOf(b)) return ask('That is one entry, twice. Pick another.');

    document.title = `${a.name} and ${b.name}: Connect the Dots`;
    const h1 = el('h1', a.name.length + b.name.length > LONG_NAMES ? 'is-long' : '');
    h1.append(link(a.name, a.url), el('span', '', ' and '), link(b.name, b.url));
    const head = el('header', 'pair-head');
    head.append(h1);
    const picture = el('div', 'pair-picture');
    picture.setAttribute('aria-hidden', 'true');
    const body = el('div', 'pair-body');
    body.append(el('p', 'connect-status', 'Finding the way…'));
    const pair = el('div', 'pair');
    pair.append(head, picture, body);
    root.replaceChildren(pair);

    const found = await find(a, b, Math.max(0, Math.floor(Number(q.get('way'))) || 0)).catch(() => null);
    if (mine !== asked) return;
    if (!found) {
      body.replaceChildren(el('p', 'connect-status', 'That did not load. Try again.'));
      return;
    }
    // all of the answer arrives at once, so nothing on the page shifts to make room for it
    head.append(el('p', 'pair-lead', leadOf(found)), el('p', 'answer-notice', NOTICE));
    const actions = actionsOf(a, b, found);
    body.replaceChildren(...answerOf(a, b, found, go), ...(actions ? [actions] : []), el('h2', 'connect-change', 'Change either name'), form);
    drawThread(picture, threadOf(a, b, found));
  };

  addEventListener('popstate', () => void show());
  void show();
}

const root = document.getElementById('connect-root');
if (root) start(root);
