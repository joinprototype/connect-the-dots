import { loadSearch, prettifyId } from '../lib/data';
import { el } from '../lib/dom';
import { requestFocus } from '../lib/events';
import { fuzzySearch, splitRanges, type FuzzyHit } from '../lib/fuzzy';
import type { SearchEntry } from '../lib/types';

let uid = 0;

/**
 * <ctd-search>: search box with a results dropdown. Enhances a server-rendered <input> if present.
 * Enter or click goes to the result's page (or shows it in place on the explorer and world pages).
 * Arrow keys move, Escape closes.
 */
export class CtdSearch extends HTMLElement {
  private input?: HTMLInputElement;
  private list!: HTMLUListElement;
  private hits: FuzzyHit<SearchEntry>[] = [];
  private active = -1;
  private entries: SearchEntry[] | null = null;
  private failed = false;

  connectedCallback(): void {
    if (this.input) return;
    const id = `ctd-search-${++uid}`;
    this.classList.add('ctd-search');
    let input = this.querySelector('input');
    if (!input) {
      input = el('input');
      input.type = 'search';
      input.placeholder = this.getAttribute('placeholder') ?? 'Search people, places, ideas…';
      input.setAttribute('aria-label', 'Search');
      this.append(input);
    }
    this.input = input;
    input.autocomplete = 'off';
    input.spellcheck = false;
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', `${id}-list`);

    this.list = el('ul', 'ctd-search-results');
    this.list.id = `${id}-list`;
    this.list.setAttribute('role', 'listbox');
    this.list.hidden = true;
    (input.closest('form') ?? input).after(this.list);

    input.addEventListener('focus', () => void this.ensureEntries());
    input.addEventListener('input', () => void this.update());
    input.addEventListener('keydown', (e) => this.onKey(e));
    this.addEventListener('focusout', (e) => {
      if (!this.contains(e.relatedTarget as Node | null)) this.close();
    });
    this.list.addEventListener('pointerdown', (e) => e.preventDefault()); // keep focus in the input
    this.list.addEventListener('click', (e) => {
      const li = (e.target as Element).closest<HTMLElement>('[data-index]');
      if (li) this.go(Number(li.dataset.index));
    });
    input.closest('form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.go(this.active >= 0 ? this.active : 0);
    });
  }

  private async ensureEntries(): Promise<SearchEntry[] | null> {
    if (this.entries || this.failed) return this.entries;
    try {
      this.entries = await loadSearch();
    } catch {
      this.failed = true;
    }
    return this.entries;
  }

  private async update(): Promise<void> {
    const q = this.input!.value;
    const entries = await this.ensureEntries();
    if (q !== this.input!.value) return; // a newer keystroke won
    if (!q.trim()) return this.close();
    this.hits = entries ? fuzzySearch(entries, q, 8) : [];
    this.active = this.hits.length ? 0 : -1;
    this.render(entries ? 'No matches' : 'Search is unavailable right now');
  }

  private render(emptyText: string): void {
    const list = this.list;
    list.replaceChildren();
    if (!this.hits.length) list.append(el('li', 'ctd-search-empty', emptyText));
    this.hits.forEach((hit, i) => {
      const li = el('li');
      li.id = `${list.id}-${i}`;
      li.dataset.index = String(i);
      li.dataset.type = hit.item.type;
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', String(i === this.active));
      const name = el('span', 'ctd-search-name');
      const shown = hit.isAlias ? hit.item.name : hit.text;
      const ranges = hit.isAlias ? [] : hit.ranges;
      for (const part of splitRanges(shown, ranges)) name.append(part.hit ? el('mark', '', part.text) : part.text);
      li.append(name, el('span', 'ctd-search-meta', prettifyId(hit.item.type) + (hit.isAlias ? ` · also “${hit.text}”` : '')));
      if (hit.item.summary) li.append(el('span', 'ctd-search-summary', hit.item.summary));
      list.append(li);
    });
    list.hidden = false;
    this.input!.setAttribute('aria-expanded', 'true');
    this.syncActive();
  }

  private syncActive(): void {
    const items = this.list.querySelectorAll<HTMLElement>('[role="option"]');
    items.forEach((li, i) => li.setAttribute('aria-selected', String(i === this.active)));
    const cur = items[this.active];
    if (cur) {
      this.input!.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    } else this.input!.removeAttribute('aria-activedescendant');
  }

  private onKey(e: KeyboardEvent): void {
    const open = !this.list.hidden && this.hits.length > 0;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!open) {
          void this.update();
          return;
        }
        e.preventDefault();
        const n = this.hits.length;
        this.active = (this.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        this.syncActive();
        break;
      }
      case 'Enter':
        if (open) {
          e.preventDefault();
          this.go(this.active >= 0 ? this.active : 0);
        }
        break;
      case 'Escape':
        if (!this.list.hidden) {
          e.preventDefault();
          this.close();
        } else this.input!.value = '';
        break;
    }
  }

  private go(i: number): void {
    const hit = this.hits[i];
    if (!hit) return;
    this.close();
    // On the explorer and world pages, show the entry in place when the page can (chapters and
    // entries it cannot show still go to their own page).
    if (document.documentElement.dataset.ctdExplorer !== undefined && requestFocus(hit.item.id)) {
      this.input!.value = '';
      this.input!.blur();
      return;
    }
    window.location.assign(hit.item.url);
  }

  private close(): void {
    this.list.hidden = true;
    this.input?.setAttribute('aria-expanded', 'false');
    this.input?.removeAttribute('aria-activedescendant');
    this.active = -1;
  }
}
