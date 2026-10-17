// Writes dev world fixtures exactly per docs/world-tiles.md, so the world viewer can be built and
// tested without the Rust engine (`npm run fixtures:world`):
//   fixtures/world-synth/  synthetic world: ~50k nodes in power-law communities, cross links and a few
//                          mega-hubs; zoom 0-6, cluster tiles (super-nodes, meta-edges) below zoom 2
//   fixtures/world/        content world built from fixtures/data/graph.json, with entities.json
//   fixtures/w/index.html  the /w/ page (mirrors theme/templates/world.html)
// Deterministic: the same seed gives byte-identical tiles. Mirrors the semantics of crates/ctd/src/world.rs
// (greedy per-tile quota for minzoom, links only between visible nodes, stored in both end tiles).
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const root = dirname(fileURLToPath(import.meta.url));
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, '').split('=')));
const N = Number(args.nodes ?? 50_000);
const SEED = Number(args.seed ?? 7);
const MAX_TILE_EDGES = 16_384;
const GOLDEN = 2.399963229728653;

// Neutral, like the site's layers: the viewer never relies on hue for meaning.
const PALETTE = ['#8e8e93', '#8e8e93', '#8e8e93', '#8e8e93', '#8e8e93', '#8e8e93', '#8e8e93'];
const PALETTE_LABELS = ['People', 'Power', 'Money', 'Science & Tech', 'History', 'Ideas & Religion', 'Places'];

// ---------------------------------------------------------------------------------- random (mulberry32)
function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------- tile encoding
const pad4 = (n) => (n + 3) & ~3;
const encoder = new TextEncoder();

/** nodes: [{x, y, id, size, color, minzoom, label}], edges: [{x0, y0, x1, y1, color, weight}] */
function encodeTile(cluster, nodes, edges) {
  const labels = nodes.map((n) => encoder.encode(n.label || ''));
  const labelBytes = labels.reduce((s, b) => s + b.length, 0);
  const n = nodes.length;
  const m = edges.length;
  const size = 20 + 16 * n + 2 * pad4(n) + 16 * m + 2 * pad4(m) + 4 * (n + 1) + pad4(labelBytes);
  const buf = new ArrayBuffer(size);
  const dv = new DataView(buf);
  const u8 = new Uint8Array(buf);
  u8.set([0x43, 0x54, 0x44, 0x54], 0); // CTDT
  dv.setUint16(4, 0, true);
  dv.setUint16(6, cluster ? 1 : 0, true);
  dv.setUint32(8, n, true);
  dv.setUint32(12, m, true);
  dv.setUint32(16, labelBytes, true);
  let off = 20;
  const f32 = (get, list) => {
    for (const it of list) {
      dv.setFloat32(off, get(it), true);
      off += 4;
    }
  };
  const bytes = (get, list) => {
    list.forEach((it, i) => (u8[off + i] = get(it)));
    off += pad4(list.length);
  };
  f32((d) => d.x, nodes);
  f32((d) => d.y, nodes);
  for (const d of nodes) {
    dv.setUint32(off, d.id, true);
    off += 4;
  }
  f32((d) => d.size, nodes);
  bytes((d) => d.color, nodes);
  bytes((d) => d.minzoom, nodes);
  f32((e) => e.x0, edges);
  f32((e) => e.y0, edges);
  f32((e) => e.x1, edges);
  f32((e) => e.y1, edges);
  bytes((e) => e.color, edges);
  bytes((e) => e.weight, edges);
  let lo = 0;
  dv.setUint32(off, 0, true);
  off += 4;
  for (const b of labels) {
    lo += b.length;
    dv.setUint32(off, lo, true);
    off += 4;
  }
  for (const b of labels) {
    u8.set(b, off);
    off += b.length;
  }
  return u8;
}

const tileOf = (x, y, z) => {
  const s = 2 ** z;
  return [Math.min(s - 1, Math.max(0, Math.floor(Math.fround(x) * s))), Math.min(s - 1, Math.max(0, Math.floor(Math.fround(y) * s)))];
};

// ---------------------------------------------------------------------------------- world builder
/**
 * g: { n, edges: [[a, b, w]], color: Uint8Array, labels: string[] | null, comm: Int32Array, nc,
 *      pos: Float64Array(2n) in the unit square, cpos: Float64Array(2nc), crad: Float64Array(nc) }
 */
function writeWorld(dir, g, spec) {
  const t0 = performance.now();
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const { n, edges } = g;
  const degree = new Float64Array(n);
  for (const [a, b, w] of edges) {
    degree[a] += w;
    degree[b] += w;
  }
  const rank = [...Array(n).keys()].sort((a, b) => degree[b] - degree[a] || a - b);
  const rankOf = new Int32Array(n);
  rank.forEach((i, r) => (rankOf[i] = r));
  const { maxzoom, clusterZoom, quota } = spec;

  // minzoom: greedy quota per tile, most important nodes first
  const minzoom = new Uint8Array(n).fill(maxzoom);
  const counts = Array.from({ length: maxzoom + 1 }, () => new Map());
  for (const i of rank) {
    const x = g.pos[2 * i];
    const y = g.pos[2 * i + 1];
    let chosen = maxzoom;
    outer: for (let z = clusterZoom; z <= maxzoom; z++) {
      for (let zz = z; zz < maxzoom; zz++) {
        const [tx, ty] = tileOf(x, y, zz);
        if ((counts[zz].get(tx * 65536 + ty) ?? 0) >= quota) continue outer;
      }
      chosen = z;
      break;
    }
    minzoom[i] = chosen;
    for (let zz = chosen; zz <= maxzoom; zz++) {
      const [tx, ty] = tileOf(x, y, zz);
      const k = tx * 65536 + ty;
      counts[zz].set(k, (counts[zz].get(k) ?? 0) + 1);
    }
  }
  const sizeOf = (i) => 0.0006 * (1 + Math.min(Math.sqrt(degree[i]), 40) * 0.35);
  const labelOf = (i) => (g.labels ? g.labels[i] : `Node ${i}`);
  const labelZoom = (i) => (g.labels || rankOf[i] < 200 ? minzoom[i] : Math.min(maxzoom, minzoom[i] + 2));

  const stats = { tiles: 0, max_tile_nodes: 0, max_tile_edges: 0, max_tile_bytes: 0, max_tile_gzip: 0, bytes: 0 };
  const write = (z, x, y, bytes, nn, ne) => {
    const d = join(dir, String(z), String(x));
    mkdirSync(d, { recursive: true });
    writeFileSync(join(d, `${y}.bin`), bytes);
    stats.tiles++;
    stats.bytes += bytes.length;
    stats.max_tile_bytes = Math.max(stats.max_tile_bytes, bytes.length);
    stats.max_tile_nodes = Math.max(stats.max_tile_nodes, nn);
    stats.max_tile_edges = Math.max(stats.max_tile_edges, ne);
    stats.max_tile_gzip = Math.max(stats.max_tile_gzip, gzipSync(bytes).length);
  };

  // cluster tiles: one super-node per community, summed links between communities
  const meta = new Map();
  for (const [a, b, w] of edges) {
    const ca = g.comm[a];
    const cb = g.comm[b];
    if (ca === cb) continue;
    const k = ca < cb ? ca * 1e6 + cb : cb * 1e6 + ca;
    meta.set(k, (meta.get(k) ?? 0) + w);
  }
  const metaList = [...meta.entries()].map(([k, w]) => [Math.floor(k / 1e6), k % 1e6, w]).sort((p, q) => q[2] - p[2] || p[0] - q[0] || p[1] - q[1]);
  const cmax = metaList.reduce((mx, e) => Math.max(mx, e[2]), 1e-9);
  const csize = new Int32Array(g.nc);
  for (let i = 0; i < n; i++) csize[g.comm[i]]++;
  for (let z = 0; z < clusterZoom; z++) {
    const tiles = new Map();
    const get = (tx, ty) => {
      const k = `${tx}/${ty}`;
      if (!tiles.has(k)) tiles.set(k, { tx, ty, nodes: [], edges: [] });
      return tiles.get(k);
    };
    for (let c = 0; c < g.nc; c++) get(...tileOf(g.cpos[2 * c], g.cpos[2 * c + 1], z)).nodes.push(c);
    for (const e of metaList) {
      const ta = tileOf(g.cpos[2 * e[0]], g.cpos[2 * e[0] + 1], z);
      const tb = tileOf(g.cpos[2 * e[1]], g.cpos[2 * e[1] + 1], z);
      get(...ta).edges.push(e);
      if (ta[0] !== tb[0] || ta[1] !== tb[1]) get(...tb).edges.push(e);
    }
    for (const t of tiles.values()) {
      t.nodes.sort((a, b) => csize[b] - csize[a] || a - b);
      const nodes = t.nodes.map((c, k) => ({
        x: g.cpos[2 * c], y: g.cpos[2 * c + 1], id: c, size: g.crad[c], color: c % PALETTE.length, minzoom: 0,
        label: k < 40 ? `Region ${c}` : '',
      }));
      const es = t.edges.slice(0, MAX_TILE_EDGES).map(([a, b, w]) => ({
        x0: g.cpos[2 * a], y0: g.cpos[2 * a + 1], x1: g.cpos[2 * b], y1: g.cpos[2 * b + 1],
        color: a % PALETTE.length, weight: Math.round(Math.sqrt(w / cmax) * 255),
      }));
      write(z, t.tx, t.ty, encodeTile(true, nodes, es), nodes.length, es.length);
    }
  }

  // node tiles: every node visible at this zoom, plus links whose ends are both visible
  const wmax = edges.reduce((mx, e) => Math.max(mx, e[2]), 1e-9);
  for (let z = clusterZoom; z <= maxzoom; z++) {
    const tiles = new Map();
    const get = (tx, ty) => tiles.get(`${tx}/${ty}`);
    for (const i of rank) {
      if (minzoom[i] > z) continue;
      const [tx, ty] = tileOf(g.pos[2 * i], g.pos[2 * i + 1], z);
      const k = `${tx}/${ty}`;
      if (!tiles.has(k)) tiles.set(k, { tx, ty, nodes: [], edges: [] });
      tiles.get(k).nodes.push(i);
    }
    edges.forEach(([a, b], ei) => {
      if (minzoom[a] > z || minzoom[b] > z) return;
      const ta = tileOf(g.pos[2 * a], g.pos[2 * a + 1], z);
      const tb = tileOf(g.pos[2 * b], g.pos[2 * b + 1], z);
      get(...ta)?.edges.push(ei);
      if (ta[0] !== tb[0] || ta[1] !== tb[1]) get(...tb)?.edges.push(ei);
    });
    for (const t of tiles.values()) {
      const score = (ei) => Math.max(rankOf[edges[ei][0]], rankOf[edges[ei][1]]);
      t.edges.sort((p, q) => score(p) - score(q) || p - q);
      const nodes = t.nodes.map((i) => ({
        x: g.pos[2 * i], y: g.pos[2 * i + 1], id: i, size: sizeOf(i), color: g.color[i], minzoom: minzoom[i],
        label: labelZoom(i) <= z ? labelOf(i) : '',
      }));
      const es = t.edges.slice(0, MAX_TILE_EDGES).map((ei) => {
        const [a, b, w] = edges[ei];
        return { x0: g.pos[2 * a], y0: g.pos[2 * a + 1], x1: g.pos[2 * b], y1: g.pos[2 * b + 1], color: g.color[a], weight: Math.round((w / wmax) * 255) };
      });
      write(z, t.tx, t.ty, encodeTile(false, nodes, es), nodes.length, es.length);
    }
  }

  if (spec.entities) writeFileSync(join(dir, 'entities.json'), JSON.stringify(spec.entities));
  const manifest = {
    version: 0,
    kind: spec.kind,
    nodes: n,
    edges: edges.length,
    clusters: g.nc,
    maxzoom,
    cluster_zoom: clusterZoom,
    tile_quota: quota,
    palette: spec.palette,
    palette_labels: spec.paletteLabels,
    built: '2026-10-16T00:00:00Z',
    build_ms: Math.round(performance.now() - t0),
    stats,
    entities: spec.entities ? 'entities.json' : null,
    stability: null,
  };
  writeFileSync(join(dir, 'manifest.json'), JSON.stringify(manifest, null, 2) + '\n');
  return manifest;
}

// ---------------------------------------------------------------------------------- layout helpers
/** Lay community discs (radius sqrt(size)) on a spiral, then push overlapping discs apart. */
function layoutCommunities(sizes, random) {
  const c = sizes.length;
  const pos = new Float64Array(2 * c);
  const rad = sizes.map((s) => Math.sqrt(s));
  const mean = rad.reduce((a, b) => a + b, 0) / Math.max(1, c);
  for (let i = 0; i < c; i++) {
    const a = i * GOLDEN;
    const r = mean * 2.1 * Math.sqrt(i + 0.5);
    pos[2 * i] = Math.cos(a) * r + (random() - 0.5) * mean;
    pos[2 * i + 1] = Math.sin(a) * r + (random() - 0.5) * mean;
  }
  for (let it = 0; it < 80; it++) {
    let moved = 0;
    for (let i = 0; i < c; i++) {
      for (let j = i + 1; j < c; j++) {
        const dx = pos[2 * j] - pos[2 * i];
        const dy = pos[2 * j + 1] - pos[2 * i + 1];
        const d = Math.hypot(dx, dy) || 1e-6;
        const need = rad[i] + rad[j] + mean * 0.35;
        if (d >= need) continue;
        const push = (need - d) / 2;
        const ux = dx / d;
        const uy = dy / d;
        pos[2 * i] -= ux * push;
        pos[2 * i + 1] -= uy * push;
        pos[2 * j] += ux * push;
        pos[2 * j + 1] += uy * push;
        moved++;
      }
    }
    // gentle pull towards the centre keeps the map compact
    for (let i = 0; i < c; i++) {
      pos[2 * i] *= 0.995;
      pos[2 * i + 1] *= 0.995;
    }
    if (!moved) break;
  }
  return { pos, rad };
}

/** Fit points (and radii) into [m, 1 - m]^2, keeping the aspect ratio. */
function normalise(points, radii, margin = 0.03) {
  let minx = Infinity;
  let miny = Infinity;
  let maxx = -Infinity;
  let maxy = -Infinity;
  const r = (i) => (radii ? radii[i] : 0);
  for (let i = 0; i < points.length / 2; i++) {
    minx = Math.min(minx, points[2 * i] - r(i));
    maxx = Math.max(maxx, points[2 * i] + r(i));
    miny = Math.min(miny, points[2 * i + 1] - r(i));
    maxy = Math.max(maxy, points[2 * i + 1] + r(i));
  }
  const scale = (1 - 2 * margin) / Math.max(maxx - minx, maxy - miny, 1e-9);
  const cx = (minx + maxx) / 2;
  const cy = (miny + maxy) / 2;
  return { scale, map: (x, y) => [(x - cx) * scale + 0.5, (y - cy) * scale + 0.5] };
}

// ---------------------------------------------------------------------------------- synthetic world
function synthetic(n, seed) {
  const random = rng(seed);
  const sizes = [];
  let total = 0;
  while (total < n) {
    const s = Math.min(n - total, Math.max(30, Math.min(4000, Math.round(60 * Math.pow(random(), -1 / 1.3)))));
    sizes.push(s);
    total += s;
  }
  const nc = sizes.length;
  const start = new Int32Array(nc + 1);
  for (let c = 0; c < nc; c++) start[c + 1] = start[c] + sizes[c];
  const comm = new Int32Array(n);
  for (let c = 0; c < nc; c++) comm.fill(c, start[c], start[c + 1]);
  const color = new Uint8Array(n);
  for (let i = 0; i < n; i++) color[i] = random() < 0.85 ? comm[i] % PALETTE.length : Math.floor(random() * PALETTE.length);

  const edges = [];
  for (let c = 0; c < nc; c++) {
    for (let j = 1; j < sizes[c]; j++) {
      const links = 1 + (random() < 0.55 ? 1 : 0) + (random() < 0.2 ? 1 : 0);
      for (let k = 0; k < links; k++) {
        const t = Math.floor(j * random() * random()); // preferential: low indices are hubs
        if (t !== j) edges.push([start[c] + j, start[c] + t, 1]);
      }
    }
  }
  // cross links: mostly to nearby communities in index (spiral) order, some anywhere
  for (let i = 0; i < n; i++) {
    if (random() > 0.05) continue;
    const near = random() < 0.8;
    const cj = near ? Math.min(nc - 1, Math.max(0, comm[i] + Math.round((random() - 0.5) * 8))) : Math.floor(random() * nc);
    if (cj === comm[i]) continue;
    const t = start[cj] + Math.floor(random() * random() * sizes[cj]);
    edges.push([i, t, 1]);
  }
  // mega-hubs: the hub of the three biggest communities links to ~1,200 nodes anywhere
  const biggest = [...sizes.keys()].sort((a, b) => sizes[b] - sizes[a]).slice(0, 3);
  for (const c of biggest) {
    const hub = start[c];
    for (let k = 0; k < 1200; k++) {
      const t = Math.floor(random() * n);
      if (t !== hub) edges.push([hub, t, 0.3]);
    }
  }

  // layout: community discs, members on a phyllotaxis disc with hubs at the centre
  const { pos: cposRaw, rad } = layoutCommunities(sizes, random);
  const deg = new Float64Array(n);
  for (const [a, b, w] of edges) {
    deg[a] += w;
    deg[b] += w;
  }
  const raw = new Float64Array(2 * n);
  for (let c = 0; c < nc; c++) {
    const members = [];
    for (let i = start[c]; i < start[c + 1]; i++) members.push(i);
    members.sort((a, b) => deg[b] - deg[a] || a - b);
    const offset = c * 0.77;
    members.forEach((i, j) => {
      const a = j * GOLDEN + offset;
      const d = rad[c] * Math.sqrt((j + 0.5) / members.length) * 0.94;
      raw[2 * i] = cposRaw[2 * c] + d * Math.cos(a);
      raw[2 * i + 1] = cposRaw[2 * c + 1] + d * Math.sin(a);
    });
  }
  const norm = normalise(cposRaw, rad);
  const pos = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) [pos[2 * i], pos[2 * i + 1]] = norm.map(raw[2 * i], raw[2 * i + 1]);
  const cpos = new Float64Array(2 * nc);
  for (let c = 0; c < nc; c++) [cpos[2 * c], cpos[2 * c + 1]] = norm.map(cposRaw[2 * c], cposRaw[2 * c + 1]);
  const crad = Float64Array.from(rad, (r) => r * norm.scale);
  return { n, edges, color, labels: null, comm, nc, pos, cpos, crad };
}

// ---------------------------------------------------------------------------------- content world
function contentWorld(graph) {
  const nodes = graph.nodes;
  const n = nodes.length;
  const index = new Map(nodes.map((d, i) => [d.id, i]));
  const layerIds = Object.keys(graph.layers);
  const color = Uint8Array.from(nodes, (d) => Math.max(0, layerIds.indexOf(graph.types[d.type]?.layer ?? '')));
  const edges = [];
  for (const e of graph.edges) {
    const a = index.get(e.from);
    const b = index.get(e.to);
    if (a === undefined || b === undefined || a === b) continue;
    edges.push([a, b, e.passive ? 0.3 : e.according_to.length ? 0.6 : 1]);
  }
  // connected components as communities
  const comm = new Int32Array(n).fill(-1);
  const adj = Array.from({ length: n }, () => []);
  for (const [a, b] of edges) {
    adj[a].push(b);
    adj[b].push(a);
  }
  let nc = 0;
  for (let s = 0; s < n; s++) {
    if (comm[s] >= 0) continue;
    const stack = [s];
    comm[s] = nc;
    while (stack.length) {
      const u = stack.pop();
      for (const v of adj[u]) if (comm[v] < 0) (comm[v] = nc), stack.push(v);
    }
    nc++;
  }
  // deterministic Fruchterman-Reingold, components start on separate sectors
  const random = rng(11);
  const raw = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) {
    const a = (comm[i] / nc) * Math.PI * 2;
    raw[2 * i] = Math.cos(a) * 3 + random() - 0.5;
    raw[2 * i + 1] = Math.sin(a) * 3 + random() - 0.5;
  }
  const k = 1.2;
  for (let it = 0; it < 600; it++) {
    const disp = new Float64Array(2 * n);
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const dx = raw[2 * i] - raw[2 * j];
        const dy = raw[2 * i + 1] - raw[2 * j + 1];
        const d = Math.max(0.05, Math.hypot(dx, dy));
        const f = (k * k) / d;
        disp[2 * i] += (dx / d) * f;
        disp[2 * i + 1] += (dy / d) * f;
        disp[2 * j] -= (dx / d) * f;
        disp[2 * j + 1] -= (dy / d) * f;
      }
    }
    for (const [a, b, w] of edges) {
      const dx = raw[2 * a] - raw[2 * b];
      const dy = raw[2 * a + 1] - raw[2 * b + 1];
      const d = Math.max(0.05, Math.hypot(dx, dy));
      const f = ((d * d) / k) * w;
      disp[2 * a] -= (dx / d) * f;
      disp[2 * a + 1] -= (dy / d) * f;
      disp[2 * b] += (dx / d) * f;
      disp[2 * b + 1] += (dy / d) * f;
    }
    const temp = 0.4 * (1 - it / 600) + 0.01;
    for (let i = 0; i < n; i++) {
      // gravity keeps components together
      disp[2 * i] -= raw[2 * i] * 0.08;
      disp[2 * i + 1] -= raw[2 * i + 1] * 0.08;
      const d = Math.hypot(disp[2 * i], disp[2 * i + 1]) || 1;
      raw[2 * i] += (disp[2 * i] / d) * Math.min(d, temp);
      raw[2 * i + 1] += (disp[2 * i + 1] / d) * Math.min(d, temp);
    }
  }
  const norm = normalise(raw, null, 0.08);
  const pos = new Float64Array(2 * n);
  for (let i = 0; i < n; i++) [pos[2 * i], pos[2 * i + 1]] = norm.map(raw[2 * i], raw[2 * i + 1]);
  const cpos = new Float64Array(2 * nc);
  const crad = new Float64Array(nc);
  return {
    g: { n, edges, color, labels: nodes.map((d) => d.name), comm, nc, pos, cpos, crad },
    palette: layerIds.map((l) => graph.layers[l].color),
    paletteLabels: layerIds.map((l) => graph.layers[l].label),
    entities: nodes.map((d) => ({ id: d.id, name: d.name, url: d.url })),
  };
}

// ---------------------------------------------------------------------------------- page
function worldPage() {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>World: connect the dot</title>
<meta name="description" content="Fly through the whole map. Zoomed out you see regions; zoom in and every dot appears.">
<link rel="stylesheet" href="/static/site.css">
<link rel="stylesheet" href="/assets/islands.css">
<link rel="stylesheet" href="/assets/world.css">
</head>
<body class="explorer-page world-page">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="connect the dot, home">
    <svg class="brand-mark" viewBox="0 0 30 20" aria-hidden="true"><path d="M4 15 L13 5 L25 12"/><circle cx="4" cy="15" r="2.7"/><circle cx="13" cy="5" r="2.7"/><circle cx="25" cy="12" r="2.7"/></svg>
    <span>connect the dot</span>
  </a>
  <nav class="site-nav" aria-label="Main">
    <a href="/x/">Explore</a>
    <a href="/w/">World</a>
    <a href="/c/">Stories</a>
  </nav>
  <ctd-search class="site-search">
    <form action="/x/" role="search">
      <input type="search" name="focus" placeholder="Search people, places, events" aria-label="Search" autocomplete="off">
    </form>
  </ctd-search>
</header>
<main id="main">
<div id="world-root" data-src="/world/"><noscript><p class="empty">The world map needs JavaScript. Every entry also has its own page.</p></noscript></div>
</main>
<footer class="site-footer">
  <p class="footer-principle">A connection is not evidence of wrongdoing. Every line cites its sources, and every interpretation says whose it is.</p>
  <p class="footer-build">Dev fixture site (web/fixtures), world fixture from fixtures/make-world.mjs.</p>
</footer>
<script type="module" src="/assets/islands.js"></script>
<script type="module" src="/assets/world.js"></script>
</body>
</html>
`;
}

// ---------------------------------------------------------------------------------- main
const t0 = performance.now();
const synth = synthetic(N, SEED);
const ms = writeWorld(join(root, 'world-synth'), synth, {
  kind: 'synthetic', maxzoom: 6, clusterZoom: 2, quota: 600, palette: PALETTE, paletteLabels: PALETTE_LABELS, entities: null,
});
const graph = JSON.parse(readFileSync(join(root, 'data/graph.json'), 'utf8'));
const cw = contentWorld(graph);
const mc = writeWorld(join(root, 'world'), cw.g, {
  kind: 'content', maxzoom: 3, clusterZoom: 0, quota: 1500, palette: cw.palette, paletteLabels: cw.paletteLabels, entities: cw.entities,
});
mkdirSync(join(root, 'w'), { recursive: true });
writeFileSync(join(root, 'w/index.html'), worldPage());
const mb = (b) => (b / 1048576).toFixed(1);
console.log(
  `world-synth: ${ms.nodes} nodes, ${ms.edges} links, ${ms.clusters} communities, ${ms.stats.tiles} tiles, ${mb(ms.stats.bytes)} MB, ` +
    `largest ${ms.stats.max_tile_nodes} nodes / ${ms.stats.max_tile_edges} links / ${(ms.stats.max_tile_gzip / 1024).toFixed(0)} KB gzip`,
);
console.log(`world (content): ${mc.nodes} nodes, ${mc.edges} links, ${mc.stats.tiles} tiles; w/index.html; ${((performance.now() - t0) / 1000).toFixed(1)} s`);
