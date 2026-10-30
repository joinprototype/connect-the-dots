# ADR-0011: Repos and licenses

- Status: accepted (2026-10-30, the founder: make it public, add a license)
- Date: 2026-10-16

## Context

- One repo or two?
- Should the engine be private?
- Which licenses? Relicensing a crowd-written corpus later is close to impossible.

## Decision

- **One public monorepo** (`crates/`, `web/`, `theme/`, `content/`, `docs/`). Schema, engine and seed content change together, and single commits help. The split into `engine`, `content` and `ops` repos proposed here at first is dropped for launch: it costs work and solves nothing yet. Revisit it when outside contributions make it worth doing.
- **The engine is public.**
  - A site about bias and "who is behind it" cannot run on a secret ranking algorithm.
  - Fork PRs get no secrets, so a private engine would break contributor checks.
  - The data is open anyway; our moat is community, data quality and presentation.
- **Licenses,** in [LICENSE.md](../../LICENSE.md):
  - Structured data: **CC0 1.0**, compatible with Wikidata.
  - Prose and chapters: **CC BY-SA 4.0**, compatible with Wikipedia.
  - Code: **AGPL-3.0**, so modified versions that are distributed or served must publish their source.
  - Contributions: **DCO** sign-off, no CLA.
- **Parts that stay under their own terms:** `content/borders/` is CC BY 4.0 (Cliopatria, ADR-0020), and quotations, images and libraries keep theirs. GSAP is not open source, so the code carries an AGPL section 7 permission to be combined with it.

## Open

- Reusable pieces of the engine (graph kernel, EDTF, tiles, validator core) were meant to be **Apache-2.0 OR MIT**. They are one crate today, so they are AGPL with the rest. If they become their own crates, relicense them then: outside contributors to those files would have to agree.
- A legal entity. The copyright line names the contributors until there is one.
