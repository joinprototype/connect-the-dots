# ADR-0011: Repos and licenses

- Status: proposed (the founder decides licenses before the first outside PR)
- Date: 2026-10-16

## Context

- One repo or two?
- Should the engine be private?
- Which licenses? Relicensing a crowd-written corpus later is close to impossible.

## Decision (proposed)

- **Now:** one monorepo (`crates/`, `web/`, `theme/`, `content/`, `docs/`). Schema, engine and seed content change together, and single commits help.
- **At public launch:** split, with history preserved (`git filter-repo`), into:
  - a public `engine` repo;
  - a public `content` repo, which pins an engine version;
  - an optional private `ops` repo for deploy configs and runbooks.
- **The engine stays public.**
  - A site about bias and "who is behind it" cannot run on a secret ranking algorithm.
  - Fork PRs get no secrets, so a private engine would break contributor checks.
  - The data is open anyway; our moat is community, data quality and presentation.
- **Licenses (proposed defaults):**
  - Structured data: **CC0 1.0**, compatible with Wikidata.
  - Prose and chapters: **CC BY-SA 4.0**, compatible with Wikipedia.
  - Reusable crates (graph kernel, EDTF, tiles, validator core): **Apache-2.0 OR MIT** (or MPL-2.0).
  - Site app and tools: **AGPL-3.0**, so modified versions that are distributed or served must publish their source.
  - Contributions: **DCO** sign-off, no CLA.

## Open

The founder confirms the licenses and creates the legal entity before the public alpha.
