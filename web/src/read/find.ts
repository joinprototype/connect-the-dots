// "Find a name": it rises out of the bar. With nothing typed it lists every story; typing finds written
// names and stories through the site's search (lib/search.ts). Each name says how far it is from where the
// reader is, in steps along links a way may use. A name lands in the thread; a story opens.
import type { GraphIndex } from '../lib/data';
import { fuzzySearch } from '../lib/fuzzy';
import { walks } from '../lib/paths';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';
import { esc, inkOf, joinsNothing, type SiteData } from './stops';

interface Hooks {
  /** Fills the site's lists of stories and of what no step goes on from. */
  lists(): Promise<void>;
  /** The record, and the name the reader is at, to count steps from. */
  here(): Promise<{ idx: GraphIndex; id: string | null }>;
  entry(id: string): void;
  story(id: string): void;
}

/** How many names a search shows. */
const MOST = 24;

export class Find {
  private readonly panel: HTMLElement;
  private readonly list: HTMLElement;
  private readonly input: HTMLInputElement;
  private readonly opener: HTMLButtonElement;
  /** Bumped by each search, so that a slow one gives way to the next. */
  private turn = 0;
  private steps: { from: string | null; hops: Map<string, number> } | null = null;

  constructor(
    private readonly bar: HTMLElement,
    private readonly site: SiteData,
    private readonly hooks: Hooks,
  ) {
    this.opener = bar.querySelector<HTMLButtonElement>('.read-find-open')!;
    this.panel = document.createElement('section');
    this.panel.className = 'read-find';
    this.panel.hidden = true;
    this.panel.setAttribute('aria-label', 'Find a name or a story');
    this.panel.innerHTML = `<div class="read-find-list"></div>
      <form class="read-find-form" role="search" autocomplete="off">
        <input type="search" placeholder="A name, a place, a story" aria-label="Find a name, a place or a story" enterkeyhint="go" spellcheck="false">
        <button class="read-find-close" type="button">Close</button>
      </form>`;
    document.body.append(this.panel);
    this.list = this.panel.querySelector<HTMLElement>('.read-find-list')!;
    this.input = this.panel.querySelector('input')!;
    this.opener.addEventListener('click', () => this.open());
    this.panel.querySelector('.read-find-close')!.addEventListener('click', () => this.close());
    this.input.addEventListener('input', () => void this.render());
    this.panel.querySelector('form')!.addEventListener('submit', (ev) => {
      ev.preventDefault();
      this.list.querySelector<HTMLButtonElement>('.read-fr')?.click();
    });
    this.panel.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape') this.close();
    });
    this.list.addEventListener('click', (ev) => {
      const row = (ev.target as Element).closest<HTMLButtonElement>('.read-fr');
      if (!row) return;
      this.close();
      if (row.dataset.story) this.hooks.story(row.dataset.story);
      else if (row.dataset.entry) this.hooks.entry(row.dataset.entry);
    });
  }

  private open(): void {
    this.panel.hidden = false;
    this.bar.hidden = true;
    this.input.value = '';
    this.steps = null;
    void this.render();
    this.input.focus();
  }

  private close(): void {
    this.panel.hidden = true;
    this.bar.hidden = false;
    this.opener.focus({ preventScroll: true });
  }

  private storyRows(rows: SiteData['stories']): string {
    return rows
      .map(([id, title, subtitle, scenes]) => `<button class="read-fr" type="button" data-story="${esc(id)}"><i></i><b>${esc(title)}</b><span class="read-far">${scenes} scenes</span>${subtitle ? `<span class="read-ln2">${esc(subtitle)}</span>` : ''}</button>`)
      .join('');
  }

  private async render(): Promise<void> {
    const q = this.input.value.trim();
    const turn = ++this.turn;
    if (!q) {
      await this.hooks.lists();
      if (turn !== this.turn) return;
      const all = [...this.site.stories].sort((a, b) => a[1].localeCompare(b[1]));
      this.list.classList.remove('found');
      this.list.innerHTML = `<p class="read-fnote">Every name here was written by hand, each link with its proof. Type one, or pick a story.</p><p class="read-fhead">${all.length} stories</p>${this.storyRows(all)}`;
      this.list.scrollTop = 0;
      return;
    }
    // a name, not a sentence: every word is looked up
    const [found, here] = await Promise.all([candidates(q), this.hooks.here()]);
    if (turn !== this.turn) return;
    // written entries and stories; open data and question pages have their own pages
    const names = fuzzySearch(
      found.filter((e) => e.url.startsWith('/e/') && here.idx.nodes.has(e.id)),
      q,
      MOST,
    );
    const titles = new Set(fuzzySearch(found.filter((e) => e.type === 'chapter'), q, 5).map((h) => h.item.url));
    const stories = this.site.stories.filter(([id]) => titles.has(`/c/${id}/`));
    const far = this.distances(here.idx, here.id);
    const row = (e: SearchEntry) => {
      const n = here.idx.nodes.get(e.id)!;
      const h = far.get(e.id);
      const away = e.id === here.id ? 'you are here' : here.id == null ? '' : h == null ? 'no way from here' : h === 1 ? 'one step away' : `${h} steps away`;
      const line = e.summary || [here.idx.data.types[n.type]?.label, e.when].filter(Boolean).join(', ');
      return `<button class="read-fr" type="button" data-entry="${esc(e.id)}" style="--c: ${esc(inkOf(this.site, n.type))}"><i></i><b>${esc(n.name)}</b><span class="read-far">${away}</span>${line ? `<span class="read-ln2">${esc(line)}</span>` : ''}</button>`;
    };
    const hits = names.map((h) => h.item);
    this.list.classList.add('found');
    this.list.innerHTML = hits.slice(0, 1).map(row).join('') + this.storyRows(stories) + hits.slice(1).map(row).join('') || '<p class="read-fnone">Nothing here by that name. Try another spelling, or a shorter part of the name.</p>';
  }

  /** Steps from the reader's name to every other, along links a way may use: none through a sealed
   *  entry, a people or a faith. */
  private distances(idx: GraphIndex, from: string | null): Map<string, number> {
    if (this.steps?.from === from) return this.steps.hops;
    const hops = new Map<string, number>();
    if (from) {
      hops.set(from, 0);
      let ring = [from];
      for (let d = 1; ring.length; d++) {
        const next: string[] = [];
        for (const x of ring) {
          if (d > 1 && joinsNothing(idx, this.site, x)) continue;
          for (const e of idx.incident.get(x) ?? []) {
            if (!walks(e)) continue;
            const y = e.from === x ? e.to : e.from;
            if (hops.has(y) || joinsNothing(idx, this.site, y)) continue;
            hops.set(y, d);
            next.push(y);
          }
        }
        ring = next;
      }
    }
    this.steps = { from, hops };
    return hops;
  }
}
