# Sprint 10: Ready for a million entries

- Starts: 2026-10-17 · Length: 1 week
- Status: built and self-checked (2026-10-18, commit b85bdb1); demo and review with the founder pending

## Goal

Pages load what they show ([ADR-0017](../decisions/0017-pages-load-what-they-show.md)), with no visible change to today's site:
- the explorer and routes read one slim structure file;
- an entry's details load when it is opened;
- a story carries its own data;
- search loads only the words that match;
- hub and type pages stay bounded.

The threshold where the explorer needs a route service is measured and stated.

## Why now

The founder asked what a page weighs with millions of dots.
- **Already constant:** entry, question and story pages, about 8 KB of compressed HTML each.
- **Already scales:** the Map streams tiles (Sprint 2: 1M dots at 60 fps).
- **Whole-graph downloads:** the explorer, every story and every route question download all of `graph.json`: 164 KB for 338 entries, roughly 500 MB at a million.
- **Search:** `search.json` would reach about 75 MB.
- **Whole lists:** a hub's page and the type pages list everything.

Bulk imports (Wikidata identities, filings) are on the roadmap, so this comes first.

The first design (per-entry files with a growing browser index) was reviewed and rejected as too complex for what it buys. See ADR-0017.

## Scope

### Must
- [x] **S10-01 Engine data files.** These live in `data/`:
  - `schema.json` (vocabulary);
  - `graph-slim.json` (every entry and link, structure fields only);
  - `e/<id>.json` (one entry's details, hubs capped at 100 links per kind with "and N more");
  - `search/<n>.json` and `search/index.json` (word ranges; one file while it fits).

  `graph.json` is written only with `ctd build --graph`. Builds stay byte-reproducible.
  - Built in `crates/ctd/src/site/data.rs`. Two builds differ only in their timestamps. The slim file is rows (objects were 34% bigger), and a detail file has no "and N more": the slim file has every link.
- [x] **S10-02 Stories carry their own data.** Each story page embeds the entries, links and sources its scenes name. The player reads that and `schema.json`.
- [x] **S10-03 The explorer reads the slim file**, and an entry's detail file when opened. Routes, filters, the index-funds model, perspectives and the year range work as today. Route results are identical for every featured pair and a random sample, with filters.
  - Panels load the detail files of what they show (`useWords`). Routes: 1,200 of 1,200 comparisons identical ([numbers](sprint-10/numbers.md)). Names and aliases in From, To and `?focus=` resolve through search.
- [x] **S10-04 Search and Ask read the search files.** Ask keeps its own matcher; entries carry a `rank`. Every name and alias is found as today.
  - Ask moved from `theme/static/ask.js` into the islands bundle (`web/src/islands/ask.ts`), so it shares the search loader. One file holds every entry today, as before.
- [x] **S10-05 Bounded pages.**
  - A hub's entry page lists 100 links per kind, with "and N more" opening the explorer.
  - Type pages split by first letter past 500 entries.
  - `/data/*` gets cache headers.
- [x] **S10-06 Proof.**
  - On today's site, no page requests `graph.json` (a sweep check), the sweep is clean, and the demo pages look the same.
  - A synthetic data-only build at 100k and at 1M entries records each file type's largest size and the slim file's size against its 1 MB budget.
  - The build warns when the slim file passes the budget.
  - `ctd build --synthetic <n>`: 1M entries in 35 s. The slim file holds about 40k links of today's kind within 1 MB ([numbers](sprint-10/numbers.md)).

### Should
- [x] **S10-07** Page history in one batched, rename-aware `git log` pass (backlog F9). Already so (`site/history.rs`); marked done in the backlog.
- [x] **S10-08** Re-run the contrast audit's review, one browser at a time. The phone sweep's contrast check: 54,433 texts, 0 too low (380 over canvas or images, unverifiable).

### Not in this sprint
- The route service (built when the slim file nears its budget).
- R2 for long-tail files. Deploy is on hold.
- Searching routes from both ends.

## Demo script

1. Open the explorer on BlackRock: the network panel shows the slim file and BlackRock's detail file, and no `graph.json`.
2. Open the BlackRock chapter: no data request beyond `schema.json`.
3. Search "nazarbayev": one search file.
4. The synthetic numbers: the slim file at 100k and 1M against its budget, and the largest detail and search files.

## Exit criteria

- Today's site looks and behaves exactly as before: sweep clean, stories, explorer, routes and the Map unchanged.
- No page downloads `graph.json`.
- 0 console errors and 0 CSP violations.

## Self-check (before the demo)

- [x] Tests and lints pass (63 engine tests, clippy, typecheck)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 695 pages, 0 problems, no `graph.json` request
- [x] Demo script executed; screenshots and numbers saved in `docs/sprints/sprint-10/`
- [x] Docs and ADRs updated (data contract: slim, detail and search files; ADR-0017 with the measured numbers)
- [x] Known issues listed

## Known issues

- Search forgives typos ("nazarbaev") only while it is one file. Past that, a query's words must start like the name's.
- A link past the 100-per-kind cap at both of its ends (two hubs) has no detail file: the explorer shows its sentence without qualifiers or proof. None today.
- In the explorer, a link's qualifiers and proof appear a moment after its panel opens (its detail file loading).
- The hand-made dev fixture site (`web/fixtures/`) is gone: it mimicked the old data files. `npm run dev` now serves a `ctd build` output with the browser code live.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
