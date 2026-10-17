//! Raw file formats, deserialized straight from YAML frontmatter and source files.

use std::collections::BTreeMap;

use serde::{Deserialize, Deserializer};

/// YAML scalars that we keep as text (dates must never be auto-converted).
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum Scalar {
    Text(String),
    Int(i64),
    Float(f64),
    Bool(bool),
}

impl Scalar {
    pub fn into_text(self) -> String {
        match self {
            Scalar::Text(s) => s,
            Scalar::Int(i) => i.to_string(),
            Scalar::Float(f) => f.to_string(),
            Scalar::Bool(b) => b.to_string(),
        }
    }
}

pub fn opt_text<'de, D: Deserializer<'de>>(d: D) -> Result<Option<String>, D::Error> {
    Ok(Option::<Scalar>::deserialize(d)?.map(Scalar::into_text))
}

#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum OneOrMany {
    One(String),
    Many(Vec<String>),
}

impl OneOrMany {
    pub fn items(&self) -> &[String] {
        match self {
            OneOrMany::One(s) => std::slice::from_ref(s),
            OneOrMany::Many(v) => v,
        }
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct SrcRef {
    pub s: String,
    #[serde(default, deserialize_with = "opt_text")]
    pub at: Option<String>,
    #[serde(default)]
    pub quote: Option<String>,
    /// Whose words the quote is, when they are not the source's own (a speaker quoted in a report).
    #[serde(default, deserialize_with = "opt_text")]
    pub by: Option<String>,
    /// Anything else: a misspelled key (`qoute:`), warned about rather than silently dropped.
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ClaimIn {
    #[serde(default, deserialize_with = "opt_text")]
    pub id: Option<String>,
    pub rel: String,
    pub to: OneOrMany,
    #[serde(default, deserialize_with = "opt_text")]
    pub when: Option<String>,
    #[serde(default)]
    pub according_to: Vec<String>,
    #[serde(default)]
    pub src: Vec<SrcRef>,
    #[serde(default)]
    pub status: Option<String>,
    #[serde(default)]
    pub reason: Option<String>,
    #[serde(default)]
    pub note: Option<String>,
    #[serde(default)]
    pub role: Option<String>,
    #[serde(default)]
    pub title: Option<String>,
    #[serde(default)]
    pub percent: Option<f64>,
    #[serde(default)]
    pub shares: Option<f64>,
    #[serde(default)]
    pub amount: Option<f64>,
    #[serde(default)]
    pub currency: Option<String>,
    #[serde(default, deserialize_with = "opt_text")]
    pub as_of: Option<String>,
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}

impl ClaimIn {
    /// Qualifier fields that are set, for validation and display.
    pub fn qualifiers(&self) -> Vec<(&'static str, serde_json::Value)> {
        let text = |k: &'static str, v: &Option<String>| v.as_deref().map(|v| (k, serde_json::Value::from(v)));
        let num = |k: &'static str, v: Option<f64>| v.map(|v| (k, serde_json::Value::from(v)));
        [
            text("role", &self.role),
            text("title", &self.title),
            num("percent", self.percent),
            num("shares", self.shares),
            num("amount", self.amount),
            text("currency", &self.currency),
            text("as_of", &self.as_of),
        ]
        .into_iter()
        .flatten()
        .collect()
    }
}

#[derive(Debug, Clone, Deserialize)]
pub struct EntityFront {
    #[serde(default)]
    pub uid: Option<String>,
    pub id: String,
    #[serde(rename = "type")]
    pub kind: String,
    pub name: String,
    /// The name as it reads inside a sentence: "the dissolution of the Soviet Union".
    #[serde(default)]
    pub in_sentence: Option<String>,
    #[serde(default)]
    pub aliases: Vec<String>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default, deserialize_with = "opt_text")]
    pub when: Option<String>,
    #[serde(default)]
    pub place: Option<String>,
    #[serde(default)]
    pub coords: Option<[f64; 2]>,
    #[serde(default)]
    pub same_as: BTreeMap<String, Scalar>,
    #[serde(default)]
    pub image: Option<serde_json::Value>,
    #[serde(default)]
    pub claims: Vec<ClaimIn>,
    /// People only: sourced lines about where they come from (ADR-0016).
    #[serde(default)]
    pub background: Vec<BackgroundIn>,
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}

/// One line about where a person comes from: their parents, upbringing or heritage (ADR-0016).
#[derive(Debug, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct BackgroundIn {
    pub text: String,
    #[serde(default)]
    pub src: Vec<SrcRef>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct SourceIn {
    #[serde(default)]
    pub uid: Option<String>,
    pub id: String,
    pub title: String,
    #[serde(default)]
    pub publisher: Option<String>,
    #[serde(default)]
    pub author: Option<String>,
    #[serde(default, deserialize_with = "opt_text")]
    pub published: Option<String>,
    #[serde(default)]
    pub url: Option<String>,
    #[serde(default)]
    pub archive_url: Option<String>,
    #[serde(default)]
    pub sha256: Option<String>,
    #[serde(default, deserialize_with = "opt_text")]
    pub retrieved: Option<String>,
    pub tier: String,
    #[serde(default)]
    pub voice: Option<String>,
    #[serde(default)]
    pub license: Option<String>,
    #[serde(default)]
    pub note: Option<String>,
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}

#[derive(Debug, Clone, Deserialize)]
pub struct ChapterFront {
    #[serde(default)]
    pub uid: Option<String>,
    pub id: String,
    #[serde(rename = "type", default)]
    pub kind: Option<String>,
    pub title: String,
    #[serde(default)]
    pub subtitle: Option<String>,
    #[serde(default)]
    pub summary: Option<String>,
    #[serde(default)]
    pub authors: Vec<String>,
    #[serde(default)]
    pub featured: bool,
    #[serde(flatten)]
    pub extra: BTreeMap<String, serde_json::Value>,
}
