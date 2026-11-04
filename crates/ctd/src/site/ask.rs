//! Ask (`/ask/`): one box that is the page's heading, and under it the answer. The page arrives already
//! asking one of the featured pairs, and `data/ask.json` holds what the box reads besides the search
//! files and the graph: the written stories, with their years and the entries they name, and what no
//! answer may run through (ADR-0027).
//!
//! Nothing here is free text from an address: the page names entries by id, and its words come from
//! them and from the route question in content/schema/questions.yaml.

use std::collections::BTreeSet;

use anyhow::Result;
use serde_json::{Value, json};

use super::{Site, data, script_json, write};
use crate::{kb::shot_entries, paths};

/// The file's budget in gzip bytes.
pub const BUDGET: usize = 100 * 1024;

/// The featured pairs the page may arrive on: neither end, nor any stop of their way, is kept out.
/// Each is the route question asked about the two, in parts: words, and names with their ids and inks.
fn picks(s: &Site, out: &BTreeSet<&str>) -> Vec<Value> {
    let kb = s.kb;
    let ask = kb.schema.questions.iter().find(|q| q.route).map_or("How are {a} and {b} connected?", |q| q.ask.as_str());
    let mut found = Vec::new();
    for c in &kb.featured.connections {
        let [a, b] = c.ids();
        if out.contains(a.as_str()) || out.contains(b.as_str()) {
            continue;
        }
        let way = paths::find(kb, a, b, &paths::Options::stories(kb, 1));
        if !way.first().is_some_and(|p| !p.hops.is_empty() && p.nodes.iter().all(|n| !out.contains(n.as_str()))) {
            continue;
        }
        let parts = asked(s, ask, a, b);
        let text: String = parts.iter().filter_map(|p| p[0].as_str()).collect();
        found.push(json!({ "a": a, "b": b, "text": text, "parts": parts, "note": c.note() }));
    }
    found
}

/// A question asked about two entries, in parts: words as `[text]`, and each name as `[text, id, ink]`.
/// Only the name is inked: in "the Gutenberg Bible" (its `in_sentence`), "the" is a word.
fn asked(s: &Site, ask: &str, a: &str, b: &str) -> Vec<Value> {
    let kb = s.kb;
    let mut parts = Vec::new();
    let mut words = String::new();
    let mut rest = ask;
    while let Some((at, id)) = [("{a}", a), ("{b}", b)].into_iter().filter_map(|(k, id)| rest.find(k).map(|at| (at, id))).min() {
        let said = kb.sentence_name(id);
        let name = kb.name_of(id);
        let lead = said.strip_suffix(name.as_str()).unwrap_or("");
        words.push_str(&rest[..at]);
        words.push_str(lead);
        if !words.is_empty() {
            parts.push(json!([std::mem::take(&mut words)]));
        }
        let kind = kb.entity(id).map_or("", |e| e.kind.as_str());
        parts.push(json!([&said[lead.len()..], id, kb.schema.type_color(kind)]));
        rest = &rest[at + 3..];
    }
    words.push_str(rest);
    if !words.is_empty() {
        parts.push(json!([words]));
    }
    parts
}

/// `data/ask.json`: the stories free of sealed entries, in the library's order, as
/// `[id, title, subtitle, years with a scene, entries named]`, and what is kept out. A group or a
/// tradition is named by no story here, so no two names share a story for who someone is (ADR-0016).
fn file(s: &Site, out: &BTreeSet<&str>) -> Value {
    let kb = s.kb;
    let stories: Vec<Value> = kb
        .unsealed_chapters()
        .into_iter()
        .map(|ch| {
            let years: BTreeSet<i64> = ch.shots.iter().filter_map(|shot| shot["t"].as_f64()).map(|t| t.floor() as i64).collect();
            let mut names: BTreeSet<&str> = BTreeSet::new();
            for shot in &ch.shots {
                names.extend(shot_entries(shot).map(|(_, id)| id));
                names.extend(data::revealed(&s.by_id, shot).values().flat_map(|e| [e.from.as_str(), e.to.as_str()]));
            }
            names.retain(|id| kb.entity(id).is_some_and(|e| kb.joins(e)) && !out.contains(id));
            json!([ch.id, ch.title, ch.subtitle, years, names])
        })
        .collect();
    json!({ "stories": stories, "sealed": out })
}

/// What the box can be asked, one of each kind, under it: a name, two names, a year and a question,
/// each `{ kind, text, url }`. The name is the home page's first thread, the pair the second featured
/// one, the year where the story Read once opened on begins, and the question one asked of a thread's
/// name. `asked` are the question pages, as `(question id, entry id)`. Nothing kept out is offered.
fn examples(s: &Site, out: &BTreeSet<&str>, picks: &[Value], asked: &[(&str, &str)]) -> Vec<Value> {
    let kb = s.kb;
    let free = |id: &str| !out.contains(id) && kb.entity(id).is_some();
    let mut found = Vec::new();
    if let Some(id) = kb.featured.threads.iter().find(|id| free(id)) {
        found.push(json!({ "kind": "name", "text": kb.name_of(id), "url": format!("/ask/?a={id}") }));
    }
    if let Some(p) = picks.get(1).or(picks.first()) {
        let (a, b) = (p["a"].as_str().unwrap_or_default(), p["b"].as_str().unwrap_or_default());
        found.push(json!({ "kind": "pair", "text": format!("{} and {}", kb.name_of(a), kb.name_of(b)), "url": format!("/ask/?a={a}&b={b}") }));
    }
    let year = super::read::first(kb)
        .and_then(|id| kb.chapters.iter().find(|ch| ch.id == id))
        .and_then(|ch| ch.shots.iter().find_map(|shot| shot["t"].as_f64()))
        .map(|t| t.floor() as i64);
    if let Some(y) = year.filter(|y| *y > 0) {
        found.push(json!({ "kind": "year", "text": y.to_string(), "url": format!("/ask/?y={y}") }));
    }
    let question = kb.featured.threads.iter().find_map(|id| asked.iter().find(|(_, x)| x == id && free(x))).or_else(|| asked.iter().find(|(_, x)| free(x)));
    if let Some((q, x)) = question
        && let Some(def) = kb.schema.questions.iter().find(|d| d.id == *q)
    {
        found.push(json!({ "kind": "question", "text": crate::answers::title(kb, def, x), "url": format!("/ask/?q={q}&a={x}") }));
    }
    found
}

/// The page and its file. `asked` are the question pages, as `(question id, entry id)`.
pub(super) fn write_ask(s: &Site, asked: &[(&str, &str)]) -> Result<()> {
    let out = s.kb.kept_out();
    let picks = picks(s, &out);
    let examples = examples(s, &out, &picks, asked);
    let bytes = serde_json::to_vec(&file(s, &out))?;
    let gz = data::gzip_len(&bytes);
    if gz > BUDGET {
        eprintln!("warning: data/ask.json is {} KB gzip, past its {} KB budget", gz / 1024, BUDGET / 1024);
    }
    write(&s.out.join("data").join("ask.json"), bytes)?;
    let html = s.render("ask.html", json!({ "site": &s.site, "first": picks.first(), "examples": examples, "picks_json": script_json(&picks)? }))?;
    write(&s.out.join("ask").join("index.html"), html)
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use serde_json::Value;

    use crate::testkit::{entity, file, source, write_repo};

    #[test]
    fn ask_arrives_on_open_pairs_and_keeps_out_what_is_sealed() {
        let founded = |to: &str| format!("  - {{id: c1, rel: founded, to: {to}, src: [{{s: rec, quote: \"It was founded.\"}}]}}\n");
        let story = "---\nid: tale\ntype: chapter\ntitle: A tale\n---\n\n```scene\n- shot: a\n  view: graph\n  time: \"1990\"\n  duration: 5\n  reveal: [ann, bo, den-holdings]\n  narration: \"Ann and Bo.\"\n```\n";
        let files = vec![
            source("rec", "T1"),
            entity("person", "ann", "Ann", &founded("acme")),
            entity("person", "bo", "Bo", &founded("acme")),
            entity("org", "acme", "Acme", ""),
            // a sealed person, and a body that takes his family name
            file("content/entities/person/hi/hid.md", "---\nid: hid\ntype: person\nname: Hid Den\nsealed: true\nclaims: []\n---\n"),
            entity("org", "den-holdings", "Den Holdings", &founded("acme")),
            file("content/chapters/tale.md", story),
            file("content/featured.yaml", "connections:\n  - [hid, acme]\n  - [bo, ann]\n  - [den-holdings, ann]\n"),
        ];
        let root = write_repo("site-ask", &files).unwrap();
        crate::site::copy_dir(&Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme"), &root.join("theme")).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        let out = root.join("dist");
        crate::site::build(&root, &kb, &crate::site::Opts { out: out.clone(), dev: true, graph: false }).unwrap();
        let page = std::fs::read_to_string(out.join("ask/index.html")).unwrap();
        // only Bo and Ann may open the page: one end of each other pair is kept out
        let picks = &page[page.find("id=\"ask-picks\">").unwrap()..];
        assert!(picks.contains("\"a\":\"bo\",\"b\":\"ann\"") && !picks.contains("hid") && !picks.contains("den-holdings"), "{picks}");
        assert!(page.contains("How are <b style=\"--c: "), "the first pick is painted in the box");
        let ask: Value = serde_json::from_slice(&std::fs::read(out.join("data/ask.json")).unwrap()).unwrap();
        let sealed: Vec<&str> = ask["sealed"].as_array().unwrap().iter().filter_map(Value::as_str).collect();
        assert_eq!(sealed, ["den-holdings", "hid"]);
        assert_eq!(ask["stories"][0][3], serde_json::json!([1990]));
        assert_eq!(ask["stories"][0][4], serde_json::json!(["ann", "bo"]));
        let _ = std::fs::remove_dir_all(&root);
    }
}
