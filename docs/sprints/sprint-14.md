# Sprint 14: Tidy the engine

- Starts: 2026-10-30, at the founder's word · Length: 1 session
- Status: built and self-checked (2026-10-30); review with the founder pending

## Goal

The two functions everything runs through become short lists of named stages, with the site unchanged, and the two route finders are proven to agree.

## Why now

- **Two functions held most of the engine:** `site::build` (645 lines) and `kb::assemble` (633). Sprint 12 showed the cost: adding one card meant reordering calls that shared a footnote counter.
- **Footnotes ran out of order** on entity pages, because the cards at the top were numbered after Connections.
- **The route finder exists twice,** in Rust and TypeScript, and the test that they agree had waited in the backlog since Sprint 1.

## Scope

### Must
- [x] **S14-01 `kb::assemble`** becomes stages: entries, sources, aliases, background lines, findings, claims, prose, sides, featured picks, chapters, uncited sources. Down from 633 lines to about 35.
- [x] **S14-02 `site::build`** becomes one writer per kind of page, sharing a `Site` and `QuestionPages`. Down from 645 lines to 74.
- [x] **S14-03 `dossier()`** becomes its cards: stakes, life line, family, split. The Connections list and Timeline move out of `entity_page`.
- [x] **S14-04 Footnotes in reading order** on every entity page: the cards first, each numbered as shown, then Connections.
- [x] **S14-05 The route finders agree:** `tools/qa/paths-golden.mjs` compares them on the real graph.

### Found on the way
- [x] **A bug in the Rust route finder.** It kept only the cheapest way to each node, so a cheap, long path could use up the hop limit and hide a valid route. It now keeps one state per node and hop count, as the explorer always did, and breaks ties the same way. On 60 pairs it finds 116 routes, up from 105. The best route of every pair was already right, so no story or home page changed; alternatives near the hop limit did. A test covers it.

### Not in this sprint
- Unit tests for the browser code, and splitting `web/src/world/viewer.ts` (when next touched).
- Sharing one route finder (WASM): the check keeps the two honest until then.

## How it was checked

- Before and after each refactor, every built file was compared, ignoring only the build timestamp: 1,245 files, 0 different.
- The footnote fix is the one intended change: 45 entity pages, nothing else. No page's footnotes jump.
- `ctd path --json` is new, for tools.

## Exit criteria

- Output unchanged except footnote order; the two route finders agree on every pair checked.
- Sweep clean; 0 console errors.

## Self-check

- [x] Tests and lints pass (68 engine tests, clippy clean)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 768 pages, 0 problems; contrast 62,959 texts, 0 too low
- [x] Route check: 60 pairs, 116 routes, 0 differ
- [x] Docs updated (data contract, CLAUDE.md, the docs README, backlog, roadmap)
- [x] Known issues listed

## Known issues

- `web/src/lib/paths.ts` and `crates/ctd/src/paths.rs` are still two copies. The check runs by hand, not in GitHub Actions, where only `ctd check` belongs.
- `read_claims` (165 lines) and `entity_page` are the longest functions left. Both read top to bottom, so they stay.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
