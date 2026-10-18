//! The data files the browser reads (docs/data-contract.md, ADR-0017). Pages load what they show:
//! - `data/schema.json`: the vocabulary (types, relations, lenses, tiers, questions, methodology);
//! - `data/graph-slim.json`: every entry and link, with only what the explorer draws and routes price;
//! - `data/e/<id>.json`: one entry's words and proof, loaded when it is opened;
//! - `data/search/`: the search entries, filed by word and cut into files by word range;
//! - a story page's own entries, links and sources, embedded beside its shots.

use std::{
    collections::{BTreeMap, BTreeSet, HashMap},
    io::Write,
    ops::Bound,
};

use anyhow::Result;
use serde_json::{Map, Value, json};
use unicode_normalization::UnicodeNormalization;

use crate::{
    edtf::Span,
    kb::{Edge, Entity, Kb, Source},
    paths::Params,
};

/// Links an entry's detail file and page keep per kind (relation and direction): the strongest, as
/// answers rank them. A hub's other links keep their structure in the slim file.
pub const PER_KIND: usize = 100;
/// The slim file's budget in gzip bytes: past it, the explorer and routes need a route service.
pub const SLIM_BUDGET: usize = 1024 * 1024;
/// Entries filed under one search word, best-connected first; a longer query finds the rest.
const PER_WORD: usize = 100;
/// Search files are cut between words past this many bytes of JSON (about 50 KB gzip).
const SEARCH_FILE: usize = 185_000;

/// How many bytes `bytes` take gzipped, as a host serves them.
pub fn gzip_len(bytes: &[u8]) -> usize {
    let mut gz = flate2::write::GzEncoder::new(Vec::new(), flate2::Compression::default());
    gz.write_all(bytes).and_then(|()| gz.finish()).map_or(0, |v| v.len())
}

/// A date as `[start, end, label]`, with a fourth element, 1, when only its end is known; 0 when there
/// is none.
fn span(w: Option<&Span>) -> Value {
    match w {
        None => json!(0),
        Some(w) if w.open_start => json!([w.start, w.end, w.label, 1]),
        Some(w) => json!([w.start, w.end, w.label]),
    }
}

/// An entry as the story player and graph.json read it (graph.json adds its summary and aliases).
pub fn node(kb: &Kb, e: &Entity) -> Value {
    json!({ "id": e.id, "type": e.kind, "name": e.name, "when": e.when, "coords": kb.coords(e), "place": e.place,
            "url": format!("/e/{}/", e.id), "degree": kb.degree(&e.id) })
}

/// A source record as the browser reads it.
pub fn source(kb: &Kb, s: &Source) -> Value {
    json!({ "title": s.title, "publisher": s.publisher, "publisher_name": s.publisher.as_ref().map(|p| kb.name_of(p)), "url": s.url,
            "tier": s.tier, "voice": s.voice, "published": s.published, "published_label": s.published_label, "archive_url": s.archive_url })
}

fn sources<'a>(kb: &Kb, ids: impl IntoIterator<Item = &'a str>) -> Value {
    Value::Object(ids.into_iter().filter_map(|id| Some((id.to_string(), source(kb, kb.sources.get(id)?)))).collect())
}

/// Writes `[a,b,…]` one item at a time, so a long list never sits in memory as values.
fn rows(out: &mut Vec<u8>, items: impl Iterator<Item = Value>) {
    out.push(b'[');
    for (i, v) in items.enumerate() {
        if i > 0 {
            out.push(b',');
        }
        out.extend_from_slice(v.to_string().as_bytes());
    }
    out.push(b']');
}

/// Every entry and link as rows, structure only (docs/data-contract.md, "graph-slim.json"):
/// - entry: `[id, name, type, degree, when, coords, place]`, with `coords` its own (0 when it has
///   none) and `place` the index of the entry it is set in (-1 when none);
/// - link: `[from, to, relation, claim, when, tier]` with the ends as entry indexes and the link's id
///   `<from id>#<claim>`, plus `{according_to, status, voices}` when any is not the default
///   (`voices` only on a link both sides' own records back).
pub fn slim(kb: &Kb) -> Vec<u8> {
    let at: HashMap<&str, usize> = kb.entities.iter().enumerate().map(|(i, e)| (e.id.as_str(), i)).collect();
    let mut out = br#"{"nodes":"#.to_vec();
    rows(
        &mut out,
        kb.entities.iter().map(|e| {
            let place = e.place.as_deref().and_then(|p| at.get(p)).map_or(-1, |&i| i as i64);
            json!([e.id, e.name, e.kind, kb.degree(&e.id), span(e.when.as_ref()), e.coords.map_or(json!(0), |c| json!(c)), place])
        }),
    );
    out.extend_from_slice(br#","edges":"#);
    rows(
        &mut out,
        kb.edges.iter().map(|e| {
            // a link's id is always `<from>#<claim>` (kb.rs)
            let claim = e.id.strip_prefix(e.from.as_str()).and_then(|c| c.strip_prefix('#')).unwrap_or(&e.id);
            let mut row = vec![json!(at[e.from.as_str()]), json!(at[e.to.as_str()]), json!(e.rel), json!(claim), span(e.when.as_ref()), json!(e.tier)];
            let mut more = Map::new();
            if !e.according_to.is_empty() {
                more.insert("according_to".into(), json!(e.according_to));
            }
            if e.status != "published" {
                more.insert("status".into(), json!(e.status));
            }
            if e.cross_confirmed {
                more.insert("voices".into(), json!(e.voices));
            }
            if !more.is_empty() {
                row.push(Value::Object(more));
            }
            Value::Array(row)
        }),
    );
    out.push(b'}');
    out
}

/// A link seen from one end: `true` when that end owns the claim.
type Link<'a> = (&'a Edge, bool);
/// A kind of link: its relation, and whether the end owns the claim.
type Kind<'a> = (&'a str, bool);

/// The `PER_KIND` strongest links of each kind, in their given order, and how many links each cut
/// kind had past that.
pub(crate) fn keep_per_kind<'a>(p: &Params, items: &[Link<'a>]) -> (Vec<Link<'a>>, HashMap<Kind<'a>, usize>) {
    let mut kinds: HashMap<Kind<'a>, Vec<usize>> = HashMap::new();
    for (i, &(e, out)) in items.iter().enumerate() {
        kinds.entry((e.rel.as_str(), out)).or_default().push(i);
    }
    let mut cut = vec![false; items.len()];
    let mut more = HashMap::new();
    for (kind, mut list) in kinds {
        if list.len() <= PER_KIND {
            continue;
        }
        list.sort_by(|&a, &b| p.link_cost(items[a].0).total_cmp(&p.link_cost(items[b].0)).then_with(|| items[a].0.id.cmp(&items[b].0.id)));
        more.insert(kind, list.len() - PER_KIND);
        for &i in &list[PER_KIND..] {
            cut[i] = true;
        }
    }
    (items.iter().zip(&cut).filter(|(_, c)| !**c).map(|(x, _)| *x).collect(), more)
}

/// One entry's words and proof (`data/e/<id>.json`): its summary and aliases, its life story, the
/// question pages about it (`asked`), and for each link given its qualifiers, note and sources.
pub fn details(kb: &Kb, ent: &Entity, links: &[Link], story: Option<&str>, asked: Vec<Value>) -> Value {
    let mut cited = BTreeSet::new();
    let words: Vec<Value> = links
        .iter()
        .map(|(e, _)| {
            cited.extend(e.sources.iter().map(|s| s.id.as_str()));
            let mut v = json!({ "id": e.id, "sources": e.sources });
            for (key, text) in [("detail", &e.detail), ("note", &e.note), ("reason", &e.reason)] {
                if let Some(t) = text {
                    v[key] = json!(t);
                }
            }
            if !e.qualifiers.is_empty() {
                v["qualifiers"] = json!(e.qualifiers);
            }
            v
        })
        .collect();
    json!({ "id": ent.id, "summary": ent.summary, "aliases": ent.aliases, "story": story, "asked": asked, "links": words,
            "sources": sources(kb, cited) })
}

/// What a story's scenes name, embedded in its page: the entries (focus, reveals, places, route ends,
/// the ends of revealed links, accounts and speakers), the links its scenes reveal, and the sources
/// those cite or an overlay shows. The player reads this and schema.json, nothing else.
pub fn story(kb: &Kb, by_id: &BTreeMap<&str, &Edge>, shots: &[Value]) -> Value {
    let mut names: BTreeSet<&str> = BTreeSet::new();
    let mut links: BTreeMap<&str, &Edge> = BTreeMap::new();
    let mut cited: BTreeSet<&str> = BTreeSet::new();
    fn list(v: &Value) -> impl Iterator<Item = &str> {
        v.as_array().into_iter().flatten().filter_map(Value::as_str)
    }
    for shot in shots {
        names.extend(["focus", "perspective"].iter().filter_map(|k| shot[*k].as_str()));
        names.extend(list(&shot["reveal"]));
        names.extend(list(&shot["places"]));
        names.extend(shot["routes"].as_array().into_iter().flatten().flat_map(list));
        cited.extend(shot["overlay"]["source"].as_str());
        for r in list(&shot["reveal_claims"]) {
            // "<entity>#<claim>" also names that claim's "/<n>" links, one per target
            let sub = format!("{r}/");
            let parts = by_id.range::<str, _>((Bound::Included(sub.as_str()), Bound::Unbounded)).take_while(|(id, _)| id.starts_with(&sub));
            links.extend(by_id.get_key_value(r).into_iter().map(|(k, v)| (*k, *v)).chain(parts.map(|(k, v)| (*k, *v))));
        }
    }
    for e in links.values() {
        names.extend([e.from.as_str(), e.to.as_str()]);
        names.extend(e.according_to.iter().map(String::as_str));
        for s in &e.sources {
            cited.insert(s.id.as_str());
            names.extend(s.by.as_deref());
        }
    }
    let nodes: Vec<Value> = names.iter().filter_map(|id| kb.entity(id)).map(|e| node(kb, e)).collect();
    json!({ "nodes": nodes, "edges": links.values().collect::<Vec<_>>(), "sources": sources(kb, cited) })
}

/// An entry as search lists it (`q`, its question pages, is added by the build).
pub fn search_entry(e: &Entity) -> Value {
    json!({ "id": e.id, "name": e.name, "aliases": e.aliases, "type": e.kind, "summary": e.summary, "when": e.when.as_ref().map(|w| &w.label),
            "url": format!("/e/{}/", e.id) })
}

/// A name's words for search: lower case, accents dropped, apostrophes and full stops removed
/// ("O'Brien" is "obrien", "U.S." is "us"), split at everything else that is not a letter or a
/// digit. web/src/lib/search.ts folds a query the same way.
pub fn words(text: &str) -> Vec<String> {
    let folded: String = text.nfkd().filter(|c| !('\u{300}'..='\u{36f}').contains(c)).collect::<String>().to_lowercase();
    let folded: String = folded.chars().filter(|c| !matches!(c, '.' | '\'' | '\u{2019}')).collect();
    folded.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(String::from).collect()
}

/// The search files: each entry (given best-connected first, which its `rank` keeps) is filed
/// under every word, and every pair of neighbouring words, of its name and aliases; a word keeps
/// its `PER_WORD` best entries. Words are sorted and cut into files between words, and each file is
/// handed to `emit` as `<n>.json`. Returns `index.json`: each file's first word (the first file's
/// is ""). While everything fits in one file, that file is every entry and needs no words.
pub fn search(entries: &[Value], mut emit: impl FnMut(usize, Vec<u8>) -> Result<()>) -> Result<Vec<u8>> {
    let mut filed: BTreeMap<String, Vec<usize>> = BTreeMap::new();
    for (i, e) in entries.iter().enumerate() {
        let mut keys = BTreeSet::new();
        for name in std::iter::once(&e["name"]).chain(e["aliases"].as_array().into_iter().flatten()).filter_map(Value::as_str) {
            let w = words(name);
            keys.extend(w.windows(2).map(|p| format!("{} {}", p[0], p[1])));
            keys.extend(w);
        }
        for k in keys {
            filed.entry(k).or_default().push(i);
        }
    }
    let ranked = |i: usize| {
        let mut e = entries[i].clone();
        e["rank"] = json!(i);
        e
    };
    let size: Vec<usize> = (0..entries.len()).map(|i| ranked(i).to_string().len()).collect();

    // cut the sorted words into files: each file's entries, and its words with their entries' places in it
    struct File {
        first: String,
        local: HashMap<usize, usize>,
        entries: Vec<usize>,
        words: Vec<(String, Vec<usize>)>,
        bytes: usize,
    }
    let new_file = |first: &str| File { first: first.to_string(), local: HashMap::new(), entries: Vec::new(), words: Vec::new(), bytes: 0 };
    let mut files: Vec<File> = Vec::new();
    let mut cur = new_file("");
    for (key, mut list) in filed {
        list.truncate(PER_WORD);
        let grows = key.len() + 8 + list.iter().map(|i| if cur.local.contains_key(i) { 6 } else { size[*i] + 6 }).sum::<usize>();
        if cur.bytes + grows > SEARCH_FILE && !cur.words.is_empty() {
            files.push(std::mem::replace(&mut cur, new_file(&key)));
        }
        let mut at = Vec::with_capacity(list.len());
        for i in list {
            let j = match cur.local.get(&i) {
                Some(&j) => j,
                None => {
                    cur.local.insert(i, cur.entries.len());
                    cur.entries.push(i);
                    cur.bytes += size[i];
                    cur.entries.len() - 1
                }
            };
            at.push(j);
            cur.bytes += 6;
        }
        cur.bytes += key.len() + 8;
        cur.words.push((key, at));
    }
    files.push(cur);
    let index = serde_json::to_vec(&json!({ "files": files.iter().map(|f| f.first.as_str()).collect::<Vec<_>>() }))?;
    if files.len() == 1 {
        let mut out = br#"{"entries":"#.to_vec();
        rows(&mut out, (0..entries.len()).map(ranked));
        out.push(b'}');
        emit(0, out)?;
        return Ok(index);
    }
    for (n, f) in files.into_iter().enumerate() {
        let mut out = br#"{"entries":"#.to_vec();
        rows(&mut out, f.entries.iter().map(|&i| ranked(i)));
        out.extend_from_slice(br#","words":"#);
        rows(&mut out, f.words.into_iter().map(|(key, at)| json!([key, at])));
        out.push(b'}');
        emit(n, out)?;
    }
    Ok(index)
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::{details, keep_per_kind, search, words};
    use crate::{
        paths::Params,
        testkit::{entity, file, load, source},
    };

    #[test]
    fn a_hub_keeps_its_strongest_links_of_each_kind() {
        // 103 companies founded: three on a self-published page, the rest on a primary record
        let mut files = vec![source("rec", "T1"), source("blog", "T3"), file("content/methodology/paths.yaml", "version: test\nevidence: {T1: 1.0, T3: 0.2}\n")];
        let mut claims = String::new();
        for i in 0..103 {
            let src = if [5, 50, 100].contains(&i) { "blog" } else { "rec" };
            claims.push_str(&format!("  - {{id: c{i}, rel: founded, to: org{i:03}, src: [{{s: {src}}}]}}\n"));
            files.push(entity("org", &format!("org{i:03}"), &format!("Org {i}"), ""));
        }
        files.push(entity("person", "hub", "Hub", &claims));
        let (kb, _) = load("data-hub", &files);
        let items: Vec<_> = kb.links_of("hub").collect();
        let (kept, more) = keep_per_kind(&Params::from(&kb.schema.methodology), &items);
        assert_eq!((kept.len(), more.get(&("founded", true))), (100, Some(&3)));
        let cut: Vec<&str> = items.iter().filter(|(e, _)| !kept.iter().any(|(k, _)| k.id == e.id)).map(|(e, _)| e.to.as_str()).collect();
        assert_eq!(cut, ["org005", "org050", "org100"], "the weakest links go");
        // the detail file holds the kept links and the sources they cite
        let d = details(&kb, kb.entity("hub").unwrap(), &kept, None, Vec::new());
        assert_eq!(d["links"].as_array().map(Vec::len), Some(100));
        assert!(d["sources"].get("rec").is_some() && d["sources"].get("blog").is_none());
        // a company's own file keeps its one link
        let org = kb.entity("org005").unwrap();
        let own: Vec<_> = kb.links_of("org005").collect();
        assert_eq!(details(&kb, org, &own, None, Vec::new())["links"][0]["id"], "hub#c5");
    }

    #[test]
    fn words_fold_case_accents_and_apostrophes() {
        assert_eq!(words("Nursultan Nazarbaýev"), ["nursultan", "nazarbayev"]);
        assert_eq!(words("O'Brien & U.S. Steel"), ["obrien", "us", "steel"]);
        assert_eq!(words("Jean-Paul Sartre"), ["jean", "paul", "sartre"]);
    }

    #[test]
    fn search_files_word_ranges_and_keep_ranks() {
        let entries: Vec<_> = (0..3000).map(|i| json!({ "id": format!("e{i}"), "name": format!("Name{i} Family{}", i % 7), "aliases": [] })).collect();
        let mut files: Vec<serde_json::Value> = Vec::new();
        let index = search(&entries, |_, bytes| {
            files.push(serde_json::from_slice(&bytes)?);
            Ok(())
        })
        .unwrap();
        let index: serde_json::Value = serde_json::from_slice(&index).unwrap();
        let firsts: Vec<&str> = index["files"].as_array().unwrap().iter().map(|f| f.as_str().unwrap()).collect();
        assert!(files.len() > 1, "3000 entries need more than one file");
        assert_eq!(firsts[0], "");
        assert!(firsts.windows(2).all(|w| w[0] < w[1]), "files are in word order: {firsts:?}");
        // every word sits in the file its range names, and lists its entries best-connected first
        for (n, f) in files.iter().enumerate() {
            for w in f["words"].as_array().unwrap() {
                let key = w[0].as_str().unwrap();
                assert_eq!(firsts.iter().rposition(|first| *first <= key), Some(n), "{key}");
                let ranks: Vec<u64> = w[1].as_array().unwrap().iter().map(|j| f["entries"][j.as_u64().unwrap() as usize]["rank"].as_u64().unwrap()).collect();
                assert!(ranks.windows(2).all(|r| r[0] < r[1]) && ranks.len() <= super::PER_WORD, "{key}: {ranks:?}");
            }
        }
        // "name42" and the pair "name42 family0" both find entry 42
        let find = |key: &str| {
            let f = &files[firsts.iter().rposition(|first| *first <= key).unwrap()];
            let w = f["words"].as_array().unwrap().iter().find(|w| w[0] == key).unwrap();
            w[1].as_array().unwrap().iter().map(|j| f["entries"][j.as_u64().unwrap() as usize]["id"].clone()).collect::<Vec<_>>()
        };
        assert_eq!(find("name42"), [json!("e42")]);
        assert_eq!(find("name42 family0"), [json!("e42")]);
    }
}
