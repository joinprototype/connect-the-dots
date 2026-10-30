// The Ask form on the home page (theme/templates/home.html). Names in, pages out.
// - A route question turns both names into entry ids and opens the explorer.
// - Any other question looks among the entries that have an answer page: an exact name or alias, or the only
//   one that starts with the text, opens its page; looser matches ask "Which one?".
// - With no page, Ask says why: the entry is not asked about (its type is not among the question's subjects),
//   or it has no sourced answer yet.
// The page embeds the names it needs first (#ask-data); search (lib/search.ts) has the rest, with types and
// question pages (`q`), and an entry's detail file names the pages about it.
import { loadJson, type Details } from '../lib/data';
import { el } from '../lib/dom';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';

interface Named {
  id: string;
  name: string;
  aliases?: string[];
  url?: string;
}

interface AskQuestion {
  id: string;
  ask: string;
  route: boolean;
  subjects: string[];
  url: string;
  /** The answer pages embedded in the page, richest first. */
  names: Named[];
  /** How many more answer pages there are (search finds them through `q`). */
  more: number;
}

interface AskData {
  questions: AskQuestion[];
  /** The best-connected names, for route questions. */
  names: Named[];
  /** `names` is every entry. */
  complete: boolean;
}

/** Case, accents, punctuation and a leading "the" drop out: "the bolsheviks" finds "Bolsheviks". */
function norm(s: string): string {
  return String(s)
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[.'’]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim()
    .replace(/^the /, '');
}

/** 0 exact, 1 starts with the text, 2 every word starts a word of the name, 3 contains it, 4 no match. */
function score(name: string, q: string, words: string[]): number {
  const n = norm(name);
  if (n === q) return 0;
  if (n.startsWith(q)) return 1;
  const parts = n.split(' ');
  if (words.every((w) => parts.some((p) => p.startsWith(w)))) return 2;
  return n.includes(q) ? 3 : 4;
}

/** Matches, best first; within a rank the list keeps its order (best-connected, or richest answer). */
function find<T extends Named>(list: T[], q: string): { e: T; r: number }[] {
  const words = q.split(' ');
  return list
    .map((e) => ({ e, r: Math.min(...[e.name, ...(e.aliases ?? [])].map((n) => score(n, q, words))) }))
    .filter((m) => m.r < 4)
    .sort((a, b) => a.r - b.r);
}

/** The search entries that may match the text, entries only (no stories or question pages). */
async function entriesFor(text: string): Promise<SearchEntry[]> {
  const all = await candidates(text).catch(() => []);
  return all.filter((e) => e.type !== 'chapter' && e.type !== 'question');
}

/**
 * Suggestions under a field. A datalist's list is placed by the browser, which can open it far from the field,
 * even over another window beside this one. So with JavaScript we draw our own; the datalist is the fallback.
 */
function suggest(input: HTMLInputElement, names: Named[], id: string): void {
  input.removeAttribute('list');
  const box = el('span', 'ask-box');
  const list = el('ul', 'ask-suggest');
  list.id = id;
  list.hidden = true;
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Suggestions');
  input.replaceWith(box);
  box.append(input, list);
  input.setAttribute('role', 'combobox');
  input.setAttribute('aria-autocomplete', 'list');
  input.setAttribute('aria-controls', id);
  input.setAttribute('aria-expanded', 'false');
  let active = -1;

  const mark = (i: number) => {
    active = i;
    [...list.children].forEach((row, n) => row.setAttribute('aria-selected', String(n === i)));
    if (i < 0) input.removeAttribute('aria-activedescendant');
    else input.setAttribute('aria-activedescendant', list.children[i].id);
  };
  const close = () => {
    list.hidden = true;
    input.setAttribute('aria-expanded', 'false');
    mark(-1);
  };
  const choose = (name: string) => {
    input.value = name;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    close();
  };
  const open = () => {
    const q = norm(input.value);
    const hits = q ? find(names, q).map((h) => h.e) : names;
    const shown = hits.slice(0, 6).filter((n) => norm(n.name) !== q);
    list.replaceChildren(
      ...shown.map((n, i) => {
        const row = el('li', '', n.name);
        row.id = `${id}-${i}`;
        row.setAttribute('role', 'option');
        // the field keeps focus, so the list is still there for the click
        row.addEventListener('mousedown', (ev) => ev.preventDefault());
        row.addEventListener('click', () => choose(n.name));
        return row;
      }),
    );
    list.hidden = !shown.length;
    input.setAttribute('aria-expanded', String(!list.hidden));
    mark(-1);
  };

  input.addEventListener('focus', open);
  input.addEventListener('input', () => {
    if (document.activeElement === input) open();
  });
  input.addEventListener('blur', close);
  input.addEventListener('keydown', (ev) => {
    const count = list.children.length;
    if (ev.key === 'Escape') close();
    else if (ev.key === 'Enter' && active >= 0) {
      ev.preventDefault();
      choose(list.children[active].textContent ?? '');
    } else if ((ev.key === 'ArrowDown' || ev.key === 'ArrowUp') && count) {
      ev.preventDefault();
      if (list.hidden) open();
      else mark(ev.key === 'ArrowDown' ? (active + 1) % count : (active <= 0 ? count : active) - 1);
    }
  });
}

/** One row of the answer card: a link with a quiet line under it. */
function row(url: string, name: string, meta: string, go = false): HTMLLIElement {
  const li = el('li');
  const a = el('a', go ? 'ask-go' : '');
  a.href = url;
  a.append(el('span', 'ask-choice-name', name));
  if (meta) a.append(el('span', 'ask-choice-meta', meta));
  li.append(a);
  return li;
}

/** The answer card goes under the form that asked. */
function show(form: HTMLFormElement, title: string, rows: HTMLLIElement[]): void {
  const card = el('div', 'ask-answer');
  const list = el('ul', 'ask-choices');
  card.append(el('p', 'ask-answer-h', title));
  list.append(...rows);
  card.append(list);
  form.parentElement?.querySelector('.ask-result')?.replaceChildren(card);
  card.scrollIntoView({ block: 'nearest' });
}

export function startAsk(): void {
  const dataEl = document.getElementById('ask-data');
  const section = document.querySelector<HTMLElement>('.ask');
  if (!dataEl || !section) return;
  const data = JSON.parse(dataEl.textContent || '{}') as AskData;
  // type id: [label, plural]
  const types = JSON.parse(document.getElementById('ask-types')?.textContent || '{}') as Record<string, [string, string]>;
  const questions = new Map(data.questions.map((q) => [q.id, q]));
  const field = (form: HTMLFormElement, name: string) => form.elements.namedItem(name) as HTMLInputElement;

  async function entryId(input: HTMLInputElement): Promise<string | null> {
    const q = norm(input.value);
    if (!q) return null;
    const hit = find(data.names, q)[0];
    if (data.complete || (hit && hit.r === 0)) return hit?.e.id ?? null;
    // an exact name further down the full index beats a partial match among the embedded names
    const more = find(await entriesFor(input.value), q)[0];
    return more && (!hit || more.r < hit.r) ? more.e.id : (hit?.e.id ?? null);
  }

  async function route(form: HTMLFormElement): Promise<void> {
    const from = await entryId(field(form, 'from'));
    const to = await entryId(field(form, 'to'));
    const miss = !from ? field(form, 'from') : !to ? field(form, 'to') : null;
    if (miss) {
      miss.setCustomValidity('No entry by that name yet. Pick one from the list.');
      miss.reportValidity();
      return;
    }
    location.href = `/x/?from=${encodeURIComponent(from!)}&to=${encodeURIComponent(to!)}`;
  }

  async function ask(form: HTMLFormElement, q: AskQuestion): Promise<void> {
    const text = field(form, 'x').value;
    const t = norm(text);
    if (!t) return;
    const found = await entriesFor(text);
    let pages = q.names;
    if (q.more) {
      // answers past the embedded ones, through the search entries' `q`
      const have = new Set(pages.map((n) => n.id));
      pages = pages.concat(
        found.filter((e) => (e.q ?? []).includes(q.id) && !have.has(e.id)).map((e) => ({ id: e.id, name: e.name, aliases: e.aliases, url: `${q.url}${e.id}/` })),
      );
    }
    const hits = find(pages, t);
    if (hits.length && hits[0].r <= 1 && (hits.length === 1 || hits[1].r > hits[0].r)) {
      location.href = hits[0].e.url!;
      return;
    }
    const known = new Map(found.map((e) => [e.id, e]));
    if (hits.length) {
      show(
        form,
        hits.length === 1 ? 'Did you mean?' : 'Which one?',
        hits.slice(0, 5).map((h) => {
          const k = known.get(h.e.id);
          return row(h.e.url!, h.e.name, [k && types[k.type]?.[0], k?.when || k?.summary].filter(Boolean).join(' · '));
        }),
      );
      return;
    }
    // no page: say why, about the entry the text names (the best-connected one when several match)
    const m = find<Named & Partial<SearchEntry>>([...data.names, ...found], t).filter((h) => h.r <= 2)[0];
    const e = m && (known.get(m.e.id) ?? m.e);
    if (!e) {
      show(form, 'No sourced answer yet.', [row(q.url, 'See every sourced answer ›', q.ask.replace('{x}', '…'), true)]);
      return;
    }
    const asked = !e.type || q.subjects.includes(e.type);
    const rows = [row(`/e/${e.id}/`, `Open ${e.name}: every link ›`, '', true)];
    // the other questions with a page about it, from its detail file
    const details = e.q?.length ? await loadJson<Details>(`/data/e/${encodeURIComponent(e.id)}.json`).catch(() => null) : null;
    for (const page of details?.asked ?? []) if (page.q !== q.id) rows.push(row(page.url, `${page.title} ›`, page.counts, true));
    // routes are asked about everything: "How are Bill Gates and … connected?"
    for (const o of data.questions.filter((x) => x.route)) {
      rows.push(row(`/x/?from=${encodeURIComponent(e.id)}`, `${o.ask.replace('{a}', e.name).replace('{b}', '…')} ›`, '', true));
    }
    show(form, asked ? 'No sourced answer yet.' : `Not asked about ${e.type && types[e.type] ? types[e.type][1] : 'these'}.`, rows);
  }

  // the name typed for one question stays when another is picked
  let typed = '';
  const picks = [...document.querySelectorAll<HTMLInputElement>('.ask-pick input')];
  const pick = (r: HTMLInputElement) => {
    const f = document.getElementById(`ask-panel-${r.value}`)?.querySelector('input');
    if (f && !f.value) f.value = typed;
  };
  section.addEventListener('input', (ev) => {
    const target = ev.target as HTMLInputElement;
    if (target.type === 'radio') return;
    typed = target.value;
    target.setCustomValidity('');
    // a new name: the last answer card no longer applies
    target.form?.parentElement?.querySelector('.ask-result')?.replaceChildren();
  });
  for (const r of picks) {
    r.addEventListener('change', () => {
      pick(r);
      try {
        history.replaceState(null, '', r === picks[0] ? location.pathname : `?q=${encodeURIComponent(r.value)}`);
      } catch {
        /* history blocked: the choice still shows */
      }
    });
  }
  // /?q=<question>&x=<name> opens the form on that question with the name filled in
  const params = new URLSearchParams(location.search);
  const preset = picks.find((r) => r.value === params.get('q'));
  typed = params.get('x') || '';
  if (preset) preset.checked = true;
  const start = picks.find((r) => r.checked);
  if (start && typed) pick(start);

  for (const form of document.querySelectorAll<HTMLFormElement>('.ask-form')) {
    const q = questions.get(form.dataset.q ?? '');
    if (!q) continue;
    for (const input of form.querySelectorAll('input')) suggest(input, q.route ? data.names : q.names, `ask-suggest-${q.id}-${input.name}`);
    // the search index (and while there is one, the search file) loads early
    form.addEventListener('focusin', () => void candidates('').catch(() => undefined), { once: true });
    form.addEventListener('submit', (ev) => {
      ev.preventDefault();
      void (q.route ? route(form) : ask(form, q));
    });
  }
}
