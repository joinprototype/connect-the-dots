//! `data/islands.json`, the picture on the Stories page: every written story is an island of the
//! entries it reveals, and a line joins two stories that share one. All of it is settled here, so the
//! page only draws numbers: nothing moves on screen, and the same content gives the same picture.
//!
//! An island's name hangs over its dots, so the file names no dot: a dot is a place, an ink and a size.
//! A person never reads as belonging to a story, and a sealed entry stays an unnamed dot (ADR-0027).

use std::collections::{BTreeMap, BTreeSet};

use serde_json::{Value, json};

use super::data;
use crate::{
    covers,
    kb::{Chapter, Edge, Kb, shot_entries},
};

/// The file's budget in gzip bytes.
pub const BUDGET: usize = 100 * 1024;
/// The sheets the page picks from, as width over height: a window, a tablet, a phone.
const SHEETS: [f64; 3] = [2.0, 1.0, 0.25];
/// The first sheet's width, in the file's units.
const WIDTH: f64 = 4000.0;
/// How much of a sheet the islands cover.
const FILL: f64 = 0.54;
/// The lines an island keeps, strongest first. Only the first shows until the island is picked.
const LINES: usize = 5;
/// Rounds of settling for the dots of an island, and for the islands on a sheet.
const DOT_ROUNDS: usize = 240;
const ISLAND_ROUNDS: usize = 3000;
/// The turn between neighbours in a seed head.
const GOLDEN: f64 = 2.399_963_229_728_653;

/// What one story reveals: its entries in order of first appearance, how many scenes each is in, the
/// links between them, and which entries followed each other from scene to scene.
#[derive(Default)]
struct Isle<'a> {
    ids: Vec<&'a str>,
    scenes: Vec<usize>,
    links: BTreeSet<(usize, usize)>,
    steps: BTreeSet<(usize, usize)>,
}

fn pair(a: usize, b: usize) -> (usize, usize) {
    (a.min(b), a.max(b))
}

fn reveals<'a>(kb: &Kb, by_id: &BTreeMap<&'a str, &'a Edge>, ch: &'a Chapter) -> Isle<'a> {
    let mut isle = Isle::default();
    let mut at: BTreeMap<&str, usize> = BTreeMap::new();
    let mut last = None;
    for shot in &ch.shots {
        let links = data::revealed(by_id, shot);
        let ends = links.values().flat_map(|e| [e.from.as_str(), e.to.as_str()]);
        let here: BTreeSet<&str> = shot_entries(shot).map(|(_, id)| id).chain(ends).filter(|id| kb.entity(id).is_some()).collect();
        for &id in &here {
            let i = *at.entry(id).or_insert_with(|| {
                isle.ids.push(id);
                isle.scenes.push(0);
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
        let first = here.iter().find_map(|id| at.get(id).copied());
        if let (Some(a), Some(b)) = (last, first)
            && a != b
        {
            isle.steps.insert(pair(a, b));
        }
        last = first.or(last);
    }
    isle
}

fn sub(a: [f64; 2], b: [f64; 2]) -> [f64; 2] {
    [a[0] - b[0], a[1] - b[1]]
}

fn length(d: [f64; 2]) -> f64 {
    d[0].hypot(d[1]).max(1e-6)
}

/// Where an island's dots lie inside a circle of radius 1. Linked dots lie near each other, as many
/// scenes as an entry is in bring it towards the middle, and the dots fill the circle evenly.
fn arrange(isle: &Isle, turn: f64) -> Vec<[f64; 2]> {
    let n = isle.ids.len();
    let mut order: Vec<usize> = (0..n).collect();
    order.sort_by_key(|&i| (std::cmp::Reverse(isle.scenes[i]), i));
    let mut p = vec![[0.0; 2]; n];
    for (rank, &i) in order.iter().enumerate() {
        let (r, a) = (0.6 * ((rank as f64 + 0.5) / n as f64).sqrt(), turn + rank as f64 * GOLDEN);
        p[i] = [r * a.cos(), r * a.sin()];
    }
    let springs: Vec<(usize, usize, f64)> =
        isle.links.iter().map(|&(a, b)| (a, b, 1.0)).chain(isle.steps.iter().filter(|s| !isle.links.contains(s)).map(|&(a, b)| (a, b, 0.5))).collect();
    let mut degree = vec![0.0_f64; n];
    for &(a, b, w) in &springs {
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
        for &(a, b, w) in &springs {
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
    even_out(&mut p);
    let apart = 1.1 / (n as f64).sqrt();
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

/// Where each island lies on a sheet. Islands start small, so that they can pass each other on the
/// way to the islands they share most with, and grow until they stop touching.
fn pack(radii: &[f64], pull: &BTreeMap<(usize, usize), f64>, start: Vec<[f64; 2]>, [w, h]: [f64; 2]) -> Vec<[f64; 2]> {
    let n = radii.len();
    let gap = w.min(h) * 0.014;
    let mid = [w / 2.0, h / 2.0];
    // a long sheet would otherwise leave its ends empty: the pull to the middle runs across it
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
    // the islands settle into a round mass: spread it to the sheet's edges, which only moves them apart
    for (axis, room) in [w, h].into_iter().enumerate() {
        let low = c.iter().zip(radii).map(|(q, r)| q[axis] - r).fold(f64::MAX, f64::min);
        let high = c.iter().zip(radii).map(|(q, r)| q[axis] + r).fold(f64::MIN, f64::max);
        for q in &mut c {
            q[axis] = (q[axis] - low) * (room / (high - low)).max(1.0);
        }
    }
    c
}

/// How strongly each pair of stories is tied by the entries they share: an entry in few stories says
/// more than one in many. A sealed entry joins nobody (ADR-0027), and neither does a people or a faith:
/// no line says two stories belong together because of who someone is (ADR-0016).
fn shared(kb: &Kb, isles: &[&Isle]) -> BTreeMap<(usize, usize), f64> {
    let sealed = kb.sealed();
    let mut tellers: BTreeMap<&str, Vec<usize>> = BTreeMap::new();
    for (s, isle) in isles.iter().enumerate() {
        for id in &isle.ids {
            tellers.entry(id).or_default().push(s);
        }
    }
    let mut pull = BTreeMap::new();
    for (id, stories) in &tellers {
        if stories.len() < 2 || sealed.contains(id) || kb.entity(id).is_some_and(|e| matches!(e.kind.as_str(), "group" | "tradition")) {
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

/// The ways a story's one line might name a sealed person: their names, and their family name alone.
fn sealed_names(kb: &Kb) -> Vec<&str> {
    let people = kb.entities.iter().filter(|e| e.sealed && e.kind == "person");
    people.flat_map(|e| e.aliases.iter().map(String::as_str).chain([e.name.as_str()]).chain(e.name.split_whitespace().last())).collect()
}

/// The size class of a dot, 0 to 3, from how many scenes its entry is in.
fn size(scenes: usize) -> u32 {
    scenes.max(1).ilog2().min(3)
}

/// The whole picture, as `data/islands.json` holds it (docs/data-contract.md).
pub fn picture<'a>(kb: &Kb, by_id: &BTreeMap<&'a str, &'a Edge>) -> Value {
    let names = sealed_names(kb);
    let says_sealed = |text: &str| names.iter().any(|n| text.contains(n));
    // the rule the build keeps, not a brief: a story titled after a sealed person stays in the list only
    let told: Vec<(&Chapter, Isle)> =
        kb.chapters.iter().filter(|ch| !says_sealed(&ch.title)).map(|ch| (ch, reveals(kb, by_id, ch))).filter(|(_, isle)| !isle.ids.is_empty()).collect();
    let isles: Vec<&Isle> = told.iter().map(|(_, isle)| isle).collect();
    let pull = shared(kb, &isles);
    let area = |isle: &Isle| isle.ids.len() as f64 + 4.0;
    let sheet_area = WIDTH * WIDTH / SHEETS[0];
    let unit = (FILL * sheet_area / std::f64::consts::PI / isles.iter().map(|i| area(i)).sum::<f64>()).sqrt();
    let radii: Vec<f64> = isles.iter().map(|i| unit * area(i).sqrt()).collect();

    // the first sheet starts each island at a spot of its own, so a new story disturbs the others
    // little; each later sheet starts from the one before, so that neighbours stay neighbours
    let mut sheets = Vec::new();
    let mut last: Option<(Vec<[f64; 2]>, [f64; 2])> = None;
    for aspect in SHEETS {
        let size = [(sheet_area * aspect).sqrt(), (sheet_area / aspect).sqrt()];
        let start: Vec<[f64; 2]> = match &last {
            Some((c, [w, h])) if (w > h) != (size[0] > size[1]) => c.iter().map(|q| [q[1] / h * size[0], q[0] / w * size[1]]).collect(),
            Some((c, [w, h])) => c.iter().map(|q| [q[0] / w * size[0], q[1] / h * size[1]]).collect(),
            None => told
                .iter()
                .map(|(ch, _)| {
                    let h = covers::seed(&ch.id);
                    [(h & 0xffff) as f64 / 65535.0 * size[0], (h >> 16 & 0xffff) as f64 / 65535.0 * size[1]]
                })
                .collect(),
        };
        let at = pack(&radii, &pull, start, size);
        let rows: Vec<[i64; 2]> = at.iter().map(|q| [q[0].round() as i64, q[1].round() as i64]).collect();
        sheets.push(json!({ "w": size[0].round() as i64, "h": size[1].round() as i64, "at": rows }));
        last = Some((at, size));
    }

    let mut inks: Vec<String> = Vec::new();
    let stories: Vec<Value> = told
        .iter()
        .zip(&radii)
        .map(|((ch, isle), &r)| {
            let turn = (covers::seed(&ch.id) >> 32 & 0xffff) as f64 / 65535.0 * std::f64::consts::TAU;
            let dots: Vec<[i64; 4]> = arrange(isle, turn)
                .iter()
                .enumerate()
                .map(|(i, q)| {
                    let color = kb.entity(isle.ids[i]).map_or_else(String::new, |e| kb.schema.type_color(&e.kind));
                    let ink = inks.iter().position(|c| *c == color).unwrap_or_else(|| {
                        inks.push(color);
                        inks.len() - 1
                    });
                    [(q[0] * r).round() as i64, (q[1] * r).round() as i64, ink as i64, i64::from(size(isle.scenes[i]))]
                })
                .collect();
            let subtitle = ch.subtitle.as_deref().filter(|s| !says_sealed(s));
            json!({ "id": ch.id, "title": ch.title, "subtitle": subtitle, "r": r.round() as i64, "dots": dots, "links": isle.links.iter().map(|&(a, b)| [a, b]).collect::<Vec<_>>() })
        })
        .collect();
    json!({ "inks": inks, "sheets": sheets, "stories": stories, "lines": lines(&pull, told.len()) })
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

    fn story(id: &str, subtitle: &str, reveal: &str) -> File {
        let scene = format!("```scene\n- shot: a\n  reveal: [{reveal}]\n```\n");
        file(&format!("content/chapters/{id}.md"), &format!("---\nid: {id}\ntype: chapter\ntitle: {id}\nsubtitle: {subtitle}\n---\n\n{scene}"))
    }

    fn drawn(kb: &Kb) -> Value {
        picture(kb, &kb.edges.iter().map(|e| (e.id.as_str(), e)).collect::<BTreeMap<_, _>>())
    }

    #[test]
    fn the_same_content_gives_the_same_picture_and_it_names_no_dot() {
        let (kb, _) = load(
            "islands-same",
            &[
                entity("person", "ann-lee", "Ann Lee", ""),
                entity("person", "bo-ray", "Bo Ray", ""),
                entity("org", "acme", "Acme", ""),
                story("once", "First.", "ann-lee, bo-ray"),
                story("twice", "Second.", "ann-lee, acme"),
            ],
        );
        let p = drawn(&kb);
        assert_eq!(p, drawn(&kb));
        assert_eq!(p["stories"].as_array().unwrap().iter().map(|s| s["dots"].as_array().unwrap().len()).collect::<Vec<_>>(), [2, 2]);
        assert_eq!(p["lines"], json!([[0, 1, 1, 1]]), "the two stories share Ann");
        assert_eq!(p["sheets"].as_array().unwrap().len(), 3);
        let text = p.to_string();
        for name in ["ann-lee", "Ann Lee", "bo-ray", "Bo Ray", "acme", "Acme"] {
            assert!(!text.contains(name), "{name} is in the file");
        }
    }

    #[test]
    fn a_sealed_person_a_people_or_a_faith_joins_no_stories_and_a_sealed_person_goes_unnamed() {
        let kinds = "person: {label: Person, plural: People, layer: people, family: true}\norg: {label: Organization, plural: Organizations, layer: power}\ngroup: {label: Group, plural: Groups, layer: people}\ntradition: {label: Tradition, plural: Traditions, layer: people}\n";
        let zoe = "---\nid: zoe-day\ntype: person\nname: Zoe Day\nsealed: true\nclaims: []\n---\n";
        let (kb, _) = load(
            "islands-sealed",
            &[
                file("content/schema/entity-types.yaml", kinds),
                file("content/entities/person/zo/zoe-day.md", zoe),
                entity("group", "reds", "Reds", ""),
                entity("tradition", "faith", "Faith", ""),
                story("one", "How Zoe Day walked away.", "zoe-day, reds, faith"),
                story("two", "What Day said.", "zoe-day, reds, faith"),
                story("three", "Plain words.", "reds"),
            ],
        );
        let p = drawn(&kb);
        assert_eq!(p["lines"], json!([]));
        let plain = json!("Plain words.");
        let lines: BTreeMap<&str, &Value> = p["stories"].as_array().unwrap().iter().map(|s| (s["id"].as_str().unwrap(), &s["subtitle"])).collect();
        assert_eq!(lines, BTreeMap::from([("one", &Value::Null), ("three", &plain), ("two", &Value::Null)]));
        assert_eq!(p["stories"][0]["dots"].as_array().unwrap().len(), 3, "she keeps her unnamed dot");
    }

    #[test]
    fn a_story_titled_after_a_sealed_person_stays_off_the_picture() {
        let zoe = "---\nid: zoe-day\ntype: person\nname: Zoe Day\nsealed: true\nclaims: []\n---\n";
        let titled = "---\nid: hers\ntype: chapter\ntitle: The Zoe Day File\n---\n\n```scene\n- shot: a\n  reveal: [zoe-day]\n```\n";
        let (kb, _) = load("islands-title", &[file("content/entities/person/zo/zoe-day.md", zoe), file("content/chapters/hers.md", titled)]);
        assert_eq!(drawn(&kb)["stories"], json!([]));
    }
}
