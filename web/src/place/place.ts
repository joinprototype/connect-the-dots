// The Stories page (theme/templates/chapters.html) as one surface, after the One Place prototype: every written
// story an island, every entry a dot, one canvas and one camera. Far out, the islands are named; zoom into one
// and its dots are named; click a dot and the camera glides to it, its words and links beside it; tap a line
// for its proof; from a dot, find the way to another. Every move is one straight eased move, and at rest
// nothing runs. The address is the stop (#/e/<id>, #/i/<story>, #/l/<link>/<from>, #/w/<a>/<b>/<step>), so
// Back walks back. The words lie on the surface beside what they speak of, and travel and scale with it.
// The list under the surface is its alternative for screen readers, so the canvas is aria-hidden.
import { sentence } from '../lib/claims';
import { loadDetails, loadWaysIndex } from '../lib/data';
import { el } from '../lib/dom';
import { fuzzySearch } from '../lib/fuzzy';
import { findPaths } from '../lib/paths';
import { candidates } from '../lib/search';
import type { SearchEntry } from '../lib/types';
import { around, clamp, ease, fit, moveTime, smooth, straight, type Cam, type Rect } from './camera';
import { across, dotNear, K0, loadWorld, planNames, type World } from './model';
import { Painter, type Box, type Look, type Scene } from './paint';
import { entryHref, entryWords, fillEntry, isleWords, lineHref, lineWords, stepWords, wayHref, wayWords } from './words';

const REDUCE = matchMedia('(prefers-reduced-motion: reduce)');
/** The words' column on a wide screen, as place.css sets it. */
const COLUMN = 400;
/** A phone holds the map by its height and pans across it; its words lie under the picture. */
const PHONE = 760;
/** How long words take to fade when the camera leaves them, in milliseconds. */
const FADE = 260;

/** Words pinned to the surface: where their top left lies on the map, and the nearness they read at. */
interface Block {
  el: HTMLElement;
  ax: number;
  ay: number;
  k: number;
  /** Where they were pinned on the screen. */
  sy: number;
  dying: number;
}

interface Flight {
  at: (t: number) => Cam;
  t0: number;
  ms: number;
  dim: [number, number];
  done?: () => void;
}

interface Way {
  nodes: number[] | null;
  steps: number[];
}

const part = (s: string): string => {
  try {
    return decodeURIComponent(s);
  } catch {
    return '';
  }
};

class CtdPlace extends HTMLElement {
  private w!: World;
  private painter!: Painter;
  private canvas = el('canvas', 'place-canvas');
  private layer = el('div', 'place-layer');
  private out = el('button', 'place-out', '−');
  private hello!: HTMLElement;
  private cam: Cam = { x: 0, y: 0, k: K0 };
  private far: Cam = { x: 0, y: 0, k: K0 };
  private kMin = K0 / 2;
  private look: Look = { scene: null, dim: 0, hover: -1, hot: -1, isle: -1, drawn: 1, moving: false, avoid: null };
  private flight: Flight | null = null;
  private blocks: Block[] = [];
  private W = 0;
  private H = 0;
  private phone = false;
  private raf = 0;
  private visible = true;
  /** When a hand last moved the camera. */
  private hand = 0;
  /** When the way began to draw itself. */
  private drawFrom = 0;
  private uid = 0;
  /** Bumped by each new stop, so that a late file fills only its own words. */
  private turn = 0;
  private ways = new Map<string, Way>();
  private glass = '';
  /** Where the first words lie over the picture. */
  private card: Box = [0, 0, 0, 0];
  /** The page's one left edge, where the first words' text starts. */
  private left = 16;

  connectedCallback(): void {
    this.hello = this.querySelector<HTMLElement>('.place-hello')!;
    this.canvas.setAttribute('aria-hidden', 'true');
    this.out.type = 'button';
    this.out.setAttribute('aria-label', 'Zoom out');
    this.out.hidden = true;
    this.prepend(this.canvas, this.layer);
    this.append(this.out);
    void this.start();
  }

  private async start(): Promise<void> {
    const fonts = Promise.all(['600 12px "Bricolage Grotesque"', '700 14px "Bricolage Grotesque"', 'italic 500 16px Literata'].map((f) => document.fonts.load(f)));
    let w: World;
    try {
      [w] = await Promise.all([loadWorld(), Promise.race([fonts, new Promise((done) => setTimeout(done, 900))])]);
    } catch {
      return; // the list below stands alone
    }
    this.w = w;
    this.painter = new Painter(this.canvas, w);
    this.painter.theme(this);
    this.size();
    this.listen();
    this.setAttribute('tabindex', '0');
    this.setAttribute('role', 'region');
    this.setAttribute('aria-label', 'The stories as islands. Arrow keys move, plus and minus zoom.');
    this.classList.add('place-on');
    // the header's box shows a single name here instead of leaving the page (docs/data-contract.md, ctd-box)
    document.documentElement.dataset.ctdInPlace = '';
    document.addEventListener('ctd:focus', (e) => {
      const i = this.w.byId.get((e as CustomEvent<{ id: string | null }>).detail?.id ?? '');
      if (i === undefined) return;
      e.preventDefault();
      if (this.getBoundingClientRect().top < -8) window.scrollTo(0, 0);
      location.hash = entryHref(this.w, i);
    });
    addEventListener('hashchange', () => this.apply(false));
    this.apply(true);
    let resized = 0;
    new ResizeObserver(() => {
      clearTimeout(resized);
      resized = window.setTimeout(() => {
        if (this.clientWidth === this.W && this.clientHeight === this.H) return;
        this.size();
        this.apply(true);
      }, 100);
    }).observe(this);
    new IntersectionObserver((seen) => {
      this.visible = seen.some((s) => s.isIntersecting);
      if (this.visible) this.kick();
    }).observe(this);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
      this.painter.theme(this);
      this.kick();
    });
    // what only a zoom or a move needs, made when the page has a moment: every dot's name planned for every
    // nearness, and the picture a move far out draws
    const later = 'requestIdleCallback' in window ? (run: () => void) => requestIdleCallback(run, { timeout: 2000 }) : (run: () => void) => setTimeout(run, 300);
    later(() => {
      const measure = document.createElement('canvas').getContext('2d')!;
      measure.font = '600 12px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
      planNames(w, (i) => measure.measureText(w.names[i].length > 30 ? w.names[i].slice(0, 29) + '…' : w.names[i]).width);
      this.kick();
      later(() => this.painter.prepare());
    });
  }

  private size(): void {
    [this.W, this.H] = [this.clientWidth, this.clientHeight];
    this.phone = this.W < PHONE;
    this.far = this.worldCam();
    this.kMin = this.far.k * 0.6;
    const h = this.hello;
    this.card = [h.offsetLeft, h.offsetTop, h.offsetLeft + h.offsetWidth, h.offsetTop + h.offsetHeight];
    this.left = h.offsetLeft + parseFloat(getComputedStyle(h).paddingLeft);
    this.glass = '';
    this.painter.size(this.W, this.H, Math.min(devicePixelRatio || 1, 2), this.far.k);
  }

  /** The whole map: a window holds it whole, beside the words at the bottom left; a phone by its height. */
  private worldCam(): Cam {
    const { w, W, H } = this;
    if (this.phone) return { x: w.w / 2, y: w.h / 2, k: (H - 40) / w.h };
    const k = Math.min((W - 40) / w.w, (H - 40) / w.h);
    const spare = Math.max(0, (W - 24 - w.w * k) / 2);
    return { x: w.w / 2 - spare / k, y: w.h / 2, k };
  }

  // ---- the frame ------------------------------------------------------------------------------------------

  private kick(): void {
    if (!this.raf && this.visible && this.painter) this.raf = requestAnimationFrame((now) => this.tick(now));
  }

  private tick(now: number): void {
    this.raf = 0;
    let more = false;
    const f = this.flight;
    if (f) {
      const t = clamp((now - f.t0) / f.ms, 0, 1);
      const e = ease(t);
      Object.assign(this.cam, f.at(e));
      this.look.dim = f.dim[0] + (f.dim[1] - f.dim[0]) * e;
      if (t >= 1) {
        this.flight = null;
        f.done?.();
      }
      more = true;
    }
    if (this.look.drawn < 1 && this.drawFrom) {
      this.look.drawn = clamp((now - this.drawFrom) / 700, 0, 1);
      more = true;
    }
    const moving = !!this.flight || now - this.hand < 130;
    this.look.moving = moving;
    // zoomed out by hand far enough, what was open closes: its words shrink back into their dot
    const scene = this.look.scene;
    if (!this.flight && scene && this.cam.k < scene.cam.k * 0.5) {
      this.look.scene = null;
      this.look.dim = 0;
      this.retire();
      if (location.hash.startsWith('#/') && location.hash !== '#/') history.pushState(null, '', '#/');
    }
    this.syncGlass();
    this.painter.frame(this.cam, this.look);
    if (this.place(now)) more = true;
    if (more) this.kick();
    else if (moving) setTimeout(() => this.kick(), 140); // once more at rest, with the names' halos
  }

  private syncGlass(): void {
    const atRest = !this.look.scene && this.cam.k <= this.far.k * 1.35;
    const zoomed = !!this.look.scene || this.cam.k > this.far.k * 1.1;
    const now = `${atRest}|${zoomed}`;
    if (now === this.glass) return;
    this.glass = now;
    this.hello.classList.toggle('off', !atRest);
    this.look.avoid = atRest ? this.card : null;
    this.out.hidden = !zoomed;
  }

  private fly(to: Cam, dim: number, cut: boolean, done?: () => void): void {
    if (cut || REDUCE.matches) {
      Object.assign(this.cam, to);
      this.look.dim = dim;
      this.flight = null;
      done?.();
    } else {
      const from = { ...this.cam };
      this.flight = { at: straight(from, to), t0: performance.now(), ms: moveTime(from, to, Math.hypot(this.W, this.H)), dim: [this.look.dim, dim], done };
    }
    this.kick();
  }

  // ---- words on the surface -------------------------------------------------------------------------------

  private addBlock(html: string, kind: string): Block {
    const node = el('section', `place-words ${kind}`);
    node.innerHTML = html;
    this.layer.append(node);
    const b = { el: node, ax: 0, ay: 0, k: 1, sy: 0, dying: 0 };
    this.blocks.push(b);
    return b;
  }

  private pin(b: Block, sx: number, sy: number, c: Cam): void {
    [b.ax, b.ay, b.k, b.sy] = [c.x + (sx - this.W / 2) / c.k, c.y + (sy - this.H / 2) / c.k, c.k, sy];
  }

  /** The words now showing fade, and every file still on its way is for them alone. */
  private retire(): void {
    this.turn++;
    const now = performance.now();
    for (const b of this.blocks) if (!b.dying) b.dying = REDUCE.matches ? now - FADE : now;
  }

  /** Moves every block of words with the camera; true while one is still fading. */
  private place(now: number): boolean {
    let fading = false;
    for (let j = this.blocks.length - 1; j >= 0; j--) {
      const b = this.blocks[j];
      const fade = b.dying ? 1 - (now - b.dying) / FADE : 1;
      if (fade <= 0) {
        b.el.remove();
        this.blocks.splice(j, 1);
        continue;
      }
      if (b.dying) fading = true;
      const s = this.cam.k / b.k;
      const o = fade * smooth(0.52, 0.86, s) * (1 - smooth(1.7, 2.8, s));
      const st = b.el.style;
      if (o < 0.01) {
        st.visibility = 'hidden';
        continue;
      }
      const [x, y] = [this.W / 2 + (b.ax - this.cam.x) * this.cam.k, this.H / 2 + (b.ay - this.cam.y) * this.cam.k];
      st.visibility = 'visible';
      st.opacity = o.toFixed(3);
      st.pointerEvents = o > 0.6 && !b.dying ? 'auto' : 'none';
      st.transform = Math.abs(s - 1) < 0.004 ? `translate3d(${Math.round(x)}px,${Math.round(y)}px,0)` : `translate3d(${x.toFixed(1)}px,${y.toFixed(1)}px,0) scale(${s.toFixed(4)})`;
    }
    return fading;
  }

  /** The page's one left edge, where the words hang. */
  private edge(): number {
    return this.phone ? 16 : this.left;
  }

  /** Where words `h` tall lie: in the column on a wide screen, under the picture on a phone. */
  private wordsAt(h: number): { x: number; y: number } {
    const H = this.H;
    if (!this.phone) return { x: this.edge(), y: 24 };
    return { x: 16, y: clamp(H - h - 18, H - Math.max(H * 0.42, Math.min(h + 18, H * 0.58)), H - 150) };
  }

  /** Where the picture lies beside words whose top is at `top`. */
  private freeBeside(top: number): Rect {
    if (this.phone) return { x: 10, y: 60, w: this.W - 20, h: Math.max(120, top - 68) };
    const x = this.edge() + COLUMN + 44;
    // under the one control at the top right
    return { x, y: 64, w: Math.max(200, this.W - x - 24), h: this.H - 88 };
  }

  private spot(i: number): [number, number] {
    return [this.w.x[i], this.w.y[i]];
  }

  // ---- stops --------------------------------------------------------------------------------------------

  /** Reads the address and goes there. A first look, and a reader who asked for less motion, get a cut. */
  private apply(first: boolean): void {
    const hash = location.hash;
    const cut = first || REDUCE.matches;
    // "#all" and the like are the list's own anchors: the surface stays as it is
    if (hash && !hash.startsWith('#/')) {
      if (first) this.openWorld(true);
      return;
    }
    const [kind, a = '', b = '', c = ''] = hash.slice(2).split('/').map(part);
    const { w } = this;
    const [i, j] = [w.byId.get(a), w.byId.get(b)];
    if (kind === 'e' && i !== undefined) return this.openEntry(i, cut);
    if (kind === 'i' && w.isleById.has(a)) return this.openIsle(w.isleById.get(a)!, cut);
    if (kind === 'l' && w.linkById.has(a)) return void this.openLine(w.linkById.get(a)!, j ?? -1, cut);
    if (kind === 'w' && i !== undefined && j !== undefined && i !== j) return void this.openWay(i, j, Number(c) || 0, cut);
    this.openWorld(first);
  }

  private show(scene: Scene, cut: boolean, done?: () => void): void {
    this.look.scene = scene;
    this.look.hot = -1;
    this.fly(scene.cam, scene.dim, cut, done);
  }

  private openWorld(cut: boolean): void {
    this.retire();
    this.look.scene = null;
    this.look.drawn = 1;
    this.fly(this.far, 0, cut);
  }

  private openIsle(s: number, cut: boolean): void {
    const { w } = this;
    const isle = w.isles[s];
    this.retire();
    const b = this.addBlock(isleWords(w, s), 'place-isle');
    const pos = this.wordsAt(b.el.offsetHeight);
    const free = this.freeBeside(pos.y);
    const r = isle.r * 1.3;
    const cam = fit([[isle.x - r, isle.y - r], [isle.x + r, isle.y + r]], free, this.W, this.H, this.kMin, K0 * 12, 8);
    this.pin(b, pos.x, pos.y, cam);
    const focus = new Map<number, number>(isle.named.map((i) => [i, w.degree[i]]));
    this.look.drawn = 1;
    this.show({ kind: 'island', isle: s, cam, free, dot: -1, focus, lines: [], hot: -1, word: '', path: null, trail: isle.road, pins: false, dim: 0.35, parent: '#/' }, cut);
  }

  private openEntry(i: number, cut: boolean): void {
    const { w } = this;
    this.retire();
    const uid = ++this.uid;
    const b = this.addBlock(entryWords(w, i, uid), 'place-entry');
    if (w.sealed[i]) b.el.querySelector('.place-way')?.remove(); // a sealed entry is never one end of a way
    const pos = this.wordsAt(Math.min(b.el.offsetHeight, this.phone ? this.H * 0.44 : Infinity));
    const free = this.freeBeside(pos.y);
    // the entry in the middle of the picture, near enough that its nearest neighbours are in it too; the
    // others are named where their line leaves it
    const ends = [...new Set(w.adj[i].map((l) => across(w, l, i)))];
    const dist = ends.map((o) => Math.hypot(w.x[o] - w.x[i], w.y[o] - w.y[i])).sort((p, q) => p - q);
    const cam = around(w.x[i], w.y[i], dist[Math.min(dist.length, 10) - 1] ?? 0, free, this.W, this.H, K0 * 4, K0 * 22, 40);
    this.pin(b, pos.x, pos.y, cam);
    // a sealed neighbour is named last, if there is room: its tie is in the words, with its caveat
    const focus = new Map<number, number>(ends.map((o) => [o, w.sealed[o] ? -1 : w.degree[o]]));
    focus.set(i, Infinity);
    const parent = w.home[i] >= 0 ? `#/i/${encodeURIComponent(w.isles[w.home[i]].id)}` : '#/';
    this.look.drawn = 1;
    this.show({ kind: 'entry', cam, free, dot: i, focus, lines: w.adj[i], hot: -1, word: '', path: null, trail: null, pins: true, dim: 1, parent }, cut);
    const turn = this.turn;
    void loadDetails(w.idx, w.ids[i]).then((d) => turn === this.turn && fillEntry(b.el, d));
    this.wayField(b.el, i);
  }

  /** A link and its proof: the two ends in the picture, the sentence and its sources beside them. As a step
   *  of a way, the way stays drawn under it. */
  private async openLine(l: number, from: number, cut: boolean, step?: { a: number; b: number; way: Way; j: number }): Promise<void> {
    const { w } = this;
    const e = w.links[l];
    const [a, b] = [w.la[l], w.lb[l]];
    const side = from === a || from === b ? from : a;
    this.retire();
    const block = this.addBlock('<p class="place-say">&nbsp;</p>', 'place-line');
    const pos = this.wordsAt(this.phone ? this.H * 0.55 : 0);
    const free = this.freeBeside(pos.y);
    const cam = fit([this.spot(a), this.spot(b)], free, this.W, this.H, K0 * 3, K0 * 40, this.phone ? 44 : 96);
    this.pin(block, pos.x, pos.y, cam);
    const parent = step ? wayHref(w, step.a, step.b) : entryHref(w, side);
    this.look.drawn = 1;
    const word = sentence(w.idx, e, w.ids[side]).phrase;
    const focus = new Map<number, number>([[a, Infinity], [b, Infinity]]);
    this.show({ kind: 'line', cam, free, dot: -1, focus, lines: [l], hot: l, word, path: step?.way.nodes ?? null, trail: null, pins: false, dim: 1, parent }, cut);
    const turn = this.turn;
    await loadDetails(w.idx, e.from);
    if (!e.full) await loadDetails(w.idx, e.to);
    if (turn !== this.turn) return;
    block.el.innerHTML = step ? stepWords(w, step.a, step.b, step.way.steps, step.j, side) : lineWords(w, l, side);
  }

  /** The way between two entries, found as Ask finds it (ways.json), drawn as one line once the camera rests. */
  private async openWay(a: number, b: number, step: number, cut: boolean): Promise<void> {
    const { w } = this;
    const key = `${a}>${b}`;
    let way = this.ways.get(key);
    if (!way) {
      const turn = ++this.turn;
      const found = findPaths(await loadWaysIndex(), w.ids[a], w.ids[b])[0];
      if (turn !== this.turn) return;
      const steps = found?.hops.map((h) => w.linkById.get(h.edge.id)) ?? [];
      way = found && steps.every((s) => s !== undefined) ? { nodes: found.nodes.map((id) => w.byId.get(id)!), steps: steps as number[] } : { nodes: null, steps: [] };
      this.ways.set(key, way);
    }
    if (way.nodes && step >= 1 && step <= way.steps.length) return this.openLine(way.steps[step - 1], way.nodes[step - 1], cut, { a, b, way, j: step });
    this.retire();
    const ties = w.adj[a].filter((l) => across(w, l, a) === b);
    const block = this.addBlock(wayWords(w, a, b, way.nodes, way.steps, ties), 'place-way-words');
    const pos = this.wordsAt(block.el.offsetHeight);
    const free = this.freeBeside(pos.y);
    const ends = way.nodes ?? [a, b];
    const cam = fit(ends.map((i) => this.spot(i)), free, this.W, this.H, this.kMin, K0 * 9, 50);
    this.pin(block, pos.x, pos.y, cam);
    const focus = new Map<number, number>(ends.map((i) => [i, w.degree[i] + 1e5]));
    for (const i of [a, b]) focus.set(i, Infinity);
    this.look.drawn = way.nodes && !cut ? 0 : 1;
    this.drawFrom = 0;
    const scene: Scene = { kind: 'way', cam, free, dot: -1, focus, lines: ties, hot: -1, word: '', path: way.nodes, trail: null, pins: false, dim: 1, parent: entryHref(w, a) };
    this.show(scene, cut, () => {
      this.drawFrom = performance.now();
      this.kick();
    });
  }

  /** Back towards the map: a stop goes to what holds it, a hand-made zoom to the whole map. */
  private zoomOut(): void {
    const scene = this.look.scene;
    if (scene) {
      location.hash = scene.parent;
      return;
    }
    if (this.cam.k < this.far.k * 1.6) {
      if (location.hash.length > 2) location.hash = '#/';
      else this.fly(this.far, 0, false);
      return;
    }
    this.fly({ ...this.cam, k: Math.max(this.far.k, this.cam.k / 3) }, this.look.dim, false);
  }

  // ---- the way field ------------------------------------------------------------------------------------

  /** From an entry, another name: suggestions as one types, and Enter draws the way. A sealed entry is never
   *  suggested as the other end (ADR-0027). */
  private wayField(root: HTMLElement, from: number): void {
    const form = root.querySelector<HTMLFormElement>('.place-way');
    const input = form?.querySelector('input');
    const list = form?.querySelector('ul');
    if (!form || !input || !list) return;
    let hits: SearchEntry[] = [];
    let at = -1;
    const mark = (): void => {
      list.querySelectorAll('[role=option]').forEach((o, j) => o.setAttribute('aria-selected', String(j === at)));
      const cur = list.querySelector(`[data-at="${at}"]`);
      if (cur) input.setAttribute('aria-activedescendant', cur.id);
      else input.removeAttribute('aria-activedescendant');
    };
    const close = (): void => {
      list.hidden = true;
      input.setAttribute('aria-expanded', 'false');
    };
    const go = (hit: SearchEntry | undefined): void => {
      const to = hit && this.w.byId.get(hit.id);
      if (to === undefined) return;
      close();
      input.blur();
      location.hash = to === from ? entryHref(this.w, to) : wayHref(this.w, from, to);
    };
    input.addEventListener('input', async () => {
      const text = input.value;
      const found = text.trim() ? await candidates(text).catch(() => []) : [];
      if (text !== input.value) return; // a newer keystroke won
      const entries = found.filter((x) => !x.sealed && x.id !== this.w.ids[from] && this.w.byId.has(x.id));
      hits = fuzzySearch(entries, text, 6).map((h) => h.item);
      at = hits.length ? 0 : -1;
      list.replaceChildren(
        ...hits.map((hit, j) => {
          const li = el('li', 'place-hit');
          li.id = `${list.id}-${j}`;
          li.dataset.at = String(j);
          li.setAttribute('role', 'option');
          const i = this.w.byId.get(hit.id)!;
          const dot = el('span', 'place-pip');
          dot.style.setProperty('--c', this.w.kinds[this.w.kind[i]].ink);
          li.append(dot, el('span', 'place-name', hit.name), el('small', '', this.w.kinds[this.w.kind[i]].label));
          return li;
        }),
      );
      list.hidden = !hits.length;
      input.setAttribute('aria-expanded', String(!list.hidden));
      mark();
    });
    input.addEventListener('keydown', (e) => {
      if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && hits.length) {
        e.preventDefault();
        at = (at + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length;
        mark();
      } else if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    });
    input.addEventListener('blur', () => setTimeout(close, 150));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      go(hits[at]);
    });
    list.addEventListener('pointerdown', (e) => e.preventDefault()); // keep focus in the field
    list.addEventListener('click', (e) => go(hits[Number((e.target as Element).closest<HTMLElement>('[data-at]')?.dataset.at)]));
  }

  // ---- hands --------------------------------------------------------------------------------------------

  private toMap(x: number, y: number): { x: number; y: number } {
    return { x: this.cam.x + (x - this.W / 2) / this.cam.k, y: this.cam.y + (y - this.H / 2) / this.cam.k };
  }

  private zoomAt(x: number, y: number, f: number): void {
    this.hand = performance.now();
    this.flight = null;
    const a = this.toMap(x, y);
    this.cam.k = clamp(this.cam.k * f, this.kMin, K0 * 2 ** 7);
    const b = this.toMap(x, y);
    this.cam.x += a.x - b.x;
    this.cam.y += a.y - b.y;
    this.kick();
  }

  private panBy(dx: number, dy: number): void {
    this.hand = performance.now();
    this.cam.x -= dx / this.cam.k;
    this.cam.y -= dy / this.cam.k;
    this.kick();
  }

  /** Words read like a page: a finger on them moves the surface up and down, only as far as they run. */
  private wordsLimit(dy: number): number {
    const b = this.blocks.find((x) => !x.dying);
    if (!b) return dy;
    const y = this.H / 2 + (b.ay - this.cam.y) * this.cam.k;
    const bottom = Math.min(b.sy, this.H - b.el.offsetHeight - 24);
    return clamp(dy, bottom - y, b.sy + 40 - y);
  }

  /** A dot a hand may open: any but a sealed one, unless it is in what is open. */
  private dotAt(x: number, y: number, reach: number): number {
    const m = this.toMap(x, y);
    const i = dotNear(this.w, m.x, m.y, reach / this.cam.k);
    return i >= 0 && (!this.w.sealed[i] || this.look.scene?.focus.has(i)) ? i : -1;
  }

  private isleAt(x: number, y: number): number {
    const m = this.toMap(x, y);
    return this.w.isles.findIndex((s) => Math.hypot(s.x - m.x, s.y - m.y) < s.r);
  }

  private tap(x: number, y: number, mouse: boolean, twice: boolean): void {
    const { w, painter } = this;
    const scene = this.look.scene;
    const title = painter.titleAt(x, y);
    if (title >= 0) return void (location.hash = `#/i/${encodeURIComponent(w.isles[title].id)}`);
    const pin = painter.pinAt(x, y);
    if (pin >= 0) return void (location.hash = entryHref(w, pin));
    const dot = this.dotAt(x, y, mouse ? 13 : 22);
    if (dot >= 0) return void (location.hash = entryHref(w, dot));
    const line = scene ? painter.lineAt(scene.lines, x, y) : -1;
    if (line >= 0) return void (location.hash = lineHref(w, line, scene!.dot >= 0 ? scene!.dot : w.la[line]));
    if (twice) {
      const m = this.toMap(x, y);
      const k = clamp(this.cam.k * 2, this.kMin, K0 * 2 ** 7);
      return this.fly({ x: m.x + (this.W / 2 - x) / k, y: m.y + (this.H / 2 - y) / k, k }, this.look.dim, false);
    }
    if (scene) return void (location.hash = scene.parent);
    // far out, a tap on an island goes to it
    const isle = Math.log2(this.cam.k / K0) < 1.5 ? this.isleAt(x, y) : -1;
    if (isle >= 0) location.hash = `#/i/${encodeURIComponent(w.isles[isle].id)}`;
  }

  private hoverAt(x: number, y: number, target: EventTarget | null): void {
    const { painter } = this;
    let [dot, hot, isle, pointer] = [-1, -1, -1, false];
    const onWords = (target as Element | null)?.closest?.('.place-words');
    if (onWords) {
      const row = (target as Element).closest<HTMLElement>('[data-line]');
      if (row) hot = Number(row.dataset.line);
    } else {
      isle = painter.titleAt(x, y);
      if (isle >= 0) pointer = true;
      else if (painter.pinAt(x, y) >= 0) pointer = true;
      else {
        dot = this.dotAt(x, y, 13);
        const scene = this.look.scene;
        if (dot >= 0 || (scene && painter.lineAt(scene.lines, x, y) >= 0)) pointer = true;
        else if (!scene && Math.log2(this.cam.k / K0) < 1.5) {
          isle = this.isleAt(x, y);
          pointer = isle >= 0;
        }
      }
    }
    this.classList.toggle('place-can', pointer);
    if (dot === this.look.hover && hot === this.look.hot && isle === this.look.isle) return;
    [this.look.hover, this.look.hot, this.look.isle] = [dot, hot, isle];
    this.kick();
  }

  private listen(): void {
    const ptrs = new Map<number, { x: number; y: number }>();
    let drag: { x: number; y: number; x0: number; y0: number; moved: boolean; words: boolean; pinch: { d: number; cx: number; cy: number } | null } | null = null;
    let box = this.getBoundingClientRect();
    let lastTap = 0;
    let swallow = false;
    // fields, buttons and the first words' link are themselves, not the surface
    const control = (t: EventTarget | null): boolean => !!(t as Element | null)?.closest?.('input, button, .place-hits, .place-hello a');
    const local = (e: { clientX: number; clientY: number }): [number, number] => [e.clientX - box.left, e.clientY - box.top];

    this.addEventListener('pointerdown', (e) => {
      if (control(e.target) || e.button > 0) return;
      box = this.getBoundingClientRect();
      const words = !!(e.target as Element).closest('.place-words');
      if (words && e.pointerType === 'mouse') return; // a mouse on words selects them, as words
      const [x, y] = local(e);
      ptrs.set(e.pointerId, { x, y });
      if (!words) {
        try {
          this.setPointerCapture(e.pointerId);
        } catch {
          /* a pointer made up by a test */
        }
      }
      this.flight = null;
      drag = { x, y, x0: x, y0: y, moved: false, words, pinch: null };
      if (ptrs.size === 2) {
        const [a, b] = [...ptrs.values()];
        drag.pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), cx: (a.x + b.x) / 2, cy: (a.y + b.y) / 2 };
        drag.moved = true;
      }
    });
    this.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) {
        if (e.pointerType === 'mouse' && !e.buttons) {
          box = this.getBoundingClientRect();
          this.hoverAt(...local(e), e.target);
        }
        return;
      }
      const [x, y] = local(e);
      ptrs.set(e.pointerId, { x, y });
      if (!drag) return;
      if (ptrs.size === 2 && drag.pinch) {
        const [a, b] = [...ptrs.values()];
        const [d, cx, cy] = [Math.hypot(a.x - b.x, a.y - b.y), (a.x + b.x) / 2, (a.y + b.y) / 2];
        this.zoomAt(cx, cy, d / drag.pinch.d);
        this.panBy(cx - drag.pinch.cx, cy - drag.pinch.cy);
        drag.pinch = { d, cx, cy };
        return;
      }
      if (!drag.moved && Math.hypot(x - drag.x0, y - drag.y0) < 7) return;
      drag.moved = true;
      this.classList.add('place-grab');
      const [dx, dy] = [x - drag.x, y - drag.y];
      [drag.x, drag.y] = [x, y];
      if (drag.words) this.panBy(0, this.wordsLimit(dy));
      else this.panBy(dx, dy);
    });
    const end = (e: PointerEvent): void => {
      if (!ptrs.delete(e.pointerId)) return;
      this.classList.remove('place-grab');
      if (!drag) return;
      if (ptrs.size) {
        drag.pinch = null;
        return;
      }
      const d = drag;
      drag = null;
      if (d.moved) {
        swallow = true;
        setTimeout(() => (swallow = false), 60);
        this.kick();
      } else if (!d.words && e.type === 'pointerup') {
        const now = performance.now();
        this.tap(d.x0, d.y0, e.pointerType === 'mouse', now - lastTap < 280);
        lastTap = now;
      }
    };
    this.addEventListener('pointerup', end);
    this.addEventListener('pointercancel', end);
    this.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse' && !ptrs.size) this.hoverAt(-1e4, -1e4, null);
    });
    // a drag that ends on a link is not a click on it
    this.addEventListener('click', (e) => swallow && (e.preventDefault(), e.stopPropagation()), true);
    // a pinch (or Ctrl and the wheel) zooms and a sideways swipe pans; an ordinary wheel scrolls the
    // page past the picture, so that nobody is caught in it on the way to the list below
    this.addEventListener(
      'wheel',
      (e) => {
        if ((e.target as Element).closest?.('.place-hits')) return;
        box = this.getBoundingClientRect();
        const [x, y] = local(e);
        const step = e.deltaMode === 1 ? 18 : 1;
        const [dx, dy] = [e.deltaX * step, e.deltaY * step];
        if (e.ctrlKey) {
          e.preventDefault();
          return this.zoomAt(x, y, Math.exp(-dy * 0.011));
        }
        if ((e.target as Element).closest?.('.place-words')) {
          e.preventDefault();
          return this.panBy(0, this.wordsLimit(-dy));
        }
        if (Math.abs(dx) > Math.abs(dy)) {
          e.preventDefault();
          this.panBy(-dx, 0);
        }
      },
      { passive: false },
    );
    this.addEventListener('keydown', (e) => {
      if (control(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      const keys: Record<string, () => void> = {
        Escape: () => this.zoomOut(),
        '-': () => this.zoomOut(),
        '+': () => this.fly({ ...this.cam, k: Math.min(this.cam.k * 2, K0 * 2 ** 7) }, this.look.dim, false),
        '=': () => this.fly({ ...this.cam, k: Math.min(this.cam.k * 2, K0 * 2 ** 7) }, this.look.dim, false),
        ArrowLeft: () => this.panBy(90, 0),
        ArrowRight: () => this.panBy(-90, 0),
        ArrowUp: () => this.panBy(0, 90),
        ArrowDown: () => this.panBy(0, -90),
      };
      const act = keys[e.key];
      if (!act) return;
      e.preventDefault();
      act();
    });
    this.out.addEventListener('click', () => this.zoomOut());
  }
}

customElements.define('ctd-place', CtdPlace);
