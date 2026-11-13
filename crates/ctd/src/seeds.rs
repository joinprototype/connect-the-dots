//! `ctd seeds`: topics for the next stories, read from the record (ADR-0041). A row is a lead for the
//! story run to judge, with the sources the record already cites for it. Nothing here writes to
//! content/, and a seed is never a story: a person writes the brief and a writer reads the sources.
//!
//! - `new`: an entry no written story shows, by how many entries its sourced links reach, and more
//!   for each story two or more of those entries are in: a name between stories is where a new one
//!   joins them.
//! - `thread`: a person, body or place that runs through several stories with none of its own, by
//!   those stories and the sourced links on it that no story tells. A story about it joins them.
//! - `deepen`: a written story, by the entries it lacks that are joined to two or more of its own
//!   (most come from a harvest, ADR-0039), and the sourced links between its own entries that no
//!   story tells.
//! - `retell`: a written story told as a list of cases rather than one storyline, by its undated
//!   scenes, its steps back in time and over long gaps, and its scenes that share no name with the
//!   scenes beside them. A hint to read, never a verdict: an answer up front and a closing block of
//!   explanations step out of order by design.

use std::{
    collections::{BTreeMap, BTreeSet, HashMap},
    fmt::Write as _,
    fs,
    path::Path,
};

use anyhow::{Result, anyhow};
use serde::Deserialize;
use serde_json::Value;

use crate::kb::{Edge, Kb, shot_entries};

#[derive(Debug, PartialEq)]
pub struct Seed {
    pub kind: &'static str,
    pub score: usize,
    pub id: String,
    pub name: String,
    pub why: String,
    /// The record's sources most cited on the seed's links, most first.
    pub sources: Vec<String>,
}

/// content/methodology/seeds.yaml
#[derive(Deserialize)]
pub struct Rules {
    /// Types a new story may be about.
    pub topics: Vec<String>,
    /// Types that may run through stories as a thread.
    pub threads: Vec<String>,
    /// How many entries a new topic's sourced links reach, at least.
    pub reach: usize,
    /// How many of a story's own entries an entry it lacks is joined to, at least.
    pub ties: usize,
    /// How many stories a thread runs through, at least and at most: one in more is the world the
    /// stories happen in (the United States), not a topic.
    pub thread_stories: (usize, usize),
    /// A story is about an entry when this share of its scenes or more shows it.
    pub about: f64,
    /// A story whose jumps score this or more is a `retell` seed.
    pub retell: f64,
    /// Years between two scenes that count as a jump.
    pub gap: f64,
    /// An entry in more stories than this is the world they happen in: sharing it joins no scenes.
    pub hub: usize,
}

/// How many names, stories and sources a row lists.
const LIST: usize = 5;
/// The kinds, in the order they are listed.
pub const KINDS: [&str; 4] = ["new", "thread", "deepen", "retell"];

/// Every seed, by kind in `KINDS` order, best first.
pub fn find(kb: &Kb, rules: &Rules) -> Vec<Seed> {
    let kept = kb.kept_out();
    // every written story counts as showing its entries, a sealed one too: none of its names is a new topic
    let mut shown_in: HashMap<&str, BTreeSet<usize>> = HashMap::new();
    for (i, ch) in kb.chapters.iter().enumerate() {
        for shot in &ch.shots {
            for (_, id) in shot_entries(shot) {
                shown_in.entry(kb.resolve(id).map_or(id, |e| e.id.as_str())).or_default().insert(i);
            }
        }
    }
    let open: BTreeSet<usize> = kb.unsealed_chapters().iter().filter_map(|c| kb.chapters.iter().position(|x| x.id == c.id)).collect();
    // a claim any story's scene reveals is told; "<entry>#<claim>/1" is one target of a claim
    let told: BTreeSet<&str> =
        kb.chapters.iter().flat_map(|ch| &ch.shots).flat_map(|s| s["reveal_claims"].as_array().into_iter().flatten().filter_map(Value::as_str)).collect();
    let claim = |e: &Edge| e.id.split('/').next().unwrap_or(&e.id).to_string();
    // a link worth a story: sourced, current, not a family or background line, between two entries that may be joined
    let usable = |e: &Edge| {
        let rel = kb.schema.relations.get(&e.rel);
        let ends = [&e.from, &e.to].into_iter().all(|id| !kept.contains(id.as_str()) && kb.entity(id).is_some_and(|x| kb.joins(x)));
        e.status != "deprecated" && !e.sources.is_empty() && e.from != e.to && ends && !rel.is_some_and(|r| r.kinship || r.background || r.identity)
    };
    let mut out = Vec::new();

    for ent in &kb.entities {
        if shown_in.contains_key(ent.id.as_str()) || kept.contains(ent.id.as_str()) || !rules.topics.contains(&ent.kind) || !kb.joins(ent) {
            continue;
        }
        let links: Vec<(&Edge, bool)> = kb.links_of(&ent.id).filter(|(e, _)| usable(e)).collect();
        let reach: BTreeSet<&str> = links.iter().map(|(e, out)| e.other(*out)).collect();
        if reach.len() < rules.reach {
            continue;
        }
        let mut near: BTreeMap<usize, usize> = BTreeMap::new();
        for id in &reach {
            for &i in shown_in.get(id).into_iter().flatten().filter(|i| open.contains(i)) {
                *near.entry(i).or_default() += 1;
            }
        }
        // one shared name is the world a story happens in; two are a thread to it
        let mut stories: Vec<(usize, usize)> = near.into_iter().filter(|&(_, n)| n >= 2).collect();
        stories.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(&b.0)));
        let mut why = format!("{} sourced links to {} entries", links.len(), reach.len());
        if let Some(years) = years(links.iter().map(|(e, _)| *e)) {
            write!(why, ", {years}").unwrap();
        }
        if living(kb, &ent.id) {
            why.push_str("; living");
        }
        if !stories.is_empty() {
            let titles: Vec<&str> = stories.iter().take(LIST).map(|&(i, _)| kb.chapters[i].title.as_str()).collect();
            write!(why, "; near {}: {}", plural(stories.len(), "story", "stories"), titles.join(", ")).unwrap();
        }
        let names: Vec<String> = top(links.iter().map(|(e, out)| e.other(*out))).into_iter().map(|id| kb.name_of(id)).collect();
        write!(why, "; with {}", names.join(", ")).unwrap();
        out.push(Seed {
            kind: "new",
            score: reach.len() + 2 * stories.len(),
            id: ent.id.clone(),
            name: ent.name.clone(),
            why,
            sources: top(links.iter().flat_map(|(e, _)| e.sources.iter().map(|s| s.id.as_str()))).into_iter().map(String::from).collect(),
        });
    }

    for ent in &kb.entities {
        if kept.contains(ent.id.as_str()) || !rules.threads.contains(&ent.kind) {
            continue;
        }
        let runs = kb.thread_stories(&ent.id);
        if runs.len() < rules.thread_stories.0 || shown_in.get(ent.id.as_str()).map_or(0, BTreeSet::len) > rules.thread_stories.1 {
            continue;
        }
        let share = |ch: &crate::kb::Chapter| {
            let on = ch.shots.iter().filter(|s| shot_entries(s).any(|(_, id)| kb.resolve(id).is_some_and(|e| e.id == ent.id))).count();
            on as f64 / ch.shots.len().max(1) as f64
        };
        if runs.iter().any(|ch| share(ch) >= rules.about) {
            continue;
        }
        let untold: Vec<&Edge> = kb.links_of(&ent.id).map(|(e, _)| e).filter(|e| usable(e) && !told.contains(claim(e).as_str())).collect();
        let titles: Vec<&str> = runs.iter().take(LIST).map(|ch| ch.title.as_str()).collect();
        let mut why = format!("runs through {}: {}", plural(runs.len(), "story", "stories"), titles.join(", "));
        write!(why, "; {} on it no story tells", plural(untold.len(), "sourced link", "sourced links")).unwrap();
        if let Some(years) = years(untold.iter().copied()) {
            write!(why, ", {years}").unwrap();
        }
        if living(kb, &ent.id) {
            why.push_str("; living");
        }
        out.push(Seed {
            kind: "thread",
            score: 3 * runs.len() + untold.len(),
            id: ent.id.clone(),
            name: ent.name.clone(),
            why,
            sources: top(untold.iter().flat_map(|e| e.sources.iter().map(|s| s.id.as_str()))).into_iter().map(String::from).collect(),
        });
    }

    for &i in &open {
        let ch = &kb.chapters[i];
        let own: BTreeSet<&str> = shown_in.iter().filter(|(_, chs)| chs.contains(&i)).map(|(&id, _)| id).collect();
        let mut unshown: Vec<&Edge> = Vec::new();
        let mut ties: BTreeMap<&str, (BTreeSet<&str>, Vec<&Edge>)> = BTreeMap::new();
        for e in kb.edges.iter().filter(|e| usable(e)) {
            match (own.contains(e.from.as_str()), own.contains(e.to.as_str())) {
                (true, true) if !told.contains(claim(e).as_str()) => unshown.push(e),
                (true, false) | (false, true) => {
                    let (inside, outside) = if own.contains(e.from.as_str()) { (&e.from, &e.to) } else { (&e.to, &e.from) };
                    if !shown_in.contains_key(outside.as_str()) {
                        let t = ties.entry(outside.as_str()).or_default();
                        t.0.insert(inside.as_str());
                        t.1.push(e);
                    }
                }
                _ => {}
            }
        }
        ties.retain(|_, (inside, _)| inside.len() >= rules.ties);
        unshown.dedup_by_key(|e| claim(e));
        if ties.is_empty() && unshown.is_empty() {
            continue;
        }
        let mut lacks: Vec<(&str, usize)> = ties.iter().map(|(&id, (inside, _))| (id, inside.len())).collect();
        lacks.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));
        let mut why = format!("{} between its own entries no story tells", plural(unshown.len(), "sourced link", "sourced links"));
        if !lacks.is_empty() {
            let names: Vec<String> = lacks.iter().take(LIST).map(|&(id, n)| format!("{} ({n})", kb.name_of(id))).collect();
            write!(why, "; lacks {} joined to {} or more of its entries: {}", plural(lacks.len(), "entry", "entries"), rules.ties, names.join(", ")).unwrap();
        }
        let edges = unshown.iter().copied().chain(ties.values().flat_map(|(_, es)| es.iter().copied()));
        out.push(Seed {
            kind: "deepen",
            score: unshown.len() + 3 * lacks.len(),
            id: ch.id.clone(),
            name: ch.title.clone(),
            why,
            sources: top(edges.flat_map(|e| e.sources.iter().map(|s| s.id.as_str()))).into_iter().map(String::from).collect(),
        });
    }
    out.extend(retell(kb, rules, &open, &shown_in));
    let rank = |k: &str| KINDS.iter().position(|x| *x == k);
    out.sort_by(|a, b| rank(a.kind).cmp(&rank(b.kind)).then(b.score.cmp(&a.score)).then(a.id.cmp(&b.id)));
    out
}

/// Stories that read as a list of cases: scenes with no date, steps back in time after the opening
/// scene, gaps of more than `gap` years, and scenes that share no name (but the world's hubs) with
/// the scene before or after. Score: those faults per scene, plus the share of unjoined scenes.
fn retell(kb: &Kb, rules: &Rules, open: &BTreeSet<usize>, shown_in: &HashMap<&str, BTreeSet<usize>>) -> Vec<Seed> {
    let mut out = Vec::new();
    for &i in open {
        let ch = &kb.chapters[i];
        let n = ch.shots.len();
        if n < 3 {
            continue;
        }
        let years: Vec<Option<f64>> = ch.shots.iter().map(|s| s["time"].as_str().and_then(|t| crate::edtf::parse(t).ok()).map(|w| w.start)).collect();
        let names: Vec<BTreeSet<&str>> = ch
            .shots
            .iter()
            .map(|s| {
                shot_entries(s)
                    .map(|(_, id)| kb.resolve(id).map_or(id, |e| e.id.as_str()))
                    .filter(|id| shown_in.get(id).map_or(0, BTreeSet::len) <= rules.hub)
                    .collect()
            })
            .collect();
        let undated = years.iter().filter(|y| y.is_none()).count();
        let steps: Vec<(f64, f64)> = (2..n).filter_map(|k| Some((years[k - 1]?, years[k]?))).collect();
        let back = steps.iter().filter(|(a, b)| b < &(a - 1.0)).count();
        let gaps = steps.iter().filter(|(a, b)| (b - a).abs() > rules.gap).count();
        let joined = (0..n).filter(|&k| (k > 0 && !names[k].is_disjoint(&names[k - 1])) || (k + 1 < n && !names[k].is_disjoint(&names[k + 1]))).count();
        let score = (undated + back + gaps) as f64 / n as f64 + (n - joined) as f64 / n as f64;
        if score < rules.retell {
            continue;
        }
        let mut faults = Vec::new();
        for (count, one, many) in [(undated, "undated scene", "undated scenes"), (back, "step back in time", "steps back in time"), (gaps, "jump", "jumps")] {
            if count > 0 {
                faults.push(if count == 1 { format!("1 {one}") } else { format!("{count} {many}") });
            }
        }
        if gaps > 0 {
            let last = faults.len() - 1;
            faults[last].push_str(&format!(" over {} years", rules.gap));
        }
        faults.push(format!("{} of {n} scenes share no name with a scene beside them", n - joined));
        out.push(Seed {
            kind: "retell",
            score: (score * 100.0).round() as usize,
            id: ch.id.clone(),
            name: ch.title.clone(),
            why: faults.join("; "),
            sources: Vec::new(),
        });
    }
    out
}

/// The `LIST` most frequent of `items`, most first, then by name.
fn top<'a>(items: impl Iterator<Item = &'a str>) -> Vec<&'a str> {
    let mut n: BTreeMap<&str, usize> = BTreeMap::new();
    for i in items {
        *n.entry(i).or_default() += 1;
    }
    let mut list: Vec<(&str, usize)> = n.into_iter().collect();
    list.sort_by(|a, b| b.1.cmp(&a.1).then(a.0.cmp(b.0)));
    list.into_iter().take(LIST).map(|(i, _)| i).collect()
}

/// The years the links are dated over: "1946–1948", or one year.
fn years<'a>(edges: impl Iterator<Item = &'a Edge>) -> Option<String> {
    let starts: Vec<i64> = edges.filter_map(|e| e.when.as_ref()).map(|w| w.start.floor() as i64).collect();
    let (lo, hi) = (*starts.iter().min()?, *starts.iter().max()?);
    let y = crate::edtf::year_label;
    Some(if lo == hi { y(lo) } else { format!("{}–{}", y(lo), y(hi)) })
}

/// A person whose life span has a start and no end: a story about them follows the living-person rules.
fn living(kb: &Kb, id: &str) -> bool {
    kb.entity(id).is_some_and(|e| e.kind == "person" && e.when.as_ref().is_some_and(|w| w.open_end))
}

fn plural(n: usize, one: &str, many: &str) -> String {
    format!("{n} {}", if n == 1 { one } else { many })
}

/// Writes the seeds to `out` as TSV: at most `top` of each kind.
pub fn run(root: &Path, kb: &Kb, top: Option<usize>, out: &Path) -> Result<()> {
    let path = root.join("content").join("methodology").join("seeds.yaml");
    let rules: Rules = serde_saphyr::from_str(&fs::read_to_string(&path)?).map_err(|e| anyhow!("seeds.yaml: {e}"))?;
    let seeds = find(kb, &rules);
    let mut tsv =
        String::from("# ctd seeds: topics for stories, from the record (ADR-0041). A lead to judge, never a story.\nkind\tscore\tid\tname\twhy\tsources\n");
    let mut counts: BTreeMap<&str, usize> = BTreeMap::new();
    for s in &seeds {
        let n = counts.entry(s.kind).or_default();
        if top.is_some_and(|t| *n >= t) {
            continue;
        }
        *n += 1;
        let clean = |t: &str| t.replace(['\t', '\n'], " ");
        writeln!(tsv, "{}\t{}\t{}\t{}\t{}\t{}", s.kind, s.score, s.id, clean(&s.name), clean(&s.why), s.sources.join(" ")).unwrap();
    }
    if let Some(dir) = out.parent() {
        fs::create_dir_all(dir)?;
    }
    fs::write(out, tsv)?;
    let said: Vec<String> = counts.iter().map(|(k, n)| format!("{n} {k}")).collect();
    println!("{} seeds ({}) in {}", seeds.len().min(counts.values().sum()), said.join(", "), out.display());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::testkit::{entity, file, load, source};

    fn claim(id: &str, rel: &str, to: &str, year: &str) -> String {
        format!("  - id: {id}\n    rel: {rel}\n    to: {to}\n    when: \"{year}\"\n    src: [{{s: src-a, quote: \"q\"}}]\n")
    }

    fn chapter(id: &str, shown: &[&str], revealed: &[&str]) -> crate::testkit::File {
        file(
            &format!("content/chapters/{id}.md"),
            &format!(
                "---\nid: {id}\ntype: chapter\ntitle: Story {id}\n---\n\nIntro.\n\n```scene\n- shot: one\n  view: graph\n  reveal: [{}]\n  reveal_claims: [{}]\n  narration: \"One.\"\n```\n",
                shown.join(", "),
                revealed.join(", ")
            ),
        )
    }

    #[test]
    fn an_entry_between_stories_and_one_a_story_lacks_are_seeds() {
        let mut files = vec![source("src-a", "T1")];
        // hub founded four orgs: two in story one, one in story two, one in none
        let hub = ["o1", "o2", "o3", "o4"].iter().enumerate().map(|(i, o)| claim(&format!("c{i}"), "founded", o, "1950")).collect::<String>();
        files.push(entity("person", "hub", "Hub Person", &hub));
        for o in ["o1", "o2", "o3", "o4"] {
            files.push(entity("org", o, &format!("Org {o}"), ""));
        }
        // o1 founded o2: a link inside story one that its scene does not reveal
        files.retain(|f| !f.0.ends_with("/o1.md"));
        files.push(entity("org", "o1", "Org o1", &claim("c1", "founded", "o2", "1960")));
        // a lone person with one link is no topic
        files.push(entity("person", "lone", "Lone Person", &claim("c1", "founded", "o4", "1970")));
        files.push(chapter("one", &["o1", "o2"], &[]));
        files.push(chapter("two", &["o3"], &[]));
        let (kb, diags) = load("seeds", &files);
        assert!(diags.iter().all(|d| d.level != crate::diag::Level::Error), "{diags:?}");
        let rules = Rules {
            topics: vec!["person".into(), "org".into()],
            threads: vec!["person".into()],
            reach: 4,
            ties: 2,
            thread_stories: (3, 10),
            about: 0.4,
            retell: 0.5,
            gap: 60.0,
            hub: 8,
        };
        let seeds = find(&kb, &rules);
        let new: Vec<&Seed> = seeds.iter().filter(|s| s.kind == "new").collect();
        assert_eq!(new.iter().map(|s| s.id.as_str()).collect::<Vec<_>>(), ["hub"], "lone reaches one entry");
        assert_eq!(new[0].score, 4 + 2, "four entries, and two of them in story one; one name in story two is not a thread");
        assert!(new[0].why.contains("near 1 story: Story one;"), "{}", new[0].why);
        assert_eq!(new[0].sources, ["src-a"]);
        let one = seeds.iter().find(|s| s.kind == "deepen" && s.id == "one").expect("story one can deepen");
        assert!(one.why.starts_with("1 sourced link"), "{}", one.why);
        assert!(one.why.contains("Hub Person (2)"), "{}", one.why);
        assert_eq!(one.score, 1 + 3);
        assert!(!seeds.iter().any(|s| s.kind == "deepen" && s.id == "two"), "hub touches only one of story two's entries");
    }
}
