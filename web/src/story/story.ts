// <ctd-story>: scroll-driven (and watchable) chapter player. See docs/data-contract.md, "Chapter".
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { sourceView } from '../lib/claims';
import { loadGraphIndex, nameOf, type GraphIndex } from '../lib/data';
import { formatYear } from '../lib/dates';
import { el } from '../lib/dom';
import { emit } from '../lib/events';
import type { Shot } from '../lib/types';
import { explorerHref } from '../explorer/url';
import type { GraphView } from './graph-view';
import type { MapView } from './map-view';
import { Overlay } from './overlay';

gsap.registerPlugin(ScrollTrigger);

type View = 'map' | 'graph';

/** What the reader does that stops Watch: scrolling by wheel, touch or key. */
const USER_EVENTS = ['wheel', 'touchstart', 'touchmove', 'keydown'];
/** Keys that scroll the page. */
const SCROLL_KEYS = ['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', ' ', 'Home', 'End'];
/** How far (CSS px) a finger may wobble in a tap; a touch that moves further is scrolling. */
const TAP_SLOP = 12;
/** The browser's own voice, for Listen (Web Speech API); some browsers have none. */
const speech = 'speechSynthesis' in window && typeof SpeechSynthesisUtterance === 'function' ? window.speechSynthesis : undefined;
/** Where this viewer's Listen choice is remembered. */
const LISTEN_KEY = 'ctd-listen';
/** A breath before each scene's voice (ms), while the stage moves to it. */
const VOICE_DELAY = 400;

/** Where a scene takes over, as a fraction of the screen height. Stacked on small screens: cards are read
 *  below the sticky stage, so the line sits lower. */
function sceneLine(): number {
  return matchMedia('(max-width: 860px)').matches ? 0.8 : 0.65;
}

function remembered(): boolean {
  try {
    return localStorage.getItem(LISTEN_KEY) === '1';
  } catch {
    return false;
  }
}

function remember(on: boolean): void {
  try {
    localStorage.setItem(LISTEN_KEY, on ? '1' : '0');
  } catch {
    /* storage blocked: the choice lasts as long as the page */
  }
}

/** The parts of a scene's card that are not its narration: the date line, "Explore from here" and the source link. */
const NOT_NARRATION = '.step-time, .step-explore, .step-source';

/** What Listen reads for a scene: each paragraph of its card as plain text, without NOT_NARRATION. */
function narration(step: HTMLElement | undefined): string[] {
  const parts = step?.querySelectorAll(`.step-card > :not(${NOT_NARRATION})`) ?? [];
  return [...parts].map((part) => (part.textContent ?? '').replace(/\s+/g, ' ').trim()).filter(Boolean);
}

/** A voice on this device that speaks English, the default first. Online voices (Chrome's "Google …") would
 *  send the narration away; with no local English voice the browser picks one by language. */
function englishVoice(): SpeechSynthesisVoice | undefined {
  const local = speech?.getVoices().filter((v) => v.localService && /^en([-_]|$)/i.test(v.lang)) ?? [];
  return local.find((v) => v.default) ?? local[0];
}

/** A scene's name for its dot: the first sentence of its narration ("The US story."), else its date. */
function sceneTitle(step: HTMLElement | undefined, shot: Shot): string {
  const p = step?.querySelector(`.step-card > p:not(${NOT_NARRATION})`);
  const text = (p?.textContent ?? '').replace(/\s+/g, ' ').trim();
  // Up to the first full stop that ends a sentence (not an initial, as in "John F. Kennedy").
  const first = /^.+?[a-z0-9”")\]][.!?](?=\s+[A-Z“"(]|$)/.exec(text)?.[0] ?? text;
  return (first.length > 80 ? `${first.slice(0, 80).replace(/\s+\S*$/, '')}…` : first) || shot.time_label || '';
}

function viewOf(shot: Shot | undefined, prev: View): View {
  if (!shot) return prev;
  if (shot.view === 'map') return 'map';
  if (shot.view === 'graph' || shot.view === 'timeline') return 'graph';
  if (shot.camera || shot.places?.length || shot.routes?.length) return 'map';
  if (shot.reveal?.length || shot.reveal_claims?.length) return 'graph';
  return prev;
}

export class CtdStory extends HTMLElement {
  private shots: Shot[] = [];
  private steps: HTMLElement[] = [];
  private views: View[] = [];
  private stage!: HTMLElement;
  private layers!: { map: HTMLElement; graph: HTMLElement; overlay: HTMLElement };
  private hud!: { time: HTMLElement; past: HTMLElement; persp: HTMLElement; count: HTMLElement };
  private watchBtn!: HTMLButtonElement;
  private listenBtn?: HTMLButtonElement;
  private dots: HTMLButtonElement[] = [];
  private overlay?: Overlay;
  private idx?: GraphIndex;
  private map?: Promise<MapView>;
  private graph?: Promise<GraphView>;
  private current = -1;
  private view: View | null = null;
  private triggers: ScrollTrigger[] = [];
  private watching = false;
  private timer = 0;
  /** Read each scene aloud while watching (off unless this viewer turned it on). */
  private listening = !!speech && remembered();
  /** The scene's utterances, held so Chrome does not drop them (and their "end") before they are spoken. */
  private utterances: SpeechSynthesisUtterance[] = [];
  /** Counts scene starts and stops: a timer or a voice from an earlier one is stale. */
  private run = 0;
  /** The scene Watch is heading to: only it speaks, not the ones the page scrolls past on the way. */
  private target = 0;
  private started = false;
  private reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  /** Where a touch on the player's own controls began. */
  private touchFrom: { x: number; y: number } | null = null;
  /**
   * Scrolling by wheel, touch or key stops Watch, wherever focus or the finger is. Only a press of the
   * player's own controls is left to their click (stopping first would make Pause play again): a tap,
   * or Space on the focused Pause button or a scene dot. Enter is not a scrolling key.
   */
  private stopOnUser = (e: Event) => {
    // Every event of one touch has the target the touch began on.
    const onControls = !!(e.target as Element | null)?.closest?.('.story-controls');
    const touch = e.type.startsWith('touch') ? (e as TouchEvent).changedTouches[0] : undefined;
    if (e.type === 'touchstart') this.touchFrom = onControls && touch ? { x: touch.clientX, y: touch.clientY } : null;
    if (!this.watching) return;
    if (e.type === 'keydown') {
      const key = (e as KeyboardEvent).key;
      if (!SCROLL_KEYS.includes(key) || (key === ' ' && onControls)) return;
    } else if (onControls && e.type === 'touchstart') {
      return;
    } else if (onControls && e.type === 'touchmove') {
      // A tap wobbles a little; a finger that moves further from the controls is scrolling the page.
      const from = this.touchFrom;
      if (!from || !touch || Math.hypot(touch.clientX - from.x, touch.clientY - from.y) < TAP_SLOP) return;
    }
    this.stopWatch();
  };
  /** Leaving the page (another tab, another page) pauses Watch, which stops the voice. */
  private onLeave = (e: Event) => {
    if (e.type === 'pagehide' || document.visibilityState === 'hidden') this.stopWatch();
  };
  /** The stage is aria-hidden, so nothing in it may take keyboard focus (proof links, map attribution). */
  private unfocusable = new MutationObserver(() => this.blockFocus());

  connectedCallback(): void {
    if (this.started) return;
    this.started = true;
    try {
      this.shots = JSON.parse(this.querySelector('script.ctd-shots')?.textContent || '[]') as Shot[];
    } catch (err) {
      console.warn('ctd-story: invalid shots JSON', err);
      this.shots = [];
    }
    const stepEls = [...this.querySelectorAll<HTMLElement>('.story-steps .step')];
    if (!this.shots.length || !stepEls.length) return;
    // Pair steps with shots by name, falling back to order.
    this.steps = this.shots.map((s, i) => stepEls.find((st) => st.dataset.shot === s.shot) ?? stepEls[i]).filter(Boolean);
    let v: View = 'map';
    this.views = this.shots.map((s, i) => (v = viewOf(s, i === 0 ? (s.reveal_claims || s.reveal ? 'graph' : 'map') : v)));
    this.buildStage();
    this.decorateSteps();
    this.classList.add('is-enhanced');
    this.fitTop();
    window.addEventListener('resize', this.fitTop);
    for (const type of USER_EVENTS) window.addEventListener(type, this.stopOnUser, { passive: true });
    window.addEventListener('pagehide', this.onLeave);
    document.addEventListener('visibilitychange', this.onLeave);

    loadGraphIndex()
      .then((idx) => {
        if (!this.isConnected) return;
        this.idx = idx;
        this.overlay = new Overlay(this.layers.overlay, idx);
        this.decorateExplore(idx);
        this.decorateSources(idx);
        this.setupScroll();
      })
      .catch((err) => console.warn('ctd-story: graph data unavailable', err));
  }

  disconnectedCallback(): void {
    this.unfocusable.disconnect();
    for (const t of this.triggers) t.kill();
    this.triggers = [];
    window.removeEventListener('resize', this.fitTop);
    for (const type of USER_EVENTS) window.removeEventListener(type, this.stopOnUser);
    window.removeEventListener('pagehide', this.onLeave);
    document.removeEventListener('visibilitychange', this.onLeave);
    this.stopWatch();
    void this.map?.then((m) => m.destroy());
    void this.graph?.then((g) => g.destroy());
    this.map = this.graph = undefined;
    this.started = false;
  }

  /** Keep the sticky stage below the sticky site header. */
  private fitTop = () => {
    const header = document.querySelector<HTMLElement>('.site-header');
    const sticky = header && getComputedStyle(header).position === 'sticky';
    this.style.setProperty('--story-top', `${sticky ? header!.offsetHeight : 0}px`);
  };

  private buildStage(): void {
    this.stage = this.querySelector<HTMLElement>('.story-stage') ?? this.insertBefore(el('div'), this.firstChild);
    this.stage.classList.add('story-stage');
    const layer = (cls: string) => this.stage.appendChild(el('div', cls));
    this.layers = {
      map: layer('story-layer story-map'),
      graph: layer('story-layer story-graph'),
      overlay: layer('story-overlay'),
    };
    this.unfocusable.observe(this.stage, { childList: true, subtree: true });
    const hud = layer('story-hud');
    const time = el('span', 'story-hud-time'), past = el('span', 'story-hud-past'), persp = el('span', 'story-hud-persp'), count = el('span', 'story-hud-count');
    past.hidden = true;
    hud.append(time, past, persp, count);
    this.hud = { time, past, persp, count };

    // Controls live outside the aria-hidden stage.
    const controls = el('div', 'story-controls');
    this.watchBtn = el('button', 'story-watch');
    this.watchBtn.type = 'button';
    this.watchBtn.addEventListener('click', () => (this.watching ? this.stopWatch() : this.startWatch()));
    this.setWatchLabel();
    const nav = el('ol', 'story-dots');
    nav.setAttribute('aria-label', 'Scenes');
    this.dots = this.shots.map((s, i) => {
      const li = el('li');
      const b = el('button');
      b.type = 'button';
      const title = sceneTitle(this.steps[i], s);
      b.setAttribute('aria-label', title ? `Scene ${i + 1}: ${title}` : `Scene ${i + 1}`);
      b.addEventListener('click', () => {
        this.stopWatch();
        this.scrollToStep(i);
      });
      li.append(b);
      nav.append(li);
      return b;
    });
    controls.append(this.watchBtn);
    if (speech) {
      const listen = (this.listenBtn = el('button', 'story-listen', 'Listen'));
      listen.type = 'button';
      listen.setAttribute('aria-pressed', String(this.listening));
      listen.addEventListener('click', () => this.setListening(!this.listening));
      controls.append(listen);
    }
    controls.append(nav);
    this.insertBefore(controls, this.stage.nextSibling);
  }

  private decorateSteps(): void {
    this.steps.forEach((step, i) => {
      step.dataset.index = String(i);
      if (!step.id) step.id = `shot-${this.shots[i].shot}`;
      const shot = this.shots[i];
      const card = step.querySelector('.step-card');
      if (card && !card.querySelector('.step-time') && (shot.time_label || shot.t != null)) {
        card.prepend(el('p', 'step-time', shot.time_label ?? formatYear(shot.t!, true)));
      }
    });
  }

  private blockFocus(): void {
    for (const node of this.stage.querySelectorAll<HTMLElement>('a[href], button, summary, input, select, textarea, [tabindex]')) {
      if (node.tabIndex !== -1) node.tabIndex = -1;
    }
  }

  /**
   * A proof card's "Read the source" link sits on the aria-hidden stage, out of reach of the keyboard and
   * screen readers: repeat it in the shot's step card (shown when it has focus).
   */
  private decorateSources(idx: GraphIndex): void {
    this.steps.forEach((step, i) => {
      const o = this.shots[i].overlay;
      const s = o?.kind === 'source' && o.source ? sourceView(idx, o.source) : null;
      const card = step.querySelector('.step-card');
      if (!s?.url || !card || card.querySelector('.step-source')) return;
      const p = el('p', 'step-source');
      const a = p.appendChild(el('a', '', `Read the source: ${s.title}`));
      a.href = s.url;
      a.target = '_blank';
      a.rel = 'external noopener noreferrer';
      card.append(p);
    });
  }

  /** "Explore from here": /x/?focus=&lens=&p=&t= for shots with explore: true. */
  private decorateExplore(idx: GraphIndex): void {
    this.steps.forEach((step, i) => {
      const shot = this.shots[i];
      if (!shot.explore) return;
      const card = step.querySelector('.step-card') ?? step;
      // The shot's own lens, perspective and time; the focus carries forward from earlier shots if unset.
      const focus = shot.focus ?? this.shots.slice(0, i).reverse().find((s) => s.focus)?.focus ?? null;
      const href = explorerHref({ focus, lens: shot.lens, p: shot.perspective, t: shot.t ?? null });
      let a = card.querySelector<HTMLAnchorElement>('.step-explore a, a.story-explore');
      if (!a) {
        const p = el('p', 'step-explore');
        a = p.appendChild(el('a', 'button', 'Explore from here'));
        card.append(p);
      }
      a.href = href;
      a.classList.add('story-explore');
      if (focus) a.title = `Open ${nameOf(idx, focus)} in the explorer`;
    });
  }

  private setupScroll(): void {
    const line = `${sceneLine() * 100}%`;
    this.steps.forEach((step, i) => {
      this.triggers.push(
        ScrollTrigger.create({
          trigger: step,
          start: `top ${line}`,
          end: `bottom ${line}`,
          onToggle: (self) => {
            if (self.isActive) this.activate(i);
          },
        }),
      );
    });
    // Deep link to a shot (#shot-<name>), else start on the first shot so the stage is never empty.
    const target = this.steps.findIndex((st) => location.hash && st.id === decodeURIComponent(location.hash.slice(1)));
    if (target > 0) {
      window.scrollTo({ top: this.stepTop(target), behavior: 'auto' });
      ScrollTrigger.refresh();
      this.activate(target);
    } else if (this.current < 0) this.activate(0);
  }

  private ensureMap(): Promise<MapView> {
    return (this.map ??= import('./map-view').then((m) => m.createMapView(this.layers.map, this.idx!, this.shots)));
  }

  private ensureGraph(): Promise<GraphView> {
    return (this.graph ??= import('./graph-view').then((m) => m.createGraphView(this.layers.graph, this.idx!, this.shots)));
  }

  private activate(i: number): void {
    if (i === this.current || !this.idx) return;
    this.current = i;
    const shot = this.shots[i];
    const view = this.views[i];
    this.steps.forEach((s, j) => s.classList.toggle('is-active', j === i));
    this.dots.forEach((d, j) => {
      d.setAttribute('aria-current', j === i ? 'step' : 'false');
      d.classList.toggle('is-past', j < i);
    });
    this.switchView(view);

    if (view === 'map') {
      void this.ensureMap()
        .then((m) => this.current === i && m.apply(shot, this.reduced))
        .catch((err) => this.fail('map', err));
    }
    // The graph view keeps up with every shot, so cumulative reveals are right when it shows.
    void this.ensureGraph()
      .then((g) => {
        if (this.current !== i) return;
        if (view === 'graph') g.resize();
        const { past } = g.apply(i, this.reduced || view !== 'graph');
        // Graph shots show the world as of the shot: explain the faded part.
        this.hud.past.hidden = !(past && view === 'graph');
        this.hud.past.textContent = past ? `faded: already over by ${shot.time_label ?? formatYear(shot.t!, true)}` : '';
      })
      .catch((err) => this.fail('graph', err));

    this.overlay?.show(shot, this.reduced);
    const timeText = shot.time_label ?? (shot.t != null ? formatYear(shot.t, true) : '');
    this.hud.time.textContent = timeText;
    this.hud.time.hidden = !timeText;
    this.hud.persp.textContent = shot.perspective ? `${nameOf(this.idx, shot.perspective)}'s account` : '';
    this.hud.persp.hidden = !shot.perspective;
    this.hud.count.textContent = `${i + 1} / ${this.shots.length}`;

    if (shot.lens) emit('ctd:lens', { lens: shot.lens });
    if (shot.t != null) emit('ctd:time', { t: shot.t });
    if (shot.focus) emit('ctd:focus', { id: shot.focus });
    if (this.watching) this.scheduleNext();
  }

  private switchView(view: View): void {
    if (view === this.view) return;
    this.view = view;
    // Crossfade with CSS transitions (story.css); reduced motion switches instantly.
    this.stage.dataset.view = view;
    if (view === 'map') void this.map?.then((m) => m.resize());
  }

  private fail(what: string, err: unknown): void {
    console.warn(`ctd-story: ${what} view failed`, err);
    this.stage.dataset[`${what}Failed`] = '';
  }

  // ------------------------------------------------------------------ watch mode

  private setWatchLabel(): void {
    this.watchBtn.textContent = this.watching ? 'Pause' : 'Watch';
    this.watchBtn.setAttribute('aria-pressed', String(this.watching));
    this.watchBtn.classList.toggle('is-playing', this.watching);
  }

  private startWatch(): void {
    this.watching = true;
    this.setWatchLabel();
    if (this.listening) this.unlockVoice();
    const rect = this.getBoundingClientRect();
    // Not inside the story yet (or at its end): start from the first shot.
    if (rect.top > innerHeight * 0.4 || rect.bottom < innerHeight * 0.6 || this.current >= this.shots.length - 1) {
      this.scrollToStep(0);
      if (this.current === 0) this.scheduleNext();
    } else {
      this.target = this.current;
      this.scheduleNext();
    }
  }

  private stopWatch(): void {
    if (!this.watching) return;
    this.watching = false;
    this.run++;
    clearTimeout(this.timer);
    this.hush();
    this.setWatchLabel();
  }

  /** Starts the current scene's clock (and its voice): the next scene comes when both are done. */
  private scheduleNext(): void {
    clearTimeout(this.timer);
    const run = ++this.run;
    this.hush(); // never over itself: whatever the last scene still says stops first
    const i = this.current;
    let waiting = 1;
    const next = () => {
      if (run !== this.run || --waiting > 0) return;
      if (this.current >= this.shots.length - 1) this.stopWatch();
      else this.scrollToStep(this.current + 1);
    };
    if (this.listening && i === this.target) {
      waiting++;
      window.setTimeout(() => {
        if (run === this.run) this.say(narration(this.steps[i]), next);
      }, VOICE_DELAY);
    }
    this.timer = window.setTimeout(next, (this.shots[i]?.duration ?? 6) * 1000);
  }

  /** Reads `parts` aloud, one utterance per paragraph; `done` once, when the last ends or one fails. */
  private say(parts: string[], done: () => void): void {
    if (!speech || !parts.length) return done();
    const voice = englishVoice();
    let guard = 0;
    let said = false;
    const end = () => {
      if (said) return;
      said = true;
      clearTimeout(guard);
      done();
    };
    // A voice that never reports its end (a stuck speech engine) must not stop the story for good.
    guard = window.setTimeout(end, (10 + parts.join(' ').length / 5) * 1000);
    this.utterances = parts.map((text, i) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = voice?.lang ?? 'en-US';
      if (voice) u.voice = voice;
      u.onerror = end;
      if (i === parts.length - 1) u.onend = end;
      speech.speak(u);
      return u;
    });
  }

  /** Stops the voice at once. */
  private hush(): void {
    if (!this.utterances.length) return;
    this.utterances = [];
    speech?.cancel();
  }

  /** iOS lets a page speak only once a voice has started from a tap: a silent one, from the tap on Watch or Listen. */
  private unlockVoice(): void {
    speech?.speak(new SpeechSynthesisUtterance(''));
  }

  private setListening(on: boolean): void {
    this.listening = on;
    remember(on);
    this.listenBtn?.setAttribute('aria-pressed', String(on));
    if (on) this.unlockVoice();
    // While watching, the scene starts over: read aloud, or silent.
    if (this.watching) this.scheduleNext();
  }

  private scrollToStep(i: number): void {
    if (!this.steps[i]) return;
    this.target = i;
    window.scrollTo({ top: this.stepTop(i), behavior: this.reduced ? 'auto' : 'smooth' });
  }

  /** The scroll position that puts a scene's card (centred in its step) with its middle on the scene-change
   *  line, so that scene, not a short neighbour, takes over. A card too tall for that starts where reading
   *  starts (below the stage and its controls on phones), so the eye and the voice begin together. */
  private stepTop(i: number): number {
    const r = this.steps[i].getBoundingClientRect();
    const h = this.steps[i].querySelector<HTMLElement>('.step-card')?.offsetHeight ?? r.height;
    const stacked = matchMedia('(max-width: 860px)').matches;
    const top = stacked ? this.querySelector<HTMLElement>('.story-controls') : this.stage;
    const reading = top ? (parseFloat(getComputedStyle(top).top) || 0) + (stacked ? top.offsetHeight : 0) + 12 : 0;
    const cardTop = Math.max(innerHeight * sceneLine() - h / 2, reading);
    return r.top + scrollY - (cardTop - (r.height - h) / 2);
  }
}
