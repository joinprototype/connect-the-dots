# Sprint 10: Ready for a million entries

- Starts: 2026-10-17 · Length: 1 week
- Status: active (proposed at the Sprint 9 review; scope revised after the design review, ADR-0017; the founder can redirect it at any time)

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
- [ ] **S10-01 Engine data files.** These live in `data/`:
  - `schema.json` (vocabulary);
  - `graph-slim.json` (every entry and link, structure fields only);
  - `e/<id>.json` (one entry's details, hubs capped at 100 links per kind with "and N more");
  - `search/<n>.json` and `search/index.json` (word ranges; one file while it fits).

  `graph.json` is written only with `ctd build --graph`. Builds stay byte-reproducible.
- [ ] **S10-02 Stories carry their own data.** Each story page embeds the entries, links and sources its scenes name. The player reads that and `schema.json`.
- [ ] **S10-03 The explorer reads the slim file**, and an entry's detail file when opened. Routes, filters, the index-funds model, perspectives and the year range work as today. Route results are identical for every featured pair and a random sample, with filters.
- [ ] **S10-04 Search and Ask read the search files.** Ask keeps its own matcher; entries carry a `rank`. Every name and alias is found as today.
- [ ] **S10-05 Bounded pages.**
  - A hub's entry page lists 100 links per kind, with "and N more" opening the explorer.
  - Type pages split by first letter past 500 entries.
  - `/data/*` gets cache headers.
- [ ] **S10-06 Proof.**
  - On today's site, no page requests `graph.json` (a sweep check), the sweep is clean, and the demo pages look the same.
  - A synthetic data-only build at 100k and at 1M entries records each file type's largest size and the slim file's size against its 1 MB budget.
  - The build warns when the slim file passes the budget.

### Should
- [ ] **S10-07** Page history in one batched, rename-aware `git log` pass (backlog F9).
- [ ] **S10-08** Re-run the contrast audit's review, one browser at a time.

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

- [ ] Tests and lints pass
- [ ] Phone sweep clean (static build, CSP enforced, `--a11y`)
- [ ] Demo script executed; screenshots and numbers saved in `docs/sprints/sprint-10/`
- [ ] Docs and ADRs updated (data contract: neighbourhood and search files)
- [ ] Known issues listed

## Known issues

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
