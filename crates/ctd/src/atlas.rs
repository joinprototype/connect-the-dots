//! The atlas: the best-known things in the world, from open data (ADR-0023). It is read from
//! .cache/atlas, which tools/atlas/ fills, so a checkout without it builds the hand-sourced site alone.
//! Entries in content/ hold the proof. The atlas holds the wide picture, always marked as open data.

use std::{
    collections::{BTreeMap, HashMap, HashSet, VecDeque},
    fs::{self, File},
    io::{BufRead, BufReader},
    path::Path,
};

use anyhow::Result;
use flate2::read::GzDecoder;
use rayon::prelude::*;
use serde_json::{Value, json};

use crate::{
    kb::Kb,
    world::{NO_YEAR, ONGOING},
};

/// Files the entries are packed into: what keeps a million entries under a host's limit on files.
pub const SHARDS: u32 = 2048;
/// A map node id from here up is an atlas entry: the rest is its Wikidata number.
pub const ATLAS_IDS: u32 = 1 << 31;
/// How many links of one kind an entry lists, best known first.
const PER_PHRASE: usize = 40;
/// Long lists go on past that in this many files, whatever the number of entries: a reader who asks
/// for the rest of a list costs one file, and the site's count of files does not grow with the atlas.
const PACKS: u32 = 512;
/// How far a list goes: a person can read no more, and the rest are the least known.
const TAIL: usize = 5000;
/// Routes between any two entries run through this many landmarks, as a game finds its way across a
/// huge map: from each entry to the nearest landmark, from landmark to landmark, and down again. A
/// route then costs a few small files, on a site with no server.
const LANDMARKS: usize = 256;
/// An entry with more links than this is a crossroads: sharing it says little, so routes go around it.
const CROSSROADS: usize = 2000;
/// The Earth's tiles: how deep they go and how many entries one holds, best known first.
const EARTH_ZOOM: u8 = 9;
const EARTH_QUOTA: usize = 200;
const KINDS: [&str; 8] = ["person", "event", "work", "place", "org", "artifact", "tradition", "concept"];
/// How long someone with no death on record is taken to have lived, for the era slider.
const LONG_LIFE: i32 = 80;

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

    /// Its years on the era slider, the second one past its end. With no end given, a person is taken
    /// to live a long life, a dated event, work or thing to be of its year, and the rest to go on.
    pub fn span(&self) -> [i16; 2] {
        let year = |y: i32| y.clamp(-32767, 32766) as i16;
        match (self.start, self.end) {
            (None, None) => [NO_YEAR; 2],
            (Some(a), Some(b)) => [year(a), year(b + 1)],
            (None, Some(b)) => [year(b), year(b + 1)],
            (Some(a), None) => match self.kind() {
                "person" => [year(a), year(a + LONG_LIFE)],
                "event" | "work" | "artifact" => [year(a), year(a + 1)],
                _ => [year(a), ONGOING],
            },
        }
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
    // a people as a group is never an entry (ADR-0016)
    let left_out = fs::read_to_string(root.join("content").join("methodology").join("atlas-left-out.tsv")).unwrap_or_default();
    let left_out: HashSet<u32> = left_out.lines().filter_map(|l| number(l.split('\t').next()?)).collect();
    let mut entries: Vec<Entry> = Vec::new();
    for line in lines(&dir.join("entries.tsv.gz"))? {
        let f: Vec<&str> = line.split('\t').collect();
        if number(f[0]).is_some_and(|q| left_out.contains(&q)) {
            continue;
        }
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

impl Atlas {
    /// Takes out what the record has sealed (ADR-0027). Nobody has read open data, so a sealed entry
    /// keeps its dot and loses its links and words, and what is about it goes: the events, works and
    /// things joined to it, and every entry whose own words name it. Nothing downstream, on any page,
    /// in a route or on the Map, can show them.
    pub fn without_sealed(mut self, kb: &Kb) -> Atlas {
        let hand = curated(kb);
        let sealed: Vec<bool> = self.entries.iter().map(|e| hand.get(&e.qid).is_some_and(|&c| kb.entities[c].sealed)).collect();
        let names: Vec<String> = self.entries.iter().zip(&sealed).filter(|(_, s)| **s).map(|(e, _)| e.name.clone()).collect();
        let about = |e: &Entry| names.iter().any(|n| e.name.contains(n.as_str()) || e.summary.contains(n.as_str()));
        let mut gone: Vec<bool> = self.entries.iter().zip(&sealed).map(|(e, s)| !s && about(e)).collect();
        for &(x, _, y) in &self.links {
            for (end, other) in [(x as usize, y as usize), (y as usize, x as usize)] {
                gone[other] |= sealed[end] && !sealed[other] && matches!(self.entries[other].kind(), "event" | "work" | "artifact");
            }
        }
        let mut next = 0;
        let place: Vec<u32> = gone
            .iter()
            .map(|&g| {
                next += u32::from(!g);
                next - 1
            })
            .collect();
        self.links.retain(|&(x, _, y)| [x, y].iter().all(|&e| !sealed[e as usize] && !gone[e as usize]));
        for link in &mut self.links {
            (link.0, link.2) = (place[link.0 as usize], place[link.2 as usize]);
        }
        let mut i = 0;
        self.entries.retain_mut(|e| {
            if sealed[i] {
                (e.summary, e.image) = (String::new(), String::new());
            }
            i += 1;
            !gone[i - 1]
        });
        self
    }
}

/// Entries written by hand, by Wikidata number: the atlas points to them instead of standing in.
pub fn curated(kb: &Kb) -> HashMap<u32, usize> {
    let wikidata = |e: &crate::kb::Entity| e.same_as.get("wikidata").map(|v| v.to_string().trim_matches('"').to_string());
    kb.entities.iter().enumerate().filter_map(|(i, e)| wikidata(e).and_then(|q| number(&q)).map(|q| (q, i))).collect()
}

/// Where each entry sits on the Map, by Wikidata number, in 65,535ths of the square.
pub fn spots(kb: &Kb, ids: &[u32], nodes: &[[f32; 2]]) -> HashMap<u32, [u16; 2]> {
    let hand: HashMap<usize, u32> = curated(kb).into_iter().map(|(q, c)| (c, q)).collect();
    let spot = |v: f32| (v.clamp(0.0, 1.0) * 65535.0) as u16;
    ids.iter()
        .zip(nodes)
        .filter_map(|(&id, p)| Some((if id >= ATLAS_IDS { id - ATLAS_IDS } else { *hand.get(&(id as usize))? }, [spot(p[0]), spot(p[1])])))
        .collect()
}

/// Each entry's step towards its nearest landmark, and what a route needs from the landmarks' side.
struct Routes {
    /// (place in `entries`, phrase): the next entry towards the landmark.
    towards: Vec<Option<(u32, u16)>>,
    file: Value,
}

/// Finds the landmarks and every entry's way to the nearest one. Real links first, around the
/// crossroads; what they do not reach then joins by any link at all.
fn routes(a: &Atlas, kb: &Kb, adjacent: &[Vec<(u32, u8, bool)>]) -> Routes {
    let n = a.entries.len();
    let relation = |r: u8| kb.schema.relations.get(&a.relations[r as usize]);
    let real = |r: u8| relation(r).is_some_and(|x| x.traversable);
    let crossroads = |i: usize| adjacent[i].len() > CROSSROADS;
    // best known first, and no two side by side, so that they lie all over the graph
    let mut taken = vec![false; n];
    let mut landmarks: Vec<u32> = Vec::new();
    for i in 0..n {
        if landmarks.len() == LANDMARKS {
            break;
        }
        if !taken[i] && !crossroads(i) && adjacent[i].iter().filter(|l| real(l.1)).count() >= 8 {
            landmarks.push(i as u32);
            adjacent[i].iter().filter(|l| real(l.1)).for_each(|l| taken[l.0 as usize] = true);
        }
    }
    let mut phrases: Vec<[String; 2]> = Vec::new();
    let mut phrase = |r: u8, forward: bool| -> Option<u16> {
        let x = relation(r)?;
        let pair = if forward { [x.label.clone(), x.inverse.clone()] } else { [x.inverse.clone(), x.label.clone()] };
        let at = phrases.iter().position(|p| *p == pair).unwrap_or_else(|| {
            phrases.push(pair);
            phrases.len() - 1
        });
        Some(at as u16)
    };
    const NONE: u16 = u16::MAX;
    let mut root = vec![NONE; n];
    let mut depth = vec![0u16; n];
    let mut towards: Vec<Option<(u32, u16)>> = vec![None; n];
    for (l, &i) in landmarks.iter().enumerate() {
        root[i as usize] = l as u16;
    }
    for any in [false, true] {
        let mut queue: VecDeque<u32> = (0..n as u32).filter(|&i| root[i as usize] != NONE).collect();
        while let Some(x) = queue.pop_front() {
            let x = x as usize;
            if !any && crossroads(x) {
                continue;
            }
            for &(y, r, outgoing) in &adjacent[x] {
                let u = y as usize;
                if root[u] != NONE || (!any && !real(r)) {
                    continue;
                }
                // the phrase reads from y towards x, the other way along the link
                let Some(said) = phrase(r, !outgoing) else { continue };
                (root[u], depth[u], towards[u]) = (root[x], depth[x] + 1, Some((x as u32, said)));
                queue.push_back(y);
            }
        }
    }
    // where two landmarks' territories touch: the shortest crossing between each pair
    let mut crossings: HashMap<(u16, u16), (u32, u32, u32, u16)> = HashMap::new();
    for &(x, r, y) in &a.links {
        let (i, j) = (x as usize, y as usize);
        if root[i] == NONE || root[j] == NONE || root[i] == root[j] {
            continue;
        }
        let Some(said) = phrase(r, true) else { continue };
        let weak = if real(r) && !crossroads(i) && !crossroads(j) { 0 } else { 4 };
        let cost = (depth[i] + depth[j]) as u32 + 1 + weak;
        let (key, ends) = if root[i] < root[j] { ((root[i], root[j]), (x, y, said * 2)) } else { ((root[j], root[i]), (y, x, said * 2 + 1)) };
        let best = crossings.entry(key).or_insert((u32::MAX, 0, 0, 0));
        if (cost, ends.0, ends.1) < (best.0, best.1, best.2) {
            *best = (cost, ends.0, ends.1, ends.2);
        }
    }
    // the shortest way from each landmark to each other: the next landmark along it
    let l = landmarks.len();
    let mut dist = vec![vec![u32::MAX / 2; l]; l];
    let mut next = vec![vec![NONE; l]; l];
    for i in 0..l {
        (dist[i][i], next[i][i]) = (0, i as u16);
    }
    for (&(i, j), &(cost, ..)) in &crossings {
        let (i, j) = (i as usize, j as usize);
        (dist[i][j], dist[j][i]) = (cost, cost);
        (next[i][j], next[j][i]) = (j as u16, i as u16);
    }
    for k in 0..l {
        for i in 0..l {
            for j in 0..l {
                if dist[i][k] + dist[k][j] < dist[i][j] {
                    dist[i][j] = dist[i][k] + dist[k][j];
                    next[i][j] = next[i][k];
                }
            }
        }
    }
    let number = |i: u32| a.entries[i as usize].qid;
    let bridges: BTreeMap<String, Value> =
        crossings.iter().map(|(&(i, j), &(_, x, y, said))| (format!("{i}:{j}"), json!([number(x), number(y), said]))).collect();
    let file = json!({ "l": landmarks.iter().map(|&i| number(i)).collect::<Vec<u32>>(), "p": phrases, "n": next, "b": bridges });
    Routes { towards, file }
}

/// One shard: `{"Q42": {...}}`, each entry with its links grouped by what they say.
/// An entry's links by phrase, best known first (`entries` is in that order, so a smaller place is a
/// better-known thing). The order of the groups is how the tails find their lists.
fn grouped(a: &Atlas, kb: &Kb, adjacent: &[Vec<(u32, u8, bool)>], i: usize) -> BTreeMap<String, Vec<u32>> {
    let mut groups: BTreeMap<String, Vec<u32>> = BTreeMap::new();
    for &(other, rel, outgoing) in &adjacent[i] {
        let Some(r) = kb.schema.relations.get(&a.relations[rel as usize]) else { continue };
        groups.entry(if outgoing { r.label.clone() } else { r.inverse.clone() }).or_default().push(other);
    }
    for list in groups.values_mut() {
        list.sort_unstable();
        list.dedup();
    }
    groups
}

/// How many links the atlas holds for each hand entry, for its page.
pub fn open_links(a: &Atlas, kb: &Kb) -> HashMap<String, usize> {
    let hand = curated(kb);
    let mut count: HashMap<String, usize> = HashMap::new();
    let id = |place: u32| hand.get(&a.entries[place as usize].qid).map(|&c| &kb.entities[c].id);
    for &(x, _, y) in a.links.iter().filter(|l| kb.schema.relations.contains_key(&a.relations[l.1 as usize])) {
        for end in [x, y] {
            if let Some(id) = id(end) {
                *count.entry(id.clone()).or_default() += 1;
            }
        }
    }
    count
}

/// `data/more/<n>.json`: the lists that run past PER_PHRASE, from there on, by entry and group.
fn write_tails(a: &Atlas, kb: &Kb, hand: &HashMap<u32, usize>, adjacent: &[Vec<(u32, u8, bool)>], out: &Path) -> Result<()> {
    let dir = out.join("data").join("more");
    fs::create_dir_all(&dir)?;
    let mut packs: Vec<BTreeMap<String, BTreeMap<usize, Vec<Value>>>> = vec![BTreeMap::new(); PACKS as usize];
    for (i, e) in a.entries.iter().enumerate().filter(|&(i, _)| adjacent[i].len() > PER_PHRASE) {
        for (g, (_, list)) in grouped(a, kb, adjacent, i).iter().enumerate().filter(|(_, (_, list))| list.len() > PER_PHRASE) {
            let row = |&j: &u32| {
                let n = &a.entries[j as usize];
                match hand.get(&n.qid) {
                    Some(&c) => json!([n.qid, kb.entities[c].name, n.kind, kb.entities[c].id]),
                    None => json!([n.qid, n.name, n.kind]),
                }
            };
            let rows = list[PER_PHRASE..].iter().take(TAIL).map(row).collect();
            packs[(e.qid % PACKS) as usize].entry(format!("Q{}", e.qid)).or_default().insert(g, rows);
        }
    }
    packs.par_iter().enumerate().try_for_each(|(n, pack)| -> Result<()> {
        fs::write(dir.join(format!("{n}.json")), serde_json::to_vec(pack)?)?;
        Ok(())
    })
}

fn shard(
    a: &Atlas,
    kb: &Kb,
    hand: &HashMap<u32, usize>,
    adjacent: &[Vec<(u32, u8, bool)>],
    spots: &HashMap<u32, [u16; 2]>,
    routes: &Routes,
    members: &[u32],
) -> Value {
    let mut out = serde_json::Map::new();
    for &i in members {
        let e = &a.entries[i as usize];
        let groups: Vec<Value> = grouped(a, kb, adjacent, i as usize)
            .into_iter()
            .map(|(phrase, list)| {
                let more = list.len().saturating_sub(PER_PHRASE);
                let shown: Vec<Value> = list
                    .iter()
                    .take(PER_PHRASE)
                    .map(|&j| {
                        let n = &a.entries[j as usize];
                        let spot = spots.get(&n.qid).copied().unwrap_or_default();
                        match hand.get(&n.qid) {
                            Some(&c) => json!([n.qid, kb.entities[c].name, n.kind, spot, kb.entities[c].id]),
                            None => json!([n.qid, n.name, n.kind, spot]),
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
        if let Some(spot) = spots.get(&e.qid) {
            v["p"] = json!(spot);
        }
        if let Some((step, said)) = routes.towards[i as usize] {
            v["r"] = json!([a.entries[step as usize].qid, said]);
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
pub fn write(a: &Atlas, kb: &Kb, spots: &HashMap<u32, [u16; 2]>, out: &Path) -> Result<()> {
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
    let routes = routes(a, kb, &adjacent);
    fs::write(out.join("data").join("routes.json"), serde_json::to_vec(&routes.file)?)?;
    shards.par_iter().enumerate().try_for_each(|(n, members)| -> Result<()> {
        fs::write(dir.join(format!("{n}.json")), serde_json::to_vec(&shard(a, kb, &hand, &adjacent, spots, &routes, members))?)?;
        Ok(())
    })?;
    write_tails(a, kb, &hand, &adjacent, out)?;
    earth(a, &hand, out)
}

/// The Earth's entries as tiles, so that it draws what is in view. Each tile holds the best known of
/// what is left for it: the rest wait a zoom deeper. A person's coordinates are a grave, not a life,
/// and an entry written by hand has its own dot.
fn earth(a: &Atlas, hand: &HashMap<u32, usize>, out: &Path) -> Result<()> {
    let tile = |[lon, lat]: [f32; 2], z: u8| {
        let (lon, lat, size) = (lon as f64, (lat as f64).clamp(-85.0, 85.0).to_radians(), (1u32 << z) as f64);
        let x = (lon + 180.0) / 360.0 * size;
        let y = (1.0 - (lat.tan() + 1.0 / lat.cos()).ln() / std::f64::consts::PI) / 2.0 * size;
        (x.clamp(0.0, size - 1.0) as u32, y.clamp(0.0, size - 1.0) as u32)
    };
    let mut tiles: HashMap<(u8, u32, u32), Vec<Value>> = HashMap::new();
    let close = |v: f32| (v as f64 * 1e4).round() / 1e4;
    for e in a.entries.iter().filter(|e| e.kind != 0 && !hand.contains_key(&e.qid)) {
        let Some(at) = e.coords else { continue };
        for z in 0..=EARTH_ZOOM {
            let (x, y) = tile(at, z);
            let list = tiles.entry((z, x, y)).or_default();
            if z == EARTH_ZOOM || list.len() < EARTH_QUOTA {
                let mut row = json!([close(at[0]), close(at[1]), e.qid, e.name, e.kind]);
                let [start, end] = e.span();
                if start != NO_YEAR {
                    row.as_array_mut().unwrap().extend([json!(start), json!(end)]);
                }
                list.push(row);
                break;
            }
        }
    }
    let dir = out.join("earth");
    fs::create_dir_all(&dir)?;
    let mut index: BTreeMap<String, Vec<u64>> = BTreeMap::new();
    for (&(z, x, y), list) in &tiles {
        index.entry(z.to_string()).or_default().push(((x as u64) << z) + y as u64);
        fs::create_dir_all(dir.join(z.to_string()).join(x.to_string()))?;
        fs::write(dir.join(z.to_string()).join(x.to_string()).join(format!("{y}.json")), serde_json::to_vec(list)?)?;
    }
    index.values_mut().for_each(|v| v.sort_unstable());
    let entries: usize = tiles.values().map(Vec::len).sum();
    fs::write(dir.join("index.json"), serde_json::to_vec(&json!({ "maxzoom": EARTH_ZOOM, "entries": entries, "tiles": index }))?)?;
    Ok(())
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

    #[test]
    fn every_entry_finds_its_way_to_a_landmark() {
        let relation = "member_of: {label: member of, inverse: members, from: [person], to: [org]}\n";
        let (kb, _) = load_kb("atlas-routes", &[file("content/schema/relations.yaml", relation)]);
        let entries: Vec<Entry> = (0..11u32)
            .map(|i| Entry {
                qid: i + 1,
                kind: 0,
                fame: 100 - i as u16,
                name: format!("E{i}"),
                summary: String::new(),
                start: None,
                end: None,
                coords: None,
                image: String::new(),
            })
            .collect();
        // the best known has nine links, and one entry sits a step beyond them
        let mut links: Vec<(u32, u8, u32)> = (1..10).map(|i| (0, 0, i)).collect();
        links.push((9, 0, 10));
        let mut adjacent = vec![Vec::new(); entries.len()];
        for &(x, r, y) in &links {
            adjacent[x as usize].push((y, r, true));
            adjacent[y as usize].push((x, r, false));
        }
        let a = Atlas { entries, links, relations: vec!["member_of".to_string()] };
        let r = routes(&a, &kb, &adjacent);
        assert_eq!(r.file["l"], json!([1]), "the best known is the landmark");
        assert!(r.towards[0].is_none(), "a landmark goes nowhere");
        let (step, said) = r.towards[10].expect("a step towards the landmark");
        assert_eq!(step, 9);
        assert_eq!(r.towards[9].unwrap().0, 0);
        assert_eq!(r.file["p"][said as usize], json!(["members", "member of"]), "read from the entry towards its step, then back");
    }

    #[test]
    fn a_sealed_entry_keeps_its_dot_and_loses_its_open_data() {
        let sealed = "---\nid: zoe\ntype: person\nname: Zoe\nsame_as: {wikidata: Q2}\nsealed: true\nclaims: []\n---\n";
        let (kb, _) = load_kb("atlas-sealed", &[file("content/entities/person/zo/zoe.md", sealed)]);
        // Q1, the sealed Q2, an event about Q2, Q4 who has nothing to do with it, and Q5 whose words name Q2
        let mut entries: Vec<Entry> = [(1, 0), (2, 0), (3, 1), (4, 0), (5, 0)]
            .map(|(qid, kind)| Entry {
                qid,
                kind,
                fame: 0,
                name: format!("Q{qid}"),
                summary: "words nobody read".to_string(),
                start: None,
                end: None,
                coords: None,
                image: "a.jpg".to_string(),
            })
            .into();
        entries[4].summary = "a friend of Q2".to_string();
        let links = vec![(0, 0, 1), (2, 0, 1), (0, 0, 2), (0, 0, 3), (0, 0, 4)];
        let a = Atlas { entries, links, relations: vec!["member_of".to_string()] }.without_sealed(&kb);
        assert_eq!(a.entries.iter().map(|e| e.qid).collect::<Vec<u32>>(), [1, 2, 4], "what is about it goes");
        assert_eq!(a.links, [(0, 0, 2)], "only the link that never touched it stays");
        assert!(a.entries[1].summary.is_empty() && a.entries[1].image.is_empty());
        assert_eq!(a.entries[0].image, "a.jpg");
    }

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
        gz(
            &dir.join("entries.tsv.gz"),
            "Q1\tperson\t50\tAda\tA writer\t1900\t1950\t0\t\t\tAda.jpg\nQ2\tplace\t90\tBig Town\t\t\t\t0\t2.5\t3.5\t\nQ3\tplace\t10\tSmall Town\t\t\t\t0\t\t\t\n",
        );
        gz(&dir.join("links.tsv.gz"), "Q1\tborn_in\tQ3\nQ1\tborn_in\tQ2\n");
        let mut hand = entity("org", "big-town", "Big Town", "");
        hand.1 = hand.1.replacen("name:", "same_as: {wikidata: Q2}\nname:", 1);
        let relation = "born_in: {label: born in, inverse: birthplace of, from: [person], to: [org]}\n";
        let (kb, diags) = load_kb("atlas-kb", &[hand, file("content/schema/relations.yaml", relation)]);
        assert!(diags.iter().all(|d| d.level != crate::diag::Level::Error), "{diags:?}");
        let a = load(&root).unwrap().expect("an atlas");
        assert_eq!(a.entries[0].qid, 2, "best known first");
        assert!(search(&a, &kb).iter().all(|row| row["id"] != "Q2"), "a written entry is already in search");
        write(&a, &kb, &HashMap::new(), &root).unwrap();
        let read = |q: u32| -> Value { serde_json::from_slice(&fs::read(root.join(format!("data/a/{}.json", q % SHARDS))).unwrap()).unwrap() };
        assert_eq!(read(2)["Q2"]["u"], "/e/big-town/");
        let ada = &read(1)["Q1"];
        assert_eq!(ada["y"], "1900–1950");
        let links = &ada["g"][0];
        assert_eq!(links[1][0][1], "Big Town", "the better known place first, under its written name");
        assert_eq!(links[1][0][4], "big-town");
        assert_eq!(links[1][1][1], "Small Town");
    }
}
