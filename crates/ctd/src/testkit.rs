//! A tiny content repository for unit tests: a minimal schema plus the files each test adds.

use std::{fs, path::PathBuf};

use crate::{diag::Diag, kb::Kb};

const SCHEMA: &[(&str, &str)] = &[
    ("content/schema/layers.yaml", "people: {label: People, color: \"#5b6b7a\"}\npower: {label: Power, color: \"#7a6b5b\"}\n"),
    (
        "content/schema/entity-types.yaml",
        "person: {label: Person, plural: People, layer: people, family: true, span: Life}\norg: {label: Organization, plural: Organizations, layer: power, span: Active}\n",
    ),
    (
        "content/schema/relations.yaml",
        "relative_of: {label: relative of, inverse: relative of, from: [person], to: [person], layers: [people], qualifiers: [role], sensitive: true, kinship: true}\n\
         founded: {label: founded, inverse: founded by, from: [person, org], to: [org], layers: [power], temporal: true}\n",
    ),
    ("content/schema/lenses.yaml", "- {id: all, label: Everything, view: graph, layers: [people, power]}\n"),
    ("content/schema/source-tiers.yaml", "T1: {label: Primary record, primary: true}\nT2: {label: Scholarship & press, strong: true}\nT3: {label: Self-published}\n"),
    ("content/methodology/paths.yaml", "version: test\n"),
];

pub type File = (String, String);

/// Writes the schema, then `files` (a schema path among them replaces the default), into a fresh
/// repository under the temp directory, and returns its root. The caller removes it.
pub fn write_repo(name: &str, files: &[File]) -> anyhow::Result<PathBuf> {
    let root = std::env::temp_dir().join(format!("ctd-test-{}-{name}", std::process::id()));
    let _ = fs::remove_dir_all(&root);
    let schema = SCHEMA.iter().map(|&(p, t)| file(p, t));
    for (path, text) in schema.chain(files.iter().cloned()) {
        let p = root.join(path);
        fs::create_dir_all(p.parent().unwrap())?;
        fs::write(p, text)?;
    }
    Ok(root)
}

/// Writes the schema and `files` (see `write_repo`) and loads them.
pub fn try_load(name: &str, files: &[File]) -> anyhow::Result<(Kb, Vec<Diag>)> {
    let root = write_repo(name, files)?;
    let loaded = crate::load_kb(&root);
    let _ = fs::remove_dir_all(&root);
    loaded
}

pub fn load(name: &str, files: &[File]) -> (Kb, Vec<Diag>) {
    try_load(name, files).unwrap()
}

pub fn file(path: &str, text: &str) -> File {
    (path.to_string(), text.to_string())
}

/// An entity file; `claims` is the YAML list under `claims:`, each line indented by two spaces.
pub fn entity(kind: &str, id: &str, name: &str, claims: &str) -> File {
    let claims = if claims.is_empty() { " []\n".to_string() } else { format!("\n{claims}") };
    file(&format!("content/entities/{kind}/{}/{id}.md", &id[..2]), &format!("---\nid: {id}\ntype: {kind}\nname: {name}\nclaims:{claims}---\n"))
}

pub fn source(id: &str, tier: &str) -> File {
    file(&format!("content/sources/{}/{id}.yaml", &id[..2]), &format!("id: {id}\ntitle: {id}\ntier: {tier}\nurl: https://example.org/{id}\n"))
}

/// Messages of the diagnostics that mention `needle`.
pub fn said(diags: &[Diag], needle: &str) -> Vec<String> {
    diags.iter().filter(|d| d.msg.contains(needle)).map(|d| d.msg.clone()).collect()
}
