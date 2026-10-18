# Backlog

New ideas land in **Inbox** first. At sprint planning each one moves into a sprint or an epic. Within an epic, order is priority.

## Inbox

_Add ideas here with date and who suggested them._

- 2026-10-16 (Sprint 1 self-check): decide time-slider semantics (snapshot vs cumulative history).
- 2026-10-16 (Sprint 1 self-check): golden test that the TS explorer and Rust `ctd path` return identical paths and costs.
- ~~2026-10-16 (Sprint 1 self-check): ego-graph label collision and parallel-edge drawing.~~ Labels done (explorer in Sprint 3, story graphs in Sprint 9); parallel links merged in the explorer in Sprint 11.
- 2026-10-16 (Sprint 1 self-check): verify the two draft claims (Gise at ARPA 1958; crisis → Pacem in Terris) or drop them.
- 2026-10-16 (Sprint 1 self-check): perspectives.yaml covers only the Cold War pair; add contested sets as new domains arrive.
- 2026-10-17 (content pack 2): verify the draft `william-boyce-thompson#c2` (Red Cross money in 1917) against Kennan or Hagedorn, or drop it; find a primary Reagan-official source for the SDI/arms-race view (only the Reagan Library exhibit is cited); kremlin.ru is unreachable from outside Russia, so its three sources rely on Internet Archive copies.
- 2026-10-17 (founder): question pages. "Who is behind X?", "Why did X happen?", "Who benefited from X?" as first-class answers, alongside "How is A connected to B?".
- 2026-10-17 (founder): eagle view. One continuous zoom from planet (eras, regions) down to a single dot and its proof.
- ~~2026-10-17 (Sprint 3): browse pages per type (`/t/<type>/`). Built in Sprint 4 as one A–Z page per type; split them into pages once a type passes a few thousand entries.~~ Done in Sprint 10: past 500 entries, one page per first letter.
- ~~2026-10-17 (Sprint 3): the Ask form resolves names on the client against 400 embedded names, then `search.json`. At large scale, shard `search.json` by prefix.~~ Done in Sprint 10: search files by word range (ADR-0017).
- 2026-10-17 (Sprint 2 viewer): a tile index in the world manifest, so large worlds stop requesting empty tiles (404s).
- ~~2026-10-17 (Sprint 3): explorer graph. Parallel links between the same pair still overlap; draw them curved or merged with a count, as the story graph does.~~ Done in Sprint 11: one line, thicker for each link.
- 2026-10-17 (Sprint 4 v1 cut): Ask anything, later parts. See [design/ask-anything.md](design/ask-anything.md) "Later":
  - `ties`, causes of causes, embedded "further" sub-answers;
  - ~~an "Over time" band on question pages~~ (done in Sprint 8);
  - an `answers:` methodology block;
  - the explorer `?q=` mode;
  - the "said YEAR" badge;
  - page-size warnings and richness scoring.
- 2026-10-17 (Sprint 3 review, F13; widened in Sprint 7): self-host the basemap of the story maps and the Map's Earth view, so neither makes a third-party request: vector tiles as PMTiles on R2, the style and sprites next to them, and the label glyphs served locally (or place names drawn as HTML labels in the system font). Today map scenes call `tiles.openfreemap.org` ([ADR-0014](decisions/0014-calm-design.md)).
- ~~2026-10-17 (Sprint 3 review, F28): `ctd check` should fail when an entity id disappears without becoming an alias.~~ Done in Sprint 5: `ctd check --base <ref>` (uids tell a rename from a removal). Use `--base origin/main` in the pull-request check once the repo is on GitHub.
- ~~2026-10-17 (Sprint 3 review, F9): page history runs one `git log --follow` per entry and chapter, about 8 minutes at 50k entries. Read it in one batched, rename-aware pass.~~ Done: one `git log --name-status` per build, renames followed (`crates/ctd/src/site/history.rs`).
- ~~2026-10-17 (Sprint 3 review, F2): a Content-Security-Policy in `_headers`.~~ Done in Sprint 6 (see deploy.md).
- 2026-10-17 (Sprint 7 review): on the Earth, draw country entries (the United States, Cuba, the Soviet Union) as quiet outlines or labels instead of centre dots, so a country never reads as one spot.
- 2026-10-17 (Sprint 6 review): an accessibility audit beyond structure: contrast in both modes, and a VoiceOver pass through Ask, an answer page, a story and the explorer.
- ~~2026-10-17 (Sprint 6 review): let `ctd serve` build into its own folder.~~ Done: `.cache/serve/`.
- 2026-10-17 (Sprint 5 research): "fund shareholders own the Vanguard funds" has no honest relation (`owns_stake` cannot start from a group). Allow a group as an owner, with a "fund shareholders" group, or say it in prose only.
- 2026-10-17 (Sprint 5 research): historians' skeptical conclusions ("the Exodus did not happen as told") have no relation. Consider a `historicity` note or a "questioned by" relation that is always attributed.
- 2026-10-17 (Sprint 5 research): Vanguard's 13G/A of March 2026 reports 0 BlackRock shares after an internal realignment on 12 January 2026, and the same realignment affects its Tesla, Microsoft and Amazon holdings links, which rest on older filings. Re-check them against VCM's 2026 filings.
- ~~2026-10-17 (Sprint 5 research): EDTF intervals with an open start (`../2026-01-12`) parse as a one-day span. Support open starts properly.~~ Done in Sprint 11: "until <date>", current before it.
- ~~2026-10-17 (Sprint 8 review): plural inverse phrases read stiffly in story sentences ("GameStop, *stakeholders* Ryan Cohen").~~ Done in Sprint 9 (`inverse_reads: list`).
- ~~2026-10-17 (Sprint 9, founder): relations for court and sanctions records (charged, convicted, acquitted, sanctioned), sensitive and always dated, so legal matters stop living in notes. Needs an ADR: who decided, which court, and appeals and reversals shown next to the original decision.~~ Done in Sprint 11 ([ADR-0018](decisions/0018-legal-records.md)).
- 2026-10-17 (Sprint 9, founder: "imagine all the public figures, historical people"): a scale plan, before roughly 50k entries:
  - ~~neighbourhood shards (`data/e/<id>.json`) instead of one `graph.json` for the explorer and stories;~~ done in Sprint 10 as a slim structure file, detail files and stories that carry their own data (ADR-0017);
  - ~~`search.json` sharded by prefix;~~ done in Sprint 10, by word range;
  - ~~page history read in one batched pass (F9);~~ done;
  - long-tail pages served from R2 through a Worker (past about 80k files).
  - Content at that scale comes from bulk imports (Wikidata identities, SEC EDGAR, company registries, open ownership data), marked as being verified until checked.
- 2026-10-17 (Sprint 9 research): a relation for disputing a finding (an account that says a claimed effect is not shown). The common-ownership debate is told only in the chapter, because "harmed by" could carry the academics' account but nothing could carry the firms' rebuttal, so a question page would have shown one side.
- ~~2026-10-17 (Sprint 9 research): EDTF open starts (`../2022-01-05`) still parse as one day.~~ Done in Sprint 11; the four links with "Until" notes now carry the dates. Five claims kept "Until <date>" in a note instead (MLIM and BGI as parts of their sellers; Nazarbayev's Security Council and Nur Otan chairs; superseded Vanguard holdings). With proper open starts, Tesla's holders card could also stop showing The Vanguard Group's pre-2026 stake next to Vanguard Capital Management's.
- ~~2026-10-17 (Sprint 9 chapter review): Listen does not read the quote cards, so in the debate scenes each side's own words are seen but not heard. Consider reading the card after the narration ("In their words: …").~~ Done in Sprint 11.
- 2026-10-17 (Sprint 8 review): try Listen on an iPhone (the silent-utterance unlock) and in Safari on macOS.
- 2026-10-18 (Sprint 11): Rakhat Aliyev's second conviction in absentia, by a Kazakh military court on 26 March 2008 (RFE/RL Newsline, 27 March 2008), needs a second independent source in English before it can appear (it is sensitive). Kazakh outlets (Kapital.kz, Caravan.kz) report it in Russian. BlackRock Institutional Trust Company's 2014 SEC order (Rule 105) names no parent; add it with a source that ties the company to BlackRock, Inc.
- 2026-10-18 (Sprint 11): State Street, the third of the "Big Three" index managers, has no entry yet. Its records are verified and waiting (Sprint 11 research): SEC settlements by State Street Bank and Trust (2010, 2016 twice, 2017, 2019) and State Street Corporation's 2021 deferred prosecution agreement in Massachusetts federal court. Add the entries with their ownership links, then the records.
- 2026-10-17 (Sprint 4 review): an account column with no words of its own shows no quote (a reporter's or scholar's summary is never shown as the account's words). Where an account is known only through a summary, consider showing it as "as reported by <publisher>".

## Epics

### E1 Engine and content
- Path kernel in Rust, shared by the build and the browser (WASM with raw exports, golden tests)
- `ctd fmt`: fill `uid`s and claim ids, canonical YAML, sorted claims
- History index with per-claim semantic diffs ("percent 5.8 → 6.1, source added")
- Perspective sets (`schema/perspectives.yaml`) and the "confirmed across perspectives" badge
- Methodology version stamped on every result
- Datasets manifest, with bulk data stored in R2

### E2 Explorer (game-like)
- Scale spike:
  - 1M synthetic nodes with a 10k-edge hub
  - Leiden + pinned fa2 → tiles → deck.gl
  - Budgets and a soak test
- World view with LOD ladder and stable world versions
- Hub mode: fan glyph, paged links
- Time slider play; narrative diff view
- "Capture shot" button for chapter authoring
- Share a path: permalink plus share-card image

### E3 Reading pages
- Map tab (MapLibre) for places and events
- Pagefind search, later a custom or Tantivy index
- Share cards (OG images) per entity and chapter
- "Wanted pages" (red links) list
- Accessibility pass: a list for every visual, keyboard paths, reduced motion

### E4 Storytelling
- ~~Watch mode with narration audio~~ Done in Sprint 8 ("Listen", the browser's own voice). Captions in other languages remain.
- Map → graph morph transition
- Borders through time (OpenHistoricalMap / Cliopatria) driven by the time cursor
- Document overlay with a highlighted quote
- Video export: step frames in a headless browser, encode to MP4
- Showcase chapters: "Who owns BlackRock and Vanguard?" and one history or religion chapter

### E5 Contribution and trust
- "Edit this page" links
- Issue Forms → bot PR
- PR template asking for sources and conflict-of-interest disclosure
- `ctd check` GitHub Action using a prebuilt binary
- Review rules:
  - CODEOWNERS
  - two approvals for sensitive relations
  - maintainer review of each contributor's first PR
  - DCO sign-off, squash merge
- Archive bot: Wayback Save Page Now plus sha256
- Image ingest: license gate, strip metadata, resize, hash, store in R2
- Show open PRs and discussions on each entity page
- Nightly mirror of PR and issue threads to R2
- Takedown hide-list kept outside git; private intake for sensitive tips
- Editor v1: Sveltia CMS or Decap open authoring

### E6 Ops and launch
- Cloudflare hosting (Workers static assets + R2), `ctd publish`, build manifest, cache and versioning
- `ctd watch` auto-publish daemon
- Imports (as proposed claims):
  - Wikidata identities
  - SEC 13F / 13D / 13G filings
  - GLEIF, Theographic, OpenBible, Pleiades
- Legal:
  - legal entity, terms of service
  - content policy (rules for living people, inclusion policy)
  - privacy notice, DMCA agent, takedown runbook
- Licenses decision ([ADR-0011](decisions/0011-repos-and-licenses.md)), domain name, privacy-friendly analytics
- Split the monorepo into public engine and content repos (plus private ops) at launch; mirror off GitHub

## Icebox (v2 and beyond)

- Social layer:
  - spaces (place and topic hubs)
  - comments
  - votes on "does the source support the claim", with bridging-based scoring
  - reputation and feeds
- Our own in-site editor: GitHub App, entity autocomplete, fuzzy dates, graph preview
- Path API server (Axum + memory-mapped graph) when the graph outgrows the browser
- WebGPU where it is measurably faster
- Dolt or Postgres as the canonical store if GitHub limits bite
- Other languages
