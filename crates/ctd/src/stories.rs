//! Generated stories: every entity gets its life line as scenes, every featured pair gets its
//! route as scenes. Same shot format as hand-written chapters (docs/data-contract.md).

use std::collections::{BTreeMap, HashSet};

use serde_json::{Value, json};

use crate::{
    answers::{self, Answer, Line, Part},
    edtf::year_label,
    kb::{Edge, EdgeSrc, Kb},
    markdown::text,
    paths, plural,
};

pub struct Draft {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub summary: Option<String>,
    pub intro_md: String,
    pub outro_md: String,
    pub shots: Vec<Value>,
    pub explore_url: String,
}

const MAX_DATED: usize = 12;
/// The most sentences one year scene of a life story says; a busier year continues in the next scene.
const YEAR_LINES: usize = 6;
const MAX_GROUPS: usize = 4;
/// Shots in an answer story, and seconds each account gets in watch mode (the same for all).
const MAX_SHOTS: usize = 14;
const ACCOUNT_SECONDS: u64 = 8;
/// What every answer and route says.
pub const NOTICE: &str = "A connection is not evidence of wrongdoing.";

/// An entry as named mid-sentence ("the Bolsheviks", `in_sentence`), linked to its page.
fn link(kb: &Kb, id: &str) -> String {
    format!("[[{id}|{}]]", kb.sentence_name(id))
}

/// The same at the start of a sentence: "The Bolsheviks".
fn link_cap(kb: &Kb, id: &str) -> String {
    format!("[[{id}|{}]]", capitalize(&kb.sentence_name(id)))
}

/// "A, B and C".
fn and_list(names: &[String]) -> String {
    match names {
        [] => String::new(),
        [one] => one.clone(),
        [rest @ .., last] => format!("{} and {last}", rest.join(", ")),
    }
}

/// A link's status in plain words, `None` once published: "still being verified", "disputed" or
/// "disputed: <reason>". Withdrawn (deprecated) links never reach a story.
fn status_words(e: &Edge) -> Option<String> {
    match e.status.as_str() {
        "draft" => Some("still being verified".into()),
        "disputed" => Some(match e.reason.as_deref().map(|r| r.trim().trim_end_matches('.')).filter(|r| !r.is_empty()) {
            Some(r) => format!("disputed: {}", text(r)),
            None => "disputed".into(),
        }),
        _ => None,
    }
}

/// What a relative did, for family ties: their own links that are not family, index-fund holdings
/// or withdrawn, earliest first.
pub fn deeds<'a>(kb: &'a Kb, id: &str) -> Vec<&'a Edge> {
    let mut did: Vec<&Edge> = kb
        .links_of(id)
        .filter(|(x, outgoing)| {
            let r = &kb.schema.relations[&x.rel];
            *outgoing && r.traversable && !r.kinship && !x.passive && x.status != "deprecated"
        })
        .map(|(x, _)| x)
        .collect();
    did.sort_by(|a, b| a.start().total_cmp(&b.start()).then(a.id.cmp(&b.id)));
    did
}

/// "Elon Musk, *CEO of* Tesla." plus qualifiers, attribution, the claim's note and its status.
/// Family links read "Mary Maxwell Gates, *mother of* Bill Gates": the role describes the claim's owner.
/// Content's free text (role, qualifiers, note, reason) goes in as plain text, never as markup.
/// `attribution: false` leaves out whose account it is, for a shot that already says so.
fn caption(kb: &Kb, e: &Edge, forward: bool, attribution: bool) -> String {
    let rel = &kb.schema.relations[&e.rel];
    let role = kb.kin_role(e);
    let mut s = match role {
        Some(r) => format!("{}, *{} of* {}.", link_cap(kb, &e.from), text(r), link(kb, &e.to)),
        None => {
            let (a, b) = if forward { (&e.from, &e.to) } else { (&e.to, &e.from) };
            format!("{}.", rel.clause(&link_cap(kb, a), forward, &link(kb, b)))
        }
    };
    if let Some(d) = e.detail.as_ref().filter(|_| role.is_none()) {
        s.push_str(&format!(" {}.", text(&capitalize(d))));
    }
    if let Some(n) = &e.note {
        s.push_str(&format!("\n\n*{}*", text(n)));
    }
    if attribution && !e.according_to.is_empty() {
        let names: Vec<String> = e.according_to.iter().map(|p| link(kb, p)).collect();
        s.push_str(&format!("\n\nAccording to {}. This is one side's account, not established fact.", names.join(" and ")));
    } else if e.cross_confirmed {
        s.push_str("\n\nRecords from opposing sides both confirm this.");
    }
    if let Some(w) = status_words(e) {
        s.push_str(&format!("\n\n*{}.*", capitalize(&w)));
    }
    s
}

/// The first source quote on an edge, as a story overlay.
fn quote_overlay(kb: &Kb, e: &Edge) -> Option<Value> {
    e.sources.iter().find_map(|s| source_overlay(kb, s))
}

/// One source's quote as a story overlay, captioned with the source's title and date.
fn source_overlay(kb: &Kb, s: &EdgeSrc) -> Option<Value> {
    let q = s.quote.as_ref()?;
    let src = kb.sources.get(&s.id)?;
    let caption = match &src.published_label {
        Some(p) => format!("{}, {p}", src.title),
        None => src.title.clone(),
    };
    Some(json!({ "kind": "quote", "source": s.id, "quote": q, "caption": caption }))
}

/// The end of a link that is a place on the map, with its coords.
fn place_of<'k>(kb: &'k Kb, e: &Edge) -> Option<(&'k str, [f64; 2])> {
    [&e.to, &e.from].into_iter().find_map(|id| {
        let x = kb.entity(id).filter(|x| kb.schema.on_map(&x.kind))?;
        Some((x.id.as_str(), x.coords?))
    })
}

fn time_fields(shot: &mut serde_json::Map<String, Value>, e: &Edge) {
    if let Some(w) = &e.when {
        shot.insert("t".into(), Value::from(w.start));
        shot.insert("time_label".into(), Value::from(w.label.clone()));
    }
}

fn year_of(e: &Edge) -> i64 {
    e.when.as_ref().map_or(0, |w| w.start.floor() as i64)
}

/// One dated link as its own scene, on the map when it happened at a place.
fn link_shot(kb: &Kb, id: &str, e: &Edge, revealed: &mut Vec<String>) -> Value {
    let mut shot = serde_json::Map::new();
    shot.insert("shot".into(), json!(e.id.replace(['#', '/'], "-")));
    for n in [&e.from, &e.to] {
        add(revealed, n);
    }
    shot.insert("focus".into(), json!(id));
    shot.insert("reveal".into(), json!([e.from, e.to]));
    shot.insert("reveal_claims".into(), json!([e.id]));
    match place_of(kb, e) {
        Some((p, c)) => {
            shot.insert("view".into(), json!("map"));
            shot.insert("places".into(), json!([p]));
            shot.insert("camera".into(), json!({ "center": c, "zoom": 4.2, "duration": 3 }));
        }
        None => {
            shot.insert("view".into(), json!("graph"));
        }
    }
    if let Some(p) = e.according_to.first() {
        shot.insert("perspective".into(), json!(p));
    }
    time_fields(&mut shot, e);
    if let Some(o) = quote_overlay(kb, e) {
        shot.insert("overlay".into(), o);
    }
    shot.insert("narration".into(), json!(format!("{}{}", caption(kb, e, true, true), caveats(kb, &[e]))));
    shot.insert("duration".into(), json!(7));
    Value::Object(shot)
}

/// The caveats of the relations a scene's links use, each once, as a closing paragraph ("A charge
/// is an accusation, not a finding of guilt."): ADR-0018.
fn caveats(kb: &Kb, links: &[&Edge]) -> String {
    let mut said: Vec<&str> = Vec::new();
    for e in links {
        if let Some(c) = kb.schema.relations[&e.rel].caveat.as_deref()
            && !said.contains(&c)
        {
            said.push(c);
        }
    }
    said.iter().map(|c| format!("\n\n{c}")).collect()
}

/// The case a legal step belongs to (ADR-0018), if it names one.
fn case_of<'e>(kb: &Kb, e: &'e Edge) -> Option<&'e str> {
    kb.schema.relations[&e.rel].legal.then(|| e.qualifiers.get("case").and_then(Value::as_str)).flatten()
}

/// One link as a story tells it: its date (label, and start for ordering), what it says alone, and
/// whether it may share a sentence with links of its kind (nothing of its own to add).
struct Said<'a> {
    start: f64,
    date: String,
    edge: &'a Edge,
    alone: String,
    plain: bool,
}

impl<'a> Said<'a> {
    /// A link told by its caption; it may share a sentence when it has no detail, note, account,
    /// confirmation or status to tell.
    fn link(kb: &Kb, e: &'a Edge) -> Self {
        let plain = e.detail.is_none() && e.note.is_none() && e.according_to.is_empty() && !e.cross_confirmed && status_words(e).is_none();
        let (mut start, date) = e.when.as_ref().map_or((f64::INFINITY, String::new()), |w| (w.start, w.label.clone()));
        // a stake known only "as of" a date (its caption says so) still takes its place in time
        if e.when.is_none()
            && let Some(Ok(w)) = e.qualifiers.get("as_of").and_then(Value::as_str).map(crate::edtf::parse)
        {
            start = w.start;
        }
        Said { start, date, edge: e, alone: caption(kb, e, true, true), plain }
    }
}

/// `links` about `x` as sentences, in time order: (date, sentence, the links it tells). Links of one
/// kind, direction and date that are `plain` share a sentence: "Google, *founded by* Larry Page and
/// Sergey Brin"; the shorter date ("Sep 1998") comes before a tenure that starts with it.
fn sentences<'a>(kb: &Kb, x: &str, mut links: Vec<Said<'a>>) -> Vec<(String, String, Vec<&'a Edge>)> {
    let order = |l: &Said| kb.schema.relations.get_index_of(&l.edge.rel).unwrap_or(usize::MAX);
    links.sort_by(|a, b| a.start.total_cmp(&b.start).then_with(|| a.date.cmp(&b.date)));
    let mut out = Vec::new();
    for day in links.chunk_by_mut(|a, b| a.date == b.date) {
        day.sort_by_key(|l| order(l)); // founders first, then officers, board, money (schema order)
        for kind in day.chunk_by(|a, b| a.edge.rel == b.edge.rel && (a.edge.from == x) == (b.edge.from == x)) {
            let (together, alone): (Vec<&Said>, Vec<&Said>) = kind.iter().partition(|l| l.plain);
            if together.len() > 1 {
                let outgoing = together[0].edge.from == x;
                let mut named = HashSet::new();
                let others = together.iter().map(|l| l.edge.other(outgoing)).filter(|o| named.insert(*o));
                let names: Vec<String> = others.map(|o| link(kb, o)).collect();
                let rel = &kb.schema.relations[&together[0].edge.rel];
                let sentence = format!("{}.", rel.clause(&link_cap(kb, x), outgoing, &and_list(&names)));
                out.push((together[0].date.clone(), sentence, together.iter().map(|l| l.edge).collect()));
            } else {
                out.extend(together.iter().map(|l| (l.date.clone(), l.alone.clone(), vec![l.edge])));
            }
            out.extend(alone.iter().map(|l| (l.date.clone(), l.alone.clone(), vec![l.edge])));
        }
    }
    out
}

/// Sentences as paragraphs, one per date, each led by its date unless `label` (the scene's) says it.
fn paragraphs(items: &[(String, String, Vec<&Edge>)], label: &str) -> String {
    let mut out: Vec<String> = Vec::new();
    for day in items.chunk_by(|a, b| a.0 == b.0) {
        let lead = match day[0].0.strip_suffix(" –") {
            _ if day[0].0.is_empty() || day[0].0 == label => String::new(),
            Some(from) => format!("*Since {}:* ", text(from)), // "1988 –" reads "Since 1988"
            None => format!("*{}:* ", text(&day[0].0)),
        };
        // a sentence with paragraphs of its own (a note, an account) keeps them
        let sep = if day.iter().any(|(_, s, _)| s.contains("\n\n")) { "\n\n" } else { " " };
        out.push(format!("{lead}{}", day.iter().map(|(_, s, _)| s.as_str()).collect::<Vec<_>>().join(sep)));
    }
    out.join("\n\n")
}

/// A year with several dated links, as scenes of at most `YEAR_LINES` sentences (see `sentences`).
fn year_shots(kb: &Kb, id: &str, links: &[&Edge], revealed: &mut Vec<String>) -> Vec<Value> {
    let items = sentences(kb, id, links.iter().map(|e| Said::link(kb, e)).collect());
    let year = year_label(year_of(links[0]));
    let mut shots = Vec::new();
    for (n, part) in items.chunks(YEAR_LINES).enumerate() {
        let edges: Vec<&Edge> = part.iter().flat_map(|(_, _, es)| es.iter().copied()).collect();
        let label = if part.iter().all(|(d, _, _)| *d == part[0].0) { part[0].0.clone() } else { year.clone() };
        let mut reveal: Vec<String> = vec![id.to_string()];
        for x in edges.iter().flat_map(|e| [&e.from, &e.to]) {
            add(&mut reveal, x);
            add(revealed, x);
        }
        let name = format!("year-{}{}", year.to_lowercase().replace(' ', "-"), if n > 0 { format!("-{}", n + 1) } else { String::new() });
        let mut shot = json!({
            "shot": name, "view": "graph", "focus": id, "reveal": reveal,
            "reveal_claims": edges.iter().map(|e| e.id.clone()).collect::<Vec<_>>(),
            "t": edges[0].when.as_ref().map(|w| w.start), "time_label": label,
            "narration": format!("{}{}", paragraphs(part, &label), caveats(kb, &edges)), "duration": (5 + 2 * part.len()).min(16),
        });
        if let Some(o) = edges.iter().find_map(|e| quote_overlay(kb, e)) {
            shot["overlay"] = o;
        }
        shots.push(shot);
    }
    shots
}

/// The "Family" scene: each kinship link, then up to three things that relative did (their own links).
/// `role` on a kinship claim describes the claim's owner (`from`) relative to its target.
/// `mine` holds no withdrawn links.
fn family_shot(kb: &Kb, id: &str, mine: &[(&Edge, bool)], revealed: &mut Vec<String>) -> Option<Value> {
    let ties: Vec<&(&Edge, bool)> = mine.iter().filter(|(e, _)| kb.schema.relations[&e.rel].kinship).collect();
    if ties.is_empty() {
        return None;
    }
    let mut reveal: Vec<String> = vec![id.to_string()];
    let mut claims: Vec<String> = Vec::new();
    let mut lines: Vec<String> = Vec::new();
    for (e, outgoing) in ties {
        let other = e.other(*outgoing);
        let mut line = match (kb.kin_role(e), outgoing) {
            (Some(r), true) => format!("{} of {}", text(&capitalize(r)), link(kb, other)),
            (Some(r), false) => format!("{}, {}", link_cap(kb, other), text(r)),
            (None, _) => format!("{}, a relative", link_cap(kb, other)),
        };
        if let Some(w) = status_words(e) {
            line.push_str(&format!(" ({w})"));
        }
        let did = deeds(kb, other);
        let phrases: Vec<String> = did
            .iter()
            .take(3)
            .map(|x| {
                let mut p = format!("*{}* {}", kb.schema.relations[&x.rel].label, link(kb, &x.to));
                if let Some(w) = &x.when {
                    p.push_str(&format!(" ({})", w.label));
                }
                if !x.according_to.is_empty() {
                    let who: Vec<String> = x.according_to.iter().map(|a| link(kb, a)).collect();
                    p.push_str(&format!(", according to {}", who.join(" and ")));
                }
                if let Some(w) = status_words(x) {
                    p.push_str(&format!(", {w}"));
                }
                p
            })
            .collect();
        if !phrases.is_empty() {
            line.push_str(&format!(": {}", phrases.join("; ")));
        }
        lines.push(format!("{line}."));
        claims.push(e.id.clone());
        for n in std::iter::once(other).chain(did.iter().take(3).map(|x| x.to.as_str())) {
            add(&mut reveal, n);
            add(revealed, n);
        }
        claims.extend(did.iter().take(3).map(|x| x.id.clone()));
    }
    Some(json!({
        "shot": "family", "view": "graph", "focus": id, "reveal": reveal, "reveal_claims": claims,
        "narration": format!("**Family.** {}", lines.join(" ")), "duration": 8,
    }))
}

/// Adds `id` to `list` unless it is there already: reveal lists keep first-seen order.
fn add(list: &mut Vec<String>, id: &str) {
    if !list.iter().any(|x| x == id) {
        list.push(id.to_string());
    }
}

fn capitalize(s: &str) -> String {
    let mut c = s.chars();
    match c.next() {
        Some(f) => f.to_uppercase().chain(c).collect(),
        None => String::new(),
    }
}

/// The story of one entity: who/what it is, where it comes from (family), its dated connections in
/// order, its undated ones grouped.
pub fn entity_story(kb: &Kb, id: &str) -> Option<Draft> {
    let ent = kb.entity(id)?;
    // withdrawn (deprecated) links never reach a story, as they never reach a route
    let mut mine: Vec<(&Edge, bool)> = kb.links_of(id).filter(|(e, _)| e.status != "deprecated").collect();
    if mine.len() < 2 {
        return None;
    }
    mine.sort_by(|(a, _), (b, _)| a.start().total_cmp(&b.start()).then(a.id.cmp(&b.id)));
    let mut shots: Vec<Value> = Vec::new();
    let mut revealed: Vec<String> = vec![id.to_string()];

    // intro
    let mut intro = serde_json::Map::new();
    intro.insert("shot".into(), json!("intro"));
    intro.insert("focus".into(), json!(id));
    intro.insert("reveal".into(), json!([id]));
    let mut narration = format!("**{}**", text(&ent.name));
    if let Some(s) = &ent.summary {
        narration.push_str(&format!(". {}", text(s)));
    }
    // where they come from, said up front: undated links whose relation is a background one (born in,
    // citizen of), each kind as one sentence ("Citizen of the United States and Canada."), not a scene
    let opening = |e: &Edge, outgoing: bool| {
        outgoing && e.when.is_none() && kb.schema.relations[&e.rel].background && e.status == "published" && e.according_to.is_empty()
    };
    let mut kinds: Vec<(&str, Vec<String>)> = Vec::new();
    for (e, _) in mine.iter().filter(|(e, out)| opening(e, *out)) {
        match kinds.iter_mut().find(|(r, _)| *r == e.rel) {
            Some((_, names)) => names.push(link(kb, &e.to)),
            None => kinds.push((e.rel.as_str(), vec![link(kb, &e.to)])),
        }
    }
    kinds.sort_by_key(|(r, _)| kb.schema.relations.get_index_of(*r));
    if ent.summary.is_none() && !kinds.is_empty() {
        narration.push('.');
    }
    for (r, names) in &kinds {
        narration.push_str(&format!(" {} {}.", capitalize(&kb.schema.relations[*r].label), and_list(names)));
    }
    if let Some(w) = &ent.when {
        intro.insert("t".into(), json!(w.start));
        intro.insert("time_label".into(), json!(w.label));
    }
    if let Some(c) = kb.coords(ent) {
        intro.insert("view".into(), json!("map"));
        intro.insert("camera".into(), json!({ "center": c, "zoom": 3.2, "globe": true, "duration": 4 }));
        let place = if kb.schema.on_map(&ent.kind) { Some(id.to_string()) } else { ent.place.clone() };
        if let Some(p) = place {
            intro.insert("places".into(), json!([p]));
        }
    } else {
        intro.insert("view".into(), json!("graph"));
    }
    intro.insert("narration".into(), json!(narration));
    intro.insert("duration".into(), json!(6));
    shots.push(Value::Object(intro));

    // where they come from: kinship links, each with what that relative did
    let kin = |e: &Edge| kb.schema.relations[&e.rel].kinship;
    if let Some(shot) = family_shot(kb, id, &mine, &mut revealed) {
        shots.push(shot);
    }

    // dated connections, in time order: one scene per year, so a busy year (a founding, with its
    // founders, officers and board) plays as one scene, not a string of one-line ones
    let all_dated: Vec<&Edge> = mine.iter().filter(|(e, _)| e.when.is_some() && !kin(e)).map(|(e, _)| *e).collect();
    let mut dated: Vec<&Edge> = all_dated.iter().take(MAX_DATED).copied().collect();
    // a case is never cut short: a charge told is told with its later steps (ADR-0018)
    let cases: HashSet<&str> = dated.iter().filter_map(|e| case_of(kb, e)).collect();
    dated.extend(all_dated.iter().skip(MAX_DATED).filter(|e| case_of(kb, e).is_some_and(|c| cases.contains(c))));
    for year in dated.chunk_by(|a, b| year_of(a) == year_of(b)) {
        match year {
            [e] => shots.push(link_shot(kb, id, e, &mut revealed)),
            _ => shots.extend(year_shots(kb, id, year, &mut revealed)),
        }
    }

    // undated connections, grouped by relation phrase
    let mut groups: BTreeMap<(String, bool), Vec<&Edge>> = BTreeMap::new();
    for (e, outgoing) in mine.iter().filter(|(e, out)| e.when.is_none() && !kin(e) && !opening(e, *out)) {
        groups.entry((e.rel.clone(), *outgoing)).or_default().push(e);
    }
    let mut groups: Vec<((String, bool), Vec<&Edge>)> = groups.into_iter().collect();
    groups.sort_by_key(|(_, v)| std::cmp::Reverse(v.len()));
    for ((rel_id, outgoing), list) in groups.into_iter().take(MAX_GROUPS) {
        let rel = &kb.schema.relations[&rel_id];
        let others: Vec<&str> = list.iter().map(|e| e.other(outgoing)).collect();
        for o in &others {
            add(&mut revealed, o);
        }
        // one name per entry, though several accounts may each link it
        let mut named = HashSet::new();
        let names: Vec<String> = others.iter().filter(|o| named.insert(**o)).map(|o| link(kb, o)).collect();
        let mut narration = format!("{}.", rel.clause(&link_cap(kb, id), outgoing, &and_list(&names)));
        // each voice once, in the order it first speaks
        let mut seen = HashSet::new();
        let voices: Vec<String> = list.iter().flat_map(|e| &e.according_to).filter(|p| seen.insert(*p)).map(|p| link(kb, p)).collect();
        match voices.len() {
            0 => {}
            1 => narration.push_str(&format!("\n\nAccording to {}.", voices[0])),
            _ => narration.push_str(&format!("\n\nAccording to {}, each in its own account.", and_list(&voices))),
        }
        for (e, other) in list.iter().zip(&others) {
            if let Some(w) = status_words(e) {
                narration.push_str(&format!("\n\nThe link to {} is {w}.", link(kb, other)));
            }
        }
        let mut reveal: Vec<String> = vec![id.to_string()];
        reveal.extend(others.iter().map(|o| o.to_string()));
        shots.push(json!({
            "shot": format!("{rel_id}-{}", if outgoing { "out" } else { "in" }),
            "view": "graph", "focus": id, "reveal": reveal,
            "reveal_claims": list.iter().map(|e| e.id.clone()).collect::<Vec<_>>(),
            "narration": narration, "duration": 7,
        }));
    }

    // closing
    let total = mine.len();
    shots.push(json!({
        "shot": "explore", "view": "graph", "focus": id, "reveal": revealed, "explore": true,
        "narration": format!("{}, each with its evidence. Open the explorer to follow any of them further, filter by lens, or move through time.", plural(total, "sourced connection")),
        "duration": 6,
    }));

    Some(Draft {
        id: id.to_string(),
        title: format!("The story of {}", ent.name),
        subtitle: ent.summary.clone(),
        summary: ent.summary.clone(),
        intro_md: String::new(),
        outro_md: format!("Drawn from the sourced links on {}. Change a link and this story changes with it.", link(kb, id)),
        shots,
        explore_url: format!("/x/?focus={id}"),
    })
}

/// The story of one route between two entities, hop by hop.
/// `note`: an editorial note from content/featured.yaml, stated in the opening scene.
pub fn path_story(kb: &Kb, from: &str, to: &str, note: Option<&str>) -> Option<Draft> {
    let mut found = paths::find(kb, from, to, &paths::Options::stories(kb, 2)).into_iter();
    let p = found.next().filter(|p| !p.hops.is_empty())?;
    // the runner-up route, named in the closing scene: there is rarely only one thread
    let alt = found.next().filter(|a| (3..=7).contains(&a.nodes.len()) && a.nodes != p.nodes);
    kb.entity(from)?;
    kb.entity(to)?;
    let steps = plural(p.hops.len(), "sourced connection");
    // the sentence and scope come from the route question in questions.yaml, when there is one
    let route_q = kb.schema.questions.iter().find(|q| q.route);
    let ask = |a: String, b: String| route_q.map_or("How are {a} and {b} connected?", |q| q.ask.as_str()).replace("{a}", &a).replace("{b}", &b);
    let mut opening = format!("{} Here is one route, through {steps}.", ask(link(kb, from), link(kb, to)));
    if let Some(n) = note {
        opening.push_str(&format!("\n\n*{}*", text(n)));
    }
    let mut shots: Vec<Value> = vec![json!({
        "shot": "question", "view": "graph", "focus": from, "reveal": [from, to],
        "narration": opening,
        "duration": 5,
    })];
    let mut revealed: Vec<String> = vec![from.to_string(), to.to_string()];
    for (i, h) in p.hops.iter().enumerate() {
        let next = &p.nodes[i + 1];
        add(&mut revealed, next);
        let mut shot = serde_json::Map::new();
        shot.insert("shot".into(), json!(format!("hop-{}", i + 1)));
        shot.insert("view".into(), json!("graph"));
        shot.insert("focus".into(), json!(next));
        shot.insert("reveal".into(), json!(revealed.clone()));
        shot.insert("reveal_claims".into(), json!([h.edge.id]));
        if let Some(pp) = h.edge.according_to.first() {
            shot.insert("perspective".into(), json!(pp));
        }
        time_fields(&mut shot, h.edge);
        if let Some(o) = quote_overlay(kb, h.edge) {
            shot.insert("overlay".into(), o);
        }
        let mut narration = format!("Step {} of {}.\n\n", i + 1, p.hops.len());
        // every hop reads in its own direction ("Peter Thiel board member of Meta"); the step order
        // carries the route, so inverse labels ("board members") never have to work as verbs
        narration.push_str(&caption(kb, h.edge, true, true));
        shot.insert("narration".into(), json!(narration));
        shot.insert("duration".into(), json!(7));
        shots.push(Value::Object(shot));
    }
    let mut closing = format!("That is one route from {} to {}.", link(kb, from), link(kb, to));
    if let Some(a) = &alt {
        let via: Vec<String> = a.nodes[1..a.nodes.len() - 1].iter().map(|n| link(kb, n)).collect();
        let mut whose: Vec<String> = Vec::new();
        for p in a.hops.iter().flat_map(|h| &h.edge.according_to) {
            add(&mut whose, &link(kb, p));
        }
        let partly = if whose.is_empty() { String::new() } else { format!(", in part according to {}", and_list(&whose)) };
        closing.push_str(&format!(" Another runs through {}{partly}.", and_list(&via)));
    }
    closing.push_str(&format!(" The explorer shows every route and lets you filter by lens, time and perspective.\n\n*{NOTICE}*"));
    shots.push(json!({
        "shot": "explore", "view": "graph", "focus": to, "reveal": revealed, "explore": true,
        "narration": closing,
        "duration": 6,
    }));
    Some(Draft {
        id: format!("{from}--{to}"),
        title: ask(kb.sentence_name(from), kb.sentence_name(to)),
        subtitle: Some(format!("One route through {steps}")),
        summary: None,
        intro_md: route_q.map(|q| text(&answers::scope(q).join(" "))).unwrap_or_default(),
        outro_md: "Every step cites its sources. Routes are ranked by the public methodology in `content/methodology/paths.yaml`.".into(),
        shots,
        explore_url: format!("/x/?from={from}&to={to}"),
    })
}

/// One line of an answer, as a story tells it: its caption, after the earlier form it speaks for.
/// `in_account`: the shot already says whose account it is.
fn told(kb: &Kb, l: &Line, in_account: bool) -> String {
    let as_form = l.form.map(|f| match &f.when {
        Some(w) => format!("*As {}, until {}:* ", text(&kb.sentence_name(&f.from)), w.label),
        None => format!("*As {}:* ", text(&kb.sentence_name(&f.from))),
    });
    format!("{}{}", as_form.unwrap_or_default(), caption(kb, l.edge, true, !in_account))
}

/// What `lines` say, one paragraph per date (see `sentences`). A line about an earlier form keeps its
/// own sentence, and an account's lines never join others, so their attribution stays theirs.
fn told_all(kb: &Kb, x: &str, lines: &[&Line], in_account: bool) -> String {
    let said: Vec<Said> = lines
        .iter()
        .map(|l| {
            let mut s = Said::link(kb, l.edge);
            s.alone = told(kb, l, in_account);
            s.plain &= l.form.is_none() && !in_account;
            if let Some(w) = l.date() {
                (s.start, s.date) = (w.start, w.label.clone());
            }
            s
        })
        .collect();
    paragraphs(&sentences(kb, x, said), "")
}

/// A graph shot that draws `lines` around `x`, dated by its first line, quoting the first line
/// that has words of its own (`account`: whose account the shot tells).
fn lines_shot(kb: &Kb, name: &str, x: &str, lines: &[&Line], account: Option<&str>, narration: String, seconds: u64) -> Value {
    let mut reveal: Vec<String> = vec![x.to_string()];
    let mut claims: Vec<&str> = Vec::new();
    for l in lines {
        for n in [l.form.map(|f| f.from.as_str()), l.about.map(|(id, _)| id), Some(l.other)].into_iter().flatten() {
            add(&mut reveal, n);
        }
        claims.extend(l.form.into_iter().chain(l.about.map(|(_, step)| step)).map(|e| e.id.as_str()).chain([l.edge.id.as_str()]));
    }
    let mut shot = json!({ "shot": name, "view": "graph", "focus": x, "reveal": reveal, "reveal_claims": claims, "narration": narration, "duration": seconds });
    if let Some(w) = lines.first().and_then(|l| l.date()) {
        shot["t"] = json!(w.start);
        shot["time_label"] = json!(w.label);
    }
    if let Some(o) = lines.iter().find_map(|l| answers::own_words(kb, l.edge, account).and_then(|s| source_overlay(kb, s))) {
        shot["overlay"] = o;
    }
    shot
}

/// The story of one answer: the question, the record group by group, every account for the same
/// time (A–Z), the names several accounts give, what is disputed, then the scope and the notice.
/// Drafts are never told. `next`: (title, url) of other answers to ask next.
pub fn answer_story(kb: &Kb, a: &Answer, next: &[(String, String)]) -> Option<Draft> {
    if a.links < 2 && a.accounts_total() < 2 {
        return None;
    }
    let q = &kb.schema.questions[a.q];
    let x = a.x.id.as_str();
    let title = answers::title(kb, q, x);
    let [shows, not] = answers::scope(q);
    let mut open = json!({ "shot": "question", "view": "graph", "focus": x, "reveal": [x],
                           "narration": format!("**{}**\n\n{} {}", text(&title), text(&shows), text(&not)), "duration": 6 });
    if let Some(c) = kb.coords(a.x) {
        open["view"] = json!("map");
        open["camera"] = json!({ "center": c, "zoom": 3.2, "globe": true, "duration": 4 });
        if let Some(p) = if kb.schema.on_map(&a.x.kind) { Some(x) } else { a.x.place.as_deref() } {
            open["places"] = json!([p]);
        }
    }
    if let Some(w) = &a.x.when {
        open["t"] = json!(w.start);
        open["time_label"] = json!(w.label);
    }
    let mut shots: Vec<Value> = vec![open];

    let mut tail: Vec<Value> = Vec::new();
    if let Some(&(g, name, n)) = a.shared.first() {
        let group = if q.groups.len() > 1 { format!(" ({})", text(&q.groups[g].label)) } else { String::new() };
        let narration = format!("Named in {n} of the {} accounts recorded here{group}: {}.", a.accounts_total(), link(kb, name));
        tail.push(json!({ "shot": "shared", "view": "graph", "focus": x, "reveal": [x, name], "narration": narration, "duration": 6 }));
    }
    if !a.disputed.lines.is_empty() {
        let lines: Vec<&Line> = a.disputed.lines.iter().collect();
        let mut shot = lines_shot(kb, "disputed", x, &lines, None, format!("**Disputed.** {}", told_all(kb, x, &lines, false)), 4 + 3 * lines.len() as u64);
        // disputed words are never shown as a quote card
        if let Some(m) = shot.as_object_mut() {
            m.remove("overlay");
        }
        tail.push(shot);
    }

    // the record, group by group; with more groups than room, a shot tells several, so the story
    // keeps to MAX_SHOTS with at least one shot for the accounts
    let groups: Vec<(usize, &Part)> = a.records.iter().enumerate().filter(|(_, p)| !p.lines.is_empty()).collect();
    let reserve = shots.len() + tail.len() + 1 + usize::from(!a.accounts.is_empty());
    let per = groups.len().div_ceil(MAX_SHOTS.saturating_sub(reserve).max(1)).max(1);
    for chunk in groups.chunks(per) {
        let lines: Vec<&Line> = chunk.iter().flat_map(|(_, p)| &p.lines).collect();
        let said: Vec<String> = chunk.iter().map(|(gi, p)| format!("**{}.** {}", text(&q.groups[*gi].label), told_all(kb, x, &p.lines.iter().collect::<Vec<_>>(), false))).collect();
        shots.push(lines_shot(kb, &format!("record-{}", chunk[0].0), x, &lines, None, said.join("\n\n"), 4 + 3 * lines.len() as u64));
    }

    // every account gets the same time: with more accounts than shots left, a shot tells several
    // and lasts that many times longer
    let room = MAX_SHOTS.saturating_sub(shots.len() + tail.len() + 1).max(1);
    for (i, chunk) in a.accounts.chunks(a.accounts.len().div_ceil(room).max(1)).enumerate() {
        let lines: Vec<&Line> = chunk.iter().flat_map(|(_, p)| &p.lines).collect();
        let said: Vec<String> = chunk
            .iter()
            .map(|(who, p)| format!("**According to {}.** {}", link(kb, who), told_all(kb, x, &p.lines.iter().collect::<Vec<_>>(), true)))
            .collect();
        let one = if let [(who, _)] = chunk { Some(*who) } else { None };
        let mut shot = lines_shot(kb, &format!("account-{}", i + 1), x, &lines, one, said.join("\n\n"), ACCOUNT_SECONDS * chunk.len() as u64);
        if let Some(who) = one {
            shot["perspective"] = json!(who);
        } else if let Some(o) = chunk.iter().find_map(|(who, p)| p.lines.iter().find_map(|l| answers::own_words(kb, l.edge, Some(who)))) {
            // several accounts in one shot: quote one of them in its own words, or none
            shot["overlay"] = source_overlay(kb, o).unwrap_or(Value::Null);
        } else if let Some(m) = shot.as_object_mut() {
            m.remove("overlay");
        }
        shots.push(shot);
    }
    shots.extend(tail);

    let mut close = format!("{} {}\n\n*{NOTICE}*", text(&shows), text(&not));
    if !next.is_empty() {
        let asks: Vec<String> = next.iter().map(|(t, url)| format!("[{}]({url})", text(t))).collect();
        close.push_str(&format!("\n\nAsk next: {}", asks.join(" · ")));
    }
    let mut seen: Vec<String> = vec![x.to_string()];
    for l in a.published().chain(&a.disputed.lines) {
        for n in [l.form.map(|f| f.from.as_str()), l.about.map(|(id, _)| id), Some(l.other)].into_iter().flatten() {
            add(&mut seen, n);
        }
    }
    shots.push(json!({ "shot": "close", "view": "graph", "focus": x, "reveal": seen, "explore": true, "narration": close, "duration": 6 }));

    let id = a.id(kb);
    Some(Draft {
        id: id.clone(),
        title: title.clone(),
        subtitle: Some(format!("{shows} {not}")),
        summary: Some(format!("{shows} {not} {NOTICE}")),
        intro_md: format!("*{NOTICE}*"),
        outro_md: format!("Drawn from the sourced links on [its answer page](/q/{id}/). Change a link and this story changes with it."),
        shots,
        explore_url: format!("/x/?focus={x}"),
    })
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::testkit::{File, entity, file, load, source};

    /// Ann, mother of Bob, founded five companies: one link disputed, one withdrawn, two
    /// attributed to the same voice.
    pub(crate) fn family() -> Vec<File> {
        vec![
            file(
                "content/entities/person/an/ann.md",
                "---\nid: ann\ntype: person\nname: Ann\nwhen: 1950/2020\nclaims:\n\
                   - {id: c1, rel: relative_of, to: bob, role: mother, src: [{s: rec}]}\n\
                   - {id: c2, rel: founded, to: acme, according_to: [vox], status: disputed, reason: Records disagree., src: [{s: rec}]}\n\
                   - {id: c3, rel: founded, to: beta, according_to: [lex], src: [{s: rec}]}\n\
                   - {id: c4, rel: founded, to: gamma, according_to: [vox], src: [{s: rec}]}\n\
                   - {id: c5, rel: founded, to: delta, when: 2005, status: deprecated, reason: Withdrawn., src: [{s: rec}]}\n\
                   - {id: c6, rel: founded, to: epsilon, when: 2001, status: disputed, reason: Two accounts differ., src: [{s: rec}]}\n---\n",
            ),
            entity("person", "bob", "Bob", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n"),
            entity("org", "acme", "Acme", ""),
            entity("org", "beta", "Beta", ""),
            entity("org", "gamma", "Gamma", ""),
            entity("org", "delta", "Delta", ""),
            entity("org", "epsilon", "Epsilon", ""),
            entity("org", "vox", "Vox", ""),
            entity("org", "lex", "Lex", ""),
            source("rec", "T1"),
        ]
    }

    fn narration(d: &Draft) -> Vec<String> {
        d.shots.iter().map(|s| s["narration"].as_str().unwrap_or("").to_string()).collect()
    }

    #[test]
    fn life_stories_skip_withdrawn_links_and_say_what_is_disputed() {
        let (kb, _) = load("stories-life", &family());
        let all = narration(&entity_story(&kb, "ann").unwrap()).join("\n");
        assert!(!all.contains("Delta"), "a withdrawn link is never told: {all}");
        assert!(all.contains("*Disputed: Two accounts differ.*"), "{all}");
        assert!(all.contains("The link to [[acme|Acme]] is disputed: Records disagree."), "{all}");
        assert!(all.contains("According to [[vox|Vox]] and [[lex|Lex]], each in its own account."), "each voice once: {all}");
        assert!(all.contains("**Family.** Mother of [[bob|Bob]]: *founded* [[acme|Acme]]."), "{all}");
        assert!(all.contains("5 sourced connections"), "{all}");

        let bob = narration(&entity_story(&kb, "bob").unwrap()).join("\n");
        assert!(bob.contains("[[ann|Ann]], mother: *founded* [[epsilon|Epsilon]] (2001), disputed: Two accounts differ;"), "{bob}");
        assert!(!bob.contains("Delta"), "{bob}");
    }

    #[test]
    fn answer_stories_give_each_account_equal_time_and_never_tell_drafts() {
        let (kb, _) = load("stories-answer", &crate::answers::tests::world());
        let why = crate::answers::answer(&kb, 2, "fall").unwrap();
        let d = answer_story(&kb, &why, &[("Who benefited from Fall?".into(), "/q/benefited/fall/".into())]).unwrap();
        let names: Vec<&str> = d.shots.iter().map(|s| s["shot"].as_str().unwrap()).collect();
        assert_eq!(names, ["question", "record-0", "account-1", "account-2", "account-3", "shared", "disputed", "close"]);
        let accounts: Vec<&Value> = d.shots.iter().filter(|s| s["shot"].as_str().unwrap().starts_with("account-")).collect();
        assert!(accounts.iter().all(|s| s["duration"] == ACCOUNT_SECONDS), "every account gets the same time");
        assert_eq!(accounts[0]["perspective"], "lex");
        // each account in its own words: Lex said "Oil did it."; nobody's quote stands in for Vox
        assert_eq!(accounts[0]["overlay"]["quote"], "Oil did it.");
        assert!(accounts[2].get("overlay").is_none(), "{}", accounts[2]);
        // a shot that opens "According to Lex." does not say it again, nor call it "one side's"
        assert!(accounts.iter().all(|s| !s["narration"].as_str().unwrap().contains("one side's account")));
        let disputed = d.shots.iter().find(|s| s["shot"] == "disputed").unwrap();
        assert!(disputed.get("overlay").is_none(), "disputed words never show as a quote card");
        assert!(d.summary.as_deref().unwrap().ends_with(NOTICE), "link previews keep the notice");
        let all = narration(&d).join("\n");
        assert!(!all.contains("War"), "a draft is never told: {all}");
        assert!(all.contains("Named in 3 of the 3 accounts recorded here: [[coup|Coup]]."), "{all}");
        assert!(all.contains("*Disputed: No record shows it.*"), "{all}");
        assert!(all.contains("[Who benefited from Fall?](/q/benefited/fall/)"), "{all}");
        assert!(all.ends_with("*A connection is not evidence of wrongdoing.*\n\nAsk next: [Who benefited from Fall?](/q/benefited/fall/)"), "{all}");
        // only labels and template words: nothing that insinuates, and no "therefore"
        for story in [d, answer_story(&kb, &crate::answers::answer(&kb, 1, "party").unwrap(), &[]).unwrap()] {
            let words: Vec<String> = crate::schema::words(&narration(&story).join(" ")).collect();
            for bad in kb.schema.banned_words.iter().map(String::as_str).chain(["therefore"]) {
                assert!(!words.iter().any(|w| w == bad), "`{bad}` in {}", story.id);
            }
        }
    }

    #[test]
    fn an_earlier_form_is_told_as_itself() {
        let (kb, _) = load("stories-forms", &crate::answers::tests::world());
        let party = crate::answers::answer(&kb, 1, "party").unwrap();
        let d = answer_story(&kb, &party, &[]).unwrap();
        assert_eq!(d.title, "Who is behind Party?");
        let all = narration(&d).join("\n");
        assert!(all.contains("**Founded by.** *1903:* *As the Reds, until Mar 1918:* [[ann|Ann]] *founded* [[reds|the Reds]]."), "{all}");
        let record = d.shots.iter().find(|s| s["shot"] == "record-0").unwrap();
        assert_eq!(record["reveal_claims"], json!(["reds#c1", "ann#c1", "bob#c1"]));
    }

    #[test]
    fn a_life_story_never_tells_a_charge_without_its_later_steps() {
        let relations = file(
            "content/schema/relations.yaml",
            "founded: {label: founded, inverse: founded by, from: [person], to: [org], layers: [power], temporal: true}\n\
             charged_by: {label: charged by, inverse: charged, from: [person], to: [org], layers: [power], temporal: true, qualifiers: [title, case], \
             sensitive: true, traversable: false, legal: true, noun: true, caveat: \"A charge is an accusation, not a finding of guilt.\"}\n\
             settled_with: {label: settled with, inverse: settled with, from: [person], to: [org], layers: [power], temporal: true, \
             qualifiers: [title, case, amount, currency], sensitive: true, traversable: false, legal: true}\n",
        );
        // twelve foundings, then a charge, then (past the twelve dated links a story tells) its settlement
        let mut claims: String = (0..11).map(|i| format!("  - {{id: c{i}, rel: founded, to: corp, when: {}, src: [{{s: rec}}]}}\n", 1990 + i)).collect();
        claims.push_str("  - {id: c20, rel: charged_by, to: agency, when: 2018-09-27, case: A v. Ann, src: [{s: rec}]}\n");
        claims.push_str("  - {id: c21, rel: founded, to: corp, when: 2018-09-28, src: [{s: rec}]}\n");
        claims.push_str("  - {id: c22, rel: settled_with, to: agency, when: 2018-09-29, case: A v. Ann, src: [{s: rec}]}\n");
        let (kb, _) = load(
            "stories-legal",
            &[relations, entity("org", "corp", "Corp", ""), entity("org", "agency", "Agency", ""), entity("person", "ann", "Ann", &claims), source("rec", "T1")],
        );
        let d = entity_story(&kb, "ann").unwrap();
        let told: Vec<&str> = d.shots.iter().flat_map(|s| s["reveal_claims"].as_array().into_iter().flatten()).filter_map(|c| c.as_str()).collect();
        assert!(told.contains(&"ann#c20") && told.contains(&"ann#c22"), "the charge and its settlement: {told:?}");
        assert!(!told.contains(&"ann#c21"), "other links past the cap stay out");
        let scene = d.shots.iter().find(|s| s["reveal_claims"].as_array().is_some_and(|c| c.iter().any(|x| x == "ann#c20"))).unwrap();
        assert!(scene["narration"].as_str().unwrap().ends_with("\n\nA charge is an accusation, not a finding of guilt."), "{}", scene["narration"]);
    }

    #[test]
    fn a_busy_year_is_one_scene_and_like_links_share_a_sentence() {
        let relations = file(
            "content/schema/relations.yaml",
            "founded: {label: founded, inverse: founded by, from: [person], to: [org], layers: [power], temporal: true}\n\
             ceo_of: {label: CEO of, inverse: CEO, from: [person], to: [org], layers: [power], temporal: true, noun: true}\n\
             board_member_of: {label: board member of, inverse: board members, from: [person], to: [org], layers: [power], temporal: true, noun: true, inverse_reads: list}\n\
             invested_in: {label: invested in, inverse: investors, from: [person], to: [org], layers: [power], temporal: true, qualifiers: [amount], inverse_reads: list}\n",
        );
        let (kb, _) = load(
            "stories-year",
            &[
                relations,
                entity("org", "corp", "Corp", ""),
                entity("person", "alice", "Alice", "  - {id: c1, rel: founded, to: corp, when: 2001-09, src: [{s: rec}]}\n  - {id: c2, rel: board_member_of, to: corp, when: 2001-09, src: [{s: rec}]}\n  - {id: c3, rel: ceo_of, to: corp, when: 2001-09/2004-07, src: [{s: rec}]}\n"),
                entity("person", "bob", "Bob", "  - {id: c1, rel: founded, to: corp, when: 2001-09, src: [{s: rec}]}\n  - {id: c2, rel: board_member_of, to: corp, when: 2001-09, src: [{s: rec}]}\n"),
                entity("person", "erin", "Erin", "  - {id: c1, rel: invested_in, to: corp, when: 2001-08, src: [{s: rec}]}\n  - {id: c2, rel: board_member_of, to: corp, when: 2002-05, src: [{s: rec}]}\n"),
                source("rec", "T1"),
            ],
        );
        let d = entity_story(&kb, "corp").unwrap();
        let names: Vec<&str> = d.shots.iter().map(|s| s["shot"].as_str().unwrap()).collect();
        assert_eq!(names, ["intro", "year-2001", "erin-c2", "explore"], "2001 is one scene, 2002's lone link its own");
        let year = &d.shots[1];
        assert_eq!(year["time_label"], "2001");
        assert_eq!(year["reveal_claims"].as_array().unwrap().len(), 6);
        assert_eq!(
            year["narration"],
            "*Aug 2001:* [[erin|Erin]] *invested in* [[corp|Corp]].\n\n\
             *Sep 2001:* [[corp|Corp]], *founded by* [[alice|Alice]] and [[bob|Bob]]. [[corp|Corp]], *board members*: [[alice|Alice]] and [[bob|Bob]].\n\n\
             *Sep 2001 – Jul 2004:* [[alice|Alice]], *CEO of* [[corp|Corp]]."
        );
    }

    #[test]
    fn birthplace_and_citizenship_open_a_life_story() {
        let (kb, _) = load(
            "stories-opening",
            &[
                file(
                    "content/schema/entity-types.yaml",
                    "person: {label: Person, plural: People, layer: people, family: true}\norg: {label: Organization, plural: Organizations, layer: power}\nplace: {label: Place, plural: Places, layer: people}\n",
                ),
                file(
                    "content/schema/relations.yaml",
                    "founded: {label: founded, inverse: founded by, from: [person], to: [org], layers: [power], temporal: true}\n\
                     born_in: {label: born in, inverse: birthplace of, from: [person], to: [place], layers: [people], noun: true, background: true}\n\
                     citizen_of: {label: citizen of, inverse: citizens, from: [person], to: [place], layers: [people], temporal: true, traversable: false, noun: true, background: true}\n",
                ),
                entity("person", "zed", "Zed", "  - {id: c1, rel: founded, to: corp, when: 2001, src: [{s: rec}]}\n  - {id: c2, rel: born_in, to: town, src: [{s: rec}]}\n  - {id: c3, rel: citizen_of, to: land, src: [{s: rec}]}\n  - {id: c4, rel: citizen_of, to: isle, src: [{s: rec}]}\n  - {id: c5, rel: founded, to: firm, when: 2003, src: [{s: rec}]}\n"),
                entity("org", "corp", "Corp", ""),
                entity("org", "firm", "Firm", ""),
                entity("place", "town", "Town", ""),
                entity("place", "land", "Land", ""),
                entity("place", "isle", "Isle", ""),
                source("rec", "T1"),
            ],
        );
        let d = entity_story(&kb, "zed").unwrap();
        let names: Vec<&str> = d.shots.iter().map(|s| s["shot"].as_str().unwrap()).collect();
        assert_eq!(names, ["intro", "zed-c1", "zed-c5", "explore"], "no one-line scenes for where they come from");
        assert_eq!(d.shots[0]["narration"], "**Zed**. Born in [[town|Town]]. Citizen of [[land|Land]] and [[isle|Isle]].");
    }

    #[test]
    fn route_stories_need_two_ends_and_count_in_words() {
        let (kb, _) = load("stories-route", &family());
        assert!(path_story(&kb, "ann", "ann", None).is_none());
        let d = path_story(&kb, "ann", "bob", None).unwrap();
        assert_eq!(d.subtitle.as_deref(), Some("One route through 1 sourced connection"));
        assert!(narration(&d)[0].contains("through 1 sourced connection."));
    }
}
