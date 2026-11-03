// The calm OpenFreeMap basemap (ADR-0014) shared by the story maps and the Map's Earth view.
import type { ExpressionSpecification, Map as MapLibre } from 'maplibre-gl';
import mapCss from 'maplibre-gl/dist/maplibre-gl.css?url';
import { cssColorToRgb, mix, tokenRgb, type RGB } from '../lib/color';
import { loadStylesheet } from '../lib/dom';

export const MAP_STYLE = 'https://tiles.openfreemap.org/styles/positron';
/** On every map that draws historical borders (ADR-0020). */
export const BORDER_CREDIT = '<a href="https://github.com/Seshat-Global-History-Databank/cliopatria">Cliopatria</a> (CC BY 4.0), simplified';

let mapCssLoaded: Promise<void> | undefined;

/**
 * MapLibre's stylesheet (83 KB; its canvas, markers and controls need it), once per page, when the first
 * map is made: a link, not a CSS import, so pages without a map never load it. It comes after the
 * page's own CSS, so the rules that restyle MapLibre's are more specific, not later.
 */
export function loadMapCss(): Promise<void> {
  return (mapCssLoaded ??= loadStylesheet(mapCss));
}

export const rgb = (c: RGB) => `rgb(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])})`;

/** The basemap's label layers we keep, with the zoom each starts at (0: the style's own). */
const LABELS: Record<string, number> = { label_country_1: 0, label_country_2: 0, label_country_3: 3, label_city_capital: 4 };
/** A place's English name, the local name where none exists. */
const NAME: ExpressionSpecification = ['coalesce', ['get', 'name:en'], ['get', 'name_en'], ['get', 'name']];

/** Shows or hides what only today's map has: borders, roads and names. Land, sea and rivers stay. */
export function showModern(map: MapLibre, on: boolean): void {
  for (const layer of map.getStyle().layers ?? []) {
    const modern = layer.id in LABELS || (layer.type === 'line' && !/^ctd-|water/.test(layer.id));
    if (modern) map.setLayoutProperty(layer.id, 'visibility', on ? 'visible' : 'none');
  }
}

/**
 * A quiet basemap on the page surface (light or dark): land is the paper, water a faint tint, borders
 * and roads hairlines. Labels are thinned to countries (smaller ones from zoom 3) and capitals (from
 * zoom 4), dimmed, without halos, so our own markers are the only bright text on the map.
 * Colours come from the site tokens as seen from `el`. Call it once the style has loaded.
 */
export function calmBasemap(map: MapLibre, el: Element): void {
  const paper = tokenRgb('--paper', el);
  const places = cssColorToRgb(getComputedStyle(el).getPropertyValue('--layer-places').trim() || '#1d7a78');
  const muted = tokenRgb('--muted', el);
  const rule = tokenRgb('--rule', el);
  for (const layer of map.getStyle().layers ?? []) {
    try {
      if (layer.type === 'background') map.setPaintProperty(layer.id, 'background-color', rgb(paper));
      else if (layer.type === 'fill') {
        const water = /water|ocean|sea/i.test(layer.id);
        map.setPaintProperty(layer.id, 'fill-color', rgb(water ? mix(paper, places, 0.16) : mix(paper, rule, 0.25)));
        if (!water) map.setPaintProperty(layer.id, 'fill-opacity', 0.5);
      } else if (layer.type === 'line') {
        map.setPaintProperty(layer.id, 'line-color', rgb(/boundary/i.test(layer.id) ? mix(paper, muted, 0.45) : mix(paper, rule, 0.6)));
      } else if (layer.type === 'symbol') {
        const minzoom = LABELS[layer.id];
        if (minzoom === undefined) {
          map.setLayoutProperty(layer.id, 'visibility', 'none');
          continue;
        }
        if (minzoom > 0) map.setLayerZoomRange(layer.id, Math.max(layer.minzoom ?? 0, minzoom), layer.maxzoom ?? 24);
        // English names (the site is English only), the local name where none exists
        map.setLayoutProperty(layer.id, 'text-field', NAME);
        map.setPaintProperty(layer.id, 'text-color', rgb(muted));
        map.setPaintProperty(layer.id, 'text-halo-width', 0);
        map.setPaintProperty(layer.id, 'text-halo-blur', 0);
        map.setPaintProperty(layer.id, 'icon-opacity', 0);
      }
    } catch {
      /* a layer without that property: leave it */
    }
  }
}
