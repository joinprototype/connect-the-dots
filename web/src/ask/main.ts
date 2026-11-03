// Ask (/ask/): one box that is the page's heading, and the answer under it (ADR-0028). What a person types
// is painted over the field, the words around a name in grey and each name it finds in ink, with a dot in
// its kind's colour. The page arrives asking a featured pair, its first proof open, the caret waiting at
// the end: the first key starts a new question. Enter makes the page the answer, and its address names
// entries alone, so the words are always rebuilt from the entries and never read from the address.
import './ask.css';
import { findNames, lookupOf, suggest, understand, worthReading, type Found, type Reading, type Row } from '../lib/box';
import { loadSchema } from '../lib/data';
import { formatYearNumber } from '../lib/dates';
import { el } from '../lib/dom';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';
import { addressOf, answer, preview, stateOf, toggleProof, type Answer, type State } from './answers';
import { GREY, loadRecord, loadStories, storiesWith, type Part, type Pick } from './record';
import { phone, Stage } from './stage';

/** A suggestion as it shows under the field, and where it goes: a state of this page, or another page. */
interface Typed {
  label: string;
  sub?: string | null;
  inks: string[];
  to: State | string;
}

const HINT = 'Ask how anything connects';

function start(root: HTMLElement): void {
  const box = root.querySelector<HTMLTextAreaElement>('#ask-box')!;
  const mirror = root.querySelector<HTMLElement>('.ask-mirror')!;
  const form = root.querySelector<HTMLElement>('.ask-form')!;
  const line = root.querySelector<HTMLElement>('#ask-line')!;
  const answerEl = root.querySelector<HTMLElement>('#ask-answer')!;
  const said = root.querySelector<HTMLElement>('#ask-said')!;
  const mini = root.querySelector<HTMLButtonElement>('#ask-mini')!;
  const picks: Pick[] = JSON.parse(root.querySelector('#ask-picks')?.textContent || '[]');
  const wrap = root.querySelector<HTMLElement>('.ask-stage')!;
  const stage = new Stage(wrap, wrap.querySelector('.ask-map')!, wrap.querySelector('.ask-ink')!, wrap.querySelector('.ask-clock')!, (id) =>
    /^Q\d+$/.test(id) ? location.assign(`/a/?q=${id}`) : go({ kind: 'name', id }),
  );

  let pickAt = 0;
  let current: { state: State; parts: Part[] } | null = null;
  /** Each answer and each keystroke takes a number; a late reply to an older one is dropped. */
  let asked = 0;
  let inks: Record<string, string> = {};
  let pins = new Set<string>();

  const pickState = (p: Pick): State => ({ kind: 'pair', a: p.a, b: p.b, way: 0 });
  const pickOf = (s: State) => (s.kind === 'pair' && !s.way ? picks.find((p) => (p.a === s.a && p.b === s.b) || (p.a === s.b && p.b === s.a)) : undefined);
  const arrival = (): State => (picks.length ? pickState(picks[pickAt]) : { kind: 'empty' });
  /** The featured questions after the one shown, to ask next. */
  const nextPicks = (): [string, string][] =>
    picks.length > 1 ? [1, 2].map((k) => picks[(pickAt + k) % picks.length]).filter((p, i, all) => all.indexOf(p) === i).map((p) => [p.text, addressOf(pickState(p))]) : [];

  // ---------------------------------------------------------------- the field

  /** Paints the text again over the field: the words grey, each name inked with its dot. */
  function paint(text: string, names: { at: number; end: number; id: string; ink: string }[]): void {
    line.textContent = text ? 'Ask how anything connects.' : '';
    if (!text) {
      mirror.replaceChildren(el('span', 'ask-hint', HINT));
      return;
    }
    const parts: Node[] = [];
    const now = new Set<string>();
    let at = 0;
    for (const n of names) {
      const b = el('b');
      if (n.id) {
        const key = `${n.at}:${n.id}`;
        now.add(key);
        const pin = el('i', `ask-pin${pins.has(key) ? ' is-old' : ''}`);
        pin.style.setProperty('--c', n.ink);
        b.append(pin);
      }
      b.append(text.slice(n.at, n.end));
      parts.push(document.createTextNode(text.slice(at, n.at)), b);
      at = n.end;
    }
    pins = now;
    // the space at the end keeps a last empty line its height
    mirror.replaceChildren(...parts, text.slice(at), '\u200b');
  }

  /** Puts words in the box, rebuilt from entries. */
  function title(parts: Part[]): void {
    let text = '';
    const names: Parameters<typeof paint>[1] = [];
    for (const [words, id, ink] of parts) {
      if (ink !== undefined) names.push({ at: text.length, end: text.length + words.length, id: id ?? '', ink });
      text += words;
    }
    box.value = text;
    paint(text, names);
    mini.querySelector('.ask-mini-t')!.textContent = text;
    document.title = text ? `${text}: Connect the Dots` : 'Ask: Connect the Dots';
  }

  const inkOf = (e: SearchEntry) => (/^Q\d+$/.test(e.id) ? GREY : (inks[e.type] ?? GREY));
  const found = (f: Found[]) => f.map((x) => ({ at: x.at, end: x.end, id: x.entry.id, ink: inkOf(x.entry) }));

  async function read(text: string): Promise<{ reading: Reading; rows: Row[]; firm: boolean; found: Found[] } | null> {
    const [entries, schema] = await Promise.all([candidates(text, worthReading).catch(() => null), loadSchema().catch(() => null)]);
    if (!entries) return null;
    if (schema) inks = Object.fromEntries(Object.entries(schema.types).map(([k, t]) => [k, t.color]));
    const lookup = lookupOf(entries);
    const reading = understand(text, lookup);
    return { reading, ...suggest(text, lookup, reading), found: findNames(text, lookup) };
  }

  // ---------------------------------------------------------------- answers

  async function show(state: State, push = false): Promise<void> {
    const mine = ++asked;
    leaveTyping();
    shownPreview = '';
    const pick = pickOf(state);
    if (pick) pickAt = picks.indexOf(pick);
    if (push) {
      history.pushState(null, '', addressOf(state));
      scrollTo({ top: 0 });
    }
    answerEl.setAttribute('aria-busy', 'true');
    const a: Answer | null = await answer(state, pick, nextPicks()).catch(() => null);
    if (mine !== asked) return;
    answerEl.removeAttribute('aria-busy');
    if (!a) {
      answerEl.replaceChildren(el('p', 'ask-lead', 'That did not load. Try again.'));
      return;
    }
    current = { state, parts: a.parts };
    root.dataset.v = state.kind;
    // what nothing answers keeps the reader's own words, on their own screen; it has no address
    if (state.kind !== 'none') title(a.parts);
    answerEl.replaceChildren(...a.body);
    said.textContent = state.kind === 'none' || !box.value ? '' : `Answering: ${box.value}`;
    stage.set(a.scene);
    follow(a.steps);
  }

  const go = (state: State) => void show(state, state.kind !== 'empty' && state.kind !== 'none');

  // the stops of a way bring their dots forward as the reader reaches them, once the box has scrolled away
  let steps: IntersectionObserver | null = null;
  function follow(s: Answer['steps']): void {
    steps?.disconnect();
    steps = null;
    if (!s) return;
    const inside = new Set<number>();
    steps = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          const i = s.els.indexOf(e.target as HTMLElement);
          if (e.isIntersecting) inside.add(i);
          else inside.delete(i);
        }
        stage.hi(scrollY > 40 && inside.size ? s.ids[Math.max(...inside)] : null);
      },
      { rootMargin: `0px 0px -${phone() ? 32 : 54}% 0px` },
    );
    s.els.forEach((x) => steps!.observe(x));
  }

  // ---------------------------------------------------------------- typing: the page is the list

  let rows: Typed[] = [];
  let sel = -1;
  /** The reader picked a row with the arrow keys. */
  let chosen = false;
  let firm = false;
  let shownPreview = '';
  let previewAt = 0;
  const list = el('ul', 'ask-list ask-typed');
  list.id = 'ask-typed';
  list.setAttribute('role', 'listbox');
  list.setAttribute('aria-label', 'Suggestions');

  function leaveTyping(): void {
    delete root.dataset.typing;
    rows = [];
    sel = -1;
    box.removeAttribute('aria-activedescendant');
    clearTimeout(previewAt);
  }

  /** Where a suggestion of the box (lib/box.ts) goes on this page. */
  function targetOf(url: string): State | string {
    const u = new URL(url, location.origin);
    const p = u.searchParams;
    if (u.pathname === '/w/' && p.get('t')) return { kind: 'year', year: Number(p.get('t')) };
    if (u.pathname === '/ask/') return stateOf(u.search) ?? url;
    const e =/^\/e\/([^/]+)\/$/.exec(u.pathname);
    if (e) return { kind: 'name', id: decodeURIComponent(e[1]) };
    const q = /^\/q\/([^/]+)\/([^/]+)\/$/.exec(u.pathname);
    if (q) return { kind: 'question', q: q[1], id: decodeURIComponent(q[2]) };
    return url;
  }

  const typedOf = (r: Row): Typed => {
    const to = targetOf(r.url);
    const label = typeof to !== 'string' && to.kind === 'year' ? `What happened in ${formatYearNumber(to.year)}?` : r.label;
    return { label, sub: r.sub, inks: r.ends.map(inkOf), to };
  };

  async function typing(): Promise<void> {
    if (/\n/.test(box.value)) box.value = box.value.replace(/\s*\n\s*/g, ' ');
    const text = box.value;
    const mine = ++asked;
    answerEl.removeAttribute('aria-busy');
    mini.querySelector('.ask-mini-t')!.textContent = text;
    // the text shows at once in grey; its names arrive with the search entries
    paint(text, []);
    if (!text.trim()) {
      leaveTyping();
      const stories = await loadStories().catch(() => null);
      if (mine === asked && stories) void show({ kind: 'empty' });
      return;
    }
    root.dataset.typing = '';
    const r = await read(text);
    if (mine !== asked) return;
    if (!r) {
      list.replaceChildren();
      answerEl.replaceChildren(el('p', 'ask-lead', 'The box cannot reach its list right now.'));
      return;
    }
    paint(text, found(r.found));
    const stories = await loadStories().catch(() => null);
    if (mine !== asked) return;
    // no pair is offered through what is sealed, or about or named after it (ADR-0027)
    const out = stories?.out ?? new Set<string>();
    rows = r.rows.map(typedOf).filter((t) => typeof t.to === 'string' || t.to.kind !== 'pair' || (!out.has(t.to.a) && !out.has(t.to.b)));
    // two names: the stories that hold both come after how they connect
    if (r.reading.kind === 'pair' && rows.length && stories) {
      const { a, b } = r.reading;
      if (!out.has(a.id) && !out.has(b.id)) {
        for (const st of storiesWith(stories, a.id, b.id).slice(0, 4)) rows.push({ label: st.title, sub: st.subtitle, inks: [], to: `/c/${st.id}/` });
      }
    }
    firm = r.firm;
    sel = firm ? 0 : -1;
    chosen = false;
    if (rows.length) {
      list.replaceChildren(
        ...rows.map((t, i) => {
          const li = el('li');
          li.id = `ask-typed-${i}`;
          li.dataset.i = String(i);
          li.setAttribute('role', 'option');
          const div = el('div', 'ask-item');
          if (t.inks.length) {
            const dots = el('span', 'ask-item-dots');
            for (const ink of t.inks) {
              const d = el('i', 'ask-dot');
              d.style.setProperty('--c', ink);
              dots.append(d);
            }
            div.append(dots);
          }
          div.append(el('span', 'ask-item-n', t.label));
          if (t.sub) div.append(el('span', 'ask-item-s', t.sub.length > 130 ? `${t.sub.slice(0, 128).replace(/\s+\S*$/, '')}…` : t.sub));
          li.append(div);
          return li;
        }),
      );
      answerEl.replaceChildren(list);
      mark();
    } else {
      answerEl.replaceChildren(
        el('p', 'ask-lead', 'Press return to ask.'),
        el('p', 'ask-fine', 'No name found yet. The box knows names, two names, a year, and four questions.'),
      );
    }
    // the picture shows the web of the name just typed, or of the first suggestion
    const named = r.found.map((f) => f.entry).filter((e) => !/^Q\d+$/.test(e.id) && e.type !== 'chapter' && e.type !== 'question');
    const top = rows[0]?.to;
    const id = named.at(-1)?.id ?? (typeof top === 'object' && top.kind === 'name' ? top.id : '');
    clearTimeout(previewAt);
    if (id && id !== shownPreview && !phone()) {
      previewAt = window.setTimeout(async () => {
        const build = await preview(id).catch(() => null);
        if (mine !== asked || !build) return;
        shownPreview = id;
        stage.set(build);
      }, 110);
    }
  }

  function mark(): void {
    list.querySelectorAll<HTMLElement>('[role="option"]').forEach((li, i) => li.setAttribute('aria-selected', String(i === sel)));
    const cur = list.querySelector<HTMLElement>(`#ask-typed-${sel}`);
    if (cur) {
      box.setAttribute('aria-activedescendant', cur.id);
      if (chosen) cur.scrollIntoView({ block: 'nearest' });
    } else box.removeAttribute('aria-activedescendant');
  }

  function take(t: Typed): void {
    box.blur();
    if (typeof t.to === 'string') location.assign(t.to);
    else go(t.to);
  }

  /** Enter: the row picked, or the first when the box is sure of it, else what the text asks. */
  async function submit(): Promise<void> {
    const text = box.value;
    const picked = root.dataset.typing !== undefined ? (chosen || firm ? rows[sel] : undefined) : undefined;
    if (picked) return take(picked);
    box.blur();
    if (!text.trim()) return void show({ kind: 'empty' });
    const r = await read(text);
    if (!r) return;
    const reading = r.reading;
    if (reading.kind === 'unknown') return void show({ kind: 'none', found: reading.found });
    if (reading.kind === 'empty') return void show({ kind: 'empty' });
    take({ label: '', inks: [], to: targetOf(reading.url) });
  }

  // ---------------------------------------------------------------- hands

  let fresh = false;
  /** The page arrived asking: the first key replaces the question. */
  let wipe = false;
  const unwait = () => (wipe = false);

  box.addEventListener('focus', () => {
    fresh = true;
    // the record the answers read loads as soon as a person comes to the box
    void loadRecord().catch(() => undefined);
    requestAnimationFrame(() => {
      if (fresh) box.select();
    });
  });
  box.addEventListener('pointerup', () => {
    if (fresh) {
      fresh = false;
      box.select();
    }
  });
  box.addEventListener('blur', () => (fresh = false));
  box.addEventListener('pointerdown', unwait);
  box.addEventListener('beforeinput', () => {
    if (wipe) {
      unwait();
      box.value = '';
    }
  });
  box.addEventListener('input', () => void typing());
  box.addEventListener('keydown', (e) => {
    fresh = false;
    if (e.key === 'Enter') {
      e.preventDefault();
      void submit();
    } else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && root.dataset.typing !== undefined && rows.length) {
      e.preventDefault();
      sel = (sel + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
      chosen = true;
      mark();
    } else if (e.key === 'Escape' && current) {
      box.blur();
      void show(current.state);
    }
  });
  list.addEventListener('pointerdown', (e) => e.preventDefault());
  list.addEventListener('click', (e) => {
    const li = (e.target as Element).closest<HTMLElement>('[data-i]');
    if (li) take(rows[Number(li.dataset.i)]);
  });

  root.querySelector('#ask-another')?.addEventListener('click', () => {
    pickAt = (pickAt + 1) % picks.length;
    unwait();
    go(pickState(picks[pickAt]));
  });

  answerEl.addEventListener('click', (e) => {
    const t = e.target as Element;
    const b = t.closest<HTMLButtonElement>('button');
    if (b?.dataset.proof) {
      void loadRecord().then((rec) => toggleProof(rec.idx, b));
      stage.hi(b.closest<HTMLElement>('[data-o]')?.dataset.o ?? null);
      return;
    }
    if (b?.dataset.open !== undefined && b.previousElementSibling instanceof HTMLElement) {
      b.previousElementSibling.hidden = false;
      b.remove();
    }
  });
  answerEl.addEventListener('mouseover', (e) => {
    const r = (e.target as Element).closest<HTMLElement>('[data-o]');
    if (r) stage.hi(r.dataset.o ?? null);
  });
  // links to another answer stay on this page
  root.addEventListener('click', (e) => {
    const a = (e.target as Element).closest('a');
    if (!a || a.origin !== location.origin || a.pathname !== '/ask/' || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button) return;
    e.preventDefault();
    go(stateOf(a.search) ?? arrival());
  });
  addEventListener('popstate', () => void show(stateOf(location.search) ?? arrival()));

  mini.addEventListener('click', () => {
    scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
    box.focus();
  });
  // the header stays at the top, and the small box and the picture stand under it
  const header = document.querySelector<HTMLElement>('.site-header');
  const head = () => (header && getComputedStyle(header).position === 'sticky' ? header.offsetHeight : 0);
  root.style.setProperty('--ask-head', `${head()}px`);
  if (header) new ResizeObserver(() => root.style.setProperty('--ask-head', `${head()}px`)).observe(header);
  new IntersectionObserver(([e]) => (mini.hidden = e.isIntersecting), { rootMargin: `-${head() + 44}px 0px 0px 0px` }).observe(form);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== box && !e.metaKey && !e.ctrlKey && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
      e.preventDefault();
      scrollTo({ top: 0 });
      box.focus();
      box.select();
    }
  });

  // ---------------------------------------------------------------- arriving
  const asking = stateOf(location.search);
  if (asking) {
    // the heading in the page is the first pick's: this address asks something else, rebuilt from its entries
    box.value = '';
    mirror.replaceChildren('\u200b');
    void show(asking);
    return;
  }
  const first = arrival();
  void show(first);
  if (first.kind === 'pair' && !phone() && innerHeight > 500) {
    // the caret waits at the end of the question: the first key starts a new one
    box.focus({ preventScroll: true });
    fresh = false;
    box.setSelectionRange(box.value.length, box.value.length);
    wipe = true;
  }
}

const root = document.getElementById('ask-root');
if (root) start(root);
