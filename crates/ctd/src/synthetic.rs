//! A synthetic content repository, in memory, to measure the data files at scale (ADR-0017).
//! `ctd build --synthetic <n>` makes `n` entries on the real schema, linked with the synthetic
//! world's structure (communities, cross links and a few hubs of 10–20k links), each link one claim
//! citing a quoted primary source. Names share words the way real ones do. It writes the slim and
//! search files, measures one detail file per entry without writing them, and prints the sizes.

use std::{collections::HashMap, fs, path::Path, time::Instant};

use anyhow::Result;
use rayon::prelude::*;
use serde_json::{Value, json};

use crate::{
    diag::Level,
    kb::{self, Kb},
    load::{EntityDoc, Raw, SourceDoc},
    paths::Params,
    schema::Schema,
    site::data,
    world::{self, Rng},
};

const FIRST: &[&str] = &[
    "Anna", "Ben", "Carla", "David", "Elena", "Farid", "Grace", "Hugo", "Ines", "James", "Kenji", "Laura", "Mateo", "Nadia", "Omar", "Priya",
    "Quentin", "Rosa", "Sergei", "Tara", "Umar", "Vera", "Wei", "Ximena", "Yusuf", "Zoe", "Aiden", "Bianca", "Chen", "Dina", "Emil", "Fatima",
];
const SYLLABLES: &[&str] = &[
    "ka", "lo", "mer", "son", "va", "rin", "tes", "bar", "do", "el", "fan", "gor", "hal", "is", "jun", "kov", "lan", "mo", "nor", "os", "pel",
    "quin", "ros", "sa", "tor", "ul", "ven", "wil", "xan", "yar", "zel", "an",
];
const ORG: &[&str] = &["Holdings", "Group", "Bank", "Institute", "Foundation", "Partners", "Capital", "Labs", "Press", "Trust"];
const EVENT: &[&str] = &["Crisis", "Summit", "Treaty", "Strike", "Election", "Merger", "Reform", "Uprising"];
/// Entry types and how common each is.
const KINDS: &[(&str, f64)] =
    &[("person", 0.5), ("org", 0.2), ("place", 0.1), ("event", 0.1), ("work", 0.04), ("artifact", 0.02), ("concept", 0.02), ("tradition", 0.01), ("group", 0.01)];

fn pick<'a>(rng: &mut Rng, list: &[&'a str]) -> &'a str {
    list[(rng.f() * list.len() as f64) as usize % list.len()]
}

/// A made-up word of two or three syllables, capitalised: "Kovlan", "Marosel".
fn word(rng: &mut Rng) -> String {
    let n = if rng.f() < 0.5 { 2 } else { 3 };
    let w: String = (0..n).map(|_| pick(rng, SYLLABLES)).collect();
    w[..1].to_uppercase() + &w[1..]
}

fn name(rng: &mut Rng, kind: &str) -> String {
    match kind {
        "person" => format!("{} {}", pick(rng, FIRST), word(rng)),
        "org" => format!("{} {}", word(rng), pick(rng, ORG)),
        "place" => word(rng),
        "event" => format!("{} {} of {}", word(rng), pick(rng, EVENT), 1900 + (rng.f() * 125.0) as u32),
        _ => format!("{} {}", word(rng), word(rng)),
    }
}

/// `n` entries on `schema`, as if loaded from files, and the number of errors `ctd check` would report.
pub fn kb(schema: Schema, n: usize, seed: u64) -> (Kb, usize) {
    let g = world::synthetic(n, seed);
    let mut rng = Rng(seed ^ 0x5eed);
    let kinds: Vec<&str> = KINDS.iter().filter(|(k, _)| schema.types.contains_key(*k)).map(|(k, _)| *k).collect();
    let weights: Vec<f64> = KINDS.iter().filter(|(k, _)| schema.types.contains_key(*k)).map(|(_, w)| *w).collect();
    let total: f64 = weights.iter().sum();
    let kind: Vec<&str> = (0..n)
        .map(|_| {
            let mut x = rng.f() * total;
            kinds.iter().zip(&weights).find(|(_, w)| {
                x -= **w;
                x < 0.0
            })
            .map_or(kinds[0], |(k, _)| *k)
        })
        .collect();
    let names: Vec<String> = kind.iter().map(|k| name(&mut rng, k)).collect();
    let ids: Vec<String> = names.iter().enumerate().map(|(i, n)| format!("{}-{i:x}", n.to_lowercase().replace(' ', "-"))).collect();
    // relations a plain sourced link may use between two types: no accounts, identities or background
    let mut rels: HashMap<(&str, &str), Vec<&str>> = HashMap::new();
    for (id, r) in &schema.relations {
        if r.attributed || r.identity || r.background {
            continue;
        }
        for a in &kinds {
            for b in &kinds {
                if r.from.allows(a) && r.to.allows(b) && (!r.kinship || (schema.types[*a].family && schema.types[*b].family)) {
                    rels.entry((a, b)).or_default().push(id.as_str());
                }
            }
        }
    }
    // each link as (target, relation, year or 0, its number); an entry's claims are written with it
    let mut claims: Vec<Vec<(u32, &str, u16, u32)>> = vec![Vec::new(); n];
    let mut count = 0usize;
    for &(a, b, _) in &g.edges {
        let (mut a, mut b) = (a as usize, b as usize);
        if a == b {
            continue;
        }
        if !rels.contains_key(&(kind[a], kind[b])) {
            (a, b) = (b, a);
        }
        let Some(choices) = rels.get(&(kind[a], kind[b])) else { continue };
        let rel = pick(&mut rng, choices);
        let year = if rng.f() < 0.6 { 1900 + (rng.f() * 125.0) as u16 } else { 0 };
        claims[a].push((b as u32, rel, year, count as u32));
        count += 1;
    }
    let entities: Vec<EntityDoc> = (0..n)
        .map(|i| {
            let list: Vec<Value> = std::mem::take(&mut claims[i])
                .into_iter()
                .enumerate()
                .map(|(k, (b, rel, year, seq))| {
                    let quote = format!("{} {} {}.", names[i], schema.relations[rel].label, names[b as usize]);
                    let mut c = json!({ "id": format!("c{}", k + 1), "rel": rel, "to": ids[b as usize],
                                        "src": [{ "s": format!("record-{}", seq / 100), "quote": quote }] });
                    if year > 0 {
                        c["when"] = json!(year.to_string());
                    }
                    c
                })
                .collect();
            let mut front = json!({ "id": ids[i], "type": kind[i], "name": names[i], "summary": format!("A made-up {} for measuring the data files.", kind[i]),
                                    "claims": list });
            if schema.types[kind[i]].map {
                front["coords"] = json!([((i * 7919) % 36000) as f64 / 100.0 - 180.0, ((i * 104_729) % 15000) as f64 / 100.0 - 75.0]);
            }
            if kind[i] == "person" && i % 3 == 0 {
                front["when"] = json!(format!("{}/{}", 1900 + i % 80, 1960 + i % 60));
            }
            EntityDoc {
                rel_path: format!("content/entities/{}/{}.md", kind[i], ids[i]),
                stem: ids[i].clone(),
                folder_type: Some(kind[i].to_string()),
                front: serde_json::from_value(front).expect("a synthetic entry is valid frontmatter"),
                body: String::new(),
            }
        })
        .collect();
    let sources: Vec<SourceDoc> = (0..count.div_ceil(100))
        .map(|k| {
            let id = format!("record-{k}");
            let src = json!({ "id": id, "title": format!("Record {k}"), "tier": "T1", "url": format!("https://example.org/records/{k}"), "published": "2001" });
            SourceDoc { rel_path: format!("content/sources/{id}.yaml"), stem: id.clone(), src: serde_json::from_value(src).expect("a synthetic source is valid") }
        })
        .collect();
    let (kb, diags) = kb::assemble(schema, Raw { entities, sources, ..Raw::default() });
    // the real schema's own references (perspectives, featured) name real entries: not ours to count
    let errors: Vec<_> = diags.iter().filter(|d| d.level == Level::Error && !d.file.starts_with("content/schema")).collect();
    for d in errors.iter().take(5) {
        eprintln!("synthetic: {}: {}", d.file, d.msg);
    }
    (kb, errors.len())
}

fn kb_size(bytes: usize) -> String {
    if bytes >= 1024 * 1024 { format!("{:.1} MB", bytes as f64 / 1048576.0) } else { format!("{:.1} KB", bytes as f64 / 1024.0) }
}

/// Builds `n` synthetic entries, writes `data/graph-slim.json` and `data/search/` under `out`, and
/// prints each kind of data file's size, gzipped.
pub fn report(root: &Path, n: usize, seed: u64, out: &Path) -> Result<()> {
    let started = Instant::now();
    let (kb, errors) = kb(Schema::load(&root.join("content"))?, n, seed);
    println!("synthetic: {} entries, {} links, {} sources ({} errors) in {:.1} s", kb.entities.len(), kb.edges.len(), kb.sources.len(), errors,
             started.elapsed().as_secs_f64());
    let dir = out.join("data");
    let _ = fs::remove_dir_all(&dir);
    fs::create_dir_all(dir.join("search"))?;

    let slim = data::slim(&kb);
    let slim_gz = data::gzip_len(&slim);
    println!(
        "graph-slim.json: {} gzip ({} raw), {:.1} B per link; budget {} ({})",
        kb_size(slim_gz),
        kb_size(slim.len()),
        slim_gz as f64 / kb.edges.len().max(1) as f64,
        kb_size(data::SLIM_BUDGET),
        if slim_gz > data::SLIM_BUDGET { "past it: routes need the route service" } else { "within it" }
    );
    fs::write(dir.join("graph-slim.json"), slim)?;

    let p = Params::from(&kb.schema.methodology);
    let mut details: Vec<(usize, &str)> = kb
        .entities
        .par_iter()
        .map(|e| {
            let items: Vec<_> = kb.links_of(&e.id).collect();
            let (kept, _) = data::keep_per_kind(&p, &items);
            let bytes = serde_json::to_vec(&data::details(&kb, e, &kept, None, Vec::new())).unwrap_or_default();
            (data::gzip_len(&bytes), e.id.as_str())
        })
        .collect();
    details.sort();
    if let (Some(median), Some(largest)) = (details.get(details.len() / 2), details.last()) {
        println!("e/<id>.json: {} files, median {}, largest {} gzip ({})", details.len(), kb_size(median.0), kb_size(largest.0), largest.1);
    }

    let entries: Vec<Value> = kb.ranked().into_iter().map(data::search_entry).collect();
    let mut sizes: Vec<usize> = Vec::new();
    let index = data::search(&entries, |i, bytes| {
        sizes.push(data::gzip_len(&bytes));
        fs::write(dir.join("search").join(format!("{i}.json")), bytes)?;
        Ok(())
    })?;
    sizes.sort_unstable();
    println!(
        "search/<n>.json: {} files, median {}, largest {} gzip; index.json {} gzip",
        sizes.len(),
        kb_size(sizes[sizes.len() / 2]),
        kb_size(*sizes.last().unwrap_or(&0)),
        kb_size(data::gzip_len(&index))
    );
    fs::write(dir.join("search").join("index.json"), index)?;
    println!("done in {:.1} s; wrote {}", started.elapsed().as_secs_f64(), dir.display());
    Ok(())
}
