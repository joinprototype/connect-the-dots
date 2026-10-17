use std::{path::PathBuf, process::ExitCode};

use anyhow::Result;
use clap::{Parser, Subcommand};
use ctd::plural;

#[derive(Parser)]
#[command(name = "ctd", version, about = "connect-the-dot engine: check, build and serve the knowledge graph")]
struct Cli {
    /// Repository root (default: nearest parent directory containing content/schema)
    #[arg(long, global = true)]
    root: Option<PathBuf>,
    #[command(subcommand)]
    cmd: Cmd,
}

#[derive(Subcommand)]
enum Cmd {
    /// Validate all content against the schema
    Check {
        /// Also compare entry ids with this git ref (e.g. origin/main): an id that disappears must stay as an alias
        #[arg(long)]
        base: Option<String>,
    },
    /// Compile content into a static site
    Build {
        /// Output directory (relative to the root)
        #[arg(long, default_value = "dist")]
        out: PathBuf,
        /// Include the live-reload script
        #[arg(long)]
        dev: bool,
        /// Build even if `check` finds errors
        #[arg(long)]
        allow_errors: bool,
    },
    /// Dev server: watch files, rebuild, live reload
    Serve {
        #[arg(long, default_value_t = 4321)]
        port: u16,
    },
    /// Assign permanent ids (uid) to files that lack one
    Fmt,
    /// Build world tiles: the synthetic test world (--synthetic N) or the content graph
    World {
        /// Number of nodes for a synthetic world
        #[arg(long)]
        synthetic: Option<usize>,
        #[arg(long, default_value_t = 7)]
        seed: u64,
        /// Output directory (default: .cache/world-synth or .cache/world)
        #[arg(long)]
        out: Option<PathBuf>,
    },
    /// Show the best-ranked connections between two entities
    Path {
        from: String,
        to: String,
        /// Number of diverse alternatives
        #[arg(long, default_value_t = 3)]
        k: usize,
        /// Allow paths through passive holdings (index funds)
        #[arg(long)]
        include_passive: bool,
        #[arg(long, default_value_t = 10)]
        max_hops: usize,
    },
}

fn run(cli: Cli) -> Result<ExitCode> {
    let root = ctd::find_root(cli.root)?;
    match cli.cmd {
        Cmd::Check { base } => {
            let (kb, mut diags) = ctd::load_kb(&root)?;
            if let Some(base) = &base {
                diags.extend(ctd::ids::check_removed(&root, &kb, base));
            }
            let (errors, warnings) = ctd::diag::print(&diags);
            println!(
                "checked {} entities, {} claims, {} sources, {} chapters: {}, {}",
                kb.entities.len(),
                kb.edges.len(),
                kb.sources.len(),
                kb.chapters.len(),
                plural(errors, "error"),
                plural(warnings, "warning")
            );
            Ok(if errors > 0 { ExitCode::FAILURE } else { ExitCode::SUCCESS })
        }
        Cmd::Build { out, dev, allow_errors } => {
            let (kb, diags) = ctd::load_kb(&root)?;
            let (errors, warnings) = ctd::diag::print(&diags);
            if errors > 0 && !allow_errors {
                eprintln!("{}; fix them or pass --allow-errors", plural(errors, "error"));
                return Ok(ExitCode::FAILURE);
            }
            let out = if out.is_absolute() { out } else { root.join(out) };
            let m = ctd::site::build(&root, &kb, &ctd::site::Opts { out: out.clone(), dev })?;
            println!(
                "built {} entities, {} claims, {} sources, {} chapters into {} ({}, {})",
                m.entities,
                m.claims,
                m.sources,
                m.chapters,
                out.display(),
                plural(errors, "error"),
                plural(warnings, "warning")
            );
            Ok(ExitCode::SUCCESS)
        }
        Cmd::Serve { port } => {
            ctd::serve::run(root, port)?;
            Ok(ExitCode::SUCCESS)
        }
        Cmd::Fmt => {
            let n = ctd::fmt::fill_uids(&root)?;
            println!("assigned {}", plural(n, "uid"));
            Ok(ExitCode::SUCCESS)
        }
        Cmd::World { synthetic, seed, out } => {
            let state = root.join(".cache").join("world-state.json");
            let (graph, spec, default_dir) = match synthetic {
                Some(n) => {
                    let started = std::time::Instant::now();
                    let g = ctd::world::synthetic(n, seed);
                    println!("generated {} nodes, {} links in {} ms", g.n, g.edges.len(), started.elapsed().as_millis());
                    let (palette, palette_labels) = ctd::world::default_palette();
                    (g, ctd::world::Spec { kind: "synthetic", palette, palette_labels, entities: None }, ".cache/world-synth")
                }
                None => {
                    let (kb, _) = ctd::load_kb(&root)?;
                    let (g, spec) = ctd::world::from_kb(&kb);
                    (g, spec, ".cache/world")
                }
            };
            let out = out.unwrap_or_else(|| root.join(default_dir));
            let s = ctd::world::build(&graph, &spec, &out, if synthetic.is_none() { Some(state.as_path()) } else { None })?;
            println!(
                "world: {} nodes, {} links, {} clusters, zoom 0–{} (clusters below {}), {} tiles, {:.1} MB, largest tile {} nodes / {} links / {} KB ({} KB gzip), built in {:.1} s → {}",
                s.nodes, s.edges, s.clusters, s.maxzoom, s.cluster_zoom, s.tiles, s.bytes as f64 / 1e6, s.max_tile_nodes, s.max_tile_edges,
                s.max_tile_bytes / 1024, s.max_tile_gzip / 1024, s.build_ms as f64 / 1000.0, out.display()
            );
            if let Some(d) = s.drift {
                println!("stability: {} nodes compared with the previous build, mean drift {:.4} of the map's width", s.aligned_nodes, d);
            }
            Ok(ExitCode::SUCCESS)
        }
        Cmd::Path { from, to, k, include_passive, max_hops } => {
            let (kb, _) = ctd::load_kb(&root)?;
            for id in [&from, &to] {
                if kb.resolve(id).is_none() {
                    eprintln!("no entity `{id}`");
                    return Ok(ExitCode::FAILURE);
                }
            }
            let (a, b) = (kb.resolve(&from).unwrap().id.clone(), kb.resolve(&to).unwrap().id.clone());
            let paths = ctd::paths::find(&kb, &a, &b, &ctd::paths::Options { k, include_passive, max_hops });
            if paths.is_empty() {
                println!("No connection found between {} and {} (passive holdings {}).", kb.name_of(&a), kb.name_of(&b), if include_passive { "included" } else { "excluded" });
                return Ok(ExitCode::FAILURE);
            }
            for (i, p) in paths.iter().enumerate() {
                println!("\n{}. {}, cost {:.2}", i + 1, plural(p.hops.len(), "hop"), p.cost);
                for h in &p.hops {
                    println!("   {}", ctd::paths::describe(&kb, h));
                }
            }
            println!("\nA connection is not evidence of wrongdoing.");
            Ok(ExitCode::SUCCESS)
        }
    }
}

fn main() -> ExitCode {
    match run(Cli::parse()) {
        Ok(code) => code,
        Err(e) => {
            eprintln!("error: {e:#}");
            ExitCode::from(2)
        }
    }
}
