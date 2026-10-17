# Requirements

Captured from the founder's direction during Sprint 0 (2026-10-16). When a decision changes, update this file and add an ADR.

## Founder decisions

1. **Process.** MVP first, run as startup sprints: plan, build, self-check, demo, review, decide.
2. **Knowledge only for the MVP.** Social features (communities, comments, votes, feeds) are v2, if the project picks up. The design must not block them.
3. **No accounts or database of our own in the MVP.** Identity comes from GitHub:
   - a PR is a "post" and review comments are "replies";
   - approval by a trusted reviewer verifies a change;
   - reactions are a signal only;
   - issues hold questions, disputes and research requests.
4. **Content lives in git as human-readable files.** A Rust engine compiles the repo into the site, IDs come from file names, and the site updates after a PR merges.
5. **Most edits happen on the files.** A friendly UI editor comes after the core loop works; the MVP uses GitHub-native flows.
6. **Images and files.** Contributors give a link (uploads come later), and we download and host our own copy on Cloudflare R2.
7. **English only for now.** Names in other languages are kept only as search aliases.
8. **Lens switcher, on the map-mode metaphor.**
   - Lenses (at most five): Everything, People & power, Money, Ideas & tech, History. Places live on the Map.
   - A Perspective control.
   - A Time slider: show the graph "as of" a date, or press play to animate.
   - The focus entity stays when you switch.
9. **Page history.** Every page shows its change history the way git does: a log, meaningful diffs, and links to the PR discussion.
10. **The explorer behaves like an open-world game.** It renders only what is near, streams content in and out, keeps memory bounded, and never lags around giant hubs. The target is millions of nodes eventually.
11. **Build custom tools where nothing suitable exists.**
12. **Storytelling chapters.** Interactive "connect the dots" articles with explainer-video animation: globe fly-ins, borders through time, documents with highlights, map-to-graph morphs. Every frame can be paused and explored.
13. **Builds run locally**, not on GitHub Actions. Only fast checks run on GitHub.
14. **Minimal running cost.** Static hosting at about $5 a month, and low RAM use, given 2026 memory prices.
15. **Examples are test cases for a generic engine**, not the scope.

## Non-negotiables

- **Sourcing and attribution:**
  - every claim has a source;
  - facts and interpretations are kept apart, and interpretations are attributed with `according_to`;
  - evidence tiers are visible;
  - agreement across opposing perspectives is the strongest signal;
  - no false balance;
  - no evaluative labels on people;
  - claims about living people follow stricter rules.
- **Generic engine.** All vocabulary is data in the content repo: entity types, relation types, layers, lenses, perspectives and source tiers. A new domain is a PR, never an engine change.
- **Static-first.** No database in the MVP, low hosting cost, and the site survives traffic spikes.
- **Reading pages are fast, indexable, accessible HTML.**
- **Every computed result can be reproduced.** It is stamped with the engine version, content commit, methodology version and world version.

## Platform limits (verified 2026-10-16)

| Platform | Limit |
|---|---|
| GitHub | About 1 merged PR per minute per repo; 6 pushes per minute |
| GitHub | `.git` 10 GB; a single push 2 GB |
| GitHub | Objects 1 MB recommended, 100 MB enforced |
| GitHub | At most 3,000 entries per directory |
| GitHub | A PR diff shows at most 300 files or 20k lines |
| GitHub | PRs from forks get no secrets |
| Cloudflare Workers static assets | 20,000 files per version (Free), 100,000 (Paid) |
| Cloudflare Workers static assets | 25 MiB per file; static requests are free |
| Cloudflare Workers Paid | $5 a month, includes 10M requests; 128 MB memory per isolate |
| Cloudflare R2 | $0.015 per GB-month, free egress; Class A $4.50/M, Class B $0.36/M |
| Git LFS | 10 GiB free, then metered. Avoid it. |

## Acceptance scenarios

The MVP seed data must express all of these through the same generic engine.

- **A. Ownership vs control vs passive holdings.** Index-fund managers hold stakes in many companies. Answer "who owns BlackRock and Vanguard", and keep hubs from swallowing every path.
- **B. Religion.**
  - Three layers of claim: what a text says (cited to the verse), what a tradition holds, what historians conclude.
  - One figure under many names (Moses = Musa = Moshe).
  - A figure that traditions see differently becomes linked facets.
  - Fuzzy BCE dates, with traditional and scholarly dating kept apart.
- **C. Perspectives.** Competing US and Soviet narratives of one Cold War event, a narrative diff between them, and facts confirmed by both sides.
- **D. Distinct paths.** GameStop ↔ Citadel through an investment in Melvin Capital, and through Robinhood order flow. Every hop is typed, dated and sourced, and the time slider works around January 2021.
- **E. Places.** A place hub (Santa Monica) gathers related entities and shows them in the Places lens on a map.
- **F. History.** "What happened after what" chains, on a deep-time timeline from prehistory to now.
- **G. Scale.** A synthetic 1M-node graph with a hub of 10k+ edges. The explorer stays within its memory and frame budgets, and the world map stays stable across merges.
- **H. Story.** A chapter of six or more shots plays in scroll mode and watch mode. Any shot opens the explorer at the same lens, focus and time.
