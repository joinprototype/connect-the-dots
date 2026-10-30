//! Reads every content file. Parse problems become diagnostics, never panics.

use std::{
    collections::BTreeMap,
    fs,
    path::{Path, PathBuf},
};

use walkdir::WalkDir;

use serde::Deserialize;

use crate::{
    diag::Diag,
    model::{ChapterFront, EntityFront, SourceIn},
    schema::parse_yaml,
};

/// `content/featured.yaml`: editorial picks for the home page and the Stories library.
#[derive(Debug, Default, Clone, Deserialize)]
#[serde(deny_unknown_fields)]
pub struct Featured {
    /// Pairs of entity ids; each gets a generated connection story.
    #[serde(default)]
    pub connections: Vec<Pick>,
    /// Entity ids whose life stories go on the home shelf.
    #[serde(default)]
    pub lives: Vec<String>,
    /// Question pages as `<question>/<entity id>` ("behind/meta-platforms"): the Ask form's "Try"
    /// links and the first books of the Questions shelf. They are always kept when pages are capped.
    #[serde(default)]
    pub questions: Vec<String>,
}

/// A featured pair: `[a, b]`, or `{between: [a, b], note: "…"}` when the route story must say
/// something up front (e.g. what the sources do NOT show).
#[derive(Debug, Clone, Deserialize)]
#[serde(untagged)]
pub enum Pick {
    Pair([String; 2]),
    Noted { between: [String; 2], note: String },
}

impl Pick {
    pub fn ids(&self) -> &[String; 2] {
        match self {
            Pick::Pair(ids) | Pick::Noted { between: ids, .. } => ids,
        }
    }

    pub fn note(&self) -> Option<&str> {
        match self {
            Pick::Pair(_) => None,
            Pick::Noted { note, .. } => Some(note),
        }
    }
}

pub struct EntityDoc {
    pub rel_path: String,
    pub stem: String,
    pub folder_type: Option<String>,
    pub front: EntityFront,
    pub body: String,
}

pub struct SourceDoc {
    pub rel_path: String,
    pub stem: String,
    pub src: SourceIn,
}

/// A polity's historical borders (ADR-0020): only what the checks read. The shapes stay in the file.
#[derive(Deserialize)]
pub struct BorderIn {
    pub name: String,
    pub source: String,
    pub features: Vec<BorderPeriod>,
}

#[derive(Deserialize)]
pub struct BorderPeriod {
    pub properties: BorderYears,
}

#[derive(Deserialize)]
pub struct BorderYears {
    pub from: i32,
    pub to: i32,
}

pub struct BorderDoc {
    pub rel_path: String,
    pub stem: String,
    pub border: BorderIn,
}

pub struct ChapterDoc {
    pub rel_path: String,
    pub stem: String,
    pub front: ChapterFront,
    pub body: String,
}

#[derive(Default)]
pub struct Raw {
    pub entities: Vec<EntityDoc>,
    pub sources: Vec<SourceDoc>,
    pub chapters: Vec<ChapterDoc>,
    pub borders: Vec<BorderDoc>,
    pub featured: Featured,
    pub diags: Vec<Diag>,
    pub dir_counts: BTreeMap<String, usize>,
}

/// Splits `---\n<yaml>\n---\n<body>` into (yaml, body).
pub fn split_frontmatter(text: &str) -> Option<(&str, &str)> {
    let t = text.strip_prefix('\u{feff}').unwrap_or(text);
    let rest = t.strip_prefix("---\n").or_else(|| t.strip_prefix("---\r\n"))?;
    let mut idx = 0;
    for line in rest.split_inclusive('\n') {
        if line.trim_end() == "---" {
            return Some((&rest[..idx], &rest[idx + line.len()..]));
        }
        idx += line.len();
    }
    None
}

pub fn rel(root: &Path, p: &Path) -> String {
    p.strip_prefix(root).unwrap_or(p).to_string_lossy().replace('\\', "/")
}

pub(crate) fn files(dir: &Path) -> Vec<PathBuf> {
    if !dir.exists() {
        return Vec::new();
    }
    WalkDir::new(dir)
        .sort_by_file_name()
        .into_iter()
        .filter_map(Result::ok)
        .filter(|e| e.file_type().is_file())
        .filter(|e| !e.file_name().to_string_lossy().starts_with('.'))
        .map(|e| e.into_path())
        .collect()
}

/// A content file's text, or a diagnostic saying why it cannot be read.
fn read(p: &Path, file: &str, diags: &mut Vec<Diag>) -> Option<String> {
    fs::read_to_string(p).inspect_err(|e| diags.push(Diag::err(file, format!("cannot read: {e}")))).ok()
}

fn stem(p: &Path) -> String {
    p.file_stem().map(|s| s.to_string_lossy().into_owned()).unwrap_or_default()
}

pub(crate) fn ext(p: &Path) -> &str {
    p.extension().and_then(|e| e.to_str()).unwrap_or("")
}

pub fn load(root: &Path) -> Raw {
    let content = root.join("content");
    let mut raw = Raw::default();

    let entities_dir = content.join("entities");
    for p in files(&entities_dir) {
        let file = rel(root, &p);
        if let Some(parent) = p.parent() {
            *raw.dir_counts.entry(rel(root, parent)).or_default() += 1;
        }
        if ext(&p) != "md" {
            raw.diags.push(Diag::warn(&file, "ignored: entity files must be .md"));
            continue;
        }
        let Some(text) = read(&p, &file, &mut raw.diags) else { continue };
        let Some((fm, body)) = split_frontmatter(&text) else {
            raw.diags.push(
                Diag::err(&file, "missing YAML frontmatter").hint("start the file with a line `---`, the YAML, then another `---`"),
            );
            continue;
        };
        let folder_type = p
            .strip_prefix(&entities_dir)
            .ok()
            .and_then(|r| r.components().next())
            .map(|c| c.as_os_str().to_string_lossy().into_owned());
        // a leading newline stands for the opening `---`, so errors give the file's line numbers
        match parse_yaml::<EntityFront>(&format!("\n{fm}")) {
            Ok(front) => raw.entities.push(EntityDoc { rel_path: file, stem: stem(&p), folder_type, front, body: body.to_string() }),
            Err(e) => raw.diags.push(Diag::err(&file, format!("invalid frontmatter: {e}"))),
        }
    }

    for p in files(&content.join("sources")) {
        let file = rel(root, &p);
        if let Some(parent) = p.parent() {
            *raw.dir_counts.entry(rel(root, parent)).or_default() += 1;
        }
        if !matches!(ext(&p), "yaml" | "yml") {
            raw.diags.push(Diag::warn(&file, "ignored: source files must be .yaml"));
            continue;
        }
        let Some(text) = read(&p, &file, &mut raw.diags) else { continue };
        match parse_yaml::<SourceIn>(&text) {
            Ok(src) => raw.sources.push(SourceDoc { rel_path: file, stem: stem(&p), src }),
            Err(e) => raw.diags.push(Diag::err(&file, format!("invalid source file: {e}"))),
        }
    }

    for p in files(&content.join("chapters")) {
        let file = rel(root, &p);
        if ext(&p) != "md" {
            continue;
        }
        let Some(text) = read(&p, &file, &mut raw.diags) else { continue };
        let Some((fm, body)) = split_frontmatter(&text) else {
            raw.diags.push(Diag::err(&file, "missing YAML frontmatter"));
            continue;
        };
        match parse_yaml::<ChapterFront>(&format!("\n{fm}")) {
            Ok(front) => raw.chapters.push(ChapterDoc { rel_path: file, stem: stem(&p), front, body: body.to_string() }),
            Err(e) => raw.diags.push(Diag::err(&file, format!("invalid frontmatter: {e}"))),
        }
    }

    for p in files(&content.join("borders")) {
        let file = rel(root, &p);
        if ext(&p) != "json" {
            continue;
        }
        let Some(text) = read(&p, &file, &mut raw.diags) else { continue };
        match serde_json::from_str::<BorderIn>(&text) {
            Ok(border) => raw.borders.push(BorderDoc { rel_path: file, stem: stem(&p), border }),
            Err(e) => raw.diags.push(Diag::err(&file, format!("invalid borders file: {e}"))),
        }
    }

    let featured = content.join("featured.yaml");
    if featured.exists() {
        let file = rel(root, &featured);
        match fs::read_to_string(&featured).map_err(|e| e.to_string()).and_then(|t| parse_yaml::<Featured>(&t)) {
            Ok(f) => raw.featured = f,
            Err(e) => raw.diags.push(Diag::err(&file, format!("invalid featured list: {e}"))),
        }
    }

    raw
}

#[cfg(test)]
mod tests {
    use super::split_frontmatter;

    #[test]
    fn splits() {
        let (fm, body) = split_frontmatter("---\nid: a\n---\nhello\n").unwrap();
        assert_eq!(fm, "id: a\n");
        assert_eq!(body, "hello\n");
        assert!(split_frontmatter("no frontmatter").is_none());
    }
}
