//! Assembles raw files into the knowledge base and validates them (`ctd check` rules).

use std::{
    collections::{BTreeMap, BTreeSet, HashMap, HashSet},
    sync::LazyLock,
};

use indexmap::IndexMap;
use regex::Regex;
use serde::Serialize;
use serde_json::Value;

use crate::{
    diag::Diag,
    edtf::{self, Span},
    load::{ChapterDoc, EntityDoc, Featured, Pick, Raw, SourceDoc},
    markdown,
    model::ClaimIn,
    schema::{Schema, parse_yaml},
};

pub(crate) static SLUG: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^[a-z0-9]+(?:-[a-z0-9]+)*$").unwrap());
static EMAIL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+\.[A-Za-z]{2,}").unwrap());
static PHONE: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?:\+\d{1,3}[\s.-]?)?\(?\b\d{3}\)?[\s.-]\d{3}[\s.-]\d{4}\b").unwrap());
/// A web address: pages link to source documents and images only over http(s).
static WEB_URL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"(?i)^https?://[^\s/?#]+\S*$").unwrap());

pub const STATUSES: [&str; 4] = ["published", "draft", "disputed", "deprecated"];
const MAX_DIR: usize = 2500;
const MAX_QUOTE: usize = 300;
/// The longest background line: a short neutral phrase, the quote says the rest.
const MAX_BACKGROUND: usize = 120;

#[derive(Debug, Clone)]
pub struct Entity {
    pub id: String,
    pub uid: Option<String>,
    pub kind: String,
    pub name: String,
    /// The name inside a sentence ("the Bolsheviks"); `None` when it reads as the name.
    pub in_sentence: Option<String>,
    pub aliases: Vec<String>,
    pub summary: Option<String>,
    pub when: Option<Span>,
    pub place: Option<String>,
    pub coords: Option<[f64; 2]>,
    pub same_as: BTreeMap<String, String>,
    pub image: Option<Value>,
    pub body: String,
    pub rel_path: String,
    /// Sourced lines about where a person comes from (ADR-0016). Shown on that person's page only:
    /// never serialized, so never in graph.json, search.json, stories or answers.
    pub background: Vec<Background>,
    /// What a study found, in its own words (ADR-0019): the quote a dispute answers.
    pub finding: Option<EdgeSrc>,
}

/// A line about where a person comes from, with its sources (ADR-0016). Never a link.
#[derive(Debug, Clone)]
pub struct Background {
    pub text: String,
    pub sources: Vec<EdgeSrc>,
}

#[derive(Debug, Clone)]
pub struct Source {
    pub id: String,
    pub title: String,
    pub publisher: Option<String>,
    pub author: Option<String>,
    pub published: Option<String>,
    pub published_label: Option<String>,
    pub url: Option<String>,
    pub archive_url: Option<String>,
    pub tier: String,
    pub voice: String,
    pub rel_path: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct EdgeSrc {
    pub id: String,
    pub at: Option<String>,
    pub quote: Option<String>,
    /// Whose words the quote is, when they are not the source's own voice.
    #[serde(skip_serializing_if = "Option::is_none")]
    pub by: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct Edge {
    pub id: String,
    pub from: String,
    pub to: String,
    pub rel: String,
    pub label: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub detail: Option<String>,
    pub layers: Vec<String>,
    pub when: Option<Span>,
    pub according_to: Vec<String>,
    pub sources: Vec<EdgeSrc>,
    pub tier: Option<String>,
    pub voices: Vec<String>,
    pub cross_confirmed: bool,
    pub status: String,
    pub passive: bool,
    pub traversable: bool,
    pub qualifiers: BTreeMap<String, Value>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub note: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub reason: Option<String>,
}

impl Edge {
    /// The link's other end, seen from `from` when `outgoing`, else from `to`.
    pub fn other(&self, outgoing: bool) -> &str {
        if outgoing { &self.to } else { &self.from }
    }

    /// When the link starts (decimal year); undated links sort last.
    pub fn start(&self) -> f64 {
        self.when.as_ref().map_or(f64::MAX, |w| w.start)
    }
}

#[derive(Debug, Clone)]
pub struct Chapter {
    pub id: String,
    pub title: String,
    pub subtitle: Option<String>,
    pub summary: Option<String>,
    pub authors: Vec<String>,
    pub featured: bool,
    pub intro_md: String,
    pub outro_md: String,
    pub shots: Vec<Value>,
    pub rel_path: String,
}

pub struct Kb {
    pub schema: Schema,
    pub entities: Vec<Entity>,
    pub index: HashMap<String, usize>,
    pub aliases: BTreeMap<String, usize>,
    pub sources: IndexMap<String, Source>,
    pub edges: Vec<Edge>,
    pub chapters: Vec<Chapter>,
    pub perspectives: IndexMap<String, usize>,
    /// Editorial picks from `content/featured.yaml`, resolved to entity ids.
    pub featured: crate::load::Featured,
    /// Each entity's links, by entity index: (edge index, true when the entity owns the claim).
    /// Built once, so pages and stories never scan every edge.
    pub links: Vec<Vec<(usize, bool)>>,
}

impl Kb {
    pub fn entity(&self, id: &str) -> Option<&Entity> {
        self.index.get(id).map(|&i| &self.entities[i])
    }

    /// Resolves an id or a slug alias.
    pub fn resolve(&self, id: &str) -> Option<&Entity> {
        self.index.get(id).or_else(|| self.aliases.get(id)).map(|&i| &self.entities[i])
    }

    /// Where an entry sits on a map: its own coords, or its place's.
    pub fn coords(&self, e: &Entity) -> Option<[f64; 2]> {
        e.coords.or_else(|| e.place.as_ref().and_then(|p| self.entity(p)).and_then(|p| p.coords))
    }

    pub fn name_of(&self, id: &str) -> String {
        self.entity(id).map(|e| e.name.clone()).unwrap_or_else(|| id.to_string())
    }

    /// The name as it reads inside a sentence: "Who is behind the Bolsheviks?".
    pub fn sentence_name(&self, id: &str) -> String {
        self.entity(id).and_then(|e| e.in_sentence.clone()).unwrap_or_else(|| self.name_of(id))
    }

    /// Every link touching `id`, with `true` when `id` owns the claim (its `from`).
    pub fn links_of<'a>(&'a self, id: &str) -> impl Iterator<Item = (&'a Edge, bool)> + use<'a> {
        let list = self.index.get(id).map(|&i| self.links[i].as_slice()).unwrap_or_default();
        list.iter().map(|&(ei, outgoing)| (&self.edges[ei], outgoing))
    }

    /// How many links touch `id`.
    pub fn degree(&self, id: &str) -> usize {
        self.index.get(id).map_or(0, |&i| self.links[i].len())
    }

    /// Every entry, best-connected first, then by name: a name that several entries share means
    /// the best-connected one.
    pub fn ranked(&self) -> Vec<&Entity> {
        let mut list: Vec<&Entity> = self.entities.iter().collect();
        list.sort_by(|a, b| self.degree(&b.id).cmp(&self.degree(&a.id)).then_with(|| a.name.cmp(&b.name)));
        list
    }

    /// The `role` on a family link ("mother"). It describes the claim's owner (`from`) relative to
    /// its target, so `relative_of` + `role: mother` reads "from is the mother of to".
    pub fn kin_role<'e>(&self, e: &'e Edge) -> Option<&'e str> {
        let kinship = self.schema.relations.get(&e.rel).is_some_and(|r| r.kinship);
        e.qualifiers.get("role").and_then(Value::as_str).filter(|_| kinship)
    }
}

/// Whole numbers above four digits get thousands separators ("717,323,438"); years stay as they are.
pub(crate) fn fmt_num(v: f64) -> String {
    if v.fract() != 0.0 || v.abs() >= 1e15 {
        return format!("{v}");
    }
    let n = v as i64;
    let digits = n.unsigned_abs().to_string();
    if digits.len() <= 4 {
        return n.to_string();
    }
    let mut out = String::with_capacity(digits.len() + digits.len() / 3 + 1);
    if n < 0 {
        out.push('-');
    }
    for (i, ch) in digits.chars().enumerate() {
        if i > 0 && (digits.len() - i) % 3 == 0 {
            out.push(',');
        }
        out.push(ch);
    }
    out
}

fn fmt_amount(v: f64, currency: Option<&str>) -> String {
    let (n, unit) = if v.abs() >= 1e9 {
        (v / 1e9, "B")
    } else if v.abs() >= 1e6 {
        (v / 1e6, "M")
    } else {
        (v, "")
    };
    let num = if unit.is_empty() { fmt_num(n) } else { format!("{}{unit}", fmt_num((n * 10.0).round() / 10.0)) };
    match currency {
        Some("USD") | None => format!("${num}"),
        Some(c) => format!("{num} {c}"),
    }
}

/// Human summary of qualifiers, e.g. "co-founder · 6% · as of Jun 2026".
pub fn detail(q: &BTreeMap<String, Value>) -> Option<String> {
    let mut parts = Vec::new();
    if let Some(Value::String(r)) = q.get("role") {
        parts.push(r.clone());
    }
    // an amount before the words about it: "$20M, without admitting or denying the allegations"
    if let Some(a) = q.get("amount").and_then(Value::as_f64) {
        parts.push(fmt_amount(a, q.get("currency").and_then(Value::as_str)));
    }
    if let Some(Value::String(t)) = q.get("title") {
        parts.push(t.clone());
    }
    if let Some(p) = q.get("percent").and_then(Value::as_f64) {
        parts.push(format!("{}%", fmt_num(p)));
    }
    if let Some(s) = q.get("shares").and_then(Value::as_f64) {
        parts.push(format!("{} share{}", fmt_num(s), if s == 1.0 { "" } else { "s" }));
    }
    if let Some(Value::String(d)) = q.get("as_of") {
        let label = edtf::parse(d).map(|s| s.label).unwrap_or_else(|_| d.clone());
        parts.push(format!("as of {label}"));
    }
    (!parts.is_empty()).then(|| parts.join(", "))
}

/// A short label that opens a note, such as "Disputed:".
static NOTE_LABEL: LazyLock<Regex> = LazyLock::new(|| Regex::new(r"^\s*\p{L}[\p{L} ]{0,30}:\s*").unwrap());

/// The words of a text, lowercased, for comparing two texts: "U.S. cable" → ["u", "s", "cable"].
fn words(s: &str) -> Vec<String> {
    s.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(str::to_lowercase).collect()
}

/// What follows the first `n` words of `s`, counted as `words` counts them.
fn after_words(s: &str, n: usize) -> &str {
    let (mut seen, mut in_word) = (0, false);
    for (i, c) in s.char_indices() {
        if in_word && !c.is_alphanumeric() {
            seen += 1;
            if seen == n {
                return &s[i..];
            }
        }
        in_word = c.is_alphanumeric();
    }
    ""
}

/// `a` and `b` are the same text, except perhaps the case of their first letter.
fn same_but_first_letter(a: &str, b: &str) -> bool {
    let (mut x, mut y) = (a.chars(), b.chars());
    match (x.next(), y.next()) {
        (Some(p), Some(q)) => p.to_lowercase().eq(q.to_lowercase()) && x.as_str() == y.as_str(),
        _ => false,
    }
}

/// The `reason` and `note` of a disputed or withdrawn claim as readers get them. Pages and stories
/// show the reason with the status ("Disputed: …"), so the note never repeats it:
/// - a note that is the reason again, alone or after a label such as "Disputed:", or nearly the
///   same words (four in five shared both ways), is dropped;
/// - a note that starts with the reason and goes on with a new sentence keeps only that sentence on;
/// - a note that starts with the reason and goes on in the same sentence says the same and more,
///   so it is shown once, as the reason.
pub fn reason_and_note(reason: Option<String>, note: Option<String>) -> (Option<String>, Option<String>) {
    let (Some(r), Some(n)) = (reason.as_deref(), note.as_deref()) else { return (reason, note) };
    let rw = words(r);
    if rw.is_empty() {
        return (reason, note);
    }
    let unlabeled = NOTE_LABEL.find(n).map_or(n, |m| &n[m.end()..]);
    for body in [n, unlabeled] {
        if !words(body).starts_with(&rw) {
            continue;
        }
        let rest = after_words(body, rw.len());
        let Some(next) = rest.find(char::is_alphanumeric) else { return (reason, None) };
        let gap = &rest[..next];
        let new_sentence = gap.contains(['.', '!', '?']) && !rest[next..].starts_with(char::is_lowercase);
        if !new_sentence {
            return (Some(body.trim().to_string()), None);
        }
        let after_stop = &rest[gap.rfind(['.', '!', '?']).map_or(0, |i| i + 1)..];
        let sentence = after_stop.trim_start_matches([')', ']', '"', '\'', '\u{201d}', '\u{2019}']).trim();
        return (reason, Some(sentence.to_string()));
    }
    // Only exact and prefix repeats are dropped: a note that merely resembles its reason may
    // differ in one fact (a date, a name), and hiding it would hide that difference.
    (reason, note)
}

/// Keeps `url` only when it is an http(s) address; anything else (javascript:, data:…) is an error
/// and never reaches a page.
fn web_url(file: &str, field: &str, url: Option<&String>, diags: &mut Vec<Diag>) -> Option<String> {
    let u = url?;
    if WEB_URL.is_match(u) {
        return Some(u.clone());
    }
    diags.push(Diag::err(file, format!("{field} must be an http(s) address, not `{u}`")));
    None
}

/// One T1 source, or two independent voices from T1/T2 sources: the bar for a sensitive link and
/// for a historical figure's background line.
fn well_sourced<'s>(schema: &Schema, cited: impl IntoIterator<Item = &'s Source>) -> bool {
    let mut voices = BTreeSet::new();
    for s in cited {
        let Some(tier) = schema.tiers.get(&s.tier) else { continue };
        if tier.primary {
            return true;
        }
        if tier.strong {
            voices.insert(s.voice.as_str());
        }
    }
    voices.len() >= 2
}

/// What the stages after the entries read: the schema, the entry files that passed, and the names
/// and sources to resolve against.
struct Names<'a> {
    schema: &'a Schema,
    docs: Vec<&'a EntityDoc>,
    index: &'a HashMap<String, usize>,
    aliases: &'a BTreeMap<String, usize>,
    sources: &'a IndexMap<String, Source>,
}

impl Names<'_> {
    fn resolve(&self, id: &str) -> Option<usize> {
        self.index.get(id).or_else(|| self.aliases.get(id)).copied()
    }
}

/// A misspelled key in a source reference would silently drop what it carries (a quote).
fn unknown_src_fields(file: &str, refs: &[crate::model::SrcRef], diags: &mut Vec<Diag>) {
    for k in refs.iter().flat_map(|s| s.extra.keys()) {
        diags.push(Diag::warn(file, format!("unknown source field `{k}`")).hint("a source reference takes s, at, quote and by"));
    }
}

/// Validates and assembles the files, stage by stage: entries, sources, aliases, then what cites
/// them (background lines, findings, claims), and last what needs the whole base (featured picks,
/// chapters, sources nobody cites).
pub fn assemble(schema: Schema, raw: Raw) -> (Kb, Vec<Diag>) {
    let mut diags = raw.diags;
    for (dir, n) in &raw.dir_counts {
        if *n > MAX_DIR {
            diags.push(Diag::warn(dir, format!("{n} files in one directory (GitHub guidance is ≤3,000)")).hint("shard deeper"));
        }
    }

    let (mut entities, index, ok_docs) = read_entities(&schema, &raw.entities, &mut diags);
    let mut sources = read_sources(&schema, &raw.sources, &index, &mut diags);
    let aliases = read_aliases(&entities, &index, &sources, &mut diags);
    // a renamed entry's old id still names it: a source in its voice speaks in the current id
    for s in sources.values_mut() {
        if let Some(&i) = index.get(&s.voice).or_else(|| aliases.get(&s.voice)) {
            s.voice = entities[i].id.clone();
        }
    }
    let cx = Names { schema: &schema, docs: ok_docs.iter().map(|&di| &raw.entities[di]).collect(), index: &index, aliases: &aliases, sources: &sources };
    read_backgrounds(&cx, &mut entities, &mut diags);
    read_findings(&cx, &mut entities, &mut diags);
    let (mut edges, held) = read_claims(&cx, &entities, &mut diags);
    check_prose(&cx, &entities, &mut diags);
    let perspectives = confirm_across_sides(&schema, &index, &mut edges, &mut diags);

    let mut links: Vec<Vec<(usize, bool)>> = vec![Vec::new(); entities.len()];
    for (ei, e) in edges.iter().enumerate() {
        links[index[&e.from]].push((ei, true));
        links[index[&e.to]].push((ei, false));
    }
    let mut kb = Kb { schema, entities, index, aliases, sources, edges, chapters: Vec::new(), perspectives, featured: Default::default(), links };
    kb.featured = read_featured(&kb, &raw.featured, &mut diags);
    read_chapters(&mut kb, &raw.chapters, &held, &mut diags);
    warn_uncited_sources(&kb, &held, &mut diags);
    (kb, diags)
}

/// Entries: ids, types, dates and fields. Returns those that passed, by id, with their indexes in `docs`.
fn read_entities(schema: &Schema, docs: &[EntityDoc], diags: &mut Vec<Diag>) -> (Vec<Entity>, HashMap<String, usize>, Vec<usize>) {
    let mut entities: Vec<Entity> = Vec::new();
    let mut index: HashMap<String, usize> = HashMap::new();
    let mut ok_docs: Vec<usize> = Vec::new();
    let mut uids: HashMap<String, String> = HashMap::new();
    let mut missing_uid = 0usize;

    for (di, doc) in docs.iter().enumerate() {
        let f = &doc.front;
        let file = &doc.rel_path;
        let mut valid = true;
        if !SLUG.is_match(&f.id) {
            diags.push(Diag::err(file, format!("id `{}` must be lowercase letters, digits and single hyphens", f.id)));
            valid = false;
        }
        if f.id != doc.stem {
            diags.push(Diag::err(file, format!("id `{}` does not match the file name `{}.md`", f.id, doc.stem)).hint("rename the file or fix the id"));
            valid = false;
        }
        if !schema.types.contains_key(&f.kind) {
            let known: Vec<&str> = schema.types.keys().map(String::as_str).collect();
            diags.push(Diag::err(file, format!("unknown type `{}`", f.kind)).hint(format!("one of: {}", known.join(", "))));
            valid = false;
        } else if doc.folder_type.as_deref() != Some(f.kind.as_str()) {
            diags.push(Diag::err(file, format!("type `{}` but the file is not under content/entities/{}/", f.kind, f.kind)));
        }
        match &f.uid {
            Some(u) => {
                if ulid::Ulid::from_string(u).is_err() {
                    diags.push(Diag::err(file, format!("uid `{u}` is not a valid ULID")).hint("delete it and run `ctd fmt`"));
                } else if let Some(other) = uids.insert(u.clone(), file.clone()) {
                    diags.push(Diag::err(file, format!("uid `{u}` is also used by {other}")));
                }
            }
            None => missing_uid += 1,
        }
        for k in f.extra.keys() {
            diags.push(Diag::warn(file, format!("unknown field `{k}`")));
        }
        let when = f.when.as_ref().and_then(|w| match edtf::parse(w) {
            Ok(s) => Some(s),
            Err(e) => {
                diags.push(Diag::err(file, format!("when: {e}")).hint("use EDTF, e.g. 1962-10-16, 1962-10, -0449, 1955/1975, 2008-10/.."));
                None
            }
        });
        if let Some([lon, lat]) = f.coords
            && (!(-180.0..=180.0).contains(&lon) || !(-90.0..=90.0).contains(&lat))
        {
            diags.push(Diag::err(file, "coords must be [longitude, latitude] in degrees"));
        }
        if schema.on_map(&f.kind) && f.coords.is_none() {
            diags.push(Diag::warn(file, "place has no coords, so it will not appear on maps"));
        }
        // without a safe image the page shows its generated cover
        let image = f.image.clone().filter(|img| match img.get("url").and_then(Value::as_str) {
            Some(u) if WEB_URL.is_match(u) => true,
            Some(u) => {
                diags.push(Diag::err(file, format!("image.url must be an http(s) address, not `{u}`")));
                false
            }
            None => {
                diags.push(Diag::err(file, "image needs a `url` (an http(s) address)"));
                false
            }
        });
        // a sentence form may only add "the" and lower the first letter: never another name
        let in_sentence = f.in_sentence.clone().filter(|s| {
            let ok = same_but_first_letter(s, &f.name) || s.strip_prefix("the ").is_some_and(|rest| same_but_first_letter(rest, &f.name));
            if !ok {
                diags.push(Diag::err(file, format!("in_sentence `{s}` must be the name `{}`, optionally after \"the\"", f.name)).hint("e.g. name: Dissolution of the Soviet Union, in_sentence: the dissolution of the Soviet Union"));
            }
            ok
        });
        // generated stories link names as [[id|name]]
        if f.name.contains(['[', ']', '|']) {
            diags.push(Diag::err(file, format!("name `{}` may not contain [, ] or |", f.name)));
        }
        if !valid {
            continue;
        }
        if let Some(&prev) = index.get(&f.id) {
            diags.push(Diag::err(file, format!("id `{}` is already used by {}", f.id, entities[prev].rel_path)));
            continue;
        }
        let same_as = f.same_as.iter().map(|(k, v)| (k.clone(), v.clone().into_text())).collect();
        index.insert(f.id.clone(), entities.len());
        entities.push(Entity {
            id: f.id.clone(),
            uid: f.uid.clone(),
            kind: f.kind.clone(),
            name: f.name.clone(),
            in_sentence,
            aliases: f.aliases.clone(),
            summary: f.summary.clone(),
            when,
            place: f.place.clone(),
            coords: f.coords,
            same_as,
            image,
            body: doc.body.clone(),
            rel_path: file.clone(),
            background: Vec::new(),
            finding: None,
        });
        ok_docs.push(di);
    }
    if missing_uid > 0 {
        diags.push(Diag::warn("content/", format!("{} without a uid", crate::plural(missing_uid, "entity file"))).hint("run `ctd fmt` to assign permanent ids"));
    }
    (entities, index, ok_docs)
}

fn read_sources(schema: &Schema, docs: &[SourceDoc], index: &HashMap<String, usize>, diags: &mut Vec<Diag>) -> IndexMap<String, Source> {
    let mut sources: IndexMap<String, Source> = IndexMap::new();
    for doc in docs {
        let s = &doc.src;
        let file = &doc.rel_path;
        if !SLUG.is_match(&s.id) || s.id != doc.stem {
            diags.push(Diag::err(file, format!("source id `{}` must be a slug equal to the file name", s.id)));
            continue;
        }
        if index.contains_key(&s.id) {
            diags.push(Diag::err(file, format!("source id `{}` collides with an entity id", s.id)));
            continue;
        }
        if sources.contains_key(&s.id) {
            diags.push(Diag::err(file, format!("source id `{}` is used twice", s.id)));
            continue;
        }
        match schema.tiers.get(&s.tier) {
            None => {
                let known: Vec<&str> = schema.tiers.keys().map(String::as_str).collect();
                diags.push(Diag::err(file, format!("unknown tier `{}`", s.tier)).hint(format!("one of: {}", known.join(", "))));
            }
            Some(t) if t.rejected => diags.push(Diag::err(file, format!("tier `{}` ({}) is not accepted", s.tier, t.label))),
            _ => {}
        }
        if s.url.is_none() {
            diags.push(Diag::warn(file, "source has no url"));
        }
        let url = web_url(file, "url", s.url.as_ref(), diags);
        let archive_url = web_url(file, "archive_url", s.archive_url.as_ref(), diags);
        for k in s.extra.keys() {
            diags.push(Diag::warn(file, format!("unknown field `{k}`")));
        }
        let published_label = s.published.as_ref().and_then(|p| match edtf::parse(p) {
            Ok(span) => Some(span.label),
            Err(e) => {
                diags.push(Diag::warn(file, format!("published: {e}")));
                None
            }
        });
        let voice = s.voice.clone().or_else(|| s.publisher.clone()).unwrap_or_else(|| s.id.clone());
        sources.insert(
            s.id.clone(),
            Source {
                id: s.id.clone(),
                title: s.title.clone(),
                publisher: s.publisher.clone(),
                author: s.author.clone(),
                published: s.published.clone(),
                published_label,
                url,
                archive_url,
                tier: s.tier.clone(),
                voice,
                rel_path: file.clone(),
            },
        );
    }
    sources
}

fn read_aliases(entities: &[Entity], index: &HashMap<String, usize>, sources: &IndexMap<String, Source>, diags: &mut Vec<Diag>) -> BTreeMap<String, usize> {
    let mut aliases: BTreeMap<String, usize> = BTreeMap::new();
    for (i, e) in entities.iter().enumerate() {
        for a in &e.aliases {
            if !SLUG.is_match(a) {
                continue; // a display name, used for search only
            }
            if index.contains_key(a) || sources.contains_key(a) {
                diags.push(Diag::err(&e.rel_path, format!("alias `{a}` collides with an existing id")));
            } else if let Some(j) = aliases.insert(a.clone(), i) {
                diags.push(Diag::err(&e.rel_path, format!("alias `{a}` is also an alias of {}", entities[j].rel_path)));
            }
        }
    }
    aliases
}

/// Background lines (ADR-0016): people only, every source quoted, a living person's lines in their
/// own words (a source in their voice, or a quote `by` them), a historical figure's from one T1 or
/// two independent T1/T2 voices. A line short of that is an error and never shown.
fn read_backgrounds(cx: &Names, entities: &mut [Entity], diags: &mut Vec<Diag>) {
    for doc in &cx.docs {
        let (f, file) = (&doc.front, &doc.rel_path);
        if f.background.is_empty() {
            continue;
        }
        if f.kind != "person" {
            diags.push(Diag::err(file, "only people have `background` lines").hint("say it in the summary or the text, or as a sourced claim"));
            continue;
        }
        let i = cx.index[&f.id];
        let living = entities[i].when.as_ref().is_none_or(|w| w.open_end);
        let mut lines = Vec::new();
        for (n, b) in f.background.iter().enumerate() {
            unknown_src_fields(file, &b.src, diags);
            let at = format!("background line {}", n + 1);
            if b.text.trim().is_empty() || b.text.chars().count() > MAX_BACKGROUND || b.text.contains(['[', ']', '|']) {
                diags.push(Diag::err(file, format!("{at}: text must be 1 to {MAX_BACKGROUND} characters, without [, ] or |")));
                continue;
            }
            let (mut own, mut ok) = (false, !b.src.is_empty());
            let (mut found, mut cited) = (Vec::new(), Vec::new());
            for s in &b.src {
                let Some(src) = cx.sources.get(&s.s) else {
                    diags.push(Diag::err(file, format!("{at}: source `{}` does not exist", s.s)));
                    ok = false;
                    continue;
                };
                match &s.quote {
                    Some(q) if !q.trim().is_empty() && q.chars().count() <= MAX_QUOTE => {}
                    _ => {
                        diags.push(Diag::err(file, format!("{at}: every source needs a quote of at most {MAX_QUOTE} characters")));
                        ok = false;
                    }
                }
                let by = s.by.as_deref().and_then(|b| cx.resolve(b)).map(|i| entities[i].id.clone());
                if let (Some(b), None) = (&s.by, &by) {
                    diags.push(Diag::err(file, format!("{at}: `by: {b}` is not an entry")));
                    ok = false;
                }
                own |= src.voice == f.id || by.as_deref() == Some(f.id.as_str());
                cited.push(src);
                found.push(EdgeSrc { id: s.s.clone(), at: s.at.clone(), quote: s.quote.clone(), by });
            }
            if !ok {
                continue;
            }
            if living && !own {
                diags.push(Diag::err(file, format!("{at}: a living person's background is only what they have said themselves")).hint(format!("cite a source in their voice (`voice: {}`), or a quote of theirs with `by: {}`", f.id, f.id)));
            } else if !(living || well_sourced(cx.schema, cited)) {
                diags.push(Diag::err(file, format!("{at}: needs one T1 source or two independent T1/T2 voices")));
            } else {
                lines.push(Background { text: b.text.clone(), sources: found });
            }
        }
        entities[i].background = lines;
    }
}

/// Findings (ADR-0019): only on a type a dispute can point to, and always quoted, since a dispute
/// answers these words.
fn read_findings(cx: &Names, entities: &mut [Entity], diags: &mut Vec<Diag>) {
    for doc in &cx.docs {
        let (f, file) = (&doc.front, &doc.rel_path);
        let Some(s) = &f.finding else { continue };
        unknown_src_fields(file, std::slice::from_ref(s), diags);
        if !cx.schema.relations.values().any(|r| r.dispute && r.to.allows(&f.kind)) {
            diags.push(Diag::err(file, format!("a {} has no `finding`", f.kind)).hint("say it in the summary or the text, or as a sourced claim"));
        } else if !cx.sources.contains_key(&s.s) {
            diags.push(Diag::err(file, format!("finding: source `{}` does not exist", s.s)));
        } else if s.quote.as_ref().is_none_or(|q| q.trim().is_empty() || q.chars().count() > MAX_QUOTE) {
            diags.push(Diag::err(file, format!("finding: quote the study's own words, in at most {MAX_QUOTE} characters")));
        } else {
            entities[cx.index[&f.id]].finding = Some(EdgeSrc { id: s.s.clone(), at: s.at.clone(), quote: s.quote.clone(), by: None });
        }
    }
}

/// The citations of one claim, as `read_claims` keeps them.
struct Cited<'a> {
    refs: Vec<EdgeSrc>,
    voices: BTreeSet<String>,
    sources: Vec<&'a Source>,
    /// The strongest tier among them.
    best: Option<String>,
}

fn cite<'a>(cx: &Names<'a>, entities: &[Entity], file: &str, cid: &str, c: &ClaimIn, diags: &mut Vec<Diag>) -> Cited<'a> {
    let mut cited = Cited { refs: Vec::new(), voices: BTreeSet::new(), sources: Vec::new(), best: None };
    for s in &c.src {
        let Some(src) = cx.sources.get(&s.s) else {
            diags.push(
                Diag::err(file, format!("source `{}` does not exist", s.s))
                    .claim(cid)
                    .hint(format!("create content/sources/{}/{}.yaml", s.s.chars().take(2).collect::<String>(), s.s)),
            );
            continue;
        };
        if let Some(q) = &s.quote
            && q.chars().count() > MAX_QUOTE
        {
            diags.push(Diag::err(file, format!("quote is longer than {MAX_QUOTE} characters")).claim(cid));
        }
        cited.voices.insert(src.voice.clone());
        cited.sources.push(src);
        if cited.best.as_ref().is_none_or(|b| cx.schema.tier_rank(&src.tier) < cx.schema.tier_rank(b)) {
            cited.best = Some(src.tier.clone());
        }
        // `by`: the entry whose words the quote is (a speaker quoted in a news report)
        let by = s.by.as_deref().and_then(|b| {
            let known = cx.resolve(b).filter(|_| s.quote.is_some()).map(|i| entities[i].id.clone());
            if known.is_none() {
                diags.push(Diag::err(file, format!("`by: {b}` needs a quote and an existing entry id")).claim(cid));
            }
            known
        });
        cited.refs.push(EdgeSrc { id: s.s.clone(), at: s.at.clone(), quote: s.quote.clone(), by });
    }
    cited
}

/// What is wrong with a dispute, as (message, hint): it must be its owner's own account, in its own
/// words (ADR-0019).
fn dispute_faults(cx: &Names, rel: &str, from: &Entity, according_to: &[String], refs: &[EdgeSrc]) -> Vec<(String, String)> {
    let mut faults = Vec::new();
    if according_to != [from.id.clone()] {
        faults.push((format!("`{rel}` is one side's own account: write `according_to: [{}]`", from.id), "name the owner of this link and nobody else".to_string()));
    }
    let own = refs.iter().any(|s| s.quote.is_some() && (s.by.as_ref() == Some(&from.id) || cx.sources.get(&s.id).is_some_and(|src| src.voice == from.id || src.author.as_ref() == Some(&from.id))));
    if !own {
        faults.push((format!("`{rel}` needs {}'s own words", from.name), format!("quote a source in their voice (`voice: {}`), or mark the quote `by: {}`", from.id, from.id)));
    }
    faults
}

/// Claims become edges: (published, withheld). A sensitive claim short of its sources is withheld.
fn read_claims(cx: &Names, entities: &[Entity], diags: &mut Vec<Diag>) -> (Vec<Edge>, Vec<Edge>) {
    // relations that answer a question: their accounts must quote their source
    let answering: HashSet<&str> = cx.schema.questions.iter().flat_map(|q| &q.groups).flat_map(|g| g.into.iter().chain(&g.out)).map(String::as_str).collect();
    let mut edges: Vec<Edge> = Vec::new();
    let mut held: Vec<Edge> = Vec::new();
    for doc in &cx.docs {
        let from = &entities[cx.index[&doc.front.id]];
        let file = &doc.rel_path;
        let mut seen: HashSet<String> = HashSet::new();
        for (ci, c) in doc.front.claims.iter().enumerate() {
            let Some(cid) = c.id.clone() else {
                diags.push(Diag::err(file, format!("claim #{} has no id", ci + 1)).hint("add `id: c<n>` (never reuse an id)"));
                continue;
            };
            if !seen.insert(cid.clone()) {
                diags.push(Diag::err(file, "claim id used twice in this file").claim(&cid));
                continue;
            }
            let Some(rel) = cx.schema.relations.get(&c.rel) else {
                diags.push(Diag::err(file, format!("unknown relation `{}`", c.rel)).claim(&cid).hint("see content/schema/relations.yaml"));
                continue;
            };
            if !rel.from.allows(&from.kind) {
                diags.push(
                    Diag::err(file, format!("`{}` cannot start from a {}", c.rel, from.kind))
                        .claim(&cid)
                        .hint(format!("allowed: {}", rel.from.names())),
                );
            }
            let when = c.when.as_ref().and_then(|w| match edtf::parse(w) {
                Ok(s) => Some(s),
                Err(e) => {
                    diags.push(Diag::err(file, format!("when: {e}")).claim(&cid));
                    None
                }
            });
            if when.is_some() && !rel.temporal {
                diags.push(Diag::warn(file, format!("`{}` is not a temporal relation; `when` is ignored", c.rel)).claim(&cid));
            }
            if rel.legal && c.when.is_none() {
                diags.push(
                    Diag::err(file, format!("`{}` is a legal record, so it needs the date of that step", c.rel))
                        .claim(&cid)
                        .hint("add `when:` (the day of the charge, decision or settlement)"),
                );
            }
            if let (Some(w), Some(life)) = (&when, &from.when)
                && from.kind == "person"
                && rel.temporal
                && w.start + 0.5 < life.start
            {
                diags.push(Diag::warn(file, format!("dated {} but {} was born {}", w.label, from.name, life.start_label)).claim(&cid));
            }
            let mut according_to = Vec::new();
            for a in &c.according_to {
                match cx.resolve(a) {
                    Some(i) => according_to.push(entities[i].id.clone()),
                    None => diags.push(Diag::err(file, format!("according_to `{a}` is not an entity")).claim(&cid)),
                }
            }
            unknown_src_fields(file, &c.src, diags);
            if c.src.is_empty() {
                diags.push(Diag::err(file, "claim has no source").claim(&cid).hint("add `src: [{s: <source-id>, quote: \"<the source's exact words>\"}]`"));
            }
            let Cited { refs: esrc, voices, sources: cited, best } = cite(cx, entities, file, &cid, c, diags);
            let mut qualifiers = BTreeMap::new();
            for (q, v) in c.qualifiers() {
                if !(rel.qualifiers.iter().any(|x| x == q) || (q == "currency" && rel.qualifiers.iter().any(|x| x == "amount"))) {
                    diags.push(Diag::warn(file, format!("qualifier `{q}` is not expected for `{}`", c.rel)).claim(&cid));
                }
                qualifiers.insert(q.to_string(), v);
            }
            for k in c.extra.keys() {
                diags.push(Diag::warn(file, format!("unknown claim field `{k}`")).claim(&cid));
            }
            let status = c.status.clone().unwrap_or_else(|| "published".into());
            if !STATUSES.contains(&status.as_str()) {
                diags.push(Diag::err(file, format!("status `{status}` must be one of {}", STATUSES.join(", "))).claim(&cid));
            }
            if answering.contains(c.rel.as_str()) && !c.according_to.is_empty() && c.src.iter().all(|s| s.quote.is_none()) {
                diags.push(Diag::warn(file, "an account with no quote is left off question pages").claim(&cid).hint("quote the source's own words: `quote: \"…\"`"));
            }
            if rel.attributed && c.according_to.is_empty() {
                diags.push(
                    Diag::err(file, format!("`{}` is always someone's account: add `according_to`", c.rel))
                        .claim(&cid)
                        .hint("name the person, government or scholar who makes this claim"),
                );
            }
            if rel.dispute {
                for (msg, hint) in dispute_faults(cx, &c.rel, from, &according_to, &esrc) {
                    diags.push(Diag::err(file, msg).claim(&cid).hint(hint));
                }
            }
            // A sensitive claim short of its sources stays in its file but never reaches the site (no
            // page, story or graph.json) until it is sourced: a warning for a draft, otherwise an error.
            let withheld = rel.sensitive && !well_sourced(cx.schema, cited);
            if withheld {
                let msg = format!("`{}` is sensitive: it needs one T1 record or two independent T1/T2 voices; withheld until sourced", c.rel);
                diags.push(if status == "draft" { Diag::warn(file, msg) } else { Diag::err(file, msg) }.claim(&cid));
            }
            let targets = c.to.items();
            if targets.is_empty() {
                diags.push(Diag::err(file, "claim has no target (`to`)").claim(&cid));
            }
            let label = rel.label.clone();
            let det = detail(&qualifiers);
            // a disputed or withdrawn claim shows its reason with the status: its note never repeats it
            let (reason, note) = match status.as_str() {
                "disputed" | "deprecated" => reason_and_note(c.reason.clone(), c.note.clone()),
                _ => (c.reason.clone(), c.note.clone()),
            };
            for (ti, t) in targets.iter().enumerate() {
                let Some(tidx) = cx.resolve(t) else {
                    diags.push(Diag::err(file, format!("target `{t}` does not exist")).claim(&cid).hint("create the entity or fix the id"));
                    continue;
                };
                let target = &entities[tidx];
                if target.id != *t {
                    diags.push(Diag::warn(file, format!("`{t}` is an alias; use the id `{}`", target.id)).claim(&cid));
                }
                if !rel.to.allows(&target.kind) {
                    diags.push(
                        Diag::err(file, format!("`{}` cannot point to a {} ({})", c.rel, target.kind, target.id))
                            .claim(&cid)
                            .hint(format!("allowed: {}", rel.to.names())),
                    );
                }
                if target.id == from.id {
                    diags.push(Diag::err(file, "claim points to its own entity").claim(&cid));
                    continue;
                }
                if rel.dispute && target.finding.is_none() {
                    diags.push(Diag::err(file, format!("`{}` disputes a finding, and {} quotes none", c.rel, target.id)).claim(&cid).hint("add `finding: {s: <source-id>, quote: \"…\"}` to that entry"));
                }
                if rel.identity && target.kind != from.kind {
                    diags.push(Diag::err(file, format!("`{}` joins two forms of one body, so both must be a {}", c.rel, from.kind)).claim(&cid));
                }
                let id = if targets.len() > 1 { format!("{}#{}/{}", from.id, cid, ti + 1) } else { format!("{}#{}", from.id, cid) };
                let edge = Edge {
                    id,
                    from: from.id.clone(),
                    to: target.id.clone(),
                    rel: c.rel.clone(),
                    label: label.clone(),
                    detail: det.clone(),
                    layers: rel.layers.clone(),
                    when: when.clone(),
                    according_to: according_to.clone(),
                    sources: esrc.clone(),
                    tier: best.clone(),
                    voices: voices.iter().cloned().collect(),
                    cross_confirmed: false,
                    status: status.clone(),
                    passive: rel.passive,
                    traversable: rel.traversable,
                    qualifiers: qualifiers.clone(),
                    note: note.clone(),
                    reason: reason.clone(),
                };
                if withheld { held.push(edge) } else { edges.push(edge) }
            }
        }
    }
    (edges, held)
}

/// Links, then the prose rules: wikilinks that resolve, and no personal contact data.
fn check_prose(cx: &Names, entities: &[Entity], diags: &mut Vec<Diag>) {
    for e in entities {
        for t in markdown::wikilink_targets(&e.body) {
            if cx.resolve(&t).is_none() {
                diags.push(Diag::warn(&e.rel_path, format!("[[{t}]] has no page yet (wanted)")));
            }
        }
        let text = format!("{}\n{}", e.summary.clone().unwrap_or_default(), e.body);
        if EMAIL.is_match(&text) {
            diags.push(Diag::err(&e.rel_path, "looks like an email address; no personal contact data in content"));
        }
        if PHONE.is_match(&text) {
            diags.push(Diag::err(&e.rel_path, "looks like a phone number; no personal contact data in content"));
        }
    }
}

/// Counts each account, and marks what sources from opposing sides confirm.
fn confirm_across_sides(schema: &Schema, index: &HashMap<String, usize>, edges: &mut [Edge], diags: &mut Vec<Diag>) -> IndexMap<String, usize> {
    let mut perspectives: IndexMap<String, usize> = IndexMap::new();
    for e in edges.iter() {
        for a in &e.according_to {
            *perspectives.entry(a.clone()).or_default() += 1;
        }
    }
    for set in &schema.contested {
        for m in &set.members {
            if !index.contains_key(m) {
                diags.push(Diag::err("content/schema/perspectives.yaml", format!("contested set `{}`: `{m}` is not an entity", set.id)));
            }
        }
    }
    for e in edges.iter_mut() {
        let opposing = schema.contested.iter().any(|set| set.members.iter().filter(|m| e.voices.contains(m)).count() >= 2);
        e.cross_confirmed = opposing && e.status == "published" && e.according_to.is_empty();
    }
    perspectives
}

/// `featured.yaml`: each pick names an entry and has what its shelf needs (warnings otherwise).
fn read_featured(kb: &Kb, raw: &Featured, diags: &mut Vec<Diag>) -> Featured {
    const FEATURED: &str = "content/featured.yaml";
    let pick = |id: &str, diags: &mut Vec<Diag>| match kb.resolve(id) {
        Some(e) => Some(e.id.clone()),
        None => {
            diags.push(Diag::err(FEATURED, format!("unknown entity `{id}`")));
            None
        }
    };
    let route = crate::paths::Options::stories(kb, 1);
    let mut featured = Featured::default();
    for c in &raw.connections {
        let [a, b] = c.ids();
        let (Some(a), Some(b)) = (pick(a, diags), pick(b, diags)) else { continue };
        if a == b {
            diags.push(Diag::err(FEATURED, format!("connection from `{a}` to itself")).hint("a connection needs two different entities"));
            continue;
        }
        if featured.connections.iter().any(|p| p.ids()[0] == a && p.ids()[1] == b) {
            diags.push(Diag::warn(FEATURED, format!("connection `{a}` → `{b}` is listed twice")));
            continue;
        }
        if crate::paths::find(kb, &a, &b, &route).is_empty() {
            diags.push(Diag::warn(FEATURED, format!("no route from `{a}` to `{b}`, so it gets no story")).hint(format!(
                "routes run at most {} steps and skip index-fund holdings; add sourced links or pick another pair",
                route.max_hops
            )));
        }
        featured.connections.push(match c.note() {
            Some(note) => Pick::Noted { between: [a, b], note: note.to_string() },
            None => Pick::Pair([a, b]),
        });
    }
    for id in &raw.lives {
        let Some(id) = pick(id, diags) else { continue };
        if featured.lives.contains(&id) {
            diags.push(Diag::warn(FEATURED, format!("life `{id}` is listed twice")));
            continue;
        }
        if crate::stories::entity_story(kb, &id).is_none() {
            diags.push(Diag::warn(FEATURED, format!("`{id}` has fewer than two links, so it has no life story for the shelf")));
        }
        featured.lives.push(id);
    }
    for page in &raw.questions {
        let Some((qid, x)) = page.split_once('/') else {
            diags.push(Diag::err(FEATURED, format!("question `{page}` must be `<question>/<entity id>`")).hint("e.g. behind/meta-platforms"));
            continue;
        };
        let Some(qi) = kb.schema.questions.iter().position(|q| q.id == qid && !q.route) else {
            diags.push(Diag::err(FEATURED, format!("`{qid}` is not a question with pages")).hint("see content/schema/questions.yaml"));
            continue;
        };
        let Some(x) = pick(x, diags) else { continue };
        let id = format!("{qid}/{x}");
        if featured.questions.contains(&id) {
            diags.push(Diag::warn(FEATURED, format!("question `{id}` is listed twice")));
            continue;
        }
        if !crate::answers::answer(kb, qi, &x).is_some_and(|a| a.earns_page(&kb.schema.questions[qi])) {
            diags.push(Diag::warn(FEATURED, format!("`{id}` has no page: too few sourced names")).hint("add sourced links or pick another entry"));
        }
        featured.questions.push(id);
    }
    featured
}

fn read_chapters(kb: &mut Kb, docs: &[ChapterDoc], held: &[Edge], diags: &mut Vec<Diag>) {
    let withheld: HashSet<&str> = held.iter().map(|e| e.id.as_str()).collect();
    let mut chapter_ids: HashSet<String> = HashSet::new();
    for doc in docs {
        if let Some(ch) = chapter(kb, doc, &withheld, diags)
            && chapter_ids.insert(ch.id.clone())
        {
            kb.chapters.push(ch);
        }
    }
    kb.chapters.sort_by(|a, b| b.featured.cmp(&a.featured).then(a.title.cmp(&b.title)));
}

/// A source cited by no claim, background line, finding or chapter quote card.
fn warn_uncited_sources(kb: &Kb, held: &[Edge], diags: &mut Vec<Diag>) {
    let cited: HashSet<&str> = kb
        .edges
        .iter()
        .chain(held)
        .flat_map(|e| e.sources.iter())
        .chain(kb.entities.iter().flat_map(|e| &e.background).flat_map(|b| &b.sources))
        .chain(kb.entities.iter().filter_map(|e| e.finding.as_ref()))
        .map(|s| s.id.as_str())
        .chain(kb.chapters.iter().flat_map(|c| &c.shots).filter_map(|s| s.pointer("/overlay/source").and_then(Value::as_str)))
        .collect();
    for s in kb.sources.values() {
        if !cited.contains(s.id.as_str()) {
            diags.push(Diag::warn(&s.rel_path, "source is not cited by any claim or story"));
        }
    }
}

/// Splits chapter markdown into prose segments and ```scene YAML blocks.
fn split_scenes(body: &str) -> (Vec<String>, Vec<String>) {
    let (mut prose, mut scenes) = (vec![String::new()], Vec::new());
    let mut in_scene: Option<String> = None;
    for line in body.split_inclusive('\n') {
        match &mut in_scene {
            Some(buf) => {
                if line.trim() == "```" {
                    scenes.push(std::mem::take(buf));
                    in_scene = None;
                    prose.push(String::new());
                } else {
                    buf.push_str(line);
                }
            }
            None => {
                if line.trim_start().starts_with("```scene") {
                    in_scene = Some(String::new());
                } else {
                    prose.last_mut().unwrap().push_str(line);
                }
            }
        }
    }
    if let Some(buf) = in_scene {
        scenes.push(buf);
    }
    (prose, scenes)
}

fn chapter(kb: &Kb, doc: &ChapterDoc, withheld: &HashSet<&str>, diags: &mut Vec<Diag>) -> Option<Chapter> {
    let f = &doc.front;
    let file = &doc.rel_path;
    if !SLUG.is_match(&f.id) || f.id != doc.stem {
        diags.push(Diag::err(file, format!("chapter id `{}` must be a slug equal to the file name", f.id)));
        return None;
    }
    let (prose, scenes) = split_scenes(&doc.body);
    let edge_ids: HashSet<&str> = kb.edges.iter().map(|e| e.id.as_str()).collect();
    let lens_ids: HashSet<&str> = kb.schema.lenses.iter().map(|l| l.id.as_str()).collect();
    let mut shots = Vec::new();
    for block in scenes {
        let list: Vec<Value> = match parse_yaml(&block) {
            Ok(v) => v,
            Err(e) => {
                diags.push(Diag::err(file, format!("scene block is not a YAML list of shots: {e}")));
                continue;
            }
        };
        for mut shot in list {
            let Some(obj) = shot.as_object_mut() else {
                diags.push(Diag::err(file, "each shot must be a mapping"));
                continue;
            };
            let name = obj.get("shot").and_then(Value::as_str).unwrap_or("?").to_string();
            // a renamed entry's old id still names it, but the page knows only current ids
            let current = |v: &mut Value| {
                if let Some(e) = v.as_str().and_then(|id| kb.resolve(id)) {
                    *v = Value::from(e.id.clone());
                }
            };
            for field in ["focus", "perspective"] {
                if let Some(v) = obj.get_mut(field) {
                    current(v);
                }
            }
            for field in ["reveal", "places", "routes"] {
                for v in obj.get_mut(field).and_then(Value::as_array_mut).into_iter().flatten() {
                    match v.as_array_mut() {
                        Some(pair) => pair.iter_mut().for_each(current),
                        None => current(v),
                    }
                }
            }
            for v in obj.get_mut("reveal_claims").and_then(Value::as_array_mut).into_iter().flatten() {
                if let Some((who, rest)) = v.as_str().and_then(|r| r.split_once('#'))
                    && let Some(e) = kb.resolve(who)
                {
                    *v = Value::from(format!("{}#{rest}", e.id));
                }
            }
            let ent = |id: &str, field: &str, diags: &mut Vec<Diag>| {
                if kb.resolve(id).is_none() {
                    diags.push(Diag::err(file, format!("shot `{name}`: {field} `{id}` is not an entity")));
                }
            };
            for field in ["focus", "perspective"] {
                if let Some(id) = obj.get(field).and_then(Value::as_str) {
                    ent(id, field, diags);
                }
            }
            for field in ["reveal", "places"] {
                if let Some(list) = obj.get(field).and_then(Value::as_array) {
                    for id in list.iter().filter_map(Value::as_str) {
                        ent(id, field, diags);
                    }
                }
            }
            if let Some(routes) = obj.get("routes").and_then(Value::as_array) {
                for r in routes {
                    for id in r.as_array().into_iter().flatten().filter_map(Value::as_str) {
                        ent(id, "routes", diags);
                    }
                }
            }
            if let Some(list) = obj.get("reveal_claims").and_then(Value::as_array) {
                for r in list.iter().filter_map(Value::as_str) {
                    let prefix = format!("{r}/");
                    let known = |ids: &HashSet<&str>| ids.contains(r) || ids.iter().any(|e| e.starts_with(&prefix));
                    if known(withheld) {
                        diags.push(Diag::warn(file, format!("shot `{name}`: claim `{r}` is withheld until sourced")));
                    } else if !known(&edge_ids) {
                        diags.push(Diag::err(file, format!("shot `{name}`: claim `{r}` does not exist")).hint("use <entity-id>#<claim-id>"));
                    }
                }
            }
            if let Some(src) = obj.get("overlay").and_then(|o| o.get("source")).and_then(Value::as_str)
                && !kb.sources.contains_key(src)
            {
                diags.push(Diag::err(file, format!("shot `{name}`: overlay source `{src}` does not exist")));
            }
            if let Some(l) = obj.get("lens").and_then(Value::as_str)
                && !lens_ids.contains(l)
            {
                diags.push(Diag::err(file, format!("shot `{name}`: unknown lens `{l}`")));
            }
            if let Some(v) = obj.get("view").and_then(Value::as_str)
                && !matches!(v, "map" | "graph" | "timeline")
            {
                diags.push(Diag::err(file, format!("shot `{name}`: view must be map, graph or timeline")));
            }
            let time = obj.get("time").cloned().map(|v| match v {
                Value::String(s) => s,
                other => other.to_string(),
            });
            if let Some(t) = time {
                match edtf::parse(&t) {
                    Ok(span) => {
                        obj.insert("t".into(), Value::from(span.start));
                        obj.insert("time_label".into(), Value::from(span.label));
                    }
                    Err(e) => diags.push(Diag::err(file, format!("shot `{name}`: time: {e}"))),
                }
            }
            shots.push(shot);
        }
    }
    if shots.is_empty() {
        diags.push(Diag::warn(file, "chapter has no ```scene shots"));
    }
    Some(Chapter {
        id: f.id.clone(),
        title: f.title.clone(),
        subtitle: f.subtitle.clone(),
        summary: f.summary.clone(),
        authors: f.authors.clone(),
        featured: f.featured,
        intro_md: prose.first().cloned().unwrap_or_default(),
        outro_md: prose.iter().skip(1).cloned().collect::<Vec<_>>().join("\n"),
        shots,
        rel_path: file.clone(),
    })
}

#[cfg(test)]
pub(crate) mod tests {
    use super::{fmt_num, reason_and_note};
    use crate::{
        diag::Level,
        testkit::{entity, file, load, said, source, try_load},
    };

    #[test]
    fn numbers_read_like_numbers() {
        assert_eq!(fmt_num(717_323_438.0), "717,323,438");
        assert_eq!(fmt_num(-12_345.0), "-12,345");
        assert_eq!(fmt_num(2004.0), "2004");
        assert_eq!(fmt_num(19.8), "19.8");
    }

    #[test]
    fn unsafe_urls_are_errors_and_never_kept() {
        let (kb, diags) = load(
            "kb-urls",
            &[
                file("content/sources/ba/bad.yaml", "id: bad\ntitle: Bad\ntier: T1\nurl: javascript:alert(1)\narchive_url: \" data:text/html,x\"\n"),
                source("good", "T1"),
                file("content/entities/person/an/ann.md", "---\nid: ann\ntype: person\nname: Ann\nimage: {url: \"JavaScript:alert(1)\"}\nclaims:\n  - {id: c1, rel: founded, to: acme, src: [{s: bad}, {s: good}]}\n---\n"),
                file("content/entities/org/ac/acme.md", "---\nid: acme\ntype: org\nname: Acme\nimage: {url: \"https://example.org/acme.png\"}\n---\n"),
            ],
        );
        let errors: Vec<&str> = diags.iter().filter(|d| d.level == Level::Error).map(|d| d.msg.as_str()).collect();
        assert_eq!(errors.len(), 3, "{errors:?}");
        assert!(errors.iter().any(|m| m.starts_with("url must be an http(s) address")));
        assert!(errors.iter().any(|m| m.starts_with("archive_url must be")));
        assert!(errors.iter().any(|m| m.starts_with("image.url must be")));
        assert_eq!((kb.sources["bad"].url.as_deref(), kb.sources["bad"].archive_url.as_deref()), (None, None));
        assert_eq!(kb.sources["good"].url.as_deref(), Some("https://example.org/good"));
        assert!(kb.entity("ann").unwrap().image.is_none());
        assert!(kb.entity("acme").unwrap().image.is_some());
    }

    /// Zoe is alive, Hal is historical, Acme is no person; each says where they come from.
    pub(crate) fn backgrounds() -> Vec<crate::testkit::File> {
        let person = |id: &str, when: &str, lines: &str| {
            file(&format!("content/entities/person/{}/{id}.md", &id[..2]), &format!("---\nid: {id}\ntype: person\nname: {id}\nwhen: \"{when}\"\nbackground:\n{lines}claims: []\n---\n"))
        };
        vec![
            person(
                "zoe",
                "1960/..",
                "  - {text: Grew up in Leeds, src: [{s: zoe-memoir, quote: \"I grew up in Leeds.\"}]}\n\
                 \x20 - {text: Daughter of a teacher, src: [{s: rec, quote: \"Her mother taught.\"}]}\n\
                 \x20 - {text: Raised Catholic, src: [{s: paper, quote: \"I was raised Catholic,\", by: zoe}]}\n\
                 \x20 - {text: No quote, src: [{s: zoe-memoir}]}\n",
            ),
            person(
                "hal",
                "1850/1920",
                "  - {text: Born to a family of printers, src: [{s: rec, quote: \"a family of printers\"}]}\n\
                 \x20 - {text: Of Welsh descent, src: [{s: blog, quote: \"Welsh descent\"}]}\n",
            ),
            file("content/entities/org/ac/acme.md", "---\nid: acme\ntype: org\nname: Acme\nbackground:\n  - {text: Old, src: [{s: rec, quote: \"old\"}]}\nclaims: []\n---\n"),
            file("content/sources/zo/zoe-memoir.yaml", "id: zoe-memoir\ntitle: My life\ntier: T1\nvoice: zoe\nurl: https://example.org/zoe\n"),
            source("rec", "T1"),
            source("paper", "T2"),
            source("blog", "T3"),
        ]
    }

    #[test]
    fn background_lines_are_a_living_persons_own_words_or_scholarship() {
        let (kb, diags) = load("kb-background", &backgrounds());
        let texts = |id: &str| kb.entity(id).unwrap().background.iter().map(|b| b.text.clone()).collect::<Vec<_>>();
        assert_eq!(texts("zoe"), ["Grew up in Leeds", "Raised Catholic"], "her own words, or a quote of hers");
        assert_eq!(texts("hal"), ["Born to a family of printers"], "a historical figure: one T1, not a blog");
        assert!(kb.entity("acme").unwrap().background.is_empty());
        for needle in ["only what they have said themselves", "every source needs a quote", "one T1 source or two independent", "only people have"] {
            assert_eq!(said(&diags, needle).len(), 1, "{needle}: {diags:?}");
        }
        let orphans: Vec<&str> = diags.iter().filter(|d| d.msg.contains("not cited")).map(|d| d.file.as_str()).collect();
        assert!(orphans.iter().all(|f| !f.contains("zoe-memoir")) && orphans.iter().any(|f| f.contains("blog")), "a kept line cites its source: {orphans:?}");
    }

    #[test]
    fn a_renamed_entry_keeps_its_old_id_everywhere() {
        let (kb, diags) = load(
            "kb-renamed",
            &[
                // Zoe was `zed`: her old id lives on as an alias, in a source's voice, a quote's `by` and a story
                file(
                    "content/entities/person/zo/zoe.md",
                    "---\nid: zoe\ntype: person\nname: Zoe\naliases: [zed]\nwhen: \"1960/..\"\nbackground:\n  - {text: Grew up in Leeds, src: [{s: memoir, quote: \"I grew up in Leeds.\"}]}\n  - {text: Raised Catholic, src: [{s: paper, quote: \"I was raised Catholic.\", by: zed}]}\nclaims:\n  - {id: c1, rel: founded, to: acme, src: [{s: paper, quote: \"She founded Acme.\", by: zed, qoute: x}]}\n---\n",
                ),
                entity("org", "acme", "Acme", ""),
                file("content/sources/me/memoir.yaml", "id: memoir\ntitle: My life\ntier: T1\nvoice: zed\nurl: https://example.org/zoe\n"),
                source("paper", "T2"),
                file(
                    "content/chapters/zoe-story.md",
                    "---\nid: zoe-story\ntype: chapter\ntitle: Zoe\n---\n\n```scene\n- {shot: one, view: graph, focus: zed, reveal: [zed, acme], reveal_claims: [\"zed#c1\"], narration: Zoe.}\n```\n",
                ),
            ],
        );
        let errors: Vec<&str> = diags.iter().filter(|d| d.level == Level::Error).map(|d| d.msg.as_str()).collect();
        assert!(errors.is_empty(), "{errors:?}");
        assert_eq!(kb.entity("zoe").unwrap().background.len(), 2, "her own words, through the old id");
        assert_eq!(kb.edges[0].sources[0].by.as_deref(), Some("zoe"));
        let shot = &kb.chapters[0].shots[0];
        assert_eq!((&shot["focus"], &shot["reveal"][0], &shot["reveal_claims"][0]), (&serde_json::json!("zoe"), &serde_json::json!("zoe"), &serde_json::json!("zoe#c1")));
        assert_eq!(said(&diags, "unknown source field `qoute`").len(), 1, "a misspelled key is not silently dropped");
    }

    #[test]
    fn frontmatter_errors_give_the_files_line_numbers() {
        let (_, diags) = load("kb-lines", &[file("content/entities/person/zo/zoe.md", "---\nid: zoe\ntype: person\nname: Zoe\nclaims:\n  - id: c1\n   rel: founded\n---\n")]);
        let msg = said(&diags, "invalid frontmatter").join(" ");
        // the link whose `rel` is lost to a bad indent starts on line 6 of the file (line 5 of the YAML)
        assert!(msg.contains("line 6 column"), "{msg}");
    }

    #[test]
    fn sensitive_claims_short_of_sources_are_withheld() {
        let (kb, diags) = load(
            "kb-withheld",
            &[
                entity("person", "carl", "Carl", "  - {id: c1, rel: relative_of, to: dana, role: father, status: draft, src: [{s: blog}]}\n"),
                entity("person", "erin", "Erin", "  - {id: c1, rel: relative_of, to: dana, role: aunt, src: [{s: blog}]}\n"),
                entity("person", "dana", "Dana", "  - {id: c1, rel: relative_of, to: carl, role: daughter, src: [{s: rec}]}\n"),
                source("blog", "T3"),
                source("rec", "T1"),
            ],
        );
        let held: Vec<(&Level, &str)> = diags.iter().filter(|d| d.msg.contains("withheld until sourced")).map(|d| (&d.level, d.file.as_str())).collect();
        assert_eq!(held.len(), 2, "{held:?}");
        assert!(held.iter().any(|(l, f)| **l == Level::Warn && f.ends_with("carl.md")), "a draft only warns");
        assert!(held.iter().any(|(l, f)| **l == Level::Error && f.ends_with("erin.md")), "a published claim is an error");
        let ids: Vec<&str> = kb.edges.iter().map(|e| e.id.as_str()).collect();
        assert_eq!(ids, ["dana#c1"]);
        assert!(said(&diags, "not cited").is_empty(), "a withheld claim still cites its source");
        assert_eq!(kb.links_of("carl").count(), 1);
    }

    #[test]
    fn links_index_lists_each_side_once() {
        let (kb, _) = load(
            "kb-links",
            &[
                entity("person", "ann", "Ann", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n  - {id: c2, rel: relative_of, to: bob, role: mother, src: [{s: rec}]}\n"),
                entity("person", "bob", "Bob", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n"),
                entity("org", "acme", "Acme", ""),
                source("rec", "T1"),
            ],
        );
        let of = |id: &str| kb.links_of(id).map(|(e, out)| (e.id.clone(), out)).collect::<Vec<_>>();
        assert_eq!(of("ann"), [("ann#c1".to_string(), true), ("ann#c2".to_string(), true)]);
        assert_eq!(of("bob"), [("ann#c2".to_string(), false), ("bob#c1".to_string(), true)]);
        assert_eq!(of("acme").len(), 2);
        assert_eq!(of("nobody").len(), 0);
        let mother = kb.edges.iter().find(|e| e.id == "ann#c2").unwrap();
        assert_eq!(kb.kin_role(mother), Some("mother"));
    }

    #[test]
    fn featured_picks_are_checked() {
        let (kb, diags) = load(
            "kb-featured",
            &[
                entity("person", "ann", "Ann", "  - {id: c1, rel: founded, to: acme, src: [{s: rec}]}\n  - {id: c2, rel: founded, to: beta, src: [{s: rec}]}\n"),
                entity("org", "acme", "Acme", ""),
                entity("org", "beta", "Beta", ""),
                entity("org", "zed", "Zed", ""),
                source("rec", "T1"),
                file("content/featured.yaml", "connections:\n  - [ann, ann]\n  - [ann, acme]\n  - [ann, acme]\n  - [ann, zed]\nlives: [ann, ann, zed]\n"),
            ],
        );
        let to_itself = said(&diags, "to itself");
        assert_eq!(to_itself.len(), 1);
        assert!(diags.iter().any(|d| d.msg.contains("to itself") && d.level == Level::Error));
        assert_eq!(said(&diags, "listed twice").len(), 2);
        assert_eq!(said(&diags, "no route from `ann` to `zed`").len(), 1);
        assert_eq!(said(&diags, "`zed` has fewer than two links").len(), 1);
        let pairs: Vec<[String; 2]> = kb.featured.connections.iter().map(|c| c.ids().clone()).collect();
        assert_eq!(pairs, [["ann".to_string(), "acme".to_string()], ["ann".to_string(), "zed".to_string()]]);
        assert_eq!(kb.featured.lives, ["ann", "zed"]);
    }

    #[test]
    fn schema_keeps_family_and_interpretation_rules() {
        let kin_to_org = file(
            "content/schema/relations.yaml",
            "relative_of: {label: relative of, inverse: relative of, from: [person], to: [person, org], layers: [people], kinship: true}\n",
        );
        let err = try_load("kb-schema-kin", &[kin_to_org]).err().expect("kinship to an org is rejected");
        assert!(err.to_string().contains("family: true"), "{err}");
        let routed_opinion = file(
            "content/schema/relations.yaml",
            "benefited_from: {label: benefited from, inverse: benefited, from: any, to: [org], layers: [power], attributed: true}\n",
        );
        let err = try_load("kb-schema-attr", &[routed_opinion]).err().expect("an attributed relation must not carry routes");
        assert!(err.to_string().contains("traversable: false"), "{err}");
    }

    #[test]
    fn a_note_never_repeats_the_reason() {
        let shown = |reason: &str, note: &str| reason_and_note(Some(reason.into()), Some(note.into()));
        let reason = "Two records give different dates (1917 and 1918).";
        let keep = |note: Option<&str>| (Some(reason.to_string()), note.map(String::from));
        // the same text, with or without a label, shows once, as the reason
        assert_eq!(shown(reason, reason), keep(None));
        assert_eq!(shown(reason, "Disputed: two records give different dates (1917 and 1918)"), keep(None));
        assert_eq!(shown(reason, "Disputed: Two records give different dates, 1917 and 1918."), keep(None));
        // a look-alike note that changes one fact is not a repeat, so it stays visible
        let changed = "Disputed: Two records give different dates (1917 and 1919).";
        assert_eq!(shown(reason, changed), keep(Some(changed)));
        // what a note adds after the repeat is kept, once
        assert_eq!(shown(reason, "Disputed: Two records give different dates (1917 and 1918). The later one is a copy."), keep(Some("The later one is a copy.")));
        assert_eq!(shown(reason, "Two records give different dates (1917 and 1918).\" \"See the next claim.\""), keep(Some("\"See the next claim.\"")));
        // a note that goes on in the same sentence says more: it becomes the one line shown
        assert_eq!(
            shown("Two records disagree", "Two records disagree about the date, one of them a copy."),
            (Some("Two records disagree about the date, one of them a copy.".into()), None)
        );
        // a different note stays as written, and so does a note with no reason beside it
        let other = "Sutton bases this on a 1918 report; see the next claim.";
        assert_eq!(shown(reason, other), keep(Some(other)));
        assert_eq!(reason_and_note(None, Some(other.into())), (None, Some(other.into())));
    }

    #[test]
    fn disputed_and_withdrawn_claims_drop_a_repeated_note() {
        let (kb, _) = load(
            "kb-reason-note",
            &[
                entity(
                    "person",
                    "ann",
                    "Ann",
                    "  - {id: c1, rel: founded, to: acme, status: disputed, reason: Records disagree., note: \"Disputed: Records disagree.\", src: [{s: rec}]}\n\
                     \x20 - {id: c2, rel: founded, to: beta, status: deprecated, reason: Records disagree., note: Records disagree. A copy., src: [{s: rec}]}\n\
                     \x20 - {id: c3, rel: founded, to: gamma, reason: Records disagree., note: Records disagree., src: [{s: rec}]}\n",
                ),
                entity("org", "acme", "Acme", ""),
                entity("org", "beta", "Beta", ""),
                entity("org", "gamma", "Gamma", ""),
                source("rec", "T1"),
            ],
        );
        let shown = |id: &str| kb.edges.iter().find(|e| e.id == id).map(|e| (e.reason.as_deref(), e.note.as_deref())).unwrap();
        assert_eq!(shown("ann#c1"), (Some("Records disagree."), None));
        assert_eq!(shown("ann#c2"), (Some("Records disagree."), Some("A copy.")));
        // a published claim shows no status, so its note is left as written
        assert_eq!(shown("ann#c3"), (Some("Records disagree."), Some("Records disagree.")));
    }
}
