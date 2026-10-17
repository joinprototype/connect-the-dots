//! Answers to the questions in `content/schema/questions.yaml` ("Who is behind X?", "Why did X
//! happen?"). The engine knows no question words: a question lists the relations that answer it,
//! in groups whose labels readers see. One `Answer` feeds the page, its story, the rows on entity
//! pages and graph.json, so they never disagree (docs/decisions/0015-ask-anything.md).
//!
//! Where a line goes:
//! - published and nobody's account: on the record, by group, "Both sides agree" first;
//! - published and someone's account (`according_to`): in each account's column, A–Z;
//! - disputed: under Disputed, with its reason; a draft: last, as "Being verified";
//! - withdrawn: nowhere. Disputed lines and drafts are never counted.
//!
//! An earlier form of X (whatever became X through an `identity` relation, up to three steps
//! back) answers for X: the CPSU's page includes what was recorded about the Bolsheviks.

use std::collections::{HashMap, HashSet};

use crate::{
    edtf::Span,
    kb::{Edge, EdgeSrc, Entity, Kb},
    paths::Params,
    schema::Question,
};

/// Lines kept per group on the record, and per account column. What a cap cuts is counted.
pub const PER_GROUP: usize = 8;
pub const PER_ACCOUNT: usize = 6;
/// Account columns per page (the accounts with the most lines stay).
pub const COLUMNS: usize = 12;
/// Pages per question, richest first; featured pages are always kept.
pub const MAX_PAGES: usize = 5000;
/// How many identity steps back an answer looks for earlier forms.
const MAX_FORMS: usize = 3;

/// One link that answers the question.
#[derive(Clone, Copy)]
pub struct Line<'a> {
    pub edge: &'a Edge,
    /// The entry the line names: the link's other end.
    pub other: &'a str,
    /// True when the subject owns the claim, so the line reads "<other> <inverse> X".
    pub outgoing: bool,
    /// Index into the question's groups.
    pub group: usize,
    /// For a line about an earlier form of X: the identity link that joins that form on.
    pub form: Option<&'a Edge>,
    /// The link's date, or, for a link that carries no time between two entries of the same
    /// type (an event caused by an event), the other entry's own dates.
    pub when: Option<&'a Span>,
    cost: f64,
}

impl Line<'_> {
    /// The link read from the other end, toward X: "founded", "invested in", "caused", "led to".
    pub fn phrase<'k>(&self, kb: &'k Kb) -> &'k str {
        let r = &kb.schema.relations[&self.edge.rel];
        if self.outgoing { &r.inverse } else { &r.label }
    }

    /// The line's date; undated on an earlier form, when that form was renamed.
    pub fn date(&self) -> Option<&Span> {
        self.when.or(self.form.and_then(|f| f.when.as_ref()))
    }

    fn start(&self) -> f64 {
        self.date().map_or(f64::MAX, |w| w.start)
    }
}

/// A list of lines after its cap: `more` counts the lines the cap cut.
#[derive(Default)]
pub struct Part<'a> {
    pub lines: Vec<Line<'a>>,
    pub more: usize,
}

pub struct Answer<'a> {
    /// Index into `kb.schema.questions`.
    pub q: usize,
    pub x: &'a Entity,
    /// One part per question group, in the question's order (a part may be empty).
    pub records: Vec<Part<'a>>,
    /// Account columns, A–Z by name: (whose account, its lines).
    pub accounts: Vec<(&'a str, Part<'a>)>,
    pub more_accounts: usize,
    /// Names that two or more accounts give in the same group: (group, name, how many), most first.
    pub shared: Vec<(usize, &'a str, usize)>,
    pub disputed: Part<'a>,
    pub drafts: Part<'a>,
    /// Groups no line answers at all.
    pub unanswered: Vec<usize>,
    /// Published lines (on the record or in an account), each link once.
    pub links: usize,
    /// Distinct entries those lines name.
    pub names: usize,
}

impl<'a> Answer<'a> {
    pub fn accounts_total(&self) -> usize {
        self.accounts.len() + self.more_accounts
    }

    /// `min` names, or two accounts, earn a page.
    pub fn earns_page(&self, q: &Question) -> bool {
        self.names >= q.min || self.accounts_total() >= 2
    }

    /// `<question>/<entity id>`: the page's id in graph.json, featured.yaml and its URL.
    pub fn id(&self, kb: &Kb) -> String {
        format!("{}/{}", kb.schema.questions[self.q].id, self.x.id)
    }

    /// Every published line: the record, then each account's column.
    pub fn published(&self) -> impl Iterator<Item = &Line<'a>> {
        self.records.iter().flat_map(|p| &p.lines).chain(self.accounts.iter().flat_map(|(_, p)| &p.lines))
    }

    /// The entries published lines name, strongest link first, each once.
    pub fn names_by_strength(&self) -> Vec<&'a str> {
        let mut lines: Vec<&Line> = self.published().collect();
        lines.sort_by(|a, b| a.cost.total_cmp(&b.cost).then_with(|| a.other.cmp(b.other)));
        let mut seen = HashSet::new();
        lines.into_iter().map(|l| l.other).filter(|o| seen.insert(*o)).collect()
    }
}

/// The question asked about one entry: "Who is behind the Bolsheviks?" (`in_sentence` when set).
pub fn title(kb: &Kb, q: &Question, x: &str) -> String {
    q.ask.replace("{x}", &kb.sentence_name(x))
}

/// Whether a citation speaks for `who`: its quote is their words (`by`), or the source is published
/// by them (`voice`) or written by them (`author`).
fn speaks_for(kb: &Kb, s: &EdgeSrc, who: &str) -> bool {
    s.by.as_deref() == Some(who) || kb.sources.get(&s.id).is_some_and(|src| src.voice == who || src.author.as_deref() == Some(who))
}

/// The source words a line may be quoted with. Under an account: only a source that speaks for
/// that account, so nobody else's words ever appear under its name. Elsewhere: the first quote.
pub fn own_words<'e>(kb: &Kb, e: &'e Edge, account: Option<&str>) -> Option<&'e EdgeSrc> {
    let mut quoted = e.sources.iter().filter(|s| s.quote.is_some());
    match account {
        Some(who) => quoted.find(|s| speaks_for(kb, s, who)),
        None => quoted.next(),
    }
}

/// The strongest tier behind a line as shown. Under an account, another account's own words do
/// not count, so one side never borrows another's proof.
pub fn tier<'k>(kb: &'k Kb, e: &Edge, account: Option<&str>) -> Option<&'k str> {
    let borrowed = |s: &EdgeSrc| account.is_some_and(|who| e.according_to.iter().any(|o| o != who && speaks_for(kb, s, o)));
    e.sources
        .iter()
        .filter(|s| !borrowed(s))
        .filter_map(|s| kb.sources.get(&s.id))
        .map(|s| s.tier.as_str())
        .min_by_key(|t| kb.schema.tier_rank(t))
}

/// The scope line every answer prints: ["Shows documented founders, ….", "Not who made decisions, or why."].
pub fn scope(q: &Question) -> [String; 2] {
    let clean = |s: &str| s.trim().trim_end_matches('.').to_string();
    [format!("Shows {}.", clean(&q.shows)), format!("Not {}.", clean(&q.not))]
}

/// The question with its blanks shown as "…": "Who is behind …?".
pub fn blank(q: &Question) -> String {
    q.ask.replace("{x}", "…").replace("{a}", "…").replace("{b}", "…")
}

/// The words before the first blank: "Who is behind", for the Ask picker.
pub fn label(q: &Question) -> &str {
    q.ask.split('{').next().unwrap_or_default().trim()
}

/// The answer about `x`, page or not; `None` when the question is not asked about its type.
pub fn answer<'a>(kb: &'a Kb, qi: usize, x: &str) -> Option<Answer<'a>> {
    let q = kb.schema.questions.get(qi)?;
    let e = kb.entity(x)?;
    (!q.route && q.subjects.contains(&e.kind)).then(|| build(kb, &Params::from(&kb.schema.methodology), qi, e))
}

/// Every answer that earns a page, question by question: featured first, then the richest,
/// at most `MAX_PAGES` per question.
pub fn pages(kb: &Kb) -> Vec<Answer<'_>> {
    let p = Params::from(&kb.schema.methodology);
    let mut out = Vec::new();
    for (qi, q) in kb.schema.questions.iter().enumerate().filter(|(_, q)| !q.route) {
        let mut found: Vec<(bool, Answer)> = kb
            .entities
            .iter()
            .filter(|e| q.subjects.contains(&e.kind))
            .map(|e| build(kb, &p, qi, e))
            .filter(|a| a.earns_page(q))
            .map(|a| (kb.featured.questions.contains(&a.id(kb)), a))
            .collect();
        found.sort_by(|(fa, a), (fb, b)| {
            fb.cmp(fa).then(b.links.cmp(&a.links)).then(b.accounts_total().cmp(&a.accounts_total())).then_with(|| a.x.id.cmp(&b.x.id))
        });
        out.extend(found.into_iter().take(MAX_PAGES).map(|(_, a)| a));
    }
    out
}

/// X, then its earlier forms: whatever became X through an identity link, up to `MAX_FORMS`
/// steps back, each with the link that joins it on.
fn forms<'a>(kb: &'a Kb, x: &'a str) -> Vec<(&'a str, Option<&'a Edge>)> {
    let mut out: Vec<(&str, Option<&Edge>)> = vec![(x, None)];
    let mut frontier = vec![x];
    for _ in 0..MAX_FORMS {
        let mut next = Vec::new();
        for f in frontier {
            for (e, outgoing) in kb.links_of(f) {
                let identity = kb.schema.relations[&e.rel].identity;
                if identity && !outgoing && e.status == "published" && !out.iter().any(|(id, _)| *id == e.from) {
                    out.push((&e.from, Some(e)));
                    next.push(e.from.as_str());
                }
            }
        }
        frontier = next;
    }
    out
}

fn build<'a>(kb: &'a Kb, p: &Params, qi: usize, x: &'a Entity) -> Answer<'a> {
    let q = &kb.schema.questions[qi];
    let forms = forms(kb, &x.id);
    let mut lines = Vec::new();
    for &(form, via) in &forms {
        for (e, outgoing) in kb.links_of(form) {
            let Some(group) = q.groups.iter().position(|g| if outgoing { &g.out } else { &g.into }.contains(&e.rel)) else { continue };
            let other = e.other(outgoing);
            // withdrawn links never appear, and an account is quoted or left off (`ctd check` warns)
            let unquoted = !e.according_to.is_empty() && e.sources.iter().all(|s| s.quote.is_none());
            if e.status == "deprecated" || e.sources.is_empty() || unquoted || forms.iter().any(|(f, _)| *f == other) {
                continue;
            }
            let own_time = !kb.schema.relations[&e.rel].temporal;
            let when = e.when.as_ref().or_else(|| kb.entity(other).filter(|o| own_time && o.kind == x.kind).and_then(|o| o.when.as_ref()));
            lines.push(Line { edge: e, other, outgoing, group, form: via, when, cost: p.link_cost(e) });
        }
    }

    let mut answered = vec![false; q.groups.len()];
    let mut records: Vec<Vec<Line>> = vec![Vec::new(); q.groups.len()];
    let mut columns: HashMap<&str, Vec<Line>> = HashMap::new();
    let (mut disputed, mut drafts) = (Vec::new(), Vec::new());
    for l in lines {
        answered[l.group] = true;
        match l.edge.status.as_str() {
            "draft" => drafts.push(l),
            "disputed" => disputed.push(l),
            _ if l.edge.according_to.is_empty() => records[l.group].push(l),
            _ => {
                for who in &l.edge.according_to {
                    columns.entry(who.as_str()).or_default().push(l);
                }
            }
        }
    }

    // counted before any cap: published lines, each link once, and the entries they name
    let published: Vec<&Line> = records.iter().flatten().chain(columns.values().flatten()).collect();
    let links = published.iter().map(|l| &l.edge.id).collect::<HashSet<_>>().len();
    let names = published.iter().map(|l| l.other).collect::<HashSet<_>>().len();
    // a name agrees across accounts only within one group: "gained" and "lost" never add up
    let mut named: HashMap<(usize, &str), usize> = HashMap::new();
    for col in columns.values() {
        for key in col.iter().map(|l| (l.group, l.other)).collect::<HashSet<_>>() {
            *named.entry(key).or_default() += 1;
        }
    }
    let mut shared: Vec<(usize, &str, usize)> = named.into_iter().filter(|&(_, n)| n >= 2).map(|((g, o), n)| (g, o, n)).collect();
    shared.sort_by(|a, b| b.2.cmp(&a.2).then(a.0.cmp(&b.0)).then_with(|| kb.name_of(a.1).cmp(&kb.name_of(b.1))));

    // the accounts with the most lines keep a column; columns then read A–Z, none ranked first
    let mut columns: Vec<(&str, Vec<Line>)> = columns.into_iter().collect();
    columns.sort_by(|a, b| b.1.len().cmp(&a.1.len()).then_with(|| a.0.cmp(b.0)));
    let more_accounts = columns.len().saturating_sub(COLUMNS);
    columns.truncate(COLUMNS);
    columns.sort_by_cached_key(|(who, _)| kb.name_of(who).to_lowercase());

    Answer {
        q: qi,
        x,
        records: records.into_iter().map(|l| keep(l, PER_GROUP)).collect(),
        accounts: columns.into_iter().map(|(who, l)| (who, keep(l, PER_ACCOUNT))).collect(),
        more_accounts,
        shared,
        disputed: keep(disputed, PER_GROUP),
        drafts: keep(drafts, PER_GROUP),
        unanswered: (0..q.groups.len()).filter(|&g| !answered[g]).collect(),
        links,
        names,
    }
}

/// The `cap` strongest lines (cheapest by the methodology), shown by date, "Both sides agree" first.
fn keep(mut lines: Vec<Line>, cap: usize) -> Part {
    lines.sort_by(|a, b| a.cost.total_cmp(&b.cost).then_with(|| a.edge.id.cmp(&b.edge.id)));
    let more = lines.len().saturating_sub(cap);
    lines.truncate(cap);
    lines.sort_by(|a, b| {
        b.edge.cross_confirmed.cmp(&a.edge.cross_confirmed).then(a.start().total_cmp(&b.start())).then_with(|| a.other.cmp(b.other))
    });
    Part { lines, more }
}

#[cfg(test)]
pub(crate) mod tests {
    use super::*;
    use crate::testkit::{File, entity, file, load, source, try_load};

    pub(crate) const QUESTIONS: &str = "banned_words: [mastermind, puppet, secretly]\nquestions:\n\
        \x20 - {id: connected, ask: \"How is {a} connected to {b}?\", route: true, shows: routes of sourced links, not: influence or intent}\n\
        \x20 - id: behind\n    ask: \"Who is behind {x}?\"\n    subjects: [org, event]\n    shows: documented founders and funders\n    not: who made decisions\n    min: 2\n\
        \x20   groups: [{label: Founded by, in: [founded]}, {label: Money in, in: [funded]}]\n\
        \x20 - id: why\n    ask: \"Why did {x} happen?\"\n    subjects: [event]\n    shows: causes on the record, then each account's\n    not: a single settled cause\n    min: 2\n\
        \x20   groups: [{label: Causes, out: [caused_by], in: [led_to]}]\n\
        \x20 - id: benefited\n    ask: \"Who benefited from {x}?\"\n    subjects: [event]\n    shows: who gained or lost\n    not: that anyone caused it\n\
        \x20   groups: [{label: Gained, in: [benefited_from], empty: No account here says who gained.}, {label: Lost, in: [harmed_by], empty: No account here says who lost.}]\n";

    /// A schema with questions: people, orgs and events; founding, funding, renaming and causes.
    pub(crate) fn schema() -> Vec<File> {
        vec![
            file(
                "content/schema/entity-types.yaml",
                "person: {label: Person, plural: People, layer: people, family: true}\norg: {label: Organization, plural: Organizations, layer: power}\n\
                 event: {label: Event, plural: Events, layer: power}\n",
            ),
            file(
                "content/schema/relations.yaml",
                "relative_of: {label: relative of, inverse: relative of, from: [person], to: [person], layers: [people], qualifiers: [role], sensitive: true, kinship: true}\n\
                 founded: {label: founded, inverse: founded by, from: [person, org], to: [org, event], layers: [power], temporal: true}\n\
                 funded: {label: funded, inverse: funded by, from: [person, org], to: [org, event], layers: [power], temporal: true}\n\
                 became: {label: became, inverse: formerly, from: [org], to: [org], layers: [power], temporal: true, identity: true}\n\
                 caused_by: {label: caused by, inverse: caused, from: [event], to: [event], layers: [power]}\n\
                 led_to: {label: led to, inverse: followed from, from: [event], to: [event], layers: [power]}\n\
                 benefited_from: {label: benefited from, inverse: benefited, from: any, to: [event], layers: [power], attributed: true, traversable: false}\n\
                 harmed_by: {label: harmed by, inverse: harmed, from: any, to: [event], layers: [power], attributed: true, traversable: false}\n",
            ),
            file("content/schema/questions.yaml", QUESTIONS),
            file("content/methodology/paths.yaml", "version: test\nbeta: 1.0\nevidence: {T1: 1.0, T2: 0.8, T3: 0.4, draft_factor: 0.5}\n"),
            source("rec", "T1"),
            source("press", "T2"),
        ]
    }

    pub(crate) fn event(id: &str, name: &str, when: &str, claims: &str) -> File {
        let claims = if claims.is_empty() { " []\n".to_string() } else { format!("\n{claims}") };
        file(&format!("content/entities/event/{}/{id}.md", &id[..2]), &format!("---\nid: {id}\ntype: event\nname: {name}\nwhen: \"{when}\"\nclaims:{claims}---\n"))
    }

    /// A party renamed in 1918 (Reds → Party), its founders and funders, and an event with a
    /// record cause, three accounts naming one cause, a disputed cause and a draft.
    pub(crate) fn world() -> Vec<File> {
        let mut files = schema();
        files.extend([
            entity("person", "ann", "Ann", "  - {id: c1, rel: founded, to: reds, when: 1903, src: [{s: rec}]}\n  - {id: c2, rel: relative_of, to: bob, role: mother, src: [{s: rec}]}\n"),
            entity("person", "bob", "Bob", "  - {id: c1, rel: founded, to: party, when: 1920, src: [{s: rec}]}\n"),
            entity("org", "kaiser", "Kaiser", "  - {id: c1, rel: funded, to: reds, when: 1917, note: How much arrived is debated., src: [{s: rec}]}\n"),
            entity(
                "person",
                "sam",
                "Sam",
                "  - {id: c1, rel: funded, to: reds, when: 1917, according_to: [vox], status: disputed, reason: A cable says otherwise., src: [{s: rec, quote: \"Sam paid.\"}]}\n",
            ),
            file(
                "content/entities/org/re/reds.md",
                "---\nid: reds\ntype: org\nname: Reds\nin_sentence: the Reds\nwhen: \"1903/1918-03\"\nclaims:\n  - {id: c1, rel: became, to: party, when: 1918-03, src: [{s: rec}]}\n---\n",
            ),
            entity("org", "party", "Party", "  - {id: c1, rel: funded, to: party-press, src: [{s: rec}]}\n"),
            entity("org", "party-press", "Party press", ""),
            entity("org", "vox", "Vox", ""),
            entity("org", "lex", "Lex", ""),
            entity("org", "rex", "Rex", ""),
            event(
                "fall",
                "Fall",
                "1991-12",
                "  - {id: c1, rel: caused_by, to: coup, according_to: [vox, lex, rex], src: [{s: press, quote: \"The coup did it.\"}]}\n\
                 \x20 - {id: c2, rel: caused_by, to: oil, according_to: [lex], src: [{s: lex-memo, quote: \"Oil did it.\"}]}\n\
                 \x20 - {id: c3, rel: caused_by, to: famine, according_to: [rex], status: disputed, reason: No record shows it., src: [{s: press, quote: \"Famine.\"}]}\n\
                 \x20 - {id: c4, rel: caused_by, to: war, status: draft, src: [{s: press}]}\n\
                 \x20 - {id: c5, rel: caused_by, to: war, according_to: [vox], src: [{s: press}]}\n\
                 \x20 - {id: c6, rel: caused_by, to: coup, status: deprecated, reason: Wrong event., src: [{s: press}]}\n",
            ),
            event("treaty", "Treaty", "1991-12-08", "  - {id: c1, rel: led_to, to: fall, src: [{s: rec}]}\n"),
            event("coup", "Coup", "1991-08-19/1991-08-21", ""),
            event("oil", "Oil price collapse", "1986", ""),
            event("famine", "Famine", "1990", ""),
            event("war", "War", "1979/1989", ""),
            entity("org", "usa", "USA", "  - {id: c1, rel: benefited_from, to: fall, according_to: [vox], src: [{s: rec, quote: \"We won.\"}]}\n"),
            // Lex's own words: a source whose voice is Lex
            file("content/sources/le/lex-memo.yaml", "id: lex-memo\ntitle: Lex memo\ntier: T2\nvoice: lex\nurl: https://example.org/lex\n"),
        ]);
        files
    }

    fn names(kb: &Kb, part: &Part) -> Vec<String> {
        part.lines.iter().map(|l| kb.name_of(l.other)).collect()
    }

    #[test]
    fn lines_follow_each_group_direction_and_earlier_forms() {
        let (kb, diags) = load("answers-forms", &world());
        assert!(crate::testkit::said(&diags, "in_sentence").is_empty());
        let behind = answer(&kb, 1, "party").unwrap();
        // Bob founded the Party itself; Ann founded it as the Reds, before the 1918 renaming
        let founded = &behind.records[0];
        assert_eq!(names(&kb, founded), ["Ann", "Bob"]);
        let ann = &founded.lines[0];
        assert_eq!(ann.form.map(|f| f.from.as_str()), Some("reds"));
        assert_eq!(ann.phrase(&kb), "founded");
        // the Party funding its own press points away from it: not an answer to "behind"
        assert_eq!(names(&kb, &behind.records[1]), ["Kaiser"]);
        assert_eq!((behind.links, behind.names), (3, 3));
        assert_eq!(names(&kb, &behind.disputed), ["Sam"], "a disputed line goes apart and is not counted");
        assert!(behind.earns_page(&kb.schema.questions[1]));

        // "why" reads caused_by from the event and led_to toward it
        let why = answer(&kb, 2, "fall").unwrap();
        assert_eq!(names(&kb, &why.records[0]), ["Treaty"]);
        assert_eq!(why.records[0].lines[0].phrase(&kb), "led to");
        assert!(answer(&kb, 1, "ann").is_none(), "never asked about people");
        assert_eq!(title(&kb, &kb.schema.questions[1], "reds"), "Who is behind the Reds?");
        assert_eq!(label(&kb.schema.questions[2]), "Why did");
    }

    #[test]
    fn one_line_sits_in_each_account_that_gives_it() {
        let (kb, _) = load("answers-columns", &world());
        let why = answer(&kb, 2, "fall").unwrap();
        let cols: Vec<(String, Vec<String>)> = why.accounts.iter().map(|(who, p)| (kb.name_of(who), names(&kb, p))).collect();
        // A–Z, none ranked first; the coup is one link in three columns
        assert_eq!(cols, [("Lex".into(), vec!["Oil price collapse".into(), "Coup".into()]), ("Rex".into(), vec!["Coup".into()]), ("Vox".into(), vec!["Coup".into()])]);
        assert_eq!(why.shared, [(0, "coup", 3)]);
        assert_eq!(why.accounts_total(), 3);
        // the record, the coup and the oil: the unquoted account (war, per Vox) is left off
        assert_eq!((why.links, why.names), (3, 3));
    }

    #[test]
    fn an_account_quotes_and_ranks_only_its_own_sources() {
        let mut files = world();
        files.extend([
            file("content/sources/ga/gazette.yaml", "id: gazette\ntitle: Gazette\ntier: T1\nauthor: rex\nurl: https://example.org/gazette\n"),
            event(
                "thaw",
                "Thaw",
                "1989",
                "  - {id: c1, rel: caused_by, to: coup, according_to: [lex, rex, vox], src: [{s: gazette, quote: \"Rex wrote it.\"}, {s: lex-memo, quote: \"Lex wrote it.\"}, {s: press, quote: \"A reporter wrote it.\"}]}\n",
            ),
            entity(
                "org",
                "rus",
                "Rus",
                "  - {id: c1, rel: benefited_from, to: fall, according_to: [vox], src: [{s: press, quote: \"Rus won.\"}]}\n  - {id: c2, rel: harmed_by, to: fall, according_to: [lex], src: [{s: press, quote: \"Rus lost.\"}]}\n",
            ),
            // a reporter quoting Rex's own words, and a `by` that names nobody
            event(
                "melt",
                "Melt",
                "1990",
                "  - {id: c1, rel: caused_by, to: coup, according_to: [rex], src: [{s: press, quote: \"Rex told us so.\", by: rex}, {s: rec, by: nobody}]}\n",
            ),
        ]);
        let (kb, diags) = load("answers-own-words", &files);
        assert_eq!(crate::testkit::said(&diags, "`by: nobody` needs a quote").len(), 1);
        let edge = |id: &str| kb.edges.iter().find(|e| e.id == id).unwrap();
        let thaw = edge("thaw#c1");
        let quote = |who| own_words(&kb, thaw, Some(who)).and_then(|s| s.quote.as_deref());
        // a source speaks for its author and its voice; a reporter's words are nobody's account
        assert_eq!((quote("rex"), quote("lex"), quote("vox")), (Some("Rex wrote it."), Some("Lex wrote it."), None));
        assert!(own_words(&kb, edge("usa#c1"), Some("vox")).is_none(), "a line that is one account's alone still never quotes a third party");
        let melt = own_words(&kb, edge("melt#c1"), Some("rex")).and_then(|s| s.quote.as_deref());
        assert_eq!(melt, Some("Rex told us so."), "a report may carry an account's own words, marked `by`");
        // a column never shows the tier of another account's own source
        let tier = |who| tier(&kb, thaw, who);
        assert_eq!((tier(None), tier(Some("rex")), tier(Some("lex")), tier(Some("vox"))), (Some("T1"), Some("T1"), Some("T2"), Some("T2")));
        // "gained" in one account and "lost" in another never add up to agreement
        assert!(answer(&kb, 3, "fall").unwrap().shared.is_empty());
    }

    #[test]
    fn drafts_and_disputed_lines_are_shown_apart_and_never_counted() {
        let (kb, _) = load("answers-status", &world());
        let why = answer(&kb, 2, "fall").unwrap();
        assert_eq!(names(&kb, &why.disputed), ["Famine"]);
        assert_eq!(names(&kb, &why.drafts), ["War"]);
        assert!(why.published().all(|l| l.edge.status == "published"));
        assert!(!why.published().chain(&why.disputed.lines).chain(&why.drafts.lines).any(|l| l.edge.id == "fall#c6"), "withdrawn: never shown");
        let shown = why.published().count() + why.disputed.lines.len() + why.drafts.lines.len();
        assert_eq!(shown, 7, "the record, four column entries, one disputed and one draft");
    }

    #[test]
    fn a_line_takes_its_links_date_or_the_cause_events_own_dates() {
        let (kb, _) = load("answers-time", &world());
        let why = answer(&kb, 2, "fall").unwrap();
        let lex = &why.accounts[0].1;
        // a cause is an event with its own dates; shown by date, oil (1986) before the coup (1991)
        let when: Vec<&str> = lex.lines.iter().map(|l| l.when.map_or("", |w| w.label.as_str())).collect();
        assert_eq!(when, ["1986", "19–21 Aug 1991"]);
        let behind = answer(&kb, 1, "party").unwrap();
        // a dated link keeps its own date, even before the Party existed: lines are never filtered by time
        assert_eq!(behind.records[0].lines[0].when.map(|w| w.label.as_str()), Some("1903"));
        // a person's lifespan is never a line's date
        let benefited = answer(&kb, 3, "fall").unwrap();
        assert_eq!(benefited.accounts[0].1.lines[0].when.map(|w| w.label.clone()), None);
        assert_eq!(benefited.unanswered, [1], "nobody here says who lost");
    }

    #[test]
    fn caps_keep_the_strongest_and_count_exactly_what_they_cut() {
        let mut files = schema();
        for i in 0..PER_GROUP + 3 {
            let id = format!("f{i:02}");
            // the first three have only press sources: weaker evidence, so they are the ones cut
            let src = if i < 3 { "press" } else { "rec" };
            files.push(entity("org", &id, &id.to_uppercase(), &format!("  - {{id: c1, rel: funded, to: acme, when: {}, src: [{{s: {src}}}]}}\n", 2000 + i)));
        }
        files.push(entity("org", "acme", "Acme", ""));
        let (kb, _) = load("answers-caps", &files);
        let a = answer(&kb, 1, "acme").unwrap();
        let money = &a.records[1];
        assert_eq!((money.lines.len(), money.more), (PER_GROUP, 3));
        assert!(money.lines.iter().all(|l| l.edge.tier.as_deref() == Some("T1")), "the strongest survive");
        assert!(money.lines.windows(2).all(|w| w[0].start() <= w[1].start()), "survivors show by date");
        assert_eq!(a.links, PER_GROUP + 3, "counts are taken before any cap");
    }

    #[test]
    fn pages_need_min_names_or_two_accounts() {
        let (kb, _) = load("answers-pages", &world());
        let ids: Vec<String> = pages(&kb).iter().map(|a| a.id(&kb)).collect();
        // the Party (three names, one through the Reds) and the Reds (two) reach `min: 2`; the Party
        // press (one name) does not, and people are never asked about. The fall has three names
        // for "why", and one, enough for `min: 1`, for "benefited".
        assert_eq!(ids, ["behind/party", "behind/reds", "why/fall", "benefited/fall"]);
    }

    #[test]
    fn questions_are_checked_when_the_schema_loads() {
        let bad = |name: &str, from: &str, to: &str| {
            let mut files = world();
            files.retain(|f| f.0 != "content/schema/questions.yaml");
            files.push(file("content/schema/questions.yaml", &QUESTIONS.replace(from, to)));
            try_load(name, &files).err().map(|e| e.to_string()).unwrap_or_default()
        };
        assert!(bad("q-kin", "in: [funded]", "in: [funded, relative_of]").contains("family"), "family never answers a question");
        assert!(bad("q-rel", "in: [funded]", "in: [paid]").contains("unknown relation `paid`"));
        assert!(bad("q-twice", "in: [funded]", "in: [founded]").contains("listed twice"));
        assert!(bad("q-hole", "Who is behind {x}?", "Who is behind it?").contains("`ask` must contain {x}"));
        assert!(bad("q-mark", "Who is behind {x}?", "Who is behind {x}").contains("end with"));
        assert!(bad("q-shows", "    shows: documented founders and funders\n", "").contains("missing field `shows`"));
        assert!(bad("q-not", "not: a single settled cause", "not: \"\"").contains("needs `shows` and `not`"));
        assert!(bad("q-word", "documented founders", "secretly documented founders").contains("banned word `secretly`"));
        assert!(bad("q-type", "subjects: [event]\n    shows: causes", "subjects: [event, org]\n    shows: causes").contains("no relation in its groups reaches type `org`"));
        assert!(bad("q-people", "subjects: [org, event]", "subjects: [org, event, person]").contains("never asked about people"));
        assert!(bad("q-slug", "id: why", "id: ../why").contains("lowercase letters"), "an id is a path in the built site");
        assert!(bad("q-field", "    min: 2\n", "    min: 2\n    further: 1\n").contains("unknown field `further`"));
        assert_eq!(bad("q-good", "", ""), "");
    }

    #[test]
    fn featured_questions_name_pages_that_exist() {
        let mut files = world();
        files.push(file("content/featured.yaml", "questions: [behind/party, behind/party, behind/party-press, behind/ann, why/nope, connected/ann, party]\n"));
        let (kb, diags) = load("answers-featured", &files);
        assert_eq!(kb.featured.questions, ["behind/party", "behind/party-press", "behind/ann"]);
        let said = |m: &str| crate::testkit::said(&diags, m).len();
        assert_eq!((said("listed twice"), said("has no page"), said("unknown entity `nope`")), (1, 2, 1));
        assert_eq!((said("`connected` is not a question with pages"), said("must be `<question>/<entity id>`")), (1, 1));
    }

    #[test]
    fn in_sentence_only_adds_the_and_identity_keeps_the_type() {
        let mut files = schema();
        files.extend([
            file("content/entities/event/fa/fall.md", "---\nid: fall\ntype: event\nname: Fall of the Wall\nin_sentence: the fall of the Wall\n---\n"),
            file("content/entities/event/co/coup.md", "---\nid: coup\ntype: event\nname: August coup\nin_sentence: the putsch\n---\n"),
            file("content/entities/org/pl/pledge.md", "---\nid: pledge\ntype: org\nname: The Pledge\nin_sentence: the Pledge\n---\n"),
            entity("org", "reds", "Reds", "  - {id: c1, rel: became, to: party, src: [{s: rec}]}\n"),
            entity("org", "party", "Party", ""),
        ]);
        let (kb, diags) = load("answers-in-sentence", &files);
        assert_eq!(kb.sentence_name("fall"), "the fall of the Wall");
        assert_eq!(kb.sentence_name("coup"), "August coup", "a different name is refused");
        assert_eq!(kb.sentence_name("pledge"), "the Pledge", "a name that starts with \"The\" may lower it");
        assert_eq!(crate::testkit::said(&diags, "in_sentence `the putsch` must be the name").len(), 1);
        let attributed = file("content/schema/relations.yaml", "became: {label: became, inverse: formerly, from: [org], to: [org], identity: true, attributed: true, traversable: false}\n");
        let err = try_load("answers-identity", &[attributed]).err().expect("an identity is on the record");
        assert!(err.to_string().contains("cannot be `attributed`"), "{err}");
    }
}
