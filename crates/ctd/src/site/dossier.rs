//! The dossier at the top of an entity page: family ties, the life line, holders and holdings,
//! and "How each side tells it".

use serde_json::{Value, json};

use super::{Ctx, link_detail, link_phrase};
use crate::{
    edtf::Span,
    kb::{Edge, Entity},
};

fn nice_ticks(lo: f64, hi: f64) -> Vec<(f64, String)> {
    let span = (hi - lo).max(1.0);
    let steps = [1.0, 2.0, 5.0, 10.0, 20.0, 25.0, 50.0, 100.0, 200.0, 250.0, 500.0, 1000.0, 2000.0];
    let step = steps.iter().copied().find(|s| span / s <= 6.0).unwrap_or(5000.0);
    let mut t = (lo / step).ceil() * step;
    let mut out = Vec::new();
    while t <= hi {
        out.push((t, crate::edtf::year_label(t.round() as i64)));
        t += step;
    }
    out
}

/// The shared time axis of a life line or an answer's "Over time": `lo`..`hi` with a little room
/// (3%, at least half a year) on each side.
pub(super) struct Axis {
    lo: f64,
    hi: f64,
}

impl Axis {
    pub(super) fn new(lo: f64, hi: f64) -> Axis {
        let pad = ((hi - lo) * 0.03).max(0.5);
        Axis { lo: lo - pad, hi: hi + pad }
    }

    fn pct(&self, x: f64) -> f64 {
        ((x - self.lo) / (self.hi - self.lo) * 100.0).clamp(0.0, 100.0)
    }

    /// A bar from `a` to `b` in percent of the axis: (left, width of at least 0.8, a year or less).
    pub(super) fn bar(&self, (a, b): (f64, f64)) -> (f64, f64, bool) {
        (self.pct(a), (self.pct(b) - self.pct(a)).max(0.8), b - a <= 1.0)
    }

    pub(super) fn ticks(&self) -> Vec<Value> {
        nice_ticks(self.lo, self.hi).into_iter().map(|(t, l)| json!({ "left": self.pct(t), "label": l })).collect()
    }
}

/// Tenures the life line shows (the longest); the rest are counted and told in the Timeline.
const LIFELINE_ROWS: usize = 8;

/// The at-a-glance band of an entity page: family ties, life line, holders and the perspective
/// split. Server-rendered, no JavaScript.
pub(super) fn dossier(cx: &Ctx, ent: &Entity, items: &[(&Edge, bool)], now: f64) -> Value {
    let kb = cx.kb;
    // withdrawn (deprecated) links stay listed, marked, under Connections, but never reach the glance band
    let items: Vec<(&Edge, bool)> = items.iter().copied().filter(|(e, _)| e.status != "deprecated").collect();
    let items = items.as_slice();

    // life line: one row per tenure (a leader's years, a board seat), the longest kept. A moment,
    // such as a founding or a round of money, is told in the Timeline, where its words fit.
    let mut lifeline = Value::Null;
    let span_of = |w: &Span| (w.start, w.end.unwrap_or(if w.open_end { now.max(w.start + 0.5) } else { w.start + 1.0 }));
    let mut tenures: Vec<(&Edge, bool, (f64, f64))> =
        items.iter().filter_map(|&(e, outgoing)| e.when.as_ref().filter(|w| w.is_range()).map(|w| (e, outgoing, span_of(w)))).collect();
    if !tenures.is_empty() {
        tenures.sort_by(|a, b| (b.2.1 - b.2.0).total_cmp(&(a.2.1 - a.2.0)).then_with(|| a.0.id.cmp(&b.0.id)));
        let more = tenures.len().saturating_sub(LIFELINE_ROWS);
        tenures.truncate(LIFELINE_ROWS);
        tenures.sort_by(|a, b| a.2.0.total_cmp(&b.2.0).then_with(|| a.0.id.cmp(&b.0.id)));
        let own = ent.when.as_ref().map(span_of);
        let lo = tenures.iter().map(|t| t.2.0).chain(own.map(|o| o.0)).fold(f64::MAX, f64::min);
        let hi = tenures.iter().map(|t| t.2.1).chain(own.map(|o| o.1)).fold(f64::MIN, f64::max);
        // a life line needs a life: under three years everything collapses into one tick
        if hi - lo >= 3.0 {
            let axis = Axis::new(lo, hi);
            let mut rows = Vec::new();
            if let (Some(w), Some(span)) = (&ent.when, own) {
                let phrase = kb.schema.types.get(&ent.kind).and_then(|t| t.span.as_deref()).unwrap_or("Span");
                let (left, width, _) = axis.bar(span);
                rows.push(json!({ "own": true, "phrase": phrase, "when": w.label, "left": left, "width": width, "point": false }));
            }
            for (e, outgoing, span) in &tenures {
                let other = e.other(*outgoing);
                let (left, width, point) = axis.bar(*span);
                rows.push(json!({
                    "own": false, "phrase": link_phrase(kb, e, *outgoing), "name": kb.name_of(other), "url": format!("/e/{other}/"),
                    "detail": link_detail(kb, e, *outgoing),
                    "when": e.when.as_ref().map(|w| &w.label), "left": left, "width": width, "point": point,
                    "according_to": e.according_to.iter().map(|p| kb.name_of(p)).collect::<Vec<_>>(), "status": e.status, "reason": e.reason,
                }));
            }
            lifeline = json!({ "rows": rows, "ticks": axis.ticks(), "more": more });
        }
    }

    // holders (who holds this) and holdings (what this holds)
    let mut holders = Vec::new();
    let mut holdings = Vec::new();
    for (e, outgoing) in items {
        // a stake: a relation that takes a percent
        if !kb.schema.relations[&e.rel].qualifiers.iter().any(|q| q == "percent") {
            continue;
        }
        let Some(p) = e.qualifiers.get("percent").and_then(Value::as_f64) else { continue };
        let as_of = e.qualifiers.get("as_of").and_then(Value::as_str).map(|d| crate::edtf::parse(d).map(|s| s.label).unwrap_or_else(|_| d.to_string()));
        let row = |id: &str| json!({ "node": cx.node(id), "percent": p, "passive": e.passive, "as_of": as_of, "edge": e.id });
        if *outgoing { holdings.push(row(&e.to)) } else { holders.push(row(&e.from)) }
    }
    let by_pct = |a: &Value, b: &Value| b["percent"].as_f64().unwrap_or(0.0).total_cmp(&a["percent"].as_f64().unwrap_or(0.0));
    holders.sort_by(by_pct);
    holdings.sort_by(by_pct);
    let scale = holders.iter().chain(holdings.iter()).filter_map(|r| r["percent"].as_f64()).fold(10.0f64, f64::max);

    // family ties: kinship links, each with what that relative did (their own links)
    let mut family: Vec<Value> = Vec::new();
    for (e, outgoing) in items {
        if !kb.schema.relations[&e.rel].kinship {
            continue;
        }
        let other = e.other(*outgoing);
        // `role` describes the claim's owner (its `from`) relative to its target
        let role = kb.kin_role(e);
        let did: Vec<Value> = crate::stories::deeds(kb, other)
            .iter()
            .take(4)
            .map(|x| json!({ "phrase": kb.schema.relations[&x.rel].label, "other": cx.node(&x.to), "detail": x.detail,
                             "when": x.when.as_ref().map(|w| w.label.clone()), "draft": x.status == "draft",
                             "disputed": x.status == "disputed", "reason": x.reason,
                             "according_to": x.according_to.iter().map(|a| cx.node(a)).collect::<Vec<_>>() }))
            .collect();
        family.push(json!({
            "node": cx.node(other),
            "role": if *outgoing { None } else { role },
            "self_role": if *outgoing { role } else { None },
            "draft": e.status == "draft", "disputed": e.status == "disputed", "reason": e.reason,
            "attributed": !e.according_to.is_empty(), "according_to": e.according_to.iter().map(|a| cx.node(a)).collect::<Vec<_>>(),
            "did": did,
        }));
    }

    // perspective split
    let mut sides: Vec<(String, Vec<Value>)> = Vec::new();
    for (e, outgoing) in items {
        for p in &e.according_to {
            let other = e.other(*outgoing);
            let claim = json!({ "phrase": link_phrase(kb, e, *outgoing), "other": cx.node(other),
                                "when": e.when.as_ref().map(|w| w.label.clone()),
                                "draft": e.status == "draft", "disputed": e.status == "disputed", "reason": e.reason });
            match sides.iter_mut().find(|s| &s.0 == p) {
                Some(s) => s.1.push(claim),
                None => sides.push((p.clone(), vec![claim])),
            }
        }
    }
    let confirmed: Vec<Value> = items
        .iter()
        .filter(|(e, _)| e.cross_confirmed)
        .map(|(e, outgoing)| {
            let other = e.other(*outgoing);
            json!({ "phrase": link_phrase(kb, e, *outgoing), "other": cx.node(other), "when": e.when.as_ref().map(|w| w.label.clone()),
                    "disputed": e.status == "disputed", "reason": e.reason })
        })
        .collect();
    let split = if sides.len() >= 2 {
        json!({
            // every account gets its column: hiding some would make the split one-sided
            "sides": sides.into_iter().map(|(p, claims)| json!({ "who": cx.node(&p), "claims": claims })).collect::<Vec<_>>(),
            "confirmed": confirmed,
        })
    } else {
        Value::Null
    };

    json!({
        "family": if family.is_empty() { Value::Null } else { json!(family) },
        "lifeline": lifeline,
        "holders": if holders.is_empty() { Value::Null } else { json!(holders) },
        "holdings": if holdings.is_empty() { Value::Null } else { json!(holdings) },
        "share_scale": scale,
        "split": split,
    })
}

#[cfg(test)]
mod tests {
    use serde_json::json;

    use super::dossier;
    use crate::{
        site::Ctx,
        stories::tests::family,
        testkit::{entity, file, load, source},
    };

    #[test]
    fn glance_band_skips_withdrawn_links_and_marks_disputed_ones() {
        let mut files = family();
        files.push(file(
            "content/entities/person/da/dan.md",
            "---\nid: dan\ntype: person\nname: Dan\nwhen: 1960/2020\nclaims:\n\
               - {id: c1, rel: founded, to: beta, when: 1999/2004, status: disputed, reason: Two accounts differ., src: [{s: rec}]}\n\
               - {id: c2, rel: founded, to: gamma, when: 2002, src: [{s: rec}]}\n\
               - {id: c3, rel: founded, to: delta, when: 2003/2008, status: deprecated, reason: Withdrawn., src: [{s: rec}]}\n---\n",
        ));
        let (kb, _) = load("site-glance", &files);
        let cx = Ctx { kb: &kb };
        let glance = |id: &str| {
            let items: Vec<_> = kb.links_of(id).collect();
            dossier(&cx, kb.entity(id).unwrap(), &items, 2026.0)
        };
        let ann = glance("ann");
        assert!(ann["lifeline"].is_null(), "moments (founding Epsilon in 2001) are told in the Timeline, not as dots");
        assert_eq!(ann["family"][0]["self_role"], "mother");
        let dan = glance("dan");
        let rows: Vec<(&str, &str, &str)> = dan["lifeline"]["rows"]
            .as_array()
            .unwrap()
            .iter()
            .map(|r| (r["phrase"].as_str().unwrap(), r["name"].as_str().unwrap_or(""), r["status"].as_str().unwrap_or("")))
            .collect();
        assert_eq!(rows, [("Life", "", ""), ("founded", "Beta", "disputed")], "a moment and a withdrawn tenure are not drawn");

        let bob = glance("bob");
        let tie = &bob["family"][0];
        assert_eq!((tie["role"].as_str(), tie["self_role"].as_str()), (Some("mother"), None));
        let did: Vec<(&str, bool)> = tie["did"].as_array().unwrap().iter().map(|d| (d["other"]["id"].as_str().unwrap(), d["disputed"] == true)).collect();
        assert_eq!(did, [("epsilon", true), ("acme", true), ("beta", false), ("gamma", false)]);
    }

    #[test]
    fn glance_cards_mark_status_and_leave_out_withdrawn_links() {
        let (kb, _) = load(
            "site-glance-status",
            &[
                entity(
                    "person",
                    "ann",
                    "Ann",
                    "  - {id: c1, rel: relative_of, to: bob, role: mother, status: disputed, reason: Two records differ., src: [{s: rec}]}\n\
                     \x20 - {id: c2, rel: relative_of, to: cy, role: aunt, status: deprecated, reason: Wrong person., src: [{s: rec}]}\n\
                     \x20 - {id: c3, rel: founded, to: acme, according_to: [vox], status: draft, src: [{s: rec}]}\n\
                     \x20 - {id: c4, rel: founded, to: beta, according_to: [lex], status: disputed, reason: Lex alone says so., src: [{s: rec}]}\n\
                     \x20 - {id: c5, rel: founded, to: gamma, according_to: [vox], status: deprecated, reason: Retracted., src: [{s: rec}]}\n",
                ),
                entity("person", "bob", "Bob", ""),
                entity("person", "cy", "Cy", ""),
                entity("org", "acme", "Acme", ""),
                entity("org", "beta", "Beta", ""),
                entity("org", "gamma", "Gamma", ""),
                entity("org", "vox", "Vox", ""),
                entity("org", "lex", "Lex", ""),
                source("rec", "T1"),
            ],
        );
        let cx = Ctx { kb: &kb };
        let items: Vec<_> = kb.links_of("ann").collect();
        let ann = dossier(&cx, kb.entity("ann").unwrap(), &items, 2026.0);
        // the withdrawn aunt never reaches Family ties; the disputed mother says why
        let family = ann["family"].as_array().unwrap();
        assert_eq!(family.len(), 1, "{family:?}");
        assert_eq!((&family[0]["node"]["id"], &family[0]["disputed"], &family[0]["reason"]), (&json!("bob"), &json!(true), &json!("Two records differ.")));
        // each side lists its own links with their status; the withdrawn one is gone
        let mut said = Vec::new();
        for side in ann["split"]["sides"].as_array().unwrap() {
            for c in side["claims"].as_array().unwrap() {
                let status = if c["draft"] == true { "draft" } else if c["disputed"] == true { "disputed" } else { "" };
                said.push(format!("{}: {} {status} {}", side["who"]["id"], c["other"]["id"], c["reason"]));
            }
        }
        assert_eq!(said, [r#""vox": "acme" draft null"#, r#""lex": "beta" disputed "Lex alone says so.""#]);
    }
}
