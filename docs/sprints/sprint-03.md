# Sprint 3: Story everywhere, calm design

- Starts: 2026-10-17
- Founder input:
  - "can we do even better UI … waaaay better"
  - "I actually like the stories"
  - "we do not need so many colors… make it like apple books app"
  - "think like Jony Ive and Steve Jobs"
- Status: **done** 2026-10-17 (self-check complete; founder reviewed live)

## Goal

Every entity and every featured connection can be played as a story, and the product feels calm and obvious.

The UI shows:
- three places: Ask, Stories, Map;
- one accent color;
- plain words.

The explorer starts from a question or topic, never from the whole graph.

Design brief: [ux-vision.md](../ux-vision.md). Decision: [ADR-0014](../decisions/0014-calm-design.md).

## Scope

### Must

- [x] **S3-00 Crash fix:** the explorer time slider crash (founder, Safari).
  - Root cause: Safari allows at most 100 `history.replaceState` calls per 10 s.
  - Fix: URL writes are coalesced and guarded (`web/src/lib/history.ts`), plus an error boundary.
  - Verified with WebKit's limit emulated (`tools/qa/slider-webkit.js`): 552 fast slider steps led to 11 URL writes, no error and no blank page.
  - **Founder confirmed in real Safari on 2026-10-17: "dragger works fine".**
- [x] **S3-01 Entity stories:** `/e/<id>/story/` is generated from the entity's claims; "Play the story" is on the entity page.
- [x] **S3-02 Path stories:** `/p/<a>--<b>/` exists for featured pairs, one scene per hop. Home links to them.
- [x] **S3-03 Dossier infographics:** server-rendered life line, holders and perspective split.
  - Trimmed by ADR-0014: the fingerprint and the evidence meter were removed.
  - The life line is hidden when the dated span is under three years.
- [x] **S3-04 Ask (home):**
  - "How is [ ] connected to [ ]?" with autocomplete.
  - Names and aliases resolve to ids, then go to the explorer route.
  - A live example route is drawn as a transit line, with Play.
  - "Surprise me" was dropped (say no).
- [x] **S3-05 Explorer path panel:** route steps, each with its proof.
  - "Play this route" appears when a route story exists for that direction.
  - "Play the story" appears for any entry with a life story.
  - Both come from `graph.json.stories`.
  - Story maps were also calmed: country names and capitals only, dimmed, no halos, one marker per place.
  - Original plan: the path drawn as a transit line, synced with the graph, plus "Play as story".
- [x] **S3-11 Calm restyle of reading pages:**
  - Apple neutrals, one accent, system fonts (no web fonts).
  - Dark mode, segmented controls, rounded cards.
  - Lenses cut to five; layer colors neutral.
- [x] **S3-12 Covers:** a generated cover for every entry and story (title in serif, drawn from its own links). A photo replaces it when present.
- [x] **S3-13 Stories library (`/c/`):** shelves for Written, Connections, then life stories by type. 67 stories.
- [x] **S3-14 Plain words on reading pages:**
  - "links", "Primary record", "Both sides agree", "Being verified".
  - Entity pages have one control: the lens filter on the Connections heading. The tabs are gone.
  - Timeline, Proof and Page history are folded rows; footnote and hash links open them.
  - The in-page graph was dropped; "Explore connections" opens the explorer instead.
- [x] **S3-17 Family ties card:** on entity pages, for the founder's question "who are they from?".
  - Kinship links (`kinship: true` in `relations.yaml`) are listed with what each relative did: their own links, dated first, up to four.
  - Example: Jeff Bezos → his maternal grandfather Lawrence Preston Gise → Atomic Energy Commission; DARPA 1958 (being verified).
  - Generated life stories open with the same answer: a "Family" scene right after the intro, shown as a graph of relatives and what they did.
- [x] **S3-18 Content pack 2: backstories and the Soviet Union.**
  - 153 entities, 270 claims, 138 sources.
  - Two new written stories: "Behind the Success Stories" and "The Rise and Fall of the Soviet Union".
  - Family ties for Gates (parents, the United Way board, IBM's John Opel) and Bezos (parents' 1995 investment, grandfather Gise).
  - Zuckerberg's documented backers (Thiel, Accel, Microsoft).
  - The creation of the Soviet Union (German funding, the sealed train, Brest-Litovsk; Sutton's thesis marked disputed).
  - Its collapse as six attributed accounts side by side.
  - New relations: `funded`, `benefited_from`, `harmed_by`, `board_member_of`, `educated_at`, and `became` (added by the lead).
  - Lead review fixes:
    - "Bolsheviks" no longer spans 1903–1991. They `became` the Communist Party of the Soviet Union (8 Mar 1918, sourced to the congress resolution), so Gorbachev and Stalin lead the CPSU.
    - `benefited_from` and `harmed_by` are `attributed: true`, which `ctd check` enforces, and `traversable: false`, so opinions about who gained are never stepping stones in a route.
    - The engine route finder keeps searching after a repeated route, as the explorer does. "Bill Gates → IBM" now also shows the threads through his mother (The Seattle Times' account) and his father and IBM's John Opel.
    - Featured pairs can carry a note, which the story states up front. Zuckerberg → CIA says no source ties the CIA or In-Q-Tel to Facebook.
    - Route story steps read in each link's own direction; family links read "Mary Maxwell Gates, mother of Bill Gates"; claim notes are narrated.
    - "How each side tells it" shows every account (it was capped at four). The family card shows whose account each relative's link is.
- [x] **S3-15 Search-first explorer:**
  - No whole-graph start: one search field, then a 1-hop neighborhood that expands on click, within a node budget.
  - From/to accept names.
  - Plain words in the explorer and story UI; the side panel is simplified ("More" holds perspective, time and passive holdings).
- [x] **S3-16 Explorer, map and story restyle** to neutral plus accent, in light and dark.
  - No grid, no yellow on dark.
  - The story graph camera now frames what each scene reveals.
  - The search dropdown stays inside the window.

### Should
- [ ] **S3-06 Time machine:** event-density histogram under the slider, era bands, smooth fade in and out.
- [ ] **S3-07 Graph polish:** node glyphs per type, label halos, curved parallel edges, hover cards with quote.
- [ ] **S3-08 Lens instruments:** History → timeline lanes; Money → flow chart.

### Could
- [ ] **S3-09** ⌘K command palette.
- [ ] **S3-10** World galaxy polish: region names, minimap, fly-to.

## Demo script

1. Home: read "Ask how anything connects."
   - Type *Bill Gates* and *Elon Musk* (autocomplete), then press Ask. The explorer opens on the route.
   - Back on home, the example route draws itself. Press Play.
2. Stories (`/c/`): shelves of covers. Open "The story of Elon Musk", or a connection story.
3. `/e/tesla/`: holders chart (Musk 19.8% owned; Vanguard and BlackRock held for clients).
4. `/e/cuban-missile-crisis/`: "How each side tells it" (Washington / Moscow / Catholic Church), plus what both sides' records confirm. "Proof" opens from any footnote.
5. Switch macOS to light or dark: every reading page follows.
6. Explorer: drag time quickly; there should be no crash (Safari re-test).

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 26/26 (15 new), `cargo clippy --all-targets` 0 warnings, `ctd check` 0 errors / 0 warnings, web typecheck and build clean.
- [x] Code review of the sprint: 32 findings, 31 confirmed by a second check (F1–F31: 4 high, 20 medium, 7 low). All 31 were worked on; what remains is listed under "Still open".
- [x] Phone check: all 158 pages (every entry and chapter, `/`, `/c/`) at 390 × 844 with every fold open, dark and light: no sideways scroll, no console errors.
- [x] Output check: `graph.json`, `search.json` and the world tiles are byte-identical to the pre-fix build apart from timestamps; the page text changed only where a fix meant it to.
- [x] Docs updated: data contract, content model, world tiles, architecture, ADR-0014, ux-vision, backlog, and the docs map in `docs/README.md`.
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-03/`.
  - 48 screenshots: 12 demo pages, dark and light, desktop and phone, via `tools/qa/demo-shots.sh`.
  - One console error appeared during a concurrent rebuild; the same page was clean on re-run.

### Review fixes

What readers are told:
- **F1, F5 (high): family roles sat next to the wrong person.** Mary Maxwell Gates's page said "relative of: Bill Gates · mother". A `role` on a family link describes the claim's owner (`from`), and now every view says so: "Mother of Bill Gates" on her page, "Mary Maxwell Gates · mother" on his. The explorer panels and link cards, the timeline, the life line and the story graph's arrows follow the same rule.
- **F3 (high): "Both sides agree" listed links the two chosen sides never confirmed.** A link now needs both sides among its voices; when none has, the panel says so.
- **F8, F10: stories, life lines and family lists ignored a link's status.** Withdrawn links stay out of every story and at-a-glance card (they remain listed, marked, under Connections). Disputed links say "Disputed" and why.
- **F11: a link's reason was shown nowhere.** Entity pages print "Disputed: …" or "Withdrawn: …" under the badge, and the data contract now has `note` and `reason`.
- **F14: a family claim short of its sources was published as long as it was a draft.** Such a claim is now withheld from every output until it is sourced: a `ctd check` warning for a draft, an error otherwise.
- **F25, F26: "According to" repeated names, and counts read "1 links".** Each voice is named once; engine counts are singular for 1.

Safety and robustness:
- **F2 (high), F7: `javascript:` links in content became live links.** Markdown keeps only relative, `#`, http(s) and `mailto:` links; source and image URLs must be http(s) (an error, and the value is dropped); free text placed into generated stories is escaped.
- **F6: a featured pair naming one entity twice crashed the build and the dev server.** It is now a check error, and a route from an entry to itself is simply "none".
- **F27: bad featured picks and family relations passed check.** It now warns about a featured pair with no route or a featured life with no story. The schema refuses family relations between types without `family: true`, and interpretations that routes could use.
- **F9: every page and story scanned every link.** At about 46k entries that took 11.9 s. A per-entry link index makes it linear: 275 ms for 50k entries and 80k links.

Explorer, map and stories:
- **F4 (high): each switch to the World map leaked a WebGL context.** After about 14 switches the Links graph went blank. The viewer now releases its context: 40 fast switches, nothing lost.
- **F12, F24: picking a story in site search on `/x/` or `/w/` did nothing.** Search now opens the page, unless the explorer or the map can show the entry in place.
- **F21:** Pause did not pause on touch or with Space. **F22:** a world that failed to load covered the explorer's controls and showed build commands; the explorer now says "World map unavailable" and offers "Show links". **F23:** a route through a fund holding was drawn broken while index funds were grouped.
- **F30:** story scene dots read internal ids aloud, and the hidden stage held focusable links. **F31:** the explorer nested a second `<main>`.
- **F13: story maps call a third party** (OpenFreeMap: style, tiles, sprites and label glyphs), against ADR-0014's "no third-party request". Recorded in ADR-0014 as the one exception; self-hosting is in the backlog.

Design and accessibility, dark mode first:
- **F15:** hidden life-line tips widened entity pages on phones (up to 619 px at 390). Tips now stay inside their track. Three more phone overflows were found and fixed on the way (home "Try" links, a long attribution badge, a page-history file path).
- **F16:** filled buttons were 3.02:1 in dark mode and 2.19:1 on hover. New fill tokens give 4.70:1 and 5.57:1.
- **F17:** in dark mode `--sheet` equalled `--paper-2`, so the chosen lens, badges and tracks vanished. New `--raised`, `--selected` and `--fill` tokens.
- **F18:** Ask rejected ordinary names ("Cuban missile", "Bezos"). It now ignores case, accents and punctuation and ranks partial matches.
- **F19:** lens chips made entity pages download `graph.json`; the chips now carry their layers. **F20:** focus rings were under 3:1 and clipped; now a solid accent ring. **F29:** folds announced "Show/Hide" as part of their names, and the life bar read its date twice.
- **F28:** the data contract, content model and web types described things that no longer exist. Updated to match the build output.

### Round 2 (same day)

A second fix pass, then an independent re-check: 13 of 13 confirmed. The checks then passed:
- 33 tests;
- clippy, 0 warnings;
- `ctd check`, 0 errors;
- web typecheck;
- 0 console errors in 22 runs (11 pages, dark, desktop and phone).

What it covered:
- **F8:** the family card and "How each side tells it" mark disputed and draft links. Disputed and draft life-line bars are drawn hollow and dashed.
- **F26:** template counts read "1 date", "1 source" and "1 sourced link".
- **Timeline:** disputed and withdrawn items are marked in words.
- **F9:** page history is one `git log` per build, not one per page. A build of the current site takes 0.6 s.
- **Script JSON:** every `<`, `>` and `&` is escaped, so content can never close or open a script.
- **F11:** explorer link cards and route steps show the reason.
- **Story player:** Watch stops on arrow and page keys again.
- **Explorer, map and story player:** filled buttons use the 4.5:1 fill tokens, and focus rings are solid.

Lead follow-ups after the re-check:
- The automatic note de-duplication keeps only exact and prefix repeats. A look-alike note may differ in one fact, so it stays visible.
- "Both sides agree" now needs a published claim (no disputed or withdrawn).
- Page history no longer depends on git's `log.showRoot` setting.
- Content notes that restated their reason were trimmed.
- The explorer drops the empty badge line.
- The map canvas shows its keyboard focus.

### Still open

- `ctd check` does not notice an entity id removed without an alias, so its old URL breaks (F28). Backlog.
- Story maps still load OpenFreeMap (F13, ADR-0014 exception). Backlog.
- ~~`/x/` has no `h1` (F31).~~ Fixed in Sprint 4.
- ~~Explorer reverse route steps use inverse labels as verbs ("Tesla investors Elon Musk").~~ Fixed in Sprint 4: each step reads in its own direction.
- ~~`search.json` is in file order, so the Ask fallback picks the first match, not the best-connected one.~~ Fixed in Sprint 4.

## Measurements / known issues / review

- Reading pages make no third-party requests (web fonts removed); story maps are the one exception (F13 above). Headless check found no console errors on `/`, `/c/`, `/e/bill-gates/` and `/e/cuban-missile-crisis/`.
- **Fixed: overlapping life-line bars.** Bars that overlap in time used to print their labels over each other (Elon Musk: "CEO of SpaceX" and "CEO of Tesla"). They now stack into sub-rows, at most four per lane.
- **Fixed: 404 during a dev rebuild.** The dev server builds into `.cache/dist-next` and swaps it in. Test: 40 requests during a rebuild all returned 200. A failed build keeps the last good site.
- **Fixed: yellow on black** (founder, dark mode: "hurts my eyes").
  - Dark mode highlights are now a soft blue-gray (`#1f374f`).
  - "Being verified" is a dashed neutral outline.
  - Dark paper is off-black (`#111113`) and text slightly dimmed, for less glare.
  - Light mode keeps the yellow highlighter on white.
- **Fixed: interrupted builds.** A rebuild cut off mid-way used to block every later build ("not a previous build"). `dist/.ctd-build` is now written first.

## Review (founder, 2026-10-17, live during the sprint)

- **What worked:**
  - "I actually like the stories". Generated life and route stories carried the sprint.
  - The calm redesign landed ("I like it so far").
  - Safari: "dragger works fine".
- **What felt wrong:**
  - "some colors are chossen bad … we do not need so maaaaaany colors" led to ADR-0014.
  - "yellow on black is hard to see hurts my eyes": dark mode now has no warm accents.
- **New ideas (backlog):**
  - question pages ("who is behind", "who benefited", "why"), now Sprint 4;
  - the eagle view;
  - sharing a public link (prepared in `docs/deploy.md`).
- **Decisions:**
  - ADR-0014, calm design.
  - Family ties as a first-class card and story scene.
  - `became` for renamed bodies.
  - Interpretations are always attributed and never route stepping stones.
- **Working style:**
  - "continue working no stopping": work autonomously.
  - "make sure you are not overengineering and keeping it simple": ship v1 cuts, refactor between features.
- **Next sprint goal:** Sprint 4, "Ask anything" (v1 cut of [design/ask-anything.md](../design/ask-anything.md)).
