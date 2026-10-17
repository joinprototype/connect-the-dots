// World tile v0 reader (docs/world-tiles.md). DOM-free and dependency-free, so it also runs in Node.
//
// parseTile() returns typed-array views straight over the response buffer: nothing is copied.
// Layout: 20-byte header, then x, y, id, size, color, minzoom, ex0, ey0, ex1, ey1, ecolor, eweight,
// label_offsets and the UTF-8 labels, each array padded to a multiple of 4 bytes (little-endian).

export const TILE_MAGIC = 'CTDT';
export const TILE_VERSION = 0;
export const FLAG_CLUSTER = 1;
const HEADER_BYTES = 20;

export interface TileIndex {
  x: number;
  y: number;
  z: number;
}

export interface WorldTile {
  index: TileIndex;
  /** Super-nodes and meta-edges (zoomed out) instead of individual nodes. */
  cluster: boolean;
  n: number;
  m: number;
  /** World position in the unit square, y down. */
  x: Float32Array;
  y: Float32Array;
  /** Node index (cluster index on cluster tiles). */
  id: Uint32Array;
  /** Radius in world units at zoom 0. */
  size: Float32Array;
  /** Palette index. */
  color: Uint8Array;
  /** Zoom where the node first appears. */
  minzoom: Uint8Array;
  ex0: Float32Array;
  ey0: Float32Array;
  ex1: Float32Array;
  ey1: Float32Array;
  ecolor: Uint8Array;
  /** 0–255 relative weight. */
  eweight: Uint8Array;
  /** n + 1 byte offsets into `labels`; an empty label is not drawn at this zoom. */
  labelOffsets: Uint32Array;
  labels: Uint8Array;
  /** Size of the response buffer. */
  byteLength: number;
}

export class TileFormatError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TileFormatError';
  }
}

/** Typed arrays use the platform's byte order; the format is little-endian (true on every browser platform today). */
const LITTLE_ENDIAN = new Uint8Array(new Uint16Array([1]).buffer)[0] === 1;

const pad4 = (bytes: number): number => (bytes + 3) & ~3;

/** Bytes a tile with n nodes, m edges and l label bytes needs (labels unpadded). */
export function tileByteLength(n: number, m: number, labelBytes: number): number {
  return HEADER_BYTES + 16 * n + 2 * pad4(n) + 16 * m + 2 * pad4(m) + 4 * (n + 1) + labelBytes;
}

export function emptyTile(index: TileIndex): WorldTile {
  const f = new Float32Array(0);
  const b = new Uint8Array(0);
  return {
    index,
    cluster: false,
    n: 0,
    m: 0,
    x: f,
    y: f,
    id: new Uint32Array(0),
    size: f,
    color: b,
    minzoom: b,
    ex0: f,
    ey0: f,
    ex1: f,
    ey1: f,
    ecolor: b,
    eweight: b,
    labelOffsets: new Uint32Array(1),
    labels: b,
    byteLength: 0,
  };
}

export function parseTile(buffer: ArrayBuffer, index: TileIndex): WorldTile {
  if (buffer.byteLength < HEADER_BYTES) throw new TileFormatError(`tile ${key(index)}: ${buffer.byteLength} bytes is shorter than the header`);
  const dv = new DataView(buffer);
  const magic = String.fromCharCode(dv.getUint8(0), dv.getUint8(1), dv.getUint8(2), dv.getUint8(3));
  if (magic !== TILE_MAGIC) throw new TileFormatError(`tile ${key(index)}: bad magic "${magic}"`);
  const version = dv.getUint16(4, true);
  if (version !== TILE_VERSION) throw new TileFormatError(`tile ${key(index)}: unsupported version ${version}`);
  const flags = dv.getUint16(6, true);
  const n = dv.getUint32(8, true);
  const m = dv.getUint32(12, true);
  const labelBytes = dv.getUint32(16, true);
  const need = tileByteLength(n, m, labelBytes);
  if (need > buffer.byteLength) {
    throw new TileFormatError(`tile ${key(index)}: ${buffer.byteLength} bytes, header says ${need} (n=${n}, m=${m}, labels=${labelBytes})`);
  }

  let off = HEADER_BYTES;
  const f32 = (count: number): Float32Array => {
    const a = LITTLE_ENDIAN ? new Float32Array(buffer, off, count) : swapped(off, count, Float32Array, (o) => dv.getFloat32(o, true));
    off += 4 * count;
    return a;
  };
  const u32 = (count: number): Uint32Array => {
    const a = LITTLE_ENDIAN ? new Uint32Array(buffer, off, count) : swapped(off, count, Uint32Array, (o) => dv.getUint32(o, true));
    off += 4 * count;
    return a;
  };
  const u8 = (count: number): Uint8Array => {
    const a = new Uint8Array(buffer, off, count);
    off += pad4(count);
    return a;
  };

  const tile: WorldTile = {
    index,
    cluster: (flags & FLAG_CLUSTER) !== 0,
    n,
    m,
    x: f32(n),
    y: f32(n),
    id: u32(n),
    size: f32(n),
    color: u8(n),
    minzoom: u8(n),
    ex0: f32(m),
    ey0: f32(m),
    ex1: f32(m),
    ey1: f32(m),
    ecolor: u8(m),
    eweight: u8(m),
    labelOffsets: u32(n + 1),
    labels: new Uint8Array(0),
    byteLength: buffer.byteLength,
  };
  tile.labels = new Uint8Array(buffer, off, labelBytes);
  return tile;
}

function swapped<T extends Float32Array | Uint32Array>(
  off: number,
  count: number,
  Ctor: { new (n: number): T },
  read: (byteOffset: number) => number,
): T {
  const out = new Ctor(count);
  for (let i = 0; i < count; i++) out[i] = read(off + 4 * i);
  return out;
}

const decoder = typeof TextDecoder !== 'undefined' ? new TextDecoder('utf-8', { fatal: false }) : null;

/** The label of node i, or '' when it should not be drawn at this zoom. */
export function labelAt(tile: WorldTile, i: number): string {
  const offs = tile.labelOffsets;
  if (i < 0 || i >= tile.n || !decoder) return '';
  const a = offs[i];
  const b = Math.min(offs[i + 1], tile.labels.length);
  return b > a ? decoder.decode(tile.labels.subarray(a, b)) : '';
}

export function hasLabel(tile: WorldTile, i: number): boolean {
  return tile.labelOffsets[i + 1] > tile.labelOffsets[i];
}

export const key = (t: TileIndex): string => `${t.z}/${t.x}/${t.y}`;

// ---------------------------------------------------------------------------------- manifest

export interface WorldManifest {
  version: number;
  kind: 'synthetic' | 'content' | string;
  nodes: number;
  edges: number;
  clusters: number;
  maxzoom: number;
  cluster_zoom: number;
  tile_quota: number;
  palette: string[];
  palette_labels: string[];
  built?: string;
  build_ms?: number;
  stats?: { tiles?: number; max_tile_nodes?: number; max_tile_edges?: number; max_tile_bytes?: number; max_tile_gzip?: number; bytes?: number };
  /** Content worlds: file name of the node index -> { id, name, url, start?, end? } table. */
  entities?: string | null;
  stability?: { aligned_nodes?: number; mean_drift?: number | null } | null;
  /** [x0, y0, x1, y1] around every node, in world units: the viewer opens on it. Null when absent or invalid. */
  bounds?: [number, number, number, number] | null;
  /** Content worlds: named regions, biggest first (empty when absent). */
  regions?: WorldRegion[];
}

/** A sizable cluster, named after its best-connected entry. */
export interface WorldRegion {
  label: string;
  /** Centre and radius in world units. */
  x: number;
  y: number;
  r: number;
  /** Entries in it. */
  size: number;
}

export interface WorldEntity {
  id: string;
  name: string;
  url: string;
  /** The entry's own dates in decimal years (end exclusive, null = ongoing); start null = undated. */
  start: number | null;
  end: number | null;
}

const finite = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);

export function checkManifest(m: unknown): WorldManifest {
  const o = m as Partial<WorldManifest> | null;
  if (!o || typeof o !== 'object') throw new TileFormatError('manifest.json is not an object');
  if (o.version !== 0) throw new TileFormatError(`manifest version ${String(o.version)} is not supported (expected 0)`);
  if (!Number.isInteger(o.maxzoom) || (o.maxzoom as number) < 0 || (o.maxzoom as number) > 24) throw new TileFormatError('manifest maxzoom is missing or out of range');
  const b = o.bounds;
  const bounds = Array.isArray(b) && b.length === 4 && b.every(finite) && b[0] <= b[2] && b[1] <= b[3] ? b : null;
  const regions = (Array.isArray(o.regions) ? (o.regions as Partial<WorldRegion>[]) : []).filter(
    (r): r is WorldRegion => !!r && typeof r.label === 'string' && r.label !== '' && finite(r.x) && finite(r.y) && finite(r.r) && finite(r.size),
  );
  return {
    ...(o as WorldManifest),
    cluster_zoom: Number.isInteger(o.cluster_zoom) ? (o.cluster_zoom as number) : 0,
    palette: Array.isArray(o.palette) ? o.palette : [],
    palette_labels: Array.isArray(o.palette_labels) ? o.palette_labels : [],
    nodes: o.nodes ?? 0,
    edges: o.edges ?? 0,
    clusters: o.clusters ?? 0,
    tile_quota: o.tile_quota ?? 0,
    bounds,
    regions,
  };
}

/** One row of entities.json; dates are kept only when they are numbers. */
export function toEntity(e: unknown, safeUrl: (url: unknown) => string | null): WorldEntity {
  const o = (e ?? {}) as Partial<Record<keyof WorldEntity, unknown>>;
  const start = finite(o.start) ? o.start : null;
  return { id: String(o.id ?? ''), name: String(o.name ?? ''), url: safeUrl(o.url) ?? '', start, end: start != null && finite(o.end) ? o.end : null };
}
