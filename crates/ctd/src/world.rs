//! The open world: clustering, a hierarchical map layout, level of detail and binary tiles
//! (format in docs/world-tiles.md). Deterministic: the same graph always yields the same world.
#![allow(clippy::needless_range_loop)]

use std::{borrow::Cow, collections::HashMap, fs, io::Write, path::Path, time::Instant};

use anyhow::Result;
use rayon::prelude::*;
use serde::Serialize;
use serde_json::{Value, json};

use crate::kb::Kb;

mod community;
mod layout;
mod tiles;

use community::*;
use layout::*;
use tiles::*;

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
    /// What each node is called in its tile; None: its place here.
    pub ids: Option<Vec<u32>>,
    /// Each node's years, for the era slider; None: nothing here is dated.
    pub years: Option<Vec<[i16; 2]>>,
    /// What kind of link each edge is; None: unnamed.
    pub how: Option<How>,
}

/// How an edge links its two ends, in the vocabulary's words.
pub struct How {
    /// By edge: an index into `phrases`, or u16::MAX for a relation with no phrase.
    pub relation: Vec<u16>,
    /// The phrase read from each end: `[from a, from b]`.
    pub phrases: Vec<[String; 2]>,
}

/// A node with no date, in a tile's years.
pub const NO_YEAR: i16 = i16::MIN;
/// The last year of something still going.
pub const ONGOING: i16 = i16::MAX;

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
const MAX_TILE_NODES: usize = 3000;
const MAX_TILE_EDGES: usize = 8192;
/// Zoomed out to here, a big map draws the links between its communities, this many a tile at most.
const WEB_ZOOM: u8 = 2;
const WEB_EDGES: usize = 2500;
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
    WorldGraph { n, edges, color, labels: None, label_prefix: "Node", keys: None, may_name: None, ids: None, years: None, how: None }
}

/// The real content graph as a world: colors by entity type, labels = names. With an atlas, its
/// entries join the graph: one written by hand stays a single dot, and takes the atlas's links too.
pub fn from_kb(kb: &Kb, atlas: Option<&crate::atlas::Atlas>) -> (WorldGraph, Spec) {
    let palette = kb.schema.layers.values().map(|l| l.color.clone()).collect();
    let palette_labels = kb.schema.layers.values().map(|l| l.label.clone()).collect();
    let ink = |kind: &str| kb.schema.types.get(kind).and_then(|t| kb.schema.layers.get_index_of(&t.layer)).unwrap_or(0) as u8;
    let mut color: Vec<u8> = kb.entities.iter().map(|e| ink(&e.kind)).collect();
    let mut edges = Vec::new();
    // family and other sensitive links are real, but a map never makes a named group of them
    let phrases: Vec<[String; 2]> = kb.schema.relations.values().map(|r| [r.label.clone(), r.inverse.clone()]).collect();
    let relation_of = |name: &str| kb.schema.relations.get_full(name).filter(|(_, _, r)| !r.sensitive).map_or(u16::MAX, |(i, _, _)| i as u16);
    let mut relation = Vec::new();
    for e in &kb.edges {
        // withdrawn links and links on no layer ("not the same as") never pull entries together
        let unlayered = kb.schema.relations.get(&e.rel).is_none_or(|r| r.layers.is_empty());
        if e.status == "deprecated" || unlayered {
            continue;
        }
        if let (Some(&a), Some(&b)) = (kb.index.get(&e.from), kb.index.get(&e.to)) {
            let w = if e.passive {
                0.3
            } else if e.according_to.is_empty() && e.status == "published" {
                1.0
            } else {
                0.6
            };
            edges.push((a as u32, b as u32, w));
            relation.push(relation_of(&e.rel));
        }
    }
    let mut labels: Vec<String> = kb.entities.iter().map(|e| e.name.clone()).collect();
    let mut keys: Vec<String> = kb.entities.iter().map(|e| e.id.clone()).collect();
    // people and families (types with family ties) never name a region: it would read as theirs
    let mut may_name: Vec<bool> = kb.entities.iter().map(|e| !kb.schema.types.get(&e.kind).is_some_and(|t| t.family)).collect();
    let mut ids = None;
    let span = |w: &crate::edtf::Span| [w.start.floor().max(-32767.0) as i16, w.end.map_or(ONGOING, |y| y.ceil() as i16)];
    let mut years: Vec<[i16; 2]> = kb.entities.iter().map(|e| e.when.as_ref().map_or([NO_YEAR; 2], span)).collect();
    if let Some(a) = atlas {
        // at this scale a region is named after a place, never after a team or a study
        may_name.iter_mut().zip(&kb.entities).for_each(|(m, e)| *m = e.kind == "place");
        let hand = crate::atlas::curated(kb);
        let mut tile_ids: Vec<u32> = (0..kb.entities.len() as u32).collect();
        let node: Vec<u32> = a
            .entries
            .iter()
            .map(|e| match hand.get(&e.qid) {
                Some(&c) => c as u32,
                None => {
                    let new = labels.len() as u32;
                    color.push(ink(e.kind()));
                    labels.push(e.name.clone());
                    keys.push(format!("Q{}", e.qid));
                    may_name.push(e.kind() == "place");
                    tile_ids.push(crate::atlas::ATLAS_IDS + e.qid);
                    years.push(e.span());
                    new
                }
            })
            .collect();
        edges.extend(a.links.iter().map(|&(x, r, y)| {
            let shapes_map = kb.schema.relations.get(&a.relations[r as usize]).is_some_and(|rel| rel.traversable);
            (node[x as usize], node[y as usize], if shapes_map { 0.6 } else { 0.15 })
        }));
        relation.extend(a.links.iter().map(|&(_, r, _)| relation_of(&a.relations[r as usize])));
        ids = Some(tile_ids);
    }
    // The entry's own dates (decimal years, data-contract.md "Dates"), for the map's era slider.
    let year = |y: f64| (y * 1000.0).round() / 1000.0;
    let entities = kb
        .entities
        .iter()
        .map(|e| {
            let mut v = json!({ "id": e.id, "name": e.name, "url": format!("/e/{}/", e.id) });
            if let Some(q) = e.same_as.get("wikidata") {
                v["q"] = json!(q);
            }
            if let Some(w) = &e.when {
                v["start"] = json!(year(w.start));
                v["end"] = json!(w.end.map(year));
            }
            v
        })
        .collect();
    (
        WorldGraph {
            n: labels.len(),
            edges,
            color,
            labels: Some(labels),
            label_prefix: "",
            keys: Some(keys),
            may_name: Some(may_name),
            ids,
            years: Some(years),
            how: Some(How { relation, phrases }),
        },
        Spec { kind: "content", palette, palette_labels, entities: Some(entities) },
    )
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
fn regions(members: &[Vec<u32>], labels: &[String], may_name: Option<&[bool]>, center: &[[f32; 2]], radius: &[f32], gathered: &[Option<u8>]) -> Vec<Region> {
    // named after its best-connected member that may name it; a region of people only goes unnamed
    let name = |c: usize| members[c].iter().find(|&&i| may_name.is_none_or(|m| m[i as usize])).map(|&i| labels[i as usize].clone());
    let mut order: Vec<usize> = (0..members.len()).filter(|&c| gathered[c].is_none() && members[c].len() >= MIN_REGION && name(c).is_some()).collect();
    order.sort_by_key(|&c| (std::cmp::Reverse(members[c].len()), c));
    order.truncate(MAX_REGIONS);
    order.into_iter().map(|c| Region { label: name(c).unwrap_or_default(), x: center[c][0], y: center[c][1], r: radius[c], size: members[c].len() }).collect()
}

// ---------------------------------------------------------------- tiles

/// A big world has many entries with few links. Left apart they would each be a community, strung out
/// around the map and stretching it thin. Each joins the community of its rarest link, and the few with
/// none to join make a disc per ink.
const GATHER_ABOVE: usize = 20_000;

/// Communities, ranks and places, before the map is fitted to the unit square.
struct Placed {
    /// Number of communities; the next five have one row each.
    nc: usize,
    cpos: Vec<[f64; 2]>,
    crad: Vec<f64>,
    members: Vec<Vec<u32>>,
    /// The ink of a community of gathered entries; None for one found by its links.
    gathered: Vec<Option<u8>>,
    /// Summed links between communities.
    meta: Vec<(u32, u32, f32)>,
    /// Which community each node is in.
    comm: Vec<u32>,
    /// A big world's discs, arranged by what links to what.
    tree: Option<Tree>,
    pos: Vec<[f64; 2]>,
    degree: Vec<f64>,
    /// Nodes, most important first, and each node's place in that order.
    rank: Vec<u32>,
    rank_of: Vec<u32>,
}

/// Finds the communities, lays them out, and places each one's nodes on a disc.
fn place(g: &WorldGraph) -> Placed {
    let n = g.n;
    let (mut comm, mut nc) = cluster(n, &g.edges);
    let mut gathered = vec![None; nc];
    if n > GATHER_ABOVE {
        (nc, gathered) = gather_small(&mut comm, nc, &g.edges, &g.color);
    }
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
    let (cpos, crad) = layout_clusters(&csize, &meta_edges(&comm, &layout_edges));

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
    let tree = (n > GATHER_ABOVE).then(|| Tree::new(g, &comm, &members, &gathered, &rank, &rank_of, &count));
    let mut pos = vec![[0f64; 2]; n];
    for (c, list) in members.iter().enumerate() {
        let r = crad[c];
        let offset = c as f64 * 0.77;
        let nested = tree.as_ref().filter(|t| t.laid_out[c]);
        // a tile takes the best known first: in a disc too big for one, they must lie all over it, or
        // zoomed out it would be a dense spot with nothing around
        let even = list.len() > QUOTA;
        for (j, &i) in list.iter().enumerate() {
            let [x, y] = if let Some(t) = nested {
                t.at(i)
            } else if even {
                sprinkle(j)
            } else {
                let (a, d) = (j as f64 * GOLDEN + offset, ((j as f64 + 0.5) / list.len() as f64).sqrt());
                [d * a.cos(), d * a.sin()]
            };
            pos[i as usize] = [cpos[c][0] + r * 0.94 * x, cpos[c][1] + r * 0.94 * y];
        }
    }
    if n > GATHER_ABOVE {
        // the great hubs would fill the zoomed-out map with one colour and leave quiet discs empty.
        // Taking each community's best known by their share of it keeps the map equally dense everywhere;
        // the offset gives a small community its fair chance of a first dot
        let mut share = vec![0f64; n];
        for (c, list) in members.iter().enumerate() {
            let offset = (c as f64 * GOLDEN).fract();
            for (j, &i) in list.iter().enumerate() {
                share[i as usize] = (j as f64 + offset) / list.len() as f64;
            }
        }
        rank.sort_by(|&a, &b| share[a as usize].total_cmp(&share[b as usize]).then(a.cmp(&b)));
        for (r, &i) in rank.iter().enumerate() {
            rank_of[i as usize] = r as u32;
        }
    }
    let meta = meta_edges(&comm, &g.edges);
    Placed { nc, cpos, crad, members, gathered, meta, comm, tree, pos, degree, rank, rank_of }
}

/// The map in the unit square.
struct Square {
    nodes: Vec<[f32; 2]>,
    centers: Vec<[f32; 2]>,
    radii: Vec<f32>,
}

impl Square {
    fn fit(p: &Placed) -> Square {
        let (mut minx, mut miny, mut maxx, mut maxy) = (f64::MAX, f64::MAX, f64::MIN, f64::MIN);
        for c in 0..p.nc {
            minx = minx.min(p.cpos[c][0] - p.crad[c]);
            maxx = maxx.max(p.cpos[c][0] + p.crad[c]);
            miny = miny.min(p.cpos[c][1] - p.crad[c]);
            maxy = maxy.max(p.cpos[c][1] + p.crad[c]);
        }
        let scale = 0.94 / (maxx - minx).max(maxy - miny).max(1e-9);
        let (cx, cy) = ((minx + maxx) / 2.0, (miny + maxy) / 2.0);
        let norm = |p: &[f64; 2]| -> [f32; 2] { [((p[0] - cx) * scale + 0.5) as f32, ((p[1] - cy) * scale + 0.5) as f32] };
        Square {
            nodes: p.pos.iter().map(norm).collect(),
            centers: p.cpos.iter().map(norm).collect(),
            radii: p.crad.iter().map(|&r| (r * scale) as f32).collect(),
        }
    }

    /// Where the nodes are: the viewer opens on them.
    fn bounds(&self) -> [f32; 4] {
        if self.nodes.is_empty() {
            return [0.0, 0.0, 1.0, 1.0];
        }
        self.nodes.iter().fold([f32::MAX, f32::MAX, f32::MIN, f32::MIN], |b, p| [b[0].min(p[0]), b[1].min(p[1]), b[2].max(p[0]), b[3].max(p[1])])
    }
}

/// How far the nodes placed last time moved, in the square; None until 3 could be aligned.
fn mean_drift(prev: Option<&HashMap<String, [f32; 2]>>, keys: Option<&[String]>, nodes: &[[f32; 2]], aligned: usize) -> Option<f64> {
    let (prev, keys) = (prev?, keys?);
    if aligned < 3 {
        return None;
    }
    let moved: Vec<f64> =
        keys.iter().zip(nodes).filter_map(|(k, p)| prev.get(k).map(|q| (((p[0] - q[0]) as f64).powi(2) + ((p[1] - q[1]) as f64).powi(2)).sqrt())).collect();
    Some(moved.iter().sum::<f64>() / moved.len() as f64)
}

/// Remembers where every node is, for the next build to keep this orientation.
fn write_state(path: &Path, keys: &[String], nodes: &[[f32; 2]]) -> Result<()> {
    let snapshot: HashMap<&str, [f32; 2]> = keys.iter().map(String::as_str).zip(nodes.iter().copied()).collect();
    if let Some(dir) = path.parent() {
        fs::create_dir_all(dir)?;
    }
    fs::write(path, serde_json::to_vec(&snapshot)?)?;
    Ok(())
}

/// Builds the world: clusters, layout, level of detail, tiles and manifest under `out`. Returns its
/// numbers, and where each node landed in the unit square.
pub fn build(g: &WorldGraph, spec: &Spec, out: &Path, state: Option<&Path>) -> Result<(Stats, Vec<[f32; 2]>)> {
    let t0 = Instant::now();
    if out.exists() {
        fs::remove_dir_all(out)?;
    }
    fs::create_dir_all(out)?;

    let mut p = place(g);
    // keep the previous build's orientation, then normalise into the unit square
    let prev: Option<HashMap<String, [f32; 2]>> = state.and_then(|p| fs::read_to_string(p).ok()).and_then(|t| serde_json::from_str(&t).ok());
    let aligned = match (&prev, &g.keys) {
        (Some(prev), Some(keys)) => orient(&mut p.pos, &mut p.cpos, keys, prev),
        _ => 0,
    };
    let square = Square::fit(&p);
    let drift = mean_drift(prev.as_ref(), g.keys.as_deref(), &square.nodes, aligned);
    if let (Some(path), Some(keys)) = (state, &g.keys) {
        write_state(path, keys, &square.nodes)?;
    }

    let maxzoom = deepest_zoom(&square.nodes);
    let labels: Cow<[String]> = match &g.labels {
        Some(l) => l.into(),
        None => (0..g.n).map(|i| format!("{} {i}", g.label_prefix)).collect::<Vec<_>>().into(),
    };
    let minzoom = min_zooms(&p.rank, &square.nodes, maxzoom);
    let anchors: Vec<[f32; 2]> = p
        .tree
        .iter()
        .flat_map(|t| &t.parts)
        .map(|part| {
            let sum = part.members.iter().fold([0f32; 2], |s, &i| [s[0] + square.nodes[i as usize][0], s[1] + square.nodes[i as usize][1]]);
            sum.map(|v| v / part.members.len() as f32)
        })
        .collect();
    if let Some(t) = &p.tree {
        write_parts(&t.names(g, &anchors, &p, &square.radii), out)?;
    }
    let tiles = Tiles { g, p: &p, square: &square, out, minzoom, maxzoom, labels, anchors };

    let stats = Stats { nodes: g.n, edges: g.edges.len(), clusters: p.nc, maxzoom, ..Stats::default() };
    let mut tally = Tally { stats, largest: Vec::new() };
    for z in 0..=maxzoom {
        for (bytes, nodes, edges) in tiles.nodes(z) {
            tally.stats.max_tile_nodes = tally.stats.max_tile_nodes.max(nodes);
            tally.stats.max_tile_edges = tally.stats.max_tile_edges.max(edges);
            tally.add(bytes);
        }
    }
    let mut stats = tally.stats;
    stats.max_tile_gzip = tally.largest.iter().map(|b| gzip_len(b)).max().unwrap_or(0);
    stats.drift = drift;
    stats.aligned_nodes = aligned;
    stats.build_ms = t0.elapsed().as_millis();

    if let Some(ents) = &spec.entities {
        fs::write(out.join("entities.json"), serde_json::to_vec(ents)?)?;
    }
    let named = g.labels.as_ref().map(|l| regions(&p.members, l, g.may_name.as_deref(), &square.centers, &square.radii, &p.gathered)).unwrap_or_default();
    write_tile_index(out, maxzoom)?;
    write_manifest(spec, &stats, square.bounds(), &named, p.tree.is_some(), out)?;
    write_picture(g, spec, &p, &square, out)?;
    Ok((stats, square.nodes))
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
        let stats = build(&g, &Spec { kind: "synthetic", palette, palette_labels, entities: None }, &dir, None).unwrap().0;
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
        let g =
            WorldGraph { n, edges, color: vec![0; n], labels: Some(labels), label_prefix: "", keys: None, may_name: None, ids: None, years: None, how: None };
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
        let stats = build(&g, &spec, &dir.join("b"), Some(&state)).unwrap().0;
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
        let r = regions(&members, &labels, Some(&may_name), &[[0.3, 0.3], [0.7, 0.7]], &[0.1, 0.1], &[None, None]);
        let names: Vec<&str> = r.iter().map(|r| r.label.as_str()).collect();
        assert_eq!(names, ["Acme"], "the best-connected non-person names it; a region of people only goes unnamed");
    }

    #[test]
    fn discs_on_one_spot_part_instead_of_travelling_together() {
        for c in 2..40 {
            let mut pos = vec![[5.0, 5.0]; c];
            let radius = vec![2.0; c];
            separate(&mut pos, &radius);
            let far = pos.iter().map(|p| ((p[0] - 5.0).powi(2) + (p[1] - 5.0).powi(2)).sqrt()).fold(0.0, f64::max);
            assert!(far < 2.0 * (c as f64).sqrt() * 4.0, "{c} discs reached {far}");
            assert!(pos.iter().enumerate().all(|(i, p)| pos[i + 1..].iter().all(|q| p != q)), "{c} discs still share a spot");
        }
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
