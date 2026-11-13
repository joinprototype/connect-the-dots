// The daily puzzle (/play/): two names a day, and the reader steps from one to the other by links on the
// record, each with its proof. data/play.json holds every day's pair as one way between them by the fewest
// links (site/play.rs); the names and links come from graph-slim.json, and a step's proof from its detail
// file. What a reader did today stays in this browser only.
import { loadDetails, loadGraphIndex, loadJson, type GraphIndex } from '../lib/data';
import { accountOf, fromLine, quotedFirst, sentence, sourceView } from '../lib/claims';
import { puzzleDay } from '../lib/dates';
import { el } from '../lib/dom';
import { walks } from '../lib/paths';
import type { GEdge } from '../lib/types';
import './play.css';

interface PlayFile {
  /** Puzzle 1's date, YYYY-MM-DD. */
  first: string;
  /** Each day's way, from its first name to its last, by the fewest links. */
  days: string[][];
  /** What no step may land on. */
  out: string[];
}

/** What a reader did with one day's puzzle. */
interface Played {
  /** Every stop so far, the first name first. */
  stops: string[];
  /** The link taken to each stop after the first. */
  links: string[];
  /** The way was shown, not found. */
  shown?: boolean;
}

/** Links listed at a stop before "Show all". */
const FIRST = 12;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n: number, one: string, many = `${one}s`) => `${WORDS[n] ?? n} ${n === 1 ? one : many}`;
const GREY = '#8c8c8c';


function dateOf(first: string, day: number): Date {
  const [y, m, d] = first.split('-').map(Number);
  return new Date(y, m - 1, d + day);
}

// ---------------------------------------------------------------- what this browser keeps

const key = (day: number) => `ctd-play-${day}`;
function recall(day: number): Played | null {
  try {
    const v = JSON.parse(localStorage.getItem(key(day)) ?? 'null') as Played | null;
    return v && Array.isArray(v.stops) && Array.isArray(v.links) ? v : null;
  } catch {
    return null;
  }
}
function keep(day: number, p: Played): void {
  try {
    localStorage.setItem(key(day), JSON.stringify(p));
  } catch {
    /* a private window keeps nothing: the puzzle still plays */
  }
}

/** Days in a row, up to today, whose puzzle was solved without being shown the way. */
function run(days: string[][], today: number): number {
  let n = 0;
  for (let d = today; d >= 0; d--) {
    const p = recall(d);
    const end = days[d]?.[days[d].length - 1];
    if (!p || p.shown || p.stops[p.stops.length - 1] !== end) {
      if (d === today) continue;
      break;
    }
    n++;
  }
  return n;
}

// ---------------------------------------------------------------- words

const inkOf = (idx: GraphIndex, id: string) => idx.data.types[idx.nodes.get(id)?.type ?? '']?.color ?? GREY;
const nameOf = (idx: GraphIndex, id: string) => idx.nodes.get(id)?.name ?? id;
const other = (e: GEdge, id: string) => (e.from === id ? e.to : e.from);

/** A name, black, dotted under in its kind's ink, as a story's names are. */
function name(idx: GraphIndex, id: string, href?: string): HTMLElement {
  const b = href ? el('a', 'play-name') : el('b', 'play-name');
  if (href && b instanceof HTMLAnchorElement) b.href = href;
  b.textContent = nameOf(idx, id);
  b.style.setProperty('--c', inkOf(idx, id));
  return b;
}

function dot(idx: GraphIndex, id: string): HTMLElement {
  const i = el('i', 'play-dot');
  i.style.setProperty('--c', inkOf(idx, id));
  i.setAttribute('aria-hidden', 'true');
  return i;
}

/** The link read from `from`, with the far name marked: "headquartered in Cleveland" when the sentence
 *  starts at `from`, and the whole sentence when it does not ("Mary Maxwell Gates, mother of Bill Gates"). */
function linkLine(idx: GraphIndex, e: GEdge, from: string): HTMLElement {
  const s = sentence(idx, e, from);
  const p = el('span', 'play-said');
  const mark = (text: string, id: string) => {
    const b = el('b', 'play-name', text);
    b.style.setProperty('--c', inkOf(idx, id));
    return b;
  };
  const tail = `${s.list ? ':' : ''}`;
  const detail = s.detail ? ` (${s.detail})` : '';
  if (s.subjectId === from) p.append(`${s.phrase}${tail} `, mark(s.object, s.objectId), detail);
  else p.append(mark(s.subject, s.subjectId), `${s.apposition ? ',' : ''} ${s.phrase}${tail} ${s.object}${detail}`);
  return p;
}

/** A link's proof: whose account it is, if one side's, then its first source with its quote. */
async function proofOf(idx: GraphIndex, e: GEdge): Promise<HTMLElement> {
  if (!e.full) await Promise.all([loadDetails(idx, e.from), loadDetails(idx, e.to)]);
  const box = el('div', 'play-proof');
  const account = accountOf(idx, e);
  if (account) box.append(el('p', 'play-note', account));
  const ref = quotedFirst(e.sources)[0];
  if (!ref) {
    box.append(el('p', 'play-note', 'No proof in this copy of the record.'));
    return box;
  }
  if (ref.quote) {
    const q = el('p', 'play-quote');
    q.append(el('mark', '', ref.quote));
    box.append(q);
  }
  const s = sourceView(idx, ref.id, ref.at);
  const line = el('p', 'play-src');
  if (s.url) {
    const a = el('a', '', s.title);
    a.href = s.url;
    a.rel = 'noopener';
    a.target = '_blank';
    line.append(a);
  } else line.append(s.title);
  const rest = fromLine(s);
  line.append(rest ? `, ${rest}.` : '.');
  box.append(line);
  return box;
}

/** The result as a line of dots to share: each stop in its kind's nearest coloured circle. */
const CIRCLES: [string, number, number, number][] = [
  ['🔴', 221, 46, 68], ['🟠', 244, 144, 12], ['🟡', 253, 203, 88], ['🟢', 120, 177, 89],
  ['🔵', 85, 172, 238], ['🟣', 170, 142, 214], ['🟤', 193, 105, 79], ['⚫', 49, 55, 61],
];
function circle(hex: string): string {
  const v = parseInt(hex.replace('#', ''), 16);
  const [r, g, b] = [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  let best = CIRCLES[0];
  let gap = Infinity;
  for (const c of CIRCLES) {
    const d = (c[1] - r) ** 2 + (c[2] - g) ** 2 + (c[3] - b) ** 2;
    if (d < gap) [best, gap] = [c, d];
  }
  return best[0];
}

// ---------------------------------------------------------------- the page

async function main(root: HTMLElement): Promise<void> {
  const [file, idx] = await Promise.all([loadJson<PlayFile>('/data/play.json'), loadGraphIndex()]);
  // a reader whose calendar is still on the day before puzzle 1 gets puzzle 1
  const today = Math.max(0, puzzleDay(file.first));
  const asked = Number(new URLSearchParams(location.search).get('n'));
  // an earlier puzzle by its number, never one still to come
  const day = Number.isInteger(asked) && asked >= 1 && asked - 1 <= today ? asked - 1 : today;
  const way = file.days[day];
  const $ = <T extends HTMLElement>(id: string) => root.querySelector<T>(`#${id}`)!;
  if (!way?.length) {
    $('play-day').textContent = 'Puzzle';
    $('play-title').textContent = 'No puzzle today';
    $('play-line').textContent = 'The next one comes with the next version of the site.';
    return;
  }
  const out = new Set(file.out);
  const [a, b] = [way[0], way[way.length - 1]];
  const fewest = way.length - 1;
  let played: Played = recall(day) ?? { stops: [a], links: [] };
  if (played.stops[0] !== a) played = { stops: [a], links: [] };

  const when = dateOf(file.first, day).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
  $('play-day').textContent = `Puzzle ${day + 1}, ${when}`;
  const title = $('play-title');
  title.replaceChildren('From ', name(idx, a), ' to ', name(idx, b));
  $('play-line').textContent = `Step from one to the other by links on the record, each with its proof. It can be done in ${count(fewest, 'step')}.`;

  const trail = $('play-trail');
  const next = $('play-next');
  const list = $('play-links');
  const find = $<HTMLInputElement>('play-find');
  const done = $('play-done');
  const show = $<HTMLButtonElement>('play-show');
  const back = $<HTMLButtonElement>('play-back');
  const steps = $('play-steps');
  let all = false;

  /** The links a step may take from `at`: one per name, none back to a name already on the way, the end
   *  first if it is one step away, then the best-connected names. */
  const from = (at: string, been: ReadonlySet<string> = new Set()): GEdge[] => {
    const seen = new Set<string>();
    return (idx.incident.get(at) ?? [])
      .filter((e) => walks(e) && !out.has(other(e, at)))
      .sort((x, y) => Number(other(y, at) === b) - Number(other(x, at) === b) || (idx.nodes.get(other(y, at))?.degree ?? 0) - (idx.nodes.get(other(x, at))?.degree ?? 0) || nameOf(idx, other(x, at)).localeCompare(nameOf(idx, other(y, at))))
      .filter((e) => {
        const o = other(e, at);
        if (been.has(o) || seen.has(o)) return false;
        seen.add(o);
        return true;
      });
  };

  /** How many steps each name is from the end, by the same links (worked out once, from the end). */
  const away = new Map<string, number>([[b, 0]]);
  for (let ring = [b]; ring.length; ) {
    const outer: string[] = [];
    for (const id of ring)
      for (const e of idx.incident.get(id) ?? []) {
        const o = other(e, id);
        if (!walks(e) || out.has(o) || away.has(o)) continue;
        away.set(o, away.get(id)! + 1);
        outer.push(o);
      }
    ring = outer;
  }

  function drawTrail(): void {
    const end = played.stops[played.stops.length - 1] === b;
    trail.replaceChildren(
      ...played.stops.map((id, i) => {
        const li = el('li', 'play-stop');
        const head = el('p', 'play-at');
        head.append(dot(idx, id), name(idx, id, end ? `/e/${id}/` : undefined));
        li.append(head);
        const e = i > 0 ? idx.edges.get(played.links[i - 1]) : undefined;
        if (e) {
          const by = el('p', 'play-by');
          const pf = el('button', 'play-pf', 'Proof');
          pf.type = 'button';
          pf.setAttribute('aria-expanded', 'false');
          pf.addEventListener('click', async () => {
            const open = pf.getAttribute('aria-expanded') === 'true';
            pf.setAttribute('aria-expanded', String(!open));
            li.querySelector('.play-proof')?.remove();
            if (!open) by.after(await proofOf(idx, e));
          });
          by.append(linkLine(idx, e, played.stops[i - 1]), ' ', pf);
          li.insertBefore(by, head);
        }
        if (i === played.stops.length - 1 && !end) li.classList.add('is-here');
        return li;
      }),
    );
  }

  function drawNext(): void {
    const at = played.stops[played.stops.length - 1];
    const links = from(at, new Set(played.stops));
    const q = find.value.trim().toLowerCase();
    const shown = q ? links.filter((e) => nameOf(idx, other(e, at)).toLowerCase().includes(q)) : all ? links : links.slice(0, FIRST);
    list.replaceChildren(
      ...shown.map((e) => {
        const li = el('li');
        const go = el('button', 'play-go');
        go.type = 'button';
        go.append(dot(idx, other(e, at)), linkLine(idx, e, at));
        go.addEventListener('click', () => step(e, at));
        li.append(go);
        return li;
      }),
    );
    if (!q && !all && links.length > FIRST) {
      const li = el('li');
      const more = el('button', 'play-more', `Show all ${links.length}`);
      more.type = 'button';
      more.addEventListener('click', () => {
        all = true;
        drawNext();
      });
      li.append(more);
      list.append(li);
    }
    if (q && !shown.length) list.append(el('li', 'play-none', 'No name here has those letters.'));
    find.hidden = links.length <= FIRST;
    const n = played.links.length;
    const so = count(n, 'step');
    // how far the end is now, so each step says whether it went closer
    const left = away.get(at);
    const far = left === undefined ? `${nameOf(idx, b)} cannot be reached from here.` : `${nameOf(idx, b)} is ${count(left, 'step')} away.`;
    steps.textContent = n ? `${so.charAt(0).toUpperCase()}${so.slice(1)} so far. ${far}` : '';
    back.hidden = n === 0 || played.shown === true;
    $('play-where').textContent = links.length ? `Where next from ${nameOf(idx, at)}?` : `${nameOf(idx, at)} has no other links on the way. Go back a step.`;
  }

  function step(e: GEdge, at: string): void {
    played = { ...played, stops: [...played.stops, other(e, at)], links: [...played.links, e.id] };
    keep(day, played);
    find.value = '';
    all = false;
    draw();
    // the new stop and its links come into view
    trail.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function drawDone(): void {
    const n = played.links.length;
    const h = el('h2', 'play-won', played.shown ? `One way, in ${count(n, 'step')}` : `Connected in ${count(n, 'step')}`);
    const line = el('p', 'play-line');
    line.textContent = played.shown ? 'This is a way by the fewest links. Each name above opens its page.' : n === fewest ? 'That is the fewest. Each name above opens its page.' : `The fewest is ${WORDS[fewest] ?? fewest}. Each name above opens its page.`;
    const days = run(file.days, today);
    const streak = day === today && days > 1 ? el('p', 'play-run', `Solved ${count(days, 'day')} running.`) : null;
    const share = el('button', 'play-share', 'Share');
    share.type = 'button';
    const text = [`Connect the Dots, puzzle ${day + 1}`, `${played.stops.map((id) => circle(inkOf(idx, id))).join('–')} ${played.shown ? 'shown the way' : `${n} steps (fewest ${fewest})`}`, `${location.origin}/play/`].join('\n');
    share.addEventListener('click', async () => {
      try {
        if (navigator.share && matchMedia('(pointer: coarse)').matches) await navigator.share({ text });
        else {
          await navigator.clipboard.writeText(text);
          share.textContent = 'Copied';
        }
      } catch {
        /* the reader closed the sheet */
      }
    });
    const after = el('p', 'play-after', day === today ? 'A new puzzle tomorrow.' : '');
    if (day !== today) {
      const a = el('a', '', 'Today’s puzzle');
      a.href = '/play/';
      after.append(a);
    }
    // a reader who knows a source can add what the record is missing
    const help = el('p', 'play-after');
    const missing = el('a', '', 'missing links');
    missing.href = '/missing/';
    help.append('Know a source? Help with the ', missing, '.');
    done.replaceChildren(h, line, ...(streak ? [streak] : []), share, after, help);
  }

  function draw(): void {
    const end = played.stops[played.stops.length - 1] === b;
    drawTrail();
    next.hidden = end;
    show.hidden = end;
    done.hidden = !end;
    if (end) drawDone();
    else drawNext();
  }

  find.addEventListener('input', drawNext);
  back.addEventListener('click', () => {
    if (!played.links.length) return;
    played = { ...played, stops: played.stops.slice(0, -1), links: played.links.slice(0, -1) };
    keep(day, played);
    find.value = '';
    all = false;
    draw();
  });
  show.addEventListener('click', () => {
    const links: string[] = [];
    for (let i = 1; i < way.length; i++) {
      const e = from(way[i - 1]).find((x) => other(x, way[i - 1]) === way[i]);
      if (!e) return;
      links.push(e.id);
    }
    played = { stops: [...way], links, shown: true };
    keep(day, played);
    draw();
  });
  root.classList.add('is-ready');
  draw();
}

const root = document.getElementById('play');
if (root) {
  main(root).catch((err: unknown) => {
    console.error(err);
    const line = root.querySelector('#play-line');
    if (line) line.textContent = 'The puzzle could not load. Try again in a moment.';
  });
}
