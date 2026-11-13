//! The daily puzzle (`/play/`): two names a day, and the reader steps from one to the other by the links
//! a way may use. `data/play.json` holds every day's pair from `first`, chosen here so that every reader
//! gets the same one, with the fewest links between them and one way of that length.
//!
//! The rules are in content/methodology/play.yaml. Each end is of a type that may open the home page,
//! runs through a written story free of sealed entries and through none the rules leave out, and is
//! nothing Ask keeps out; the two ends share no story, so a puzzle joins two of them.

use std::collections::{BTreeMap, BTreeSet, HashMap, HashSet, VecDeque};
use std::path::Path;

use anyhow::{Context, Result, anyhow};
use serde::Deserialize;
use serde_json::json;

use super::{Site, write};
use crate::{atlas::Atlas, kb::shot_entries};

#[derive(Deserialize)]
struct Rules {
    first: String,
    days: usize,
    steps: Vec<usize>,
    rest: usize,
    /// How well known an end must be: the language editions of an encyclopedia that cover it, from open
    /// data. Without open data (the dev server) every end may be picked.
    #[serde(default)]
    known: u16,
    #[serde(default)]
    leave_out: Vec<String>,
}

/// 64-bit FNV-1a: the same pick from the same content on every machine.
fn hash(parts: &[&str]) -> u64 {
    let mut h: u64 = 0xcbf2_9ce4_8422_2325;
    for p in parts {
        for &byte in p.as_bytes().iter().chain(b"/") {
            h = (h ^ u64::from(byte)).wrapping_mul(0x0000_0100_0000_01b3);
        }
    }
    h
}

/// Every day's puzzle from the rules, as one way between its ends by the fewest links, and the entries a
/// step may not land on.
fn puzzles<'a>(s: &Site<'a>, rules: &Rules, atlas: Option<&Atlas>) -> (Vec<Vec<&'a str>>, BTreeSet<&'a str>) {
    let kb = s.kb;
    let fame: Option<HashMap<usize, u16>> = atlas.map(|a| {
        let at: HashMap<u32, u16> = a.entries.iter().map(|e| (e.qid, e.fame)).collect();
        crate::atlas::curated(kb).into_iter().filter_map(|(q, i)| at.get(&q).map(|&f| (i, f))).collect()
    });
    let out = s.kb.kept_out();
    let at: HashMap<&str, usize> = kb.entities.iter().enumerate().map(|(i, e)| (e.id.as_str(), i)).collect();
    // the links a way may use, as data/ways.json holds them, with nothing kept out at either end
    let mut near: Vec<Vec<usize>> = vec![Vec::new(); kb.entities.len()];
    for e in kb.edges.iter().filter(|e| e.walkable()) {
        if out.contains(e.from.as_str()) || out.contains(e.to.as_str()) {
            continue;
        }
        let (f, t) = (at[e.from.as_str()], at[e.to.as_str()]);
        near[f].push(t);
        near[t].push(f);
    }
    for list in &mut near {
        list.sort_by(|&x, &y| kb.entities[x].id.cmp(&kb.entities[y].id));
        list.dedup();
    }
    // the stories free of sealed entries each entry runs through (two scenes or more), and those the
    // rules leave out
    let left: HashSet<&str> = rules.leave_out.iter().map(String::as_str).collect();
    let unsealed: HashSet<&str> = kb.unsealed_chapters().iter().map(|ch| ch.id.as_str()).collect();
    let mut runs: HashMap<&str, BTreeSet<&str>> = HashMap::new();
    let mut barred: HashSet<&str> = HashSet::new();
    for ch in &kb.chapters {
        let mut scenes: HashMap<&str, usize> = HashMap::new();
        for shot in &ch.shots {
            for id in shot_entries(shot).map(|(_, id)| id).collect::<BTreeSet<_>>() {
                *scenes.entry(id).or_default() += 1;
            }
        }
        if left.contains(ch.id.as_str()) {
            barred.extend(scenes.keys());
        } else if unsealed.contains(ch.id.as_str()) {
            for (id, _) in scenes.into_iter().filter(|&(_, n)| n >= 2) {
                runs.entry(id).or_default().insert(ch.id.as_str());
            }
        }
    }
    let pool: Vec<usize> = kb
        .entities
        .iter()
        .enumerate()
        .filter(|(i, e)| {
            kb.schema.types.get(&e.kind).is_some_and(|t| t.thread)
                && fame.as_ref().is_none_or(|f| f.get(i).is_some_and(|&n| n >= rules.known))
                && !out.contains(e.id.as_str())
                && !barred.contains(e.id.as_str())
                && runs.contains_key(e.id.as_str())
        })
        .map(|(i, _)| i)
        .collect();

    let mut last: HashMap<usize, usize> = HashMap::new();
    let mut found = Vec::new();
    for day in 0..rules.days {
        let d = day.to_string();
        let steps = rules.steps[(hash(&[&d, "steps"]) % rules.steps.len() as u64) as usize];
        // an end rests `rest` days before it comes back, or less when no pair would be left
        let pick = [rules.rest, rules.rest / 3, 0].into_iter().find_map(|rest| {
            let fresh = |i: &usize| last.get(i).is_none_or(|&l| day - l > rest);
            let mut starts: Vec<usize> = pool.iter().copied().filter(fresh).collect();
            starts.sort_by_key(|&i| hash(&[&d, "a", &kb.entities[i].id]));
            starts.iter().take(50).find_map(|&a| {
                // breadth first from `a`, each entry reached first by the lowest id
                let mut from = vec![usize::MAX; near.len()];
                let mut dist = vec![usize::MAX; near.len()];
                let mut queue = VecDeque::from([a]);
                dist[a] = 0;
                while let Some(u) = queue.pop_front() {
                    if dist[u] == steps {
                        continue;
                    }
                    for &v in &near[u] {
                        if dist[v] == usize::MAX {
                            (dist[v], from[v]) = (dist[u] + 1, u);
                            queue.push_back(v);
                        }
                    }
                }
                let ra = &runs[kb.entities[a].id.as_str()];
                let b = pool
                    .iter()
                    .copied()
                    .filter(|&b| dist[b] == steps && fresh(&b) && runs[kb.entities[b].id.as_str()].is_disjoint(ra))
                    .min_by_key(|&b| hash(&[&d, "b", &kb.entities[b].id]))?;
                let mut way = vec![b];
                while let Some(&u) = way.last().filter(|&&u| u != a) {
                    way.push(from[u]);
                }
                way.reverse();
                Some(way)
            })
        });
        // a day keeps its place in the list, with no way when nothing could be picked
        let Some(way) = pick else {
            found.push(Vec::new());
            continue;
        };
        last.insert(way[0], day);
        last.insert(way[way.len() - 1], day);
        found.push(way.into_iter().map(|i| kb.entities[i].id.as_str()).collect());
    }
    // a step may not land on what is kept out and still has links of its own
    let linked: HashSet<&str> = kb.edges.iter().filter(|e| e.walkable()).flat_map(|e| [e.from.as_str(), e.to.as_str()]).collect();
    (found, out.into_iter().filter(|id| linked.contains(id)).collect())
}

/// `data/play.json` and the page, when content/methodology/play.yaml exists.
pub(super) fn write_play(s: &Site, root: &Path, atlas: Option<&Atlas>) -> Result<()> {
    let path = root.join("content").join("methodology").join("play.yaml");
    if !path.exists() {
        return Ok(());
    }
    let text = std::fs::read_to_string(&path).with_context(|| format!("reading {}", path.display()))?;
    let rules: Rules = crate::schema::parse_yaml(&text).map_err(|e| anyhow!("{}: {e}", path.display()))?;
    if rules.steps.is_empty() || rules.steps.contains(&0) {
        return Err(anyhow!("{}: `steps` needs one or more counts of links, each 1 or more", path.display()));
    }
    chrono::NaiveDate::parse_from_str(&rules.first, "%Y-%m-%d").map_err(|e| anyhow!("{}: `first` must be a date, YYYY-MM-DD: {e}", path.display()))?;
    let (found, out) = puzzles(s, &rules, atlas);
    // the ends' names, so the home page can say today's puzzle without the whole graph
    let names: BTreeMap<&str, String> = found.iter().flat_map(|w| [w.first(), w.last()]).flatten().map(|&id| (id, s.kb.name_of(id))).collect();
    write(&s.out.join("data").join("play.json"), serde_json::to_vec(&json!({ "first": rules.first, "days": found, "out": out, "names": names }))?)?;
    write(&s.out.join("play").join("index.html"), s.render("play.html", json!({ "site": &s.site }))?)
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use serde_json::Value;

    use crate::testkit::{entity, file, source, write_repo};

    #[test]
    fn each_day_joins_two_stories_by_the_fewest_links() {
        let link = |rel: &str, to: &str| format!("  - {{id: c-{to}, rel: {rel}, to: {to}, src: [{{s: rec, quote: \"It was so.\"}}]}}\n");
        let scene = |id: &str, names: &str| {
            format!(
                "```scene\n- shot: {id}1\n  view: graph\n  time: \"1990\"\n  duration: 5\n  reveal: [{names}]\n  narration: \"One.\"\n- shot: {id}2\n  view: graph\n  time: \"1991\"\n  duration: 5\n  reveal: [{names}]\n  narration: \"Two.\"\n```\n"
            )
        };
        let story = |id: &str, names: &str| {
            file(&format!("content/chapters/{id}.md"), &format!("---\nid: {id}\ntype: chapter\ntitle: {id}\n---\n\n{}", scene(id, names)))
        };
        let files = vec![
            source("rec", "T1"),
            // ann - acme - bo - beta - cy - dark: three links join ann to beta, and acme to cy
            entity("person", "ann", "Ann", &link("founded", "acme")),
            entity("org", "acme", "Acme", ""),
            entity("person", "bo", "Bo", &(link("founded", "acme") + &link("founded", "beta"))),
            entity("org", "beta", "Beta", ""),
            entity("person", "cy", "Cy", &(link("founded", "beta") + &link("founded", "dark"))),
            entity("org", "dark", "Dark", ""),
            story("one", "ann, acme"),
            story("two", "cy, beta"),
            story("harm", "dark"),
            // only types that may open the home page start or end a puzzle
            file(
                "content/schema/entity-types.yaml",
                "person: {label: Person, plural: People, layer: people, family: true, thread: true}\norg: {label: Organization, plural: Organizations, layer: power, thread: true}\n",
            ),
            file("content/methodology/play.yaml", "first: 2026-11-04\ndays: 3\nsteps: [3]\nrest: 0\nleave_out: [harm]\n"),
        ];
        let root = write_repo("site-play", &files).unwrap();
        crate::site::copy_dir(&Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme"), &root.join("theme")).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        let out = root.join("dist");
        crate::site::build(&root, &kb, &crate::site::Opts { out: out.clone(), dev: true, graph: false }).unwrap();
        let play: Value = serde_json::from_slice(&std::fs::read(out.join("data/play.json")).unwrap()).unwrap();
        let days = play["days"].as_array().unwrap();
        assert_eq!(days.len(), 3, "{play}");
        for d in days {
            let way: Vec<&str> = d.as_array().unwrap().iter().filter_map(Value::as_str).collect();
            assert_eq!(way.len(), 4, "three links: {d}");
            // the ends share no story, and neither is from the story left out
            let mut ends = [way[0], way[3]];
            ends.sort();
            assert!(matches!(ends, ["ann", "beta"] | ["acme", "cy"]), "{d}");
        }
        assert!(out.join("play/index.html").exists());
        let _ = std::fs::remove_dir_all(&root);
    }
}
