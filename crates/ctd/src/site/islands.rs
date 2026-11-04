//! `data/islands.json`, the Stories page's one surface: every written story is an island, and every entry is
//! a dot on it or in the water between. All of it is settled here, so the page only draws numbers, and the same
//! content gives the same picture.
//!
//! An island's name sits over its land, so only what a story is about lies on it: an entry no other story tells
//! of, and for a person, one a scene of that story is about. Whoever is shared, or merely mentioned, floats in
//! the water near the stories that name them. A sealed entry, a people and a faith never lie on land, never
//! join two stories and are on no story's trail (ADR-0016, ADR-0027).

use std::collections::{BTreeMap, BTreeSet, HashMap};

use serde_json::{Value, json};

use super::data;
use crate::{
    covers,
    kb::{Chapter, Edge, Entity, Kb, shot_entries},
};

/// The file's budget in gzip bytes.
pub const BUDGET: usize = 100 * 1024;
/// The map, in the file's units: a window's shape, which a phone holds by its height and pans across.
const WIDTH: f64 = 6000.0;
const HEIGHT: f64 = 4100.0;
/// How much of the map the islands and their shores cover; the rest is open water.
const FILL: f64 = 0.5;
/// How far land reaches around a dot on it, in dot spacings.
const COAST: f64 = 0.9;
/// The water a dot keeps from the land, in dot spacings.
const OFFSHORE: f64 = 0.7;
/// The lines an island keeps, strongest first. Only the first shows until the island is picked.
const LINES: usize = 5;
/// Rounds of settling for the dots of an island, for the islands on the map, and for the dots in the water.
const DOT_ROUNDS: usize = 240;
const ISLAND_ROUNDS: usize = 3000;
const SEA_ROUNDS: usize = 300;
/// The turn between neighbours in a seed head.
const GOLDEN: f64 = 2.399_963_229_728_653;

/// What one story names: its entries in order of first appearance, how many scenes each is in and is the focus
/// of, the links between them, which entries followed each other from scene to scene, and its trail, the
/// subject of each scene in order.
#[derive(Default)]
struct Isle<'a> {
    ids: Vec<&'a str>,
    scenes: Vec<usize>,
    focus: Vec<usize>,
    links: BTreeSet<(usize, usize)>,
    steps: BTreeSet<(usize, usize)>,
    trail: Vec<usize>,
}

fn pair(a: usize, b: usize) -> (usize, usize) {
    (a.min(b), a.max(b))
}

fn reveals<'a>(kb: &Kb, by_id: &BTreeMap<&'a str, &'a Edge>, ch: &'a Chapter) -> Isle<'a> {
    let mut isle = Isle::default();
    let mut at: BTreeMap<&str, usize> = BTreeMap::new();
    for shot in &ch.shots {
        let links = data::revealed(by_id, shot);
        let ends = links.values().flat_map(|e| [e.from.as_str(), e.to.as_str()]);
        let here: BTreeSet<&str> = shot_entries(shot).map(|(_, id)| id).chain(ends).filter(|id| kb.entity(id).is_some()).collect();
        for &id in &here {
            let i = *at.entry(id).or_insert_with(|| {
                isle.ids.push(id);
                isle.scenes.push(0);
                isle.focus.push(0);
                isle.ids.len() - 1
            });
            isle.scenes[i] += 1;
        }
        for e in links.values() {
            if let (Some(&a), Some(&b)) = (at.get(e.from.as_str()), at.get(e.to.as_str()))
                && a != b
            {
                isle.links.insert(pair(a, b));
            }
        }
        // the scene's subject: its focus, else the first entry it names
        let focus = shot["focus"].as_str().and_then(|id| at.get(id).copied());
        if let Some(f) = focus {
            isle.focus[f] += 1;
        }
        let subject = focus.or_else(|| shot_entries(shot).find_map(|(_, id)| at.get(id).copied()));
        if let Some(s) = subject {
            if let Some(&last) = isle.trail.last()
                && last != s
            {
                isle.steps.insert(pair(last, s));
            }
            if isle.trail.last() != Some(&s) {
                isle.trail.push(s);
            }
        }
    }
    isle
}

fn sub(a: [f64; 2], b: [f64; 2]) -> [f64; 2] {
    [a[0] - b[0], a[1] - b[1]]
}

fn length(d: [f64; 2]) -> f64 {
    d[0].hypot(d[1]).max(1e-6)
}

/// Where an island's dots lie inside a circle of radius 1. Linked dots lie near each other, as many scenes as
/// an entry is in bring it towards the middle, and the dots fill the circle evenly.
fn arrange(scenes: &[usize], springs: &[(usize, usize, f64)], turn: f64) -> Vec<[f64; 2]> {
    let n = scenes.len();
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by_key(|&i| (std::cmp::Reverse(scenes[i]), i));
    let mut p = vec![[0.0; 2]; n];
    for (rank, &i) in order.iter().enumerate() {
        let (r, a) = (0.6 * ((rank as f64 + 0.5) / n as f64).sqrt(), turn + rank as f64 * GOLDEN);
        p[i] = [r * a.cos(), r * a.sin()];
    }
    let mut degree = vec![0.0_f64; n];
    for &(a, b, w) in springs {
        degree[a] += w;
        degree[b] += w;
    }
    let mass: Vec<f64> = degree.iter().map(|d| 1.0 + d.sqrt() * 0.6).collect();
    for round in 0..DOT_ROUNDS {
        let mut v = vec![[0.0; 2]; n];
        for i in 0..n {
            for j in i + 1..n {
                let d = sub(p[j], p[i]);
                let f = 0.03 * mass[i] * mass[j] / (d[0] * d[0] + d[1] * d[1] + 0.004);
                v[i] = [v[i][0] - d[0] * f, v[i][1] - d[1] * f];
                v[j] = [v[j][0] + d[0] * f, v[j][1] + d[1] * f];
            }
        }
        for &(a, b, w) in springs {
            let d = sub(p[b], p[a]);
            let len = length(d);
            let f = 0.18 * w * (len - 0.18) / len;
            v[a] = [v[a][0] + d[0] * f, v[a][1] + d[1] * f];
            v[b] = [v[b][0] - d[0] * f, v[b][1] - d[1] * f];
        }
        let limit = 3.0 * (0.05 * (1.0 - round as f64 / DOT_ROUNDS as f64) + 0.004);
        for i in 0..n {
            let g = [v[i][0] - 0.1 * p[i][0], v[i][1] - 0.1 * p[i][1]];
            let step = (limit / length(g)).min(3.0);
            p[i] = [p[i][0] + g[0] * step, p[i][1] + g[1] * step];
        }
    }
    if n > 0 {
        even_out(&mut p);
    }
    let apart = 1.1 / (n.max(1) as f64).sqrt();
    for _ in 0..30 {
        for i in 0..n {
            for j in i + 1..n {
                let d = sub(p[j], p[i]);
                let len = length(d);
                if len < apart {
                    let f = (apart - len) / len / 2.0;
                    p[i] = [p[i][0] - d[0] * f, p[i][1] - d[1] * f];
                    p[j] = [p[j][0] + d[0] * f, p[j][1] + d[1] * f];
                }
            }
        }
        for q in &mut p {
            let r = length(*q).max(1.0);
            *q = [q[0] / r, q[1] / r];
        }
    }
    p
}

/// Centres the dots and draws each halfway to where a filled circle would have it.
fn even_out(p: &mut [[f64; 2]]) {
    let n = p.len() as f64;
    let mid = p.iter().fold([0.0; 2], |m, q| [m[0] + q[0] / n, m[1] + q[1] / n]);
    let radius: Vec<f64> = p.iter().map(|&q| length(sub(q, mid))).collect();
    let far = radius.iter().copied().fold(1e-6, f64::max);
    let mut order: Vec<usize> = (0..p.len()).collect();
    order.sort_by(|&a, &b| radius[a].total_cmp(&radius[b]).then(a.cmp(&b)));
    for (rank, &i) in order.iter().enumerate() {
        let r = 0.5 * ((rank as f64 + 0.6) / n).sqrt() + 0.5 * radius[i] / far;
        let d = sub(p[i], mid);
        p[i] = [d[0] / radius[i] * r, d[1] / radius[i] * r];
    }
}

/// Where each island lies on the map. Islands start small, so that they can pass each other on the way to the
/// islands they share most with, and grow until they stop touching.
fn pack(radii: &[f64], pull: &BTreeMap<(usize, usize), f64>, start: Vec<[f64; 2]>, [w, h]: [f64; 2]) -> Vec<[f64; 2]> {
    let n = radii.len();
    let gap = w.min(h) * 0.014;
    let mid = [w / 2.0, h / 2.0];
    // a long map would otherwise leave its ends empty: the pull to the middle runs across it
    let across = [0.0015 * (h / w).min(1.0).powi(2), 0.0015 * (w / h).min(1.0).powi(2)];
    let mut c = start;
    for round in 0..ISLAND_ROUNDS {
        let t = round as f64 / ISLAND_ROUNDS as f64;
        let grow = (0.3 + t / 0.6).min(1.0);
        let settled = t > 0.75;
        let mut f = vec![[0.0; 2]; n];
        for a in 0..n {
            for b in a + 1..n {
                let d = sub(c[b], c[a]);
                let len = length(d);
                let want = (radii[a] + radii[b]) * grow + gap;
                let mut s = ((want - len) / len).max(0.0) * 0.4;
                if !settled {
                    s -= pull.get(&(a, b)).map_or(0.0, |w| w.min(8.0)) * 0.0006;
                }
                f[a] = [f[a][0] - d[0] * s, f[a][1] - d[1] * s];
                f[b] = [f[b][0] + d[0] * s, f[b][1] + d[1] * s];
            }
        }
        for i in 0..n {
            let home = if settled { [0.0; 2] } else { [(mid[0] - c[i][0]) * across[0], (mid[1] - c[i][1]) * across[1]] };
            let (rx, ry) = (radii[i].min(w / 2.0), radii[i].min(h / 2.0));
            c[i] = [(c[i][0] + f[i][0] + home[0]).clamp(rx, w - rx), (c[i][1] + f[i][1] + home[1]).clamp(ry, h - ry)];
        }
    }
    // the islands settle into a round mass: spread it to the map's edges, which only moves them apart
    for (axis, room) in [w, h].into_iter().enumerate() {
        let low = c.iter().zip(radii).map(|(q, r)| q[axis] - r).fold(f64::MAX, f64::min);
        let high = c.iter().zip(radii).map(|(q, r)| q[axis] + r).fold(f64::MIN, f64::max);
        for q in &mut c {
            q[axis] = (q[axis] - low) * (room / (high - low)).max(1.0);
        }
    }
    c
}

/// How strongly each pair of stories is tied by the entries they share: an entry in few stories says more than
/// one in many. A sealed entry joins nobody (ADR-0027), and neither does a people or a faith: no line says two
/// stories belong together because of who someone is (ADR-0016).
fn shared(kb: &Kb, isles: &[&Isle]) -> BTreeMap<(usize, usize), f64> {
    let out = kb.kept_out();
    let mut tellers: BTreeMap<&str, Vec<usize>> = BTreeMap::new();
    for (s, isle) in isles.iter().enumerate() {
        for id in &isle.ids {
            tellers.entry(id).or_default().push(s);
        }
    }
    let mut pull = BTreeMap::new();
    for (id, stories) in &tellers {
        if stories.len() < 2 || out.contains(id) || kb.entity(id).is_some_and(|e| !kb.joins(e)) {
            continue;
        }
        let w = 1.0 / (stories.len() - 1) as f64;
        for (i, &a) in stories.iter().enumerate() {
            for &b in &stories[i + 1..] {
                *pull.entry((a, b)).or_insert(0.0) += w;
            }
        }
    }
    pull
}

/// Each island's strongest lines, as `[a, b, strength 1 to 3, 1 when it shows at rest]`.
fn lines(pull: &BTreeMap<(usize, usize), f64>, stories: usize) -> Vec<[usize; 4]> {
    let mut each: Vec<Vec<(usize, usize)>> = vec![Vec::new(); stories];
    let weight = |p: &(usize, usize)| pull[p];
    for &(a, b) in pull.keys() {
        each[a].push((a, b));
        each[b].push((a, b));
    }
    let mut kept: BTreeMap<(usize, usize), bool> = BTreeMap::new();
    for list in &mut each {
        list.sort_by(|p, q| weight(q).total_cmp(&weight(p)).then(p.cmp(q)));
        for (rank, &p) in list.iter().take(LINES).enumerate() {
            *kept.entry(p).or_default() |= rank == 0;
        }
    }
    kept.iter()
        .map(|(p, &rest)| {
            let strength = 1 + usize::from(pull[p] >= 2.0) + usize::from(pull[p] >= 4.0);
            [p.0, p.1, strength, usize::from(rest)]
        })
        .collect()
}

/// Where a story starts on the map: the middle of the places its entries are set, on a flat Earth, so that a
/// new story lands near its own part of the world and disturbs the others little.
fn somewhere(kb: &Kb, ch: &Chapter, isle: &Isle) -> [f64; 2] {
    let mut lon: Vec<f64> = Vec::new();
    let mut lat: Vec<f64> = Vec::new();
    for c in isle.ids.iter().filter_map(|id| kb.entity(id)).filter_map(|e| kb.coords(e)) {
        lon.push(c[0]);
        lat.push(c[1]);
    }
    if lon.is_empty() {
        let h = covers::seed(&ch.id);
        return [(h & 0xffff) as f64 / 65535.0 * WIDTH, (h >> 16 & 0xffff) as f64 / 65535.0 * HEIGHT];
    }
    let middle = |v: &mut Vec<f64>| {
        v.sort_by(f64::total_cmp);
        v[v.len() / 2]
    };
    [(middle(&mut lon) + 180.0) / 360.0 * WIDTH, ((75.0 - middle(&mut lat)) / 135.0).clamp(0.0, 1.0) * HEIGHT]
}

/// Places the dots in the water. Each is drawn towards the islands of the stories that name it, or else towards
/// the dots it links to, keeps off every island's land and keeps its distance from the others. One drawn to a
/// single island floats anywhere in a band off its shore, so that the shore reads as water, not as a ring.
fn float(sea: &[usize], targets: &[Option<[f64; 2]>], near: &[Vec<usize>], p: &mut [[f64; 2]], islands: &[([f64; 2], f64)], apart: f64) {
    let lone = [WIDTH / 2.0, HEIGHT / 2.0];
    let aim = |i: usize, p: &[[f64; 2]]| -> [f64; 2] {
        targets[i].unwrap_or_else(|| {
            if near[i].is_empty() {
                return p[i];
            }
            let k = near[i].len() as f64;
            near[i].iter().fold([0.0; 2], |m, &j| [m[0] + p[j][0] / k, m[1] + p[j][1] / k])
        })
    };
    // the island a dot is drawn onto, and the outer edge of the band off its shore
    let band: Vec<Option<([f64; 2], f64)>> = targets
        .iter()
        .map(|t| t.and_then(|t| islands.iter().find(|&&(c, reach)| length(sub(t, c)) < reach)).map(|&(c, reach)| (c, reach + apart * 1.6)))
        .collect();
    for (rank, &i) in sea.iter().enumerate() {
        let a = rank as f64 * GOLDEN;
        p[i] = match (band[i], targets[i]) {
            (Some((c, outer)), _) => {
                let r = outer - apart * 1.6 * (rank as f64 * 0.618_034).fract();
                [c[0] + r * a.cos(), c[1] + r * a.sin()]
            }
            (None, t) => {
                let (t, r) = (t.unwrap_or(lone), apart * (1.0 + (rank % 7) as f64 * 0.3));
                [t[0] + r * a.cos(), t[1] + r * a.sin()]
            }
        };
    }
    for round in 0..SEA_ROUNDS {
        let pull = if round < SEA_ROUNDS / 2 { 0.06 } else { 0.02 };
        for &i in sea {
            if let Some((c, outer)) = band[i] {
                let d = sub(p[i], c);
                let len = length(d);
                if len > outer {
                    let r = len - (len - outer) * pull * 4.0;
                    p[i] = [c[0] + d[0] / len * r, c[1] + d[1] / len * r];
                }
                continue;
            }
            let t = aim(i, p);
            p[i] = [p[i][0] + (t[0] - p[i][0]) * pull, p[i][1] + (t[1] - p[i][1]) * pull];
        }
        // apart from each other, found through a grid of cells one spacing wide
        let mut cells: HashMap<(i64, i64), Vec<usize>> = HashMap::new();
        for &i in sea {
            cells.entry(((p[i][0] / apart).floor() as i64, (p[i][1] / apart).floor() as i64)).or_default().push(i);
        }
        for &i in sea {
            let (cx, cy) = ((p[i][0] / apart).floor() as i64, (p[i][1] / apart).floor() as i64);
            for dx in -1..=1 {
                for dy in -1..=1 {
                    for &j in cells.get(&(cx + dx, cy + dy)).map_or(&[][..], Vec::as_slice) {
                        if j <= i {
                            continue;
                        }
                        let d = sub(p[j], p[i]);
                        let len = length(d);
                        if len < apart {
                            let f = (apart - len) / len / 2.0;
                            p[i] = [p[i][0] - d[0] * f, p[i][1] - d[1] * f];
                            p[j] = [p[j][0] + d[0] * f, p[j][1] + d[1] * f];
                        }
                    }
                }
            }
        }
        // off the land, and on the map
        for &i in sea {
            for &(c, reach) in islands {
                let d = sub(p[i], c);
                let len = d[0].hypot(d[1]);
                if len < reach {
                    let (x, y) = if len < 1e-6 { (1.0, 0.0) } else { (d[0] / len, d[1] / len) };
                    p[i] = [c[0] + x * reach, c[1] + y * reach];
                }
            }
            let edge = apart.min(HEIGHT / 4.0);
            p[i] = [p[i][0].clamp(edge, WIDTH - edge), p[i][1].clamp(edge, HEIGHT - edge)];
        }
    }
}

/// The whole surface, as `data/islands.json` holds it (docs/data-contract.md).
pub fn picture<'a>(kb: &Kb, by_id: &BTreeMap<&'a str, &'a Edge>) -> Value {
    let out = kb.kept_out();
    let by = kb.sealed_names();
    let says_sealed = |text: &str| by.named_after(text);
    // the rule the build keeps, not a brief: a story titled after a sealed person stays in the list only
    let told: Vec<(&Chapter, Isle)> =
        kb.chapters.iter().filter(|ch| !says_sealed(&ch.title)).map(|ch| (ch, reveals(kb, by_id, ch))).filter(|(_, isle)| !isle.ids.is_empty()).collect();
    let isles: Vec<&Isle> = told.iter().map(|(_, isle)| isle).collect();
    let at: HashMap<&str, usize> = kb.entities.iter().enumerate().map(|(i, e)| (e.id.as_str(), i)).collect();
    let n = kb.entities.len();

    // who tells of each entry, as (story, its place in the story's list), and the land it lies on, if any
    let mut tellers: Vec<Vec<(usize, usize)>> = vec![Vec::new(); n];
    for (s, isle) in isles.iter().enumerate() {
        for (j, id) in isle.ids.iter().enumerate() {
            tellers[at[id]].push((s, j));
        }
    }
    let apart_from_all = |e: &Entity| out.contains(e.id.as_str()) || !kb.joins(e);
    let people = |e: &Entity| kb.schema.types.get(&e.kind).is_some_and(|t| t.family);
    let home: Vec<Option<usize>> = kb
        .entities
        .iter()
        .zip(&tellers)
        .map(|(e, t)| match t[..] {
            [(s, j)] if !apart_from_all(e) && (!people(e) || isles[s].focus[j] > 0) => Some(s),
            _ => None,
        })
        .collect();

    // an island holds its land, and room on its shore for what floats near it
    let mut shore = vec![0.0; isles.len()];
    for (i, t) in tellers.iter().enumerate() {
        if home[i].is_none() {
            for &(s, _) in t {
                shore[s] += 1.0 / t.len() as f64;
            }
        }
    }
    let land: Vec<Vec<usize>> = isles.iter().enumerate().map(|(s, isle)| isle.ids.iter().map(|id| at[id]).filter(|&i| home[i] == Some(s)).collect()).collect();
    // every dot takes the same room, on land or in the water
    let unit = (FILL * WIDTH * HEIGHT / std::f64::consts::PI / (n + 4 * isles.len()).max(1) as f64).sqrt();
    let spacing = unit * std::f64::consts::PI.sqrt();
    let radii: Vec<f64> = land.iter().map(|l| unit * (l.len() as f64 + 4.0).sqrt()).collect();
    let reach: Vec<f64> = land.iter().zip(&shore).zip(&radii).map(|((l, sh), r)| (unit * (l.len() as f64 + 4.0 + sh).sqrt()).max(r + spacing)).collect();
    let pull = shared(kb, &isles);
    let centres = pack(&reach, &pull, told.iter().map(|(ch, isle)| somewhere(kb, ch, isle)).collect(), [WIDTH, HEIGHT]);

    // land: each island's own dots, laid out alone and set inside its coast
    let coast = unit * COAST;
    let mut p = vec![[0.0; 2]; n];
    for (s, (ch, isle)) in told.iter().enumerate() {
        let local: HashMap<usize, usize> = land[s].iter().enumerate().map(|(k, &i)| (i, k)).collect();
        let on = |j: usize| local.get(&at[isle.ids[j]]).copied();
        let springs: Vec<(usize, usize, f64)> = isle
            .links
            .iter()
            .map(|&(a, b)| (a, b, 1.0))
            .chain(isle.steps.iter().filter(|s| !isle.links.contains(s)).map(|&(a, b)| (a, b, 0.5)))
            .filter_map(|(a, b, w)| Some((on(a)?, on(b)?, w)))
            .collect();
        let scenes: Vec<usize> = land[s].iter().map(|&i| isle.scenes[tellers[i][0].1]).collect();
        let turn = (covers::seed(&ch.id) >> 32 & 0xffff) as f64 / 65535.0 * std::f64::consts::TAU;
        let inner = (radii[s] - coast).max(coast * 0.5);
        for (k, q) in arrange(&scenes, &springs, turn).into_iter().enumerate() {
            p[land[s][k]] = [centres[s][0] + q[0] * inner, centres[s][1] + q[1] * inner];
        }
    }

    // water: everything else, near the stories that name it, or near what it links to
    let sea: Vec<usize> = (0..n).filter(|&i| home[i].is_none()).collect();
    let targets: Vec<Option<[f64; 2]>> = tellers
        .iter()
        .map(|t| {
            let total: f64 = t.iter().map(|&(s, j)| isles[s].scenes[j] as f64).sum();
            (total > 0.0).then(|| {
                t.iter().fold([0.0; 2], |m, &(s, j)| {
                    let w = isles[s].scenes[j] as f64 / total;
                    [m[0] + centres[s][0] * w, m[1] + centres[s][1] * w]
                })
            })
        })
        .collect();
    let mut near: Vec<Vec<usize>> = vec![Vec::new(); n];
    for e in &kb.edges {
        if let (Some(&a), Some(&b)) = (at.get(e.from.as_str()), at.get(e.to.as_str()))
            && a != b
        {
            near[a].push(b);
            near[b].push(a);
        }
    }
    let islands: Vec<([f64; 2], f64)> = centres.iter().zip(&radii).map(|(&c, &r)| (c, r + spacing * OFFSHORE)).collect();
    float(&sea, &targets, &near, &mut p, &islands, spacing * 0.8);

    let keep = |i: &usize| !apart_from_all(&kb.entities[*i]);
    let stories: Vec<Value> = told
        .iter()
        .enumerate()
        .map(|(s, (ch, isle))| {
            let trail: Vec<usize> = isle.trail.iter().map(|&j| at[isle.ids[j]]).filter(keep).collect();
            let subtitle = ch.subtitle.as_deref().filter(|t| !says_sealed(t));
            json!({ "id": ch.id, "title": ch.title, "subtitle": subtitle, "scenes": ch.shots.len(),
                    "x": centres[s][0].round() as i64, "y": centres[s][1].round() as i64, "r": radii[s].round() as i64,
                    "land": land[s], "trail": trail })
        })
        .collect();
    // the stories that tell of each entry, the one with the most scenes on it first
    let tellers: Vec<Vec<usize>> = tellers
        .into_iter()
        .enumerate()
        .map(|(i, mut t)| {
            if !keep(&i) {
                return Vec::new();
            }
            t.sort_by_key(|&(s, j)| (std::cmp::Reverse(isles[s].scenes[j]), s));
            t.into_iter().map(|(s, _)| s).collect()
        })
        .collect();
    let spots: Vec<i64> = p.iter().flat_map(|q| [q[0].round() as i64, q[1].round() as i64]).collect();
    let quiet: Vec<usize> = (0..n).filter(|&i| out.contains(kb.entities[i].id.as_str())).collect();
    json!({ "w": WIDTH as i64, "h": HEIGHT as i64, "coast": coast.round() as i64, "at": spots, "sealed": quiet,
            "told": tellers, "stories": stories, "lines": lines(&pull, told.len()) })
}

/// The Map far out, as one picture for the home page (`w/picture.svg`): the islands' land in grey and every dot
/// in its kind's ink, where `picture` placed it. Sealed entries are left out, as the Map leaves them unnamed.
pub fn svg(kb: &Kb, picture: &Value) -> String {
    let num = |v: &Value| v.as_f64().unwrap_or(0.0);
    let (w, h, coast) = (num(&picture["w"]), num(&picture["h"]), num(&picture["coast"]));
    let at: Vec<f64> = picture["at"].as_array().map(|a| a.iter().map(num).collect()).unwrap_or_default();
    let sealed: BTreeSet<usize> = picture["sealed"].as_array().into_iter().flatten().filter_map(|v| v.as_u64()).map(|i| i as usize).collect();
    let spot = |i: usize| (at.get(2 * i).copied().unwrap_or(0.0), at.get(2 * i + 1).copied().unwrap_or(0.0));
    let mut out = format!(r##"<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}"><g fill="#efefef">"##);
    for story in picture["stories"].as_array().into_iter().flatten() {
        for i in story["land"].as_array().into_iter().flatten().filter_map(|v| v.as_u64()) {
            let (x, y) = spot(i as usize);
            out.push_str(&format!(r#"<circle cx="{x:.0}" cy="{y:.0}" r="{coast:.0}"/>"#));
        }
    }
    out.push_str("</g>");
    // one group a kind, so that each ink is written once
    let mut by_ink: BTreeMap<String, Vec<usize>> = BTreeMap::new();
    for (i, e) in kb.entities.iter().enumerate() {
        if !sealed.contains(&i) && 2 * i + 1 < at.len() {
            by_ink.entry(kb.schema.type_color(&e.kind)).or_default().push(i);
        }
    }
    for (ink, dots) in by_ink {
        out.push_str(&format!(r#"<g fill="{ink}">"#));
        for i in dots {
            let (x, y) = spot(i);
            out.push_str(&format!(r#"<circle cx="{x:.0}" cy="{y:.0}" r="20"/>"#));
        }
        out.push_str("</g>");
    }
    out.push_str("</svg>\n");
    out
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use serde_json::{Value, json};

    use super::picture;
    use crate::{
        kb::Kb,
        testkit::{File, entity, file, load},
    };

    fn story(id: &str, subtitle: &str, scenes: &[(&str, &str)]) -> File {
        let shots: String = scenes
            .iter()
            .enumerate()
            .map(|(i, (focus, reveal))| {
                let focus = if focus.is_empty() { String::new() } else { format!("  focus: {focus}\n") };
                format!("- shot: s{i}\n{focus}  reveal: [{reveal}]\n")
            })
            .collect();
        file(&format!("content/chapters/{id}.md"), &format!("---\nid: {id}\ntype: chapter\ntitle: {id}\nsubtitle: {subtitle}\n---\n\n```scene\n{shots}```\n"))
    }

    fn drawn(kb: &Kb) -> Value {
        picture(kb, &kb.edges.iter().map(|e| (e.id.as_str(), e)).collect::<BTreeMap<_, _>>())
    }

    fn index(kb: &Kb, id: &str) -> Value {
        json!(kb.entities.iter().position(|e| e.id == id).unwrap())
    }

    fn spot(p: &Value, kb: &Kb, id: &str) -> [f64; 2] {
        let i = index(kb, id).as_u64().unwrap() as usize;
        [p["at"][2 * i].as_f64().unwrap(), p["at"][2 * i + 1].as_f64().unwrap()]
    }

    #[test]
    fn the_same_content_gives_the_same_picture_and_it_names_no_dot() {
        let (kb, _) = load(
            "islands-same",
            &[
                entity("person", "ann-lee", "Ann Lee", ""),
                entity("person", "bo-ray", "Bo Ray", ""),
                entity("org", "acme", "Acme", ""),
                story("once", "First.", &[("ann-lee", "bo-ray")]),
                story("twice", "Second.", &[("", "ann-lee, acme")]),
            ],
        );
        let p = drawn(&kb);
        assert_eq!(p, drawn(&kb));
        assert_eq!(p["at"].as_array().unwrap().len(), 2 * kb.entities.len());
        assert_eq!(p["lines"], json!([[0, 1, 1, 1]]), "the two stories share Ann");
        let text = p.to_string();
        for name in ["ann-lee", "Ann Lee", "bo-ray", "Bo Ray", "acme", "Acme"] {
            assert!(!text.contains(name), "{name} is in the file: it names dots by their place in graph-slim.json");
        }
    }

    #[test]
    fn only_what_a_story_is_about_lies_on_its_land() {
        let (kb, _) = load(
            "islands-land",
            &[
                entity("person", "ann-lee", "Ann Lee", ""),
                entity("person", "bo-ray", "Bo Ray", ""),
                entity("person", "cy-hu", "Cy Hu", ""),
                entity("org", "acme", "Acme", ""),
                entity("org", "zed", "Zed", ""),
                story("pain", "First.", &[("ann-lee", "bo-ray, acme"), ("", "cy-hu")]),
                story("gain", "Second.", &[("zed", "cy-hu")]),
            ],
        );
        let p = drawn(&kb);
        let pain = &p["stories"][1];
        assert_eq!(pain["id"], "pain");
        let on = |id: &str| pain["land"].as_array().unwrap().contains(&index(&kb, id));
        assert!(on("ann-lee"), "a scene is about her, and no other story tells of her");
        assert!(on("acme"), "a thing only this story names lies on its land");
        assert!(!on("bo-ray"), "merely mentioned: he floats offshore");
        assert!(!on("cy-hu"), "two stories tell of him: he floats between them");
        assert_eq!(pain["trail"], json!([index(&kb, "ann-lee"), index(&kb, "cy-hu")]));
        let told = |id: &str| p["told"][index(&kb, id).as_u64().unwrap() as usize].clone();
        assert_eq!((told("bo-ray"), told("cy-hu")), (json!([1]), json!([0, 1])), "one scene in each: the stories in their order");
        // nothing in the water lies on an island
        for id in ["bo-ray", "cy-hu"] {
            let [x, y] = spot(&p, &kb, id);
            for s in p["stories"].as_array().unwrap() {
                let d = (x - s["x"].as_f64().unwrap()).hypot(y - s["y"].as_f64().unwrap());
                assert!(d > s["r"].as_f64().unwrap(), "{id} is on {}", s["id"]);
            }
        }
    }

    #[test]
    fn a_sealed_person_a_people_or_a_faith_joins_no_stories_and_lies_on_no_land() {
        let kinds = "person: {label: Person, plural: People, layer: people, family: true}\norg: {label: Organization, plural: Organizations, layer: power}\ngroup: {label: Group, plural: Groups, layer: people, family: true, alone: true}\ntradition: {label: Tradition, plural: Traditions, layer: people, alone: true}\n";
        let zoe = "---\nid: zoe-day\ntype: person\nname: Zoe Day\nsealed: true\nclaims: []\n---\n";
        let (kb, _) = load(
            "islands-sealed",
            &[
                file("content/schema/entity-types.yaml", kinds),
                file("content/entities/person/zo/zoe-day.md", zoe),
                entity("group", "reds", "Reds", ""),
                entity("tradition", "faith", "Faith", ""),
                story("one", "How Zoe Day walked away.", &[("zoe-day", "reds, faith")]),
                story("two", "What Day said.", &[("faith", "zoe-day, reds")]),
                story("three", "Plain words.", &[("reds", "")]),
            ],
        );
        let p = drawn(&kb);
        assert_eq!(p["lines"], json!([]));
        assert_eq!(p["sealed"], json!([index(&kb, "zoe-day")]));
        let plain = json!("Plain words.");
        let lines: BTreeMap<&str, &Value> = p["stories"].as_array().unwrap().iter().map(|s| (s["id"].as_str().unwrap(), &s["subtitle"])).collect();
        assert_eq!(lines, BTreeMap::from([("one", &Value::Null), ("three", &plain), ("two", &Value::Null)]));
        for s in p["stories"].as_array().unwrap() {
            assert_eq!((&s["land"], &s["trail"]), (&json!([]), &json!([])), "{}", s["id"]);
        }
        assert_eq!(p["told"], json!([[], [], []]), "no story is listed through them");
    }

    #[test]
    fn a_story_titled_after_a_sealed_person_stays_off_the_picture() {
        let zoe = "---\nid: zoe-day\ntype: person\nname: Zoe Day\nsealed: true\nclaims: []\n---\n";
        let titled = "---\nid: hers\ntype: chapter\ntitle: The Zoe Day File\n---\n\n```scene\n- shot: a\n  reveal: [zoe-day]\n```\n";
        let (kb, _) = load("islands-title", &[file("content/entities/person/zo/zoe-day.md", zoe), file("content/chapters/hers.md", titled)]);
        assert_eq!(drawn(&kb)["stories"], json!([]));
    }
}
