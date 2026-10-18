//! Renders the static site and the data files described in docs/data-contract.md.

use std::{
    collections::{BTreeMap, BTreeSet, HashMap},
    fs,
    path::{Path, PathBuf},
};

use anyhow::{Context, Result, bail};
use minijinja::{Environment, path_loader, value::Serde};
use serde::Serialize;
use serde_json::{Value, json};
use walkdir::WalkDir;

use crate::{
    answers::{self, Answer},
    kb::{Edge, EdgeSrc, Entity, Kb},
    markdown,
    paths::Params,
    plural,
    schema::NEUTRAL,
};

pub mod data;
mod dossier;
mod history;
mod question;

use dossier::dossier;
use history::{History, git};
use question::{answer_counts, answer_view};

pub struct Opts {
    pub out: PathBuf,
    pub dev: bool,
    /// Also write `data/graph.json`, everything in one file, for tools and tests. No page reads it.
    pub graph: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct Manifest {
    pub engine: String,
    pub built: String,
    pub commit: Option<String>,
    pub methodology: String,
    pub entities: usize,
    pub claims: usize,
    pub sources: usize,
    pub chapters: usize,
}

#[derive(Serialize, Clone)]
struct NodeRef {
    id: String,
    name: String,
    kind: String,
    type_label: String,
    color: String,
    url: String,
}

#[derive(Serialize, Clone)]
struct AttribRef {
    id: String,
    name: String,
    url: String,
}

#[derive(Serialize)]
struct ClaimView {
    edge_id: String,
    phrase: String,
    outgoing: bool,
    other: NodeRef,
    when: Option<String>,
    start: Option<f64>,
    detail: Option<String>,
    according_to: Vec<AttribRef>,
    tier: Option<String>,
    tier_label: Option<String>,
    status: String,
    cross_confirmed: bool,
    passive: bool,
    layers: String,
    color: String,
    refs: Vec<usize>,
    note: Option<String>,
    reason: Option<String>,
}

#[derive(Serialize)]
struct Group {
    phrase: String,
    color: String,
    layers: String,
    items: Vec<ClaimView>,
    /// Links of this kind past the page's cap (a hub's), which the explorer shows.
    more: usize,
}

#[derive(Serialize)]
struct SrcView {
    n: usize,
    id: String,
    title: String,
    publisher: Option<String>,
    publisher_url: Option<String>,
    published: Option<String>,
    url: Option<String>,
    archive_url: Option<String>,
    tier: String,
    tier_label: String,
    quotes: Vec<String>,
}

/// The sources one page cites, numbered in the order its lines first cite them, with their quotes.
#[derive(Default)]
struct Footnotes {
    num: HashMap<String, usize>,
    order: Vec<String>,
    quotes: HashMap<String, Vec<String>>,
}

impl Footnotes {
    /// The footnote numbers of `sources`, each once.
    fn refs(&mut self, sources: &[EdgeSrc]) -> Vec<usize> {
        let mut refs = Vec::new();
        for s in sources {
            let next = self.order.len() + 1;
            let n = *self.num.entry(s.id.clone()).or_insert_with(|| {
                self.order.push(s.id.clone());
                next
            });
            if !refs.contains(&n) {
                refs.push(n);
            }
            if let Some(q) = &s.quote {
                let list = self.quotes.entry(s.id.clone()).or_default();
                if !list.contains(q) {
                    list.push(q.clone());
                }
            }
        }
        refs.sort_unstable();
        refs
    }

    /// The proof list: every cited source with its number (`#src-<n>`), tier and quotes.
    fn sources(mut self, kb: &Kb) -> Vec<SrcView> {
        self.order
            .iter()
            .enumerate()
            .filter_map(|(i, id)| {
                let s = kb.sources.get(id)?;
                let publisher_url = s.publisher.as_ref().and_then(|p| kb.entity(p)).map(|e| format!("/e/{}/", e.id));
                let publisher = s.publisher.as_ref().map(|p| kb.name_of(p));
                Some(SrcView {
                    n: i + 1,
                    id: s.id.clone(),
                    title: s.title.clone(),
                    publisher,
                    publisher_url,
                    published: s.published_label.clone(),
                    url: s.url.clone(),
                    archive_url: s.archive_url.clone(),
                    tier: s.tier.clone(),
                    tier_label: kb.schema.tiers.get(&s.tier).map(|t| t.label.clone()).unwrap_or_default(),
                    quotes: self.quotes.remove(id).unwrap_or_default(),
                })
            })
            .collect()
    }
}

#[derive(Serialize)]
struct TimelineItem {
    when: String,
    start: f64,
    phrase: String,
    subject: NodeRef,
    object: Option<NodeRef>,
    layers: String,
    color: String,
    according_to: Vec<AttribRef>,
    own: bool,
    status: String,
}

fn copy_dir(src: &Path, dst: &Path) -> Result<()> {
    for entry in WalkDir::new(src) {
        let entry = entry?;
        let rel = entry.path().strip_prefix(src)?;
        let target = dst.join(rel);
        if entry.file_type().is_dir() {
            fs::create_dir_all(&target)?;
        } else {
            if let Some(parent) = target.parent() {
                fs::create_dir_all(parent)?;
            }
            fs::copy(entry.path(), &target)?;
        }
    }
    Ok(())
}

fn write(path: &Path, contents: impl AsRef<[u8]>) -> Result<()> {
    if let Some(parent) = path.parent() {
        fs::create_dir_all(parent)?;
    }
    fs::write(path, contents).with_context(|| format!("writing {}", path.display()))
}

/// How many names the home page's Ask form embeds for autocomplete.
const ASK_NAMES: usize = 400;
/// How many entries per type the home page index lists.
const INDEX_PER_TYPE: usize = 12;
/// How many covers one shelf of the Stories library shows (richest stories first).
const SHELF_MAX: usize = 24;
/// Response headers for every file (Cloudflare `_headers`): no sniffing, no framing, no
/// referrer beyond the origin, no device APIs, and a Content-Security-Policy. Scripts come only
/// from the site itself (theme/static, web/dist); the story maps' tiles, glyphs and sprites come
/// from OpenFreeMap (ADR-0014), and MapLibre runs its workers from blob URLs.
const HEADERS: &str = "/*\n  X-Content-Type-Options: nosniff\n  X-Frame-Options: DENY\n  Referrer-Policy: strict-origin-when-cross-origin\n  \
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()\n  Cross-Origin-Opener-Policy: same-origin\n  \
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; \
connect-src 'self' https://tiles.openfreemap.org; worker-src 'self' blob:; child-src 'self' blob:; font-src 'self'; object-src 'none'; \
base-uri 'self'; form-action 'self'; frame-ancestors 'none'\n\
/data/*\n  Cache-Control: public, max-age=300, stale-while-revalidate=86400\n";

/// A type's page lists every entry up to this many; past it, one page per first letter.
const TYPE_PAGE_MAX: usize = 500;
/// Featured question stories on the home shelf (the rest are in the Stories library).
const HOME_QUESTIONS: usize = 4;
/// Entries a place's page lists as set there.
const HERE_MAX: usize = 12;
/// How many answers per question the Ask form embeds, and a question's index lists.
const ASK_PER_QUESTION: usize = 100;
/// "Going further": links to the same question about names in an answer, strongest first.
const FURTHER: usize = 3;
/// Question rows on an entry's own page.
const ROWS: usize = 3;

/// Marks an output directory as ours. Written before anything else, so a build that was
/// interrupted (dev server stopped mid-rebuild) is still recognised and cleaned next time.
const BUILD_MARK: &str = ".ctd-build";

/// Empties the output directory, refusing to touch anything that is not a previous build.
fn prepare_out(root: &Path, out: &Path) -> Result<()> {
    if out == root || root.starts_with(out) || out.starts_with(root.join("content")) {
        bail!("refusing to build into {}", out.display());
    }
    if out.exists() {
        let empty = fs::read_dir(out)?.next().is_none();
        let ours = out.join(BUILD_MARK).exists() || out.join("build-manifest.json").exists();
        if !empty && !ours {
            bail!("{} is not empty and is not a previous build; choose another --out", out.display());
        }
        for entry in fs::read_dir(out)? {
            let p = entry?.path();
            if p.is_dir() { fs::remove_dir_all(&p)? } else { fs::remove_file(&p)? }
        }
    }
    fs::create_dir_all(out)?;
    fs::write(out.join(BUILD_MARK), b"")?;
    Ok(())
}

/// JSON for a `<script type="application/json">` block. `<`, `>` and `&` only occur inside JSON
/// strings, where `<`, `>` and `&` mean the same, so no content can close the
/// script, open a comment or another script inside it, or start a character reference.
fn script_json(v: &impl Serialize) -> Result<String> {
    let json = serde_json::to_string(v)?;
    let mut out = String::with_capacity(json.len() + 16);
    for c in json.chars() {
        match c {
            '<' => out.push_str("\\u003c"),
            '>' => out.push_str("\\u003e"),
            '&' => out.push_str("\\u0026"),
            _ => out.push(c),
        }
    }
    Ok(out)
}

struct Ctx<'a> {
    kb: &'a Kb,
}

impl<'a> Ctx<'a> {
    fn node(&self, id: &str) -> NodeRef {
        match self.kb.entity(id) {
            Some(e) => NodeRef {
                id: e.id.clone(),
                name: e.name.clone(),
                kind: e.kind.clone(),
                type_label: self.kb.schema.type_label(&e.kind),
                color: self.kb.schema.type_color(&e.kind),
                url: format!("/e/{}/", e.id),
            },
            None => NodeRef { id: id.into(), name: id.into(), kind: String::new(), type_label: String::new(), color: NEUTRAL.into(), url: "#".into() },
        }
    }

    fn attrib(&self, ids: &[String]) -> Vec<AttribRef> {
        ids.iter().map(|id| AttribRef { id: id.clone(), name: self.kb.name_of(id), url: format!("/e/{id}/") }).collect()
    }

    fn color(&self, e: &Edge) -> String {
        e.layers.first().and_then(|l| self.kb.schema.layers.get(l)).map_or_else(|| NEUTRAL.into(), |l| l.color.clone())
    }

    fn resolver(&self) -> impl Fn(&str) -> Option<(String, String)> + '_ {
        move |t: &str| self.kb.resolve(t).map(|e| (format!("/e/{}/", e.id), e.name.clone()))
    }
}

/// How a link reads from one side: "founded" on the owner's page, "founded by" on the other.
/// A family role describes the claim's owner, so the owner's side reads "mother of" (Bill Gates)
/// and the other side keeps the plain inverse with the role beside the owner's name.
fn link_phrase(kb: &Kb, e: &Edge, outgoing: bool) -> String {
    let rel = &kb.schema.relations[&e.rel];
    match kb.kin_role(e) {
        Some(role) if outgoing => format!("{role} of"),
        _ if outgoing => rel.label.clone(),
        _ => rel.inverse.clone(),
    }
}

/// The qualifiers shown beside the other entity. On the owner's side a family role is already in
/// the phrase, so it never sits next to the other person ("Bill Gates", not "Bill Gates · mother").
fn link_detail(kb: &Kb, e: &Edge, outgoing: bool) -> Option<String> {
    if outgoing && kb.kin_role(e).is_some() {
        let mut q = e.qualifiers.clone();
        q.remove("role");
        return crate::kb::detail(&q);
    }
    e.detail.clone()
}

fn display_aliases(e: &Entity) -> Vec<String> {
    e.aliases.iter().filter(|a| a.chars().any(|c| c.is_uppercase() || c == ' ')).cloned().collect()
}

fn same_as_links(e: &Entity) -> Vec<Value> {
    e.same_as
        .iter()
        .map(|(k, v)| {
            let url = match k.as_str() {
                "wikidata" => Some(format!("https://www.wikidata.org/wiki/{v}")),
                "lei" => Some(format!("https://search.gleif.org/#/record/{v}")),
                "sec_cik" => Some(format!("https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={v}")),
                _ => None,
            };
            json!({ "key": k, "value": v, "url": url })
        })
        .collect()
}

/// Shots with rendered narration, plus the step cards for the chapter template.
fn story_parts(cx: &Ctx, shots: &[Value]) -> (Vec<Value>, Vec<Value>) {
    let resolver = cx.resolver();
    let mut out = shots.to_vec();
    let mut steps = Vec::new();
    for shot in &mut out {
        let narration = shot.get("narration").and_then(Value::as_str).unwrap_or("").to_string();
        let html = markdown::render(&narration, &resolver);
        if let Some(obj) = shot.as_object_mut() {
            obj.insert("narration_html".into(), Value::from(html.clone()));
        }
        let mut q = Vec::new();
        for (k, key) in [("focus", "focus"), ("lens", "lens"), ("perspective", "p")] {
            if let Some(v) = shot.get(k).and_then(Value::as_str) {
                q.push(format!("{key}={v}"));
            }
        }
        if let Some(t) = shot.get("t").and_then(Value::as_f64) {
            q.push(format!("t={t:.2}"));
        }
        steps.push(json!({
            "shot": shot.get("shot").and_then(Value::as_str).unwrap_or(""),
            "view": shot.get("view").and_then(Value::as_str).unwrap_or("graph"),
            "narration_html": html,
            "explore": shot.get("explore").and_then(Value::as_bool).unwrap_or(false),
            "explore_url": format!("/x/?{}", q.join("&")),
            "time_label": shot.get("time_label"),
        }));
    }
    (out, steps)
}

pub fn build(root: &Path, kb: &Kb, opts: &Opts) -> Result<Manifest> {
    let out = &opts.out;
    prepare_out(root, out)?;
    let history = History::load(root);

    let theme_static = root.join("theme").join("static");
    if theme_static.exists() {
        copy_dir(&theme_static, &out.join("static"))?;
    }
    let web_dist = root.join("web").join("dist");
    if web_dist.exists() {
        copy_dir(&web_dist, &out.join("assets"))?;
    }
    let has_asset = |name: &str| out.join("assets").join(name).exists();
    let assets = json!({
        "islands_js": has_asset("islands.js"), "islands_css": has_asset("islands.css"),
        "explorer_js": has_asset("explorer.js"), "explorer_css": has_asset("explorer.css"),
        "world_js": has_asset("world.js"), "world_css": has_asset("world.css"),
        "story_js": has_asset("story.js"), "story_css": has_asset("story.css"),
    });

    let manifest = Manifest {
        engine: env!("CARGO_PKG_VERSION").into(),
        built: chrono::Utc::now().to_rfc3339_opts(chrono::SecondsFormat::Secs, true),
        commit: git(root, &["rev-parse", "--short", "HEAD"]),
        methodology: kb.schema.methodology_hash.clone(),
        entities: kb.entities.len(),
        claims: kb.edges.len(),
        sources: kb.sources.len(),
        chapters: kb.chapters.len(),
    };

    let cx = Ctx { kb };

    // ---- data files (docs/data-contract.md, ADR-0017) --------------------------------
    let types: serde_json::Map<String, Value> = kb
        .schema
        .types
        .iter()
        .map(|(id, t)| (id.clone(), json!({ "label": t.label, "plural": t.plural, "layer": t.layer, "color": kb.schema.type_color(id) })))
        .collect();
    let relations: serde_json::Map<String, Value> = kb
        .schema
        .relations
        .iter()
        .map(|(id, r)| {
            (
                id.clone(),
                json!({ "label": r.label, "inverse": r.inverse, "layers": r.layers, "traversable": r.traversable, "passive": r.passive,
                        "sensitive": r.sensitive, "kinship": r.kinship, "attributed": r.attributed, "identity": r.identity }),
            )
        })
        .collect();
    let perspectives: Vec<Value> = kb.perspectives.iter().map(|(id, n)| json!({ "id": id, "name": kb.name_of(id), "claims": n })).collect();
    let mut schema = json!({
        "meta": { "engine": manifest.engine, "built": manifest.built, "commit": manifest.commit, "methodology": manifest.methodology },
        "layers": kb.schema.layers, "types": types, "relations": relations, "lenses": kb.schema.lenses, "tiers": kb.schema.tiers,
        "methodology": kb.schema.methodology, "perspectives": perspectives,
    });
    // schema.json is written at the end, once the generated stories are known (`stories`)
    let slim = data::slim(kb);
    let slim_gz = data::gzip_len(&slim);
    if slim_gz > data::SLIM_BUDGET {
        eprintln!(
            "warning: data/graph-slim.json is {} KB gzip, past its {} KB budget: the explorer and routes need the route service (ADR-0017)",
            slim_gz / 1024,
            data::SLIM_BUDGET / 1024
        );
    }
    write(&out.join("data").join("graph-slim.json"), slim)?;
    let by_id: BTreeMap<&str, &Edge> = kb.edges.iter().map(|e| (e.id.as_str(), e)).collect();

    // question pages are computed once, before the pages and data that link to them
    let pages = answers::pages(kb);
    let page_at: HashMap<(usize, &str), &Answer> = pages.iter().map(|a| ((a.q, a.x.id.as_str()), a)).collect();
    let page_ref = |qi: usize, x: &str| {
        page_at.get(&(qi, x)).map(|a| {
            json!({ "title": answers::title(kb, &kb.schema.questions[qi], x), "url": format!("/q/{}/", a.id(kb)),
                    "links": a.links, "accounts": a.accounts_total(), "counts": answer_counts(a) })
        })
    };
    let mut asked: HashMap<&str, Vec<&str>> = HashMap::new();
    for a in &pages {
        asked.entry(a.x.id.as_str()).or_default().push(kb.schema.questions[a.q].id.as_str());
    }

    // best-connected first: a name that matches several entries resolves to the best-connected one
    let ranked = kb.ranked();
    let mut search: Vec<Value> = ranked
        .iter()
        .map(|e| {
            let mut entry = data::search_entry(e);
            if let Some(qs) = asked.get(e.id.as_str()) {
                entry["q"] = json!(qs);
            }
            entry
        })
        .collect();
    for c in &kb.chapters {
        search.push(json!({ "id": c.id, "name": c.title, "aliases": [], "type": "chapter", "summary": c.summary, "url": format!("/c/{}/", c.id) }));
    }
    for a in &pages {
        let id = a.id(kb);
        let q = &kb.schema.questions[a.q];
        // "Who is behind Facebook?" finds Meta's page
        let aliases: Vec<String> = std::iter::once(&a.x.name).chain(&a.x.aliases).map(|n| q.ask.replace("{x}", n)).filter(|t| *t != answers::title(kb, q, &a.x.id)).collect();
        search.push(json!({ "id": id, "name": answers::title(kb, q, &a.x.id), "aliases": aliases, "type": "question", "summary": answer_counts(a), "url": format!("/q/{id}/") }));
    }
    let search_dir = out.join("data").join("search");
    let search_index = data::search(&search, |n, bytes| write(&search_dir.join(format!("{n}.json")), bytes))?;
    write(&search_dir.join("index.json"), search_index)?;

    // ---- templates ----------------------------------------------------------------
    let mut env = Environment::new();
    env.set_loader(path_loader(root.join("theme").join("templates")));
    let layers: Vec<Value> = kb.schema.layers.iter().map(|(id, l)| json!({ "id": id, "label": l.label, "color": l.color })).collect();
    let site = json!({
        "title": "connect·the·dot",
        "tagline": "Connect the dots. See the evidence and the perspectives behind every line.",
        "dev": opts.dev, "assets": assets, "lenses": kb.schema.lenses, "layers": layers, "manifest": manifest,
    });
    let render = |name: &str, ctx: Value| -> Result<String> {
        env.get_template(name)
            .with_context(|| format!("template {name}"))?
            .render(minijinja::Value::from(Serde(ctx)))
            .with_context(|| format!("rendering {name}"))
    };

    let now = question::now();
    let render_story = |dest: PathBuf, draft: &crate::stories::Draft, back: Option<Value>| -> Result<()> {
        let (shots, steps) = story_parts(&cx, &draft.shots);
        let resolver = cx.resolver();
        let chapter = json!({
            "id": draft.id, "title": draft.title, "subtitle": draft.subtitle, "summary": draft.summary, "authors": [],
            "intro_html": markdown::render(&draft.intro_md, &resolver), "outro_html": markdown::render(&draft.outro_md, &resolver),
            "shots_json": script_json(&shots)?, "data_json": script_json(&data::story(kb, &by_id, &shots))?,
            "steps": steps, "shot_count": shots.len(), "generated": true,
            "back": back, "explore_url": draft.explore_url,
        });
        write(&dest.join("index.html"), render("chapter.html", json!({ "site": &site, "chapter": chapter, "history": [] }))?)
    };

    // ---- entity pages -------------------------------------------------------------
    // a place's page lists what is set there (`place`), by date, then name
    let mut here_of: HashMap<&str, Vec<&Entity>> = HashMap::new();
    for e in &kb.entities {
        if let Some(p) = &e.place {
            here_of.entry(p.as_str()).or_default().push(e);
        }
    }
    for list in here_of.values_mut() {
        list.sort_by(|a, b| {
            let start = |e: &Entity| e.when.as_ref().map_or(f64::MAX, |w| w.start);
            start(a).total_cmp(&start(b)).then_with(|| a.name.cmp(&b.name))
        });
    }
    let mut lives: Vec<(String, usize, Value)> = Vec::new();
    let mut story_ids: Vec<String> = Vec::new();
    let params = Params::from(&kb.schema.methodology);
    for ent in &kb.entities {
        let mut items: Vec<(&Edge, bool)> = kb.links_of(&ent.id).collect();
        // one group per phrase: an owner's family links sit together by role ("mother of", "wife of")
        items.sort_by(|(a, ao), (b, bo)| {
            let order = |e: &Edge| kb.schema.relations.get_index_of(&e.rel).unwrap_or(usize::MAX);
            (order(a), !*ao, ao.then(|| kb.kin_role(a)).flatten())
                .cmp(&(order(b), !*bo, bo.then(|| kb.kin_role(b)).flatten()))
                .then(a.start().total_cmp(&b.start()))
                .then(a.id.cmp(&b.id))
        });
        // a hub's page and detail file keep the strongest links of each kind; the explorer has the rest
        let (kept, more) = data::keep_per_kind(&params, &items);
        let mut notes = Footnotes::default();
        let mut groups: Vec<Group> = Vec::new();
        let mut last_of_kind: HashMap<(&str, bool), usize> = HashMap::new();
        let mut timeline: Vec<TimelineItem> = Vec::new();
        if let Some(w) = &ent.when {
            timeline.push(TimelineItem {
                when: w.label.clone(),
                start: w.start,
                phrase: kb.schema.type_label(&ent.kind),
                subject: cx.node(&ent.id),
                object: None,
                layers: String::new(),
                color: kb.schema.type_color(&ent.kind),
                according_to: Vec::new(),
                own: true,
                status: "published".into(),
            });
        }
        for (e, outgoing) in &kept {
            let phrase = link_phrase(kb, e, *outgoing);
            let refs = notes.refs(&e.sources);
            let view = ClaimView {
                edge_id: e.id.clone(),
                phrase: phrase.clone(),
                outgoing: *outgoing,
                other: cx.node(e.other(*outgoing)),
                when: e.when.as_ref().map(|w| w.label.clone()),
                start: e.when.as_ref().map(|w| w.start),
                detail: link_detail(kb, e, *outgoing),
                according_to: cx.attrib(&e.according_to),
                tier: e.tier.clone(),
                tier_label: e.tier.as_ref().and_then(|t| kb.schema.tiers.get(t)).map(|t| t.label.clone()),
                status: e.status.clone(),
                cross_confirmed: e.cross_confirmed,
                passive: e.passive,
                layers: e.layers.join(" "),
                color: cx.color(e),
                refs,
                note: e.note.clone(),
                reason: e.reason.clone(),
            };
            if let Some(w) = &e.when {
                // read from the owner (`from`), as the claim is written: "Mary Maxwell Gates mother of Bill Gates"
                timeline.push(TimelineItem {
                    when: w.label.clone(),
                    start: w.start,
                    phrase: link_phrase(kb, e, true),
                    subject: cx.node(&e.from),
                    object: Some(cx.node(&e.to)),
                    layers: e.layers.join(" "),
                    color: cx.color(e),
                    according_to: cx.attrib(&e.according_to),
                    own: false,
                    status: e.status.clone(),
                });
            }
            match groups.last_mut() {
                Some(g) if g.phrase == phrase => g.items.push(view),
                _ => groups.push(Group { phrase, color: cx.color(e), layers: e.layers.join(" "), items: vec![view], more: 0 }),
            }
            last_of_kind.insert((e.rel.as_str(), *outgoing), groups.len() - 1);
        }
        for (kind, n) in &more {
            if let Some(&g) = last_of_kind.get(kind) {
                groups[g].more += n;
            }
        }
        timeline.sort_by(|a, b| a.start.total_cmp(&b.start));
        // who a person is (ADR-0016): where they were born, citizenship, education, and the sourced
        // background lines; heritage stays on this page and is never a link
        let background = {
            let rows: Vec<Value> = items
                .iter()
                .filter(|(e, outgoing)| *outgoing && e.status != "deprecated" && kb.schema.relations[&e.rel].background)
                .map(|(e, _)| {
                    json!({ "phrase": kb.schema.relations[&e.rel].label, "node": cx.node(&e.to), "when": e.when.as_ref().map(|w| &w.label),
                            "detail": link_detail(kb, e, true), "refs": notes.refs(&e.sources),
                            "draft": e.status == "draft", "disputed": e.status == "disputed", "reason": e.reason })
                })
                .collect();
            let lines: Vec<Value> = ent.background.iter().map(|b| json!({ "text": b.text, "refs": notes.refs(&b.sources) })).collect();
            if rows.is_empty() && lines.is_empty() { Value::Null } else { json!({ "rows": rows, "lines": lines }) }
        };
        // what courts and regulators decided about it (ADR-0018): each case's steps together, in date
        // order, with the caveats of the relations it holds
        let legal = {
            let mut steps: Vec<&Edge> =
                items.iter().filter(|(e, out)| *out && e.status != "deprecated" && kb.schema.relations[&e.rel].legal).map(|(e, _)| *e).collect();
            steps.sort_by(|a, b| a.start().total_cmp(&b.start()).then(a.id.cmp(&b.id)));
            let mut cases: Vec<(Option<&str>, Vec<Value>)> = Vec::new();
            let mut caveats: Vec<&str> = Vec::new();
            for e in steps {
                let rel = &kb.schema.relations[&e.rel];
                if let Some(c) = rel.caveat.as_deref()
                    && !caveats.contains(&c)
                {
                    caveats.push(c);
                }
                let step = json!({ "when": e.when.as_ref().map(|w| &w.label), "phrase": rel.label, "node": cx.node(&e.to), "detail": link_detail(kb, e, true),
                                   "refs": notes.refs(&e.sources), "draft": e.status == "draft", "disputed": e.status == "disputed", "reason": e.reason, "note": e.note });
                let case = e.qualifiers.get("case").and_then(Value::as_str);
                match cases.iter_mut().find(|(c, _)| case.is_some() && *c == case) {
                    Some((_, list)) => list.push(step),
                    None => cases.push((case, vec![step])),
                }
            }
            let cases: Vec<Value> = cases.into_iter().map(|(case, steps)| json!({ "case": case, "steps": steps })).collect();
            if cases.is_empty() { Value::Null } else { json!({ "cases": cases, "caveats": caveats }) }
        };
        let srcs = notes.sources(kb);
        let place = ent.place.as_ref().map(|p| cx.node(p));
        let here = here_of.get(ent.id.as_str()).map(|list| {
            let items: Vec<Value> = list
                .iter()
                .take(HERE_MAX)
                .map(|e| json!({ "node": cx.node(&e.id), "type_label": kb.schema.type_label(&e.kind), "when": e.when.as_ref().map(|w| &w.label) }))
                .collect();
            json!({ "items": items, "more": list.len().saturating_sub(HERE_MAX) })
        });
        let story_url = match crate::stories::entity_story(kb, &ent.id) {
            Some(draft) => {
                render_story(out.join("e").join(&ent.id).join("story"), &draft, Some(json!({ "url": format!("/e/{}/", ent.id), "label": ent.name })))?;
                Some(format!("/e/{}/story/", ent.id))
            }
            None => None,
        };
        let glance = dossier(&cx, ent, &items, now);
        let evidence_line = {
            let primary = items.iter().filter(|(e, _)| e.tier.as_ref().and_then(|t| kb.schema.tiers.get(t)).is_some_and(|t| t.primary)).count();
            let drafts = items.iter().filter(|(e, _)| e.status == "draft").count();
            let mut line = plural(items.len(), "link");
            if !items.is_empty() {
                line.push_str(&format!(", {primary} backed by primary records"));
            }
            if drafts > 0 {
                line.push_str(&format!(", {drafts} still being verified"));
            }
            line
        };
        let entity = json!({
            "id": ent.id, "name": ent.name, "kind": ent.kind, "type_label": kb.schema.type_label(&ent.kind),
            "color": kb.schema.type_color(&ent.kind), "summary": ent.summary, "when": ent.when.as_ref().map(|w| w.label.clone()),
            "aliases": display_aliases(ent), "same_as": same_as_links(ent), "place": place, "image": ent.image,
            "body_html": markdown::render(&ent.body, &cx.resolver()), "rel_path": ent.rel_path, "url": format!("/e/{}/", ent.id),
            "coords": kb.coords(ent), "story_url": story_url,
            "cover": crate::covers::entity(&ent.id, &ent.name, items.len()),
            "evidence_line": evidence_line,
        });
        if let Some(url) = &story_url {
            story_ids.push(ent.id.clone());
            lives.push((ent.kind.clone(), items.len(), json!({ "title": ent.name, "subtitle": ent.summary, "url": url,
                                                              "kind": plural(items.len(), "link"), "cover": entity["cover"] })));
        }
        // questions about this entry, only on its own page (never "behind" a person: no such page)
        let asked: Vec<Value> = (0..kb.schema.questions.len())
            .filter_map(|qi| {
                let mut page = page_ref(qi, &ent.id)?;
                page["q"] = json!(kb.schema.questions[qi].id);
                Some(page)
            })
            .collect();
        let questions: Vec<Value> = asked.iter().take(ROWS).cloned().collect();
        let split_url = (0..kb.schema.questions.len())
            .filter_map(|qi| page_at.get(&(qi, ent.id.as_str())))
            .find(|a| a.accounts_total() >= 2)
            .map(|a| format!("/q/{}/", a.id(kb)));
        let connect = kb.schema.questions.iter().find(|q| q.route).map(|q| {
            json!({ "title": q.ask.replace("{a}", &kb.sentence_name(&ent.id)).replace("{b}", "…"), "url": format!("/x/?from={}", ent.id) })
        });
        let html = render(
            "entity.html",
            json!({ "site": &site, "entity": entity, "groups": groups, "timeline": timeline, "sources": srcs, "history": history.of(&ent.rel_path),
                    "claims_count": items.len(), "dossier": glance, "here": here, "background": background, "legal": legal, "questions": questions,
                    "connect": connect, "split_url": split_url }),
        )?;
        write(&out.join("e").join(&ent.id).join("index.html"), html)?;
        let details = data::details(kb, ent, &kept, story_url.as_deref(), asked);
        write(&out.join("data").join("e").join(format!("{}.json", ent.id)), serde_json::to_vec(&details)?)?;
    }

    // ---- alias redirects ------------------------------------------------------------
    let mut redirects = String::new();
    for (alias, &i) in &kb.aliases {
        let target = &kb.entities[i];
        let url = format!("/e/{}/", target.id);
        redirects.push_str(&format!("/e/{alias}/ {url} 301\n"));
        let html = render("redirect.html", json!({ "site": &site, "url": url, "name": target.name }))?;
        write(&out.join("e").join(alias).join("index.html"), html)?;
    }
    write(&out.join("_redirects"), redirects)?;
    write(&out.join("_headers"), HEADERS)?;

    // ---- question pages and their stories -------------------------------------------------------
    let mut question_stories: BTreeSet<String> = BTreeSet::new();
    let mut question_books: Vec<(Option<usize>, usize, Value)> = Vec::new();
    for a in &pages {
        let q = &kb.schema.questions[a.q];
        let id = a.id(kb);
        let title = answers::title(kb, q, &a.x.id);
        let dir = out.join("q").join(&q.id).join(&a.x.id);
        let further: Vec<Value> = a.names_by_strength().into_iter().filter_map(|n| page_ref(a.q, n)).take(FURTHER).collect();
        let ask_next: Vec<Value> = (0..kb.schema.questions.len()).filter(|&j| j != a.q).filter_map(|j| page_ref(j, &a.x.id)).collect();
        let next: Vec<(String, String)> =
            ask_next.iter().map(|v| (v["title"].as_str().unwrap_or_default().to_string(), v["url"].as_str().unwrap_or_default().to_string())).collect();
        let story_url = match crate::stories::answer_story(kb, a, &next) {
            Some(draft) => {
                render_story(dir.join("story"), &draft, Some(json!({ "url": format!("/q/{id}/"), "label": title })))?;
                let book = json!({ "title": title, "subtitle": answer_counts(a), "url": format!("/q/{id}/story/"), "kind": "Question",
                                   "cover": crate::covers::entity(&id, &title, a.links) });
                question_books.push((kb.featured.questions.iter().position(|f| *f == id), a.links + a.accounts_total(), book));
                question_stories.insert(id.clone());
                Some(format!("/q/{id}/story/"))
            }
            None => None,
        };
        write(&dir.join("index.html"), render("question.html", answer_view(&cx, &site, a, story_url.as_deref(), further, ask_next))?)?;
    }
    // the Questions shelf: featured first, in featured.yaml order, then the richest, across questions
    question_books.sort_by(|a, b| match (a.0, b.0) {
        (Some(x), Some(y)) => x.cmp(&y),
        (Some(_), None) => std::cmp::Ordering::Less,
        (None, Some(_)) => std::cmp::Ordering::Greater,
        (None, None) => b.1.cmp(&a.1),
    });
    let featured_questions: Vec<Value> = question_books.iter().filter(|q| q.0.is_some()).take(HOME_QUESTIONS).map(|q| q.2.clone()).collect();
    let questions_more = question_books.len().saturating_sub(SHELF_MAX);
    let question_books: Vec<Value> = question_books.into_iter().take(SHELF_MAX).map(|(_, _, v)| v).collect();

    // ---- chapters -------------------------------------------------------------------
    let mut chapter_cards = Vec::new();
    for ch in &kb.chapters {
        let resolver = cx.resolver();
        let (shots, steps) = story_parts(&cx, &ch.shots);
        let chapter = json!({
            "id": ch.id, "title": ch.title, "subtitle": ch.subtitle, "summary": ch.summary, "authors": ch.authors,
            "intro_html": markdown::render(&ch.intro_md, &resolver), "outro_html": markdown::render(&ch.outro_md, &resolver),
            "shots_json": script_json(&shots)?, "data_json": script_json(&data::story(kb, &by_id, &shots))?,
            "steps": steps, "url": format!("/c/{}/", ch.id), "shot_count": shots.len(),
        });
        let html = render("chapter.html", json!({ "site": &site, "chapter": &chapter, "history": history.of(&ch.rel_path) }))?;
        write(&out.join("c").join(&ch.id).join("index.html"), html)?;
        chapter_cards.push(json!({ "id": ch.id, "title": ch.title, "subtitle": ch.subtitle, "summary": ch.summary, "url": format!("/c/{}/", ch.id), "shots": shots.len(), "kind": plural(shots.len(), "scene"),
                                   "cover": crate::covers::entity(&ch.id, &ch.title, shots.len()) }));
    }

    // ---- home, explorer, 404 ------------------------------------------------------------
    // editorial picks live in content/featured.yaml (validated by `ctd check`)
    let featured_pairs: Vec<(&str, &str)> = kb.featured.connections.iter().map(|c| (c.ids()[0].as_str(), c.ids()[1].as_str())).collect();
    let mut shelf: Vec<Value> = chapter_cards
        .iter()
        .map(|c| json!({ "title": c["title"], "subtitle": c["subtitle"], "url": c["url"], "kind": "Story", "cover": c["cover"] }))
        .collect();
    let mut path_story_url: HashMap<(String, String), String> = HashMap::new();
    let mut connections: Vec<Value> = Vec::new();
    for c in &kb.featured.connections {
        let [a, b] = c.ids();
        if let Some(draft) = crate::stories::path_story(kb, a, b, c.note()) {
            let stops = draft.shots.len().saturating_sub(1);
            render_story(out.join("p").join(format!("{a}--{b}")), &draft, None)?;
            path_story_url.insert((a.clone(), b.clone()), format!("/p/{a}--{b}/"));
            connections.push(json!({ "title": draft.title, "subtitle": draft.subtitle, "url": format!("/p/{a}--{b}/"), "kind": "Connection",
                                     "cover": crate::covers::route(&draft.id, &draft.title, stops) }));
        }
    }
    // the founder's questions come right after the written stories
    shelf.extend(featured_questions);
    shelf.extend(connections.iter().cloned());

    // the library: written stories, connections, then every generated life story by type, richest first
    let mut life_shelves = Vec::new();
    for (tid, t) in &kb.schema.types {
        let mut list: Vec<&(String, usize, Value)> = lives.iter().filter(|(k, _, _)| k == tid).collect();
        if list.is_empty() {
            continue;
        }
        list.sort_by(|a, b| b.1.cmp(&a.1).then_with(|| a.2["title"].as_str().cmp(&b.2["title"].as_str())));
        let more = list.len().saturating_sub(SHELF_MAX);
        life_shelves.push(json!({ "label": t.plural, "items": list.iter().take(SHELF_MAX).map(|(_, _, v)| v).collect::<Vec<_>>(), "more": more }));
    }
    write(
        &out.join("c").join("index.html"),
        render(
            "chapters.html",
            json!({ "site": &site, "chapters": &chapter_cards, "connections": connections, "lives": life_shelves,
                    "questions": question_books, "questions_more": questions_more }),
        )?,
    )?;
    let paths: Vec<Value> = featured_pairs
        .iter()
        .map(|(a, b)| json!({ "from": cx.node(a), "to": cx.node(b), "url": format!("/x/?from={a}&to={b}"),
                              "story_url": path_story_url.get(&(a.to_string(), b.to_string())) }))
        .collect();
    // The hero draws one real route, computed by the same ranking the explorer uses.
    let route = featured_pairs
        .iter()
        .find_map(|(a, b)| {
            let p = crate::paths::find(kb, a, b, &crate::paths::Options::stories(kb, 1)).into_iter().next()?;
            let stops: Vec<Value> = p
                .nodes
                .iter()
                .enumerate()
                .map(|(i, id)| {
                    let hop = i.checked_sub(1).map(|j| &p.hops[j]);
                    let via = hop.map(|h| {
                        let rel = &kb.schema.relations[&h.edge.rel];
                        if h.forward { rel.label.clone() } else { rel.inverse.clone() }
                    });
                    let attributed = hop.is_some_and(|h| !h.edge.according_to.is_empty());
                    json!({ "node": cx.node(id), "via": via, "attributed": attributed })
                })
                .collect();
            Some(json!({ "stops": stops, "hops": p.hops.len(), "url": format!("/x/?from={a}&to={b}"),
                         "story_url": path_story_url.get(&(a.to_string(), b.to_string())),
                         "from": cx.node(a), "to": cx.node(b) }))
        });
    for fid in kb.featured.lives.iter().map(String::as_str) {
        if let Some(e) = kb.entity(fid)
            && story_ids.iter().any(|s| s == fid)
        {
            let links = kb.links_of(fid).count();
            shelf.push(json!({ "title": format!("The story of {}", e.name), "subtitle": e.summary, "url": format!("/e/{fid}/story/"),
                               "kind": kb.schema.type_label(&e.kind), "cover": crate::covers::entity(fid, &e.name, links) }));
        }
    }
    // The Ask form embeds the best-connected names for autocomplete; anything else resolves
    // through /data/search.json on submit, so the home page stays small as the graph grows.
    let ask_names: Vec<Value> = ranked.iter().take(ASK_NAMES).map(|e| json!({ "id": e.id, "name": e.name, "aliases": e.aliases })).collect();
    // the index shows each type's best-connected entries (alphabetical), not every entry
    let mut type_groups = Vec::new();
    for (tid, t) in &kb.schema.types {
        let of_type: Vec<&&Entity> = ranked.iter().filter(|e| &e.kind == tid).collect();
        if of_type.is_empty() {
            continue;
        }
        let mut items: Vec<Value> = of_type
            .iter()
            .take(INDEX_PER_TYPE)
            .map(|e| json!({ "node": cx.node(&e.id), "summary": e.summary, "when": e.when.as_ref().map(|w| w.label.clone()) }))
            .collect();
        items.sort_by(|a, b| a["node"]["name"].as_str().cmp(&b["node"]["name"].as_str()));
        let more = of_type.len().saturating_sub(INDEX_PER_TYPE);
        type_groups.push(json!({ "id": tid, "label": t.plural, "color": kb.schema.type_color(tid), "items": items, "more": more }));
    }
    // one page per type: every entry, A to Z, where the index's "and N more" leads
    for (tid, t) in &kb.schema.types {
        let mut list: Vec<&Entity> = kb.entities.iter().filter(|e| &e.kind == tid).collect();
        if list.is_empty() {
            continue;
        }
        list.sort_by_cached_key(|e| e.name.to_lowercase());
        let mut letters: Vec<(String, Vec<Value>)> = Vec::new();
        for e in &list {
            let first = e.name.chars().next().filter(|c| c.is_alphabetic()).map_or("#".into(), |c| c.to_uppercase().collect::<String>());
            let item = json!({ "node": cx.node(&e.id), "when": e.when.as_ref().map(|w| &w.label), "summary": e.summary });
            match letters.last_mut() {
                Some((l, items)) if *l == first => items.push(item),
                _ => letters.push((first, vec![item])),
            }
        }
        // past TYPE_PAGE_MAX entries, the type's page lists the letters and each letter has a page
        let split = list.len() > TYPE_PAGE_MAX;
        let slug = |l: &str| if l == "#" { "other".to_string() } else { l.to_lowercase() };
        let letters: Vec<Value> = letters
            .into_iter()
            .enumerate()
            .map(|(i, (letter, items))| {
                let url = if split { format!("/t/{tid}/{}/", slug(&letter)) } else { format!("#l-{}", i + 1) };
                json!({ "letter": letter, "url": url, "items": items })
            })
            .collect();
        let ty = json!({ "id": tid, "label": t.label, "plural": t.plural });
        let ctx = if split {
            let nav: Vec<Value> = letters.iter().map(|g| json!({ "letter": g["letter"], "url": g["url"] })).collect();
            for g in &letters {
                let ctx = json!({ "site": &site, "type": ty, "total": list.len(), "letters": nav, "split": true, "letter": g });
                write(&out.join("t").join(tid).join(slug(g["letter"].as_str().unwrap_or("#"))).join("index.html"), render("type.html", ctx)?)?;
            }
            json!({ "site": &site, "type": ty, "total": list.len(), "letters": nav, "split": true })
        } else {
            json!({ "site": &site, "type": ty, "total": list.len(), "letters": letters })
        };
        write(&out.join("t").join(tid).join("index.html"), render("type.html", ctx)?)?;
    }
    // the Ask form: each question with the answers it can open at once (the rest via search.json `q`)
    let ask_questions: Vec<Value> = kb
        .schema
        .questions
        .iter()
        .enumerate()
        .map(|(qi, q)| {
            let mine: Vec<&Answer> = pages.iter().filter(|a| a.q == qi).collect();
            let prefix = format!("{}/", q.id);
            let tries: Vec<Value> = kb
                .featured
                .questions
                .iter()
                .filter_map(|f| page_at.get(&(qi, f.strip_prefix(&prefix)?)))
                .map(|a| json!({ "id": a.x.id, "name": kb.sentence_name(&a.x.id), "url": format!("/q/{}/", a.id(kb)) }))
                .collect();
            let names: Vec<Value> = mine
                .iter()
                .take(ASK_PER_QUESTION)
                .map(|a| json!({ "id": a.x.id, "name": a.x.name, "aliases": a.x.aliases, "url": format!("/q/{}/", a.id(kb)) }))
                .collect();
            let [shows, not] = answers::scope(q);
            json!({ "id": q.id, "ask": q.ask, "label": answers::label(q), "route": q.route, "subjects": q.subjects, "shows": shows, "not": not,
                    "url": format!("/q/{}/", q.id), "names": names, "more": mine.len().saturating_sub(ASK_PER_QUESTION), "try": tries })
        })
        .collect();
    let stats = json!({ "entities": kb.entities.len(), "claims": kb.edges.len(), "sources": kb.sources.len(),
                        "perspectives": kb.perspectives.len(), "cross_confirmed": kb.edges.iter().filter(|e| e.cross_confirmed).count() });
    write(
        &out.join("index.html"),
        render("home.html", json!({ "site": &site, "chapters": &chapter_cards, "paths": paths, "route": route, "groups": type_groups, "stats": stats,
                                   "shelf": shelf, "ask_names": ask_names, "questions": ask_questions }))?,
    )?;
    write(&out.join("x").join("index.html"), render("explorer.html", json!({ "site": &site }))?)?;
    write(&out.join("w").join("index.html"), render("world.html", json!({ "site": &site }))?)?;
    if !kb.entities.is_empty() {
        let (g, spec) = crate::world::from_kb(kb);
        crate::world::build(&g, &spec, &out.join("world"), Some(&root.join(".cache").join("world-state.json")))?;
    }
    write(&out.join("404.html"), render("404.html", json!({ "site": &site }))?)?;
    // how the site works: the badges, the questions' scope lines, the methodology
    let tiers: Vec<Value> =
        kb.schema.tiers.values().filter(|t| !t.rejected).map(|t| json!({ "label": t.label, "description": t.description })).collect();
    let asks: Vec<Value> = kb
        .schema
        .questions
        .iter()
        .map(|q| {
            let [shows, not] = answers::scope(q);
            json!({ "title": answers::blank(q), "shows": shows, "not": not, "url": format!("/q/{}/", q.id) })
        })
        .collect();
    let about = json!({ "site": &site, "tiers": tiers, "questions": asks, "stats": stats, "methodology": kb.schema.methodology.get("version") });
    write(&out.join("about").join("index.html"), render("about.html", about)?)?;
    // which stories exist, so the explorer can offer "Play the story" / "Play this route"
    let mut path_ids: Vec<String> = path_story_url.keys().map(|(a, b)| format!("{a}--{b}")).collect();
    path_ids.sort();

    // ---- one index per question: its richest answers (a route question lists the route stories)
    for (qi, q) in kb.schema.questions.iter().enumerate() {
        let items: Vec<Value> = if q.route {
            connections.iter().map(|c| json!({ "title": c["title"], "url": c["url"], "counts": c["subtitle"], "story_url": c["url"] })).collect()
        } else {
            pages
                .iter()
                .filter(|a| a.q == qi)
                .map(|a| {
                    let id = a.id(kb);
                    let story_url = question_stories.contains(&id).then(|| format!("/q/{id}/story/"));
                    json!({ "title": answers::title(kb, q, &a.x.id), "url": format!("/q/{id}/"), "counts": answer_counts(a), "story_url": story_url })
                })
                .collect()
        };
        let [shows, not] = answers::scope(q);
        let ctx = json!({ "site": &site,
            "question": { "id": q.id, "ask": q.ask, "label": answers::label(q), "title": answers::blank(q), "shows": shows, "not": not,
                          "url": format!("/q/{}/", q.id), "route": q.route, "subjects": q.subjects },
            "more": items.len().saturating_sub(ASK_PER_QUESTION), "pages": items.into_iter().take(ASK_PER_QUESTION).collect::<Vec<_>>() });
        write(&out.join("q").join(&q.id).join("index.html"), render("questions.html", ctx)?)?;
    }

    schema["questions"] = kb
        .schema
        .questions
        .iter()
        .map(|q| {
            let mut v = json!(q);
            v["label"] = json!(answers::label(q));
            v
        })
        .collect();
    schema["stories"] = json!({ "paths": path_ids });
    if opts.graph {
        // everything in one file, for tools and tests: the schema, every entry and link with its
        // words and proof, every source, and which entries have question pages and stories
        let mut graph = schema.clone();
        for (qi, q) in graph["questions"].as_array_mut().into_iter().flatten().enumerate() {
            let qd = &kb.schema.questions[qi];
            q["pages"] = pages
                .iter()
                .filter(|a| a.q == qi)
                .map(|a| {
                    let id = a.id(kb);
                    let page = json!({ "title": answers::title(kb, qd, &a.x.id), "url": format!("/q/{id}/"), "links": a.links,
                                       "accounts": a.accounts_total(), "story": question_stories.contains(&id) });
                    (a.x.id.clone(), page)
                })
                .collect::<serde_json::Map<String, Value>>()
                .into();
        }
        graph["stories"] = json!({ "entities": story_ids, "paths": schema["stories"]["paths"], "questions": question_stories });
        graph["nodes"] = kb
            .entities
            .iter()
            .map(|e| {
                let mut n = data::node(kb, e);
                n["summary"] = json!(e.summary);
                n["aliases"] = json!(e.aliases);
                n
            })
            .collect();
        graph["edges"] = json!(kb.edges);
        graph["sources"] = Value::Object(kb.sources.values().map(|s| (s.id.clone(), data::source(kb, s))).collect());
        write(&out.join("data").join("graph.json"), serde_json::to_vec(&graph)?)?;
    }
    write(&out.join("data").join("schema.json"), serde_json::to_vec(&schema)?)?;

    write(&out.join("build-manifest.json"), serde_json::to_vec_pretty(&manifest)?)?;
    Ok(manifest)
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use serde_json::{Value, json};

    use super::{link_detail, link_phrase, script_json};
    use crate::{
        stories::tests::family,
        testkit::{load, write_repo},
    };

    #[test]
    fn family_roles_sit_beside_the_person_they_describe() {
        let (kb, _) = load("site-roles", &family());
        let mother = kb.edges.iter().find(|e| e.id == "ann#c1").unwrap();
        // Ann's page: "mother of" Bob, with nothing beside Bob's name
        assert_eq!((link_phrase(&kb, mother, true), link_detail(&kb, mother, true)), ("mother of".to_string(), None));
        // Bob's page: "relative of" Ann, with "mother" beside Ann's name
        assert_eq!((link_phrase(&kb, mother, false), link_detail(&kb, mother, false)), ("relative of".to_string(), Some("mother".to_string())));
        let founded = kb.edges.iter().find(|e| e.id == "ann#c3").unwrap();
        assert_eq!(link_phrase(&kb, founded, false), "founded by");
    }

    #[test]
    fn legal_records_show_each_cases_steps_together_in_date_order() {
        let relations = "founded: {label: founded, inverse: founded by, from: [person, org], to: [org], layers: [power], temporal: true}\n\
            charged_by: {label: charged by, inverse: charged, from: [person, org], to: [org], layers: [power], temporal: true, qualifiers: [title, case], \
            sensitive: true, traversable: false, legal: true, noun: true, caveat: \"A charge is an accusation, not a finding of guilt.\"}\n\
            settled_with: {label: settled with, inverse: settled with, from: [person, org], to: [org], layers: [power], temporal: true, \
            qualifiers: [title, case, amount, currency], sensitive: true, traversable: false, legal: true}\n";
        let files = vec![
            crate::testkit::file("content/schema/relations.yaml", relations),
            crate::testkit::source("rec", "T1"),
            crate::testkit::entity(
                "person",
                "ann",
                "Ann",
                "  - {id: c1, rel: settled_with, to: agency, when: 2018-09-29, case: Agency v. Ann, amount: 20000000, currency: USD, title: without admitting or denying, src: [{s: rec, quote: Ann settled.}]}\n\
                 \x20 - {id: c2, rel: charged_by, to: agency, when: 2018-09-27, case: Agency v. Ann, title: securities fraud, src: [{s: rec, quote: Ann was charged.}]}\n\
                 \x20 - {id: c3, rel: settled_with, to: board, when: 2015, src: [{s: rec, quote: An earlier matter.}]}\n",
            ),
            crate::testkit::entity("org", "agency", "Agency", ""),
            crate::testkit::entity("org", "board", "Board", ""),
        ];
        let root = write_repo("site-legal", &files).unwrap();
        super::copy_dir(&Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme"), &root.join("theme")).unwrap();
        let (kb, diags) = crate::load_kb(&root).unwrap();
        assert!(diags.iter().all(|d| d.level != crate::diag::Level::Error), "{diags:?}");
        let out = root.join("dist");
        super::build(&root, &kb, &super::Opts { out: out.clone(), dev: false, graph: false }).unwrap();
        let page = std::fs::read_to_string(out.join("e/ann/index.html")).unwrap();
        let card = &page[page.find(">Legal records<").expect("the card")..];
        let at = |text: &str| card.find(text).unwrap_or_else(|| panic!("{text} is not in the card"));
        // the 2015 matter stands alone and comes first; the case's charge comes before its settlement
        assert!(at("Board") < at("Agency v. Ann") && at("Agency v. Ann") < at("Charged by") && card[at("Charged by")..].contains("Settled with"));
        assert!(card.contains("securities fraud") && card.contains("$20M") && card.contains("A charge is an accusation, not a finding of guilt."));
        // a legal step needs its date, and the schema keeps legal records strict and out of routes
        let undated = crate::testkit::entity("person", "bob", "Bob", "  - {id: c1, rel: charged_by, to: agency, src: [{s: rec, quote: Bob.}]}\n");
        let (_, diags) = crate::testkit::load("site-legal-undated", &[files[0].clone(), files[1].clone(), files[3].clone(), undated]);
        assert!(!crate::testkit::said(&diags, "needs the date of that step").is_empty());
        let loose = relations.replace("settled_with: {label: settled with, inverse: settled with, from: [person, org], to: [org], layers: [power], temporal: true, \
            qualifiers: [title, case, amount, currency], sensitive: true, traversable: false, legal: true}", "settled_with: {label: settled with, inverse: settled with, from: [person, org], to: [org], legal: true, sensitive: true}");
        let err = crate::testkit::try_load("site-legal-loose", &[crate::testkit::file("content/schema/relations.yaml", &loose)]).err().expect("refused");
        assert!(err.to_string().contains("must also be `sensitive: true` and `traversable: false`"), "{err}");
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn background_stays_on_the_persons_own_page() {
        let root = write_repo("site-background", &crate::kb::tests::backgrounds()).unwrap();
        super::copy_dir(&Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme"), &root.join("theme")).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        let out = root.join("dist");
        super::build(&root, &kb, &super::Opts { out: out.clone(), dev: false, graph: true }).unwrap();
        let read = |p: &str| std::fs::read_to_string(out.join(p)).unwrap_or_default();
        let page = read("e/zoe/index.html");
        assert!(page.contains("Raised Catholic") && page.contains(">Background<"), "{page}");
        // never a link, a node, a search entry or a story line (ADR-0016)
        for file in ["data/graph.json", "data/graph-slim.json", "data/schema.json", "data/search/0.json", "data/e/zoe.json"] {
            let text = read(file);
            assert!(!text.is_empty() && !text.contains("Raised Catholic") && !text.contains("Leeds"), "{file}");
        }
        for e in walkdir::WalkDir::new(&out).into_iter().filter_map(Result::ok).filter(|e| e.file_type().is_file()) {
            let p = e.path().strip_prefix(&out).unwrap().to_string_lossy().replace('\\', "/");
            if p != "e/zoe/index.html" {
                let text = std::fs::read_to_string(e.path()).unwrap_or_default();
                assert!(!text.contains("Raised Catholic"), "{p} repeats a background line");
            }
        }
    }

    #[test]
    fn question_pages_say_their_scope_and_prove_every_line() {
        let root = write_repo("site-questions", &crate::answers::tests::world()).unwrap();
        super::copy_dir(&Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme"), &root.join("theme")).unwrap();
        let (kb, _) = crate::load_kb(&root).unwrap();
        let out = root.join("dist");
        super::build(&root, &kb, &super::Opts { out: out.clone(), dev: false, graph: true }).unwrap();
        let read = |p: &str| std::fs::read_to_string(out.join(p)).unwrap_or_default();
        // exactly the answers that reach `min` names or two accounts; never "behind" a person
        let mut pages: Vec<String> = walkdir::WalkDir::new(out.join("q"))
            .into_iter()
            .filter_map(Result::ok)
            .filter(|e| e.file_name() == "index.html" && e.depth() == 3)
            .map(|e| e.path().parent().unwrap().strip_prefix(&out).unwrap().to_string_lossy().replace('\\', "/"))
            .collect();
        pages.sort();
        assert_eq!(pages, ["q/behind/party", "q/behind/reds", "q/benefited/fall", "q/why/fall"]);
        assert!(!out.join("q/behind/ann").exists() && !out.join("q/behind/party-press").exists());
        assert!(read("_headers").contains("X-Content-Type-Options: nosniff"), "security headers for the host");
        // every entry of a type, A to Z, on its own page
        let orgs = read("t/org/index.html");
        let at = |name: &str| orgs.find(&format!(">{name}</a>")).unwrap_or(usize::MAX);
        assert!(at("Kaiser") < at("Lex") && at("Lex") < at("Party") && at("Party") < at("Vox"), "A to Z");
        for (page, shows) in [("q/behind/party", "Shows documented founders and funders."), ("q/why/fall", "Shows causes on the record, then each account&#x27;s.")] {
            let html = read(&format!("{page}/index.html"));
            assert!(html.contains(shows) && html.contains("A connection is not evidence of wrongdoing."), "{page}: scope and notice");
            assert!(html.len() <= 80 * 1024, "{page} is {} bytes", html.len());
            let lines: Vec<&str> = html.split("<li class=\"claim ").skip(1).map(|li| &li[..li.find("</li>").unwrap()]).collect();
            assert!(!lines.is_empty());
            for li in lines {
                assert!(li.contains("href=\"#src-") && li.contains("class=\"badge tier\""), "{page}: a line without proof: {li}");
            }
        }
        let why = read("q/why/fall/index.html");
        assert!(why.contains("Named in 3 of the 3 accounts recorded here:") && why.contains(">Disputed</h2>") && why.contains(">Being verified</h2>"));
        // a column quotes its own account only: the coup's one quote belongs to none of its three
        assert!(why.contains("<mark>Oil did it.</mark></q>") && !why.contains("<mark>The coup did it.</mark></q>"));
        assert!(read("q/behind/party/index.html").contains("as the Reds (until Mar 1918)"));
        for q in ["connected", "behind", "why", "benefited"] {
            assert!(read(&format!("q/{q}/index.html")).contains("A connection is not evidence of wrongdoing."), "index of {q}");
        }
        // question pages are ordinary search entries, and an entry's detail file lists them
        let index: Value = serde_json::from_str(&read("data/search/index.json")).unwrap();
        assert_eq!(index["files"], json!([""]), "one search file while everything fits");
        let mut search: Vec<Value> = serde_json::from_str::<Value>(&read("data/search/0.json")).unwrap()["entries"].as_array().unwrap().clone();
        search.sort_by_key(|e| e["rank"].as_u64());
        let asked: Vec<&str> = search.iter().filter(|e| e["type"] == "question").map(|e| e["name"].as_str().unwrap()).collect();
        assert_eq!(asked, ["Who is behind Party?", "Who is behind the Reds?", "Why did Fall happen?", "Who benefited from Fall?"]);
        let party = search.iter().find(|e| e["id"] == "party").unwrap();
        assert_eq!(party["q"], json!(["behind"]));
        let details: Value = serde_json::from_str(&read("data/e/party.json")).unwrap();
        assert_eq!(details["asked"][0]["url"], "/q/behind/party/");
        assert!(!read("data/schema.json").contains("\"pages\""), "which entries have pages is in their own files");
        let graph: Value = serde_json::from_str(&read("data/graph.json")).unwrap();
        assert_eq!(graph["stories"]["questions"], json!(["behind/party", "behind/reds", "why/fall"]));
        assert_eq!(graph["questions"][2]["pages"]["fall"]["accounts"], 3);
        let _ = std::fs::remove_dir_all(&root);
    }

    #[test]
    fn script_json_cannot_break_out_of_its_script() {
        let shots = json!([{ "narration": "<!--<script>alert(1)</script>", "note": "</script><script>x()</script> & &amp; <b>" }]);
        let out = script_json(&shots).unwrap();
        assert!(!out.contains(['<', '>', '&']), "{out}");
        assert!(out.contains("\\u003c!--\\u003cscript\\u003e"), "{out}");
        assert_eq!(serde_json::from_str::<Value>(&out).unwrap(), shots, "the escapes read back as the same JSON");
    }

    #[test]
    fn counts_read_one_date_not_one_dates() {
        let mut env = minijinja::Environment::new();
        env.set_loader(minijinja::path_loader(Path::new(env!("CARGO_MANIFEST_DIR")).join("../../theme/templates")));
        let out = env
            .render_str(
                r#"{% from "macros.html" import count %}{{ count(1, "date") }}, {{ count(2, "date") }}, {{ count(0, "scene") }}, {{ count(1, "entry", "entries") }}, {{ count(3, "entry", "entries") }}"#,
                (),
            )
            .unwrap();
        assert_eq!(out, "1 date, 2 dates, 0 scenes, 1 entry, 3 entries");
    }
}
