// Lazy chunk: the Map's Earth view (/w/?view=earth). MapLibre draws the story maps' calm OpenFreeMap
// basemap (ADR-0014) as a globe, with one grey dot per spot where entries are: graph.json `coords`, an
// entry's own or its place's, so an entry and its place share a dot. The era and the selection are
// feature state read by paint expressions: picking an era never rebuilds the data.
import { AttributionControl, Map as MapLibre, setWorkerUrl, type ExpressionSpecification } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { FADED_TEXT_ALPHA, tokenRgb } from '../lib/color';
import { loadGraph } from '../lib/data';
import type { GNode, GraphData } from '../lib/types';
import { calmBasemap, loadMapCss, MAP_STYLE, rgb } from './basemap';
import { ERA_DIM, eraAlpha, type Era } from './era';
import type { WorldEntity } from './tiles';

export interface EarthEntry extends WorldEntity {
  /** The type's label, e.g. "Place". */
  kind: string;
  /** Its dates as text, or null. */
  when: string | null;
  /** Set when the entry is drawn at its place's point ("Pretoria"), not at a location of its own. */
  placeName: string | null;
}

export interface EarthSpot {
  /** Index in the spot list, and the dot's feature id. */
  i: number;
  /** [lon, lat] */
  at: [number, number];
  /** The entry the others are set in (its place), else the best-connected one. */
  name: string;
  /** That entry first, then the others by date, then by name. */
  entries: EarthEntry[];
}

export interface Insets {
  top: number;
  bottom: number;
  left: number;
  right: number;
}

export interface EarthOptions {
  reducedMotion: boolean;
  /** Touch screens: a bigger target around each dot. */
  coarse: boolean;
  /** Pixels the page's overlays take on each side: the globe fits between them. With `card`, an open
   *  card counts too (a spot brought into view must not land under it). */
  insets: (card: boolean) => Insets;
  /** A dot was clicked or tapped; null: the map away from any dot. */
  onPick: (spot: EarthSpot | null) => void;
  /** The basemap style could not load, so nothing can be drawn. */
  onFail: (err: unknown) => void;
}

export interface Earth {
  /** Entries drawn, over all spots. */
  readonly entries: number;
  spotOf(id: string): EarthSpot | undefined;
  setEra(era: Era | null): void;
  /** Mark a spot in the accent (null clears) without moving. */
  select(spot: EarthSpot | null): void;
  /** Select a spot and bring it to the middle, closer in. */
  show(spot: EarthSpot): void;
  zoomBy(delta: number): void;
  /** Back to the whole planet. */
  home(): void;
  destroy(): void;
}

const SOURCE = 'ctd-earth';
const DOTS = 'ctd-earth-dots';
const NAMES = 'ctd-earth-names';
/** How close show() comes: a country, its cities apart. */
const SPOT_ZOOM = 4.5;
/** At home the globe leans at most this far north or south, so the planet reads upright. */
const HOME_MAX_LAT = 35;
const RAD = Math.PI / 180;

/** Padding that leaves at least 60 px of map: on small phones the bars and the card can outgrow it. */
function fitPadding(p: Insets, height: number): Insets {
  const over = p.top + p.bottom - (height - 60);
  return over > 0 ? { ...p, bottom: Math.max(0, p.bottom - over) } : p;
}

const entryOf = (data: GraphData, n: GNode): EarthEntry => ({
  id: n.id,
  name: n.name,
  url: n.url,
  start: n.when ? n.when.start : null,
  end: n.when ? n.when.end : null,
  kind: data.types[n.type]?.label ?? n.type,
  when: n.when?.label ?? null,
  placeName: null,
});

/** One spot per point on Earth (coords to about 100 m), holding every entry drawn there. */
function spotsOf(data: GraphData): EarthSpot[] {
  const groups = new Map<string, GNode[]>();
  for (const n of data.nodes) {
    const c = n.coords;
    if (!c || !Number.isFinite(c[0]) || !Number.isFinite(c[1])) continue;
    const k = `${c[0].toFixed(3)},${c[1].toFixed(3)}`;
    const list = groups.get(k);
    if (list) list.push(n);
    else groups.set(k, [n]);
  }
  const spots: EarthSpot[] = [];
  for (const list of groups.values()) {
    // the entry with coords of its own (the place the others are set in), then the best-connected
    const head = list.reduce((a, b) => (Number(a.place != null) - Number(b.place != null) || b.degree - a.degree) > 0 ? b : a);
    const rest = list
      .filter((n) => n !== head)
      .sort((a, b) => (a.when?.start ?? Infinity) - (b.when?.start ?? Infinity) || a.name.localeCompare(b.name));
    const [lon, lat] = head.coords!;
    const entries = [head, ...rest].map((n) => ({ ...entryOf(data, n), placeName: n !== head && n.place === head.id ? head.name : null }));
    spots.push({ i: spots.length, at: [lon, lat], name: head.name, entries });
  }
  return spots;
}

/** Where the spots are, as one point: their mean direction from the Earth's centre, weighted by entries. */
function middle(spots: EarthSpot[]): [number, number] {
  let x = 0;
  let y = 0;
  let z = 0;
  for (const s of spots) {
    const [lon, lat] = s.at;
    const w = s.entries.length;
    x += w * Math.cos(lat * RAD) * Math.cos(lon * RAD);
    y += w * Math.cos(lat * RAD) * Math.sin(lon * RAD);
    z += w * Math.sin(lat * RAD);
  }
  if (Math.hypot(x, y, z) < 1e-9) return [0, 20];
  const lat = Math.atan2(z, Math.hypot(x, y)) / RAD;
  return [Math.atan2(y, x) / RAD, Math.max(-HOME_MAX_LAT, Math.min(HOME_MAX_LAT, lat))];
}

/** Rejects when graph.json or WebGL is missing; a basemap that fails later goes to opts.onFail. */
export async function createEarth(container: HTMLElement, opts: EarthOptions): Promise<Earth> {
  const [data] = await Promise.all([loadGraph(), loadMapCss()]);
  const spots = spotsOf(data);
  const byId = new Map(spots.flatMap((s) => s.entries.map((e) => [e.id, s] as const)));
  const grey = tokenRgb('--graph-node', [142, 142, 147], container);
  const accent = tokenRgb('--accent', [0, 102, 204], container);
  const paper = tokenRgb('--paper', [255, 255, 255], container);
  const ink = tokenRgb('--night-ink', [29, 29, 31], container);
  const center = middle(spots);

  /** The whole planet, in the middle of the space the overlays leave. */
  const homeView = () => {
    const padding = opts.insets(false);
    const free = Math.max(160, Math.min(container.clientWidth - padding.left - padding.right, container.clientHeight - padding.top - padding.bottom));
    // a globe is 512·2^zoom / π px across; phones leave a wider margin, so edge labels stay whole
    const zoom = Math.log2((free * (container.clientWidth < 500 ? 0.75 : 0.85) * Math.PI) / 512);
    return { center, zoom, padding, bearing: 0, pitch: 0 };
  };

  setWorkerUrl(workerUrl);
  const map = new MapLibre({
    container,
    style: MAP_STYLE,
    center,
    zoom: 1,
    maxZoom: 12,
    dragRotate: false,
    pitchWithRotate: false,
    touchPitch: false,
    attributionControl: false,
    locale: { 'Map.Title': 'Earth' },
    fadeDuration: opts.reducedMotion ? 0 : 300,
    // 3x screens cost 2.25x the GPU memory of 2x for no visible gain.
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
  });
  map.touchZoomRotate.disableRotation();
  map.keyboard.disableRotation();
  // The basemap's credits, top right: the bottom holds the era bar and the notice. It folds on the first drag.
  map.addControl(new AttributionControl({ compact: true }), 'top-right');
  map.jumpTo(homeView());

  let ready = false;
  let era: Era | null = null;
  let selected: EarthSpot | null = null;
  const faded = spots.map(() => false);
  const mark = (s: EarthSpot, state: Record<string, boolean>) => map.setFeatureState({ source: SOURCE, id: s.i }, state);

  /** A spot fades when none of its entries' dates meet the era (undated ones never do). */
  const paintEra = () => {
    if (!ready) return;
    for (const s of spots) {
      const f = era != null && !s.entries.some((e) => eraAlpha(e, era!) === 1);
      if (f === faded[s.i]) continue;
      faded[s.i] = f;
      mark(s, { faded: f });
    }
  };

  const select = (s: EarthSpot | null) => {
    if (s === selected) return;
    if (ready && selected) mark(selected, { selected: false });
    selected = s;
    if (ready && s) mark(s, { selected: true });
  };

  map.on('style.load', () => {
    try {
      map.setProjection({ type: 'globe' });
    } catch {
      /* no globe in this MapLibre: stay flat */
    }
    calmBasemap(map, container);
    map.addSource(SOURCE, {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: spots.map((s) => ({ type: 'Feature', id: s.i, geometry: { type: 'Point', coordinates: s.at }, properties: { name: s.name, n: s.entries.length } })),
      },
    });
    const isSelected: ExpressionSpecification = ['boolean', ['feature-state', 'selected'], false];
    const isFaded: ExpressionSpecification = ['boolean', ['feature-state', 'faded'], false];
    const alpha: ExpressionSpecification = ['case', isSelected, 1, isFaded, ERA_DIM, 1];
    // a faded spot's name steps back less than its dot: it stays readable (4.5:1 or more)
    const nameAlpha: ExpressionSpecification = ['case', isSelected, 1, isFaded, FADED_TEXT_ALPHA, 1];
    map.addLayer({
      id: DOTS,
      type: 'circle',
      source: SOURCE,
      paint: {
        // a little bigger where more entries are: 1 entry 4.75 px, 9 entries 7.25 px
        'circle-radius': ['+', 3.5, ['*', 1.25, ['sqrt', ['get', 'n']]]],
        'circle-color': ['case', isSelected, rgb(accent), rgb(grey)],
        'circle-opacity': alpha,
        'circle-stroke-width': 1.5,
        'circle-stroke-color': rgb(paper),
        'circle-stroke-opacity': alpha,
      },
    });
    map.addLayer({
      id: NAMES,
      type: 'symbol',
      source: SOURCE,
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 12,
        'text-variable-anchor': ['left', 'right', 'top', 'bottom'],
        'text-radial-offset': 0.7,
        'text-max-width': 9,
        // where names collide, the spot with more entries keeps its name
        'symbol-sort-key': ['-', ['get', 'n']],
      },
      paint: {
        'text-color': ['case', isSelected, rgb(accent), rgb(ink)],
        'text-opacity': nameAlpha,
        'text-halo-color': rgb(paper),
        'text-halo-width': 1.25,
      },
    });
    ready = true;
    paintEra();
    if (selected) mark(selected, { selected: true });
  });

  let warned = 0;
  map.on('error', (e) => {
    // Before the style loads, an error is the style itself: nothing can be drawn. Later ones are tiles.
    if (!ready) opts.onFail(e.error);
    else if (warned++ < 3) console.warn('connect-the-dot earth:', e.error?.message ?? e.error);
  });

  /** The spot under a pointer, with some slack for fingers: the nearest dot drawn there. */
  const spotAt = (p: { x: number; y: number }): EarthSpot | null => {
    if (!ready) return null;
    const r = opts.coarse ? 16 : 6;
    let best: EarthSpot | null = null;
    let bestD = Infinity;
    for (const f of map.queryRenderedFeatures([[p.x - r, p.y - r], [p.x + r, p.y + r]], { layers: [DOTS] })) {
      const s = spots[Number(f.id)];
      if (!s) continue;
      const q = map.project(s.at);
      const d = (q.x - p.x) ** 2 + (q.y - p.y) ** 2;
      if (d < bestD) {
        best = s;
        bestD = d;
      }
    }
    return best;
  };
  map.on('click', (e) => {
    const s = spotAt(e.point);
    select(s);
    opts.onPick(s);
    // on phones the card spans the map: bring the tapped spot above it
    if (s) {
      const card = opts.insets(true);
      if (card.bottom > opts.insets(false).bottom) {
        const to = { center: s.at, padding: fitPadding(card, container.clientHeight) };
        if (opts.reducedMotion) map.jumpTo(to);
        else map.easeTo({ ...to, duration: 300 });
      }
    }
  });
  map.on('mousemove', (e) => {
    map.getCanvas().style.cursor = spotAt(e.point) ? 'pointer' : '';
  });

  return {
    entries: byId.size,
    spotOf: (id) => byId.get(id),
    setEra(next) {
      era = next;
      paintEra();
    },
    select,
    show(s) {
      select(s);
      const to = { center: s.at, zoom: Math.max(map.getZoom(), SPOT_ZOOM), padding: fitPadding(opts.insets(true), container.clientHeight) };
      if (opts.reducedMotion) map.jumpTo(to);
      else map.flyTo(to);
    },
    zoomBy(delta) {
      const zoom = map.getZoom() + delta;
      if (opts.reducedMotion) map.jumpTo({ zoom });
      else map.easeTo({ zoom, duration: 300 });
    },
    home() {
      const to = homeView();
      if (opts.reducedMotion) map.jumpTo(to);
      else map.flyTo(to);
    },
    destroy: () => map.remove(),
  };
}
