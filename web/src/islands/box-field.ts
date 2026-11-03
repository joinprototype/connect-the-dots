// The box once a person has focused it (box.ts loads this then): suggestions as they type, a dot on each name
// they have typed, and what Enter does. Enter or a click goes to a real page, or shows a single name in place
// on the pages that can (the Map, Stories). Arrow keys move, Escape closes.
import { findNames, lookupOf, suggest, understand, worthReading, type Found, type Row } from '../lib/box';
import { loadSchema, prettifyId } from '../lib/data';
import { el } from '../lib/dom';
import { requestFocus } from '../lib/events';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';

/** The box's own words when it cannot help: fixed, so nothing typed ever comes back. */
const NOTHING = 'Nothing here answers that yet.';
const CAN = 'Try a name, two names, a year, or a question: who is behind something, why it happened, who benefited.';
const DOWN = 'The box cannot reach its list right now.';

export class BoxField {
  private mirror = el('div', 'box-mirror');
  private panel = el('div', 'box-panel');
  private reply = el('p', 'box-reply');
  private list = el('ul', 'box-rows');
  private rows: Row[] = [];
  private active = -1;
  /** The person picked a row with the arrow keys. */
  private chosen = false;
  private inks: Record<string, string> = {};

  constructor(
    host: HTMLElement,
    private input: HTMLInputElement,
  ) {
    this.list.id = 'box-rows';
    this.list.setAttribute('role', 'listbox');
    this.reply.setAttribute('role', 'status');
    this.panel.hidden = this.reply.hidden = this.list.hidden = true;
    this.mirror.setAttribute('aria-hidden', 'true');
    this.panel.append(this.reply, this.list);
    input.after(this.mirror);
    (input.closest('form') ?? input).after(this.panel);
    input.setAttribute('role', 'combobox');
    input.setAttribute('aria-autocomplete', 'list');
    input.setAttribute('aria-expanded', 'false');
    input.setAttribute('aria-controls', this.list.id);

    input.addEventListener('input', () => void this.update());
    input.addEventListener('keydown', (e) => this.onKey(e));
    // the field scrolls its text as the caret moves, and the dots go with it
    for (const event of ['keyup', 'pointerup', 'select']) input.addEventListener(event, () => (this.mirror.scrollLeft = input.scrollLeft));
    host.addEventListener('focusout', (e) => {
      if (!host.contains(e.relatedTarget as Node | null)) this.close();
    });
    this.list.addEventListener('pointerdown', (e) => e.preventDefault()); // keep focus in the input
    this.list.addEventListener('click', (e) => {
      const row = this.rows[Number((e.target as Element).closest<HTMLElement>('[data-index]')?.dataset.index)];
      if (row) this.follow(row);
    });
    // the search index and the inks load now: a page nobody types on never fetches them
    void Promise.all([candidates('').catch(() => undefined), loadSchema()])
      .then(([, schema]) => (this.inks = Object.fromEntries(Object.entries(schema.types).map(([id, t]) => [id, t.color]))))
      .catch(() => undefined)
      .then(() => this.update());
  }

  private async read(text: string) {
    const entries = await candidates(text, worthReading).catch(() => null);
    if (!entries) return null;
    const lookup = lookupOf(entries);
    return { lookup, reading: understand(text, lookup) };
  }

  private async update(): Promise<void> {
    const text = this.input.value;
    if (!text.trim()) {
      this.paint([]);
      return this.close();
    }
    const read = await this.read(text);
    if (text !== this.input.value) return; // a newer keystroke won
    if (!read) return this.say(DOWN);
    this.paint(findNames(text, read.lookup));
    const { rows, firm } = suggest(text, read.lookup, read.reading);
    this.reply.hidden = true;
    this.show(rows, firm ? 0 : -1);
  }

  /** Enter: the row picked with the arrows, else what the text asks. */
  async submit(): Promise<void> {
    const text = this.input.value;
    const picked = this.chosen ? this.rows[this.active] : undefined;
    if (picked) return this.follow(picked);
    if (!text.trim()) return window.location.assign('/c/');
    const read = await this.read(text);
    if (!read) return this.say(DOWN);
    const { rows, firm } = suggest(text, read.lookup, read.reading);
    if (firm) return this.follow(rows[0]);
    if (read.reading.kind !== 'unknown') return window.location.assign(read.reading.url);
    this.show(rows, -1);
    this.say(NOTHING, CAN);
  }

  private follow(row: Pick<Row, 'url' | 'focus'>): void {
    this.close();
    // On the Map and Stories, show the entry in place when the page can (stories and
    // entries it cannot show still go to their own page).
    if (row.focus && document.documentElement.dataset.ctdInPlace !== undefined && requestFocus(row.focus)) {
      this.input.value = '';
      this.paint([]);
      this.input.blur();
      return;
    }
    window.location.assign(row.url);
  }

  /** The typed text again, unseen, so that a dot can stand before each name. */
  private paint(found: Found[]): void {
    const text = this.input.value;
    const parts: (string | Node)[] = [];
    let at = 0;
    for (const f of found) {
      const name = el('span', 'box-typed', text.slice(f.at, f.end));
      name.style.setProperty('--c', this.ink(f.entry));
      parts.push(text.slice(at, f.at), name);
      at = f.end;
    }
    this.mirror.replaceChildren(...parts, text.slice(at));
    this.mirror.scrollLeft = this.input.scrollLeft;
  }

  private ink(e: SearchEntry): string {
    return this.inks[e.type] ?? 'var(--muted)';
  }

  private show(rows: Row[], active: number): void {
    this.rows = rows;
    this.active = active;
    this.chosen = false;
    this.list.replaceChildren(
      ...rows.map((row, i) => {
        const li = el('li');
        li.id = `${this.list.id}-${i}`;
        li.dataset.index = String(i);
        li.setAttribute('role', 'option');
        const name = el('span', 'box-name');
        for (const e of row.ends) {
          const dot = el('span', 'box-dot');
          dot.style.setProperty('--c', this.ink(e));
          name.append(dot);
        }
        name.append(row.label);
        const kind = row.focus ? prettifyId(row.ends[0].type) : '';
        li.append(name, el('span', 'box-meta', kind + (row.also ? ` · also “${row.also}”` : '')));
        if (row.sub) li.append(el('span', 'box-sub', row.sub));
        return li;
      }),
    );
    this.list.hidden = !rows.length;
    this.panel.hidden = this.list.hidden && this.reply.hidden;
    this.input.setAttribute('aria-expanded', String(!this.list.hidden));
    this.mark();
  }

  private say(first: string, then = ''): void {
    this.reply.replaceChildren(el('b', '', first), then);
    this.reply.hidden = this.panel.hidden = false;
  }

  private mark(): void {
    const items = this.list.querySelectorAll<HTMLElement>('[role="option"]');
    items.forEach((li, i) => li.setAttribute('aria-selected', String(i === this.active)));
    const cur = items[this.active];
    if (cur) {
      this.input.setAttribute('aria-activedescendant', cur.id);
      cur.scrollIntoView({ block: 'nearest' });
    } else this.input.removeAttribute('aria-activedescendant');
  }

  private onKey(e: KeyboardEvent): void {
    const open = !this.list.hidden && this.rows.length > 0;
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        if (!open) {
          void this.update();
          return;
        }
        e.preventDefault();
        const n = this.rows.length;
        this.active = (this.active + (e.key === 'ArrowDown' ? 1 : -1) + n) % n;
        this.chosen = true;
        this.mark();
        break;
      }
      case 'Escape':
        if (!this.panel.hidden) {
          e.preventDefault();
          this.close();
        } else {
          this.input.value = '';
          this.paint([]);
        }
        break;
    }
  }

  private close(): void {
    this.panel.hidden = this.reply.hidden = this.list.hidden = true;
    this.input.setAttribute('aria-expanded', 'false');
    this.input.removeAttribute('aria-activedescendant');
    this.active = -1;
    this.chosen = false;
  }
}
