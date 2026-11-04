//! Missing links (`/missing/`): what open data says about two entries the record holds, and the record
//! does not yet, each a question for a reader with a source (ADR-0036). The leads are `ctd gaps`'s
//! (ADR-0025), and a lead is never proof: the page says whose word it is, and asks for a source a person
//! here will check before anything goes on the record.

use std::path::Path;

use anyhow::{Result, anyhow};
use serde::Deserialize;
use serde_json::{Value, json};

use super::{Site, ask, write};
use crate::atlas::Atlas;

#[derive(Deserialize)]
struct Rules {
    most: usize,
    #[serde(default)]
    leave_out: Vec<String>,
}

/// The page, when the atlas is there to read leads from and content/methodology/missing.yaml exists.
pub(super) fn write_missing(s: &Site, root: &Path, atlas: Option<&Atlas>) -> Result<()> {
    let methodology = root.join("content").join("methodology");
    let path = methodology.join("missing.yaml");
    let Some(a) = atlas.filter(|_| path.exists()) else { return Ok(()) };
    let read = |name: &str| std::fs::read_to_string(methodology.join(name)).unwrap_or_default();
    let rules: Rules = crate::schema::parse_yaml(&read("missing.yaml")).map_err(|e| anyhow!("{}: {e}", path.display()))?;
    let kb = s.kb;
    let out = ask::kept_out(s);
    // a lead someone found wrong is in gaps-ignore.tsv; one tried without a source may still be true
    let leads = crate::gaps::find(kb, a, &read("gaps.yaml"), &read("gaps-ignore.tsv"))?;
    let end = |id: &str| kb.entity(id).map(|e| json!({ "name": e.name, "url": format!("/e/{}/", e.id), "ink": kb.schema.type_color(&e.kind) }));
    let rows: Vec<Value> = leads
        .iter()
        .filter(|l| l.kind == "links" && !rules.leave_out.contains(&l.relation))
        .filter(|l| !out.contains(l.from.as_str()) && !out.contains(l.to.as_str()))
        .filter_map(|l| {
            let r = kb.schema.relations.get(&l.relation)?;
            if r.sensitive || r.kinship || r.legal || r.background {
                return None;
            }
            let (from, to) = (end(&l.from)?, end(&l.to)?);
            // "Vladimir Putin, head of Russia": the names apart, so each can link to its page
            let said = r.clause("\u{1}", true, "\u{2}").replace('*', "");
            let (lead, rest) = said.split_once('\u{1}')?;
            let (middle, tail) = rest.split_once('\u{2}')?;
            let text = said.replace('\u{1}', &kb.name_of(&l.from)).replace('\u{2}', &kb.name_of(&l.to));
            let body = format!(
                "Open data says: {text}.\nLead: {} {} {}\n\nA source a reader can open (a link):\n\nThe words in it that show this, copied exactly:\n",
                l.from, l.relation, l.to
            );
            Some(json!({ "from": from, "to": to, "lead": lead, "middle": middle, "tail": tail, "title": format!("Source for: {text}"), "body": body }))
        })
        .take(rules.most)
        .collect();
    write(&s.out.join("missing").join("index.html"), s.render("missing.html", json!({ "site": &s.site, "rows": rows }))?)
}
