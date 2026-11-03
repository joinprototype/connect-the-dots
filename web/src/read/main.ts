// Read (/read/ and /read/<id>/, theme/templates/read.html): a story over the field of dots where it
// happens. Scrolling reads on, and the picture beside the words follows them. A name is a door: a tap
// folds the story there and lands on that thing, with the link that joins it and its proof open, and one
// tap leads back. At the end, the stories that share the most with this one are offered, each with its
// reason, and one joins the page only when the reader picks it.
//
// Following a line from dot to dot is how a conspiracy board works, and the form persuades whatever the
// words say. So the thread never grows by itself: every step is the reader's, it says why it is
// offered, the bar says how far it is from the story, and the story's own words are one tap away.
import './read.css';
import { loadDetails, loadGraphIndex, loadJson, type GraphIndex } from '../lib/data';
import { DotField, loadField, MOVE, type Mark, type Scene } from '../lib/dotfield';
import { findPaths } from '../lib/paths';
import type { GEdge } from '../lib/types';
import { Find } from './find';
import { entryScene, phone, StoryPictures, wayScene, wide, type StoryData } from './pictures';
import { doorsEl, esc, headEl, inkOf, joinsNothing, proofHTML, rowsOf, stepEl, wayEl, type SiteData, type StoryRow } from './stops';

/** The opening move, from the whole world to where the story begins, in milliseconds. */
const OPENING = 2300;

const site: SiteData = { stories: [], sealed: [], background: [], ...JSON.parse(document.getElementById('read-site')?.textContent ?? '{}') };
const threadEl = document.querySelector<HTMLElement>('.read-thread');
const pictureEl = document.querySelector<HTMLElement>('.read-picture');
const stampEl = pictureEl?.querySelector<HTMLElement>('.read-stamp');
const ink = (type: string) => inkOf(site, type);
const calm = () => matchMedia('(prefers-reduced-motion: reduce)').matches;

/** A name the reader landed on. */
interface Stop {
  el: HTMLElement;
  id: string;
  ink: string;
  /** Links from the stop before (or the story) to here: 0 when the story names it with no link of its
   *  own, null when it was found by name with no way to it. */
  hops: number | null;
}

/** Where a story is folded while the reader is away from it: the stops, after the scene they left. */
interface Detour {
  el: HTMLElement;
  scene: number;
  /** The name tapped, which gets the focus back. */
  door: HTMLElement | null;
  stops: Stop[];
  folded: HTMLElement[];
  left: number;
}

class Story {
  readonly pics: StoryPictures;
  detour: Detour | null = null;
  constructor(
    readonly el: HTMLElement,
    readonly d: StoryData,
  ) {
    this.pics = new StoryPictures(d, ink);
  }
}

const stories: Story[] = [];
let field: DotField | null = null;
/** What each part of the reading shows beside it, and the date stamped on it. */
const pictures = new Map<Element, { scene: () => Scene; stamp?: string; nopic?: boolean }>();
let active: Element | null = null;
let opening = false;
let busy = false;

// the part of the reading at the reading line is the one the picture shows
const spy = new IntersectionObserver(
  (entries) => {
    for (const e of entries) if (e.isIntersecting) activate(e.target);
  },
  { rootMargin: phone() ? '-52% 0px -44% 0px' : '-42% 0px -54% 0px' },
);

function bind(el: Element, scene: () => Scene, more: { stamp?: string; nopic?: boolean } = {}): void {
  pictures.set(el, { scene, ...more });
  spy.observe(el);
}

function unbind(root: Element): void {
  for (const el of [root, ...root.querySelectorAll('*')]) {
    if (pictures.delete(el)) spy.unobserve(el);
  }
}

function activate(el: Element): void {
  active = el;
  const p = pictures.get(el);
  if (!p) return;
  // on a phone a long list takes the picture's room
  document.body.classList.toggle('read-nopic', !!p.nopic && phone());
  if (stampEl) stampEl.textContent = p.stamp ?? '';
  if (field && !opening) field.show(p.scene());
  renderBar();
}

const storyOf = (el: Element | null): Story | undefined => (el ? stories.find((s) => s.el.contains(el)) : undefined);
const size = (): [number, number] => field?.size ?? [innerWidth, innerHeight];

function addStory(el: HTMLElement): Story {
  const d = JSON.parse(el.querySelector('script.read-data')?.textContent ?? '{}') as StoryData;
  const story = new Story(el, d);
  stories.push(story);
  stories.sort((a, b) => (a.el.compareDocumentPosition(b.el) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
  const band = el.querySelector('.read-band');
  if (band) bind(band, () => story.pics.cover());
  for (const sc of el.querySelectorAll<HTMLElement>('.read-scene')) {
    const i = Number(sc.dataset.scene);
    bind(sc, () => story.pics.scene(i, size()), { stamp: d.scenes[i]?.t });
  }
  const last = d.scenes.length - 1;
  const end = el.querySelector('.read-end');
  if (end && last >= 0) bind(end, () => story.pics.scene(last, size()), { stamp: d.scenes[last].t });
  return story;
}

// ---- the record, loaded the first time a door is near a pointer or opened --------------------------

let index: Promise<GraphIndex> | null = null;
/** Each entry's written stories, as data/stories.json lists them. */
let storyRows: Record<string, StoryRow[]> = {};

/** A story's own links carry their proof: the index gets it, so that no pack is fetched for them. */
function merge(idx: GraphIndex, story: Story): void {
  Object.assign(idx.data.sources, story.d.data.sources);
  for (const e of story.d.data.edges) {
    const known = idx.edges.get(e.id);
    if (known && !known.full) Object.assign(known, { sources: e.sources, qualifiers: e.qualifiers ?? {}, detail: e.detail, note: e.note, reason: e.reason, full: true });
  }
}

/** The stories, and what no step may go on from (data/read.json). */
function lists(): Promise<void> {
  return loadJson<Pick<SiteData, 'stories' | 'sealed' | 'background'>>('/data/read.json').then((d) => void Object.assign(site, d));
}

function graph(): Promise<GraphIndex> {
  index ??= Promise.all([loadGraphIndex(), loadJson<Record<string, StoryRow[]>>('/data/stories.json'), lists()]).then(([idx, rows]) => {
    storyRows = rows;
    stories.forEach((s) => merge(idx, s));
    return idx;
  });
  index.catch(() => (index = null));
  return index;
}

/** Any link between two entries, the strongest first: a direct tie, even one no route may use. */
function linkBetween(idx: GraphIndex, a: string, b: string): GEdge | null {
  const ties = (idx.incident.get(a) ?? []).filter((e) => e.from !== e.to && (e.from === b || e.to === b) && e.status !== 'deprecated');
  return ties.sort((x, y) => Number(y.traversable) - Number(x.traversable))[0] ?? null;
}

/** Why a name in a story leads to its entry: a link the story itself reveals, in this scene or the
 *  nearest one that has it, else a link to a name this scene shows. */
function reason(idx: GraphIndex, story: Story, target: string, scene: number): [GEdge | null, string | null] {
  const scenes = story.d.scenes;
  const other = (e: GEdge) => (e.from === target ? e.to : e.from);
  const touches = (e: GEdge) => e.from !== e.to && (e.from === target || e.to === target) && e.status !== 'deprecated';
  const order = scenes.map((_, j) => j).sort((a, b) => Math.abs(a - scene) - Math.abs(b - scene) || a - b);
  for (const j of order) {
    for (const ref of scenes[j].x ?? []) {
      for (const own of story.pics.claims.get(ref) ?? []) {
        if (touches(own)) return [idx.edges.get(own.id) ?? own, other(own)];
      }
    }
  }
  const here = scenes[Math.max(0, scene)];
  const near = new Set([...(here?.r ?? []), ...(here?.p ?? []), ...(here?.f ? [here.f] : [])]);
  for (const e of idx.incident.get(target) ?? []) if (touches(e) && near.has(other(e))) return [e, other(e)];
  return [null, null];
}

// ---- detours: the story folded at a scene, and the names the reader went on to --------------------

function openDetour(story: Story, scene: number, door: HTMLElement | null): Detour {
  if (story.detour) closeDetour(story, false);
  const el = story.el;
  const at = scene >= 0 ? el.querySelector(`.read-scene[data-scene="${scene}"]`) : (el.querySelector('.read-intro') ?? el.querySelector('.read-band'));
  const folded = [...el.querySelectorAll<HTMLElement>('.read-scene')].filter((s) => Number(s.dataset.scene) > scene);
  const left = folded.length;
  const end = el.querySelector<HTMLElement>('.read-end');
  if (end) folded.push(end);
  for (const f of folded) f.hidden = true;
  const box = document.createElement('div');
  box.className = 'read-detour';
  box.innerHTML = `<p class="read-return"><button class="read-back" type="button">Back to ${esc(story.d.title)}</button>${left ? `, ${left === 1 ? 'one scene' : `${left} scenes`} left` : ''}.</p>`;
  at?.after(box);
  story.detour = { el: box, scene, door, stops: [], folded, left };
  // the browser's Back closes it too: one step back, however many stops it holds
  const state = { read: 'detour', story: story.d.id };
  if (history.state?.read === 'detour' && history.state.story === story.d.id) history.replaceState(state, '');
  else history.pushState(state, '');
  return story.detour;
}

function closeDetour(story: Story, scroll: boolean): void {
  const d = story.detour;
  if (!d) return;
  story.detour = null;
  unbind(d.el);
  d.el.remove();
  for (const f of d.folded) f.hidden = false;
  d.door?.classList.remove('on');
  if (scroll) {
    const back = d.scene >= 0 ? story.el.querySelector<HTMLElement>(`.read-scene[data-scene="${d.scene}"]`) : story.el.querySelector<HTMLElement>('.read-band');
    if (back) arrive(back, d.door);
  }
  renderBar();
}

function goBack(story: Story): void {
  if (history.state?.read === 'detour' && history.state.story === story.d.id) history.back();
  else closeDetour(story, true);
}

/** Leaves the stops up to `stop` and takes away those after it: the thread is one line. */
function cutAfter(d: Detour, stop: Stop): void {
  const at = d.stops.indexOf(stop);
  for (const s of d.stops.splice(at + 1)) {
    unbind(s.el);
    s.el.remove();
  }
}

/** Brings a part of the thread to the reading place, under the picture on a phone. */
function arrive(el: HTMLElement, focus?: HTMLElement | null): void {
  requestAnimationFrame(() => {
    const pic = document.querySelector('.dotfield-dots')?.clientHeight ?? innerHeight / 3;
    const top = el.getBoundingClientRect().top + scrollY - (phone() ? pic + 8 : innerHeight * 0.06);
    scrollTo({ top, behavior: calm() ? 'auto' : 'smooth' });
    const f = focus ?? el.querySelector<HTMLElement>('h2, h1');
    if (f) {
      if (!f.matches('a, button, [tabindex]')) f.tabIndex = -1;
      f.focus({ preventScroll: true });
    }
  });
}

/** How the reader got to a name: the step that joins it, with its proof, or the way to it. */
interface Approach {
  el: HTMLElement;
  /** Its own picture; the name's, without one. */
  scene?: () => Scene;
}

/** The step along a link, its proof loaded first; without a link, only that the story names it. */
async function stepTo(idx: GraphIndex, story: Story, edge: GEdge | null, from: string | null): Promise<Approach> {
  if (edge && !edge.full) await loadDetails(idx, edge.from);
  return { el: stepEl(idx, site, edge, edge ? from : null, story.d.title) };
}

/** A stop: how the reader got here, the name, and what goes on from it. */
async function stopFor(idx: GraphIndex, story: Story, id: string, from: string | null, way: Approach | null, left: number, hops: number | null): Promise<Stop> {
  const n = idx.nodes.get(id)!;
  const details = await loadDetails(idx, id);
  const el = document.createElement('section');
  el.className = 'read-stop';
  el.dataset.entry = id;
  el.setAttribute('aria-label', n.name);
  const step = way?.el;
  if (step) el.append(step);
  const head = headEl(idx, site, n, details?.summary ?? null);
  const rows = rowsOf(idx, site, id, (o) => storyRows[o]?.length ?? 0);
  // a story it is in, to read next if the reader wants: one not already in the thread
  let book = null;
  let also: StoryRow[] = [];
  if (!joinsNothing(idx, site, id)) {
    const list = (storyRows[id] ?? []).map(([title, url]): StoryRow => [title, url.replace(/^\/c\//, '/read/')]).filter(([, url]) => !stories.some((s) => url === `/read/${s.d.id}/`));
    if (list[0]) {
      const sid = list[0][1].split('/')[2];
      book = { title: list[0][0], subtitle: site.stories.find((s) => s[0] === sid)?.[2] ?? null, url: list[0][1] };
      also = list.slice(1);
    }
  }
  const doors = doorsEl(idx, site, n, { back: story.d.title, left, book, also, rows, open: details?.open ?? null });
  el.append(head, doors);
  const others = [...new Map(rows.map((r) => [r.other.id, r.other])).values()];
  const scene = () => entryScene(idx, id, others, from, ink);
  if (step) bind(step, way?.scene ?? scene);
  bind(head, scene);
  bind(doors, scene, { nopic: rows.length > 3 });
  return { el, id, ink: ink(n.type), hops };
}

/** Puts a stop in the thread: after the stop the reader came from, or at a scene, folding the story. */
function place(story: Story, stop: Stop, scene: number, after: Stop | null, door: HTMLElement | null): void {
  const d = after && story.detour ? story.detour : openDetour(story, scene, door);
  if (after) cutAfter(d, after);
  d.el.querySelector('.read-return')!.before(stop.el);
  d.stops.push(stop);
  renderBar();
  arrive(stop.el);
}

/** Where the reader is: the stop, or the story and scene, at the reading line. */
function whereAt(): { story: Story; stop: Stop | null; scene: number } | null {
  const at = active ?? stories[0]?.el;
  const story = storyOf(at) ?? stories[0];
  if (!story) return null;
  const stopEl = at?.closest('.read-stop');
  const stop = (stopEl && story.detour?.stops.find((s) => s.el === stopEl)) || null;
  const scene = Number(at?.closest<HTMLElement>('.read-scene')?.dataset.scene ?? -1);
  return { story, stop, scene: stop ? (story.detour?.scene ?? -1) : scene };
}

/** A door: a name in a story or a stop, or a dot in the picture. */
async function openDoor(id: string, at: Element, door: HTMLElement | null, edgeId?: string): Promise<void> {
  const story = storyOf(at);
  if (!story || busy) return;
  busy = true;
  door?.classList.add('on');
  try {
    const idx = await graph();
    if (!idx.nodes.has(id)) {
      if (door instanceof HTMLAnchorElement) location.assign(door.href);
      return;
    }
    const stopEl = at.closest('.read-stop');
    const after = (stopEl && story.detour?.stops.find((s) => s.el === stopEl)) || null;
    if (after?.id === id) return;
    let edge: GEdge | null;
    let from: string | null;
    let scene = -1;
    if (after) {
      from = after.id;
      edge = (edgeId && idx.edges.get(edgeId)) || linkBetween(idx, from, id);
      scene = story.detour!.scene;
    } else {
      scene = Number(at.closest<HTMLElement>('.read-scene')?.dataset.scene ?? -1);
      [edge, from] = reason(idx, story, id, scene);
    }
    const left = after ? story.detour!.left : story.d.scenes.length - scene - 1;
    const stop = await stopFor(idx, story, id, from, await stepTo(idx, story, edge, from), left, edge ? 1 : after ? null : 0);
    place(story, stop, scene, after, after ? null : door);
  } catch {
    if (door instanceof HTMLAnchorElement) location.assign(door.href);
  } finally {
    busy = false;
  }
}

/** A name found by "Find a name": it lands where the reader is, with the way from there above it. */
async function lookUp(id: string): Promise<void> {
  const where = whereAt();
  if (!where || busy) return;
  busy = true;
  try {
    const { story, stop, scene } = where;
    const idx = await graph();
    const here = stop?.id ?? hereIn(idx, story, scene);
    let way: Approach | null = null;
    let hops: number | null = null;
    if (here && here !== id) {
      // a way only along links routes may use, never through a sealed entry, a people or a faith
      const allowEdge = (e: GEdge) => !joinsNothing(idx, site, e.from) && !joinsNothing(idx, site, e.to);
      const path = findPaths(idx, here, id, { allowEdge })[0];
      // else a direct tie, even one no route may use, with its caveat (ADR-0027)
      const edge = path?.hops.length === 1 ? path.hops[0].edge : path ? null : linkBetween(idx, here, id);
      if (path && path.hops.length > 1) {
        way = { el: wayEl(idx, site, path), scene: () => wayScene(idx, path.nodes, ink) };
        hops = path.hops.length;
      } else if (edge) {
        way = await stepTo(idx, story, edge, here);
        hops = 1;
      } else {
        const box = document.createElement('div');
        box.className = 'read-way';
        box.innerHTML = `<p class="read-lead">No way on the written record from ${esc(idx.nodes.get(here)?.name)} to ${esc(idx.nodes.get(id)?.name)}.</p>`;
        way = { el: box };
      }
    }
    const left = stop ? story.detour!.left : story.d.scenes.length - scene - 1;
    const landed = await stopFor(idx, story, id, here && here !== id ? here : null, way, left, hops);
    place(story, landed, scene, stop, null);
  } finally {
    busy = false;
  }
}

/** The name a scene is most about, for a way to start from: its focus, else one with links a way may use. */
function hereIn(idx: GraphIndex, story: Story, scene: number): string | null {
  const sc = story.d.scenes[Math.max(0, scene)];
  if (!sc) return null;
  const names = [sc.f, ...(sc.r ?? []), ...(sc.p ?? [])].filter((x): x is string => !!x && idx.nodes.has(x) && !joinsNothing(idx, site, x));
  return names.find((x) => (idx.incident.get(x) ?? []).some((e) => e.traversable)) ?? names[0] ?? null;
}

/** The next story, the reader's pick at the end of one: its page's story, added below this one. */
async function join(from: Story, id: string, a: HTMLAnchorElement): Promise<void> {
  const there = stories.find((s) => s.d.id === id);
  if (there) return arrive(there.el.querySelector<HTMLElement>('.read-band') ?? there.el);
  if (busy) return;
  busy = true;
  a.classList.add('on');
  try {
    const res = await fetch(`/read/${encodeURIComponent(id)}/`, { credentials: 'same-origin' });
    if (!res.ok) throw new Error(`${res.status}`);
    const doc = new DOMParser().parseFromString(await res.text(), 'text/html');
    const found = doc.querySelector<HTMLElement>('.read-story');
    if (!found) throw new Error('no story');
    const el = document.importNode(found, true);
    // one heading among the page's now
    const h1 = el.querySelector('h1');
    if (h1) {
      const h2 = document.createElement('h2');
      h2.className = h1.className;
      h2.id = h1.id;
      h2.innerHTML = h1.innerHTML;
      h1.replaceWith(h2);
    }
    // why it is here, in the words that offered it
    const why = a.closest('li')?.querySelector('.read-why')?.textContent?.replace(/\.$/, '') ?? '';
    const tell = document.createElement('p');
    tell.className = 'read-tell';
    tell.textContent = `After ${from.d.title}. ${why ? `${why}, and that is all this says.` : ''}`;
    el.querySelector('.read-band')?.prepend(tell);
    from.el.after(el);
    const story = addStory(el);
    if (index) void index.then((idx) => merge(idx, story));
    history.pushState({ read: 'story', story: id }, '', `/read/${id}/`);
    document.title = doc.title;
    renderBar();
    arrive(el.querySelector<HTMLElement>('.read-band') ?? el);
  } catch {
    location.assign(a.href);
  } finally {
    busy = false;
  }
}

async function toggleProof(btn: HTMLButtonElement): Promise<void> {
  const host = btn.closest<HTMLElement>('[data-edge]');
  const box = host?.querySelector<HTMLElement>('.read-pr');
  if (!host || !box) return;
  const open = box.hidden;
  box.hidden = !open;
  btn.setAttribute('aria-expanded', String(open));
  btn.textContent = open ? 'close' : 'proof';
  if (!open || box.dataset.done) return;
  const idx = await graph();
  const e = idx.edges.get(host.dataset.edge ?? '');
  if (!e) return;
  if (!e.full) await loadDetails(idx, e.from);
  box.innerHTML = proofHTML(idx, e);
  box.dataset.done = '1';
}

// ---- the bar: the thread as beads, where the reader is, and "Find a name" ----------------------------

const bar = document.createElement('nav');
bar.className = 'read-bar';
bar.setAttribute('aria-label', 'Your reading');
bar.innerHTML = '<div class="read-beads"></div><p class="read-here"></p><button class="read-find-open" type="button">Find a name</button>';
const beadsEl = bar.querySelector<HTMLElement>('.read-beads')!;
const hereEl = bar.querySelector<HTMLElement>('.read-here')!;

function renderBar(): void {
  const where = active ? whereAt() : null;
  const current = where?.stop?.el ?? where?.story.el;
  beadsEl.textContent = '';
  const bead = (target: HTMLElement, label: string, color: string | null) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'read-bead';
    b.title = label;
    b.setAttribute('aria-label', label);
    if (color) b.style.setProperty('--c', color);
    if (target === current) b.setAttribute('aria-current', 'true');
    b.addEventListener('click', () => arrive(target.querySelector<HTMLElement>('.read-band, .read-head') ?? target));
    beadsEl.append(b);
  };
  for (const s of stories) {
    bead(s.el, s.d.title, null);
    for (const stop of s.detour?.stops ?? []) bead(stop.el, stop.el.getAttribute('aria-label') ?? '', stop.ink);
  }
  beadsEl.scrollLeft = beadsEl.scrollWidth;
  if (!where) {
    hereEl.textContent = stories[0]?.d.title ?? '';
    return;
  }
  const { story, stop } = where;
  if (stop) {
    // how far the reader is from the story's own words, in links on the record
    const way = (story.detour?.stops ?? []).slice(0, (story.detour?.stops.indexOf(stop) ?? 0) + 1).map((s) => s.hops);
    const steps = way.includes(null) ? null : way.reduce<number>((a, b) => a + (b ?? 0), 0);
    const far = steps == null ? 'away from' : steps === 0 ? 'named in' : steps === 1 ? 'one step from' : `${steps} steps from`;
    hereEl.innerHTML = `${esc(stop.el.getAttribute('aria-label'))}<small>${far} ${esc(story.d.title)}</small>`;
  } else {
    const n = Number(active?.closest<HTMLElement>('.read-scene')?.dataset.scene ?? -1);
    hereEl.innerHTML = `${esc(story.d.title)}${n >= 0 ? `<small>${n + 1} of ${story.d.scenes.length}</small>` : ''}`;
  }
}

// ---- start -----------------------------------------------------------------------------------------

function startPicture(): void {
  if (!pictureEl) return;
  field = new DotField(pictureEl, { onPick: (m: Mark) => active && void openDoor(m.id, active, null), fade: phone() ? 0 : 110 });
  const band = stories[0]?.el.querySelector('.read-band');
  const now = active ? pictures.get(active) : undefined;
  if (calm() || (active && active !== band)) {
    if (now) field.show(now.scene(), 0);
    return;
  }
  // the opening: the whole world, then one move to where the story begins, once the dots are in
  opening = true;
  field.show(wide(), 0);
  const land = () => {
    opening = false;
    const p = active ? pictures.get(active) : undefined;
    if (p) field?.show(p.scene(), active === band ? OPENING : MOVE);
  };
  loadField().then(land, land);
}

if (threadEl && pictureEl) {
  for (const el of threadEl.querySelectorAll<HTMLElement>('.read-story')) addStory(el);
  document.body.append(bar);
  renderBar();
  new Find(bar, site, {
    lists,
    entry: (id) => void lookUp(id),
    story: (id) => {
      const s = stories.find((x) => x.d.id === id);
      if (s) arrive(s.el.querySelector<HTMLElement>('.read-band') ?? s.el);
      else location.assign(`/read/${encodeURIComponent(id)}/`);
    },
    here: async () => {
      const idx = await graph();
      const where = whereAt();
      return { idx, id: where ? (where.stop?.id ?? hereIn(idx, where.story, where.scene)) : null };
    },
  });

  threadEl.addEventListener('click', (ev) => {
    if (ev.defaultPrevented || ev.button !== 0 || ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return;
    const t = ev.target as Element;
    const back = t.closest('.read-back');
    if (back) {
      const s = storyOf(back);
      if (s) goBack(s);
      return;
    }
    const pf = t.closest<HTMLButtonElement>('.read-pf');
    if (pf) return void toggleProof(pf);
    const show = t.closest<HTMLButtonElement>('.read-showway');
    if (show) {
      const hops = show.nextElementSibling as HTMLElement | null;
      if (hops) hops.hidden = false;
      show.remove();
      return;
    }
    const a = t.closest<HTMLAnchorElement>('a');
    if (!a) return;
    const story = storyOf(a);
    if (a.dataset.next && story) {
      ev.preventDefault();
      return void join(story, a.dataset.next, a);
    }
    const m = /^\/e\/([^/?#]+)\/$/.exec(a.getAttribute('href') ?? '');
    if (!m || !story) return;
    ev.preventDefault();
    void openDoor(decodeURIComponent(m[1]), a, a, a.dataset.edge);
  });
  // the record starts loading when a door is about to be opened
  const near = (ev: Event) => (ev.target as Element).closest?.('a[href^="/e/"]') && void graph();
  threadEl.addEventListener('pointerdown', near, { passive: true });
  threadEl.addEventListener('focusin', near);
  // a row and its dot in the picture answer each other
  threadEl.addEventListener('mouseover', (ev) => field?.light((ev.target as Element).closest<HTMLElement>('.read-row')?.dataset.other ?? null), { passive: true });

  addEventListener('popstate', (ev) => {
    const state = ev.state as { read?: string; story?: string } | null;
    let closed = false;
    for (const s of stories) {
      if (s.detour && !(state?.read === 'detour' && state.story === s.d.id)) {
        closeDetour(s, true);
        closed = true;
      }
    }
    if (closed) return;
    const id = /^\/read\/([^/]+)\//.exec(location.pathname)?.[1];
    const s = stories.find((x) => x.d.id === id);
    if (s) arrive(s.el.querySelector<HTMLElement>('.read-band') ?? s.el);
  });

  // the picture comes after the words have painted
  requestAnimationFrame(() => setTimeout(startPicture, 0));
}
