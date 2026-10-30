//! The context of a question page (question.html), built from one `Answer`.

use std::collections::HashSet;

use serde_json::{Value, json};

use super::{Ctx, Footnotes, display_aliases, dossier::Axis};
use crate::{
    answers::{self, Answer, Line, Part},
    plural,
    schema::Question,
};

/// Tenures "Over time" shows (the longest); the rest stay in the lists below.
const OVER_TIME_ROWS: usize = 12;

/// "Over time": the answer's tenures (a line dated as a range: a leader's years, a board seat), one
/// row each on a shared axis, as on an entry's life line. Moments and undated lines stay in the lists.
fn over_time(cx: &Ctx, q: &Question, a: &Answer) -> Value {
    let kb = cx.kb;
    let mut seen = HashSet::new();
    let mut rows: Vec<(f64, f64, &Line)> = Vec::new();
    for l in a.published() {
        let Some(w) = l.date().filter(|w| w.is_range()) else { continue };
        if seen.insert(&l.edge.id) {
            let end = w.end.unwrap_or(if w.open_end { now() } else { w.start + 1.0 });
            rows.push((w.start, end.max(w.start), l));
        }
    }
    if rows.is_empty() {
        return Value::Null;
    }
    rows.sort_by(|x, y| (y.1 - y.0).total_cmp(&(x.1 - x.0)).then_with(|| x.2.edge.id.cmp(&y.2.edge.id)));
    rows.truncate(OVER_TIME_ROWS);
    rows.sort_by(|x, y| x.0.total_cmp(&y.0).then_with(|| x.2.edge.id.cmp(&y.2.edge.id)));
    let lo = rows.iter().map(|r| r.0).fold(f64::MAX, f64::min);
    let hi = rows.iter().map(|r| r.1).fold(f64::MIN, f64::max);
    let axis = Axis::new(lo, hi);
    let rows: Vec<Value> = rows
        .iter()
        .map(|&(start, end, l)| {
            let (left, width, point) = axis.bar((start, end));
            json!({
                "phrase": q.groups[l.group].label, "name": kb.name_of(l.other), "url": format!("/e/{}/", l.other),
                "detail": l.edge.detail, "when": l.date().map(|w| &w.label), "according_to": l.edge.according_to.iter().map(|p| kb.name_of(p)).collect::<Vec<_>>(),
                "status": l.edge.status, "left": left, "width": width, "point": point,
            })
        })
        .collect();
    json!({ "rows": rows, "ticks": axis.ticks() })
}

/// Today as a decimal year: where an open tenure ("2015 –") ends on the axis.
pub(super) fn now() -> f64 {
    use chrono::Datelike;
    let d = chrono::Utc::now();
    d.year() as f64 + d.ordinal0() as f64 / 365.25
}

/// "8 links", "7 links, 6 accounts": an answer's counts in readers' words.
pub(super) fn answer_counts(a: &Answer) -> String {
    match a.accounts_total() {
        0 => plural(a.links, "link"),
        n => format!("{}, {}", plural(a.links, "link"), plural(n, "account")),
    }
}

/// One answer line for question.html (docs/data-contract.md, "Template context"); `column`: whose
/// account column it sits in.
fn line_view(cx: &Ctx, q: &Question, l: &Line, column: Option<&str>, notes: &mut Footnotes) -> Value {
    let (kb, e) = (cx.kb, l.edge);
    let form = l.form.map(|f| {
        let until = f.when.as_ref().map(|w| format!(" (until {})", w.label)).unwrap_or_default();
        json!({ "node": cx.node(&f.from), "label": format!("as {}{until}", kb.sentence_name(&f.from)) })
    });
    json!({
        "edge_id": e.id, "other": cx.node(l.other), "phrase": l.phrase(kb), "group": q.groups[l.group].label,
        "when": l.when.map(|w| &w.label), "detail": e.detail, "according_to": cx.attrib(&e.according_to),
        "tier_label": answers::tier(kb, e, column).and_then(|t| kb.schema.tiers.get(t)).map(|t| &t.label),
        "cross_confirmed": e.cross_confirmed, "status": e.status, "reason": e.reason, "note": e.note,
        "refs": notes.refs(&e.sources), "quote": answers::own_words(kb, e, column).and_then(|s| s.quote.as_ref()), "form": form,
        "about": l.about.map(|(id, _)| cx.node(id)),
    })
}

fn part_view(cx: &Ctx, q: &Question, part: &Part, column: Option<&str>, notes: &mut Footnotes) -> Value {
    json!({ "lines": part.lines.iter().map(|l| line_view(cx, q, l, column, notes)).collect::<Vec<_>>(), "more": part.more })
}

/// The context of question.html for one answer (docs/data-contract.md, "Template context").
pub(super) fn answer_view(cx: &Ctx, site: &Value, a: &Answer, story_url: Option<&str>, further: Vec<Value>, ask_next: Vec<Value>) -> Value {
    let kb = cx.kb;
    let q = &kb.schema.questions[a.q];
    let x = a.x;
    let [shows, not] = answers::scope(q);
    // footnotes number in reading order: the record, the accounts, Disputed, then drafts
    let mut notes = Footnotes::default();
    let mut records = Vec::new();
    for (gi, part) in a.records.iter().enumerate() {
        let group = &q.groups[gi];
        let empty = group.empty.as_ref().filter(|_| a.unanswered.contains(&gi));
        if !part.lines.is_empty() || empty.is_some() {
            let mut v = part_view(cx, q, part, None, &mut notes);
            v["label"] = json!(group.label);
            v["empty"] = json!(empty);
            records.push(v);
        }
    }
    let mut accounts = Vec::new();
    for (who, part) in &a.accounts {
        let mut v = part_view(cx, q, part, Some(who), &mut notes);
        v["who"] = json!(cx.node(who));
        accounts.push(v);
    }
    let disputed = part_view(cx, q, &a.disputed, None, &mut notes);
    let drafts = part_view(cx, q, &a.drafts, None, &mut notes);
    json!({
        "site": site,
        "question": { "id": q.id, "ask": q.ask, "label": answers::label(q), "title": answers::title(kb, q, &x.id), "shows": shows, "not": not,
                      "url": format!("/q/{}/", a.id(kb)), "index_url": format!("/q/{}/", q.id), "story_url": story_url,
                      "explore_url": format!("/x/?focus={}", x.id) },
        "x": { "id": x.id, "name": x.name, "sentence": kb.sentence_name(&x.id), "kind": x.kind, "type_label": kb.schema.type_label(&x.kind), "when": x.when.as_ref().map(|w| &w.label),
               "aliases": display_aliases(x), "url": format!("/e/{}/", x.id), "rel_path": x.rel_path },
        "counts": { "links": a.links, "accounts": a.accounts_total(), "names": a.names, "label": answer_counts(a) },
        "records": records, "accounts": accounts, "more_accounts": a.more_accounts,
        "shared": a.shared.chunk_by(|x, y| (x.0, x.2) == (y.0, y.2)).map(|run| {
            let (g, _, n) = run[0];
            json!({ "n": n, "group": (q.groups.len() > 1).then(|| &q.groups[g].label), "names": run.iter().map(|(_, id, _)| cx.node(id)).collect::<Vec<_>>() })
        }).collect::<Vec<_>>(),
        "disputed": disputed, "drafts": drafts, "further": further, "ask_next": ask_next,
        "sources": notes.sources(kb), "methodology": kb.schema.methodology.get("version"), "over_time": over_time(cx, q, a),
    })
}

#[cfg(test)]
mod tests {
    use super::over_time;
    use crate::{
        answers::{answer, tests::world},
        site::Ctx,
        testkit::{entity, load},
    };

    #[test]
    fn over_time_draws_tenures_only() {
        let mut files = world();
        // a ranged funding (a tenure) and a dated moment, both answering "Money in" for the Party
        files.push(entity("org", "fed", "Fed", "  - {id: c1, rel: funded, to: party, when: 1990/2000, src: [{s: rec}]}\n"));
        files.push(entity("org", "once", "Once", "  - {id: c1, rel: funded, to: party, when: 1995, src: [{s: rec}]}\n"));
        let (kb, _) = load("question-over-time", &files);
        let cx = Ctx { kb: &kb };
        let a = answer(&kb, 1, "party").unwrap();
        let v = over_time(&cx, &kb.schema.questions[1], &a);
        let rows = v["rows"].as_array().unwrap();
        let names: Vec<&str> = rows.iter().map(|r| r["name"].as_str().unwrap()).collect();
        assert_eq!(names, ["Fed"], "a moment (1995) and the 1903 founding stay in the lists");
        assert_eq!(rows[0]["phrase"], "Money in");
        // a cause that is an event spanning days or years is drawn on the why page's axis too
        let why = answer(&kb, 2, "fall").unwrap();
        let causes: Vec<String> = over_time(&cx, &kb.schema.questions[2], &why)["rows"].as_array().unwrap().iter().map(|r| r["name"].as_str().unwrap().to_string()).collect();
        assert!(causes.contains(&"Coup".to_string()), "{causes:?}");
        // an answer with no dated range shows no card
        let none = answer(&kb, 3, "fall").unwrap();
        assert!(over_time(&cx, &kb.schema.questions[3], &none).is_null());
    }
}
