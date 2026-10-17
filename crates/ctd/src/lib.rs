//! connect-the-dot engine.

pub mod answers;
pub mod covers;
pub mod diag;
pub mod edtf;
pub mod fmt;
pub mod ids;
pub mod kb;
pub mod load;
pub mod markdown;
pub mod model;
pub mod paths;
pub mod schema;
pub mod serve;
pub mod site;
pub mod stories;
#[cfg(test)]
mod testkit;
pub mod world;

use std::{
    path::{Path, PathBuf},
    time::Instant,
};

use anyhow::{Result, bail};

/// A count with its noun, for text readers see: "1 link", "2 links" (regular plurals only).
pub fn plural(n: usize, noun: &str) -> String {
    if n == 1 { format!("1 {noun}") } else { format!("{n} {noun}s") }
}

/// Finds the repository root: the nearest directory (from `start` or the cwd) that contains `content/schema`.
pub fn find_root(start: Option<PathBuf>) -> Result<PathBuf> {
    let mut dir = match start {
        Some(p) => p.canonicalize()?,
        None => std::env::current_dir()?,
    };
    loop {
        if dir.join("content").join("schema").is_dir() {
            return Ok(dir);
        }
        if !dir.pop() {
            bail!("no content/schema directory found here or in any parent; pass --root");
        }
    }
}

pub fn load_kb(root: &Path) -> Result<(kb::Kb, Vec<diag::Diag>)> {
    let schema = schema::Schema::load(&root.join("content"))?;
    let raw = load::load(root);
    Ok(kb::assemble(schema, raw))
}

/// Loads, validates and builds, printing diagnostics. Never fails hard (used by `serve`).
/// Builds into `.cache/dist-next` and swaps it in, so the dev server never serves a half-written
/// site and a failed build leaves the last good one in place.
pub fn rebuild(root: &Path, out: &Path, dev: bool) {
    let started = Instant::now();
    let cache = root.join(".cache");
    let staging = cache.join("dist-next");
    match load_kb(root) {
        Ok((kb, diags)) => {
            let (errors, warnings) = diag::print(&diags);
            let built = site::build(root, &kb, &site::Opts { out: staging.clone(), dev })
                .and_then(|m| swap_in(&staging, out, &cache.join("dist-old")).map(|()| m));
            match built {
                Ok(m) => println!(
                    "built {} entities, {} claims, {} sources, {} chapters in {} ms ({}, {})",
                    m.entities,
                    m.claims,
                    m.sources,
                    m.chapters,
                    started.elapsed().as_millis(),
                    plural(errors, "error"),
                    plural(warnings, "warning")
                ),
                Err(e) => eprintln!("build failed: {e:#}"),
            }
        }
        Err(e) => eprintln!("schema error: {e:#}"),
    }
}

fn swap_in(staging: &Path, out: &Path, old: &Path) -> Result<()> {
    if old.exists() {
        std::fs::remove_dir_all(old)?;
    }
    if out.exists() {
        std::fs::rename(out, old)?;
    }
    std::fs::rename(staging, out)?;
    if old.exists() {
        std::fs::remove_dir_all(old)?;
    }
    Ok(())
}
