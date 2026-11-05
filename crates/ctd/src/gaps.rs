//! `ctd gaps`: what the record may be missing, read against the atlas (ADR-0025). A row is a lead for
//! someone to check against a source. Nothing here writes to content/, and a lead is never proof.

use std::{
    collections::{BTreeSet, HashMap, HashSet},
    fmt::Write as _,
    fs,
    path::Path,
};

use anyhow::{Result, anyhow};
use serde::Deserialize;

use crate::{
    atlas::{Atlas, curated},
    kb::{Kb, shot_entries},
};

/// content/methodology/gaps.yaml
#[derive(Deserialize)]
struct Rules {
    hub: usize,
    group: usize,
    dot: usize,
    skip: Vec<String>,
    places: Vec<String>,
    minor: Vec<String>,
    people_only: Vec<String>,
}

#[derive(Debug, PartialEq)]
pub struct Lead {
    pub kind: &'static str,
    pub score: f64,
    pub from: String,
    pub relation: String,
    pub to: String,
    pub why: String,
}

/// The order leads are listed in.
pub const KINDS: [&str; 4] = ["ids", "links", "thin", "dots"];
/// How many imported offers a thin entry lists.
const OFFERS: usize = 3;
/// How far apart two entries are counted; anything further, or not joined at all, is this.
const FAR: u8 = 5;

/// Both ends of every link, by entry, then relation and direction, then best known first (the atlas is
/// in order of fame). A relation group is a run of this list, so its size costs nothing to read, and a
/// group of 5,000 is skipped as cheaply as one of 50.
struct Index {
    off: Vec<u32>,
    to: Vec<u32>,
    rd: Vec<u8>,
}

impl Index {
    fn new(a: &Atlas) -> Self {
        let pack = |e: u32, r: u8, out: u64, other: u32| (e as u64) << 36 | (r as u64 * 2 + out) << 28 | other as u64;
        let mut ends: Vec<u64> = a.links.iter().flat_map(|&(x, r, y)| [pack(x, r, 1, y), pack(y, r, 0, x)]).collect();
        ends.sort_unstable();
        ends.dedup();
        let mut off = vec![0u32; a.entries.len() + 1];
        for e in &ends {
            off[(e >> 36) as usize + 1] += 1;
        }
        for i in 1..off.len() {
            off[i] += off[i - 1];
        }
        Index { off, to: ends.iter().map(|e| (e & 0xfff_ffff) as u32).collect(), rd: ends.iter().map(|e| (e >> 28) as u8).collect() }
    }

    fn degree(&self, e: usize) -> usize {
        (self.off[e + 1] - self.off[e]) as usize
    }

    /// An entry's relation groups: its relation's place in the atlas, and who is at the other end.
    fn groups(&self, e: usize) -> impl Iterator<Item = (usize, bool, &[u32])> {
        let (mut at, end) = (self.off[e] as usize, self.off[e + 1] as usize);
        self.rd[at..end].chunk_by(|a, b| a == b).map(move |run| {
            let group = &self.to[at..at + run.len()];
            at += run.len();
            ((run[0] / 2) as usize, run[0] % 2 == 1, group)
        })
    }
}

struct Scan<'a> {
    kb: &'a Kb,
    a: &'a Atlas,
    rules: Rules,
    ignored: HashSet<(String, String, String)>,
    index: Index,
    /// Atlas entry → hand entry, and the way back.
    hand_of: Vec<Option<u32>>,
    atlas_of: Vec<Option<u32>>,
    /// Who each hand entry is linked to in the record, and its stories.
    near: Vec<HashSet<u32>>,
    stories: Vec<BTreeSet<usize>>,
}

impl<'a> Scan<'a> {
    fn new(kb: &'a Kb, a: &'a Atlas, rules: Rules, ignored: HashSet<(String, String, String)>) -> Self {
        let n = kb.entities.len();
        let hand = curated(kb);
        let hand_of: Vec<Option<u32>> = a.entries.iter().map(|e| hand.get(&e.qid).map(|&i| i as u32)).collect();
        let mut atlas_of = vec![None; n];
        hand_of.iter().enumerate().for_each(|(i, h)| h.iter().for_each(|&h| atlas_of[h as usize] = Some(i as u32)));
        let mut near = vec![HashSet::new(); n];
        for e in kb.edges.iter().filter(|e| e.status != "deprecated") {
            if let (Some(&x), Some(&y)) = (kb.index.get(&e.from), kb.index.get(&e.to)) {
                near[x].insert(y as u32);
                near[y].insert(x as u32);
            }
        }
        let mut stories = vec![BTreeSet::new(); n];
        for (c, chapter) in kb.chapters.iter().enumerate() {
            for (_, id) in chapter.shots.iter().flat_map(shot_entries) {
                if let Some(&i) = kb.index.get(id) {
                    stories[i].insert(c);
                }
            }
        }
        Scan { kb, a, index: Index::new(a), rules, ignored, hand_of, atlas_of, near, stories }
    }

    fn strong(&self, relation: &str) -> bool {
        let r = &self.rules;
        self.kb.schema.relations.get(relation).is_some_and(|x| x.traversable) && !r.skip.iter().chain(&r.places).any(|s| s == relation)
    }

    fn id(&self, hand: u32) -> &str {
        &self.kb.entities[hand as usize].id
    }

    /// Steps between two hand entries in the record, up to FAR (further, or not joined). Two steps out
    /// from each end meet on any way of four steps or fewer, so no table of every pair is kept: at
    /// 30,000 entries that table was 900 MB.
    fn apart(&self, a: u32, b: u32) -> u8 {
        if a == b {
            return 0;
        }
        let (from, to) = (self.ball(a), self.ball(b));
        let (small, big) = if from.len() <= to.len() { (&from, &to) } else { (&to, &from) };
        small.iter().filter_map(|(x, d)| big.get(x).map(|e| d + e)).min().unwrap_or(FAR).min(FAR)
    }

    /// The entries within two steps of one, with their steps.
    fn ball(&self, from: u32) -> HashMap<u32, u8> {
        let mut steps = HashMap::from([(from, 0u8)]);
        let mut edge = vec![from];
        for step in 1..=2u8 {
            let mut next = Vec::new();
            for x in edge {
                for &y in &self.near[x as usize] {
                    steps.entry(y).or_insert_with(|| {
                        next.push(y);
                        step
                    });
                }
            }
            edge = next;
        }
        steps
    }

    fn lead(&self, kind: &'static str, score: f64, from: String, relation: &str, to: String, why: String) -> Option<Lead> {
        let key = (from, relation.to_string(), to);
        (!self.ignored.contains(&key)).then_some(Lead { kind, score, from: key.0, relation: key.1, to: key.2, why })
    }

    /// An id that is not in the atlas, or none, where the atlas has an entry of that very name. A
    /// person reads each one: about half are the wrong item, and the rest the atlas left out.
    fn ids(&self) -> Vec<Lead> {
        let wanted: HashSet<String> = self.kb.entities.iter().flat_map(|e| e.aliases.iter().chain([&e.name])).map(|n| n.to_lowercase()).collect();
        let mut named: HashMap<String, usize> = HashMap::new();
        for (i, e) in self.a.entries.iter().enumerate() {
            let name = e.name.to_lowercase();
            if self.hand_of[i].is_none() && wanted.contains(&name) {
                named.entry(name).or_insert(i);
            }
        }
        let mut leads = Vec::new();
        for (h, entity) in self.kb.entities.iter().enumerate().filter(|&(h, _)| self.atlas_of[h].is_none()) {
            let id = entity.same_as.get("wikidata");
            let names = entity.aliases.iter().chain([&entity.name]);
            let Some(&i) = names.filter_map(|n| named.get(&n.to_lowercase())).min() else { continue };
            let found = &self.a.entries[i];
            // with no id to doubt, a name alone is weak: ask for the same kind of thing too
            if id.is_none() && found.kind() != entity.kind {
                continue;
            }
            let why = format!("has {}; the atlas has {}: {}", id.map_or("no id", String::as_str), found.name, found.summary);
            leads.extend(self.lead("ids", found.fame as f64, self.id(h as u32).to_string(), "same_as", format!("Q{}", found.qid), why));
        }
        leads
    }

    /// Atlas links between two hand entries the record does not join. Those far apart first: a link
    /// across the record tells a reader more than one between neighbours.
    fn links(&self) -> Vec<Lead> {
        let mut seen = HashSet::new();
        let mut leads = Vec::new();
        for &(x, r, y) in &self.a.links {
            let (Some(p), Some(q)) = (self.hand_of[x as usize], self.hand_of[y as usize]) else { continue };
            let relation = &self.a.relations[r as usize];
            if p == q || self.near[p as usize].contains(&q) || self.rules.skip.contains(relation) || !seen.insert((p, r, q)) {
                continue;
            }
            let (from, to) = (&self.kb.entities[p as usize], &self.kb.entities[q as usize]);
            let Some(rule) = self.kb.schema.relations.get(relation) else { continue };
            if !rule.from.allows(&from.kind) || !rule.to.allows(&to.kind) {
                continue;
            }
            let tier = if self.rules.places.contains(relation) {
                0
            } else if self.rules.minor.contains(relation) {
                1
            } else {
                2
            };
            let far = self.apart(p, q);
            let why = format!("{} and {}: {} in the record", from.name, to.name, if far == FAR { "not joined".to_string() } else { format!("{far} apart") });
            leads.extend(self.lead("links", (tier * 10 + far as usize) as f64, from.id.clone(), relation, to.id.clone(), why));
        }
        leads
    }

    /// Hand entries with one link or none, and what the atlas offers them: the record's thin places.
    fn thin(&self) -> Vec<Lead> {
        let mut leads = Vec::new();
        for (h, near) in self.near.iter().enumerate().filter(|(_, near)| near.len() <= 1) {
            let Some(at) = self.atlas_of[h] else { continue };
            let mut imported = 0;
            for (r, out, group) in self.index.groups(at as usize) {
                let relation = &self.a.relations[r];
                if !self.strong(relation) || group.len() > self.rules.group {
                    continue;
                }
                for &other in group {
                    let e = &self.a.entries[other as usize];
                    let (to, score) = match self.hand_of[other as usize] {
                        Some(hand) => (self.id(hand).to_string(), 2.0),
                        None if imported < OFFERS => {
                            imported += 1;
                            (format!("Q{}", e.qid), 1.0)
                        }
                        None => continue,
                    };
                    let (from, to) = if out { (self.id(h as u32).to_string(), to) } else { (to, self.id(h as u32).to_string()) };
                    let why = format!("{} has {} in the record; the other end is {}", self.kb.entities[h].name, near.len(), e.name);
                    leads.extend(self.lead("thin", score, from, relation, to, why));
                }
            }
        }
        leads
    }

    /// Imported entries that join hand entries the record keeps apart: the best next dots to write.
    /// A pair many dots join (two universities, by their professors) counts for little in each.
    fn dots(&self) -> Vec<Lead> {
        let mut joins: HashMap<u32, BTreeSet<u32>> = HashMap::new();
        for (h, at) in self.atlas_of.iter().enumerate() {
            let Some(at) = at.filter(|&at| self.index.degree(at as usize) <= self.rules.hub) else { continue };
            for (r, _, group) in self.index.groups(at as usize) {
                let relation = &self.a.relations[r];
                if !self.strong(relation) || group.len() > self.rules.group {
                    continue;
                }
                for &z in group {
                    let e = &self.a.entries[z as usize];
                    let counts = !self.rules.people_only.contains(relation) || e.kind() == "person";
                    if counts && self.hand_of[z as usize].is_none() && self.index.degree(z as usize) <= self.rules.dot {
                        joins.entry(z).or_default().insert(h as u32);
                    }
                }
            }
        }
        let apart_pairs = |hands: &BTreeSet<u32>| -> Vec<(u32, u32)> {
            let list: Vec<u32> = hands.iter().copied().collect();
            let pairs = list.iter().enumerate().flat_map(|(i, &a)| list[i + 1..].iter().map(move |&b| (a, b)));
            pairs.filter(|&(a, b)| !self.near[a as usize].contains(&b)).collect()
        };
        let mut joined: HashMap<(u32, u32), u32> = HashMap::new();
        for hands in joins.values() {
            apart_pairs(hands).into_iter().for_each(|pair| *joined.entry(pair).or_default() += 1);
        }
        let mut leads = Vec::new();
        for (&z, hands) in &joins {
            let pairs = apart_pairs(hands);
            let worth: f64 = pairs.iter().map(|&(a, b)| (if self.apart(a, b) == 2 { 0.5 } else { 1.0 }) / (1.0 + (joined[&(a, b)] as f64).ln())).sum();
            if worth <= 0.0 {
                continue;
            }
            let e = &self.a.entries[z as usize];
            let stories: BTreeSet<usize> = hands.iter().flat_map(|&h| self.stories[h as usize].iter().copied()).collect();
            let names: Vec<&str> = hands.iter().take(8).map(|&h| self.kb.entities[h as usize].name.as_str()).collect();
            let why = format!("{}: joins {} in {} stories", e.name, names.join(", "), stories.len());
            leads.extend(self.lead(
                "dots",
                worth / (1.0 + self.index.degree(z as usize) as f64).ln(),
                format!("Q{}", e.qid),
                "joins",
                hands.len().to_string(),
                why,
            ));
        }
        leads
    }
}

pub fn find(kb: &Kb, a: &Atlas, rules: &str, ignore: &str) -> Result<Vec<Lead>> {
    let rules: Rules = serde_saphyr::from_str(rules).map_err(|e| anyhow!("gaps.yaml: {e}"))?;
    let ignored = ignore.lines().filter(|l| !l.starts_with('#')).filter_map(|l| {
        let mut f = l.split('\t').map(str::to_string);
        Some((f.next()?, f.next()?, f.next()?))
    });
    let scan = Scan::new(kb, a, rules, ignored.collect());
    let mut leads: Vec<Lead> = [scan.ids(), scan.links(), scan.thin(), scan.dots()].into_iter().flatten().collect();
    let rank = |l: &Lead| KINDS.iter().position(|k| *k == l.kind);
    leads.sort_by(|x, y| rank(x).cmp(&rank(y)).then(y.score.total_cmp(&x.score)).then_with(|| (&x.from, &x.to).cmp(&(&y.from, &y.to))));
    Ok(leads)
}

/// Writes the leads as one TSV, `top` of each kind (or all), and says how many there are.
pub fn run(root: &Path, kb: &Kb, a: &Atlas, top: Option<usize>, out: &Path) -> Result<()> {
    let methodology = root.join("content").join("methodology");
    // rejected for good, or tried without finding a source (.cache: it may still be true)
    let read = |p: &Path| fs::read_to_string(p).unwrap_or_default();
    let ignored = read(&methodology.join("gaps-ignore.tsv")) + &read(&root.join(".cache").join("gaps-tried.tsv"));
    let leads = find(kb, a, &read(&methodology.join("gaps.yaml")), &ignored)?;
    let mut tsv = String::from("kind\tscore\tfrom\trelation\tto\twhy\n");
    for kind in KINDS {
        let of = leads.iter().filter(|l| l.kind == kind);
        println!("{kind}: {}", of.clone().count());
        for l in of.take(top.unwrap_or(usize::MAX)) {
            writeln!(tsv, "{}\t{:.3}\t{}\t{}\t{}\t{}", l.kind, l.score, l.from, l.relation, l.to, l.why.replace(['\t', '\n'], " "))?;
        }
    }
    if let Some(dir) = out.parent() {
        fs::create_dir_all(dir)?;
    }
    fs::write(out, tsv)?;
    println!("wrote {}: leads to check against a source, none of them proof", out.display());
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::{
        atlas::Entry,
        testkit::{file, load},
    };

    const RULES: &str = "hub: 100\ngroup: 3\ndot: 5\nskip: [citizen_of]\nplaces: []\nminor: []\npeople_only: []\n";

    fn entry(qid: u32, kind: u8, name: &str) -> Entry {
        Entry { qid, kind, fame: 1000 - qid as u16, name: name.to_string(), summary: String::new(), start: None, end: None, coords: None, image: String::new() }
    }

    fn hand(id: &str, q: u32) -> crate::testkit::File {
        file(
            &format!("content/entities/org/{}/{id}.md", &id[..2]),
            &format!("---\nid: {id}\ntype: org\nname: {id}\nsame_as: {{wikidata: Q{q}}}\nclaims: []\n---\n"),
        )
    }

    fn relations() -> crate::testkit::File {
        file(
            "content/schema/relations.yaml",
            "founded: {label: founded, inverse: founded by, from: [org], to: [org]}\ncitizen_of: {label: citizen of, inverse: citizens, from: [org], to: [org]}\n",
        )
    }

    fn atlas(entries: Vec<Entry>, links: Vec<(u32, u8, u32)>) -> Atlas {
        Atlas { entries, links, relations: vec!["founded".to_string(), "citizen_of".to_string()] }
    }

    #[test]
    fn finds_a_missing_link_and_a_dot_between_two_entries_but_never_passes_through_a_big_group() {
        let (kb, _) = load("gaps", &[relations(), hand("alpha", 1), hand("beta", 2), hand("gamma", 3)]);
        let mut entries = vec![entry(1, 4, "Alpha"), entry(2, 4, "Beta"), entry(3, 4, "Gamma"), entry(4, 4, "Middle"), entry(5, 4, "Crowd")];
        // alpha founded beta; the middle joins beta and gamma; four children make alpha's other group too big to walk
        let mut links = vec![(0, 0, 1), (0, 1, 2), (3, 0, 1), (3, 0, 2)];
        for i in 0..4 {
            entries.push(entry(10 + i, 4, "Child"));
            links.push((2, 0, 5 + i));
        }
        let leads = find(&kb, &atlas(entries, links), RULES, "").unwrap();
        let of = |kind: &str| leads.iter().filter(|l| l.kind == kind).collect::<Vec<_>>();
        assert_eq!(of("links").iter().map(|l| (&l.from[..], &l.to[..])).collect::<Vec<_>>(), [("alpha", "beta")], "citizen_of is skipped");
        assert_eq!(of("dots").iter().map(|l| &l.from[..]).collect::<Vec<_>>(), ["Q4"]);
        assert!(!leads.iter().any(|l| l.why.contains("Child") && l.kind == "dots"), "a group over the cap is not walked");
    }

    #[test]
    fn a_rejected_lead_stays_out_and_a_wrong_id_is_flagged() {
        let (kb, _) = load("gaps-ids", &[relations(), hand("alpha", 1), hand("beta", 2), hand("nasa", 9)]);
        let entries = vec![entry(1, 4, "Alpha"), entry(2, 4, "Beta"), entry(3, 4, "nasa")];
        let a = atlas(entries, vec![(0, 0, 1)]);
        let leads = find(&kb, &a, RULES, "# checked\nalpha\tfounded\tbeta\tno\n").unwrap();
        assert!(!leads.iter().any(|l| l.kind == "links"));
        assert_eq!(leads.iter().filter(|l| l.kind == "ids").map(|l| (&l.from[..], &l.to[..])).collect::<Vec<_>>(), [("nasa", "Q3")]);
    }
}
