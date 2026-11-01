//! The atlas: the best-known things in the world, from open data (ADR-0023). It is read from
//! .cache/atlas, which tools/atlas/ fills, so a checkout without it builds the hand-sourced site alone.
//! Entries in content/ hold the proof. The atlas holds the wide picture, always marked as open data.

use std::{
    collections::{BTreeMap, HashMap},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::Path,
};

use anyhow::Result;
use flate2::read::GzDecoder;
use rayon::prelude::*;
use serde_json::{Value, json};

use crate::kb::Kb;

/// Files the entries are packed into: what keeps a million entries under a host's limit on files.
pub const SHARDS: u32 = 4096;
/// A map node id from here up is an atlas entry: the rest is its Wikidata number.
pub const ATLAS_IDS: u32 = 1 << 31;
/// How many links of one kind an entry lists, best known first.
const PER_PHRASE: usize = 40;
const KINDS: [&str; 8] = ["person", "event", "work", "place", "org", "artifact", "tradition", "concept"];

pub struct Entry {
    pub qid: u32,
    pub kind: u8,
    /// How well known it is: the language editions that cover it. Only ever a ranking.
    pub fame: u16,
    pub name: String,
    pub summary: String,
    pub start: Option<i32>,
    pub end: Option<i32>,
    pub coords: Option<[f32; 2]>,
    pub image: String,
}

impl Entry {
    pub fn kind(&self) -> &'static str {
        KINDS[self.kind as usize]
    }

    fn years(&self) -> Option<String> {
        match (self.start, self.end) {
            (Some(a), Some(b)) => Some(format!("{}–{}", year(a), year(b))),
            (Some(a), None) => Some(year(a)),
            (None, Some(b)) => Some(format!("until {}", year(b))),
            (None, None) => None,
        }
    }
}

/// Site years are astronomical (0 is 1 BCE); Wikidata's are too.
fn year(y: i32) -> String {
    if y <= 0 { format!("{} BCE", 1 - y) } else { y.to_string() }
}

pub struct Atlas {
    /// Best known first.
    pub entries: Vec<Entry>,
    /// (from, relation, to): places in `entries` and `relations`.
    pub links: Vec<(u32, u8, u32)>,
    pub relations: Vec<String>,
}

fn lines(path: &Path) -> Result<impl Iterator<Item = String>> {
    let reader = BufReader::with_capacity(1 << 20, GzDecoder::new(File::open(path)?));
    Ok(reader.lines().map_while(|l| l.ok()))
}

fn number(q: &str) -> Option<u32> {
    q.strip_prefix('Q')?.parse().ok()
}

/// The atlas in `root`, if tools/atlas/build.py has made one.
pub fn load(root: &Path) -> Result<Option<Atlas>> {
    let dir = root.join(".cache").join("atlas");
    if !dir.join("entries.tsv.gz").exists() || !dir.join("links.tsv.gz").exists() {
        return Ok(None);
    }
    let mut entries: Vec<Entry> = Vec::new();
    for line in lines(&dir.join("entries.tsv.gz"))? {
        let f: Vec<&str> = line.split('\t').collect();
        let (Some(qid), Some(kind), true) = (number(f[0]), KINDS.iter().position(|k| *k == f[1]), f.len() >= 11) else { continue };
        let coords = f[8].parse().ok().zip(f[9].parse().ok()).map(|(a, b)| [a, b]);
        entries.push(Entry {
            qid,
            kind: kind as u8,
            fame: f[2].parse().unwrap_or(0),
            name: f[3].to_string(),
            summary: f[4].to_string(),
            start: f[5].parse().ok(),
            end: f[6].parse().ok(),
            coords,
            image: f[10].to_string(),
        });
    }
    entries.sort_by_key(|e| (std::cmp::Reverse(e.fame), e.qid));
    let place: HashMap<u32, u32> = entries.iter().enumerate().map(|(i, e)| (e.qid, i as u32)).collect();
    let mut relations: Vec<String> = Vec::new();
    let mut links = Vec::new();
    for line in lines(&dir.join("links.tsv.gz"))? {
        let mut f = line.split('\t');
        let (Some(a), Some(r), Some(b)) = (f.next(), f.next(), f.next()) else { continue };
        let (Some(&a), Some(&b)) = (number(a).and_then(|q| place.get(&q)), number(b).and_then(|q| place.get(&q))) else { continue };
        let r = relations.iter().position(|x| x == r).unwrap_or_else(|| {
            relations.push(r.to_string());
            relations.len() - 1
        });
        links.push((a, r as u8, b));
    }
    Ok(Some(Atlas { entries, links, relations }))
}

/// Entries written by hand, by Wikidata number: the atlas points to them instead of standing in.
pub fn curated(kb: &Kb) -> HashMap<u32, usize> {
    let wikidata = |e: &crate::kb::Entity| e.same_as.get("wikidata").map(|v| v.to_string().trim_matches('"').to_string());
    kb.entities.iter().enumerate().filter_map(|(i, e)| wikidata(e).and_then(|q| number(&q)).map(|q| (q, i))).collect()
}

/// One shard: `{"Q42": {...}}`, each entry with its links grouped by what they say.
fn shard(a: &Atlas, kb: &Kb, hand: &HashMap<u32, usize>, adjacent: &[Vec<(u32, u8, bool)>], members: &[u32]) -> Value {
    let mut out = serde_json::Map::new();
    for &i in members {
        let e = &a.entries[i as usize];
        let mut groups: BTreeMap<String, Vec<u32>> = BTreeMap::new();
        for &(other, rel, outgoing) in &adjacent[i as usize] {
            let Some(r) = kb.schema.relations.get(&a.relations[rel as usize]) else { continue };
            groups.entry(if outgoing { r.label.clone() } else { r.inverse.clone() }).or_default().push(other);
        }
        let groups: Vec<Value> = groups
            .into_iter()
            .map(|(phrase, mut list)| {
                // `entries` is best known first, so a smaller place is a better-known thing
                list.sort_unstable();
                list.dedup();
                let more = list.len().saturating_sub(PER_PHRASE);
                let shown: Vec<Value> = list
                    .iter()
                    .take(PER_PHRASE)
                    .map(|&j| {
                        let n = &a.entries[j as usize];
                        match hand.get(&n.qid) {
                            Some(&c) => json!([n.qid, kb.entities[c].name, n.kind, kb.entities[c].id]),
                            None => json!([n.qid, n.name, n.kind]),
                        }
                    })
                    .collect();
                json!([phrase, shown, more])
            })
            .collect();
        let mut v = json!({ "n": e.name, "k": e.kind, "g": groups });
        if !e.summary.is_empty() {
            v["d"] = json!(e.summary);
        }
        if let Some(y) = e.years() {
            v["y"] = json!(y);
        }
        if let Some(c) = e.coords {
            v["c"] = json!(c);
        }
        if !e.image.is_empty() {
            v["i"] = json!(e.image);
        }
        if let Some(&c) = hand.get(&e.qid) {
            v["u"] = json!(format!("/e/{}/", kb.entities[c].id));
        }
        out.insert(format!("Q{}", e.qid), v);
    }
    Value::Object(out)
}

/// Packs the atlas into `data/a/<n>.json`. Reading an entry costs one small file, whatever the total.
pub fn write(a: &Atlas, kb: &Kb, out: &Path) -> Result<()> {
    let dir = out.join("data").join("a");
    fs::create_dir_all(&dir)?;
    let hand = curated(kb);
    let mut adjacent: Vec<Vec<(u32, u8, bool)>> = vec![Vec::new(); a.entries.len()];
    for &(x, r, y) in &a.links {
        adjacent[x as usize].push((y, r, true));
        adjacent[y as usize].push((x, r, false));
    }
    let mut shards: Vec<Vec<u32>> = vec![Vec::new(); SHARDS as usize];
    for (i, e) in a.entries.iter().enumerate() {
        shards[(e.qid % SHARDS) as usize].push(i as u32);
    }
    shards.par_iter().enumerate().try_for_each(|(n, members)| -> Result<()> {
        fs::write(dir.join(format!("{n}.json")), serde_json::to_vec(&shard(a, kb, &hand, &adjacent, members))?)?;
        Ok(())
    })
}

/// Search rows for the atlas, best known first. Entries written by hand are already in search.
pub fn search(a: &Atlas, kb: &Kb) -> Vec<Value> {
    let hand = curated(kb);
    a.entries
        .iter()
        .filter(|e| !hand.contains_key(&e.qid))
        .map(|e| json!({ "id": format!("Q{}", e.qid), "name": e.name, "aliases": [], "type": e.kind(), "summary": e.summary.chars().take(70).collect::<String>(), "when": e.years(), "url": format!("/a/?q=Q{}", e.qid) }))
        .collect()
}

#[cfg(test)]
mod tests {
    use std::io::Write;

    use flate2::{Compression, write::GzEncoder};

    use super::*;
    use crate::testkit::{entity, file, load as load_kb, write_repo};

    fn gz(path: &Path, text: &str) {
        let mut out = GzEncoder::new(File::create(path).unwrap(), Compression::fast());
        out.write_all(text.as_bytes()).unwrap();
        out.finish().unwrap();
    }

    #[test]
    fn a_written_entry_wins_and_links_are_best_known_first() {
        let root = write_repo("atlas", &[]).unwrap();
        let dir = root.join(".cache/atlas");
        fs::create_dir_all(&dir).unwrap();
        // one person, one place in the atlas, and a place written by hand
        gz(&dir.join("entries.tsv.gz"), "Q1\tperson\t50\tAda\tA writer\t1900\t1950\t0\t\t\tAda.jpg\nQ2\tplace\t90\tBig Town\t\t\t\t0\t2.5\t3.5\t\nQ3\tplace\t10\tSmall Town\t\t\t\t0\t\t\t\n");
        gz(&dir.join("links.tsv.gz"), "Q1\tborn_in\tQ3\nQ1\tborn_in\tQ2\n");
        let mut hand = entity("org", "big-town", "Big Town", "");
        hand.1 = hand.1.replacen("name:", "same_as: {wikidata: Q2}\nname:", 1);
        let relation = "born_in: {label: born in, inverse: birthplace of, from: [person], to: [org]}\n";
        let (kb, diags) = load_kb("atlas-kb", &[hand, file("content/schema/relations.yaml", relation)]);
        assert!(diags.iter().all(|d| d.level != crate::diag::Level::Error), "{diags:?}");
        let a = load(&root).unwrap().expect("an atlas");
        assert_eq!(a.entries[0].qid, 2, "best known first");
        assert!(search(&a, &kb).iter().all(|row| row["id"] != "Q2"), "a written entry is already in search");
        write(&a, &kb, &root).unwrap();
        let read = |q: u32| -> Value { serde_json::from_slice(&fs::read(root.join(format!("data/a/{}.json", q % SHARDS))).unwrap()).unwrap() };
        assert_eq!(read(2)["Q2"]["u"], "/e/big-town/");
        let ada = &read(1)["Q1"];
        assert_eq!(ada["y"], "1900–1950");
        let links = &ada["g"][0];
        assert_eq!(links[1][0][1], "Big Town", "the better known place first, under its written name");
        assert_eq!(links[1][0][3], "big-town");
        assert_eq!(links[1][1][1], "Small Town");
    }
}
