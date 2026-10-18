// The world viewer: deck.gl OrthographicView + a TileLayer over the binary world tiles
// (docs/world-tiles.md). Used by /w/ (world.js) and, lazily, by the explorer's world mode.
import { Deck, OrthographicView, type DeckProps, type PickingInfo } from '@deck.gl/core';
import type { _Tile2DHeader as Tile2DHeader, _TileLoadProps as TileLoadProps } from '@deck.gl/geo-layers';
import { ScatterplotLayer } from '@deck.gl/layers';
import { cssColorToRgb, tokenRgb, tokenString, type RGB } from '../lib/color';
import { fetchJson } from '../lib/data';
import { el } from '../lib/dom';
import { currentUrl, replaceUrl } from '../lib/history';
import type { Box } from '../lib/labels';
import type { Earth, EarthEntry, EarthSpot, Insets } from './earth';
import { eraAlpha, erasOf, type Era } from './era';
import { buildTileRender, clamp01, NO_DEPTH, releaseTile, WORLD_SIZE, WorldTileLayer, type TileEra, type TileRender, type WorldStyle } from './layers';
import { runSoak } from './soak';
import { FpsMeter, fmtInt, fmtMB, heapBytes, MB, Meter, type TileCounts } from './stats';
import {
  checkManifest,
  emptyTile,
  key,
  labelAt,
  parseTile,
  TileFormatError,
  toEntity,
  type TileIndex,
  type WorldEntity,
  type WorldManifest,
  type WorldRegion,
} from './tiles';

export interface WorldOptions {
  /** Base URL of the world, ending with "/" (e.g. /world/ or /world-synth/). Same origin only. */
  src: string;
  /** Soak mode: drive the camera automatically and log metrics. */
  soak?: { seconds: number } | null;
  /** Stats overlay; default on for synthetic worlds and in soak mode. Toggle with "s". */
  stats?: boolean | null;
  labels?: boolean;
  /** Multiplies the node size (debugging the size scale). */
  radiusFactor?: number;
  /** Entity id to fly to once loaded (content worlds). */
  focus?: string | null;
  /** /w/ (content worlds): open on the map of links (the default) or on the Earth (?view=earth). */
  view?: View;
  /** Inside another app (the explorer): no legend, notice or shortcuts of its own. */
  embedded?: boolean;
  /** Embedded: how far (px) the host's own controls reach down over the top of the map. */
  insetTop?: () => number;
  /** Content worlds: called with the picked entity (or null) instead of showing the card. */
  onPick?: (entity: WorldEntity | null) => void;
  /**
   * Embedded: the world failed (mountWorld also rejects when that happens while loading). The viewer
   * then shows nothing of its own, so the host can say so in its own words.
   */
  onFail?: () => void;
}

export interface WorldHandle {
  readonly manifest: WorldManifest;
  focusEntity(id: string, select?: boolean): Promise<boolean>;
  /** Highlight an entity without moving the camera (null clears). */
  select(id: string | null): void;
  zoomBy(delta: number): void;
  resetView(): void;
  destroy(): void;
}

interface Picked {
  id: number;
  cluster: boolean;
  x: number;
  y: number;
  size: number;
  color: number;
  label: string;
  z: number;
}

/** /w/'s two views: the map of links (deck.gl tiles) and the Earth (a MapLibre globe, loaded on first use). */
export type View = 'links' | 'earth';

const S = WORLD_SIZE;
const TILE_LAYER_ID = 'world-tiles';
const HOW: Record<View, string> = {
  links: 'Scroll to zoom, drag to pan, click a dot.',
  earth: 'Scroll to zoom, drag to turn the globe, click a dot.',
};
/** Zooms above the content fit over which region names fade out and the dots' own names fade in. */
const REGION_FADE: [number, number] = [0.7, 1.5];

/** A region name on the map: an HTML label the viewer places over the canvas (clicks go through to the map). */
interface RegionLabel {
  region: WorldRegion;
  el: HTMLElement;
  w: number;
  h: number;
  /** Where it was drawn last, in stage pixels; null when hidden. */
  box: Box | null;
}

const inBox = (b: Box, x: number, y: number, slop = 0) => x >= b.x0 - slop && x <= b.x1 + slop && y >= b.y0 - slop && y <= b.y1 + slop;

/** Resolve ?src= / data-src: same-origin only, always ending with "/". */
export function resolveWorldSrc(value: string | null | undefined, fallback = '/world/'): string {
  const raw = (value ?? '').trim() || fallback;
  try {
    const u = new URL(raw, location.href);
    if (u.origin !== location.origin) throw new Error('cross-origin');
    const path = u.pathname.endsWith('/') ? u.pathname : `${u.pathname}/`;
    return path;
  } catch {
    console.warn(`connect-the-dot world: ignoring src "${raw}" (same-origin paths only)`);
    return fallback;
  }
}

/** Only same-site paths may become links (entities.json comes from the same origin, but be strict). */
const safeHref = (url: unknown): string | null => (typeof url === 'string' && /^\/(?!\/)/.test(url) ? url : null);

/** Rejects when the world cannot load. On /w/ the viewer's own message stays up; embedded, it is removed. */
export async function mountWorld(root: HTMLElement, opts: WorldOptions): Promise<WorldHandle> {
  const viewer = new WorldViewer(root, opts);
  await viewer.ready;
  if (viewer.failure) {
    if (opts.embedded) viewer.destroy();
    throw viewer.failure;
  }
  return viewer;
}

/** The parts of deck.gl's luma.gl device that destroy() releases. */
interface GpuDevice {
  canvasContext?: { destroy(): void } | null;
  gl?: WebGL2RenderingContext;
}

class WorldViewer implements WorldHandle {
  readonly ready: Promise<void>;
  manifest!: WorldManifest;
  /** Why the world could not be shown, once it failed. */
  failure: Error | null = null;
  private opts: WorldOptions;
  private root: HTMLElement;
  private wrap: HTMLDivElement;
  private stage: HTMLDivElement;
  private tooltip: HTMLDivElement;
  private card: HTMLElement;
  private statsEl: HTMLPreElement;
  private stateEl: HTMLDivElement;
  private deck: Deck<OrthographicView> | null = null;
  /** deck.gl's device, from onDeviceInitialized: releaseDeck() frees its WebGL context. */
  private device: GpuDevice | null = null;
  private style!: WorldStyle;
  private entities: WorldEntity[] | null = null;
  private entityIndex = new Map<string, number>();
  private target: [number, number] = [S / 2, S / 2];
  private zoom = 0;
  /** Zoom and camera target that show every node (the content bounds), clear of the overlays. */
  private fitZoom = 0;
  private home: [number, number] = [S / 2, S / 2];
  /** Stage size and the insets the overlays take (px). */
  private view = { w: 800, h: 600, top: 12, bottom: 12, left: 16, right: 16 };
  private minZoom = -2;
  private maxZoom = 12;
  private tileLayer: WorldTileLayer | null = null;
  private labelAvoid: { boxes: Box[] } = { boxes: [] };
  /** Overlay boxes (HUD, buttons, era bar, card): labels keep clear of them. */
  private overlays: Box[] = [];
  private regionLabels: RegionLabel[] = [];
  private regionLayer: HTMLDivElement | null = null;
  private regionAlpha = 0;
  private hoverRegion: WorldRegion | null = null;
  /** Dot labels fade in as region names fade out (null: always shown). Mutated in place. */
  private labelFade: { from: number; to: number } | null = null;
  private eras: Era[] = [];
  private eraUi: { input: HTMLInputElement; label: HTMLElement; note: HTMLElement } | null = null;
  private era: Era | null = null;
  private tileEra: TileEra | null = null;
  private pendingEra: Era | null = null;
  private eraFrame = 0;
  private coarse = matchMedia('(pointer: coarse)').matches;
  private hover: Picked | null = null;
  private selected: Picked | null = null;
  private fps = new FpsMeter();
  private parse = new Meter();
  private errors = 0;
  private budget = 128 * MB;
  private statsOn = false;
  private statsTimer = 0;
  private soak: { stop(): void } | null = null;
  private fly = 0;
  private destroyed = false;
  /** /w/ only: which view shows, its switch, and the HUD and hint text that follow it. */
  private mode: View = 'links';
  private viewButtons: Record<View, HTMLButtonElement> | null = null;
  private hudCount: HTMLElement | null = null;
  private hintHow: HTMLElement | null = null;
  private hintRegions: HTMLElement | null = null;
  /** The Earth: its box (made on first use), the map once loaded, and the load in flight. */
  private earthBox: HTMLDivElement | null = null;
  private earth: Earth | null = null;
  private earthLoad: Promise<Earth | null> | null = null;
  private onKey = (e: KeyboardEvent) => this.handleKey(e);
  private onFocusEvent = (e: Event) => {
    const id = (e as CustomEvent<{ id: string | null }>).detail?.id;
    if (!id || !this.entityIndex.has(id)) return;
    // The Earth shows only entries with a place: for the others, site search opens their page.
    if (this.mode === 'earth' && this.earth && !this.earth.spotOf(id)) return;
    e.preventDefault(); // shown here: site search stays on this page
    void this.focusEntity(id, true).then((shown) => {
      // the Earth was still loading, and the entry turned out to have no place on it: open its page
      const i = this.entityIndex.get(id);
      const href = !shown && this.mode === 'earth' && i !== undefined ? safeHref(this.entities?.[i]?.url ?? '') : null;
      if (href) location.href = href;
    });
  };
  private onResize = () => {
    this.fitHeight();
    if (this.manifest && this.deck) this.computeLimits();
    this.updateAvoid();
  };

  constructor(root: HTMLElement, opts: WorldOptions) {
    this.root = root;
    this.opts = opts;
    this.wrap = el('div', 'ctdw');
    if (opts.embedded) this.wrap.classList.add('is-embedded');
    this.wrap.setAttribute('role', 'region');
    this.wrap.setAttribute('aria-label', 'World map');
    this.stage = el('div', 'ctdw-stage');
    this.tooltip = el('div', 'ctdw-tooltip');
    this.tooltip.hidden = true;
    this.tooltip.setAttribute('role', 'status');
    this.card = el('aside', 'ctdw-card');
    this.card.hidden = true;
    this.statsEl = el('pre', 'ctdw-stats');
    this.statsEl.hidden = true;
    this.statsEl.setAttribute('aria-label', 'Rendering statistics');
    this.stateEl = el('div', 'ctdw-state');
    this.stateEl.append(el('span', 'ctdw-loader'), el('p', '', 'Charting the world…'));
    this.wrap.append(this.stage, this.tooltip, this.card, this.statsEl, this.stateEl);
    for (const child of [...root.children]) if (child.tagName === 'NOSCRIPT') child.remove();
    root.append(this.wrap);
    this.fitHeight();
    window.addEventListener('resize', this.onResize);
    this.ready = this.init().catch((err: unknown) => this.fail(err));
  }

  // ------------------------------------------------------------------ setup

  private async init(): Promise<void> {
    const src = this.opts.src;
    this.manifest = checkManifest(await fetchJson<unknown>(`${src}manifest.json`));
    const m = this.manifest;
    if (m.entities) {
      try {
        const list = await fetchJson<unknown[]>(new URL(m.entities, new URL(src, location.href)).pathname);
        this.entities = (Array.isArray(list) ? list : []).map((e) => toEntity(e, safeHref));
        this.entities.forEach((e, i) => e.id && this.entityIndex.set(e.id, i));
      } catch (err) {
        console.warn('connect-the-dot world: entities unavailable', err);
      }
    }
    if (this.destroyed) return;
    this.wrap.dataset.kind = m.kind;
    this.style = this.makeStyle();
    if (this.opts.labels !== false) await this.loadFont();
    if (this.destroyed) return;

    const deviceMemory = (navigator as Navigator & { deviceMemory?: number }).deviceMemory;
    const small = Math.min(screen.width, screen.height) < 600 || matchMedia('(max-width: 760px)').matches;
    this.budget = (deviceMemory != null && deviceMemory <= 4) || small ? 48 * MB : 128 * MB;

    this.buildChrome();
    this.computeLimits();
    this.target = this.home;
    this.zoom = this.fitZoom;
    this.createDeck();
    this.stateEl.remove();

    this.statsOn = this.opts.stats ?? (m.kind !== 'content' || !!this.opts.soak);
    this.statsEl.hidden = !this.statsOn;
    this.renderStats();
    this.updateAvoid();
    this.fps.start();
    this.statsTimer = window.setInterval(() => this.renderStats(), 250);
    if (!this.opts.embedded) document.addEventListener('keydown', this.onKey);
    if (m.kind === 'content' && !this.opts.embedded) {
      document.addEventListener('ctd:focus', this.onFocusEvent);
      // Keep site search in place: it dispatches ctd:focus instead of leaving the page.
      document.documentElement.dataset.ctdExplorer = '';
    }
    if (this.opts.soak) this.startSoak(this.opts.soak.seconds);
    else {
      if (this.opts.view === 'earth') this.setMode('earth', false); // ?view=earth is already in the URL
      if (this.opts.focus) void this.focusEntity(this.opts.focus, true);
    }
  }

  private makeStyle(): WorldStyle {
    const m = this.manifest;
    // Calm map: gray dots and lines on the page surface; the accent marks the selection only.
    // Palette hues are not used for drawing (meaning is never hue-only); see hasHues() for the legend.
    const ground = tokenRgb('--paper', [255, 255, 255], this.root);
    const ink = tokenRgb('--night-ink', [29, 29, 31], this.root);
    const nodeGray = tokenRgb('--graph-node', [142, 142, 147], this.wrap);
    const edgeGray = tokenRgb('--graph-edge', [199, 199, 204], this.wrap);
    const content = m.kind === 'content';
    const rgba = (c: RGB): [number, number, number, number] => [Math.round(c[0]), Math.round(c[1]), Math.round(c[2]), 255];
    return {
      nodeRgba: Uint8Array.from(rgba(nodeGray)),
      edgeRgb: Uint8Array.from(rgba(edgeGray).slice(0, 3)),
      // size is in world units: radius_px = size * S * 2^zoom * factor, clamped. Deeper worlds get a
      // smaller factor so the densest zoom still shows dots rather than discs.
      radiusScale: S * 2 ** (3 - m.maxzoom) * (content ? 2.4 : 3) * (this.opts.radiusFactor ?? 1),
      minCorePx: content ? 4 : 1.35,
      maxCorePx: content ? 13 : 11,
      ink: rgba(ink),
      night: rgba(ground),
      font: tokenString('--font-ui', 'system-ui, sans-serif', this.root),
      labelsPerTile: content ? 256 : 40,
      reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
    };
  }

  /** The label atlas is drawn once: wait (briefly) for the UI web font. */
  private async loadFont(): Promise<void> {
    if (!document.fonts?.load) return;
    const family = this.style.font.split(',')[0].trim();
    await Promise.race([
      document.fonts.load(`500 48px ${family}`).catch(() => undefined),
      new Promise((r) => setTimeout(r, 1500)),
    ]);
  }

  private buildChrome(): void {
    const m = this.manifest;
    const hud = el('div', 'ctdw-hud');
    this.hudCount = el('span', 'ctdw-hud-count', this.linksCount());
    // On /w/ the Links | Earth switch stands where the title would.
    if (m.kind === 'content' && !this.opts.embedded) hud.append(this.buildViews(), this.hudCount);
    else hud.append(el('span', 'ctdw-hud-title', m.kind === 'content' ? 'The whole map' : 'Synthetic world'), this.hudCount);

    const zoom = el('div', 'ctdw-zoom');
    zoom.setAttribute('role', 'group');
    zoom.setAttribute('aria-label', 'Zoom');
    const btn = (label: string, text: string, fn: () => void) => {
      const b = el('button', '', text);
      b.type = 'button';
      b.setAttribute('aria-label', label);
      b.addEventListener('click', fn);
      return b;
    };
    zoom.append(btn('Zoom in', '+', () => this.zoomBy(1)), btn('Zoom out', '−', () => this.zoomBy(-1)), btn('Show the whole map', '⌂', () => this.resetView()));
    this.wrap.append(hud, zoom);
    const regions = this.opts.embedded ? [] : (m.regions ?? []);

    if (!this.opts.embedded) {
      // A colour legend only makes sense when the palette has hues; the site palette is neutral.
      if (m.palette_labels.length && hasHues(m.palette)) {
        const legend = el('ul', 'ctdw-legend');
        legend.setAttribute('aria-label', 'Colours');
        m.palette_labels.forEach((label, i) => {
          const li = el('li', '', label);
          li.style.setProperty('--c', m.palette[i] ?? 'var(--night-muted)');
          legend.append(li);
        });
        this.wrap.append(legend);
      }
      const hint = el('p', 'ctdw-hint');
      this.hintHow = el('span', 'ctdw-hint-how', m.kind === 'content' ? HOW.links : 'Scroll to zoom, drag to pan. Press s for stats.');
      hint.append(this.hintHow);
      // A region name is a place on the map, never a claim about who runs what: say so where it shows.
      if (regions.length) {
        this.hintRegions = el('span', '', 'Regions are groups of entries with many links between them, named after their best-connected one.');
        hint.append(' ', this.hintRegions);
      }
      this.wrap.append(hint);
      if (m.kind === 'content') this.wrap.append(el('p', 'ctdw-notice', 'A connection is not evidence of wrongdoing.'));
      this.buildEra();
    }
    if (regions.length) {
      const layer = el('div', 'ctdw-regions');
      layer.setAttribute('aria-hidden', 'true');
      for (const region of regions) {
        const label = el('span', 'ctdw-region', region.label);
        layer.append(label);
        this.regionLabels.push({ region, el: label, w: 0, h: 0, box: null });
      }
      this.stage.after(layer);
      for (const r of this.regionLabels) {
        r.w = r.el.offsetWidth || r.region.label.length * 8;
        r.h = r.el.offsetHeight || 14;
      }
      this.regionLayer = layer;
      this.labelFade = { from: 0, to: 0 };
    }
  }

  private linksCount(): string {
    const m = this.manifest;
    return `${fmtInt(m.nodes)} ${m.kind === 'content' ? 'entries' : 'nodes'} · ${fmtCompact(m.edges)} links`;
  }

  /** "Links | Earth", a segmented control in the HUD. */
  private buildViews(): HTMLElement {
    const group = el('div', 'ctdw-views');
    group.setAttribute('role', 'group');
    group.setAttribute('aria-label', 'View');
    const button = (mode: View, text: string) => {
      const b = el('button', '', text);
      b.type = 'button';
      b.setAttribute('aria-pressed', String(mode === this.mode));
      b.addEventListener('click', () => this.setMode(mode));
      group.append(b);
      return b;
    };
    this.viewButtons = { links: button('links', 'Links'), earth: button('earth', 'Earth') };
    return group;
  }

  /** Show the map of links or the Earth: the era slider, zoom buttons and card serve both. */
  private setMode(mode: View, writeUrl = true): void {
    if (mode === this.mode || !this.viewButtons) return;
    this.closeCard();
    this.hideTooltip();
    this.mode = mode;
    const earth = mode === 'earth';
    this.wrap.classList.toggle('is-earth', earth);
    this.viewButtons.links.setAttribute('aria-pressed', String(!earth));
    this.viewButtons.earth.setAttribute('aria-pressed', String(earth));
    if (this.hintHow) this.hintHow.textContent = HOW[mode];
    if (this.hintRegions) this.hintRegions.hidden = earth;
    this.updateCount();
    if (writeUrl) {
      const url = currentUrl();
      if (earth) url.searchParams.set('view', 'earth');
      else url.searchParams.delete('view');
      replaceUrl(url);
    }
    if (earth) void this.loadEarth();
    else this.onResize(); // the hint is back: fit Links around it
  }

  /** The HUD's count: links, or (on the Earth, once drawn) the entries that have a place. */
  private updateCount(): void {
    if (!this.hudCount) return;
    const earth = this.mode === 'earth';
    this.hudCount.hidden = earth && !this.earth;
    this.hudCount.textContent = !earth ? this.linksCount() : this.earth ? `${fmtInt(this.earth.entries)} entries with a place` : '';
  }

  /** Load MapLibre and draw the Earth, once. */
  private loadEarth(): Promise<Earth | null> {
    if (this.earthLoad) return this.earthLoad;
    const box = el('div', 'ctdw-earth');
    const loading = el('div', 'ctdw-state');
    loading.append(el('span', 'ctdw-loader'), el('p', '', 'Loading the Earth…'));
    box.append(loading);
    this.stage.after(box);
    this.earthBox = box;
    this.earthLoad = import('./earth')
      .then(({ createEarth }) =>
        createEarth(box, {
          reducedMotion: this.style.reducedMotion,
          coarse: this.coarse,
          insets: (card) => this.insets(card),
          onPick: (spot) => this.showSpot(spot),
          onFail: (err) => this.earthFailed(err),
        }),
      )
      .then((earth) => {
        loading.remove();
        if (this.destroyed || box.dataset.failed != null) {
          earth.destroy();
          return null;
        }
        this.earth = earth;
        earth.setEra(this.pendingEra);
        this.updateCount();
        return earth;
      })
      .catch((err: unknown) => {
        this.earthFailed(err);
        return null;
      });
    return this.earthLoad;
  }

  /** No WebGL, or the basemap did not load: say so where the Earth would be. Links still works. */
  private earthFailed(err: unknown): void {
    const box = this.earthBox;
    if (!box || box.dataset.failed != null) return;
    box.dataset.failed = '';
    console.warn('connect-the-dot world: the Earth could not be drawn', err);
    this.earth?.destroy();
    this.earth = null;
    const state = el('div', 'ctdw-state is-error');
    state.append(el('p', '', 'The Earth could not be drawn.'), el('p', 'ctdw-note', 'Links shows every entry, and every entry has its own page.'));
    box.replaceChildren(state);
    if (this.mode === 'earth') this.card.hidden = true;
    // nothing on the Earth to count, zoom or move through
    this.updateCount();
    this.wrap.classList.add('is-earth-failed');
  }

  /**
   * Pixels the overlays take on each side (HUD and hint above, era bar and notice below). With `card`,
   * an open card as wide as the map (phones) counts too, so a spot brought into view stays above it.
   */
  private insets(card = false): Insets {
    this.computeLimits();
    const { w, h, top, left, right } = this.view;
    let { bottom } = this.view;
    if (card && !this.card.hidden && this.card.offsetWidth > w / 2) bottom = Math.max(bottom, h - this.card.offsetTop + 10);
    return { top, bottom, left, right };
  }

  /** The era slider: one native range input, "All time" at its right end. Only when entries have dates. */
  private buildEra(): void {
    const eras = this.entities ? erasOf(this.entities) : [];
    if (eras.length < 2) return;
    this.eras = eras;
    const bar = el('div', 'ctdw-era');
    const head = el('div', 'ctdw-era-head');
    // A plain span: the slider's aria-valuetext already speaks the era (an <output> would say it twice).
    const label = el('span', 'ctdw-era-label', 'All time');
    const note = el('span', 'ctdw-era-note', 'Drag to pick an era');
    head.append(label, note);
    const input = el('input');
    input.type = 'range';
    input.min = '0';
    input.max = String(eras.length);
    input.step = '1';
    input.value = String(eras.length);
    input.setAttribute('aria-label', 'Era');
    input.setAttribute('aria-valuetext', 'All time');
    // Input events can outpace frames: the text follows at once, the map at most once per frame.
    input.addEventListener('input', () => this.pickEra(Number(input.value)));
    bar.append(head, input);
    this.wrap.append(bar);
    this.wrap.classList.add('has-era');
    this.wrap.style.setProperty('--ctdw-era-h', `${bar.offsetHeight || 64}px`);
    this.eraUi = { input, label, note };
  }

  private pickEra(index: number): void {
    const era = this.eras[index] ?? null;
    const text = era ? era.label : 'All time';
    if (this.eraUi) {
      this.eraUi.label.textContent = text;
      this.eraUi.input.setAttribute('aria-valuetext', text);
      this.eraUi.note.textContent = era ? 'Others and undated entries faded' : 'Drag to pick an era';
      this.regionLayer?.classList.toggle('is-era', !!era);
    }
    this.pendingEra = era;
    if (!this.eraFrame) {
      this.eraFrame = requestAnimationFrame(() => {
        this.eraFrame = 0;
        this.applyEra(this.pendingEra);
        this.earth?.setEra(this.pendingEra);
      });
    }
  }

  /** Dims the dots whose dates miss the era (undated ones too); they never vanish. */
  private applyEra(era: Era | null): void {
    if (era === this.era || !this.deck) return;
    this.era = era;
    const list = this.entities ?? [];
    this.tileEra = era ? { version: (this.tileEra?.version ?? 0) + 1, alpha: Float32Array.from(list, (e) => eraAlpha(e, era)) } : null;
    this.tileLayer = null; // a new layer with the new era: deck redraws every tile's dots and links
    this.render();
  }

  /** The content fit: every node in view, clear of the HUD and hint above and the era bar below. */
  private computeLimits(): void {
    const w = Math.max(1, this.stage.clientWidth || this.root.clientWidth || 800);
    const h = Math.max(1, this.stage.clientHeight || this.root.clientHeight || 600);
    const base = this.stage.getBoundingClientRect();
    let top = 12;
    let bottom = 12;
    for (const node of this.wrap.querySelectorAll<HTMLElement>('.ctdw-hud, .ctdw-hint, .ctdw-era, .ctdw-notice')) {
      if (node.hidden || !node.offsetParent) continue;
      const r = node.getBoundingClientRect();
      if (!r.height) continue;
      if (r.top - base.top < h / 2) top = Math.max(top, r.bottom - base.top + 10);
      else bottom = Math.max(bottom, base.bottom - r.top + 10);
    }
    top = Math.max(top, this.opts.insetTop?.() ?? 0);
    this.view = { w, h, top: Math.min(top, h * 0.3), bottom: Math.min(bottom, h * 0.3), left: 16, right: 16 };
    const [x0, y0, x1, y1] = this.manifest.bounds ?? [0, 0, 1, 1];
    const aw = Math.max(1, w - this.view.left - this.view.right);
    const ah = Math.max(1, h - this.view.top - this.view.bottom);
    this.fitZoom = Math.log2(Math.min(aw / (Math.max(x1 - x0, 0.02) * S), ah / (Math.max(y1 - y0, 0.02) * S)) * 0.92);
    this.home = this.centerOn([((x0 + x1) / 2) * S, ((y0 + y1) / 2) * S], this.fitZoom);
    this.minZoom = this.fitZoom - 1.5;
    this.maxZoom = Math.max(this.manifest.maxzoom + 3, this.fitZoom + 5);
    if (this.labelFade) {
      this.labelFade.from = this.fitZoom + REGION_FADE[0];
      this.labelFade.to = this.fitZoom + REGION_FADE[1];
    }
  }

  /** The camera target that puts world point p in the middle of the area the overlays leave free. */
  private centerOn(p: [number, number], zoom: number): [number, number] {
    const v = this.view;
    const k = 2 ** zoom;
    return [p[0] - (v.left - v.right) / 2 / k, p[1] - (v.top - v.bottom) / 2 / k];
  }

  private viewState() {
    return { target: [this.target[0], this.target[1], 0] as [number, number, number], zoom: this.zoom, minZoom: this.minZoom, maxZoom: this.maxZoom };
  }

  private createDeck(): void {
    const soak = !!this.opts.soak;
    const props: DeckProps<OrthographicView> = {
      parent: this.stage,
      views: new OrthographicView({ id: 'world', flipY: true }),
      viewState: this.viewState(),
      controller: soak
        ? false
        : { scrollZoom: { speed: 0.012, smooth: false }, dragPan: true, dragRotate: false, touchZoom: true, touchRotate: false, doubleClickZoom: true, keyboard: !this.opts.embedded, inertia: 260 },
      onViewStateChange: ({ viewState, interactionState }) => {
        if (soak) return;
        const vs = viewState as unknown as { target: number[]; zoom: number };
        if (interactionState && (interactionState.isDragging || interactionState.isZooming || interactionState.isPanning)) this.cancelFly();
        this.setView([vs.target[0], vs.target[1]], vs.zoom);
      },
      getCursor: ({ isDragging, isHovering }) => (isDragging ? 'grabbing' : isHovering || this.hoverRegion ? 'pointer' : 'grab'),
      // A fingertip needs a bigger target than a mouse pointer.
      pickingRadius: this.coarse ? 12 : 4,
      useDevicePixels: Math.min(window.devicePixelRatio || 1, 2),
      onHover: (info) => this.handleHover(info),
      onClick: (info) => this.handleClick(info),
      onAfterRender: () => this.fps.draw(),
      onError: (error) => this.fail(error),
      onDeviceInitialized: (device) => {
        this.device = device;
      },
      // destroy() came before the device existed: release it now that deck.gl has finished setting up.
      onLoad: () => {
        if (this.destroyed) this.releaseDeck();
      },
      layers: [],
    };
    this.deck = new Deck<OrthographicView>(props);
    this.render();
  }

  // ------------------------------------------------------------------ tiles

  private loadTile = async (t: TileLoadProps): Promise<TileRender> => {
    const index = t.index as TileIndex;
    const url = `${this.opts.src}${index.z}/${index.x}/${index.y}.bin`;
    const res = await fetch(url, { signal: t.signal, credentials: 'same-origin' });
    if (res.status === 404 || res.status === 410) return buildTileRender(emptyTile(index), this.style);
    if (!res.ok) throw new Error(`${url} returned ${res.status}`);
    const buffer = await res.arrayBuffer();
    if (t.signal?.aborted) throw new DOMException('aborted', 'AbortError');
    // Static hosts with an HTML fallback answer missing tiles with a page: treat as empty.
    if ((res.headers.get('content-type') ?? '').includes('text/html')) return buildTileRender(emptyTile(index), this.style);
    const t0 = performance.now();
    const tile = parseTile(buffer, index);
    const render = buildTileRender(tile, this.style);
    this.parse.add(performance.now() - t0);
    return render;
  };

  private tileError = (err: unknown) => {
    if ((err as { name?: string })?.name === 'AbortError') return;
    this.errors++;
    if (this.errors <= 5) console.warn('connect-the-dot world: tile failed', err instanceof TileFormatError ? err.message : err);
  };

  private getTileLayer(): WorldTileLayer {
    if (this.tileLayer) return this.tileLayer;
    this.tileLayer = new WorldTileLayer({
      id: TILE_LAYER_ID,
      data: `${this.opts.src}{z}/{x}/{y}.bin`,
      getTileData: this.loadTile,
      tileSize: S,
      extent: [0, 0, S, S],
      minZoom: 0,
      maxZoom: this.tileMaxZoom(),
      zoomOffset: 0,
      refinementStrategy: 'best-available',
      maxRequests: 6,
      maxCacheByteSize: this.budget,
      onTileError: this.tileError,
      // a tile left the cache: drop its arrays (hover and selection hold copies, not references)
      onTileUnload: releaseTile,
      pickable: true,
      style: this.style,
      labelAvoid: this.labelAvoid,
      showLabels: this.opts.labels !== false,
      era: this.tileEra,
      labelFade: this.labelFade,
      clusterLabels: !this.regionLabels.length,
    } as never);
    return this.tileLayer;
  }

  /**
   * Deepest tile zoom to request. A world whose nodes all fit one tile (no clusters, at most tile_quota
   * nodes, as with today's content world) is drawn from tile 0/0/0 at every zoom: the deeper tiles
   * only split the same nodes, and asking for them costs requests (and 404s for empty ones).
   */
  private tileMaxZoom(): number {
    const m = this.manifest;
    if (m.cluster_zoom === 0 && m.tile_quota > 0 && m.nodes > 0 && m.nodes <= m.tile_quota) return 0;
    return m.maxzoom;
  }

  /** The layer instance we pass to deck receives its state (deck transfers state onto the newest instance). */
  private liveTileset(): { tiles: Tile2DHeader<TileRender>[]; bytes: number; labels: number } | null {
    const layer = this.tileLayer;
    const tileset = layer?.state?.tileset as unknown as { tiles: Tile2DHeader<TileRender>[]; _cacheByteSize?: number } | null;
    if (!tileset) return null;
    return { tiles: tileset.tiles, bytes: tileset._cacheByteSize ?? 0, labels: layer?.state.labelData?.length ?? 0 };
  }

  private counts(): TileCounts {
    const ts = this.liveTileset();
    const c: TileCounts = { cached: 0, visible: 0, loading: 0, cacheBytes: 0, nodes: 0, edges: 0, labels: 0, zoomLevel: 0 };
    c.zoomLevel = Math.max(0, Math.min(this.manifest.maxzoom, Math.ceil(this.zoom)));
    if (!ts) return c;
    c.cacheBytes = ts.bytes;
    c.labels = ts.labels;
    for (const t of ts.tiles) {
      c.cached++;
      if (t.isLoading) c.loading++;
      if (t.isVisible && t.content) {
        c.visible++;
        c.nodes += t.content.nodes.length;
        c.edges += t.content.edges.length;
      }
    }
    return c;
  }

  // ------------------------------------------------------------------ view

  private setView(target: [number, number], zoom: number): void {
    const z = Math.max(this.minZoom, Math.min(this.maxZoom, zoom));
    this.target = [Math.max(0, Math.min(S, target[0])), Math.max(0, Math.min(S, target[1]))];
    this.zoom = z;
    this.placeRegions();
    this.deck?.setProps({ viewState: this.viewState() } as never);
    if (this.hover || this.hoverRegion) this.hideTooltip();
  }

  /**
   * Region names: biggest first, each at its region's centre, skipped where it would overlap a name
   * already placed or an overlay. They fade out as you zoom in, while the dots' own names fade in.
   */
  private placeRegions(): void {
    const layer = this.regionLayer;
    if (!layer) return;
    const rz = this.zoom - this.fitZoom;
    const alpha = 1 - clamp01((rz - REGION_FADE[0]) / (REGION_FADE[1] - REGION_FADE[0]));
    const wasHidden = layer.hidden;
    this.regionAlpha = alpha;
    layer.style.opacity = alpha.toFixed(3);
    layer.hidden = alpha <= 0.01;
    // zoomed in, the names stay hidden: nothing to place, every frame of a pan
    if (layer.hidden && wasHidden) return;
    const { w, h } = this.view;
    const k = 2 ** this.zoom;
    const taken = [...this.overlays];
    const placed: Box[] = [];
    for (const r of this.regionLabels) {
      r.box = null;
      if (!layer.hidden) {
        const x = (r.region.x * S - this.target[0]) * k + w / 2;
        const y = (r.region.y * S - this.target[1]) * k + h / 2;
        const box = { x0: x - r.w / 2 - 6, y0: y - r.h / 2 - 3, x1: x + r.w / 2 + 6, y1: y + r.h / 2 + 3 };
        const inside = box.x0 >= 0 && box.y0 >= 0 && box.x1 <= w && box.y1 <= h;
        if (inside && !taken.some((b) => box.x0 < b.x1 && box.x1 > b.x0 && box.y0 < b.y1 && box.y1 > b.y0)) {
          r.box = box;
          taken.push(box);
          placed.push(box);
          r.el.style.transform = `translate(${(x - r.w / 2).toFixed(1)}px, ${(y - r.h / 2).toFixed(1)}px)`;
        }
      }
      r.el.style.visibility = r.box ? '' : 'hidden';
    }
    // While region names show, the dots' names keep clear of them.
    this.labelAvoid.boxes = placed.length ? [...this.overlays, ...placed] : this.overlays;
  }

  /** The region whose name is under this stage point, while the names are clearly visible. */
  private regionAt(x: number, y: number): WorldRegion | null {
    if (this.regionAlpha < 0.5) return null;
    return this.regionLabels.find((r) => r.box && inBox(r.box, x, y, this.coarse ? 8 : 2))?.region ?? null;
  }

  private flyToRegion(region: WorldRegion): void {
    const v = this.view;
    // the region's disc fills 60% of the free area: deep enough that its dots have room for their names
    const fit = Math.log2((Math.min(v.w - v.left - v.right, v.h - v.top - v.bottom) / (2 * Math.max(region.r, 0.002) * S)) * 0.6);
    const zoom = Math.min(this.maxZoom - 1, Math.max(fit, this.fitZoom + REGION_FADE[1] + 0.3));
    this.flyTo(this.centerOn([region.x * S, region.y * S], zoom), zoom, 700);
  }

  private fitHeight(): void {
    if (this.opts.embedded) return;
    const top = Math.max(0, this.root.getBoundingClientRect().top + window.scrollY);
    this.root.style.setProperty('--ctdw-top', `${top}px`);
  }

  private flyTo(target: [number, number], zoom: number, ms = 700): void {
    this.cancelFly();
    if (this.style.reducedMotion || ms <= 0) {
      this.setView(target, zoom);
      return;
    }
    const from = { x: this.target[0], y: this.target[1], z: this.zoom };
    const t0 = performance.now();
    const ease = (p: number) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
    const step = (now: number) => {
      const p = Math.min(1, (now - t0) / ms);
      const e = ease(p);
      // Zoom out a little mid-flight for long hops, like a map.
      const dist = Math.hypot(target[0] - from.x, target[1] - from.y) * 2 ** Math.min(from.z, zoom);
      const lift = Math.min(1.5, Math.log2(1 + dist / 600)) * Math.sin(Math.PI * e);
      this.setView([from.x + (target[0] - from.x) * e, from.y + (target[1] - from.y) * e], from.z + (zoom - from.z) * e - lift);
      if (p < 1) this.fly = requestAnimationFrame(step);
      else this.fly = 0;
    };
    this.fly = requestAnimationFrame(step);
  }

  private cancelFly(): void {
    if (this.fly) cancelAnimationFrame(this.fly);
    this.fly = 0;
  }

  zoomBy(delta: number): void {
    if (this.mode === 'earth') {
      this.earth?.zoomBy(delta);
      return;
    }
    if (!this.deck) return; // not loaded, or failed
    this.flyTo(this.target, this.zoom + delta, 300);
  }

  resetView(): void {
    if (this.mode === 'earth') {
      this.earth?.home();
      return;
    }
    if (!this.deck) return;
    this.computeLimits();
    this.flyTo(this.home, this.fitZoom, 600);
  }

  // ------------------------------------------------------------------ layers

  private render(): void {
    if (!this.deck) return;
    const rings = [this.selected, this.hover]
      .filter((p): p is Picked => !!p && !p.cluster)
      .map((p) => ({ position: [p.x * S, p.y * S] as [number, number], size: p.size, selected: p === this.selected }));
    const accent = tokenRgb('--accent', [180, 24, 94], this.root);
    const ink = this.style.ink;
    type Ring = (typeof rings)[number];
    const a: [number, number, number, number] = [accent[0], accent[1], accent[2], 255];
    // The selected dot is drawn in the accent; hover and selection get a ring.
    const dotLayer = new ScatterplotLayer<Ring>({
      id: 'world-selected',
      data: rings.filter((d) => d.selected),
      getPosition: (d: Ring) => d.position,
      getRadius: (d: Ring) => d.size,
      radiusUnits: 'common',
      radiusScale: this.style.radiusScale,
      radiusMinPixels: this.style.minCorePx + 1,
      radiusMaxPixels: this.style.maxCorePx + 1,
      getFillColor: a,
      pickable: false,
      parameters: NO_DEPTH,
    });
    const ringLayer = new ScatterplotLayer<Ring>({
      id: 'world-rings',
      data: rings,
      getPosition: (d: Ring) => d.position,
      getRadius: (d: Ring) => d.size,
      radiusUnits: 'common',
      radiusScale: this.style.radiusScale * 1.7,
      radiusMinPixels: this.style.minCorePx + 4,
      radiusMaxPixels: this.style.maxCorePx * 1.7 + 4,
      stroked: true,
      filled: false,
      lineWidthUnits: 'pixels',
      getLineWidth: (d: Ring) => (d.selected ? 2 : 1.5),
      getLineColor: (d: Ring) => (d.selected ? a : [ink[0], ink[1], ink[2], 170]),
      pickable: false,
      parameters: NO_DEPTH,
    });
    this.deck.setProps({ layers: [this.getTileLayer(), dotLayer, ringLayer] } as never);
  }

  // ------------------------------------------------------------------ interaction

  private pick(info: PickingInfo): Picked | null {
    const header = (info as PickingInfo & { tile?: Tile2DHeader<TileRender> }).tile;
    const content = header?.content;
    if (!info.picked || !content || info.index < 0 || info.index >= content.tile.n) return null;
    const t = content.tile;
    const i = info.index;
    return { id: t.id[i], cluster: t.cluster, x: t.x[i], y: t.y[i], size: t.size[i], color: t.color[i], label: labelAt(t, i), z: t.index.z };
  }

  private same(a: Picked | null, b: Picked | null): boolean {
    return a === b || (!!a && !!b && a.id === b.id && a.cluster === b.cluster);
  }

  private entityOf(p: Picked): WorldEntity | null {
    if (p.cluster || !this.entities) return null;
    const e = this.entities[p.id];
    return e && e.id ? e : null;
  }

  private titleOf(p: Picked): string {
    if (p.cluster) return p.label || `Cluster ${p.id}`;
    return this.entityOf(p)?.name || p.label || `Node ${p.id}`;
  }

  private handleHover(info: PickingInfo): void {
    // A region name (while shown) wins over the dots under it.
    const region = this.regionAt(info.x, info.y);
    this.hoverRegion = region;
    const p = region ? null : this.pick(info);
    if (!this.same(p, this.hover)) {
      this.hover = p;
      this.render();
    }
    if (!p && !region) {
      this.hideTooltip();
      return;
    }
    const tip = this.tooltip;
    tip.replaceChildren();
    if (region) {
      tip.append(el('strong', '', region.label), el('span', '', `${fmtInt(region.size)} entries · click to zoom in`));
    } else if (p) {
      tip.append(el('strong', '', this.titleOf(p)));
      const cat = this.manifest.palette_labels[p.color];
      const sub = p.cluster ? `Region${cat ? ` · mostly ${cat}` : ''} · click to zoom in` : [cat, this.entityOf(p) ? 'click for options' : null].filter(Boolean).join(' · ');
      if (sub) tip.append(el('span', '', sub));
    }
    tip.hidden = false;
    const { clientWidth: w, clientHeight: h } = this.wrap;
    const tw = tip.offsetWidth;
    const th = tip.offsetHeight;
    const x = info.x + 16 + tw > w ? info.x - tw - 12 : info.x + 16;
    const y = info.y + 16 + th > h ? info.y - th - 12 : info.y + 16;
    tip.style.transform = `translate(${Math.max(4, x)}px, ${Math.max(4, y)}px)`;
  }

  private hideTooltip(): void {
    this.tooltip.hidden = true;
  }

  private handleClick(info: PickingInfo): void {
    const region = this.regionAt(info.x, info.y);
    if (region) {
      this.selectPicked(null);
      this.flyToRegion(region);
      return;
    }
    const p = this.pick(info);
    if (!p) {
      this.selectPicked(null);
      return;
    }
    if (p.cluster) {
      this.flyTo([p.x * S, p.y * S], Math.max(this.zoom + 1.25, this.manifest.cluster_zoom + 0.6), 650);
      return;
    }
    this.selectPicked(p);
  }

  private selectPicked(p: Picked | null): void {
    this.selected = p;
    // on touch, a tap leaves no hover to clear the tooltip
    this.hideTooltip();
    this.render();
    const entity = p ? this.entityOf(p) : null;
    if (this.opts.onPick) {
      this.opts.onPick(entity);
      this.card.hidden = true;
    } else if (!p) this.card.hidden = true;
    else this.showCard(p, entity);
    this.updateAvoid();
  }

  /** Keep labels out from under the overlays (HUD, legend, zoom buttons, era bar, stats, card). */
  private updateAvoid(): void {
    const base = this.stage.getBoundingClientRect();
    const boxes: Box[] = [];
    for (const node of this.wrap.querySelectorAll<HTMLElement>('.ctdw-hud, .ctdw-hint, .ctdw-legend, .ctdw-zoom, .ctdw-era, .ctdw-stats, .ctdw-card, .ctdw-notice')) {
      if (node.hidden || !node.offsetParent) continue;
      const r = node.getBoundingClientRect();
      if (!r.width || !r.height) continue;
      boxes.push({ x0: r.left - base.left - 4, y0: r.top - base.top - 4, x1: r.right - base.left + 4, y1: r.bottom - base.top + 4 });
    }
    this.overlays = boxes;
    this.labelAvoid.boxes = boxes;
    this.placeRegions();
    this.tileLayer?.setNeedsUpdate();
  }

  private showCard(p: Picked, entity: WorldEntity | null): void {
    const kind = this.manifest.palette_labels[p.color] ?? '';
    if (entity) {
      this.openCard(kind, this.titleOf(p), this.entityActions(entity));
      return;
    }
    const actions = el('div', 'ctdw-actions');
    const zoomHere = el('button', 'ctdw-btn', 'Zoom in here');
    zoomHere.type = 'button';
    zoomHere.addEventListener('click', () => this.flyTo([p.x * S, p.y * S], Math.min(this.maxZoom, Math.max(this.zoom + 1.5, p.z + 1)), 600));
    actions.append(zoomHere);
    this.openCard(kind, this.titleOf(p), actions, el('p', 'ctdw-meta', `x ${p.x.toFixed(4)} · y ${p.y.toFixed(4)} · appears at zoom ${p.z}`));
  }

  /** "Open page ›" and "Explore": an entry's card, on Links and on the Earth. */
  private entityActions(entity: WorldEntity): HTMLElement {
    const actions = el('div', 'ctdw-actions');
    const href = safeHref(entity.url);
    if (href) {
      const open = el('a', 'ctdw-btn is-primary', 'Open page ›');
      open.href = href;
      actions.append(open);
    }
    const explore = el('a', 'ctdw-btn', 'Explore');
    explore.href = `/x/?focus=${encodeURIComponent(entity.id)}`;
    actions.append(explore);
    return actions;
  }

  /**
   * Earth: the entry's card, as on Links (by default the entry the spot is named after), and when
   * other entries share its spot, a short list of their pages.
   */
  private showSpot(spot: EarthSpot | null, entry: EarthEntry | undefined = spot?.entries[0]): void {
    this.hideTooltip();
    if (!spot || !entry) {
      this.card.hidden = true;
      return;
    }
    const others = spot.entries.filter((e) => e !== entry);
    const body: Node[] = [this.entityActions(entry)];
    // an entry drawn at its place says so, so the dot never reads as its exact location
    const where = entry.placeName ? `Also at ${entry.placeName}` : 'Also here';
    if (others.length) {
      const list = el('ul', 'ctdw-list');
      list.setAttribute('aria-label', where);
      for (const e of others) {
        const name = el('a', 'ctdw-list-name', e.name);
        const href = safeHref(e.url);
        if (href) name.href = href;
        const li = el('li');
        li.append(name, el('span', 'ctdw-list-meta', e.when ? `${e.kind} · ${e.when}` : e.kind));
        list.append(li);
      }
      body.push(el('p', 'ctdw-list-head', where), list);
    }
    this.openCard(entry.placeName ? `${entry.kind} · shown at ${entry.placeName}, its place` : entry.kind, entry.name, ...body);
  }

  /** The card: a close button, a kind line and a title, then its body. */
  private openCard(kind: string, title: string, ...body: Node[]): void {
    const card = this.card;
    card.replaceChildren();
    card.setAttribute('aria-label', title);
    const close = el('button', 'ctdw-card-close', '×');
    close.type = 'button';
    close.setAttribute('aria-label', 'Close');
    close.addEventListener('click', () => this.closeCard());
    card.append(close, el('p', 'ctdw-kind', kind), el('h2', '', title), ...body);
    card.hidden = false;
  }

  private closeCard(): void {
    if (this.mode === 'earth') {
      this.earth?.select(null);
      this.card.hidden = true;
    } else this.selectPicked(null);
  }

  private handleKey(e: KeyboardEvent): void {
    const t = e.target as HTMLElement | null;
    if (e.metaKey || e.ctrlKey || e.altKey || (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))) return;
    if (e.key === 's' || e.key === 'S') {
      this.statsOn = !this.statsOn;
      this.statsEl.hidden = !this.statsOn;
      this.renderStats();
      this.updateAvoid();
    } else if (e.key === 'Escape' && !this.card.hidden) {
      this.closeCard();
    }
  }

  // ------------------------------------------------------------------ entities

  /** Find a node by index in the loaded tiles, else in the z=0 tile (content worlds hold every node there). */
  private async locate(index: number): Promise<Picked | null> {
    const scan = (tiles: Iterable<Tile2DHeader<TileRender> | { content: TileRender | null }>) => {
      let best: Picked | null = null;
      for (const h of tiles) {
        const t = h.content?.tile;
        if (!t || t.cluster) continue;
        const i = t.id.indexOf(index);
        if (i < 0) continue;
        if (!best || t.index.z > best.z) best = { id: index, cluster: false, x: t.x[i], y: t.y[i], size: t.size[i], color: t.color[i], label: labelAt(t, i), z: t.index.z };
      }
      return best;
    };
    const live = this.liveTileset();
    const found = live ? scan(live.tiles) : null;
    if (found) return found;
    for (let z = this.manifest.cluster_zoom; z <= Math.min(this.tileMaxZoom(), this.manifest.cluster_zoom + 1); z++) {
      // Without a position index only small worlds can be searched like this (one or four tiles).
      const n = 2 ** z;
      for (let x = 0; x < n; x++) {
        for (let y = 0; y < n; y++) {
          try {
            const render = await this.loadTile({ index: { x, y, z }, id: key({ x, y, z }), bbox: { left: 0, top: 0, right: 0, bottom: 0 } });
            const hit = scan([{ content: render }]);
            if (hit) return hit;
          } catch {
            /* missing tile */
          }
        }
      }
    }
    return null;
  }

  async focusEntity(id: string, select = true): Promise<boolean> {
    await this.ready;
    if (this.mode === 'earth') return this.focusOnEarth(id);
    const index = this.entityIndex.get(id);
    if (index === undefined || !this.deck) return false;
    const p = await this.locate(index);
    if (!p || this.destroyed) return false;
    const zoom = Math.max(this.zoom, Math.min(this.maxZoom - 1, this.fitZoom + 2.2));
    this.flyTo(this.centerOn([p.x * S, p.y * S], zoom), zoom, 800);
    if (select) this.selectPicked(p);
    return true;
  }

  /** Earth: fly to the entry's spot and open its own card. False when it has no place on the Earth. */
  private async focusOnEarth(id: string): Promise<boolean> {
    const earth = await this.loadEarth();
    const spot = earth?.spotOf(id);
    if (!earth || !spot || this.mode !== 'earth') return false;
    this.showSpot(spot, spot.entries.find((e) => e.id === id));
    earth.show(spot);
    return true;
  }

  select(id: string | null): void {
    if (!id) {
      this.selected = null;
      this.render();
      return;
    }
    const index = this.entityIndex.get(id);
    if (index === undefined) return;
    void this.locate(index).then((p) => {
      if (!p || this.destroyed) return;
      this.selected = p;
      this.render();
    });
  }

  // ------------------------------------------------------------------ stats and soak

  private renderStats(): void {
    if (!this.statsOn || !this.manifest || this.destroyed) return;
    const c = this.counts();
    const heap = heapBytes();
    const lines = [
      `fps     ${String(this.fps.fps).padStart(3)}   draws/s ${this.fps.drawsPerSecond}`,
      `zoom    ${this.zoom.toFixed(2)}  tiles z${c.zoomLevel}${this.zoom > this.manifest.maxzoom ? ' (overzoom)' : ''}`,
      `tiles   ${c.visible} visible · ${c.cached} cached · ${c.loading} loading${this.errors ? ` · ${this.errors} errors` : ''}`,
      `cache   ${fmtMB(c.cacheBytes)} / ${fmtMB(this.budget)}`,
      `drawn   ${fmtInt(c.nodes)} nodes · ${fmtInt(c.edges)} edges · ${c.labels} labels`,
      `parse   ${this.parse.avg.toFixed(2)} ms avg · ${this.parse.max.toFixed(2)} max · ${this.parse.count} tiles`,
      `heap    ${fmtMB(heap)}`,
    ];
    this.statsEl.textContent = lines.join('\n');
  }

  private startSoak(seconds: number): void {
    this.wrap.classList.add('is-soak');
    const deep = Math.min(this.maxZoom, this.manifest.maxzoom + 0.4);
    this.soak = runSoak({
      seconds: Math.max(10, seconds),
      fitZoom: this.fitZoom,
      deepZoom: deep,
      center: [S / 2, S / 2],
      span: S * 0.3,
      setView: (target, zoom) => this.setView(target, zoom),
      metrics: () => {
        const c = this.counts();
        return { heap: heapBytes(), tiles: c.cached, tilesVisible: c.visible, cacheMB: c.cacheBytes / MB, nodesDrawn: c.nodes, edgesDrawn: c.edges };
      },
      onDone: () => this.wrap.classList.add('is-soak-done'),
    });
  }

  // ------------------------------------------------------------------ errors and teardown

  private fail(err: unknown): void {
    if (this.destroyed) {
      this.releaseDeck(); // the device never came: nothing left to wait for
      return;
    }
    const msg = String((err as Error)?.message ?? err);
    const webgl = /webgl|context|device/i.test(msg);
    const build = 'build it with "ctd world --synthetic 100000" or "ctd build"';
    console.error(`connect-the-dot world: ${webgl ? 'no WebGL 2' : `${this.opts.src} could not be loaded; ${build}`}`, err);
    this.failure ??= err instanceof Error ? err : new Error(msg);
    if (this.opts.embedded) {
      this.stateEl.remove();
      this.opts.onFail?.();
      return;
    }
    // Readers get plain words; the build commands are for developers (the console, and the dev server).
    this.stateEl.replaceChildren();
    this.stateEl.classList.add('is-error');
    this.stateEl.append(
      el('p', '', webgl ? 'This map needs WebGL 2, which this browser did not provide.' : 'The world map could not be loaded.'),
      el('p', 'ctdw-note', webgl || !import.meta.env.DEV ? 'Every entry also has its own page.' : `To fix this, ${build}.`),
    );
    if (!this.stateEl.isConnected) this.wrap.append(this.stateEl);
  }

  destroy(): void {
    if (this.destroyed) return;
    this.destroyed = true;
    this.soak?.stop();
    this.cancelFly();
    this.earth?.destroy();
    this.earth = null;
    cancelAnimationFrame(this.eraFrame);
    this.fps.stop();
    clearInterval(this.statsTimer);
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('keydown', this.onKey);
    document.removeEventListener('ctd:focus', this.onFocusEvent);
    // Release deck.gl now, or once its device exists (onLoad): finalizing earlier would strand the device.
    if (this.device || !this.deck || this.failure) this.releaseDeck();
    this.tileLayer = null;
    this.wrap.remove();
  }

  /**
   * deck.gl 9 keeps its GPU device, and so its WebGL context, alive after finalize(): devices are shared,
   * so device.destroy() does nothing. Browsers keep about 16 contexts and then drop the oldest, which
   * after a dozen World map/Links switches in the explorer was the explorer's own graph. So stop the
   * device's canvas observers and lose the context here.
   */
  private releaseDeck(): void {
    const device = this.device;
    this.deck?.finalize();
    this.deck = null;
    this.device = null;
    device?.canvasContext?.destroy();
    device?.gl?.getExtension('WEBGL_lose_context')?.loseContext();
  }
}

/** True when at least two palette colours are visibly different hues (not grays). */
function hasHues(palette: string[]): boolean {
  const hues = new Set<number>();
  for (const hex of palette) {
    const [r, g, b] = cssColorToRgb(hex).map((v) => v / 255);
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    if (max - min < 0.12) continue;
    const h = max === r ? ((g - b) / (max - min)) % 6 : max === g ? (b - r) / (max - min) + 2 : (r - g) / (max - min) + 4;
    hues.add(Math.round((h * 60 + 360) % 360 / 20));
  }
  return hues.size >= 2;
}

function fmtCompact(n: number): string {
  if (n >= 1e6) return `${(n / 1e6).toFixed(n >= 1e7 ? 0 : 2)}M`;
  if (n >= 1e4) return `${Math.round(n / 1e3)}k`;
  return fmtInt(n);
}
