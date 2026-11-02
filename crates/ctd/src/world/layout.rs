//! Where each community and dot goes: pivot MDS for communities, then a k-d cut of the square, and
//! alignment with the previous build.

use super::*;

/// Shortest-path distances from `src` within one component (local indices); stronger links are shorter.
pub(super) fn bfs(src: usize, adj: &[Vec<(usize, f64)>]) -> Vec<f64> {
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
pub(super) fn pivot_mds(adj: &[Vec<(usize, f64)>], radius: &[f64]) -> Vec<[f64; 2]> {
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
    let cmat: Vec<Vec<f64>> = (0..npiv).map(|j| (0..k).map(|i| -0.5 * (sq[j][i] - row_mean[i] - col_mean[j] + all_mean)).collect()).collect();
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
pub(super) fn layout_clusters(size: &[usize], meta: &[(u32, u32, f32)]) -> (Vec<[f64; 2]>, Vec<f64>) {
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
    let (mut core, mut spiral) = (0.0f64, 0.0f64);
    for (ci, list) in comps.iter().enumerate() {
        let mut local_of = HashMap::with_capacity(list.len());
        for (li, &g) in list.iter().enumerate() {
            local_of.insert(g, li);
        }
        let ladj: Vec<Vec<(usize, f64)>> = list.iter().map(|&g| adj[g].iter().filter_map(|(v, len)| local_of.get(v).map(|&l| (l, *len))).collect()).collect();
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
        // place the component: the largest at the origin, the rest on one spiral around it, each
        // past the area of those before it. A real graph has a component per lonely entry, so a
        // place must cost the same however many came first. `separate` settles what still touches.
        let mut center = [0.0, 0.0];
        if ci == 0 {
            core = extent;
        } else {
            spiral += extent * extent;
            let d = core + extent + 2.2 * spiral.sqrt();
            let a = ci as f64 * GOLDEN;
            center = [d * a.cos(), d * a.sin()];
        }
        for (li, &g) in list.iter().enumerate() {
            pos[g] = [center[0] + local[li][0], center[1] + local[li][1]];
        }
    }
    if c > SPREAD_ABOVE {
        spread(&mut pos, &radius);
    }
    separate(&mut pos, &radius);
    (pos, radius)
}

/// Past this many communities the layout clumps: a few hubs pull everything together.
pub(super) const SPREAD_ABOVE: usize = 2000;

/// Evens out a clumped layout into one round world. A square is shared among the discs by their area,
/// then bent into a circle: what was near stays near, and there is no dense knot and no empty quarter.
pub(super) fn spread(pos: &mut [[f64; 2]], radius: &[f64]) {
    let area: Vec<f64> = radius.iter().map(|r| r * r).collect();
    let mut list: Vec<u32> = (0..pos.len() as u32).collect();
    let mut cell = vec![[0.0; 2]; pos.len()];
    halve(&mut list, pos, &area, [-1.0, -1.0, 2.0, 2.0], &mut cell);
    // a disc in a square cell leaves it this much room; the rest is the gaps between them
    let world = (4.2 * area.iter().sum::<f64>() / std::f64::consts::PI).sqrt();
    for (p, c) in pos.iter_mut().zip(&cell) {
        *p = square_to_circle(*c).map(|v| v * world);
    }
}

/// One step of sharing out: the half of the area nearest one end of the longer side takes that part of
/// the rectangle `[x, y, width, height]`, the other half the rest, and so on down to each single disc.
pub(super) fn halve(list: &mut [u32], pos: &[[f64; 2]], area: &[f64], [x, y, w, h]: [f64; 4], cell: &mut [[f64; 2]]) {
    if let [one] = list {
        cell[*one as usize] = [x + w / 2.0, y + h / 2.0];
        return;
    }
    let axis = usize::from(h > w);
    list.sort_unstable_by(|&a, &b| pos[a as usize][axis].total_cmp(&pos[b as usize][axis]).then(a.cmp(&b)));
    let total: f64 = list.iter().map(|&i| area[i as usize]).sum();
    let (mut cut, mut seen) = (1, area[list[0] as usize]);
    while cut + 1 < list.len() && seen + area[list[cut] as usize] / 2.0 < total / 2.0 {
        seen += area[list[cut] as usize];
        cut += 1;
    }
    let share = seen / total;
    let (near, far) = list.split_at_mut(cut);
    let (first, second) = if axis == 0 {
        ([x, y, w * share, h], [x + w * share, y, w * (1.0 - share), h])
    } else {
        ([x, y, w, h * share], [x, y + h * share, w, h * (1.0 - share)])
    };
    halve(near, pos, area, first, cell);
    halve(far, pos, area, second, cell);
}

/// The square from -1 to 1 onto the unit circle, keeping areas (Shirley and Chiu's concentric map).
pub(super) fn square_to_circle([a, b]: [f64; 2]) -> [f64; 2] {
    use std::f64::consts::FRAC_PI_4;
    if a == 0.0 && b == 0.0 {
        return [0.0, 0.0];
    }
    let (r, angle) = if a.abs() > b.abs() { (a, FRAC_PI_4 * b / a) } else { (b, 2.0 * FRAC_PI_4 - FRAC_PI_4 * a / b) };
    [r * angle.cos(), r * angle.sin()]
}

/// A uniform grid over discs, as a game's physics uses: a disc only meets those in the cells it
/// covers, so a round costs what touches rather than every pair. Each disc sits in each cell its box
/// covers; the few big discs cover many cells, the many small ones one or two.
pub(super) struct Grid {
    pub(super) cell: f64,
    pub(super) cells: HashMap<(i32, i32), Vec<u32>>,
}

impl Grid {
    pub(super) fn span(&self, p: [f64; 2], r: f64) -> impl Iterator<Item = (i32, i32)> + use<> {
        let cell = self.cell;
        let at = |v: f64| (v / cell).floor() as i32;
        let (x0, x1, y0, y1) = (at(p[0] - r), at(p[0] + r), at(p[1] - r), at(p[1] + r));
        (x0..=x1).flat_map(move |x| (y0..=y1).map(move |y| (x, y)))
    }

    pub(super) fn new(pos: &[[f64; 2]], reach: &[f64], cell: f64) -> Grid {
        let mut grid = Grid { cell, cells: HashMap::with_capacity(pos.len()) };
        for (i, (&p, &r)) in pos.iter().zip(reach).enumerate() {
            for key in grid.span(p, r) {
                grid.cells.entry(key).or_default().push(i as u32);
            }
        }
        grid
    }

    /// Discs that may touch one at `p` with reach `r`, in order, each once.
    pub(super) fn near(&self, p: [f64; 2], r: f64) -> Vec<u32> {
        let mut found: Vec<u32> = self.span(p, r).filter_map(|key| self.cells.get(&key)).flatten().copied().collect();
        found.sort_unstable();
        found.dedup();
        found
    }
}

/// Overlap removal: pushes discs apart until each pair clears the sum of their radii plus a margin.
pub(super) fn separate(pos: &mut [[f64; 2]], radius: &[f64]) {
    let c = pos.len();
    let reach: Vec<f64> = radius.iter().map(|r| r * 1.08).collect();
    // a cell about the size of most discs: smaller and each covers many, larger and each holds many
    let mut sizes = reach.clone();
    sizes.sort_by(|a, b| a.total_cmp(b));
    let cell = (sizes[sizes.len() * 9 / 10] * 2.0).max(1e-6);
    for _ in 0..80 {
        let snapshot = pos.to_vec();
        let grid = Grid::new(&snapshot, &reach, cell);
        let push: Vec<[f64; 2]> = (0..c)
            .into_par_iter()
            .map(|i| {
                let (mut px, mut py) = (0.0, 0.0);
                for j in grid.near(snapshot[i], reach[i]) {
                    let j = j as usize;
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
                        // two discs on one spot go opposite ways: the same way, they would travel together
                        let a = (i.min(j) * 7919 + i.max(j)) as f64 * GOLDEN;
                        let way = if i < j { 1.0 } else { -1.0 };
                        let (ux, uy) = if d > 1e-9 { (ex / d, ey / d) } else { (way * a.cos(), way * a.sin()) };
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
}

/// The fitted turn is snapped to this step (radians), so rebuilding unchanged content reproduces the
/// same angle exactly instead of drifting by float noise from build to build.
pub(super) const ANGLE_STEP: f64 = 1e-4;

/// Turns the new map (before normalisation) to the previous build's orientation: 2D Procrustes over
/// nodes present in both, rotation or mirror only. Scale and shift are left to the normalisation that
/// follows, so the map always fills the unit square; fitting them as well made the world shrink a
/// little with every edit. Returns the number of nodes compared.
pub(super) fn orient(pos: &mut [[f64; 2]], cpos: &mut [[f64; 2]], keys: &[String], prev: &HashMap<String, [f32; 2]>) -> usize {
    let pairs: Vec<([f64; 2], [f64; 2])> = keys.iter().enumerate().filter_map(|(i, k)| prev.get(k).map(|p| (pos[i], [p[0] as f64, p[1] as f64]))).collect();
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

pub(super) const SMALL_COMMUNITY: usize = 8;

/// Moves each entry of a small community to the larger one it is most tied to: a link counts for less
/// the more links its far end has, since sharing a country says little and a teacher says much.
pub(super) fn join_linked(comm: &mut [u32], size: &mut [usize], edges: &[(u32, u32, f32)]) {
    let mut links = vec![0f32; comm.len()];
    for &(a, b, _) in edges {
        links[a as usize] += 1.0;
        links[b as usize] += 1.0;
    }
    // news travels one link a round: entries of a small community that touch a large one go first
    for _ in 0..3 {
        let mut pull: HashMap<(u32, u32), f32> = HashMap::new();
        for &(a, b, w) in edges {
            for (from, to) in [(a, b), (b, a)] {
                let (small, large) = (comm[from as usize], comm[to as usize]);
                if size[small as usize] < SMALL_COMMUNITY && size[large as usize] >= SMALL_COMMUNITY {
                    *pull.entry((from, large)).or_default() += w / links[to as usize];
                }
            }
        }
        let mut best: HashMap<u32, (f32, u32)> = HashMap::new();
        for ((i, c), p) in pull {
            let e = best.entry(i).or_insert((p, c));
            if (p, std::cmp::Reverse(c)) > (e.0, std::cmp::Reverse(e.1)) {
                *e = (p, c);
            }
        }
        for (i, (_, c)) in best {
            size[comm[i as usize] as usize] -= 1;
            comm[i as usize] = c;
            size[c as usize] += 1;
        }
    }
}

/// Returns how many communities there now are; those holding gathered entries are the last ones.
pub(super) fn gather_small(comm: &mut [u32], nc: usize, edges: &[(u32, u32, f32)], color: &[u8]) -> (usize, Vec<Option<u8>>) {
    let mut size = vec![0usize; nc];
    for &c in comm.iter() {
        size[c as usize] += 1;
    }
    join_linked(comm, &mut size, edges);
    let mut next: Vec<u32> = vec![u32::MAX; nc];
    let mut kept = 0u32;
    for (c, &s) in size.iter().enumerate() {
        if s >= SMALL_COMMUNITY {
            next[c] = kept;
            kept += 1;
        }
    }
    let mut ink: HashMap<u32, u8> = HashMap::new();
    for (i, c) in comm.iter_mut().enumerate() {
        *c = match next[*c as usize] {
            u32::MAX => {
                ink.insert(kept + color[i] as u32, color[i]);
                kept + color[i] as u32
            }
            kept_as => kept_as,
        };
    }
    // community numbers stay in order of first use, so read back which disc holds which ink
    let before: Vec<u32> = comm.to_vec();
    let total = renumber(comm);
    let mut gathered = vec![None; total];
    for (old, new) in before.iter().zip(comm.iter()) {
        if let Some(&i) = ink.get(old) {
            gathered[*new as usize] = Some(i);
        }
    }
    (total, gathered)
}

/// The `j`th point of Roberts's R2 sequence, on the unit circle: however many are taken, the first ones
/// are spread evenly over it. It runs over the square first: in polar terms it would draw pinwheels.
pub(super) fn sprinkle(j: usize) -> [f64; 2] {
    let at = |step: f64| (0.5 + j as f64 * step).fract() * 2.0 - 1.0;
    square_to_circle([at(0.754_877_666_246_693), at(0.569_840_290_998_053)])
}

/// A disc smaller than this keeps the plain spiral: it can be read at a glance.
const MIN_DISC: usize = 40;
/// A branch smaller than this lies among its siblings: a cell of its own would be too thin to see.
const NEST: u32 = 8;
const MAX_DEPTH: u8 = 12;
/// This many children linked the same way make a part, with a name and one line to their parent.
const MIN_PART: usize = 12;
/// A link with no phrase in the vocabulary.
const UNNAMED: u32 = u32::MAX;

/// Parts with fewer members go unnamed on the map.
const NAMED_PART: usize = 24;

/// Children of one parent, linked to it the same way: "Born in Paris".
pub(super) struct Part {
    pub parent: u32,
    /// Index into `How::phrases`, and which way the phrase reads; UNNAMED: no name.
    pub how: u32,
    pub members: Vec<u32>,
}

/// Each disc as a tree, so that a dot sits beside what it links to.
pub(super) struct Tree {
    /// Its most specific link to something better known in its disc.
    pub parent: Vec<Option<u32>>,
    pub part_of: Vec<Option<u32>>,
    pub parts: Vec<Part>,
    /// Places on the unit disc, for discs laid out this way.
    unit: Vec<[f64; 2]>,
    pub laid_out: Vec<bool>,
    how: Vec<u32>,
    children: Vec<Vec<u32>>,
    size: Vec<u32>,
    rank_of: Vec<u32>,
}

/// Splits a rectangle in proportion to `sizes`, always across its longer side.
fn cut(sizes: &[f64], [x, y, w, h]: [f64; 4], out: &mut [[f64; 4]]) {
    if sizes.len() <= 1 {
        out.iter_mut().for_each(|r| *r = [x, y, w, h]);
        return;
    }
    let total: f64 = sizes.iter().sum();
    let (mut m, mut sum) = (1, sizes[0]);
    while m < sizes.len() - 1 && sum * 2.0 < total {
        sum += sizes[m];
        m += 1;
    }
    let f = sum / total;
    let (first, rest) = out.split_at_mut(m);
    if w >= h {
        cut(&sizes[..m], [x, y, w * f, h], first);
        cut(&sizes[m..], [x + w * f, y, w * (1.0 - f), h], rest);
    } else {
        cut(&sizes[..m], [x, y, w, h * f], first);
        cut(&sizes[m..], [x, y + h * f, w, h * (1.0 - f)], rest);
    }
}

impl Tree {
    /// Lays out every disc big enough. Each dot's parent is the least connected of the better-known
    /// entries it links to in its disc: the most specific thing that can be said of it, so a person
    /// goes to their school and the school to its city.
    pub(super) fn new(g: &WorldGraph, comm: &[u32], members: &[Vec<u32>], gathered: &[Option<u8>], rank: &[u32], rank_of: &[u32], count: &[u32]) -> Tree {
        let n = g.n;
        let laid_out: Vec<bool> = members.iter().zip(gathered).map(|(list, ink)| ink.is_none() && list.len() >= MIN_DISC).collect();
        let mut best: Vec<Option<(u32, u32, u32, u32)>> = vec![None; n];
        for (e, &(a, b, _)) in g.edges.iter().enumerate() {
            if comm[a as usize] != comm[b as usize] || !laid_out[comm[a as usize] as usize] || a == b {
                continue;
            }
            let (low, high) = if rank_of[a as usize] < rank_of[b as usize] { (b, a) } else { (a, b) };
            let named = g.how.as_ref().map(|h| h.relation[e]).filter(|&r| r != u16::MAX);
            let how = named.map_or(UNNAMED, |r| r as u32 * 2 + (low == b) as u32);
            let candidate = (count[high as usize], rank_of[high as usize], high, how);
            if best[low as usize].is_none_or(|x| (candidate.0, candidate.1) < (x.0, x.1)) {
                best[low as usize] = Some(candidate);
            }
        }
        let parent: Vec<Option<u32>> = best.iter().map(|b| b.map(|x| x.2)).collect();
        let how: Vec<u32> = best.iter().map(|b| b.map_or(UNNAMED, |x| x.3)).collect();
        let mut children = vec![Vec::new(); n];
        let mut size = vec![1u32; n];
        for &i in rank {
            if let Some(p) = parent[i as usize] {
                children[p as usize].push(i);
            }
        }
        for &i in rank.iter().rev() {
            if let Some(p) = parent[i as usize] {
                size[p as usize] += size[i as usize];
            }
        }
        let mut tree =
            Tree { parent, part_of: vec![None; n], parts: Vec::new(), unit: vec![[0.0; 2]; n], laid_out, how, children, size, rank_of: rank_of.to_vec() };
        for c in (0..members.len()).filter(|&c| members[c].len() >= MIN_DISC && gathered[c].is_none()) {
            let tops: Vec<u32> = members[c].iter().copied().filter(|&i| tree.parent[i as usize].is_none()).collect();
            tree.fill(&tops, [-1.0, -1.0, 2.0, 2.0], 0);
        }
        tree
    }

    /// What each part is called, for the viewer, once the map is in the unit square.
    pub(super) fn names(&self, g: &WorldGraph, anchors: &[[f32; 2]], p: &Placed, radii: &[f32]) -> Vec<Value> {
        let (Some(how), Some(labels)) = (&g.how, &g.labels) else { return Vec::new() };
        let mut rows: Vec<(usize, Value)> = Vec::new();
        for (part, &[x, y]) in self.parts.iter().zip(anchors).filter(|(part, _)| part.how != UNNAMED && part.members.len() >= NAMED_PART) {
            let phrase = &how.phrases[(part.how / 2) as usize][(part.how % 2) as usize];
            let mut word = phrase.chars();
            let Some(first) = word.next() else { continue };
            let text = format!("{}{} {}", first.to_uppercase(), word.as_str(), labels[part.parent as usize]);
            let disc = p.comm[part.parent as usize] as usize;
            let reach = radii[disc] * (part.members.len() as f32 / p.members[disc].len() as f32).sqrt();
            let round = |v: f32| (v as f64 * 1e5).round() / 1e5;
            rows.push((part.members.len(), json!([text, round(x), round(y), round(reach)])));
        }
        rows.sort_by_key(|r| std::cmp::Reverse(r.0));
        rows.into_iter().map(|r| r.1).collect()
    }

    /// Where a node of a laid-out disc goes on the unit disc.
    pub(super) fn at(&self, i: u32) -> [f64; 2] {
        self.unit[i as usize]
    }

    /// Siblings in a rectangle: each big branch gets a cell by its size, and the rest share one.
    fn fill(&mut self, list: &[u32], rect: [f64; 4], depth: u8) {
        let (mut big, small): (Vec<u32>, Vec<u32>) = list.iter().partition(|&&i| self.size[i as usize] >= NEST && depth < MAX_DEPTH);
        big.sort_by_key(|&i| (std::cmp::Reverse(self.size[i as usize]), self.rank_of[i as usize]));
        let mut rest = Vec::new();
        small.iter().for_each(|&i| self.gather(i, &mut rest));
        rest.sort_by_key(|&i| self.rank_of[i as usize]);
        let mut sizes: Vec<f64> = big.iter().map(|&i| self.size[i as usize] as f64).collect();
        if !rest.is_empty() {
            sizes.push(rest.len() as f64);
        }
        let mut cells = vec![[0.0; 4]; sizes.len()];
        cut(&sizes, rect, &mut cells);
        for (&i, &cell) in big.iter().zip(&cells) {
            self.branch(i, cell, depth);
        }
        if let (false, Some(&[x, y, w, h])) = (rest.is_empty(), cells.last()) {
            for (j, &i) in rest.iter().enumerate() {
                let [u, v] = sprinkle(j).map(|c| (c + 1.0) / 2.0);
                self.unit[i as usize] = square_to_circle([x + u * w, y + v * h]);
            }
        }
    }

    /// A node in the middle of its cell, with its children around it, each way of linking in a cell.
    fn branch(&mut self, i: u32, [x, y, w, h]: [f64; 4], depth: u8) {
        self.unit[i as usize] = square_to_circle([x + w / 2.0, y + h / 2.0]);
        let mut ways: Vec<(u32, Vec<u32>)> = Vec::new();
        for k in 0..self.children[i as usize].len() {
            let child = self.children[i as usize][k];
            let how = self.how[child as usize];
            match ways.iter_mut().find(|w| w.0 == how) {
                Some(way) => way.1.push(child),
                None => ways.push((how, vec![child])),
            }
        }
        let weight = |list: &[u32], size: &[u32]| list.iter().map(|&c| size[c as usize] as u64).sum::<u64>();
        ways.sort_by_key(|(how, list)| (std::cmp::Reverse(weight(list, &self.size)), *how));
        let sizes: Vec<f64> = ways.iter().map(|(_, list)| weight(list, &self.size) as f64).collect();
        let mut cells = vec![[0.0; 4]; sizes.len()];
        cut(&sizes, [x, y, w, h], &mut cells);
        for ((how, list), cell) in ways.into_iter().zip(cells) {
            if how != UNNAMED && list.len() >= MIN_PART {
                let at = self.parts.len() as u32;
                list.iter().for_each(|&c| self.part_of[c as usize] = Some(at));
                self.parts.push(Part { parent: i, how, members: list.clone() });
            }
            self.fill(&list, cell, depth + 1);
        }
    }

    /// A node and all below it.
    fn gather(&self, i: u32, out: &mut Vec<u32>) {
        out.push(i);
        self.children[i as usize].iter().for_each(|&c| self.gather(c, out));
    }
}
