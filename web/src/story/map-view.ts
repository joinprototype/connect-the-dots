// Lazy chunk: MapLibre globe for map shots. It brings MapLibre's stylesheet along (story.css does not carry it).
import { gsap } from 'gsap';
import { Map as MapLibre, Marker, setWorkerUrl, type GeoJSONSource } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?url';
import { tokenRgb } from '../lib/color';
import type { GraphIndex } from '../lib/data';
import type { Shot } from '../lib/types';
import { calmBasemap, loadMapCss, MAP_STYLE, rgb } from '../world/basemap';

export interface MapView {
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
      const el = m.getElement();
      if (reduced) m.remove();
      else gsap.to(el.firstElementChild, { autoAlpha: 0, scale: 0.6, duration: 0.3, onComplete: () => m.remove() });
      markers.delete(id);
    }
    ids.forEach((id, i) => {
      const n = idx.nodes.get(id);
      if (!n?.coords) return;
      let m = markers.get(id);
      if (!m) {
        const el = document.createElement('div');
        el.className = 'story-marker';
        const inner = document.createElement('div');
        inner.className = 'story-marker-inner';
        const dot = document.createElement('span');
        dot.className = 'story-marker-dot';
        const label = document.createElement('span');
        label.className = 'story-marker-label';
        label.textContent = n.name;
        inner.append(dot, label);
        el.append(inner);
        m = new Marker({ element: el, anchor: 'left', offset: [-7, 0] }).setLngLat(n.coords).addTo(map);
        markers.set(id, m);
        if (!reduced) gsap.from(inner, { autoAlpha: 0, y: 8, duration: 0.5, delay: 0.6 + i * 0.15, ease: 'back.out(2)' });
      }
      m.getElement().classList.toggle('is-focus', id === focus);
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
    destroy: () => {
      routeTween?.kill();
      for (const m of markers.values()) m.remove();
      map.remove();
    },
  };
}
