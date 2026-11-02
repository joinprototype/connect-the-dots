// The Explore picture: an entry as a dot with its neighbours around it, each named at rest.
//
// Plain elements, drawn once for each stop. A move is one transform and two opacities that the compositor
// runs by itself, so no script runs during a move and nothing at all at rest. Where a dot sits is settled
// before anything draws, and no dot moves against another: the camera moves, and the two stops fade.
//
// Every stop uses the same fixed slots around its entry, and the set of slots is symmetrical through the
// middle, so whatever slot B has around A, the opposite slot is free for A around B: going from A to B
// leaves A exactly where it was, and Back retraces the same line. An entry takes the slot nearest the way
// its neighbour lies on the Map, so things that sit together on the Map stay together here, and the same
// entry looks the same each time. Only the strongest neighbours get a slot: the rest are in the list.
import { tokenString } from '../lib/color';
import type { GraphIndex } from '../lib/data';
import { el } from '../lib/dom';
import { bestVis, isFaint, META_ID, META_LABEL, passiveModel, type PassiveModel, type Vis } from '../lib/filters';
import { hash01 } from '../lib/hash';
import { measureText } from '../lib/labels';
import type { PathResult } from '../lib/paths';
import type { GEdge, GNode } from '../lib/types';

/** One straight eased move: a curve with no overshoot, and one length for every distance. */
const GLIDE_MS = 450;
const EASE = 'cubic-bezier(0.3, 0, 0.2, 1)';
/** The stop being left has gone by the time the next has begun to show, so names never cross. */
const LEAVE_MS = 200;
const ARRIVE_MS = 260;

/** Below this width names go over or under their dots, and the slots form two columns. */
const WIDE = 560;
const FOCUS_R = 11;
const LABEL_PX = 13.5;
const PHONE_LABEL_PX = 12.5;
const SVG = 'http://www.w3.org/2000/svg';

type Side = 'start' | 'end' | 'above' | 'below';

interface Slot {
  x: number;
  y: number;
  angle: number;
  side: Side;
  /** Room for its name, in px. */
  width: number;
}

interface Dot extends Omit<Slot, 'angle'> {
  id: string;
  name: string;
  r: number;
  layer: string | null;
  dim: boolean;
  focus: boolean;
  /** The link whose proof is open ends here. */
  on: boolean;
}

interface Line {
  id: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** The entry at the far end. */
  to: string;
  faint: boolean;
  dim: boolean;
  on: boolean;
}

interface Stop {
  focus: string | null;
  dots: Dot[];
  lines: Line[];
  /** Neighbours left to the list. */
  left: number;
}

/** A neighbour of the entry, with every link between the two. */
interface Near {
  id: string;
  name: string;
  layer: string | null;
  links: GEdge[];
  best: GEdge;
  vis: Vis;
}

/** The old entry keeps its place around the new one. */
interface Anchor {
  id: string;
  slot: number;
}

export interface WalkView {
  /** The entry in the middle, or null. */
  focus: string | null;
  /** The link whose proof is open, or null. */
  link: string | null;
  path: PathResult | null;
  vis: (e: GEdge) => Vis;
  /** Shares held for clients drawn as one dot. */
  grouped: boolean;
  /** Names to start from, with no entry in the middle. */
  start: GNode[];
}

export interface WalkEvents {
  onEntry: (id: string) => void;
  onLink: (id: string) => void;
  onGroup: () => void;
  /** The pointer rests on a dot: its words are worth having ready. */
  onNear: (id: string) => void;
}

/** A name in at most `lines` lines of `width` px, ending at a word wherever it can. */
function fit(name: string, width: number, px: number, family: string, lines = 2): string[] {
  const wide = (s: string) => measureText(s, px, family, 500);
  if (wide(name) <= width) return [name];
  let rest = name.split(' ');
  const out: string[] = [];
  while (rest.length && out.length < lines) {
    let n = 1;
    while (n < rest.length && wide(rest.slice(0, n + 1).join(' ')) <= width) n++;
    out.push(rest.slice(0, n).join(' '));
    rest = rest.slice(n);
  }
  const clip = (s: string) => {
    while (s.length > 1 && wide(`${s}…`) > width) s = s.slice(0, -1);
    return `${s.trimEnd()}…`;
  };
  const last = out.length - 1;
  if (rest.length) {
    const words = out[last].split(' ');
    while (words.length > 1 && wide(`${words.join(' ')}…`) > width) words.pop();
    out[last] = clip(words.join(' ').replace(/[,:;]$/, ''));
  }
  return out.map((line) => (wide(line) > width ? clip(line) : line));
}

/** The fixed slots for a view this size: an ellipse with names outside it, or on a phone two columns. */
function slotsFor(w: number, h: number): Slot[] {
  const half: Omit<Slot, 'angle'>[] = [];
  if (w >= WIDE) {
    const room = Math.max(130, Math.min(230, Math.round(w * 0.26)));
    const rx = Math.round(w / 2 - room - 20);
    const ry = Math.round(h / 2 - 30);
    const rows = Math.max(4, Math.min(16, Math.floor((2 * ry) / 40)));
    for (let i = 0; i < rows; i++) {
      const y = Math.round(-ry + ((i + 0.5) * 2 * ry) / rows);
      const x = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2));
      half.push({ x, y, side: 'start', width: Math.min(260, Math.round(w / 2 - x - 26)) });
    }
  } else {
    // two columns; the top and bottom pairs lean in, so the lines to them pass clear of the names beside
    const room = h - 92;
    const rows = Math.max(3, Math.min(7, 1 + Math.floor(room / 46)));
    const col = Math.round(w / 3);
    for (let i = 0; i < rows / 2; i++) {
      const y = Math.round((i * room) / (rows - 1) - room / 2);
      const x = i ? col : Math.round(w / 4);
      const width = i ? col - 6 : Math.round(w / 2) - 10;
      half.push({ x, y, side: 'above', width });
      if (y) half.push({ x: -x, y, side: 'above', width });
    }
  }
  const across: Record<Side, Side> = { start: 'end', end: 'start', above: 'below', below: 'above' };
  const every = [...half, ...half.map((s) => ({ ...s, x: -s.x, y: -s.y, side: across[s.side] }))];
  return every.map((s) => ({ ...s, angle: Math.atan2(s.y, s.x) }));
}

/** How far apart two angles are, in radians. */
const turn = (a: number, b: number) => {
  const d = Math.abs(a - b) % (2 * Math.PI);
  return d > Math.PI ? 2 * Math.PI - d : d;
};

function line(cls: string, l: Line): SVGLineElement {
  const e = document.createElementNS(SVG, 'line');
  e.setAttribute('class', cls);
  for (const k of ['x1', 'y1', 'x2', 'y2'] as const) e.setAttribute(k, String(l[k]));
  return e;
}

export class Walk {
  private readonly pm: PassiveModel;
  private readonly family: string;
  private readonly maxDegree: number;
  private readonly world = el('div', 'ctdx-world');
  private readonly reduced = matchMedia('(prefers-reduced-motion: reduce)');
  private readonly ro: ResizeObserver;
  private w = 0;
  private h = 0;
  private slots: Slot[] = [];
  private view: WalkView | null = null;
  private subject: string | null = null;
  private anchor: Anchor | null = null;
  private stop: Stop | null = null;
  /** The drawn stop, the stops on their way out, and what joins the two during a move. */
  private box: HTMLElement | null = null;
  private leaving: HTMLElement[] = [];
  private spine: HTMLElement | null = null;
  private running: Animation[] = [];
  /** Where the camera looks, in the world's px. */
  private cx = 0;
  private cy = 0;

  constructor(
    private readonly stage: HTMLElement,
    /** A line under the picture, for what a stop leaves out and what its dashes mean. */
    private readonly note: HTMLElement,
    private readonly idx: GraphIndex,
    /** Where each entry sits on the Map (data/spots.json). */
    private readonly spots: Map<string, [number, number]>,
    private readonly on: WalkEvents,
  ) {
    this.pm = passiveModel(idx);
    this.family = tokenString('--font-ui', 'system-ui, sans-serif', stage);
    this.maxDegree = idx.data.nodes.reduce((most, n) => Math.max(most, n.degree), 1);
    stage.append(this.world);
    stage.addEventListener('click', this.onClick);
    stage.addEventListener('pointerover', this.onOver);
    this.ro = new ResizeObserver(() => this.measure());
    this.ro.observe(stage);
    this.measure();
  }

  destroy(): void {
    this.ro.disconnect();
    this.stage.removeEventListener('click', this.onClick);
    this.stage.removeEventListener('pointerover', this.onOver);
    this.stage.replaceChildren();
  }

  /** Show this view: a new subject is a move, the same one is drawn again where it stands. */
  show(view: WalkView): void {
    this.view = view;
    const subject = view.path ? view.path.nodes.join(' ') : (view.focus ?? '');
    const moved = subject !== this.subject;
    this.subject = subject;
    if (!this.w) return;
    if (moved) this.anchor = null;
    if (moved && !this.reduced.matches && this.go(view)) return;
    this.land();
    this.draw(this.build(view));
  }

  // ------------------------------------------------------------------ pointer

  private onClick = (ev: MouseEvent): void => {
    if (ev.metaKey || ev.ctrlKey || ev.shiftKey || ev.altKey) return; // a new tab: the dots are links
    const target = ev.target as Element;
    const dot = target.closest<HTMLElement>('[data-walk]');
    if (dot) {
      ev.preventDefault();
      const id = dot.dataset.walk!;
      if (id === META_ID) this.on.onGroup();
      else if (id !== this.stop?.focus) this.on.onEntry(id);
      return;
    }
    const link = target.closest('[data-link]')?.getAttribute('data-link');
    if (link) this.on.onLink(link);
  };

  private onOver = (ev: PointerEvent): void => {
    const id = (ev.target as Element).closest<HTMLElement>('[data-walk]')?.dataset.walk;
    if (id && id !== META_ID) this.on.onNear(id);
  };

  // ------------------------------------------------------------------ layout

  private measure(): void {
    const { offsetWidth: w, offsetHeight: h } = this.stage;
    if (!w || !h || (w === this.w && h === this.h)) return;
    this.w = w;
    this.h = h;
    this.stage.classList.toggle('is-narrow', w < WIDE);
    this.slots = slotsFor(this.w, this.h);
    if (!this.view) return;
    this.anchor = null;
    this.land();
    this.draw(this.build(this.view));
  }

  private angle(a: string, b: string): number {
    const [ax, ay] = this.spots.get(a)!;
    const [bx, by] = this.spots.get(b)!;
    const [dx, dy] = [bx - ax, by - ay];
    return dx || dy ? Math.atan2(dy, dx) : hash01(a < b ? a + b : b + a) * 2 * Math.PI - Math.PI;
  }

  /** The entry's neighbours, strongest first. */
  private near(focus: string, v: WalkView): Near[] {
    const { idx, pm } = this;
    const by = new Map<string, GEdge[]>();
    const group: GEdge[] = [];
    for (const e of idx.incident.get(focus) ?? []) {
      const other = e.from === focus ? e.to : e.from;
      if (other === focus || v.vis(e) === 'hide') continue;
      if (v.grouped && e.passive && pm.absorbed.has(other)) group.push(e);
      else by.set(other, [...(by.get(other) ?? []), e]);
    }
    const evidence = idx.data.methodology.evidence;
    const strength = (e: GEdge) => (e.status === 'deprecated' ? 0 : ((e.tier && evidence[e.tier]) || 0.1) * (isFaint(e) ? 0.5 : 1) * (e.passive ? 0.3 : 1));
    const entry = (id: string, name: string, layer: string | null, links: GEdge[]): Near => ({
      id,
      name,
      layer,
      links,
      best: links.reduce((a, b) => (strength(b) > strength(a) ? b : a)),
      vis: bestVis(links.map(v.vis)),
    });
    const list = [...by].map(([id, links]) => {
      const n = idx.nodes.get(id)!;
      return entry(id, n.name, idx.data.types[n.type]?.layer ?? null, links);
    });
    list.sort(
      (a, b) =>
        strength(b.best) - strength(a.best) ||
        b.links.length - a.links.length ||
        (idx.nodes.get(b.id)?.degree ?? 0) - (idx.nodes.get(a.id)?.degree ?? 0) ||
        (a.id < b.id ? -1 : 1),
    );
    if (group.length) list.push(entry(META_ID, `${META_LABEL} (${group.length})`, null, group));
    return list;
  }

  private radius(id: string): number {
    const degree = this.idx.nodes.get(id)?.degree ?? 1;
    return Math.round((4.5 + 4 * Math.sqrt(degree / this.maxDegree)) * 2) / 2;
  }

  private build(v: WalkView): Stop {
    if (v.path) return this.chain(v.path, v);
    if (v.focus) return this.ring(v.focus, v);
    return this.opening(v);
  }

  /** An entry and its strongest neighbours, each in the free slot nearest the way it lies on the Map. */
  private ring(focus: string, v: WalkView): Stop {
    const { slots, anchor } = this;
    const near = this.near(focus, v);
    const proof = v.link ? this.idx.edges.get(v.link) : undefined;
    const must = new Set([anchor?.id, proof && (proof.from === focus ? proof.to : proof.from)]);
    const chosen = [...near.filter((n) => must.has(n.id)), ...near.filter((n) => !must.has(n.id))].slice(0, slots.length);
    const free = new Set(slots.keys());
    const at = new Map<Near, number>();
    const fixed = anchor && chosen.find((n) => n.id === anchor.id);
    if (fixed) {
      at.set(fixed, anchor.slot);
      free.delete(anchor.slot);
    }
    for (const n of chosen) {
      if (at.has(n)) continue;
      const angle = this.angle(focus, n.id);
      let best = -1;
      for (const i of free) if (best < 0 || turn(slots[i].angle, angle) < turn(slots[best].angle, angle)) best = i;
      at.set(n, best);
      free.delete(best);
    }
    const node = this.idx.nodes.get(focus)!;
    const dots: Dot[] = [
      {
        id: focus,
        name: node.name,
        x: 0,
        y: 0,
        r: FOCUS_R,
        side: 'below',
        width: this.w >= WIDE ? 190 : Math.round(this.w / 3),
        layer: this.idx.data.types[node.type]?.layer ?? null,
        dim: false,
        focus: true,
        on: false,
      },
    ];
    const lines: Line[] = [];
    for (const n of chosen) {
      const s = slots[at.get(n)!];
      const on = !!proof && n.links.some((e) => e.id === proof.id);
      const dim = n.vis === 'dim' || n.vis === 'past';
      dots.push({ ...s, id: n.id, name: n.name, r: n.id === META_ID ? 6 : this.radius(n.id), layer: n.layer, dim, focus: false, on });
      lines.push({ id: on ? v.link! : n.best.id, x1: 0, y1: 0, x2: s.x, y2: s.y, to: n.id, faint: isFaint(n.best), dim, on });
    }
    return { focus, dots, lines, left: near.length - chosen.length };
  }

  /** A route: its stops in a straight line down the picture, each named. */
  private chain(path: PathResult, v: WalkView): Stop {
    const n = path.nodes.length;
    const step = Math.min(96, Math.round((this.h - 60) / Math.max(1, n - 1)));
    const x = -Math.round(this.w / (this.w >= WIDE ? 6 : 3.4));
    const width = Math.min(300, Math.round(this.w / 2 - x - 30));
    const y = (i: number) => Math.round((i - (n - 1) / 2) * step);
    const dots = path.nodes.map((id, i): Dot => {
      const node = this.idx.nodes.get(id);
      const end = i === 0 || i === n - 1;
      return { id, name: node?.name ?? id, x, y: y(i), r: end ? FOCUS_R : this.radius(id), side: 'start', width, layer: node ? (this.idx.data.types[node.type]?.layer ?? null) : null, dim: false, focus: false, on: end };
    });
    const lines = path.hops.map((h, i): Line => ({ id: h.edge.id, x1: x, y1: y(i), x2: x, y2: y(i + 1), to: path.nodes[i + 1], faint: isFaint(h.edge), dim: false, on: h.edge.id === v.link }));
    return { focus: null, dots, lines, left: 0 };
  }

  /** No entry yet: the names to start from, spread around the slots. */
  private opening(v: WalkView): Stop {
    const { slots } = this;
    const stride = slots.length / Math.max(1, v.start.length);
    const dots = v.start.map((n, i): Dot => {
      const s = slots[Math.floor(i * stride + stride / 2) % slots.length];
      return { ...s, id: n.id, name: n.name, r: this.radius(n.id), layer: this.idx.data.types[n.type]?.layer ?? null, dim: false, focus: false, on: false };
    });
    return { focus: null, dots, lines: [], left: 0 };
  }

  // ------------------------------------------------------------------ drawing

  private dot(d: Dot): HTMLElement {
    const a = el('a', `ctdx-dot is-${d.side}${d.focus ? ' is-focus' : ''}${d.dim ? ' is-dim' : ''}${d.on ? ' is-on' : ''}`);
    if (d.id !== META_ID) a.href = `/x/?focus=${encodeURIComponent(d.id)}`;
    a.tabIndex = -1;
    a.draggable = false;
    a.dataset.walk = d.id;
    a.title = d.name;
    a.style.cssText = `left:${d.x}px;top:${d.y}px;--r:${d.r}px;--dot:${d.layer ? `var(--layer-${d.layer})` : 'var(--graph-node)'}`;
    const label = el('span');
    fit(d.name, d.width, this.w >= WIDE ? LABEL_PX : PHONE_LABEL_PX, this.family).forEach((text, i) => {
      if (i) label.append(el('br'));
      label.append(text);
    });
    a.append(el('i'), label);
    return a;
  }

  private paint(dots: Dot[], lines: Line[], cls: string): HTMLElement {
    const box = el('div', cls);
    const svg = document.createElementNS(SVG, 'svg');
    svg.setAttribute('aria-hidden', 'true');
    for (const l of lines) {
      const hit = line('ctdx-hit', l);
      hit.dataset.link = l.id;
      svg.append(line(`ctdx-line${l.faint ? ' is-faint' : ''}${l.dim ? ' is-dim' : ''}${l.on ? ' is-on' : ''}`, l), hit);
    }
    box.append(svg, ...dots.map((d) => this.dot(d)));
    return box;
  }

  private camera(x: number, y: number): string {
    return `translate3d(${Math.round(this.w / 2 - x)}px, ${Math.round(this.h / 2 - y)}px, 0)`;
  }

  /** Puts a stop on screen at once, in place of the one there. */
  private draw(stop: Stop): void {
    const box = this.paint(stop.dots, stop.lines, 'ctdx-scene');
    box.style.transform = `translate(${this.cx}px, ${this.cy}px)`;
    this.box?.remove();
    this.world.append(box);
    this.box = box;
    this.stop = stop;
    this.world.style.transform = this.camera(this.cx, this.cy);
    this.say(stop);
  }

  private say(stop: Stop): void {
    const words = [
      stop.left ? `${stop.left.toLocaleString('en')} more in the list.` : '',
      stop.lines.some((l) => l.faint) ? 'Dashed: one side’s account, or being verified.' : '',
    ].filter(Boolean);
    // a phone has room for one of them, and what the dashes mean comes first
    this.note.textContent = (this.w < WIDE ? words.slice(-1) : words).join(' ');
  }

  // ------------------------------------------------------------------ the move

  /** Glides to the view's entry. False when nothing joins here to there, and the view just changes. */
  private go(v: WalkView): boolean {
    const { stop, box } = this;
    const focus = v.focus;
    if (!focus || v.path || !stop || !box) return false;
    const from = stop.focus;
    const seen = stop.dots.find((d) => d.id === focus);
    const way = from ? this.angle(from, focus) : 0;
    const spot = seen ?? (from ? this.slots.reduce((a, b) => (turn(b.angle, way) < turn(a.angle, way) ? b : a)) : null);
    if (!spot) return false;
    const linked = !!from && (this.idx.incident.get(focus) ?? []).some((e) => (e.from === from || e.to === from) && v.vis(e) !== 'hide');
    if (linked) {
      const slot = this.slots.findIndex((s) => s.x === -spot.x && s.y === -spot.y);
      this.anchor = slot >= 0 ? { id: from, slot } : null;
    }
    const next = this.ring(focus, v);
    const moving = this.running.length > 0;
    // a move cut short leaves from where it has got to, never from where it was going
    const start = moving ? getComputedStyle(this.world).transform : this.world.style.transform;
    const fading = [...this.leaving, box].map((e): [HTMLElement, number] => [e, moving ? Number(getComputedStyle(e).opacity) : 1]);
    for (const a of this.running) a.cancel();
    this.join();

    this.cx += spot.x;
    this.cy += spot.y;
    // The two entries and the line between them stay at full strength: everything else fades.
    const a = linked ? next.dots.find((d) => d.id === from) : undefined;
    const b = next.dots.find((d) => d.id === focus)!;
    const l = next.lines.find((x) => x.to === from);
    const pair = a && l;
    const arriving = this.paint(next.dots.filter((d) => !pair || (d !== a && d !== b)), next.lines.filter((x) => !pair || x !== l), 'ctdx-scene');
    arriving.style.transform = `translate(${this.cx}px, ${this.cy}px)`;
    this.world.append(arriving);
    const end = this.camera(this.cx, this.cy);
    this.world.style.transform = end;
    const glide = this.world.animate({ transform: [start, end] }, { duration: GLIDE_MS, easing: EASE });
    this.running = [glide, arriving.animate({ opacity: [0, 1] }, { duration: ARRIVE_MS, delay: GLIDE_MS - ARRIVE_MS, easing: 'linear', fill: 'backwards' })];
    for (const [e, opacity] of fading) {
      e.classList.add('is-leaving');
      this.running.push(e.animate({ opacity: [opacity, 0] }, { duration: LEAVE_MS, easing: 'linear', fill: 'forwards' }));
    }
    this.leaving = fading.map(([e]) => e);
    if (pair) this.hold(a, b, l, stop.dots.find((d) => d.id === from)?.r ?? FOCUS_R, stop.dots.find((d) => d.id === focus)?.r ?? b.r / 2);
    glide.onfinish = () => this.land();
    this.box = arriving;
    this.stop = next;
    this.say(next);
    return true;
  }

  /** Draws the two ends of the move over the fades: each changes size, and their names come in at once. */
  private hold(a: Dot, b: Dot, l: Line, ra: number, rb: number): void {
    const spine = this.paint([a, b], [l], 'ctdx-scene');
    spine.style.transform = `translate(${this.cx}px, ${this.cy}px)`;
    this.world.append(spine);
    this.spine = spine;
    const [ia, ib] = spine.querySelectorAll('.ctdx-dot i');
    this.running.push(
      ia.animate({ transform: [`scale(${ra / a.r})`, 'scale(1)'] }, { duration: GLIDE_MS, easing: EASE }),
      ib.animate({ transform: [`scale(${rb / b.r})`, 'scale(1)'] }, { duration: GLIDE_MS, easing: EASE }),
      ...[...spine.querySelectorAll('.ctdx-dot span')].map((name) => name.animate({ opacity: [0, 1] }, { duration: LEAVE_MS, easing: 'linear' })),
    );
  }

  /** What was held over the move joins the stop it belongs to. */
  private join(): void {
    if (!this.spine || !this.box) return;
    this.box.querySelector('svg')!.append(...this.spine.querySelector('svg')!.children);
    this.box.append(...this.spine.querySelectorAll('.ctdx-dot'));
    this.spine.remove();
    this.spine = null;
  }

  /** Ends a move: what was leaving goes, and nothing runs from here on. */
  private land(): void {
    for (const a of this.running) a.cancel();
    this.running = [];
    for (const e of this.leaving) e.remove();
    this.leaving = [];
    this.join();
  }
}
