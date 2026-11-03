// What goes in the Map's card, on Links and on the Earth: an entry's way on, its stories and its links.
import { openRest, type Entry, type Neighbour, type Story } from '../lib/atlas';
import { el } from '../lib/dom';
import type { WorldEntity } from './tiles';

const CARD_GROUPS = 6;
const CARD_NAMES = 5;

export const isAtlasId = (id: string) => /^Q\d+$/.test(id);

/** Only same-site paths may become links (entities.json comes from the same origin, but be strict). */
export const safeHref = (url: unknown): string | null => (typeof url === 'string' && /^\/(?!\/)/.test(url) ? url : null);

/** "Open page ›" and "Explore". */
export function entityActions(entity: WorldEntity): HTMLElement {
  const actions = el('div', 'ctdw-actions');
  const href = safeHref(entity.url);
  if (href) {
    const open = el('a', 'ctdw-btn is-primary', 'Open page ›');
    open.href = href;
    actions.append(open);
  }
  const ask = el('a', 'ctdw-btn', 'Connect to…');
  ask.href = `/ask/?a=${encodeURIComponent(entity.id)}`;
  actions.append(ask);
  return actions;
}

/** The written stories a dot leads to, or a plain word that it has none: most of a million do not. */
export function storyList(stories: Story[]): Node[] {
  if (!stories.length) return [el('p', 'ctdw-meta', 'No story here yet.')];
  const list = el('ul', 'ctdw-list');
  for (const s of stories) {
    const name = el('a', 'ctdw-list-name', s.title);
    name.href = s.url;
    const li = el('li');
    li.append(name);
    if (s.via) li.append(el('span', 'ctdw-list-meta', `through ${s.via}`));
    list.append(li);
  }
  return [el('p', 'ctdw-list-head', 'Stories'), list];
}

/** What it is, a way on, its stories and what it links to. */
export function linksBody(q: string, e: Entry, stories: Story[], focus: (id: string) => void): Node[] {
  const body: Node[] = [];
  if (e.d) body.push(el('p', 'ctdw-summary', e.d));
  const actions = el('div', 'ctdw-actions');
  const open = el('a', 'ctdw-btn is-primary', 'Open page ›');
  open.href = e.u ?? `/a/?q=${q}`;
  const connect = el('a', 'ctdw-btn', 'Connect to…');
  connect.href = `/ask/?a=${q}`;
  actions.append(open, connect);
  body.push(actions, ...storyList(stories));
  const links = el('div', 'ctdw-links');
  for (const [i, [phrase, names, more]] of e.g.slice(0, CARD_GROUPS).entries()) {
    links.append(el('p', 'ctdw-list-head', phrase.charAt(0).toUpperCase() + phrase.slice(1)));
    const ul = el('ul', 'ctdw-list');
    const last = el('li');
    const add = (n: Neighbour) => {
      const b = el('button', 'ctdw-link', n[1]);
      b.type = 'button';
      b.addEventListener('click', () => focus(`Q${n[0]}`));
      const li = el('li');
      li.append(b);
      ul.insertBefore(li, last);
    };
    ul.append(last);
    names.slice(0, CARD_NAMES).forEach(add);
    if (more || names.length > CARD_NAMES) last.append(openRest(q, i, more, names.slice(CARD_NAMES), 'ctdw-link is-more', add));
    else last.remove();
    links.append(ul);
  }
  if (e.g.length) body.push(links);
  return body;
}
