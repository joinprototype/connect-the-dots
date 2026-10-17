//! The open world: clustering, a hierarchical map layout, level of detail and binary tiles
//! (format in docs/world-tiles.md). Deterministic: the same graph always yields the same world.
#![allow(clippy::needless_range_loop)]

use std::{collections::HashMap, fs, io::Write, path::Path, time::Instant};

use anyhow::Result;
use rayon::prelude::*;
use serde::Serialize;
use serde_json::{Value, json};

use crate::kb::Kb;

/// An undirected, weighted graph ready to be mapped.
pub struct WorldGraph {
    pub n: usize,
    pub edges: Vec<(u32, u32, f32)>,
    pub color: Vec<u8>,
    pub labels: Option<Vec<String>>,
    pub label_prefix: &'static str,
    /// Stable node keys (entity ids). With a state file, the new map is aligned to the previous one.
    pub keys: Option<Vec<String>>,
    /// Nodes that may name a region; None: all. A region is never lettered with a person's name.
    pub may_name: Option<Vec<bool>>,
}

pub struct Spec {
    pub kind: &'static str,
    pub palette: Vec<String>,
    pub palette_labels: Vec<String>,
    pub entities: Option<Vec<Value>>,
}

#[derive(Debug, Clone, Default, Serialize)]
pub struct Stats {
    pub nodes: usize,
    pub edges: usize,
    pub clusters: usize,
    pub maxzoom: u8,
    pub cluster_zoom: u8,
    pub tiles: usize,
    pub max_tile_nodes: usize,
    pub max_tile_edges: usize,
    pub max_tile_bytes: usize,
    pub max_tile_gzip: usize,
    pub bytes: usize,
    pub build_ms: u128,
    /// Mean distance (in the unit square) that previously placed nodes moved; None on first build.
    pub drift: Option<f64>,
    pub aligned_nodes: usize,
}

const QUOTA: usize = 1500;
const MAX_TILE_NODES: usize = 2500;
const MAX_TILE_EDGES: usize = 8192;
const GOLDEN: f64 = 2.399_963_229_728_653;

// ---------------------------------------------------------------- random numbers (splitmix64)

pub(crate) struct Rng(pub(crate) u64);

impl Rng {
    fn next(&mut self) -> u64 {
        self.0 = self.0.wrapping_add(0x9E37_79B9_7F4A_7C15);
        let mut z = self.0;
        z = (z ^ (z >> 30)).wrapping_mul(0xBF58_476D_1CE4_E5B9);
        z = (z ^ (z >> 27)).wrapping_mul(0x94D0_49BB_1331_11EB);
        z ^ (z >> 31)
    }

    pub(crate) fn f(&mut self) -> f64 {
        (self.next() >> 11) as f64 / (1u64 << 53) as f64
    }

    fn below(&mut self, n: usize) -> usize {
        (self.next() % n as u64) as usize
    }
}

/// A synthetic world: power-law communities, local cross links on a ring of communities,
/// and a few mega-hubs with 10k+ links (like index funds holding stakes everywhere).
pub fn synthetic(n: usize, seed: u64) -> WorldGraph {
    let mut rng = Rng(seed);
    let mut sizes = Vec::new();
    let mut total = 0usize;
    while total < n {
        let u = rng.f().max(1e-9);
        let s = ((120.0 * u.powf(-1.0 / 1.3)) as usize).clamp(30, 25_000).min(n - total);
        sizes.push(s);
        total += s;
    }
    let c = sizes.len();
    let mut start = Vec::with_capacity(c);
    let mut acc = 0;
    for &s in &sizes {
        start.push(acc);
        acc += s;
    }
    let mut comm_of = vec![0u32; n];
    for (ci, &s) in sizes.iter().enumerate() {
        for j in 0..s {
            comm_of[start[ci] + j] = ci as u32;
        }
    }
    let mut edges = Vec::with_capacity(n * 4);
    for ci in 0..c {
        let (s0, sz) = (start[ci], sizes[ci]);
        for j in 1..sz {
            for _ in 0..3.min(j) {
                let t = (j as f64 * rng.f().powi(2)) as usize;
                if t != j {
                    edges.push(((s0 + j) as u32, (s0 + t) as u32, 1.0));
                }
            }
        }
    }
    if c > 1 {
        // communities sit on a hidden 2D grid; cross links mostly go to grid neighbours
        let side = (c as f64).sqrt().ceil() as i64;
        let offset = |rng: &mut Rng| -> i64 {
            let mag = (rng.f().powi(3) * 4.0) as i64 + 1;
            if rng.f() < 0.5 { mag } else { -mag }
        };
        for i in 0..n {
            if rng.f() < 0.25 {
                let ci = comm_of[i] as i64;
                let (gx, gy) = (ci % side, ci / side);
                let (tx, ty) = (gx + if rng.f() < 0.5 { offset(&mut rng) } else { 0 }, gy + if rng.f() < 0.5 { offset(&mut rng) } else { 0 });
                let cj = (ty.clamp(0, side - 1) * side + tx.clamp(0, side - 1)).min(c as i64 - 1) as usize;
                if cj != ci as usize {
                    let t = start[cj] + (rng.f().powi(2) * sizes[cj] as f64) as usize;
                    edges.push((i as u32, t as u32, 0.5));
                }
            }
        }
    }
    let mut color: Vec<u8> = comm_of.iter().map(|&k| (k % 7) as u8).collect();
    for h in 0..6.min(c) {
        let hub = start[(h * 97) % c];
        color[hub] = 1;
        let deg = 10_000 + rng.below(10_000);
        for _ in 0..deg.min(n.saturating_sub(1)) {
            let t = rng.below(n);
            if t != hub {
                edges.push((hub as u32, t as u32, 0.3));
            }
        }
    }
    WorldGraph { n, edges, color, labels: None, label_prefix: "Node", keys: None, may_name: None }
}

/// The real content graph as a world: colors by entity type, labels = names.
pub fn from_kb(kb: &Kb) -> (WorldGraph, Spec) {
    let palette = kb.schema.layers.values().map(|l| l.color.clone()).collect();
    let palette_labels = kb.schema.layers.values().map(|l| l.label.clone()).collect();
    let color = kb
        .entities
        .iter()
        .map(|e| kb.schema.types.get(&e.kind).and_then(|t| kb.schema.layers.get_index_of(&t.layer)).unwrap_or(0) as u8)
        .collect();
    let mut edges = Vec::new();
    for e in &kb.edges {
        // withdrawn links and links on no layer ("not the same as") never pull entries together
        let unlayered = kb.schema.relations.get(&e.rel).is_none_or(|r| r.layers.is_empty());
        if e.status == "deprecated" || unlayered {
            continue;
        }
        if let (Some(&a), Some(&b)) = (kb.index.get(&e.from), kb.index.get(&e.to)) {
            let w = if e.passive { 0.3 } else if e.according_to.is_empty() && e.status == "published" { 1.0 } else { 0.6 };
            edges.push((a as u32, b as u32, w));
        }
    }
    let labels = kb.entities.iter().map(|e| e.name.clone()).collect();
    // The entry's own dates (decimal years, data-contract.md "Dates"), for the map's era slider.
    let year = |y: f64| (y * 1000.0).round() / 1000.0;
    let entities = kb
        .entities
        .iter()
        .map(|e| {
            let mut v = json!({ "id": e.id, "name": e.name, "url": format!("/e/{}/", e.id) });
            if let Some(w) = &e.when {
                v["start"] = json!(year(w.start));
                v["end"] = json!(w.end.map(year));
            }
            v
        })
        .collect();
    (
        WorldGraph {
            n: kb.entities.len(),
            edges,
            color,
            labels: Some(labels),
            label_prefix: "",
            keys: Some(kb.entities.iter().map(|e| e.id.clone()).collect()),
            // people and families (types with family ties) never name a region: it would read as theirs
            may_name: Some(kb.entities.iter().map(|e| !kb.schema.types.get(&e.kind).is_some_and(|t| t.family)).collect()),
        },
        Spec { kind: "content", palette, palette_labels, entities: Some(entities) },
    )
}

// ---------------------------------------------------------------- graph structure

struct Csr {
    off: Vec<usize>,
    tgt: Vec<u32>,
    wt: Vec<f32>,
}

fn csr(n: usize, edges: &[(u32, u32, f32)]) -> Csr {
    let mut off = vec![0usize; n + 1];
    for &(a, b, _) in edges {
        off[a as usize + 1] += 1;
        off[b as usize + 1] += 1;
    }
    for i in 0..n {
        off[i + 1] += off[i];
    }
    let mut pos = off.clone();
    let mut tgt = vec![0u32; off[n]];
    let mut wt = vec![0f32; off[n]];
    for &(a, b, w) in edges {
        let (a, b) = (a as usize, b as usize);
        tgt[pos[a]] = b as u32;
        wt[pos[a]] = w;
        pos[a] += 1;
        tgt[pos[b]] = a as u32;
        wt[pos[b]] = w;
        pos[b] += 1;
    }
    Csr { off, tgt, wt }
}

/// One Louvain level (local moving), deterministic node order. Returns community per node.
fn louvain(n: usize, g: &Csr, passes: usize) -> Vec<u32> {
    let m2: f64 = g.wt.iter().map(|&w| w as f64).sum();
    let mut comm: Vec<u32> = (0..n as u32).collect();
    if m2 == 0.0 {
        return comm;
    }
    let k: Vec<f64> = (0..n).map(|i| g.wt[g.off[i]..g.off[i + 1]].iter().map(|&w| w as f64).sum()).collect();
    let mut tot = k.clone();
    let mut neigh = vec![0.0f64; n];
    let mut touched: Vec<usize> = Vec::new();
    for _ in 0..passes {
        let mut moves = 0usize;
        for i in 0..n {
            let ki = k[i];
            if ki == 0.0 {
                continue;
            }
            let ci = comm[i] as usize;
            for e in g.off[i]..g.off[i + 1] {
                let j = g.tgt[e] as usize;
                if j == i {
                    continue;
                }
                let cj = comm[j] as usize;
                if neigh[cj] == 0.0 {
                    touched.push(cj);
                }
                neigh[cj] += g.wt[e] as f64;
            }
            tot[ci] -= ki;
            let mut best = ci;
            let mut best_gain = neigh[ci] - tot[ci] * ki / m2;
            for &c in &touched {
                let gain = neigh[c] - tot[c] * ki / m2;
                if gain > best_gain + 1e-12 {
                    best_gain = gain;
                    best = c;
                }
            }
            tot[best] += ki;
            if best != ci {
                comm[i] = best as u32;
                moves += 1;
            }
            for &c in &touched {
                neigh[c] = 0.0;
            }
            neigh[ci] = 0.0;
            touched.clear();
        }
        if moves <= n / 2000 {
            break;
        }
    }
    comm
}

/// Renumbers communities to 0..count in order of first appearance; returns the count.
fn renumber(comm: &mut [u32]) -> usize {
    let mut map: HashMap<u32, u32> = HashMap::new();
    for c in comm.iter_mut() {
        let next = map.len() as u32;
        *c = *map.entry(*c).or_insert(next);
    }
    map.len()
}

/// Sums edge weights between communities (self loops dropped).
fn meta_edges(comm: &[u32], edges: &[(u32, u32, f32)]) -> Vec<(u32, u32, f32)> {
    let mut map: HashMap<(u32, u32), f32> = HashMap::new();
    for &(a, b, w) in edges {
        let (ca, cb) = (comm[a as usize], comm[b as usize]);
        if ca != cb {
            *map.entry((ca.min(cb), ca.max(cb))).or_default() += w;
        }
    }
    let mut v: Vec<(u32, u32, f32)> = map.into_iter().map(|((a, b), w)| (a, b, w)).collect();
    v.sort_by(|x, y| (x.0, x.1).cmp(&(y.0, y.1)));
    v
}

/// Louvain communities (one level, deterministic). They are the units of the world map.
fn cluster(n: usize, edges: &[(u32, u32, f32)]) -> (Vec<u32>, usize) {
    let g = csr(n, edges);
    let mut comm = louvain(n, &g, 10);
    let nc = renumber(&mut comm);
    (comm, nc)
}

// ---------------------------------------------------------------- layout

/// Shortest-path distances from `src` within one component (local indices); stronger links are shorter.
fn bfs(src: usize, adj: &[Vec<(usize, f64)>]) -> Vec<f64> {
    #[derive(PartialEq)]
    struct Item(f64, usize);
    impl Eq for Item {}
    impl Ord for Item {
        fn cmp(&self, o: &Self) -> std::cmp::Ordering {
            o.0.total_cmp(&self.0).then_with(|| o.1.cmp(&self.1))
        }
    }
    impl PartialOrd for Item {
        fn partial_cmp(&self, o: &Self) -> Option<std::cmp::Ordering> {
            Some(self.cmp(o))
        }
    }
    let mut d = vec![f64::INFINITY; adj.len()];
    let mut heap = std::collections::BinaryHeap::new();
    d[src] = 0.0;
    heap.push(Item(0.0, src));
    while let Some(Item(du, u)) = heap.pop() {
        if du > d[u] {
            continue;
        }
        for &(v, len) in &adj[u] {
            let nd = du + len;
            if nd < d[v] {
                d[v] = nd;
                heap.push(Item(nd, v));
            }
        }
    }
    d
}

/// Pivot MDS (Brandes & Pich): a deterministic 2D embedding of one connected component
/// from hop distances to up to 40 max-min pivots.
fn pivot_mds(adj: &[Vec<(usize, f64)>], radius: &[f64]) -> Vec<[f64; 2]> {
    let k = adj.len();
    if k == 1 {
        return vec![[0.0, 0.0]];
    }
    let npiv = 40.min(k);
    let mut cols: Vec<Vec<f64>> = Vec::with_capacity(npiv);
    let mut nearest = vec![f64::INFINITY; k];
    let mut current = (0..k).max_by(|&a, &b| radius[a].total_cmp(&radius[b]).then(b.cmp(&a))).unwrap_or(0);
    for _ in 0..npiv {
        let d = bfs(current, adj);
        for i in 0..k {
            nearest[i] = nearest[i].min(d[i]);
        }
        cols.push(d);
        current = (0..k).max_by(|&a, &b| nearest[a].total_cmp(&nearest[b]).then(b.cmp(&a))).unwrap_or(0);
    }
    // double-centred squared distances, C (k × npiv)
    let sq: Vec<Vec<f64>> = cols.iter().map(|col| col.iter().map(|d| d * d).collect()).collect();
    let col_mean: Vec<f64> = sq.iter().map(|c| c.iter().sum::<f64>() / k as f64).collect();
    let row_mean: Vec<f64> = (0..k).map(|i| sq.iter().map(|c| c[i]).sum::<f64>() / npiv as f64).collect();
    let all_mean = col_mean.iter().sum::<f64>() / npiv as f64;
    let cmat: Vec<Vec<f64>> = (0..npiv)
        .map(|j| (0..k).map(|i| -0.5 * (sq[j][i] - row_mean[i] - col_mean[j] + all_mean)).collect())
        .collect();
    // M = Cᵀ C (npiv × npiv); top two eigenvectors by power iteration with deflation
    let mut m = vec![vec![0.0f64; npiv]; npiv];
    for a in 0..npiv {
        for b in a..npiv {
            let v: f64 = (0..k).map(|i| cmat[a][i] * cmat[b][i]).sum();
            m[a][b] = v;
            m[b][a] = v;
        }
    }
    let mut vecs: Vec<Vec<f64>> = Vec::new();
    for dim in 0..2 {
        let mut v: Vec<f64> = (0..npiv).map(|j| if (j + dim) % 2 == 0 { 1.0 } else { 0.5 + j as f64 * 0.01 }).collect();
        for _ in 0..200 {
            let mut w: Vec<f64> = (0..npiv).map(|a| (0..npiv).map(|b| m[a][b] * v[b]).sum()).collect();
            for prev in &vecs {
                let dot: f64 = w.iter().zip(prev).map(|(x, y)| x * y).sum();
                for (x, y) in w.iter_mut().zip(prev) {
                    *x -= dot * y;
                }
            }
            let norm = w.iter().map(|x| x * x).sum::<f64>().sqrt();
            if norm < 1e-12 {
                break;
            }
            v = w.iter().map(|x| x / norm).collect();
        }
        vecs.push(v);
    }
    (0..k)
        .map(|i| {
            let x: f64 = (0..npiv).map(|j| cmat[j][i] * vecs[0][j]).sum();
            let y: f64 = (0..npiv).map(|j| cmat[j][i] * vecs.get(1).map_or(0.0, |v| v[j])).sum();
            [x, y]
        })
        .collect()
}

/// Lays out communities as discs (radius = sqrt(size)): pivot MDS per connected component,
/// scaled so linked discs sit close, components packed around the largest, overlaps removed.
fn layout_clusters(size: &[usize], meta: &[(u32, u32, f32)]) -> (Vec<[f64; 2]>, Vec<f64>) {
    let c = size.len();
    let radius: Vec<f64> = size.iter().map(|&s| (s as f64).sqrt()).collect();
    if c == 1 {
        return (vec![[0.0, 0.0]], radius);
    }
    let mut adj: Vec<Vec<(usize, f64)>> = vec![Vec::new(); c];
    for &(a, b, w) in meta {
        let len = 1.0 / (1.0 + (w as f64).ln_1p());
        adj[a as usize].push((b as usize, len));
        adj[b as usize].push((a as usize, len));
    }
    // connected components, largest first
    let mut comp_of = vec![usize::MAX; c];
    let mut comps: Vec<Vec<usize>> = Vec::new();
    for s0 in 0..c {
        if comp_of[s0] != usize::MAX {
            continue;
        }
        let id = comps.len();
        let mut list = vec![s0];
        comp_of[s0] = id;
        let mut head = 0;
        while head < list.len() {
            let u = list[head];
            head += 1;
            for &(v, _) in &adj[u] {
                if comp_of[v] == usize::MAX {
                    comp_of[v] = id;
                    list.push(v);
                }
            }
        }
        comps.push(list);
    }
    comps.sort_by(|a, b| {
        let sa: usize = a.iter().map(|&i| size[i]).sum();
        let sb: usize = b.iter().map(|&i| size[i]).sum();
        sb.cmp(&sa).then(a[0].cmp(&b[0]))
    });
    let mut pos = vec![[0.0f64; 2]; c];
    let mut placed: Vec<([f64; 2], f64)> = Vec::new();
    for (ci, list) in comps.iter().enumerate() {
        let mut local_of = HashMap::with_capacity(list.len());
        for (li, &g) in list.iter().enumerate() {
            local_of.insert(g, li);
        }
        let ladj: Vec<Vec<(usize, f64)>> =
            list.iter().map(|&g| adj[g].iter().filter_map(|(v, len)| local_of.get(v).map(|&l| (l, *len))).collect()).collect();
        let lrad: Vec<f64> = list.iter().map(|&g| radius[g]).collect();
        let mut local = pivot_mds(&ladj, &lrad);
        // scale so that linked discs sit about 1.3× their radii apart (median over links)
        let mut ratios: Vec<f64> = Vec::new();
        for (u, nbrs) in ladj.iter().enumerate() {
            for &(v, _) in nbrs {
                if u < v {
                    let (dx, dy) = (local[u][0] - local[v][0], local[u][1] - local[v][1]);
                    let d = (dx * dx + dy * dy).sqrt();
                    if d > 1e-9 {
                        ratios.push(d / (lrad[u] + lrad[v]));
                    }
                }
            }
        }
        ratios.sort_by(|a, b| a.total_cmp(b));
        let scale = if ratios.is_empty() { 1.0 } else { 1.3 / ratios[ratios.len() / 2].max(1e-9) };
        let (mut mx, mut my) = (0.0, 0.0);
        for p in &local {
            mx += p[0];
            my += p[1];
        }
        let (mx, my) = (mx / local.len() as f64, my / local.len() as f64);
        for p in local.iter_mut() {
            *p = [(p[0] - mx) * scale, (p[1] - my) * scale];
        }
        // pull far outliers (weakly linked communities) back to the edge of the main mass
        let mut dists: Vec<f64> = local.iter().map(|p| (p[0] * p[0] + p[1] * p[1]).sqrt()).collect();
        dists.sort_by(|a, b| a.total_cmp(b));
        let limit = dists[dists.len() * 9 / 10] * 1.25 + 1e-9;
        let mut extent = 0.0f64;
        for (li, p) in local.iter_mut().enumerate() {
            let d = (p[0] * p[0] + p[1] * p[1]).sqrt();
            if d > limit {
                *p = [p[0] * limit / d, p[1] * limit / d];
            }
            extent = extent.max((p[0] * p[0] + p[1] * p[1]).sqrt() + lrad[li]);
        }
        // place the component: the largest at the origin, the rest on a spiral around it
        let mut center = [0.0, 0.0];
        if ci > 0 {
            let mut t = 0usize;
            loop {
                let a = t as f64 * GOLDEN;
                let d = placed[0].1 + extent + (t as f64).sqrt() * extent.max(1.0);
                let cand = [d * a.cos(), d * a.sin()];
                if placed.iter().all(|(p, r)| ((cand[0] - p[0]).powi(2) + (cand[1] - p[1]).powi(2)).sqrt() > r + extent) {
                    center = cand;
                    break;
                }
                t += 1;
            }
        }
        placed.push((center, extent));
        for (li, &g) in list.iter().enumerate() {
            pos[g] = [center[0] + local[li][0], center[1] + local[li][1]];
        }
    }
    // overlap removal: discs of radius sqrt(size) plus a margin
    for _ in 0..80 {
        let snapshot = pos.clone();
        let push: Vec<[f64; 2]> = (0..c)
            .into_par_iter()
            .map(|i| {
                let (mut px, mut py) = (0.0, 0.0);
                for j in 0..c {
                    if j == i {
                        continue;
                    }
                    let (ex, ey) = (snapshot[i][0] - snapshot[j][0], snapshot[i][1] - snapshot[j][1]);
                    let need = (radius[i] + radius[j]) * 1.08;
                    if ex.abs() >= need || ey.abs() >= need {
                        continue;
                    }
                    let d = (ex * ex + ey * ey).sqrt();
                    if d < need {
                        let (ux, uy) = if d > 1e-9 { (ex / d, ey / d) } else { (((i * 7919 + j) % 13) as f64 - 6.0, 1.0) };
                        let share = radius[j] / (radius[i] + radius[j]);
                        px += ux * (need - d) * share;
                        py += uy * (need - d) * share;
                    }
                }
                [px, py]
            })
            .collect();
        let mut moved = false;
        for i in 0..c {
            if push[i] != [0.0, 0.0] {
                moved = true;
                pos[i][0] += push[i][0] * 0.6;
                pos[i][1] += push[i][1] * 0.6;
            }
        }
        if !moved {
            break;
        }
    }
    (pos, radius)
}

/// The fitted turn is snapped to this step (radians), so rebuilding unchanged content reproduces the
/// same angle exactly instead of drifting by float noise from build to build.
const ANGLE_STEP: f64 = 1e-4;

/// Turns the new map (before normalisation) to the previous build's orientation: 2D Procrustes over
/// nodes present in both, rotation or mirror only. Scale and shift are left to the normalisation that
/// follows, so the map always fills the unit square; fitting them as well made the world shrink a
/// little with every edit. Returns the number of nodes compared.
fn orient(pos: &mut [[f64; 2]], cpos: &mut [[f64; 2]], keys: &[String], prev: &HashMap<String, [f32; 2]>) -> usize {
    let pairs: Vec<([f64; 2], [f64; 2])> =
        keys.iter().enumerate().filter_map(|(i, k)| prev.get(k).map(|p| (pos[i], [p[0] as f64, p[1] as f64]))).collect();
    if pairs.len() < 3 {
        return pairs.len();
    }
    let n = pairs.len() as f64;
    let ma = pairs.iter().fold([0.0, 0.0], |m, (a, _)| [m[0] + a[0] / n, m[1] + a[1] / n]);
    let mb = pairs.iter().fold([0.0, 0.0], |m, (_, b)| [m[0] + b[0] / n, m[1] + b[1] / n]);
    let (_, mirror, cos, sin) = [false, true]
        .into_iter()
        .map(|mirror| {
            let f = move |a: [f64; 2]| if mirror { [-(a[0] - ma[0]), a[1] - ma[1]] } else { [a[0] - ma[0], a[1] - ma[1]] };
            let (mut sc, mut ss, mut aa) = (0.0, 0.0, 0.0);
            for (a, b) in &pairs {
                let (p, q) = (f(*a), [b[0] - mb[0], b[1] - mb[1]]);
                sc += p[0] * q[0] + p[1] * q[1];
                ss += p[0] * q[1] - p[1] * q[0];
                aa += p[0] * p[0] + p[1] * p[1];
            }
            let theta = (ss.atan2(sc) / ANGLE_STEP).round() * ANGLE_STEP;
            let (c, s) = (theta.cos(), theta.sin());
            let scale = if aa > 0.0 { (sc * c + ss * s) / aa } else { 1.0 };
            let resid: f64 = pairs
                .iter()
                .map(|(a, b)| {
                    let p = f(*a);
                    let q = [scale * (c * p[0] - s * p[1]) + mb[0], scale * (s * p[0] + c * p[1]) + mb[1]];
                    ((q[0] - b[0]).powi(2) + (q[1] - b[1]).powi(2)).sqrt()
                })
                .sum::<f64>()
                / n;
            (resid, mirror, c, s)
        })
        .min_by(|x, y| x.0.total_cmp(&y.0))
        .unwrap();
    for p in pos.iter_mut().chain(cpos.iter_mut()) {
        let x = if mirror { -p[0] } else { p[0] };
        *p = [cos * x - sin * p[1], sin * x + cos * p[1]];
    }
    pairs.len()
}

// ---------------------------------------------------------------- regions

/// A named region of the zoomed-out map: one sizable community, named after its best-connected member.
#[derive(Debug, Clone, PartialEq, Serialize)]
pub struct Region {
    pub label: String,
    /// Centre and radius of the community's disc, in world units.
    pub x: f32,
    pub y: f32,
    pub r: f32,
    /// Nodes in the community.
    pub size: usize,
}

/// Only communities with at least this many nodes get a name, and at most MAX_REGIONS of them.
const MIN_REGION: usize = 3;
const MAX_REGIONS: usize = 24;

/// The biggest communities (ties: the lower community index first), each named after its
/// best-connected member. `members[c]` lists community c's nodes, best-connected first.
fn regions(members: &[Vec<u32>], labels: &[String], may_name: Option<&[bool]>, center: &[[f32; 2]], radius: &[f32]) -> Vec<Region> {
    // named after its best-connected member that may name it; a region of people only goes unnamed
    let name = |c: usize| members[c].iter().find(|&&i| may_name.is_none_or(|m| m[i as usize])).map(|&i| labels[i as usize].clone());
    let mut order: Vec<usize> = (0..members.len()).filter(|&c| members[c].len() >= MIN_REGION && name(c).is_some()).collect();
    order.sort_by_key(|&c| (std::cmp::Reverse(members[c].len()), c));
    order.truncate(MAX_REGIONS);
    order
        .into_iter()
        .map(|c| Region { label: name(c).unwrap_or_default(), x: center[c][0], y: center[c][1], r: radius[c], size: members[c].len() })
        .collect()
}

// ---------------------------------------------------------------- tiles

fn tile_of(x: f32, y: f32, z: u8) -> (u32, u32) {
    let s = (1u32 << z) as f32;
    let tx = ((x * s) as i64).clamp(0, (1i64 << z) - 1) as u32;
    let ty = ((y * s) as i64).clamp(0, (1i64 << z) - 1) as u32;
    (tx, ty)
}

fn pad4(buf: &mut Vec<u8>) {
    while buf.len() % 4 != 0 {
        buf.push(0);
    }
}

struct TileNode<'a> {
    x: f32,
    y: f32,
    id: u32,
    size: f32,
    color: u8,
    minzoom: u8,
    label: &'a str,
}

fn encode(cluster_tile: bool, nodes: &[TileNode], edges: &[([f32; 4], u8, u8)]) -> Vec<u8> {
    let label_bytes: usize = nodes.iter().map(|n| n.label.len()).sum();
    let mut b = Vec::with_capacity(32 + nodes.len() * 22 + edges.len() * 18 + label_bytes);
    b.extend_from_slice(b"CTDT");
    b.extend_from_slice(&0u16.to_le_bytes());
    b.extend_from_slice(&(cluster_tile as u16).to_le_bytes());
    b.extend_from_slice(&(nodes.len() as u32).to_le_bytes());
    b.extend_from_slice(&(edges.len() as u32).to_le_bytes());
    b.extend_from_slice(&(label_bytes as u32).to_le_bytes());
    for n in nodes {
        b.extend_from_slice(&n.x.to_le_bytes());
    }
    for n in nodes {
        b.extend_from_slice(&n.y.to_le_bytes());
    }
    for n in nodes {
        b.extend_from_slice(&n.id.to_le_bytes());
    }
    for n in nodes {
        b.extend_from_slice(&n.size.to_le_bytes());
    }
    b.extend(nodes.iter().map(|n| n.color));
    pad4(&mut b);
    b.extend(nodes.iter().map(|n| n.minzoom));
    pad4(&mut b);
    for k in 0..4 {
        for e in edges {
            b.extend_from_slice(&e.0[k].to_le_bytes());
        }
    }
    b.extend(edges.iter().map(|e| e.1));
    pad4(&mut b);
    b.extend(edges.iter().map(|e| e.2));
    pad4(&mut b);
    let mut off = 0u32;
    b.extend_from_slice(&off.to_le_bytes());
    for n in nodes {
        off += n.label.len() as u32;
        b.extend_from_slice(&off.to_le_bytes());
    }
    for n in nodes {
        b.extend_from_slice(n.label.as_bytes());
    }
    pad4(&mut b);
    b
}

fn gzip_len(bytes: &[u8]) -> usize {
    let mut enc = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
    let _ = enc.write_all(bytes);
    enc.finish().map(|v| v.len()).unwrap_or(0)
}

/// Builds the world: clusters, layout, level of detail, tiles and manifest under `out`.
pub fn build(g: &WorldGraph, spec: &Spec, out: &Path, state: Option<&Path>) -> Result<Stats> {
    let t0 = Instant::now();
    let n = g.n;
    if out.exists() {
        fs::remove_dir_all(out)?;
    }
    fs::create_dir_all(out)?;

    let (comm, nc) = cluster(n, &g.edges);
    let mut csize = vec![0usize; nc];
    for &c in &comm {
        csize[c as usize] += 1;
    }
    // hubs (index funds, mega-connectors) keep their links on screen but do not shape the map
    let mut count = vec![0u32; n];
    for &(a, b, _) in &g.edges {
        count[a as usize] += 1;
        count[b as usize] += 1;
    }
    let hub_limit = 500u32.max((n / 2000) as u32);
    let layout_edges: Vec<(u32, u32, f32)> =
        g.edges.iter().copied().filter(|&(a, b, _)| count[a as usize] <= hub_limit && count[b as usize] <= hub_limit).collect();
    let meta = meta_edges(&comm, &g.edges);
    let (mut cpos, crad) = layout_clusters(&csize, &meta_edges(&comm, &layout_edges));

    // degree (weighted) and importance rank
    let mut degree = vec![0f64; n];
    for &(a, b, w) in &g.edges {
        degree[a as usize] += w as f64;
        degree[b as usize] += w as f64;
    }
    let mut rank: Vec<u32> = (0..n as u32).collect();
    rank.sort_by(|&a, &b| degree[b as usize].total_cmp(&degree[a as usize]).then(a.cmp(&b)));
    let mut rank_of = vec![0u32; n];
    for (r, &i) in rank.iter().enumerate() {
        rank_of[i as usize] = r as u32;
    }

    // members of each community, most important first, on a phyllotaxis disc (hubs at the centre)
    let mut members: Vec<Vec<u32>> = vec![Vec::new(); nc];
    for &i in &rank {
        members[comm[i as usize] as usize].push(i);
    }
    let mut pos = vec![[0f64; 2]; n];
    for (c, list) in members.iter().enumerate() {
        let r = crad[c];
        let offset = c as f64 * 0.77;
        for (j, &i) in list.iter().enumerate() {
            let a = j as f64 * GOLDEN + offset;
            let d = r * ((j as f64 + 0.5) / list.len() as f64).sqrt() * 0.94;
            pos[i as usize] = [cpos[c][0] + d * a.cos(), cpos[c][1] + d * a.sin()];
        }
    }
    // keep the previous build's orientation, then normalise into the unit square
    let prev: Option<HashMap<String, [f32; 2]>> = state.and_then(|p| fs::read_to_string(p).ok()).and_then(|t| serde_json::from_str(&t).ok());
    let mut aligned = 0;
    if let (Some(prev), Some(keys)) = (&prev, &g.keys) {
        aligned = orient(&mut pos, &mut cpos, keys, prev);
    }
    let (mut minx, mut miny, mut maxx, mut maxy) = (f64::MAX, f64::MAX, f64::MIN, f64::MIN);
    for c in 0..nc {
        minx = minx.min(cpos[c][0] - crad[c]);
        maxx = maxx.max(cpos[c][0] + crad[c]);
        miny = miny.min(cpos[c][1] - crad[c]);
        maxy = maxy.max(cpos[c][1] + crad[c]);
    }
    let scale = 0.94 / (maxx - minx).max(maxy - miny).max(1e-9);
    let (cx, cy) = ((minx + maxx) / 2.0, (miny + maxy) / 2.0);
    let norm = |p: [f64; 2]| -> [f32; 2] { [((p[0] - cx) * scale + 0.5) as f32, ((p[1] - cy) * scale + 0.5) as f32] };
    let npos: Vec<[f32; 2]> = pos.iter().map(|&p| norm(p)).collect();
    let cnorm: Vec<[f32; 2]> = cpos.iter().map(|&p| norm(p)).collect();
    let crad_n: Vec<f32> = crad.iter().map(|&r| (r * scale) as f32).collect();
    // drift: how far the nodes placed last time moved, in the square
    let drift = match (&prev, &g.keys) {
        (Some(prev), Some(keys)) if aligned >= 3 => {
            let moved: Vec<f64> = keys
                .iter()
                .zip(&npos)
                .filter_map(|(k, p)| prev.get(k).map(|q| (((p[0] - q[0]) as f64).powi(2) + ((p[1] - q[1]) as f64).powi(2)).sqrt()))
                .collect();
            Some(moved.iter().sum::<f64>() / moved.len() as f64)
        }
        _ => None,
    };
    if let (Some(path), Some(keys)) = (state, &g.keys) {
        let snapshot: HashMap<&str, [f32; 2]> = keys.iter().map(String::as_str).zip(npos.iter().copied()).collect();
        if let Some(dir) = path.parent() {
            fs::create_dir_all(dir)?;
        }
        fs::write(path, serde_json::to_vec(&snapshot)?)?;
    }

    // zoom levels: deepest zoom where every tile holds at most MAX_TILE_NODES nodes
    let mut maxzoom = 0u8;
    for z in 0..=14u8 {
        let mut counts: HashMap<(u32, u32), usize> = HashMap::new();
        let mut worst = 0;
        for p in &npos {
            let e = counts.entry(tile_of(p[0], p[1], z)).or_default();
            *e += 1;
            worst = worst.max(*e);
        }
        maxzoom = z;
        if worst <= MAX_TILE_NODES {
            break;
        }
    }
    let maxzoom = maxzoom.max(3);
    let cluster_zoom: u8 = if nc >= 60 && n > 20_000 { 2 } else { 0 };

    // minzoom: greedy quota per tile, most important nodes first
    let mut minzoom = vec![maxzoom; n];
    let mut counts: Vec<HashMap<(u32, u32), usize>> = vec![HashMap::new(); (maxzoom + 1) as usize];
    for &i in &rank {
        let p = npos[i as usize];
        let mut chosen = maxzoom;
        'z: for z in cluster_zoom..=maxzoom {
            for zz in z..maxzoom {
                if counts[zz as usize].get(&tile_of(p[0], p[1], zz)).copied().unwrap_or(0) >= QUOTA {
                    continue 'z;
                }
            }
            chosen = z;
            break;
        }
        minzoom[i as usize] = chosen;
        for zz in chosen..=maxzoom {
            *counts[zz as usize].entry(tile_of(p[0], p[1], zz)).or_default() += 1;
        }
    }

    // node display size (world units at zoom 0) and labels
    let size_of = |i: usize| (0.0006 * (1.0 + degree[i].sqrt().min(40.0) * 0.35)) as f32;
    let default_labels: Vec<String>;
    let labels: &Vec<String> = match &g.labels {
        Some(l) => l,
        None => {
            default_labels = (0..n).map(|i| format!("{} {i}", g.label_prefix)).collect();
            &default_labels
        }
    };
    let label_zoom = |i: usize| -> u8 {
        if g.labels.is_some() || rank_of[i] < 200 { minzoom[i] } else { (minzoom[i] + 2).min(maxzoom) }
    };
    let cluster_label: Vec<String> = members
        .iter()
        .enumerate()
        .map(|(c, list)| match (&g.labels, list.first()) {
            (Some(l), Some(&top)) => l[top as usize].clone(),
            _ => format!("Region {c}"),
        })
        .collect();

    let mut stats = Stats { nodes: n, edges: g.edges.len(), clusters: nc, maxzoom, cluster_zoom, ..Stats::default() };
    let mut largest: Vec<Vec<u8>> = Vec::new();
    let mut remember = |bytes: Vec<u8>, stats: &mut Stats| {
        stats.tiles += 1;
        stats.bytes += bytes.len();
        stats.max_tile_bytes = stats.max_tile_bytes.max(bytes.len());
        largest.push(bytes);
        largest.sort_by_key(|b| std::cmp::Reverse(b.len()));
        largest.truncate(8);
    };

    // cluster tiles (zoomed out): regions and summed links between them
    let cmax = meta.iter().map(|e| e.2).fold(1e-9f32, f32::max);
    for z in 0..cluster_zoom {
        let mut tiles: HashMap<(u32, u32), (Vec<usize>, Vec<usize>)> = HashMap::new();
        for c in 0..nc {
            tiles.entry(tile_of(cnorm[c][0], cnorm[c][1], z)).or_default().0.push(c);
        }
        for (ei, &(a, b, _)) in meta.iter().enumerate() {
            let (ta, tb) = (tile_of(cnorm[a as usize][0], cnorm[a as usize][1], z), tile_of(cnorm[b as usize][0], cnorm[b as usize][1], z));
            tiles.entry(ta).or_default().1.push(ei);
            if tb != ta {
                tiles.entry(tb).or_default().1.push(ei);
            }
        }
        let written: Vec<Vec<u8>> = tiles
            .into_par_iter()
            .map(|((x, y), (mut cl, mut es))| {
                cl.sort_by_key(|&c| std::cmp::Reverse(csize[c]));
                let shown_labels = 40usize;
                let nodes: Vec<TileNode> = cl
                    .iter()
                    .enumerate()
                    .map(|(k, &c)| TileNode {
                        x: cnorm[c][0],
                        y: cnorm[c][1],
                        id: c as u32,
                        size: crad_n[c],
                        color: (c % 7) as u8,
                        minzoom: 0,
                        label: if k < shown_labels { cluster_label[c].as_str() } else { "" },
                    })
                    .collect();
                es.sort_by(|&p, &q| meta[q].2.total_cmp(&meta[p].2));
                es.truncate(MAX_TILE_EDGES);
                let edges: Vec<([f32; 4], u8, u8)> = es
                    .iter()
                    .map(|&ei| {
                        let (a, b, w) = meta[ei];
                        let (pa, pb) = (cnorm[a as usize], cnorm[b as usize]);
                        ([pa[0], pa[1], pb[0], pb[1]], (a % 7) as u8, ((w / cmax).sqrt() * 255.0) as u8)
                    })
                    .collect();
                let bytes = encode(true, &nodes, &edges);
                let dir = out.join(z.to_string()).join(x.to_string());
                let _ = fs::create_dir_all(&dir);
                let _ = fs::write(dir.join(format!("{y}.bin")), &bytes);
                bytes
            })
            .collect();
        for b in written {
            remember(b, &mut stats);
        }
    }

    // node tiles: every node visible at this zoom, plus links whose ends are both visible
    let wmax = g.edges.iter().map(|e| e.2).fold(1e-9f32, f32::max);
    for z in cluster_zoom..=maxzoom {
        let mut tiles: HashMap<(u32, u32), (Vec<u32>, Vec<u32>)> = HashMap::new();
        for &i in &rank {
            if minzoom[i as usize] <= z {
                let p = npos[i as usize];
                tiles.entry(tile_of(p[0], p[1], z)).or_default().0.push(i);
            }
        }
        for (ei, &(a, b, _)) in g.edges.iter().enumerate() {
            let (a, b) = (a as usize, b as usize);
            if minzoom[a] > z || minzoom[b] > z {
                continue;
            }
            let ta = tile_of(npos[a][0], npos[a][1], z);
            let tb = tile_of(npos[b][0], npos[b][1], z);
            if let Some(t) = tiles.get_mut(&ta) {
                t.1.push(ei as u32);
            }
            if tb != ta
                && let Some(t) = tiles.get_mut(&tb)
            {
                t.1.push(ei as u32);
            }
        }
        let written: Vec<(Vec<u8>, usize, usize)> = tiles
            .into_par_iter()
            .map(|((x, y), (ns, mut es))| {
                let nodes: Vec<TileNode> = ns
                    .iter()
                    .map(|&i| {
                        let i = i as usize;
                        TileNode {
                            x: npos[i][0],
                            y: npos[i][1],
                            id: i as u32,
                            size: size_of(i),
                            color: g.color[i],
                            minzoom: minzoom[i],
                            label: if label_zoom(i) <= z { labels[i].as_str() } else { "" },
                        }
                    })
                    .collect();
                es.sort_by(|&p, &q| {
                    let score = |e: u32| {
                        let (a, b, _) = g.edges[e as usize];
                        rank_of[a as usize].max(rank_of[b as usize])
                    };
                    score(p).cmp(&score(q)).then(p.cmp(&q))
                });
                es.truncate(MAX_TILE_EDGES);
                let edges: Vec<([f32; 4], u8, u8)> = es
                    .iter()
                    .map(|&e| {
                        let (a, b, w) = g.edges[e as usize];
                        let (pa, pb) = (npos[a as usize], npos[b as usize]);
                        ([pa[0], pa[1], pb[0], pb[1]], g.color[a as usize], ((w / wmax) * 255.0) as u8)
                    })
                    .collect();
                let bytes = encode(false, &nodes, &edges);
                let dir = out.join(z.to_string()).join(x.to_string());
                let _ = fs::create_dir_all(&dir);
                let _ = fs::write(dir.join(format!("{y}.bin")), &bytes);
                (bytes, nodes.len(), edges.len())
            })
            .collect();
        for (b, nn, ne) in written {
            stats.max_tile_nodes = stats.max_tile_nodes.max(nn);
            stats.max_tile_edges = stats.max_tile_edges.max(ne);
            remember(b, &mut stats);
        }
    }
    stats.max_tile_gzip = largest.iter().map(|b| gzip_len(b)).max().unwrap_or(0);
    stats.drift = drift;
    stats.aligned_nodes = aligned;
    stats.build_ms = t0.elapsed().as_millis();

    if let Some(ents) = &spec.entities {
        fs::write(out.join("entities.json"), serde_json::to_vec(ents)?)?;
    }
    // where the nodes are (the viewer opens on them), and the regions it names when zoomed out
    let bounds = if n == 0 {
        [0.0, 0.0, 1.0, 1.0]
    } else {
        npos.iter().fold([f32::MAX, f32::MAX, f32::MIN, f32::MIN], |b, p| [b[0].min(p[0]), b[1].min(p[1]), b[2].max(p[0]), b[3].max(p[1])])
    };
    let regions = g.labels.as_ref().map(|l| regions(&members, l, g.may_name.as_deref(), &cnorm, &crad_n)).unwrap_or_default();
    let manifest = json!({
        "version": 0, "kind": spec.kind, "nodes": n, "edges": g.edges.len(), "clusters": nc,
        "maxzoom": maxzoom, "cluster_zoom": cluster_zoom, "tile_quota": QUOTA,
        "bounds": bounds, "regions": regions,
        "palette": spec.palette, "palette_labels": spec.palette_labels,
        "built": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
        "build_ms": stats.build_ms,
        "stats": { "tiles": stats.tiles, "max_tile_nodes": stats.max_tile_nodes, "max_tile_edges": stats.max_tile_edges,
                   "max_tile_bytes": stats.max_tile_bytes, "max_tile_gzip": stats.max_tile_gzip, "bytes": stats.bytes },
        "entities": spec.entities.as_ref().map(|_| "entities.json"),
        "stability": { "aligned_nodes": stats.aligned_nodes, "mean_drift": stats.drift },
    });
    fs::write(out.join("manifest.json"), serde_json::to_vec_pretty(&manifest)?)?;
    Ok(stats)
}

/// The layer palette used by synthetic worlds (same colours as the schema defaults).
pub fn default_palette() -> (Vec<String>, Vec<String>) {
    let p = ["#2e5c9a", "#b0333f", "#2f7d4f", "#c4621d", "#a87613", "#6a4c9c", "#1d7a78"];
    let l = ["People", "Power", "Money", "Science & Tech", "History", "Ideas & Religion", "Places"];
    (p.iter().map(|s| s.to_string()).collect(), l.iter().map(|s| s.to_string()).collect())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn small_synthetic_world_builds_within_budgets() {
        let g = synthetic(30_000, 7);
        let (palette, palette_labels) = default_palette();
        let dir = std::env::temp_dir().join(format!("ctd-world-test-{}", std::process::id()));
        let stats = build(&g, &Spec { kind: "synthetic", palette, palette_labels, entities: None }, &dir, None).unwrap();
        assert!(stats.tiles > 0);
        assert!(stats.max_tile_nodes <= MAX_TILE_NODES);
        assert!(stats.max_tile_edges <= MAX_TILE_EDGES);
        let bytes = fs::read(dir.join("0/0/0.bin")).unwrap();
        assert_eq!(&bytes[0..4], b"CTDT");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn deterministic() {
        let a = synthetic(5_000, 3);
        let b = synthetic(5_000, 3);
        assert_eq!(a.edges.len(), b.edges.len());
        assert_eq!(cluster(a.n, &a.edges).0, cluster(b.n, &b.edges).0);
    }

    /// Two stars and a pair: the stars become regions named after their hubs, biggest first; the pair is
    /// too small to name. Hubs come after their leaves, so the name is not just the first node.
    #[test]
    fn regions_are_named_after_their_best_connected_node() {
        let mut labels: Vec<String> = Vec::new();
        let mut edges = Vec::new();
        for (hub, leaves) in [("Alpha", 6), ("Beta", 4)] {
            let first = labels.len() as u32;
            labels.extend((0..leaves).map(|i| format!("{hub} leaf {i}")));
            labels.push(hub.to_string());
            let h = labels.len() as u32 - 1;
            edges.extend((first..h).map(|leaf| (leaf, h, 1.0)));
            edges.push((first, first + 1, 0.3)); // a weak link between two leaves
        }
        labels.extend(["Gamma".to_string(), "Delta".to_string()]);
        edges.push((labels.len() as u32 - 2, labels.len() as u32 - 1, 1.0));
        let n = labels.len();
        let g = WorldGraph { n, edges, color: vec![0; n], labels: Some(labels), label_prefix: "", keys: None, may_name: None };
        let spec = Spec { kind: "content", palette: vec!["#6e6e73".into()], palette_labels: vec!["All".into()], entities: None };
        let manifest = |run: u32| -> Value {
            let dir = std::env::temp_dir().join(format!("ctd-world-regions-{}-{run}", std::process::id()));
            build(&g, &spec, &dir, None).unwrap();
            let m = serde_json::from_slice(&fs::read(dir.join("manifest.json")).unwrap()).unwrap();
            let _ = fs::remove_dir_all(&dir);
            m
        };
        let (a, b) = (manifest(1), manifest(2));
        assert_eq!(a["regions"], b["regions"], "regions are deterministic");
        assert_eq!(a["bounds"], b["bounds"]);
        let regions = a["regions"].as_array().unwrap();
        let named: Vec<(&str, u64)> = regions.iter().map(|r| (r["label"].as_str().unwrap(), r["size"].as_u64().unwrap())).collect();
        assert_eq!(named, [("Alpha", 7), ("Beta", 5)]);
        for r in regions {
            let (x, y, rad) = (r["x"].as_f64().unwrap(), r["y"].as_f64().unwrap(), r["r"].as_f64().unwrap());
            assert!((0.0..=1.0).contains(&x) && (0.0..=1.0).contains(&y) && rad > 0.0);
        }
        let bounds: Vec<f64> = a["bounds"].as_array().unwrap().iter().map(|v| v.as_f64().unwrap()).collect();
        assert!(bounds[0] < bounds[2] && bounds[1] < bounds[3] && bounds[0] >= 0.0 && bounds[3] <= 1.0);
    }

    /// Alignment keeps the orientation only: a previous build that had shrunk does not shrink the next one.
    #[test]
    fn alignment_does_not_shrink_the_map() {
        let g = synthetic(2_000, 5);
        let keys: Vec<String> = (0..g.n).map(|i| format!("n{i}")).collect();
        let g = WorldGraph { keys: Some(keys), ..g };
        let (palette, palette_labels) = default_palette();
        let spec = Spec { kind: "synthetic", palette, palette_labels, entities: None };
        let dir = std::env::temp_dir().join(format!("ctd-world-orient-{}", std::process::id()));
        let state = dir.join("state.json");
        // a previous build squeezed into a tenth of the square, turned a quarter
        let first = dir.join("a");
        build(&g, &spec, &first, Some(&state)).unwrap();
        let prev: HashMap<String, [f32; 2]> = serde_json::from_slice(&fs::read(&state).unwrap()).unwrap();
        let squeezed: HashMap<&String, [f32; 2]> = prev.iter().map(|(k, p)| (k, [0.5 - (p[1] - 0.5) * 0.1, 0.5 + (p[0] - 0.5) * 0.1])).collect();
        fs::write(&state, serde_json::to_vec(&squeezed).unwrap()).unwrap();
        let stats = build(&g, &spec, &dir.join("b"), Some(&state)).unwrap();
        assert_eq!(stats.aligned_nodes, g.n);
        let m: Value = serde_json::from_slice(&fs::read(dir.join("b").join("manifest.json")).unwrap()).unwrap();
        let b: Vec<f64> = m["bounds"].as_array().unwrap().iter().map(|v| v.as_f64().unwrap()).collect();
        assert!((b[2] - b[0]).max(b[3] - b[1]) > 0.8, "the map fills the square again: {b:?}");
        let _ = fs::remove_dir_all(&dir);
    }

    #[test]
    fn a_region_is_never_named_after_a_person() {
        let members = vec![vec![0u32, 1, 2], vec![3, 4, 5]];
        let labels: Vec<String> = ["Ann", "Acme", "Bob", "Cy", "Di", "Ed"].map(String::from).to_vec();
        let may_name = [false, true, false, false, false, false];
        let r = regions(&members, &labels, Some(&may_name), &[[0.3, 0.3], [0.7, 0.7]], &[0.1, 0.1]);
        let names: Vec<&str> = r.iter().map(|r| r.label.as_str()).collect();
        assert_eq!(names, ["Acme"], "the best-connected non-person names it; a region of people only goes unnamed");
    }

    #[test]
    fn rebuilding_the_same_graph_writes_the_same_bytes() {
        let g = synthetic(1_500, 9);
        let keys: Vec<String> = (0..g.n).map(|i| format!("n{i}")).collect();
        let g = WorldGraph { keys: Some(keys), ..g };
        let (palette, palette_labels) = default_palette();
        let spec = Spec { kind: "synthetic", palette, palette_labels, entities: None };
        let dir = std::env::temp_dir().join(format!("ctd-world-repeat-{}", std::process::id()));
        let state = dir.join("state.json");
        for run in ["a", "b", "c"] {
            build(&g, &spec, &dir.join(run), Some(&state)).unwrap();
        }
        // every file of the second and third builds, byte for byte (the first has no previous build)
        let files = |run: &str| -> Vec<(String, Vec<u8>)> {
            let root = dir.join(run);
            let mut v: Vec<(String, Vec<u8>)> = walkdir::WalkDir::new(&root)
                .into_iter()
                .filter_map(Result::ok)
                .filter(|e| e.file_type().is_file())
                .map(|e| {
                    let name = e.path().strip_prefix(&root).unwrap().to_string_lossy().into_owned();
                    let mut bytes = fs::read(e.path()).unwrap();
                    if name == "manifest.json" {
                        // when and how fast it was built may differ
                        let mut m: Value = serde_json::from_slice(&bytes).unwrap();
                        m.as_object_mut().unwrap().retain(|k, _| k != "built" && k != "build_ms");
                        bytes = serde_json::to_vec(&m).unwrap();
                    }
                    (name, bytes)
                })
                .collect();
            v.sort();
            v
        };
        let (b, c) = (files("b"), files("c"));
        assert!(!b.is_empty());
        let differ: Vec<&String> = b.iter().zip(&c).filter(|(x, y)| x != y).map(|(x, _)| &x.0).collect();
        assert!(b.len() == c.len() && differ.is_empty(), "{} vs {} files; differ: {differ:?}", b.len(), c.len());
        let _ = fs::remove_dir_all(&dir);
    }
}
