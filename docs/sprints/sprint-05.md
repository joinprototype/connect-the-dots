# Sprint 5: Every acceptance scenario holds

- Starts: 2026-10-17 · Length: 1 week
- Status: **done** (2026-10-17). Musts S5-01 to S5-04 are done, plus a family-ties pack. S5-05 (deploy) waits for the founder's Cloudflare login. S5-07 (share images) moves to Sprint 6; text previews are done.

## Goal

Every MVP acceptance scenario in [requirements.md](../requirements.md) (A to H) can be shown on the live site, through the same generic engine, with sourced content.

## Why now

Sprint 4 made the founder's own questions answerable. Three of the eight acceptance scenarios still have no content behind them:
- E: the Santa Monica place hub;
- D: GameStop ↔ Citadel's second path, through order flow (Sprint 3's version was dropped because the S-1 says order-flow deals are not binding contracts);
- F: deep-time "what happened after what" chains.

Until they hold, the engine is only proven on the examples it grew up with.

## Scope

### Must
- [x] **S5-01 E. Places.** Santa Monica as a place hub: what happened there and what came from there (for example the RAND Corporation and Douglas Aircraft), joined to the existing graph, with every link sourced. It shows in the Places lens and on the map scenes of its story.
  - Research pack (2026-10-17): 10 entries, 11 sources and 18 links, all re-fetched and verbatim-checked by a second agent. It covers the city, Douglas Aircraft's plant at the airport, Project RAND (created by the US Army Air Forces in 1946 inside Douglas) becoming the RAND Corporation in 1948, and Frank Collbohm. It also covers Paul Baran's packet switching at RAND, which led to ARPANET, joining the internet's story, and RAND's Cold War role.
  - Data the sources did not support was dropped: Douglas's 1967 merger date (sources also differ on its founding year, 1920–1922), and Collbohm's birth year and full name.
  - Integrated (2026-10-17). A place's page now lists what is set there, "In Santa Monica" (entries whose `place` is the place, by date). Generic: every place gets it.
- [x] **S5-02 D. Distinct paths.** A second sourced path from GameStop to Citadel, through Robinhood's order routing, in words the filings support. The explorer shows both routes, and the time slider works around January 2021.
  - Content in (2026-10-17). A new relation `routed_orders_to` ("routed customer orders to"), because neither "contracted" nor "funded" is true of payment for order flow: the S-1 says the arrangements are "not documented under binding contracts". Robinhood routed customer orders to Citadel Securities, 2019 to March 2021. The sources are the S-1's revenue tables (Citadel Securities paid 34% of Robinhood's 2020 revenues for these orders) and the 18 Feb 2021 hearing, where Tenev and Griffin are quoted in their own words (`by:`).
  - `ctd path gamestop citadel`: route 1 via Melvin Capital (25 Jan 2021), route 2 via Robinhood → Citadel Securities → Ken Griffin, who founded both. All primary records.
  - The explorer (`/x/?from=gamestop&to=citadel`) lists five routes, all backed by primary records; the second runs through Robinhood's order routing.
- [x] **S5-03 F. History.** At least one "what happened after what" chain from prehistory to now on the deep-time timeline, with fuzzy dates (BCE, circa) kept honest.
  - Content in (2026-10-17): the rise of cities in Mesopotamia (c. 3500 BCE) → the invention of writing → the alphabet (David R. Olson's account) → the Latin alphabet → the printing press (Robert Lechêne's account) → the Gutenberg Bible. Gutenberg developed the press, c. 1439–1450. Sources: the Met, the British Museum, Britannica.
  - The first step (Neolithic farming → cities) was dropped: the Smithsonian quote is about farming in general, not Mesopotamia. Movable type came first in China and Korea; the sources say so, and the chain does not claim otherwise.
- [x] **S5-04 A, B, C, G, H check.** Walk each scenario on the live site and fix what does not hold:
  - A: who owns BlackRock and Vanguard, with passive holdings kept apart;
  - B: the three layers of a religious claim, and Moses = Musa = Moshe;
  - C: US and Soviet accounts of one event, with what both confirm;
  - G and H: as built in Sprints 1 to 3.
  - Found on the first walk (2026-10-17):
    - A: nothing is recorded as holding BlackRock, and "Vanguard is owned by its funds" is only page text, not a sourced link.
    - B: Moses has the text layer (Exodus) and the traditions' layer (Judaism, Christianity, Islam), but no historians' layer, and no BCE dates (traditional and scholarly kept apart).
    - C holds: "Thirteen Days, Two Stories" and the "Both sides agree" marks.
  - A, content in (2026-10-17). "Who holds BlackRock" now lists four holders:
    - PNC owned 22.4% until its May 2020 sale;
    - Vanguard held 8.31% for clients (2025 proxy; a note says Vanguard reported 0 shares after its January 2026 realignment);
    - Vanguard Capital Management holds 6.87% for clients (April 2026);
    - the Kuwait Investment Authority owns 5.14% (2026 proxy).
    The Vanguard Group is owned by the Vanguard funds (its prospectus). The next hop, "fund shareholders own the funds", has no honest relation yet: `owns_stake` cannot start from a group.
  - B, content in (2026-10-17). Moses leading the Exodus now has three accounts:
    - the text (Exodus 3:10);
    - the tradition (Judaism: year 2448, 1313 BCE);
    - a scholar (Dewey M. Beegle in Britannica: c. 1290 BCE).
    Beegle's identification of the pharaoh as Ramesses II is marked disputed, with Britannica's own article on Ramesses II as the reason. Ronald Hendel's account traces the story to memories of Egyptian rule in Canaan. Skeptical conclusions ("did not happen as told") have no relation, so they are not forced in.

### Should
- [ ] **S5-05 (carried from S4-06)** Cloudflare preview deploy. Waiting for the founder's Cloudflare login (`npx wrangler login`) and go-ahead.
- [x] **S5-06** A page per scenario: listed below ("Where each scenario shows"). A list in this file is enough for the demo; no new UI.

### Could
- [ ] **S5-07 (carried from S4-08)** Share cards: one image per route, question and entry, for link previews.
  - Text previews done (2026-10-17): every page has Open Graph and Twitter tags with its own title and description, so a shared question link shows its scope line and the notice. Images still to do: they need PNG rendering of the covers (e.g. `resvg`, with bundled fonts so builds stay reproducible).

### Not in this sprint
- The explorer's `?q=` mode, "Over time" on question pages, and the other "Later" parts of [design/ask-anything.md](../design/ask-anything.md).
- Self-hosting the story basemap (backlog, F13).

## Demo script

1. A: "Who holds BlackRock?" Index-fund holdings sit apart from owners.
2. B: Moses's page and the three layers of a claim about him.
3. C: "Thirteen Days, Two Stories", and what both sides confirm.
4. D: Explore GameStop → Citadel: two routes, each hop sourced and dated; move the time slider through January 2021.
5. E: Santa Monica: its page, Places lens and story.
6. F: the deep-time chain on the timeline.
7. G and H: the world map (eagle view) and a story in watch mode.

## Also done

- **Family ties pack** (2026-10-17), so a person's public family ties have sources. Each family was researched, then re-fetched and checked word for word by a second agent:
  - **The Wojcickis and Google:**
    - Susan Wojcicki's Menlo Park garage was Google's first office (1998–99); she was employee 16 and later YouTube's CEO.
    - Her sister Anne co-founded 23andMe, and was married to Sergey Brin.
    - Google invested in 23andMe in four rounds (2007–2012), and Brin lent and invested too (Google's own 8-Ks).
  - **The Musks:** Maye and Errol Musk; Kimbal Musk co-founded Zip2 with Elon and sits on Tesla's board (since 2004) and SpaceX's.
  - **Zuckerberg:** Priscilla Chan (wife; co-founded the Chan Zuckerberg Initiative, which held 414.6 million Facebook shares in 2016), and Randi Zuckerberg (sister; Facebook's marketing director, 2005–2011).
  - **Lenin:** his elder brother Alexander Ulyanov, hanged in 1887 after the attempt on Alexander III (which, by Krupskaya's account, shaped Lenin), and his wife Nadezhda Krupskaya (Bolshevik organiser, then a Soviet education official).
  - Every family tie has one primary record or two independent sources (the rule for sensitive links). There are no minors, and no relatives without a public role. Living people's birth years were left out unless a source needed them.
  - Totals: 270 entries, 521 links, 278 sources, 0 errors.

- `ctd check --base <git ref>` (backlog F28). An entry id that existed at the ref must still exist or be an alias, so `/e/<id>/` never breaks. The permanent `uid` tells a rename ("add `old` to its aliases") from a removal. It is tested against a real git repository.

## Where each scenario shows (dev server, http://127.0.0.1:4321)

| Scenario | Page |
|---|---|
| A. Ownership vs control vs passive | `/q/behind/blackrock/` (owners: PNC until 2020, the Kuwait Investment Authority) and `/e/blackrock/` ("Who holds BlackRock": index funds marked "held for clients"); `/e/the-vanguard-group/` |
| B. Religion | `/e/moses/` (the text, three traditions, the 1313 BCE tradition and the c. 1290 BCE scholar side by side; Moshe, Musa) |
| C. Perspectives | `/c/thirteen-days/` and `/q/why/cuban-missile-crisis/` |
| D. Distinct paths | `/x/?from=gamestop&to=citadel` (via Melvin Capital, and via Robinhood's order routing) |
| E. Places | `/e/santa-monica/` ("In Santa Monica") and its story |
| F. History | `/p/rise-of-cities-in-mesopotamia--bible/` (a 5,500-year chain) |
| G. Scale | `/w/` (eagle view); the 1M-node world from Sprint 2 |
| H. Story | `/c/rise-and-fall-of-the-soviet-union/` in watch mode |

## Exit criteria

- Each scenario A–H has a page that shows it, listed in this file with its URL.
- Every new link has a source, and quotes are checked word for word.
- No domain logic in code; dark mode first; phone layout works.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 51/51, clippy clean, `ctd check` 0 errors / 0 warnings (270 entries, 521 links, 278 sources), web typecheck and build clean
- [x] Phone sweep of every page (`tools/qa/sweep.mjs` on a static build): 568 pages, 0 problems
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-05/`: 48 screenshots of 12 pages (scenarios A–G, family ties, type pages), 0 console errors
- [x] Docs and ADRs updated: content model (`by`, `--base`), data contract (`here`, `_headers`, `/t/`, link previews, `routed_orders_to` via the schema), deploy checklist, CLAUDE.md commands, backlog
- [x] Known issues listed

## Known issues

- The era slider puts all of antiquity in one bucket ("Before 550 CE"). That is fine for a coarse filter, but not yet a deep-time timeline.
- Location links do not route, by design: a place gathers ("In Santa Monica") but never joins two entries just because they share a city.
- No Content-Security-Policy yet (Sprint 6).

## Review

- **What worked:**
  - Research packs (one agent researches, a second re-fetches and checks every quote) scale content without lowering the bar: 9 packs, about 140 links, and every reject was explained.
  - A generic `integrate_pack.py` writes a verified pack into content in seconds.
  - Generic engine features fell out of real content: `by:` for quoted speakers, `routed_orders_to`, "In <place>", `/t/<type>/`, and `--base` for permanent URLs.
- **What felt wrong:**
  - Some honest questions have no relation yet: "fund shareholders own the funds", and "historians say it did not happen as told". They wait in the backlog rather than being forced.
  - Long QA runs against the dev server crawl; sweeps now use a static build.
- **New ideas (moved to the backlog):** see the 2026-10-17 "Sprint 5 research" entries.
- **Decisions (ADRs):** none needed. Every change follows ADR-0005 (attribution) and ADR-0015 (questions).
- **Next sprint goal:** [Sprint 6](sprint-06.md), ready to share.
