//! Path ranking: "how is A connected to B?"
//!
//! cost(hop) = w_rel × (1 + β·(1 − p)) + λ·½·(ln(1+deg_rel(u)) + ln(1+deg_rel(v)))
//! with all parameters from `content/methodology/paths.yaml`. Diverse alternatives come from
//! the penalty method: every intermediate node of an earlier path costs `reuse_penalty` more.

use std::{
    cmp::Ordering,
    collections::{BinaryHeap, HashMap},
};

use serde_json::Value;

use crate::kb::{Edge, Kb};

#[derive(Debug, Clone)]
pub struct Hop<'a> {
    pub edge: &'a Edge,
    /// True when the hop follows the edge in its stated direction (from → to).
    pub forward: bool,
    pub cost: f64,
}

#[derive(Debug, Clone)]
pub struct Path<'a> {
    pub nodes: Vec<String>,
    pub hops: Vec<Hop<'a>>,
    pub cost: f64,
}

pub struct Options {
    pub k: usize,
    pub include_passive: bool,
    pub max_hops: usize,
}

impl Options {
    /// The routes generated stories and the home page draw: the best `k`, without index-fund holdings,
    /// at most `max_hops` steps (content/methodology/paths.yaml, as in the explorer).
    pub fn stories(kb: &Kb, k: usize) -> Options {
        let max_hops = kb.schema.methodology.get("max_hops").and_then(Value::as_u64).map_or(10, |n| n as usize).max(1);
        Options { k, include_passive: false, max_hops }
    }
}

/// The ranking parameters from `content/methodology/paths.yaml`.
pub(crate) struct Params {
    beta: f64,
    lambda: f64,
    reuse_penalty: f64,
    default_weight: f64,
    weights: HashMap<String, f64>,
    evidence: HashMap<String, f64>,
    draft_factor: f64,
}

fn num(v: &Value, key: &str, default: f64) -> f64 {
    v.get(key).and_then(Value::as_f64).unwrap_or(default)
}

impl Params {
    pub(crate) fn from(m: &Value) -> Params {
        let map = |key: &str| -> HashMap<String, f64> {
            m.get(key)
                .and_then(Value::as_object)
                .map(|o| o.iter().filter_map(|(k, v)| v.as_f64().map(|f| (k.clone(), f))).collect())
                .unwrap_or_default()
        };
        let evidence_v = m.get("evidence").cloned().unwrap_or(Value::Null);
        Params {
            beta: num(m, "beta", 1.0),
            lambda: num(m, "lambda", 1.0),
            reuse_penalty: num(m, "reuse_penalty", 3.0),
            default_weight: num(m, "default_weight", 2.0),
            weights: map("weights"),
            evidence: map("evidence"),
            draft_factor: num(&evidence_v, "draft_factor", 0.5),
        }
    }

    /// What a link costs by itself: its relation's weight, raised when its evidence is weak
    /// (w_rel × (1 + β·(1 − p))). Routes add the hub term; answers rank their lines by this alone.
    pub(crate) fn link_cost(&self, e: &Edge) -> f64 {
        let w = self.weights.get(&e.rel).copied().unwrap_or(self.default_weight);
        let mut evidence = e.tier.as_ref().and_then(|t| self.evidence.get(t)).copied().unwrap_or(0.4);
        if e.status == "draft" {
            evidence *= self.draft_factor;
        }
        w * (1.0 + self.beta * (1.0 - evidence))
    }
}

#[derive(PartialEq)]
struct State {
    cost: f64,
    node: usize,
    hops: usize,
}

impl Eq for State {}

impl Ord for State {
    fn cmp(&self, other: &Self) -> Ordering {
        other.cost.total_cmp(&self.cost).then_with(|| other.node.cmp(&self.node))
    }
}

impl PartialOrd for State {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

pub fn find<'a>(kb: &'a Kb, from: &str, to: &str, opts: &Options) -> Vec<Path<'a>> {
    let p = Params::from(&kb.schema.methodology);
    let (Some(&s), Some(&t)) = (kb.index.get(from), kb.index.get(to)) else { return Vec::new() };
    if s == t {
        return Vec::new(); // a route needs two ends
    }

    let usable: Vec<&Edge> = kb
        .edges
        .iter()
        .filter(|e| e.traversable && e.status != "deprecated" && (opts.include_passive || !e.passive))
        .collect();
    let mut deg: HashMap<(usize, &str), usize> = HashMap::new();
    for e in &usable {
        for n in [&e.from, &e.to] {
            *deg.entry((kb.index[n.as_str()], e.rel.as_str())).or_default() += 1;
        }
    }
    let mut adj: Vec<Vec<(usize, usize, bool, f64)>> = vec![Vec::new(); kb.entities.len()];
    for (ei, e) in usable.iter().enumerate() {
        let (u, v) = (kb.index[e.from.as_str()], kb.index[e.to.as_str()]);
        let hub = 0.5
            * (((1 + deg[&(u, e.rel.as_str())]) as f64).ln() + ((1 + deg[&(v, e.rel.as_str())]) as f64).ln());
        let cost = p.link_cost(e) + p.lambda * hub;
        adj[u].push((v, ei, true, cost));
        adj[v].push((u, ei, false, cost));
    }

    // Same rounds as the explorer (web/src/lib/paths.ts): up to 3k searches for k distinct routes.
    // A route found again (e.g. a direct deal with one intermediate) makes its links costlier too,
    // so costlier but different threads still surface instead of the search stopping early.
    let mut penalty = vec![0.0f64; kb.entities.len()];
    let mut pair_uses: HashMap<(usize, usize), f64> = HashMap::new();
    let pair = |a: usize, b: usize| if a < b { (a, b) } else { (b, a) };
    let mut found: Vec<Path<'a>> = Vec::new();
    for _ in 0..opts.k * 3 {
        if found.len() >= opts.k {
            break;
        }
        let n = kb.entities.len();
        let mut dist = vec![f64::INFINITY; n];
        let mut prev: Vec<Option<(usize, usize, bool, f64)>> = vec![None; n];
        let mut heap = BinaryHeap::new();
        dist[s] = 0.0;
        heap.push(State { cost: 0.0, node: s, hops: 0 });
        while let Some(State { cost, node, hops }) = heap.pop() {
            if node == t {
                break;
            }
            if cost > dist[node] || hops >= opts.max_hops {
                continue;
            }
            for &(next, ei, fwd, c) in &adj[node] {
                let step = c
                    + if next == t { 0.0 } else { penalty[next] }
                    + pair_uses.get(&pair(node, next)).copied().unwrap_or(0.0);
                let nd = cost + step;
                if nd < dist[next] {
                    dist[next] = nd;
                    prev[next] = Some((node, ei, fwd, c));
                    heap.push(State { cost: nd, node: next, hops: hops + 1 });
                }
            }
        }
        if !dist[t].is_finite() {
            break;
        }
        let mut hops = Vec::new();
        let mut nodes = vec![kb.entities[t].id.clone()];
        let mut cur = t;
        while let Some((pn, ei, fwd, c)) = prev[cur] {
            hops.push(Hop { edge: usable[ei], forward: fwd, cost: c });
            nodes.push(kb.entities[pn].id.clone());
            cur = pn;
        }
        hops.reverse();
        nodes.reverse();
        let cost: f64 = hops.iter().map(|h| h.cost).sum();
        for id in &nodes[1..nodes.len() - 1] {
            penalty[kb.index[id.as_str()]] += p.reuse_penalty;
        }
        if found.iter().any(|f| f.nodes == nodes) {
            for w in nodes.windows(2) {
                *pair_uses.entry(pair(kb.index[w[0].as_str()], kb.index[w[1].as_str()])).or_default() += p.reuse_penalty;
            }
            continue;
        }
        found.push(Path { nodes, hops, cost });
    }
    found.sort_by(|a, b| a.cost.total_cmp(&b.cost));
    found
}

/// One readable line per hop, e.g. "Moses — regarded as a prophet in → Islam (1962) [T1] according to Islam".
pub fn describe(kb: &Kb, hop: &Hop) -> String {
    let e = hop.edge;
    let rel = &kb.schema.relations[&e.rel];
    let (a, b, verb) = if hop.forward { (&e.from, &e.to, &rel.label) } else { (&e.to, &e.from, &rel.inverse) };
    let mut s = format!("{} — {} → {}", kb.name_of(a), verb, kb.name_of(b));
    if let Some(w) = &e.when {
        s.push_str(&format!(" ({})", w.label));
    }
    if let Some(t) = &e.tier {
        s.push_str(&format!(" [{t}]"));
    }
    if !e.according_to.is_empty() {
        let names: Vec<String> = e.according_to.iter().map(|a| kb.name_of(a)).collect();
        s.push_str(&format!(" according to {}", names.join(", ")));
    }
    if e.status == "draft" {
        s.push_str(" (draft)");
    }
    s
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testkit::{entity, file, load, source};

    #[test]
    fn route_costs_follow_the_published_formula() {
        let (kb, _) = load(
            "paths-golden",
            &[
                file("content/methodology/paths.yaml", "version: test\nbeta: 1.0\nlambda: 1.0\nweights: {founded: 1.0}\nevidence: {T1: 1.0, T2: 0.8}\n"),
                entity("person", "ann", "Ann", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n"),
                entity("person", "bob", "Bob", "  - {id: c1, rel: founded, to: acme, src: [{s: press}]}\n"),
                entity("org", "acme", "Acme", ""),
                source("rec", "T1"),
                source("press", "T2"),
            ],
        );
        let p = &find(&kb, "ann", "bob", &Options::stories(&kb, 1))[0];
        // each hop: w × (1 + β(1 − p)) + λ·½(ln(1 + deg) + ln(1 + deg)); Acme has two founders
        let hub = 0.5 * (2f64.ln() + 3f64.ln());
        assert!((p.cost - ((1.0 + hub) + (1.2 + hub))).abs() < 1e-12, "{}", p.cost);
        let link = Params::from(&kb.schema.methodology);
        assert_eq!(p.hops.iter().map(|h| link.link_cost(h.edge)).collect::<Vec<_>>(), [1.0, 1.2]);
    }

    #[test]
    fn no_route_from_an_entity_to_itself() {
        let (kb, _) = load(
            "paths-self",
            &[
                entity("person", "ann", "Ann", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n"),
                entity("org", "acme", "Acme", ""),
                source("rec", "T1"),
            ],
        );
        let opts = Options::stories(&kb, 3);
        assert!(find(&kb, "ann", "ann", &opts).is_empty());
        assert_eq!(find(&kb, "ann", "acme", &opts)[0].hops.len(), 1);
    }
}
