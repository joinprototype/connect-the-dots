// What the Map draws over its tiles: the picked dot, and the lines from it to what it links to, or a route.
import type { Layer } from '@deck.gl/core';
import { LineLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import type { RGB } from '../lib/color';
import { NO_DEPTH, type WorldStyle } from './layers';

/** How many of the dots at the far ends are named: past that the names only hide each other. */
const SPOKE_NAMES = 10;

export interface Ring {
  position: [number, number];
  size: number;
  selected: boolean;
}

export interface Spoke {
  from: [number, number];
  to: [number, number];
}

export interface Reached {
  at: [number, number];
  name: string;
}

export function overlayLayers(style: WorldStyle, accent: RGB, rings: Ring[], spokes: Spoke[], reached: Reached[], routing: boolean): Layer[] {
  const { ink, night: paper } = style;
  const a: [number, number, number, number] = [accent[0], accent[1], accent[2], 255];
  return [
    new LineLayer<Spoke>({
      id: 'world-spokes',
      data: spokes,
      getSourcePosition: (d) => d.from,
      getTargetPosition: (d) => d.to,
      getColor: [ink[0], ink[1], ink[2], routing ? 255 : 150],
      getWidth: routing ? 3 : 1.2,
      widthUnits: 'pixels',
      pickable: false,
      parameters: NO_DEPTH,
    }),
    new ScatterplotLayer<Reached>({
      id: 'world-reached',
      data: reached,
      getPosition: (d) => d.at,
      getRadius: 4,
      radiusUnits: 'pixels',
      getFillColor: [ink[0], ink[1], ink[2], 255],
      stroked: true,
      getLineColor: [paper[0], paper[1], paper[2], 255],
      lineWidthUnits: 'pixels',
      getLineWidth: 1.5,
      pickable: false,
      parameters: NO_DEPTH,
    }),
    // The selected dot is drawn in the accent; hover and selection get a ring.
    new ScatterplotLayer<Ring>({
      id: 'world-selected',
      data: rings.filter((d) => d.selected),
      getPosition: (d) => d.position,
      getRadius: (d) => d.size,
      radiusUnits: 'common',
      radiusScale: style.radiusScale,
      radiusMinPixels: style.minCorePx + 1,
      radiusMaxPixels: style.maxCorePx + 1,
      getFillColor: a,
      pickable: false,
      parameters: NO_DEPTH,
    }),
    new ScatterplotLayer<Ring>({
      id: 'world-rings',
      data: rings,
      getPosition: (d) => d.position,
      getRadius: (d) => d.size,
      radiusUnits: 'common',
      radiusScale: style.radiusScale * 1.7,
      radiusMinPixels: style.minCorePx + 4,
      radiusMaxPixels: style.maxCorePx * 1.7 + 4,
      stroked: true,
      filled: false,
      lineWidthUnits: 'pixels',
      getLineWidth: (d) => (d.selected ? 2 : 1.5),
      getLineColor: (d) => (d.selected ? a : [ink[0], ink[1], ink[2], 170]),
      pickable: false,
      parameters: NO_DEPTH,
    }),
    new TextLayer<Reached>({
      id: 'world-reached-names',
      data: reached.slice(0, SPOKE_NAMES),
      getPosition: (d) => d.at,
      getText: (d) => d.name,
      getSize: 12,
      sizeUnits: 'pixels',
      getColor: [ink[0], ink[1], ink[2], 255],
      getTextAnchor: 'start',
      getAlignmentBaseline: 'center',
      getPixelOffset: [8, 0],
      fontFamily: style.font,
      fontWeight: 600,
      characterSet: 'auto',
      fontSettings: { sdf: true },
      outlineWidth: 3,
      outlineColor: [paper[0], paper[1], paper[2], 255],
      pickable: false,
      parameters: NO_DEPTH,
    }),
  ];
}
