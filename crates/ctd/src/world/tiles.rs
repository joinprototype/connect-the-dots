//! The written world: which zoom each node appears at, the binary tiles, and their manifest.

use super::*;

pub(super) fn tile_of(x: f32, y: f32, z: u8) -> (u32, u32) {
    let s = (1u32 << z) as f32;
    let tx = ((x * s) as i64).clamp(0, (1i64 << z) - 1) as u32;
    let ty = ((y * s) as i64).clamp(0, (1i64 << z) - 1) as u32;
    (tx, ty)
}

pub(super) fn pad4(buf: &mut Vec<u8>) {
    while buf.len() % 4 != 0 {
        buf.push(0);
    }
}

pub(super) struct TileNode<'a> {
    pub(super) x: f32,
    pub(super) y: f32,
    pub(super) id: u32,
    pub(super) size: f32,
    pub(super) color: u8,
    pub(super) minzoom: u8,
    pub(super) years: [i16; 2],
    pub(super) label: &'a str,
}

pub(super) fn encode(nodes: &[TileNode], edges: &[([f32; 4], u8, u8)]) -> Vec<u8> {
    let label_bytes: usize = nodes.iter().map(|n| n.label.len()).sum();
    let mut b = Vec::with_capacity(32 + nodes.len() * 26 + edges.len() * 18 + label_bytes);
    b.extend_from_slice(b"CTDT");
    b.extend_from_slice(&1u16.to_le_bytes());
    b.extend_from_slice(&0u16.to_le_bytes());
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
    for k in 0..2 {
        for n in nodes {
            b.extend_from_slice(&n.years[k].to_le_bytes());
        }
        pad4(&mut b);
    }
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

pub(super) fn gzip_len(bytes: &[u8]) -> usize {
    let mut enc = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
    let _ = enc.write_all(bytes);
    enc.finish().map(|v| v.len()).unwrap_or(0)
}

/// The deepest zoom needed: where every tile holds at most MAX_TILE_NODES nodes, 3 at least.
pub(super) fn deepest_zoom(nodes: &[[f32; 2]]) -> u8 {
    let mut maxzoom = 0u8;
    for z in 0..=14u8 {
        let mut counts: HashMap<(u32, u32), usize> = HashMap::new();
        let mut worst = 0;
        for p in nodes {
            let e = counts.entry(tile_of(p[0], p[1], z)).or_default();
            *e += 1;
            worst = worst.max(*e);
        }
        maxzoom = z;
        if worst <= MAX_TILE_NODES {
            break;
        }
    }
    maxzoom.max(3)
}

/// Each node's first zoom: a greedy quota per tile, most important nodes first.
pub(super) fn min_zooms(rank: &[u32], nodes: &[[f32; 2]], maxzoom: u8) -> Vec<u8> {
    let mut minzoom = vec![maxzoom; nodes.len()];
    let mut counts: Vec<HashMap<(u32, u32), usize>> = vec![HashMap::new(); (maxzoom + 1) as usize];
    for &i in rank {
        let p = nodes[i as usize];
        let mut chosen = maxzoom;
        'z: for z in 0..=maxzoom {
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
    minzoom
}

/// Level of detail for links: on a big map a link appears once it is short on screen, so that hubs do
/// not wash the zoomed-out map with long lines.
pub(super) fn longest_link(nodes: usize, z: u8) -> f32 {
    if nodes > GATHER_ABOVE { 0.25 / 2f32.powi(z as i32) } else { f32::MAX }
}

pub(super) fn write_tile(out: &Path, z: u8, x: u32, y: u32, bytes: &[u8]) {
    let dir = out.join(z.to_string()).join(x.to_string());
    let _ = fs::create_dir_all(&dir);
    let _ = fs::write(dir.join(format!("{y}.bin")), bytes);
}

/// What it takes to write a level's tiles.
pub(super) struct Tiles<'a> {
    pub(super) g: &'a WorldGraph,
    pub(super) p: &'a Placed,
    pub(super) square: &'a Square,
    pub(super) out: &'a Path,
    pub(super) minzoom: Vec<u8>,
    pub(super) maxzoom: u8,
    pub(super) labels: Cow<'a, [String]>,
}

impl Tiles<'_> {
    /// A level of nodes: every node visible at this zoom, plus links whose ends are both visible.
    /// Each tile comes back with its counts of nodes and links.
    pub(super) fn nodes(&self, z: u8) -> Vec<(Vec<u8>, usize, usize)> {
        let (g, p, npos, minzoom) = (self.g, self.p, &self.square.nodes, &self.minzoom);
        let wmax = g.edges.iter().map(|e| e.2).fold(1e-9f32, f32::max);
        let label_zoom = |i: usize| -> u8 { if g.labels.is_some() || p.rank_of[i] < 200 { minzoom[i] } else { (minzoom[i] + 2).min(self.maxzoom) } };
        let mut tiles: HashMap<(u32, u32), (Vec<u32>, Vec<u32>)> = HashMap::new();
        for &i in &p.rank {
            if minzoom[i as usize] <= z {
                let q = npos[i as usize];
                tiles.entry(tile_of(q[0], q[1], z)).or_default().0.push(i);
            }
        }
        let longest = longest_link(g.n, z);
        // two dots of a thin sample are rarely linked, so zoomed out a big map draws what its
        // communities share: the web that holds the world together
        let centers = &self.square.centers;
        let web = |a: u32, b: u32| (centers[a as usize], centers[b as usize]);
        let mut webs: HashMap<(u32, u32), Vec<u32>> = HashMap::new();
        if g.n > GATHER_ABOVE && z <= WEB_ZOOM {
            for (ei, &(a, b, _)) in p.meta.iter().enumerate() {
                let (pa, pb) = web(a, b);
                if (pa[0] - pb[0]).hypot(pa[1] - pb[1]) > longest {
                    continue;
                }
                let (ta, tb) = (tile_of(pa[0], pa[1], z), tile_of(pb[0], pb[1], z));
                webs.entry(ta).or_default().push(ei as u32);
                if tb != ta {
                    webs.entry(tb).or_default().push(ei as u32);
                }
            }
        }
        let wide = p.meta.iter().map(|e| e.2).fold(1e-9f32, f32::max);
        for (ei, &(a, b, _)) in g.edges.iter().enumerate() {
            let (a, b) = (a as usize, b as usize);
            if minzoom[a] > z || minzoom[b] > z {
                continue;
            }
            if (npos[a][0] - npos[b][0]).hypot(npos[a][1] - npos[b][1]) > longest {
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
        tiles
            .into_par_iter()
            .map(|((x, y), (ns, mut es))| {
                let nodes: Vec<TileNode> = ns
                    .iter()
                    .map(|&i| {
                        let i = i as usize;
                        TileNode {
                            x: npos[i][0],
                            y: npos[i][1],
                            id: g.ids.as_ref().map_or(i as u32, |ids| ids[i]),
                            size: (0.0006 * (1.0 + p.degree[i].sqrt().min(40.0) * 0.35)) as f32,
                            color: g.color[i],
                            minzoom: minzoom[i],
                            years: g.years.as_ref().map_or([NO_YEAR; 2], |y| y[i]),
                            label: if label_zoom(i) <= z { self.labels[i].as_str() } else { "" },
                        }
                    })
                    .collect();
                es.sort_by(|&a, &b| {
                    let score = |e: u32| {
                        let (a, b, _) = g.edges[e as usize];
                        p.rank_of[a as usize].max(p.rank_of[b as usize])
                    };
                    score(a).cmp(&score(b)).then(a.cmp(&b))
                });
                es.truncate(MAX_TILE_EDGES);
                let mut edges: Vec<([f32; 4], u8, u8)> = es
                    .iter()
                    .map(|&e| {
                        let (a, b, w) = g.edges[e as usize];
                        let (pa, pb) = (npos[a as usize], npos[b as usize]);
                        ([pa[0], pa[1], pb[0], pb[1]], g.color[a as usize], ((w / wmax) * 255.0) as u8)
                    })
                    .collect();
                if let Some(list) = webs.get(&(x, y)) {
                    let mut list = list.clone();
                    list.sort_by(|&a, &b| p.meta[b as usize].2.total_cmp(&p.meta[a as usize].2).then(a.cmp(&b)));
                    list.truncate(WEB_EDGES);
                    edges.extend(list.iter().map(|&e| {
                        let (a, b, w) = p.meta[e as usize];
                        let (pa, pb) = web(a, b);
                        ([pa[0], pa[1], pb[0], pb[1]], 0, ((w / wide).sqrt() * 255.0) as u8)
                    }));
                }
                let bytes = encode(&nodes, &edges);
                write_tile(self.out, z, x, y, &bytes);
                (bytes, nodes.len(), edges.len())
            })
            .collect()
    }
}

/// Adds up the tiles as they are written, keeping the largest few to gzip once at the end.
pub(super) struct Tally {
    pub(super) stats: Stats,
    pub(super) largest: Vec<Vec<u8>>,
}

impl Tally {
    pub(super) fn add(&mut self, bytes: Vec<u8>) {
        self.stats.tiles += 1;
        self.stats.bytes += bytes.len();
        self.stats.max_tile_bytes = self.stats.max_tile_bytes.max(bytes.len());
        self.largest.push(bytes);
        self.largest.sort_by_key(|b| std::cmp::Reverse(b.len()));
        self.largest.truncate(8);
    }
}

pub(super) fn write_manifest(spec: &Spec, stats: &Stats, bounds: [f32; 4], regions: &[Region], out: &Path) -> Result<()> {
    let manifest = json!({
        "version": 0, "kind": spec.kind, "nodes": stats.nodes, "edges": stats.edges, "clusters": stats.clusters,
        "maxzoom": stats.maxzoom, "tile_quota": QUOTA,
        "bounds": bounds, "regions": regions,
        "palette": spec.palette, "palette_labels": spec.palette_labels,
        "built": chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
        "build_ms": stats.build_ms,
        "stats": { "tiles": stats.tiles, "max_tile_nodes": stats.max_tile_nodes, "max_tile_edges": stats.max_tile_edges,
                   "max_tile_bytes": stats.max_tile_bytes, "max_tile_gzip": stats.max_tile_gzip, "bytes": stats.bytes },
        "entities": spec.entities.as_ref().map(|_| "entities.json"),
        "tile_index": "index.json",
        "stability": { "aligned_nodes": stats.aligned_nodes, "mean_drift": stats.drift },
    });
    fs::write(out.join("manifest.json"), serde_json::to_vec_pretty(&manifest)?)?;
    Ok(())
}

/// Which tiles exist: `{"<z>": [x * 2^z + y, ...]}`. Most of a big map's grid is empty, and a viewer
/// that knows it asks for nothing there.
pub(super) fn write_tile_index(out: &Path, maxzoom: u8) -> Result<()> {
    let mut index = serde_json::Map::new();
    for z in 0..=maxzoom {
        let mut found: Vec<u64> = Vec::new();
        let Ok(columns) = fs::read_dir(out.join(z.to_string())) else { continue };
        for column in columns.flatten() {
            let Some(x) = column.file_name().to_str().and_then(|s| s.parse::<u64>().ok()) else { continue };
            for tile in fs::read_dir(column.path())?.flatten() {
                if let Some(y) = tile.path().file_stem().and_then(|s| s.to_str()).and_then(|s| s.parse::<u64>().ok()) {
                    found.push((x << z) + y);
                }
            }
        }
        found.sort_unstable();
        index.insert(z.to_string(), json!(found));
    }
    fs::write(out.join("index.json"), serde_json::to_vec(&index)?)?;
    Ok(())
}

/// How many nodes the map's picture shows.
pub(super) const PICTURE_NODES: usize = 1600;

/// A longer line would cross the picture and hide its shape.
pub(super) const PICTURE_LINK: f32 = 110.0;

/// A picture of the map, for the home page: the best-connected nodes in their inks, and the links
/// between them. A zero-length round stroke is a dot, so a thousand dots are one short path per ink.
pub(super) fn write_picture(g: &WorldGraph, spec: &Spec, p: &Placed, square: &Square, out: &Path) -> Result<()> {
    // a fair sample of the map, best known first: the whole map's shape, not its few great hubs
    let step = (p.rank.len() / PICTURE_NODES).max(1);
    let top: Vec<u32> = p.rank.iter().step_by(step).copied().collect();
    let shown: HashMap<u32, usize> = top.iter().enumerate().map(|(i, &n)| (n, i)).collect();
    let (x0, y0, x1, y1) = top.iter().fold((f32::MAX, f32::MAX, f32::MIN, f32::MIN), |b, &n| {
        let q = square.nodes[n as usize];
        (b.0.min(q[0]), b.1.min(q[1]), b.2.max(q[0]), b.3.max(q[1]))
    });
    let scale = 960.0 / (x1 - x0).max(y1 - y0).max(1e-6);
    let at = |n: u32| {
        let q = square.nodes[n as usize];
        (20.0 + (q[0] - x0) * scale, 20.0 + (q[1] - y0) * scale)
    };
    let mut lines = String::new();
    for &(a, b, _) in &g.edges {
        if shown.contains_key(&a) && shown.contains_key(&b) && lines.len() < 6_000 {
            let ((ax, ay), (bx, by)) = (at(a), at(b));
            if (ax - bx).hypot(ay - by) > PICTURE_LINK {
                continue;
            }
            lines.push_str(&format!("M{ax:.0} {ay:.0}L{bx:.0} {by:.0}"));
        }
    }
    let mut dots: Vec<String> = vec![String::new(); spec.palette.len().max(1) * 3];
    for (i, &n) in top.iter().enumerate() {
        let (x, y) = at(n);
        let big = if i < 40 {
            0
        } else if i < 300 {
            1
        } else {
            2
        };
        dots[(g.color[n as usize] as usize % spec.palette.len().max(1)) * 3 + big].push_str(&format!("M{x:.0} {y:.0}h0"));
    }
    let mut svg = format!(
        r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000"><path d="{lines}" fill="none" stroke="#9a9dc4" stroke-opacity=".35" stroke-width="1"/>"##
    );
    for (i, d) in dots.iter().enumerate().filter(|(_, d)| !d.is_empty()) {
        let width = [17, 11, 7][i % 3];
        let ink = spec.palette.get(i / 3).map_or("#2346d6", String::as_str);
        svg.push_str(&format!(r#"<path d="{d}" stroke="{ink}" stroke-width="{width}" stroke-linecap="round"/>"#));
    }
    svg.push_str("</svg>");
    fs::write(out.join("picture.svg"), svg)?;
    Ok(())
}
