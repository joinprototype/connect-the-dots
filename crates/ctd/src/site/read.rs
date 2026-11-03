//! Read (`/read/` and `/read/<id>/`): a written story as one column of words over the field of dots
//! where it happens. The words are all in the page, as HTML: the opening lines set large, the scenes
//! with their quoted proof, and at the end the stories that share the most with it, each with its
//! reason. `web/src/read/` draws the picture beside them, opens a name in place, and joins the next
//! story only when the reader picks it.

use std::{collections::BTreeSet, sync::LazyLock};

use regex::Regex;
use serde_json::{Value, json};

use super::{Site, data, script_json};
use crate::{
    kb::{Chapter, Kb},
    markdown,
};

/// The opening lines are the intro's first paragraph when it is this short, in letters. A longer one is
/// cut after the sentences that fit in `CUT`, and the rest leads the intro.
const HERO: usize = 240;
const CUT: usize = 200;

/// A scene's bold title, at the start of its narration.
static HEADING: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^\s*<p><strong>(.*?)</strong>\s*").unwrap());
static PARAGRAPH: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?s)^\s*<p>(.*?)</p>\s*").unwrap());

/// What `read.html` shows of one written story. `steps` and `next` are what its `/c/` page has.
pub fn story(s: &Site, ch: &Chapter, steps: &[Value], next: &[Value]) -> anyhow::Result<Value> {
    let kb = s.kb;
    let resolver = s.cx.resolver();
    // the opening's doors are judged as the first scene's: a one-word name must be one that scene lists
    let intro = match ch.shots.first() {
        Some(first) => markdown::render_scene(&ch.intro_md, &resolver, &s.names.story(&ch.shots), first),
        None => markdown::render(&ch.intro_md, &resolver),
    };
    let (hero, intro) = opening(&intro);
    // the longer the opening lines, the smaller they are set
    let hero_size = hero.as_deref().map(letters).map_or("", |n| match n {
        0..=110 => "",
        111..=160 => "mid",
        _ => "long",
    });
    let scenes: Vec<Value> = ch
        .shots
        .iter()
        .zip(steps)
        .map(|(shot, step)| {
            let html = step["narration_html"].as_str().unwrap_or_default();
            let (heading, body) = match HEADING.captures(html) {
                Some(c) => (Some(c[1].trim_end_matches(['.', ':']).to_string()), format!("<p>{}", &html[c[0].len()..])),
                None => (None, html.to_string()),
            };
            json!({ "when": step["time_label"], "heading": heading, "body": body.replace("<p></p>", ""), "proof": proof(s, shot) })
        })
        .collect();
    // what the picture needs of each scene, in the prototype's short names
    let pictures: Vec<Value> = ch
        .shots
        .iter()
        .map(|shot| {
            let mut v = json!({ "v": if shot["view"] == "map" { "map" } else { "graph" } });
            if let (Some(c), Some(z)) = (shot["camera"]["center"].as_array(), shot["camera"]["zoom"].as_f64()) {
                v["c"] = json!([c.first(), c.get(1), z]);
            }
            for (key, short) in [("places", "p"), ("routes", "w"), ("focus", "f"), ("reveal", "r"), ("reveal_claims", "x"), ("time_label", "t")] {
                if !shot[key].is_null() {
                    v[short] = shot[key].clone();
                }
            }
            v
        })
        .collect();
    let own = data::story(kb, &s.by_id, &ch.shots);
    // where an entry is on the Earth, for those whose coordinates are their own: a person is drawn at
    // no city, only named
    let at: serde_json::Map<String, Value> = own["nodes"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|n| {
            let id = n["id"].as_str()?;
            let c = kb.entity(id)?.coords?;
            Some((id.to_string(), json!(c)))
        })
        .collect();
    let next: Vec<Value> = next
        .iter()
        .map(|c| json!({ "id": c["id"], "title": c["title"], "subtitle": c["subtitle"], "url": format!("/read/{}/", c["id"].as_str().unwrap_or_default()), "shares": c["shares"] }))
        .collect();
    Ok(json!({
        "id": ch.id, "title": ch.title, "subtitle": ch.subtitle, "summary": ch.summary, "url": format!("/read/{}/", ch.id), "story_url": format!("/c/{}/", ch.id),
        "hero": hero, "hero_size": hero_size, "intro": intro, "scenes": scenes, "next": next,
        "data_json": script_json(&json!({ "id": ch.id, "title": ch.title, "scenes": pictures, "at": at, "data": own }))?,
    }))
}

/// The story `/read/` opens on: the editors' pick (`read` in content/featured.yaml) if the first screen
/// may show it (ADR-0027); else the first in the library that it may show and that opens on the Earth,
/// so that its first lines stand over the place where it happens.
pub fn first(kb: &Kb) -> Option<String> {
    let free = kb.unsealed_chapters();
    let picked = free.iter().find(|ch| kb.featured.read.as_ref() == Some(&ch.id));
    let on_earth = free.iter().find(|ch| ch.shots.first().is_some_and(|shot| shot["view"] == "map"));
    picked.or(on_earth).or(free.first()).map(|ch| ch.id.clone())
}

/// Once per page: each kind's ink, which the picture needs from the start.
pub fn site_json(s: &Site) -> anyhow::Result<String> {
    let kb = s.kb;
    let inks: serde_json::Map<String, Value> = kb.schema.types.keys().map(|t| (t.clone(), json!(kb.schema.type_color(t)))).collect();
    script_json(&json!({ "inks": inks }))
}

/// `data/read.json`, loaded the first time a reader opens a name or "Find a name": every story, for
/// Find with nothing typed; the entries no step may go on from (sealed, and what is about them:
/// ADR-0027); and the relations a place's or a school's side does not list as its links (ADR-0016).
pub fn data(s: &Site, cards: &[Value]) -> Value {
    let kb = s.kb;
    let stories: Vec<Value> = cards.iter().map(|c| json!([c["id"], c["title"], c["subtitle"], c["shots"]])).collect();
    let sealed: BTreeSet<&str> = kb.sealed().into_iter().collect();
    let background: Vec<&String> = kb.schema.relations.iter().filter(|(_, r)| r.background).map(|(id, _)| id).collect();
    json!({ "stories": stories, "sealed": sealed, "background": background })
}

/// The quoted proof under a scene: its quote, number or source card, with where the words come from.
fn proof(s: &Site, shot: &Value) -> Option<Value> {
    let kb = s.kb;
    let o = &shot["overlay"];
    let kind = o["kind"].as_str().filter(|k| matches!(*k, "quote" | "stat" | "source"))?;
    let source = o["source"].as_str().and_then(|id| kb.sources.get(id)).map(|src| {
        json!({ "title": src.title, "publisher": src.publisher.as_ref().map(|p| kb.name_of(p)), "published": src.published_label.as_ref().or(src.published.as_ref()),
                "url": src.url, "archive": src.archive_url, "tier": kb.schema.tiers.get(&src.tier).map(|t| &t.label) })
    });
    Some(json!({ "kind": kind, "quote": o["quote"], "caption": o["caption"], "value": o["value"], "label": o["label"], "source": source }))
}

/// The opening lines and the rest of the intro. The first paragraph opens the story when it is short;
/// a long one gives its first sentences, cut only where no tag is open.
fn opening(html: &str) -> (Option<String>, String) {
    let Some(first) = PARAGRAPH.captures(html) else { return (None, html.to_string()) };
    let (inner, rest) = (&first[1], &html[first[0].len()..]);
    if letters(inner) <= HERO {
        return (Some(inner.trim().to_string()), rest.to_string());
    }
    let mut cut = None;
    let (mut depth, mut seen, mut in_tag) = (0i32, 0usize, false);
    let bytes = inner.as_bytes();
    for (i, c) in inner.char_indices() {
        match c {
            '<' => {
                in_tag = true;
                depth += if bytes.get(i + 1) == Some(&b'/') { -1 } else { 1 };
            }
            '>' => {
                in_tag = false;
                // a void or self-closed tag opened nothing
                if inner[..i].ends_with('/') || inner[..i].rsplit('<').next().is_some_and(|t| t.starts_with("br")) {
                    depth -= 1;
                }
            }
            _ if in_tag => {}
            _ => {
                seen += 1;
                let after = &inner[i + c.len_utf8()..];
                let closes = after.trim_start_matches(['”', '’', '"', '\'']);
                if depth == 0 && matches!(c, '.' | '?' | '!') && closes.starts_with(' ') {
                    if seen > CUT && cut.is_some() {
                        break;
                    }
                    cut = Some(inner.len() - closes.len());
                }
            }
        }
    }
    match cut {
        Some(at) if at < inner.len() => (Some(inner[..at].trim().to_string()), format!("<p>{}</p>\n{rest}", inner[at..].trim())),
        _ => (Some(inner.trim().to_string()), rest.to_string()),
    }
}

/// How many letters a piece of HTML shows.
fn letters(html: &str) -> usize {
    let mut in_tag = false;
    html.chars()
        .filter(|&c| {
            match c {
                '<' => in_tag = true,
                '>' => {
                    in_tag = false;
                    return false;
                }
                _ => {}
            }
            !in_tag
        })
        .count()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_short_first_paragraph_opens_the_story() {
        let (hero, rest) = opening("<p>Two shots in <a href=\"/e/sarajevo/\">Sarajevo</a>.</p>\n<p>More.</p>\n");
        assert_eq!(hero.as_deref(), Some("Two shots in <a href=\"/e/sarajevo/\">Sarajevo</a>."));
        assert_eq!(rest, "<p>More.</p>\n");
    }

    #[test]
    fn a_long_one_is_cut_after_a_sentence_and_never_inside_a_tag() {
        let long = format!("<p>One <em>short. Sentence</em> here. {}. Last words.</p>", "word ".repeat(60).trim());
        let (hero, rest) = opening(&long);
        assert_eq!(hero.as_deref(), Some("One <em>short. Sentence</em> here."));
        assert!(rest.starts_with("<p>word word"), "{rest}");
        assert!(rest.ends_with("Last words.</p>\n"));
    }

    #[test]
    fn no_paragraph_no_opening() {
        assert_eq!(opening(""), (None, String::new()));
    }
}
