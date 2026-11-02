// atlas.js: one page for every entry of the atlas (ADR-0023). /a/?q=Q42 reads the one shard that
// holds that entry, so an entry costs the same at a thousand dots or a million. Moving to a
// neighbour swaps the page in place; nothing outside the current entry is ever loaded or drawn.
import './atlas.css';
import { atlasEntry, hrefOf, INKS, KINDS, type Entry, type Neighbour } from '../lib/atlas';
import { el } from '../lib/dom';

/** How many neighbours the constellation draws. */
const STARS = 28;

function picture(file: string): string {
  return `https://commons.wikimedia.org/wiki/Special:FilePath/${file}?width=500`;
}

/** The entry and its neighbours as stars: one constellation, drawn once, of what is on screen. */
function constellation(e: Entry, go: (n: Neighbour) => void): SVGSVGElement {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('viewBox', '0 0 640 420');
  svg.setAttribute('class', 'atlas-stars');
  svg.setAttribute('aria-hidden', 'true');
  const all = e.g.flatMap((g) => g[1]).filter((n, i, list) => list.findIndex((m) => m[0] === n[0]) === i);
  const shown = all.slice(0, STARS);
  const [cx, cy] = [320, 210];
  const make = (tag: string, attrs: Record<string, string | number>) => {
    const node = document.createElementNS(NS, tag);
    for (const [k, v] of Object.entries(attrs)) node.setAttribute(k, String(v));
    return node;
  };
  const inkOf = (kind: number) => `var(${INKS[kind] ?? '--accent-fill'})`;
  shown.forEach((n, i) => {
    const a = (i / shown.length) * Math.PI * 2 + 0.4;
    const r = 118 + ((i * 37) % 3) * 42;
    const [x, y] = [cx + Math.cos(a) * r * 1.5, cy + Math.sin(a) * r * 0.88];
    svg.append(make('line', { x1: cx, y1: cy, x2: x, y2: y, class: 'atlas-ray' }));
    const star = make('g', { class: 'atlas-star', tabindex: -1 });
    star.append(make('circle', { cx: x, cy: y, r: 7, fill: inkOf(n[2]) }));
    if (i < 12) {
      const label = make('text', { x, y: y + 20, 'text-anchor': 'middle' });
      label.textContent = n[1].length > 22 ? `${n[1].slice(0, 20)}…` : n[1];
      star.append(label);
    }
    star.addEventListener('click', () => go(n));
    svg.append(star);
  });
  svg.append(make('circle', { cx, cy, r: 22, fill: inkOf(e.k), class: 'atlas-sun' }));
  return svg;
}

function render(root: HTMLElement, q: string, e: Entry, go: (n: Neighbour) => void): void {
  document.title = `${e.n}: Connect the Dots`;
  root.style.setProperty('--c', `var(${INKS[e.k] ?? '--accent-fill'})`);
  const head = el('header', 'atlas-head');
  const words = el('div', 'atlas-words');
  words.append(el('p', 'entity-kind', KINDS[e.k] ?? ''), el('h1', '', e.n));
  if (e.d) words.append(el('p', 'atlas-summary', e.d));
  if (e.y) words.append(el('p', 'atlas-years', e.y));
  const actions = el('p', 'atlas-actions');
  const links: [string, string, string][] = [['Connect to…', `/r/?a=${q}`, 'button primary'], ['On the map', `/w/?focus=${q}`, 'button']];
  if (e.c) links.push(['On the Earth', `/w/?view=earth&focus=${q}`, 'button']);
  for (const [text, href, cls] of links) {
    const a = el('a', cls, text) as HTMLAnchorElement;
    a.href = href;
    actions.append(a);
  }
  words.append(actions);
  head.append(words);
  if (e.i) {
    const img = document.createElement('img');
    img.className = 'atlas-photo';
    img.src = picture(e.i);
    img.alt = e.n;
    img.decoding = 'async';
    const link = el('a', 'atlas-credit', 'Picture: Wikimedia Commons') as HTMLAnchorElement;
    link.href = `https://commons.wikimedia.org/wiki/File:${e.i}`;
    const side = el('div', 'atlas-side');
    side.append(img, link);
    head.append(side);
  }
  const parts: Node[] = [head];
  if (e.g.length) parts.push(constellation(e, go));
  const lists = el('div', 'atlas-groups');
  for (const [phrase, names, more] of e.g) {
    const part = el('section', 'atlas-group');
    part.append(el('h2', '', phrase.charAt(0).toUpperCase() + phrase.slice(1)));
    const ul = el('ul');
    for (const n of names) {
      const a = el('a', '', n[1]) as HTMLAnchorElement;
      a.href = hrefOf(n);
      a.style.setProperty('--c', `var(${INKS[n[2]] ?? '--accent-fill'})`);
      if (!n[4]) {
        a.addEventListener('click', (ev) => {
          ev.preventDefault();
          go(n);
        });
      }
      const li = el('li');
      li.append(a);
      ul.append(li);
    }
    part.append(ul);
    if (more) part.append(el('p', 'atlas-more', `and ${more.toLocaleString('en')} more`));
    lists.append(part);
  }
  parts.push(lists);
  const note = el('p', 'atlas-note', 'This page comes from Wikidata, an open database anyone can edit. We have not checked it by hand yet. ');
  const source = el('a', '', 'See the record') as HTMLAnchorElement;
  source.href = `https://www.wikidata.org/wiki/${q}`;
  note.append(source);
  note.append(document.createTextNode(' or '));
  const fix = el('a', '', 'tell us what is wrong') as HTMLAnchorElement;
  fix.href = `https://github.com/joinprototype/connect-the-dots/issues/new?title=${encodeURIComponent(`Correction: ${e.n}`)}&body=${encodeURIComponent(`Page: ${location.href}\n\nWhat is wrong or missing:\n\nA source that shows it:\n`)}`;
  note.append(fix, document.createTextNode('.'));
  parts.push(note);
  root.replaceChildren(...parts);
  window.scrollTo({ top: 0 });
}

function start(root: HTMLElement): void {
  const show = async (q: string) => {
    const e = /^Q\d+$/.test(q) ? await atlasEntry(q) : undefined;
    if (!e) {
      document.title = 'Not on the map yet: Connect the Dots';
      root.replaceChildren(el('h1', '', 'Not on the map yet'), el('p', 'atlas-summary', 'Search for it above, or start from the Map.'));
      return;
    }
    // a thing written by hand has its own page, with its proof
    if (e.u) {
      location.replace(e.u);
      return;
    }
    render(root, q, e, go);
  };
  const go = (n: Neighbour) => {
    if (n[4]) {
      location.href = hrefOf(n);
      return;
    }
    history.pushState(null, '', hrefOf(n));
    void show(`Q${n[0]}`);
  };
  addEventListener('popstate', () => void show(new URLSearchParams(location.search).get('q') ?? ''));
  void show(new URLSearchParams(location.search).get('q') ?? '');
}

const root = document.getElementById('atlas-root');
if (root) start(root);
