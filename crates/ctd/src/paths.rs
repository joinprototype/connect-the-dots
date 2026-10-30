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

/// Costs this close are equal: sums in a different order differ in the last bits.
const EPS: f64 = 1e-9;

/// A place in the search: a node, reached in so many hops at such a cost. The search keeps one per
/// (node, hops), as the explorer's does, because a cheap way to a node can use up the hops that a
/// dearer way would leave for the rest of the route.
struct Label<'a> {
    rank: i64,
    hops: usize,
    /// Breaks ties on ids, so results are the same on every run: (node, link).
    tie: (&'a str, &'a str),
    node: usize,
    /// Where this label is in the search's trail.
    at: usize,
}

impl Label<'_> {
    fn key(&self) -> (i64, usize, (&str, &str)) {
        (self.rank, self.hops, self.tie)
    }
}

impl PartialEq for Label<'_> {
    fn eq(&self, other: &Self) -> bool {
        self.key() == other.key()
    }
}

impl Eq for Label<'_> {}

impl Ord for Label<'_> {
    /// Reversed, so the heap gives the cheapest first.
    fn cmp(&self, other: &Self) -> Ordering {
        other.key().cmp(&self.key())
    }
}

impl PartialOrd for Label<'_> {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

/// One way out of a node.
#[derive(Clone, Copy)]
struct Arc {
    to: usize,
    edge: usize,
    forward: bool,
    cost: f64,
}

/// The cheapest route from `s` to `t` in at most `max_hops`, as its arcs. `step` is what taking an
/// arc from a node adds to its cost: the penalties of earlier routes.
fn search(adj: &[Vec<Arc>], ids: &[&str], edge_ids: &[&str], s: usize, t: usize, max_hops: usize, step: impl Fn(usize, usize) -> f64) -> Option<Vec<Arc>> {
    let mut best: Vec<Vec<f64>> = vec![Vec::new(); adj.len()];
    let record = |best: &mut Vec<Vec<f64>>, n: usize, hops: usize, cost: f64| {
        if best[n].len() <= hops {
            best[n].resize(hops + 1, f64::INFINITY);
        }
        best[n][hops] = cost;
    };
    // the trail: each label's arc and the label before it
    let mut trail: Vec<(Option<usize>, Option<Arc>, f64)> = vec![(None, None, 0.0)];
    let mut heap = BinaryHeap::new();
    record(&mut best, s, 0, 0.0);
    heap.push(Label { rank: 0, hops: 0, tie: (ids[s], ""), node: s, at: 0 });
    while let Some(Label { hops, node, at, .. }) = heap.pop() {
        if node == t {
            let mut arcs = Vec::new();
            let mut cur = at;
            while let (Some(prev), Some(arc), _) = trail[cur] {
                arcs.push(arc);
                cur = prev;
            }
            arcs.reverse();
            return Some(arcs);
        }
        let cost = trail[at].2;
        if hops >= max_hops || best[node].get(hops).is_some_and(|&b| b < cost - EPS) {
            continue;
        }
        for &arc in &adj[node] {
            if arc.to == s {
                continue;
            }
            let (next, h) = (cost + arc.cost + step(node, arc.to), hops + 1);
            if best[arc.to].iter().take(h + 1).any(|&b| b <= next + EPS) {
                continue;
            }
            record(&mut best, arc.to, h, next);
            trail.push((Some(at), Some(arc), next));
            heap.push(Label { rank: (next / EPS).round() as i64, hops: h, tie: (ids[arc.to], edge_ids[arc.edge]), node: arc.to, at: trail.len() - 1 });
        }
    }
    None
}

pub fn find<'a>(kb: &'a Kb, from: &str, to: &str, opts: &Options) -> Vec<Path<'a>> {
    let p = Params::from(&kb.schema.methodology);
    let (Some(&s), Some(&t)) = (kb.index.get(from), kb.index.get(to)) else { return Vec::new() };
    if s == t {
        return Vec::new(); // a route needs two ends
    }

    // by id, as the explorer reads them: ties then fall the same way
    let mut usable: Vec<&Edge> = kb
        .edges
        .iter()
        .filter(|e| e.traversable && e.status != "deprecated" && (opts.include_passive || !e.passive))
        .collect();
    usable.sort_by(|a, b| a.id.cmp(&b.id));
    let mut deg: HashMap<(usize, &str), usize> = HashMap::new();
    for e in &usable {
        for n in [&e.from, &e.to] {
            *deg.entry((kb.index[n.as_str()], e.rel.as_str())).or_default() += 1;
        }
    }
    let mut adj: Vec<Vec<Arc>> = vec![Vec::new(); kb.entities.len()];
    for (ei, e) in usable.iter().enumerate() {
        let (u, v) = (kb.index[e.from.as_str()], kb.index[e.to.as_str()]);
        let hub = 0.5
            * (((1 + deg[&(u, e.rel.as_str())]) as f64).ln() + ((1 + deg[&(v, e.rel.as_str())]) as f64).ln());
        let cost = p.link_cost(e) + p.lambda * hub;
        adj[u].push(Arc { to: v, edge: ei, forward: true, cost });
        adj[v].push(Arc { to: u, edge: ei, forward: false, cost });
    }
    let ids: Vec<&str> = kb.entities.iter().map(|e| e.id.as_str()).collect();
    let edge_ids: Vec<&str> = usable.iter().map(|e| e.id.as_str()).collect();

    // Same rounds as the explorer (web/src/lib/paths.ts): up to 3k searches for k distinct routes.
    // A route found again (e.g. a direct deal with one intermediate) makes its links costlier too,
    // so costlier but different threads still surface instead of the search stopping early.
    // tools/qa/paths-golden.mjs checks that the two agree.
    let mut penalty = vec![0.0f64; kb.entities.len()];
    let mut pair_uses: HashMap<(usize, usize), f64> = HashMap::new();
    let pair = |a: usize, b: usize| if a < b { (a, b) } else { (b, a) };
    let mut found: Vec<Path<'a>> = Vec::new();
    for _ in 0..opts.k * 3 {
        if found.len() >= opts.k {
            break;
        }
        let step = |from: usize, to: usize| (if to == t { 0.0 } else { penalty[to] }) + pair_uses.get(&pair(from, to)).copied().unwrap_or(0.0);
        let Some(arcs) = search(&adj, &ids, &edge_ids, s, t, opts.max_hops, step) else { break };
        let mut nodes = vec![kb.entities[s].id.clone()];
        nodes.extend(arcs.iter().map(|a| kb.entities[a.to].id.clone()));
        let hops: Vec<Hop<'a>> = arcs.iter().map(|a| Hop { edge: usable[a.edge], forward: a.forward, cost: a.cost }).collect();
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
    found.sort_by(|a, b| {
        let by_cost = if (a.cost - b.cost).abs() > EPS { a.cost.total_cmp(&b.cost) } else { Ordering::Equal };
        by_cost.then(a.hops.len().cmp(&b.hops.len())).then_with(|| a.nodes.cmp(&b.nodes))
    });
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

    #[test]
    fn a_cheap_long_way_does_not_use_up_the_hops_of_a_dear_short_one() {
        let (kb, _) = load(
            "paths-hops",
            &[
                file("content/schema/relations.yaml", "founded: {label: founded, inverse: founded by, from: [org], to: [org], layers: [power]}\nfunded: {label: funded, inverse: funded by, from: [org], to: [org], layers: [power]}\n"),
                file("content/methodology/paths.yaml", "version: test\nweights: {founded: 1, funded: 20}\n"),
                source("rec", "T1"),
                entity("org", "start", "Start", "  - {id: c1, rel: funded, to: mid, src: [{s: rec}]}\n  - {id: c2, rel: founded, to: cheap, src: [{s: rec}]}\n"),
                entity("org", "cheap", "Cheap", "  - {id: c1, rel: founded, to: mid, src: [{s: rec}]}\n"),
                entity("org", "mid", "Mid", "  - {id: c1, rel: founded, to: goal, src: [{s: rec}]}\n"),
                entity("org", "goal", "Goal", ""),
            ],
        );
        // the cheapest way to Mid takes two hops, so only the dear one leaves a hop for Goal
        let routes = super::find(&kb, "start", "goal", &super::Options { k: 1, include_passive: false, max_hops: 2 });
        assert_eq!(routes.len(), 1, "a route of two hops exists");
        assert_eq!(routes[0].nodes, ["start", "mid", "goal"]);
    }
}
