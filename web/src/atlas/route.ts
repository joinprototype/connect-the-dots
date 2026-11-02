// route.js: connect any two entries of the atlas (/r/?a=Q937&b=Q317521). The two fields search the same
// index as the header; a route costs a few small files (lib/atlas-route.ts).
import './atlas.css';
import { atlasEntry, INKS, KINDS } from '../lib/atlas';
import { routeBetween, type Stop } from '../lib/atlas-route';
import { el } from '../lib/dom';
import { fuzzySearch } from '../lib/fuzzy';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';

/** The Wikidata number of a search hit, if it has one. */
const numberOf = (hit: SearchEntry): number | null => {
  const id = /^Q\d+$/.test(hit.id) ? hit.id : hit.w;
  return id ? Number(id.slice(1)) : null;
};

/** One field: a name, its suggestions, and the entry picked. */
class Field {
  readonly node = el('label', 'connect-field');
  readonly input = document.createElement('input');
  private hits = el('ul', 'connect-hits');
  picked: number | null = null;

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
    if (!q.trim()) {
      this.hits.hidden = true;
      return;
    }
    const entries = await candidates(q).catch(() => [] as SearchEntry[]);
    if (q !== this.input.value) return;
    const hits = fuzzySearch(entries.filter((e) => numberOf(e) !== null), q, 6);
    this.hits.replaceChildren(
      ...hits.map(({ item }) => {
        const li = el('li');
        const b = el('button');
        b.type = 'button';
        b.append(item.name, el('span', '', item.summary ?? ''));
        b.addEventListener('click', () => this.set(numberOf(item), item.name));
        li.append(b);
        return li;
      }),
    );
    this.hits.hidden = !hits.length;
  }

  set(n: number | null, name: string): void {
    this.picked = n;
    this.input.value = name;
    this.hits.hidden = true;
    this.changed();
  }
}

function draw(stops: Stop[]): HTMLElement {
  const list = el('ol', 'connect-route');
  for (const s of stops) {
    const li = el('li', 'connect-stop');
    li.style.setProperty('--c', `var(${INKS[s.entry.k] ?? '--cobalt'})`);
    const name = el('a', 'connect-name', s.entry.n) as HTMLAnchorElement;
    name.href = s.entry.u ?? `/a/?q=Q${s.q}`;
    li.append(name, el('span', 'connect-kind', KINDS[s.entry.k] ?? ''));
    if (s.via) li.append(el('span', 'connect-via', s.via));
    list.append(li);
  }
  return list;
}

function start(root: HTMLElement): void {
  const out = el('div');
  let ask = 0;
  const go = async () => {
    const [a, b] = [from.picked, to.picked];
    if (a === null || b === null) return;
    const mine = ++ask;
    history.replaceState(null, '', `/r/?a=Q${a}&b=Q${b}`);
    out.replaceChildren(el('p', 'connect-status', 'Finding the way…'));
    const stops = await routeBetween(a, b).catch(() => null);
    if (mine !== ask) return;
    if (!stops) {
      out.replaceChildren(el('p', 'connect-status', 'No way found between these two yet.'));
      return;
    }
    const map = el('a', 'button', 'See it on the Map') as HTMLAnchorElement;
    map.href = `/w/?route=${stops.map((s) => `Q${s.q}`).join(',')}`;
    const actions = el('p', 'atlas-actions');
    actions.append(map);
    out.replaceChildren(
      draw(stops),
      actions,
      el('p', 'connect-note', 'These links come from open data, and nobody here has read them. Where an entry was written by hand, its page shows the proof. A connection is not evidence of wrongdoing.'),
    );
  };
  const from = new Field('Anyone or anything', () => void go());
  const to = new Field('Anyone or anything else', () => void go());
  const form = el('form', 'connect-form');
  const button = el('button', 'button primary', 'Connect') as HTMLButtonElement;
  button.type = 'submit';
  form.append(from.node, to.node, button);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    void go();
  });
  root.append(form, out);
  const q = new URLSearchParams(location.search);
  const load = async (field: Field, id: string | null) => {
    if (!id) return;
    const e = await atlasEntry(id);
    if (e) field.set(Number(id.slice(1)), e.n);
  };
  void load(from, q.get('a'));
  void load(to, q.get('b'));
}

const root = document.getElementById('connect-root');
if (root) start(root);
