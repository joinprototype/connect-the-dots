//! Loads the vocabulary and methodology from `content/schema/` and `content/methodology/`.

use std::{fs, path::Path};

use anyhow::{Context, Result, anyhow};
use indexmap::IndexMap;
use serde::{Deserialize, Serialize, de::DeserializeOwned};
use sha2::{Digest, Sha256};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Layer {
    pub label: String,
    pub color: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct EntityType {
    pub label: String,
    pub plural: String,
    pub layer: String,
    /// Can have family ties: kinship relations may only join types marked `family`.
    #[serde(default)]
    pub family: bool,
    /// What an entry's own dates are called on its life line ("Life", "Active"); "Span" when unset.
    #[serde(default, skip_serializing)]
    pub span: Option<String>,
    /// Entries of this type are points on the map: they need coords, and stories show them there.
    #[serde(default, skip_serializing)]
    pub map: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Lens {
    pub id: String,
    pub label: String,
    pub view: String,
    pub layers: Vec<String>,
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum TypeSet {
    Keyword(String),
    List(Vec<String>),
}

impl TypeSet {
    pub fn allows(&self, t: &str) -> bool {
        match self {
            TypeSet::Keyword(k) => k == "any",
            TypeSet::List(v) => v.iter().any(|x| x == t),
        }
    }

    pub fn names(&self) -> String {
        match self {
            TypeSet::Keyword(k) => k.clone(),
            TypeSet::List(v) => v.join(", "),
        }
    }
}

fn yes() -> bool {
    true
}

fn from_owner() -> String {
    "from".into()
}

#[derive(Debug, Clone, Deserialize)]
pub struct Relation {
    pub label: String,
    pub inverse: String,
    pub from: TypeSet,
    pub to: TypeSet,
    #[serde(default = "from_owner")]
    pub owner: String,
    #[serde(default)]
    pub layers: Vec<String>,
    #[serde(default)]
    pub temporal: bool,
    #[serde(default)]
    pub qualifiers: Vec<String>,
    #[serde(default = "yes")]
    pub traversable: bool,
    #[serde(default)]
    pub passive: bool,
    #[serde(default)]
    pub sensitive: bool,
    /// Family relations: entity pages gather them into a "Family ties" card.
    #[serde(default)]
    pub kinship: bool,
    /// Interpretations ("benefited from"): every claim must say whose account it is (`according_to`).
    #[serde(default)]
    pub attributed: bool,
    /// The same body under a new name ("became"): question answers about the later form include
    /// what was recorded about the earlier one.
    #[serde(default)]
    pub identity: bool,
    /// The label is not a verb ("CEO of", "born in"): a sentence puts it after a comma.
    #[serde(default)]
    pub noun: bool,
    /// How the inverse reads in a sentence: after a comma unless it is a verb or names a list.
    #[serde(default)]
    pub inverse_reads: Reads,
    /// Shown in a person's "Background" card (born in, citizen of, educated at): ADR-0016.
    #[serde(default)]
    pub background: bool,
    /// A step of a legal case (charged, convicted, settled …), shown in the "Legal records" card
    /// of the one the record is about: ADR-0018.
    #[serde(default)]
    pub legal: bool,
    /// One side saying a study's finding is not shown ("disputes a finding of"): ADR-0019. Each
    /// claim is its owner's own account, quoted in its words, about a work with a `finding`.
    #[serde(default)]
    pub dispute: bool,
    /// A plain sentence shown with records of this relation ("A charge is an accusation, not a
    /// finding of guilt.").
    #[serde(default)]
    pub caveat: Option<String>,
}

/// How a phrase joins a sentence: "Apple, *founded by* Steve Jobs" (after a comma), "The Cold War
/// *includes* …" (a verb) or "Apple, *board members*: Mike Markkula and Arthur Rock" (a list).
#[derive(Debug, Clone, Copy, Default, PartialEq, Eq, Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum Reads {
    #[default]
    Comma,
    Verb,
    List,
}

impl Relation {
    /// "Ronald Wayne *founded* Apple", or, for a phrase that is not a verb, "Mike Markkula, *CEO of* Apple"
    /// (the comma family links use too). `forward: false` reads the link from its target, with the inverse.
    pub fn clause(&self, subject: &str, forward: bool, object: &str) -> String {
        let (phrase, reads) = match forward {
            true => (&self.label, if self.noun { Reads::Comma } else { Reads::Verb }),
            false => (&self.inverse, self.inverse_reads),
        };
        match reads {
            Reads::Verb => format!("{subject} *{phrase}* {object}"),
            Reads::Comma => format!("{subject}, *{phrase}* {object}"),
            Reads::List => format!("{subject}, *{phrase}*: {object}"),
        }
    }
}

/// One labelled group of a question: the relations that answer it. `in` lists links that point
/// at the subject, `out` links the subject owns.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct QuestionGroup {
    pub label: String,
    #[serde(default, rename = "in")]
    pub into: Vec<String>,
    #[serde(default)]
    pub out: Vec<String>,
    /// Links of X to follow one step first: `in` and `out` then read the entries they reach, so a
    /// dispute of a study about X answers a question about X (ADR-0019).
    #[serde(default)]
    pub via: Vec<String>,
    /// Said when no link answers the group; without it an empty group is left out.
    #[serde(default)]
    pub empty: Option<String>,
}

fn one() -> usize {
    1
}

/// A question readers can ask (`content/schema/questions.yaml`). The engine knows no question words.
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Question {
    pub id: String,
    /// The sentence: `{x}` is the subject, `{a}` and `{b}` the two ends of a route.
    pub ask: String,
    /// Answered by ranked routes (the explorer and route stories), not by a page per subject.
    #[serde(default)]
    pub route: bool,
    /// Entity types the question may be asked about.
    #[serde(default)]
    pub subjects: Vec<String>,
    /// What every answer page shows, and what it does not: both are printed on every page.
    pub shows: String,
    pub not: String,
    #[serde(default)]
    pub groups: Vec<QuestionGroup>,
    /// Names an answer needs for its own page (two or more accounts always earn one).
    #[serde(default = "one")]
    pub min: usize,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(deny_unknown_fields)]
struct QuestionsFile {
    #[serde(default)]
    banned_words: Vec<String>,
    #[serde(default)]
    questions: Vec<Question>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Tier {
    pub label: String,
    #[serde(default)]
    pub description: Option<String>,
    #[serde(default)]
    pub rejected: bool,
    /// A primary record: one is enough for a sensitive link or a historical figure's background.
    #[serde(default, skip_serializing)]
    pub primary: bool,
    /// Scholarship or press: two independent voices are enough.
    #[serde(default, skip_serializing)]
    pub strong: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ContestedSet {
    pub id: String,
    pub label: String,
    pub members: Vec<String>,
}

#[derive(Debug, Clone, Default, Deserialize)]
struct PerspectivesFile {
    #[serde(default)]
    contested: Vec<ContestedSet>,
}

/// The colour of anything whose type or layer is unknown.
pub const NEUTRAL: &str = "#7a7266";

pub struct Schema {
    pub contested: Vec<ContestedSet>,
    pub layers: IndexMap<String, Layer>,
    pub types: IndexMap<String, EntityType>,
    pub relations: IndexMap<String, Relation>,
    pub lenses: Vec<Lens>,
    pub tiers: IndexMap<String, Tier>,
    pub methodology: serde_json::Value,
    pub methodology_hash: String,
    /// In Ask-picker order. Empty without `content/schema/questions.yaml`.
    pub questions: Vec<Question>,
    /// Words no question may use ("mastermind", "puppet"): they insinuate.
    pub banned_words: Vec<String>,
}

/// The words of a text, lowercased: "Who is behind {x}?" → ["who", "is", "behind", "x"].
pub fn words(s: &str) -> impl Iterator<Item = String> + '_ {
    s.split(|c: char| !c.is_alphanumeric()).filter(|w| !w.is_empty()).map(str::to_lowercase)
}

/// The rules `ctd` holds questions to: every page says what it shows and what it does not, and
/// no question answers with family, sensitive or index-fund links (family lives on entity pages).
fn check_questions(qs: &[Question], banned: &[String], relations: &IndexMap<String, Relation>, types: &IndexMap<String, EntityType>) -> Result<()> {
    let mut ids = std::collections::HashSet::new();
    for q in qs {
        let id = &q.id;
        let fail = |msg: String| Err(anyhow!("content/schema/questions.yaml: question `{id}`: {msg}"));
        if !ids.insert(id) {
            return fail("listed twice".into());
        }
        // the id is a URL path segment: /q/<id>/
        if !crate::kb::SLUG.is_match(id) {
            return fail("the id must be lowercase letters, digits and single hyphens".into());
        }
        let holes: &[&str] = if q.route { &["{a}", "{b}"] } else { &["{x}"] };
        if !holes.iter().all(|h| q.ask.contains(h)) || !q.ask.trim_end().ends_with('?') {
            return fail(format!("`ask` must contain {} and end with \"?\"", holes.join(" and ")));
        }
        if q.shows.trim().is_empty() || q.not.trim().is_empty() {
            return fail("needs `shows` and `not`: every page says what it shows and what it does not".into());
        }
        if !q.route && (q.subjects.is_empty() || q.groups.is_empty() || q.min == 0) {
            return fail("needs `subjects`, `groups` and a `min` of at least 1".into());
        }
        let mut seen = std::collections::HashSet::new();
        for g in &q.groups {
            for r in g.into.iter().chain(&g.out) {
                let Some(rel) = relations.get(r) else { return fail(format!("unknown relation `{r}`")) };
                if !seen.insert(r) {
                    return fail(format!("relation `{r}` is listed twice"));
                }
                if rel.sensitive || rel.kinship || rel.passive {
                    return fail(format!("`{r}` is a family, sensitive or index-fund relation, so it never answers a question (family ties live on entity pages)"));
                }
            }
            for r in &g.via {
                let Some(rel) = relations.get(r) else { return fail(format!("unknown relation `{r}`")) };
                if rel.sensitive || rel.kinship || rel.passive || rel.attributed {
                    return fail(format!("`via` needs a plain link on the record, and `{r}` is not one"));
                }
            }
        }
        for t in &q.subjects {
            let Some(ty) = types.get(t) else { return fail(format!("unknown entity type `{t}`")) };
            if ty.family {
                return fail(format!("`{t}` can have family ties, and questions are never asked about people or families (their pages show family ties and every link)"));
            }
            let reached = q.groups.iter().any(|g| g.into.iter().any(|r| relations[r].to.allows(t)) || g.out.iter().any(|r| relations[r].from.allows(t)));
            if !reached {
                return fail(format!("no relation in its groups reaches type `{t}`"));
            }
        }
        let texts = [&q.ask, &q.shows, &q.not].into_iter().chain(q.groups.iter().flat_map(|g| std::iter::once(&g.label).chain(&g.empty)));
        for text in texts {
            if let Some(w) = words(text).find(|w| banned.contains(w)) {
                return fail(format!("uses the banned word `{w}`"));
            }
        }
    }
    Ok(())
}

pub fn parse_yaml<T: DeserializeOwned>(text: &str) -> Result<T, String> {
    serde_saphyr::from_str(text).map_err(|e| e.to_string())
}

fn read_yaml<T: DeserializeOwned>(path: &Path) -> Result<T> {
    let text = fs::read_to_string(path).with_context(|| format!("reading {}", path.display()))?;
    parse_yaml(&text).map_err(|e| anyhow!("{}: {e}", path.display()))
}

impl Schema {
    /// Entries of this type are points on the map (`map: true` in entity-types.yaml).
    pub fn on_map(&self, kind: &str) -> bool {
        self.types.get(kind).is_some_and(|t| t.map)
    }

    pub fn load(content: &Path) -> Result<Schema> {
        let dir = content.join("schema");
        let layers: IndexMap<String, Layer> = read_yaml(&dir.join("layers.yaml"))?;
        let types: IndexMap<String, EntityType> = read_yaml(&dir.join("entity-types.yaml"))?;
        let relations: IndexMap<String, Relation> = read_yaml(&dir.join("relations.yaml"))?;
        let lenses: Vec<Lens> = read_yaml(&dir.join("lenses.yaml"))?;
        let tiers: IndexMap<String, Tier> = read_yaml(&dir.join("source-tiers.yaml"))?;
        let ppath = dir.join("perspectives.yaml");
        let contested = if ppath.exists() { read_yaml::<PerspectivesFile>(&ppath)?.contested } else { Vec::new() };
        let mpath = content.join("methodology").join("paths.yaml");
        let mtext = fs::read_to_string(&mpath).with_context(|| format!("reading {}", mpath.display()))?;
        let methodology: serde_json::Value = parse_yaml(&mtext).map_err(|e| anyhow!("{}: {e}", mpath.display()))?;
        let methodology_hash = hex::encode(Sha256::digest(mtext.as_bytes()));

        for (id, t) in &types {
            if !layers.contains_key(&t.layer) {
                return Err(anyhow!("entity type `{id}` uses unknown layer `{}`", t.layer));
            }
        }
        for (id, r) in &relations {
            for l in &r.layers {
                if !layers.contains_key(l) {
                    return Err(anyhow!("relation `{id}` uses unknown layer `{l}`"));
                }
            }
            for set in [&r.from, &r.to] {
                if let TypeSet::List(v) = set {
                    for t in v {
                        if !types.contains_key(t) {
                            return Err(anyhow!("relation `{id}` uses unknown entity type `{t}`"));
                        }
                    }
                }
            }
            let family = |set: &TypeSet| matches!(set, TypeSet::List(v) if v.iter().all(|t| types[t].family));
            if r.kinship && !(family(&r.from) && family(&r.to)) {
                return Err(anyhow!("relation `{id}` is a family relation (`kinship`), so `from` and `to` may only list types with `family: true`"));
            }
            // an interpretation is one side's account: routes never run through it
            if r.attributed && r.traversable {
                return Err(anyhow!("relation `{id}` is `attributed`, so it must also be `traversable: false`"));
            }
            // a legal record is strictly sourced, and nobody is connected through a court (ADR-0018)
            if r.legal && (!r.sensitive || r.traversable) {
                return Err(anyhow!("relation `{id}` is a legal record (`legal`), so it must also be `sensitive: true` and `traversable: false`"));
            }
            // a dispute is one side's account (ADR-0019)
            if r.dispute && !r.attributed {
                return Err(anyhow!("relation `{id}` is a `dispute`, so it must also be `attributed: true`"));
            }
            // an earlier form answers for a later one only when they are the same body on the record
            if r.identity && r.attributed {
                return Err(anyhow!("relation `{id}` is an `identity` (the same body under a new name), so it cannot be `attributed`"));
            }
        }
        for lens in &lenses {
            for l in &lens.layers {
                if !layers.contains_key(l) {
                    return Err(anyhow!("lens `{}` uses unknown layer `{l}`", lens.id));
                }
            }
        }
        let qpath = dir.join("questions.yaml");
        let QuestionsFile { banned_words, questions } = if qpath.exists() { read_yaml(&qpath)? } else { QuestionsFile::default() };
        let banned_words: Vec<String> = banned_words.iter().map(|w| w.to_lowercase()).collect();
        check_questions(&questions, &banned_words, &relations, &types)?;
        Ok(Schema { contested, layers, types, relations, lenses, tiers, methodology, methodology_hash, questions, banned_words })
    }

    pub fn type_color(&self, t: &str) -> String {
        self.types
            .get(t)
            .and_then(|ty| self.layers.get(&ty.layer))
            .map(|l| l.color.clone())
            .unwrap_or_else(|| NEUTRAL.into())
    }

    pub fn type_label(&self, t: &str) -> String {
        self.types.get(t).map(|ty| ty.label.clone()).unwrap_or_else(|| t.to_string())
    }

    /// Tier rank: lower is stronger. Unknown tiers rank last.
    pub fn tier_rank(&self, tier: &str) -> usize {
        self.tiers.get_index_of(tier).unwrap_or(usize::MAX)
    }
}

#[cfg(test)]
mod tests {
    use super::Relation;

    #[test]
    fn a_phrase_that_is_not_a_verb_follows_a_comma() {
        let rel = |s: &str| serde_saphyr::from_str::<Relation>(s).unwrap();
        let founded = rel("{label: founded, inverse: founded by, from: [person], to: [org]}");
        assert_eq!(founded.clause("Ronald Wayne", true, "Apple"), "Ronald Wayne *founded* Apple");
        assert_eq!(founded.clause("Apple", false, "Ronald Wayne"), "Apple, *founded by* Ronald Wayne");
        let ceo = rel("{label: CEO of, inverse: CEO, from: [person], to: [org], noun: true}");
        assert_eq!(ceo.clause("Mike Markkula", true, "Apple"), "Mike Markkula, *CEO of* Apple");
        let part = rel("{label: part of, inverse: includes, from: [event], to: [event], noun: true, inverse_reads: verb}");
        assert_eq!(part.clause("The Cold War", false, "the Berlin airlift"), "The Cold War *includes* the Berlin airlift");
        let board = rel("{label: board member of, inverse: board members, from: [person], to: [org], noun: true, inverse_reads: list}");
        assert_eq!(board.clause("Apple", false, "A and B"), "Apple, *board members*: A and B");
    }
}
