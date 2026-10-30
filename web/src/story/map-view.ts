// Lazy chunk: MapLibre globe for map shots. It brings MapLibre's stylesheet along (story.css does not carry it).
import { gsap } from 'gsap';
import { LngLatBounds, Map as MapLibre, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { tokenRgb } from '../lib/color';
import type { GraphIndex } from '../lib/data';
import { el } from '../lib/dom';
import type { Shot } from '../lib/types';
import type { Placed } from './morph';
import { calmBasemap, hideBasemapNames, loadMapCss, MAP_STYLE, rgb } from '../world/basemap';

export interface MapView extends Placed {
  apply(shot: Shot, reduced: boolean): void;
  resize(): void;
  destroy(): void;
}

type LonLat = [number, number];

/** Great-circle arc between two points, unwrapped across the antimeridian. */
function arc(a: LonLat, b: LonLat, n = 72): LonLat[] {
  const rad = Math.PI / 180;
  const toV = ([lon, lat]: LonLat) => [Math.cos(lat * rad) * Math.cos(lon * rad), Math.cos(lat * rad) * Math.sin(lon * rad), Math.sin(lat * rad)];
  const va = toV(a);
  const vb = toV(b);
  const dot = Math.max(-1, Math.min(1, va[0] * vb[0] + va[1] * vb[1] + va[2] * vb[2]));
  const omega = Math.acos(dot);
  if (omega < 1e-6) return [a, b];
  const out: LonLat[] = [];
  let prevLon = a[0];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const s1 = Math.sin((1 - t) * omega) / Math.sin(omega);
    const s2 = Math.sin(t * omega) / Math.sin(omega);
    const v = [s1 * va[0] + s2 * vb[0], s1 * va[1] + s2 * vb[1], s1 * va[2] + s2 * vb[2]];
    const lat = Math.atan2(v[2], Math.hypot(v[0], v[1])) / rad;
    let lon = Math.atan2(v[1], v[0]) / rad;
    while (lon - prevLon > 180) lon -= 360;
    while (lon - prevLon < -180) lon += 360;
    prevLon = lon;
    out.push([lon, lat]);
  }
  return out;
}

export async function createMapView(container: HTMLElement, idx: GraphIndex, shots: Shot[]): Promise<MapView> {
  await loadMapCss();
  setWorkerUrl(workerUrl);
  const accent = tokenRgb('--accent', [180, 24, 94], container);
  const first = shots.find((s) => s.camera)?.camera;

  const map = new MapLibre({
    container,
    style: MAP_STYLE,
    center: first?.center ?? [0, 20],
    zoom: first?.zoom ?? 1.4,
    pitch: first?.pitch ?? 0,
    bearing: first?.bearing ?? 0,
    interactive: false,
    attributionControl: { compact: true },
    // 3x screens cost 2.25x the GPU memory of 2x for no visible gain.
    pixelRatio: Math.min(2, window.devicePixelRatio || 1),
  });

  let ready = false;
  let pending: (() => void) | null = null;
  let wantGlobe = first?.globe !== false;
  const markers = new Map<string, Marker>();
  let routeTween: gsap.core.Tween | null = null;
  /** The shot shown now: a camera that settles after the reader moved on leaves the map alone. */
  let current = '';

  map.on('style.load', () => {
    try {
      map.setProjection({ type: wantGlobe ? 'globe' : 'mercator' });
    } catch {
      /* projection unsupported: stay flat */
    }
    calmBasemap(map, container);
    map.addSource('ctd-routes', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
    map.addLayer({
      id: 'ctd-routes-halo',
      type: 'line',
      source: 'ctd-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': rgb(accent), 'line-width': 9, 'line-opacity': 0.18, 'line-blur': 4 },
    });
    map.addLayer({
      id: 'ctd-routes',
      type: 'line',
      source: 'ctd-routes',
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: { 'line-color': rgb(accent), 'line-width': 2.6, 'line-opacity': 0.95 },
    });
    ready = true;
    const run = pending;
    pending = null;
    run?.();
  });

  function setRoutes(lines: LonLat[][], reduced: boolean): void {
    const src = map.getSource('ctd-routes') as GeoJSONSource | undefined;
    if (!src) return;
    routeTween?.kill();
    const draw = (p: number): void => {
      void src.setData({
        type: 'FeatureCollection',
        features: lines.map((coords) => ({
          type: 'Feature',
          properties: {},
          geometry: { type: 'LineString', coordinates: coords.slice(0, Math.max(2, Math.ceil(coords.length * p))) },
        })),
      });
    };
    if (reduced || !lines.length) {
      draw(1);
      return;
    }
    const state = { p: 0 };
    draw(0.02);
    routeTween = gsap.to(state, { p: 1, duration: 2.2, delay: 0.5, ease: 'power2.inOut', onUpdate: () => draw(state.p) });
  }

  function setMarkers(ids: string[], focus: string | undefined, reduced: boolean): void {
    const keep = new Set(ids);
    for (const [id, m] of markers) {
      if (keep.has(id)) continue;
      if (reduced) m.remove();
      else gsap.to(m.getElement().firstElementChild, { autoAlpha: 0, scale: 0.6, duration: 0.3, onComplete: () => m.remove() });
      markers.delete(id);
    }
    ids.forEach((id, i) => {
      const n = idx.nodes.get(id);
      if (!n?.coords) return;
      let m = markers.get(id);
      if (!m) {
        const inner = el('div', 'story-marker-inner');
        inner.append(el('span', 'story-marker-dot'), el('span', 'story-marker-label', n.name));
        const marker = el('div', 'story-marker');
        marker.append(inner);
        m = new Marker({ element: marker, anchor: 'left', offset: [-7, 0] }).setLngLat(n.coords).addTo(map);
        markers.set(id, m);
        if (!reduced) gsap.from(inner, { autoAlpha: 0, y: 8, duration: 0.5, delay: 0.6 + i * 0.15, ease: 'back.out(2)' });
      }
      m.getElement().classList.toggle('is-focus', id === focus);
    });
  }

  /** What sits over the map, in its pixels: the time pills, the quote card, the player's controls. */
  function covers(): { x0: number; y0: number; x1: number; y1: number }[] {
    const host = container.getBoundingClientRect();
    const story = container.closest('ctd-story');
    return [...(story?.querySelectorAll<HTMLElement>('.story-hud, .story-overlay .story-card, .story-controls') ?? [])]
      .filter((e) => e.offsetWidth && e.offsetHeight)
      .map((e) => {
        const r = e.getBoundingClientRect();
        return { x0: r.left - host.left, y0: r.top - host.top, x1: r.right - host.left, y1: r.bottom - host.top };
      })
      .filter((b) => b.x1 > 0 && b.y1 > 0 && b.x0 < host.width && b.y0 < host.height);
  }

  /**
   * Once the camera has settled, moves it as little as it can (up or left) so that no marker, dot or
   * label, sits under the quote card, the time pills or the controls, with every marker still on the map.
   * When no small move does it (on a phone the card spans the width), it zooms out until every marker
   * fits in the room left. Like the story graph, which keeps its names out from under them.
   */
  function clearCovers(reduced: boolean): void {
    const host = container.getBoundingClientRect();
    const W = host.width;
    const H = host.height;
    const pad = 10;
    const boxes = covers();
    const rects = [...markers.values()].map((m) => {
      const r = m.getElement().getBoundingClientRect();
      return { x0: r.left - host.left, y0: r.top - host.top, x1: r.right - host.left, y1: r.bottom - host.top };
    });
    if (!rects.length || !boxes.length) return;
    const hits = (dx: number, dy: number) =>
      rects.some((r) => boxes.some((b) => r.x1 - dx + pad > b.x0 && r.x0 - dx - pad < b.x1 && r.y1 - dy + pad > b.y0 && r.y0 - dy - pad < b.y1));
    const inside = (dx: number, dy: number) => rects.every((r) => r.x0 - dx >= pad && r.x1 - dx <= W - pad && r.y0 - dy >= pad && r.y1 - dy <= H - pad);
    if (!hits(0, 0)) return;
    // how far content must move up, or left, to clear every card it is under
    let up = 0;
    let left = 0;
    for (const r of rects) {
      for (const b of boxes) {
        if (!(r.x1 + pad > b.x0 && r.x0 - pad < b.x1 && r.y1 + pad > b.y0 && r.y0 - pad < b.y1)) continue;
        up = Math.max(up, r.y1 + pad - b.y0);
        left = Math.max(left, r.x1 + pad - b.x0);
      }
    }
    const moves = [
      [0, up],
      [left, 0],
      [left, up],
    ].sort((a, b) => Math.hypot(a[0], a[1]) - Math.hypot(b[0], b[1]));
    const move = moves.find(([dx, dy]) => !hits(dx, dy) && inside(dx, dy));
    if (move) {
      map.panBy([move[0], move[1]], { duration: reduced ? 0 : 600 });
      return;
    }
    const spots = [...markers.values()].map((m) => m.getLngLat());
    const bounds = spots.reduce((bb, p) => bb.extend(p), new LngLatBounds(spots[0], spots[0]));
    // the bands the pills, the card and the controls take, and room for the names right of the dots
    let top = pad;
    let bottom = pad;
    for (const b of boxes) {
      if (b.y1 <= H / 2) top = Math.max(top, b.y1 + pad);
      else bottom = Math.max(bottom, H - b.y0 + pad);
    }
    const label = Math.max(...rects.map((r) => r.x1 - r.x0));
    if (top + bottom + 40 >= H || label + 2 * pad + 40 >= W) return;
    map.fitBounds(bounds, {
      padding: { top: top + pad, bottom: bottom + pad, left: 2 * pad, right: label + pad },
      maxZoom: map.getZoom(),
      duration: reduced ? 0 : 600,
    });
  }

  function apply(shot: Shot, reduced: boolean): void {
    const run = () => {
      const c = shot.camera;
      const globe = c?.globe !== false;
      if (globe !== wantGlobe) {
        wantGlobe = globe;
        try {
          map.setProjection({ type: globe ? 'globe' : 'mercator' });
        } catch {
          /* ignore */
        }
      }
      if (c) {
        const target = { center: c.center, zoom: c.zoom, pitch: c.pitch ?? 0, bearing: c.bearing ?? 0 };
        if (reduced) map.jumpTo(target);
        else map.flyTo({ ...target, duration: (c.duration ?? 3.5) * 1000, curve: 1.5, essential: false });
      }
      // when it has settled (and the quote card has come in), keep the markers clear of what covers the map
      const shotId = shot.shot;
      const settle = () => window.setTimeout(() => current === shotId && clearCovers(reduced), reduced ? 0 : 300);
      if (c && !reduced) map.once('moveend', settle);
      else settle();
      current = shotId;
      const routeIds = (shot.routes ?? []).flat();
      const all = [...new Set([...(shot.places ?? []), ...routeIds, ...(shot.focus && idx.nodes.get(shot.focus)?.coords ? [shot.focus] : [])])];
      // One marker per spot: an entity placed at its birthplace (or headquarters) would otherwise sit on
      // top of that place's marker. The focus wins, then the first listed.
      const spot = (id: string) => idx.nodes.get(id)?.coords?.map((v) => v.toFixed(3)).join(',') ?? id;
      const taken = new Set<string>();
      const ids: string[] = [];
      for (const id of [...all].sort((a, b) => Number(b === shot.focus) - Number(a === shot.focus))) {
        const k = spot(id);
        if (taken.has(k)) continue;
        taken.add(k);
        ids.push(id);
      }
      setMarkers(ids, shot.focus, reduced);
      // our markers name these places: the basemap does not say them again
      hideBasemapNames(
        map,
        ids.map((id) => idx.nodes.get(id)?.name ?? '').filter(Boolean),
      );
      const lines: LonLat[][] = [];
      for (const [a, b] of shot.routes ?? []) {
        const pa = idx.nodes.get(a)?.coords;
        const pb = idx.nodes.get(b)?.coords;
        if (pa && pb) lines.push(arc(pa, pb));
      }
      setRoutes(lines, reduced);
    };
    if (ready) run();
    else pending = run;
  }

  return {
    apply,
    resize: () => map.resize(),
    shown: () => [...markers.keys()],
    where(id) {
      const m = markers.get(id);
      if (!m) return null;
      const p = map.project(m.getLngLat());
      const inside = p.x >= 0 && p.y >= 0 && p.x <= container.clientWidth && p.y <= container.clientHeight;
      return inside ? { x: p.x, y: p.y } : null;
    },
    destroy: () => {
      routeTween?.kill();
      for (const m of markers.values()) m.remove();
      map.remove();
    },
  };
}
