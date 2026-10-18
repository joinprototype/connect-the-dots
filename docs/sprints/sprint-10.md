# Sprint 10: Ready for a million entries

- Starts: 2026-10-17 · Length: 1 week
- Status: proposed at the Sprint 9 review; the founder can redirect it at any time

## Goal

Every page stays small however big the graph grows. An entry page, a story and the explorer load what they show, not the whole graph, and search loads only the names that match. A synthetic build of a million entries proves it.

## Why now

The founder asked what a page weighs with millions of dots.
- Entry, question and story pages are already constant, about 8 KB of compressed HTML each.
- The Map already streams tiles (Sprint 2: 1M dots at 60 fps).
- The explorer and the story graphs download all of `graph.json`, though. That file is 164 KB compressed for 338 entries, about 0.5 KB per entry, so roughly 500 MB at a million.
- `search.json` would grow to about 75 MB.

Bulk imports (Wikidata identities, filings) are on the roadmap. These two files have to be split first.

## Scope

### Must
- [ ] **S10-01 Neighbourhood files.** The build writes `data/e/<id>.json` for every entry: the entry, its links (with their sources and quotes), the entries at their other ends (name, type, dates, coords) and the sources they cite. Shared vocabulary (types, relations, lenses, tiers, perspectives, questions, methodology) moves to one small `data/schema.json`.
- [ ] **S10-02 The browser loads neighbourhoods.** The explorer starts from the focus entry's file and loads a neighbour's file when it opens. A story loads the files of the entries its scenes name. Routes ("How are A and B connected?") load neighbourhoods breadth-first, up to the route limit, with a clear message when a route is too long to find in the browser.
- [ ] **S10-03 Search by prefix.** `data/search/<xx>.json`, split by the first two letters of each name and alias, plus a small index of the most-linked entries for the empty search box. The Ask form and site search load one prefix file per query.
- [ ] **S10-04 Proof at scale.** A synthetic content set of 1,000,000 entries (the Sprint 2 generator, extended to entries and links) builds, and:
  - every neighbourhood and search file stays under 50 KB compressed (hubs split or capped, with "and N more");
  - opening the explorer, a story and a search transfers under 300 KB in total;
  - build time and peak memory are recorded.

### Should
- [ ] **S10-05** Page history in one batched, rename-aware `git log` pass (backlog F9), so it no longer runs once per entry.
- [ ] **S10-06** Re-run the contrast audit's review, one browser at a time (stopped in Sprint 9).

### Not in this sprint
- Serving long-tail pages from R2 through a Worker (past about 80k files). Deploy is on hold.
- A server-side path API (needed past about a million traversable links).

## Demo script

1. Build the synthetic million: the build time, and the size of the largest neighbourhood file.
2. Open the explorer on a hub and expand three neighbours. The network panel shows a few small files and no `graph.json`.
3. Search for a name: one prefix file loads.
4. The real site behaves as before: same pages, same stories, and 0 problems in the sweep.

## Exit criteria

- With the real content, every page looks and behaves exactly as before (sweep clean; stories, explorer and Map unchanged).
- No page downloads `graph.json`. The file remains only for tools that ask for it.
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
