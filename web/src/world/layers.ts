// deck.gl layers for the world viewer: per-tile edges and glowing nodes, one shared label layer.
//
// Coordinates: the unit-square world is drawn WORLD_SIZE (= tileSize = 512) common units wide.
// For non-geospatial views deck.gl picks tile z = ceil(viewport.zoom + zoomOffset) and tile (x, y, z)
// covers [x, x + 1) * tileSize / 2^z, so with these numbers deck's tile (x, y, z) is exactly the
// contract's tile (x, y, z), and each tile is drawn 256-512 px wide.
import { LayerExtension, type Layer, type LayersList } from '@deck.gl/core';
import { TileLayer, type _Tile2DHeader as Tile2DHeader } from '@deck.gl/geo-layers';
import { LineLayer, ScatterplotLayer, TextLayer } from '@deck.gl/layers';
import { anchorOf, baselineOf, CLUSTER_FONT_PX, measureText, NODE_FONT_PX, offsetOf, placeLabels, Spot, type Box, type PlacedLabel } from '../lib/labels';
import { hasLabel, labelAt, type WorldTile } from './tiles';

export const WORLD_SIZE = 512;

type RGBA = [number, number, number, number];

/** Everything the per-tile builders need, resolved once from the manifest and the CSS tokens. */
export interface WorldStyle {
  /** palette index -> node RGBA (4 bytes each); one gray entry serves every index. */
  nodeRgba: Uint8Array;
  /** palette index -> edge RGB (3 bytes each); one gray entry serves every index. */
  edgeRgb: Uint8Array;
  /** Common units per world unit times the size factor (radius = size * radiusScale). */
  radiusScale: number;
  minCorePx: number;
  maxCorePx: number;
  ink: RGBA;
  night: RGBA;
  font: string;
  labelsPerTile: number;
  reducedMotion: boolean;
}

// ---------------------------------------------------------------------------------- tile render data

interface BinaryAttr {
  value: Float32Array | Uint8Array;
  size: number;
  stride?: number;
  offset?: number;
  normalized?: boolean;
  type?: string;
}

/** A label of a tile, with the node (or region tile's cluster) it belongs to. */
export interface TileLabel extends PlacedLabel {
  id: number;
}

/** A parsed tile plus the GPU-ready arrays deck.gl uploads. This is the TileLayer's tile content. */
export interface TileRender {
  tile: WorldTile;
  nodes: { length: number; attributes: Record<string, BinaryAttr> };
  edges: { length: number; attributes: Record<string, BinaryAttr> };
  /** Node fill and edge colours before any era dimming (see applyEra). */
  base: { fill: Uint8Array; ecol: Uint8Array };
  /** TileEra.version the colour arrays were made for (0: none). */
  eraVersion?: number;
  labels: TileLabel[];
  /** CPU bytes (response buffer + derived arrays) plus the GPU bytes uploaded for it. */
  byteLength: number;
  /** performance.now() when first drawn, and the lowest minzoom that fades in (see fadeFromFor). */
  bornAt?: number;
  fadeFrom?: number;
}

export const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

export function buildTileRender(tile: WorldTile, style: WorldStyle): TileRender {
  const { n, m } = tile;
  const S = WORLD_SIZE;
  const pal = Math.max(1, style.nodeRgba.length / 4);

  // Positions are interleaved once (the GPU needs x,y pairs); radii and minzoom are zero-copy views.
  const pos = new Float32Array(2 * n);
  const fill = new Uint8Array(4 * n);
  for (let i = 0; i < n; i++) {
    pos[2 * i] = tile.x[i] * S;
    pos[2 * i + 1] = tile.y[i] * S;
    const c = (tile.color[i] % pal) * 4;
    fill[4 * i] = style.nodeRgba[c];
    fill[4 * i + 1] = style.nodeRgba[c + 1];
    fill[4 * i + 2] = style.nodeRgba[c + 2];
    fill[4 * i + 3] = 255;
  }

  // Edges: endpoints interleaved [x0 y0 x1 y1]; colours premultiplied for MAX blending (see edgeParameters).
  const epos = new Float32Array(4 * m);
  const ecol = new Uint8Array(4 * m);
  const ewid = new Float32Array(m);
  const ec = Math.max(1, style.edgeRgb.length / 3);
  const tiles = 2 ** tile.index.z;
  for (let j = 0; j < m; j++) {
    epos[4 * j] = tile.ex0[j] * S;
    epos[4 * j + 1] = tile.ey0[j] * S;
    epos[4 * j + 2] = tile.ex1[j] * S;
    epos[4 * j + 3] = tile.ey1[j] * S;
    const w = tile.eweight[j] / 255;
    // Long links (in tiles at this zoom) are drawn fainter, so local structure reads first.
    const span = Math.hypot(tile.ex1[j] - tile.ex0[j], tile.ey1[j] - tile.ey0[j]) * tiles;
    const reach = 1 / (1 + 0.9 * span);
    const a = tile.cluster ? (0.2 + 0.45 * w) * (0.45 + 0.55 * reach) : (0.25 + 0.75 * Math.pow(w, 0.8)) * (0.3 + 0.7 * reach);
    const c = (tile.ecolor[j] % ec) * 3;
    ecol[4 * j] = Math.round(style.edgeRgb[c] * a);
    ecol[4 * j + 1] = Math.round(style.edgeRgb[c + 1] * a);
    ecol[4 * j + 2] = Math.round(style.edgeRgb[c + 2] * a);
    ecol[4 * j + 3] = Math.round(255 * a);
    ewid[j] = tile.cluster ? 1 + 2.6 * w : 1 + 0.5 * w;
  }

  const labels = pickLabels(tile, style);
  const derived = pos.byteLength + fill.byteLength + epos.byteLength + ecol.byteLength + ewid.byteLength;
  // GPU copies: everything above plus the zero-copy radius/minzoom columns and deck's picking colours.
  const gpu = derived + 4 * n + n + 4 * n;
  return {
    tile,
    base: { fill, ecol },
    nodes: {
      length: n,
      attributes: {
        getPosition: { value: pos, size: 2 },
        getRadius: { value: tile.size, size: 1 },
        getFillColor: { value: fill, size: 4, normalized: true },
        getMinZoom: { value: tile.minzoom, size: 1, type: 'unorm8', normalized: true },
      },
    },
    edges: {
      length: m,
      attributes: {
        getSourcePosition: { value: epos, size: 2, stride: 16, offset: 0 },
        getTargetPosition: { value: epos, size: 2, stride: 16, offset: 8 },
        getColor: { value: ecol, size: 4, normalized: true },
        getWidth: { value: ewid, size: 1 },
      },
    },
    labels,
    byteLength: tile.byteLength + derived + gpu + labels.length * 96,
  };
}

/** Up to `style.labelsPerTile` non-empty labels of a tile, biggest nodes first, measured for placement. */
function pickLabels(tile: WorldTile, style: WorldStyle): TileLabel[] {
  const idx: number[] = [];
  for (let i = 0; i < tile.n; i++) if (hasLabel(tile, i)) idx.push(i);
  idx.sort((a, b) => tile.size[b] - tile.size[a] || tile.minzoom[a] - tile.minzoom[b] || tile.id[a] - tile.id[b]);
  const px = tile.cluster ? CLUSTER_FONT_PX : NODE_FONT_PX;
  const out: TileLabel[] = [];
  for (const i of idx.slice(0, style.labelsPerTile)) {
    const text = labelAt(tile, i);
    if (!text) continue;
    out.push({
      id: tile.id[i],
      key: (tile.cluster ? 'c' : 'n') + tile.id[i],
      text,
      position: [tile.x[i] * WORLD_SIZE, tile.y[i] * WORLD_SIZE],
      size: tile.size[i],
      cluster: tile.cluster,
      // Regions first, then bigger dots, then the earliest to appear.
      priority: (tile.cluster ? 1e3 : 0) + tile.size[i] * 1e4 - tile.minzoom[i] * 1e-3,
      w: measureText(text, px, style.font) + 2,
      h: px + 3,
      spot: Spot.Hidden,
      r: 0,
    });
  }
  return out;
}

/** Era dimming, by node index: 1 draws a node as usual, less fades it towards the ground. */
export interface TileEra {
  /** Changes with every era, so tiles know when to redo their colours. */
  version: number;
  alpha: Float32Array;
}

/**
 * Applies the era to a tile's colours: a dimmed node blends towards the ground colour (it never
 * vanishes) and a link fades with its fainter end. New arrays go into new data objects, so deck.gl
 * uploads them; no era brings back the plain arrays. Region (cluster) tiles are not dated.
 */
function applyEra(render: TileRender, era: TileEra | null, style: WorldStyle): void {
  const version = era?.version ?? 0;
  if ((render.eraVersion ?? 0) === version) return;
  render.eraVersion = version;
  const t = render.tile;
  let { fill, ecol } = render.base;
  if (era && !t.cluster) {
    fill = fill.slice();
    ecol = ecol.slice();
    const g = style.night;
    // Links store their endpoints inline (docs/world-tiles.md): find each end's node by position.
    const at = new Map<string, number>();
    for (let i = 0; i < t.n; i++) {
      const k = era.alpha[t.id[i]] ?? 1;
      at.set(`${t.x[i]},${t.y[i]}`, k);
      if (k < 1) for (let c = 0; c < 3; c++) fill[4 * i + c] = Math.round(g[c] + (fill[4 * i + c] - g[c]) * k);
    }
    for (let j = 0; j < t.m; j++) {
      const k = Math.min(at.get(`${t.ex0[j]},${t.ey0[j]}`) ?? 1, at.get(`${t.ex1[j]},${t.ey1[j]}`) ?? 1);
      if (k < 1) for (let c = 0; c < 4; c++) ecol[4 * j + c] = Math.round(ecol[4 * j + c] * k);
    }
  }
  render.nodes = { length: t.n, attributes: { ...render.nodes.attributes, getFillColor: { value: fill, size: 4, normalized: true } } };
  render.edges = { length: t.m, attributes: { ...render.edges.attributes, getColor: { value: ecol, size: 4, normalized: true } } };
}

/**
 * The lowest minzoom that should fade in when this tile is first drawn:
 * - loaded children cover it (zooming out): nothing new, no fade (returns Infinity);
 * - a loaded ancestor at zoom a was standing in for it: nodes with minzoom > a are new;
 * - nothing was drawn here before: every node is new.
 */
export function fadeFromFor(header: Tile2DHeader<TileRender>): number {
  if (header.children?.some((c) => c.isLoaded && c.content)) return Infinity;
  for (let p = header.parent; p; p = p.parent) if (p.isLoaded && p.content) return p.index.z + 1;
  return 0;
}

// ---------------------------------------------------------------------------------- shaders

const FADE_MS = 520;

const NODE_UNIFORMS = /* glsl */ `\
layout(std140) uniform ctdNodeUniforms {
  float fade;
  float fadeFrom;
  float core;
  float coreAlpha;
  float halo;
  float pickCore;
} ctdNode;
`;

const nodeModule = {
  name: 'ctdNode',
  vs: NODE_UNIFORMS,
  fs: NODE_UNIFORMS,
  uniformTypes: {
    fade: 'f32',
    fadeFrom: 'f32',
    core: 'f32',
    coreAlpha: 'f32',
    halo: 'f32',
    pickCore: 'f32',
  },
} as const;

const easeOut = (p: number) => 1 - Math.pow(1 - clamp01(p), 3);

export interface NodeStyleProps {
  bornAt?: number;
  fadeFrom?: number;
  /** Core radius as a fraction of the drawn radius. */
  core?: number;
  coreAlpha?: number;
  halo?: number;
}

/**
 * Dots that fade in. Adds a per-node `getMinZoom` attribute (zero-copy from the tile) and, per layer,
 * the time it was first drawn: nodes with minzoom >= fadeFrom fade in (and grow a little) over FADE_MS.
 * The fragment shader draws an antialiased core of `core` (fraction of the drawn radius) with an
 * optional soft fringe (`halo`, used for region discs); picking only uses the core.
 */
export class NodeStyleExtension extends LayerExtension {
  static extensionName = 'CtdNodeStyleExtension';
  static defaultProps = { bornAt: 0, fadeFrom: Infinity, core: 1, coreAlpha: 1, halo: 0 };

  getShaders(this: Layer, _ext: NodeStyleExtension): unknown {
    return {
      modules: [nodeModule],
      inject: {
        'vs:#decl': 'in float instanceMinZoom;\nfloat ctd_f;\n',
        'vs:#main-start': 'ctd_f = (instanceMinZoom * 255.0 + 0.5 >= ctdNode.fadeFrom) ? ctdNode.fade : 1.0;\n',
        'vs:DECKGL_FILTER_SIZE': 'size *= mix(0.55, 1.0, ctd_f);\n',
        'vs:DECKGL_FILTER_COLOR': 'color.a *= ctd_f;\n',
        'fs:DECKGL_FILTER_COLOR': /* glsl */ `
  float ctd_d = length(geometry.uv);
  if (picking.isActive > 0.5) {
    if (ctd_d > ctdNode.pickCore) discard;
  } else {
    float ctd_c = ctdNode.core;
    float ctd_aa = max(fwidth(ctd_d) * 1.2, 0.02);
    float ctd_core = 1.0 - smoothstep(ctd_c - ctd_aa, ctd_c + ctd_aa, ctd_d);
    float ctd_t = clamp((ctd_d - ctd_c) / max(1.0 - ctd_c, 0.001), 0.0, 1.0);
    float ctd_halo = ctdNode.halo * pow(1.0 - ctd_t, 2.4);
    color.a *= max(ctd_core * ctdNode.coreAlpha, ctd_halo);
  }
`,
      },
    };
  }

  initializeState(this: Layer, _context: unknown, _ext: NodeStyleExtension): void {
    this.getAttributeManager()?.addInstanced({
      instanceMinZoom: { size: 1, type: 'unorm8', accessor: 'getMinZoom', defaultValue: 0 },
    });
  }

  draw(this: Layer<NodeStyleProps>, _params: unknown, _ext: NodeStyleExtension): void {
    const { bornAt = 0, fadeFrom = Infinity, core = 1, coreAlpha = 1, halo = 0 } = this.props;
    const p = bornAt > 0 ? (performance.now() - bornAt) / FADE_MS : 1;
    this.setShaderModuleProps({
      ctdNode: { fade: easeOut(p), fadeFrom: Number.isFinite(fadeFrom) ? fadeFrom : 1e6, core, coreAlpha, halo, pickCore: Math.min(1, core * 1.5) },
    });
    if (p < 1) this.setNeedsRedraw();
  }
}

const edgeModule = {
  name: 'ctdEdge',
  vs: 'layout(std140) uniform ctdEdgeUniforms {\n  float fade;\n} ctdEdge;\n',
  uniformTypes: { fade: 'f32' },
} as const;

/** Fades a whole edge layer in (premultiplied: rgb and alpha together), used for tiles drawn over empty space. */
export class EdgeFadeExtension extends LayerExtension {
  static extensionName = 'CtdEdgeFadeExtension';
  static defaultProps = { bornAt: 0, fadeEdges: false };

  getShaders(this: Layer, _ext: EdgeFadeExtension): unknown {
    return { modules: [edgeModule], inject: { 'vs:DECKGL_FILTER_COLOR': 'color *= ctdEdge.fade;\n' } };
  }

  draw(this: Layer<{ bornAt?: number; fadeEdges?: boolean }>, _params: unknown, _ext: EdgeFadeExtension): void {
    const { bornAt = 0, fadeEdges = false } = this.props;
    const p = fadeEdges && bornAt > 0 ? (performance.now() - bornAt) / FADE_MS : 1;
    this.setShaderModuleProps({ ctdEdge: { fade: easeOut(p) } });
    if (p < 1) this.setNeedsRedraw();
  }
}

/** Flat layers: no depth test or writes, so later layers draw over earlier ones. */
export const NO_DEPTH = { depthWriteEnabled: false, depthCompare: 'always' } as const;

/**
 * Edges are stored in the tile of each endpoint (docs/world-tiles.md), and best-available refinement
 * briefly draws a parent and its children together. MAX blending of premultiplied colours makes a
 * re-drawn segment idempotent, so duplicates never double in brightness: dedupe by endpoint pair
 * without any bookkeeping. Overlapping different edges "lighten" instead of piling up into white.
 */
const edgeParameters = {
  blend: true,
  blendColorOperation: 'max',
  blendColorSrcFactor: 'one',
  blendColorDstFactor: 'one',
  blendAlphaOperation: 'max',
  blendAlphaSrcFactor: 'one',
  blendAlphaDstFactor: 'one',
  ...NO_DEPTH,
} as const;

const FONT_SETTINGS = { sdf: true, fontSize: 48, buffer: 8, radius: 12, cutoff: 0.2, smoothing: 0.12 };

const nodeStyle = new NodeStyleExtension();
const edgeFade = new EdgeFadeExtension();

// ---------------------------------------------------------------------------------- tile layer

export interface WorldTileLayerProps {
  style: WorldStyle;
  /** Screen boxes (px, canvas coordinates) labels must keep clear of: HUD, legend, card. Mutated in place. */
  labelAvoid?: { boxes: Box[] };
  /** Bumps when the label set should be rebuilt even if the visible tiles did not change. */
  labelVersion?: number;
  showLabels?: boolean;
  /** Era dimming; a new object (not a mutation) redraws every tile. */
  era?: TileEra | null;
  /** Dot labels fade in between these zooms (the viewer's region names fade out). Mutated in place. */
  labelFade?: { from: number; to: number } | null;
  /** Labels of region tiles; off when the viewer names regions itself. */
  clusterLabels?: boolean;
}

type SubLayerProps = Parameters<NonNullable<TileLayer<TileRender>['props']['renderSubLayers']>>[0];

/**
 * TileLayer that draws all edges first, then all nodes, then one label layer for the visible tiles.
 * (A TextLayer per tile would create one font texture per tile.)
 */
export class WorldTileLayer extends TileLayer<TileRender, WorldTileLayerProps> {
  static layerName = 'WorldTileLayer';
  static defaultProps = {
    style: { type: 'object', value: null, compare: false },
    labelAvoid: { type: 'object', value: null, compare: false },
    labelVersion: 0,
    showLabels: true,
    era: { type: 'object', value: null, compare: false },
    labelFade: { type: 'object', value: null, compare: false },
    clusterLabels: true,
  };

  declare state: TileLayer<TileRender, WorldTileLayerProps>['state'] & {
    labelKey?: string;
    labelData?: TileLabel[];
    labelHash?: number;
    labelVersion?: number;
  };

  renderSubLayers(props: SubLayerProps): Layer | null | LayersList {
    const render = props.data as TileRender | null;
    const header = props.tile as Tile2DHeader<TileRender>;
    if (!render || (!render.tile.n && !render.tile.m)) return null;
    const style = this.props.style;
    applyEra(render, this.props.era ?? null, style);
    if (render.bornAt === undefined) {
      const from = style.reducedMotion ? Infinity : fadeFromFor(header);
      render.fadeFrom = from;
      render.bornAt = Number.isFinite(from) ? performance.now() : 0;
    }
    const cluster = render.tile.cluster;
    const layers: Layer[] = [];
    if (render.edges.length) {
      layers.push(
        new LineLayer({
          id: `${props.id}-edges`,
          data: render.edges as never,
          widthUnits: 'pixels',
          widthMinPixels: 1,
          pickable: false,
          parameters: edgeParameters as never,
          extensions: [edgeFade],
          bornAt: render.bornAt,
          fadeEdges: render.fadeFrom === 0,
        } as never),
      );
    }
    if (render.nodes.length) {
      const glow = cluster ? 1.15 : 1; // drawn radius / core radius: clusters get a halo
      layers.push(
        new ScatterplotLayer({
          id: `${props.id}-nodes`,
          data: render.nodes as never,
          radiusUnits: 'common',
          radiusScale: (cluster ? WORLD_SIZE : style.radiusScale) * glow,
          radiusMinPixels: (cluster ? 6 : style.minCorePx) * glow,
          radiusMaxPixels: (cluster ? 520 : style.maxCorePx) * glow,
          stroked: false,
          filled: true,
          antialiasing: false,
          pickable: true,
          parameters: NO_DEPTH as never,
          extensions: [nodeStyle],
          bornAt: render.bornAt,
          fadeFrom: render.fadeFrom,
          core: 1 / glow,
          coreAlpha: cluster ? 0.16 : 1,
          halo: cluster ? 0.1 : 0,
        } as never),
      );
    }
    return layers;
  }

  filterSubLayer(context: Parameters<TileLayer['filterSubLayer']>[0]): boolean {
    // The shared label layer has no tile; everything else is culled per tile as usual.
    if (!(context.layer.props as { tile?: unknown }).tile) return true;
    return super.filterSubLayer(context);
  }

  renderLayers(): Layer | null | LayersList {
    const perTile = super.renderLayers() as unknown as (Layer[] | Layer | null)[];
    const edges: Layer[] = [];
    const nodes: Layer[] = [];
    const flat = (perTile ?? []).flat(2) as (Layer | null)[];
    for (const l of flat) {
      if (!l) continue;
      (l.id.endsWith('-edges') ? edges : nodes).push(l);
    }
    const out: Layer[] = [...edges, ...nodes];
    if (this.props.showLabels !== false) {
      const labels = this.labelLayer();
      if (labels) out.push(labels);
    }
    return out;
  }

  /** Labels of the visible tiles (deepest tile wins, one per node), placed without overlaps. */
  private labelLayer(): Layer | null {
    const tileset = this.state.tileset;
    if (!tileset) return null;
    const visible = (tileset.tiles as Tile2DHeader<TileRender>[]).filter((t) => t.isVisible && t.content && t.content.labels.length);
    const era = this.props.era ?? null;
    // In an era, names of dots inside it are placed first; the others are drawn fainter.
    const eraOf = (d: TileLabel) => (era && !d.cluster ? (era.alpha[d.id] ?? 1) : 1);
    const key = `${this.props.labelVersion}|${era?.version ?? 0}|${visible.map((t) => t.id).join(',')}`;
    if (key !== this.state.labelKey) {
      const seen = new Set<string>();
      const data: TileLabel[] = [];
      for (const t of [...visible].sort((a, b) => b.index.z - a.index.z)) {
        for (const d of t.content!.labels) {
          if (seen.has(d.key) || (d.cluster && this.props.clusterLabels === false)) continue;
          seen.add(d.key);
          data.push(d);
        }
      }
      data.sort((a, b) => eraOf(b) - eraOf(a) || b.priority - a.priority || (a.key < b.key ? -1 : 1));
      this.state.labelKey = key;
      this.state.labelData = data;
      this.state.labelHash = undefined;
    }
    const data = this.state.labelData ?? [];
    if (!data.length) return null;
    const style = this.props.style;
    const viewport = this.context.viewport;
    const fade = this.props.labelFade;
    // deck.gl draws a layer's opacity as opacity^(1/2.2); the power undoes that, so the names fade
    // in step with the region names (plain CSS opacity) fading out.
    const opacity = fade ? Math.pow(clamp01((viewport.zoom - fade.from) / Math.max(1e-6, fade.to - fade.from)), 2.2) : 1;
    // invisible names (zoomed out, where the region names show) are not placed every frame
    if (opacity <= 0.01) return null;
    const scale = style.radiusScale * Math.pow(2, viewport.zoom);
    const hash = placeLabels(data, {
      project: (p) => viewport.project(p) as [number, number],
      width: viewport.width,
      height: viewport.height,
      // Round to 2 px so a slow zoom does not rewrite label attributes every frame.
      radius: (size) => 2 * Math.round(Math.max(style.minCorePx, Math.min(style.maxCorePx, size * scale)) / 2),
      avoid: this.props.labelAvoid?.boxes,
      // the hubs' names win over neighbouring dots: dense regions otherwise leave the biggest dots unnamed
      cover: 6,
    });
    if (hash !== this.state.labelHash) {
      this.state.labelHash = hash;
      this.state.labelVersion = (this.state.labelVersion ?? 0) + 1;
    }
    const v = this.state.labelVersion ?? 0;
    const strong: RGBA = [style.ink[0], style.ink[1], style.ink[2], 235];
    const soft: RGBA = [style.ink[0], style.ink[1], style.ink[2], 205];
    const region: RGBA = [style.ink[0], style.ink[1], style.ink[2], 175];
    // Outlined text is drawn twice (outline and fill, then the fill again on top), so a translucent ink lands at
    // 1 - (1 - a)^2: faint 110 shows as about 0.68 of the ink, 5.7:1 on light paper and 7.7:1 on dark.
    const faint: RGBA = [style.ink[0], style.ink[1], style.ink[2], 110];
    return new TextLayer<TileLabel>({
      ...this.getSubLayerProps({ id: 'labels' }),
      data,
      pickable: false,
      opacity,
      visible: opacity > 0.01,
      getPosition: (d: TileLabel) => d.position,
      getText: (d: TileLabel) => d.text,
      // Hidden labels collapse to size 0 (an alpha of 0 would still draw the SDF outline).
      getSize: (d: TileLabel) => (d.spot === Spot.Hidden ? 0 : d.cluster ? CLUSTER_FONT_PX : NODE_FONT_PX),
      getColor: (d: TileLabel) => (d.cluster ? region : eraOf(d) < 1 ? faint : d.size > 0.002 ? strong : soft),
      getTextAnchor: anchorOf,
      getAlignmentBaseline: baselineOf,
      getPixelOffset: offsetOf,
      sizeUnits: 'pixels',
      fontFamily: style.font,
      fontWeight: 500,
      characterSet: 'auto',
      fontSettings: FONT_SETTINGS,
      outlineWidth: 5,
      outlineColor: [style.night[0], style.night[1], style.night[2], 235],
      parameters: NO_DEPTH,
      updateTriggers: { getSize: v, getTextAnchor: v, getAlignmentBaseline: v, getPixelOffset: v, getColor: era?.version ?? 0 },
    } as never);
  }
}

/** Hook the TileLayer calls when a tile leaves the cache: drop every reference so GC can free it. */
export function releaseTile(header: Tile2DHeader<TileRender>): void {
  const r = header.content;
  if (!r) return;
  r.labels = [];
  r.nodes = { length: 0, attributes: {} };
  r.edges = { length: 0, attributes: {} };
  r.base = { fill: new Uint8Array(0), ecol: new Uint8Array(0) };
  header.content = null;
  (header as { layers?: unknown }).layers = null;
}
