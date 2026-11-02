//! Communities: Louvain over the graph, in compressed adjacency.

use super::*;

pub(super) struct Csr {
    pub(super) off: Vec<usize>,
    pub(super) tgt: Vec<u32>,
    pub(super) wt: Vec<f32>,
}

pub(super) fn csr(n: usize, edges: &[(u32, u32, f32)]) -> Csr {
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
pub(super) fn louvain(n: usize, g: &Csr, passes: usize) -> Vec<u32> {
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
pub(super) fn renumber(comm: &mut [u32]) -> usize {
    let mut map: HashMap<u32, u32> = HashMap::new();
    for c in comm.iter_mut() {
        let next = map.len() as u32;
        *c = *map.entry(*c).or_insert(next);
    }
    map.len()
}

/// Sums edge weights between communities (self loops dropped).
pub(super) fn meta_edges(comm: &[u32], edges: &[(u32, u32, f32)]) -> Vec<(u32, u32, f32)> {
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
pub(super) fn cluster(n: usize, edges: &[(u32, u32, f32)]) -> (Vec<u32>, usize) {
    let g = csr(n, edges);
    let mut comm = louvain(n, &g, 10);
    let nc = renumber(&mut comm);
    (comm, nc)
}
