// The Stories page's picture (theme/templates/chapters.html): every story an island of its own dots, from
// data/islands.json. The build settles where everything lies, so nothing here moves, and at rest nothing runs:
// the picture is painted once, off the page and a slice at a time, so that the list scrolls freely meanwhile.
// A hover or a tap changes only what stands out and the label, on a second canvas over the first. The page's
// plain list is the picture's alternative, so the element is aria-hidden.
import { loadJson } from '../lib/data';

/** `[x, y, ink, size]`, from the island's centre; a dot has no name, by rule (docs/data-contract.md). */
type Dot = [number, number, number, number];
/** `[a, b, strength, shown at rest]`, islands by index. */
type Line = [number, number, number, number];

interface Story {
  id: string;
  title: string;
  subtitle: string | null;
  r: number;
  dots: Dot[];
  links: [number, number][];
}

interface Sheet {
  w: number;
  h: number;
  at: [number, number][];
}

interface Picture {
  inks: string[];
  sheets: Sheet[];
  stories: Story[];
  lines: Line[];
}

type Box = [left: number, top: number, right: number, bottom: number];

/** How the chosen sheet sits in the box, in CSS pixels. */
interface Fit {
  sheet: Sheet;
  scale: number;
  x: number;
  y: number;
  width: number;
  height: number;
  ratio: number;
}

/** A name where the picture put it, kept so that a picked island's name stays in its place. */
interface Name {
  lines: string[];
  x: number;
  y: number;
  px: number;
  width: number;
  height: number;
}

const SIZES = [1.5, 2.1, 2.9, 3.9];
/** A dot's square on the stamp sheet, in CSS pixels. */
const CELL = 12;
/** Where a name may sit, in island radii from its centre: the middle if it is free, else in rings around it,
 *  up and down first, since a name is wider than it is tall. */
const SPOTS: [number, number][] = [
  [0, 0],
  ...[0.45, 0.8, 1.15, 1.5, 1.9].flatMap((ring) =>
    [-90, 90, -40, -140, 40, 140, 0, 180].map((deg): [number, number] => {
      const a = (deg * Math.PI) / 180;
      return [Math.cos(a) * ring * 1.2, Math.sin(a) * ring];
    }),
  ),
];
/** A finger's target is at least this tall, in CSS pixels. */
const FINGER = 44;
/** A finger is less exact than a pointer: how far past its edge an island still answers. */
const REACH = { mouse: 1.12, touch: 1.4 };
/** The most a canvas holds, in device pixels: enough for a window at twice its size. */
const MOST_PIXELS = 9e6;
/** How long a slice of painting runs before the page gets its turn, in milliseconds. */
const SLICE = 6;

const nearestSheet = (sheets: Sheet[], aspect: number): Sheet =>
  sheets.reduce((a, b) => (Math.abs(Math.log(b.w / b.h / aspect)) < Math.abs(Math.log(a.w / a.h / aspect)) ? b : a));

/** Once the page has loaded and has a moment to spare: the list comes first. */
const whenIdle = (run: () => void): void => {
  const later = (): void => {
    if ('requestIdleCallback' in window) requestIdleCallback(run, { timeout: 1500 });
    else setTimeout(run, 200);
  };
  if (document.readyState === 'complete') later();
  else addEventListener('load', later, { once: true });
};

function token(from: Element, name: string): string {
  return getComputedStyle(from).getPropertyValue(name).trim();
}

/** A long name breaks in two near its middle, so that more names fit over the islands. */
function nameLines(c: CanvasRenderingContext2D, title: string, room: number): string[] {
  if (c.measureText(title).width <= room) return [title];
  const words = title.split(' ');
  let best = [title];
  let least = Infinity;
  for (let i = 1; i < words.length; i++) {
    const pair = [words.slice(0, i).join(' '), words.slice(i).join(' ')];
    const widest = Math.max(...pair.map((l) => c.measureText(l).width));
    if (widest < least) [best, least] = [pair, widest];
  }
  return best;
}

class CtdIsles extends HTMLElement {
  private data?: Picture;
  private fit?: Fit;
  private box!: HTMLElement;
  private over!: HTMLCanvasElement;
  private stamps!: HTMLCanvasElement;
  private tip!: HTMLAnchorElement;
  private tipName!: HTMLElement;
  private tipLine!: HTMLElement;
  private picked = -1;
  private byFinger = false;
  /** Bumped by each new painting, so that one under way gives up. */
  private turn = 0;
  private neighbours = new Map<number, Line[]>();
  private named = new Map<number, Name>();

  connectedCallback(): void {
    const box = this.querySelector<HTMLElement>('.isles-sheet');
    if (!box) return;
    this.box = box;
    const seen = new IntersectionObserver(
      (entries) => {
        if (!entries.some((e) => e.isIntersecting)) return;
        seen.disconnect();
        whenIdle(() => void this.start());
      },
      { rootMargin: '200px' },
    );
    seen.observe(box);
  }

  private async start(): Promise<void> {
    try {
      this.data = await loadJson<Picture>('/data/islands.json');
    } catch {
      this.hidden = true; // the list below stands alone
      return;
    }
    const fonts = document.fonts.load('650 14px "Bricolage Grotesque"');
    await Promise.race([fonts, new Promise((done) => setTimeout(done, 900))]);
    for (const line of this.data.lines) {
      for (const end of [line[0], line[1]]) {
        const list = this.neighbours.get(end) ?? [];
        list.push(line);
        this.neighbours.set(end, list);
      }
    }
    this.over = document.createElement('canvas');
    this.over.className = 'isles-over';
    this.tip = document.createElement('a');
    this.tip.className = 'isles-tip';
    this.tip.tabIndex = -1;
    this.tip.hidden = true;
    this.tipName = this.tip.appendChild(document.createElement('strong'));
    this.tipLine = this.tip.appendChild(document.createElement('span'));
    this.box.append(this.over, this.tip);
    this.listen();
    await this.paint();
    new ResizeObserver(() => {
      const { fit, box } = this;
      if (fit && (box.clientWidth !== fit.width || box.clientHeight !== fit.height)) void this.paint();
    }).observe(this.box);
    matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => void this.paint());
  }

  private listen(): void {
    const box = this.box;
    box.addEventListener('pointermove', (e) => {
      if (e.pointerType !== 'mouse') return;
      const i = this.islandAt(e, REACH.mouse);
      box.style.cursor = i < 0 ? '' : 'pointer';
      this.pick(i);
    });
    box.addEventListener('pointerleave', (e) => {
      if (e.pointerType === 'mouse') this.pick(-1);
    });
    box.addEventListener('pointerdown', (e) => {
      this.byFinger = e.pointerType !== 'mouse';
    });
    box.addEventListener('click', (e) => {
      if (this.tip.contains(e.target as Node)) return; // a link of its own
      // a name is underlined, so it opens at once; a finger on the dots gets the card first
      const name = this.byFinger ? this.nameAt(e) : -1;
      const i = name >= 0 ? name : this.islandAt(e, this.byFinger ? REACH.touch : REACH.mouse);
      if (i >= 0 && (!this.byFinger || name >= 0 || i === this.picked)) this.open(i, e);
      else this.pick(i);
    });
  }

  /** The island whose name is under a finger, or -1. */
  private nameAt(e: MouseEvent): number {
    const at = this.box.getBoundingClientRect();
    const [x, y] = [e.clientX - at.left, e.clientY - at.top];
    let best = -1;
    let least = Infinity;
    for (const [i, name] of this.named) {
      const off = Math.abs(y - name.y);
      if (Math.abs(x - name.x) <= name.width / 2 + 4 && off <= Math.max(name.height, FINGER) / 2 && off < least) [best, least] = [i, off];
    }
    return best;
  }

  private islandAt(e: MouseEvent, reach: number): number {
    const { data, fit } = this;
    if (!data || !fit) return -1;
    const at = this.box.getBoundingClientRect();
    const x = (e.clientX - at.left - fit.x) / fit.scale;
    const y = (e.clientY - at.top - fit.y) / fit.scale;
    let best = -1;
    let least = reach;
    data.stories.forEach((s, i) => {
      const [cx, cy] = fit.sheet.at[i]!;
      const d = Math.hypot(x - cx, y - cy) / s.r;
      if (d < least) [best, least] = [i, d];
    });
    return best;
  }

  private open(i: number, e: MouseEvent): void {
    const url = `/c/${this.data!.stories[i]!.id}/`;
    if (e.metaKey || e.ctrlKey) window.open(url);
    else location.href = url;
  }

  private sized(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
    const { width, height, ratio } = this.fit!;
    canvas.width = Math.round(width * ratio);
    canvas.height = Math.round(height * ratio);
    const c = canvas.getContext('2d')!;
    c.setTransform(ratio, 0, 0, ratio, 0, 0);
    return c;
  }

  /** Lays the sheet that suits the box into it, and paints it off the page. The finished picture takes the
   *  place of the one before, so nobody sees it half done. */
  private async paint(): Promise<void> {
    const turn = ++this.turn;
    const data = this.data!;
    const width = this.box.clientWidth;
    const height = this.box.clientHeight;
    const pad = Math.min(16, width * 0.02);
    const sheet = nearestSheet(data.sheets, width / height);
    const scale = Math.min((width - pad * 2) / sheet.w, (height - pad * 2) / sheet.h);
    const ratio = Math.min(devicePixelRatio || 1, 2, Math.sqrt(MOST_PIXELS / (width * height)));
    this.fit = { sheet, scale, x: (width - sheet.w * scale) / 2, y: (height - sheet.h * scale) / 2, width, height, ratio };
    this.stamps = this.stampSheet();
    const fresh = document.createElement('canvas');
    fresh.className = 'isles-rest';
    const c = this.sized(fresh);
    const rule = token(this, '--rule');
    const steps = [
      () => this.seaLines(c, data.lines.filter((l) => l[3]), rule, 1),
      ...data.stories.map((_, i) => () => this.islands(c, [i], rule)),
      () => this.names(c),
    ];
    let began = performance.now();
    for (const step of steps) {
      step();
      if (performance.now() - began < SLICE) continue;
      await new Promise((go) => setTimeout(go));
      if (turn !== this.turn) return;
      began = performance.now();
    }
    this.box.querySelector('.isles-rest')?.remove();
    this.box.prepend(fresh);
    this.sized(this.over);
    const again = this.picked;
    this.picked = -1;
    this.pick(again);
  }

  private screen(i: number): [number, number] {
    const { sheet, scale, x, y } = this.fit!;
    const [cx, cy] = sheet.at[i]!;
    return [x + cx * scale, y + cy * scale];
  }

  private seaLines(c: CanvasRenderingContext2D, lines: Line[], color: string, weight: number): void {
    c.strokeStyle = color;
    for (const [a, b, strength] of lines) {
      const [x0, y0] = this.screen(a);
      const [x1, y1] = this.screen(b);
      c.lineWidth = (0.5 + strength * 0.25) * weight;
      c.beginPath();
      c.moveTo(x0, y0);
      c.quadraticCurveTo((x0 + x1) / 2 + (y1 - y0) * 0.09, (y0 + y1) / 2 - (x1 - x0) * 0.09, x1, y1);
      c.stroke();
    }
  }

  /** One finished dot of each ink and size. Stamping these costs far less than filling thousands of circles,
   *  and that work shares the GPU with scrolling. */
  private stampSheet(): HTMLCanvasElement {
    const { inks } = this.data!;
    const { scale, ratio } = this.fit!;
    const grow = Math.min(1.35, Math.max(0.85, scale / 0.32));
    const sheet = document.createElement('canvas');
    sheet.width = Math.ceil(CELL * SIZES.length * ratio);
    sheet.height = Math.ceil(CELL * inks.length * ratio);
    const c = sheet.getContext('2d')!;
    c.scale(ratio, ratio);
    inks.forEach((ink, row) => {
      c.fillStyle = ink;
      SIZES.forEach((r, column) => {
        c.beginPath();
        c.arc((column + 0.5) * CELL, (row + 0.5) * CELL, r * grow, 0, Math.PI * 2);
        c.fill();
      });
    });
    return sheet;
  }

  /** The islands' own lines, then their dots. */
  private islands(c: CanvasRenderingContext2D, which: number[], linkColor: string): void {
    const { stories } = this.data!;
    const { scale, ratio } = this.fit!;
    c.strokeStyle = linkColor;
    c.lineWidth = 0.6;
    c.beginPath();
    for (const i of which) {
      const [x, y] = this.screen(i);
      const { dots, links } = stories[i]!;
      for (const [a, b] of links) {
        c.moveTo(x + dots[a]![0] * scale, y + dots[a]![1] * scale);
        c.lineTo(x + dots[b]![0] * scale, y + dots[b]![1] * scale);
      }
    }
    c.stroke();
    const cell = CELL * ratio;
    // on whole device pixels, so that every dot of a kind comes out the same
    const snap = (v: number): number => Math.round((v - CELL / 2) * ratio) / ratio;
    for (const i of which) {
      const [x, y] = this.screen(i);
      for (const [dx, dy, ink, size] of stories[i]!.dots) {
        c.drawImage(this.stamps, size * cell, ink * cell, cell, cell, snap(x + dx * scale), snap(y + dy * scale), CELL, CELL);
      }
    }
  }

  private setType(c: CanvasRenderingContext2D, px: number): void {
    c.font = `650 ${px}px "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`;
    c.textAlign = 'center';
    c.textBaseline = 'middle';
    c.lineJoin = 'round';
    c.lineWidth = 4;
  }

  /** A name, underlined as every link on the site is: an island opens, and this says so with no click. */
  private writeName(c: CanvasRenderingContext2D, { lines, x, y, px }: Name, paper: string, ink: string): void {
    this.setType(c, px);
    lines.forEach((line, n) => {
      const ly = y + (n - (lines.length - 1) / 2) * px * 1.14;
      const half = c.measureText(line).width / 2;
      const rule = Math.round(ly + px * 0.56);
      c.fillStyle = paper;
      c.strokeStyle = paper;
      c.strokeText(line, x, ly);
      c.fillRect(x - half - 1, rule - 1, half * 2 + 2, 3);
      c.fillStyle = ink;
      c.fillText(line, x, ly);
      c.fillRect(x - half, rule, half * 2, 1);
    });
  }

  /** Every island's name, at rest: the widest first, in the middle of its island or the nearest free spot. */
  private names(c: CanvasRenderingContext2D): void {
    const { stories } = this.data!;
    const { scale, width, height } = this.fit!;
    const paper = token(this, '--paper');
    const ink = token(this, '--ink');
    const taken: Box[] = [];
    const sized = stories.map((s, i) => {
      const r = s.r * scale;
      const px = Math.round(Math.min(17, Math.max(12.5, r * 0.26)));
      this.setType(c, px);
      const lines = nameLines(c, s.title, Math.max(110, r * 2.1));
      return { i, r, px, lines, w: Math.max(...lines.map((l) => c.measureText(l).width)), h: lines.length * px * 1.14 + 3 };
    });
    this.named.clear();
    for (const { i, r, px, lines, w, h } of sized.sort((a, b) => b.w * b.h - a.w * a.h || a.i - b.i)) {
      const [cx, cy] = this.screen(i);
      const place = (dx: number, dy: number): [number, number] => [
        Math.max(w / 2 + 5, Math.min(width - w / 2 - 5, cx + dx * r)),
        Math.max(h / 2 + 2, Math.min(height - h / 2 - 2, cy + dy * r)),
      ];
      const covers = ([x, y]: [number, number]): Box => [x - w / 2 - 3, y - h / 2 - 1, x + w / 2 + 3, y + h / 2 + 1];
      const free = SPOTS.map(([dx, dy]) => place(dx, dy)).find((spot) => {
        const box = covers(spot);
        return !taken.some((t) => box[0] < t[2] && box[2] > t[0] && box[1] < t[3] && box[3] > t[1]);
      });
      const [x, y] = free ?? place(0, 0);
      taken.push(covers([x, y]));
      const name = { lines, x, y, px, width: w, height: h };
      this.named.set(i, name);
      this.writeName(c, name, paper, ink);
    }
  }

  /** Brings one island forward, or none. Nothing moves: the rest steps back, and a label appears. */
  private pick(i: number): void {
    if (i === this.picked) return;
    this.picked = i;
    this.box.classList.toggle('picked', i >= 0);
    this.tip.hidden = i < 0;
    if (i < 0) return;
    const story = this.data!.stories[i]!;
    const { width, height } = this.fit!;
    const c = this.over.getContext('2d')!;
    const paper = token(this, '--paper');
    c.clearRect(0, 0, width, height);
    c.globalAlpha = 0.84;
    c.fillStyle = paper;
    c.fillRect(0, 0, width, height);
    const lines = this.neighbours.get(i) ?? [];
    const near = lines.map(([a, b]) => (a === i ? b : a));
    c.globalAlpha = 0.55;
    this.islands(c, near, token(this, '--rule'));
    c.globalAlpha = 1;
    const muted = token(this, '--muted');
    this.seaLines(c, lines, muted, 1.3);
    this.islands(c, [i], muted);
    const ink = token(this, '--ink');
    for (const n of [...near, i]) {
      const name = this.named.get(n);
      if (name) this.writeName(c, name, paper, ink);
    }
    this.tipName.textContent = story.title;
    this.tipLine.textContent = story.subtitle ?? '';
    this.tipLine.hidden = !story.subtitle;
    this.tip.href = `/c/${story.id}/`;
    this.placeTip(i);
  }

  /** Over the island, or under it when the window has no room there, and always inside the box. */
  private placeTip(i: number): void {
    const { scale, width } = this.fit!;
    const [x, y] = this.screen(i);
    const r = this.data!.stories[i]!.r * scale;
    const w = this.tip.offsetWidth;
    const h = this.tip.offsetHeight;
    const head = document.querySelector('.site-header')?.getBoundingClientRect().bottom ?? 0;
    const room = this.box.getBoundingClientRect().top + y - r - head;
    this.tip.style.left = `${Math.max(8, Math.min(width - w - 8, x - w / 2))}px`;
    this.tip.style.top = `${room > h + 16 ? y - r - h - 8 : y + r + 8}px`;
  }
}

customElements.define('ctd-isles', CtdIsles);
