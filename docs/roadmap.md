# Roadmap

Startup sprints: the order below is a best guess and is re-decided at every sprint review. Every sprint ends with a demo.

## Done

- **Sprint 0** (2026-10-16): research (12 fact-checked tracks), stack decision (three adversarial judges), architecture, content model, docs.
- **Sprint 1: look and feel slice.**
  - The real engine builds a local site from seed entities.
  - It has entity pages, an ego graph, a timeline, lens / time / perspective controls, a path finder and the first story chapter.
  - See [sprints/sprint-01.md](sprints/sprint-01.md).
- **Sprint 2: the open world (scale spike).**
  - A 1M-node synthetic world builds in 1.4 s and stays inside the tile budgets.
  - deck.gl viewer at 60 fps; memory flat in a 5-minute soak.
  - Content map stable across edits.
  - See [sprints/sprint-02.md](sprints/sprint-02.md).
- **Sprint 3: story everywhere, calm design.**
  - Generated life stories (with a Family scene) and route stories.
  - Apple Books-like redesign (ADR-0014): Ask home, Stories library, covers, plain words, dark mode without yellow.
  - Search-first explorer; Safari crash fixed.
  - See [sprints/sprint-03.md](sprints/sprint-03.md).
- **Sprint 4: Ask anything (v1)** (2026-10-17).
  - "Who is behind X?", "Why did X happen?" and "Who benefited from X?" are pages and stories. Questions are data (ADR-0015).
  - Accounts get equal columns, each quoting only its own words. Disputed links and drafts are kept apart and never counted.
  - The Ask form starts with the question. The Map opens on the content, with region names and an era slider.
  - Content: who founded the Soviet Union, GameStop's leadership, and seven voices on who gained or lost from the Soviet collapse.
  - See [sprints/sprint-04.md](sprints/sprint-04.md).

- **Sprint 5: every acceptance scenario holds** (2026-10-17).
  - A–H each have a page:
    - Santa Monica as a place hub;
    - a second GameStop ↔ Citadel route through order flow;
    - a 5,500-year chain from Mesopotamian cities to the Bible;
    - BlackRock's owners kept apart from index funds;
    - Moses with the text, the traditions and a scholar.
  - Family ties: the Wojcickis and Google, the Musks, Zuckerberg and Chan, Lenin's family.
  - `ctd check --base` keeps every entry URL alive.
  - See [sprints/sprint-05.md](sprints/sprint-05.md).

- **Sprint 6: ready to share** (2026-10-17).
  - A Content-Security-Policy (scripts only from the site) and security headers.
  - An accessibility pass: structure on every page, plus a keyboard path through Ask.
  - A deploy dry run (1,246 files), an "About" page, and featured questions on the home shelf.
  - The preview deploy is on hold: the founder wants to keep working locally for now (2026-10-17).
  - See [sprints/sprint-06.md](sprints/sprint-06.md).

- **Sprint 7: the Map shows the Earth** (2026-10-17). Links | Earth on `/w/`: a calm globe of the 76 entries with a place, the same era slider, planet → dot → card → page, and "On the map ›" on entry pages. Four answer pages gained second voices. See [sprints/sprint-07.md](sprints/sprint-07.md).

- **Sprint 8: watch and listen** (2026-10-17). "Listen" reads a story aloud as it plays, with the browser's own voice; question pages show their answer over time; story pages load the map stylesheet only with a map. Captions now read as sentences. See [sprints/sprint-08.md](sprints/sprint-08.md).

- **Sprint 9: Who owns BlackRock and Vanguard?** (2026-10-17). It added:
  - the first showcase chapter (17 scenes, every quote verified), with the common-ownership debate in each side's own words;
  - who a person is: citizenship, and background in a person's own words, never a connector (ADR-0016);
  - Larry Fink's and Sam Altman's paths, and the Nazarbayev family's documented roles;
  - life stories that play by year, a reworked story graph, and the explorer's slider spanning the focus's years;
  - a tested contributor guide with a pull-request check;
  - a simpler engine with reproducible builds.

  See [sprints/sprint-09.md](sprints/sprint-09.md).

- **Sprint 10: pages load what they show** (2026-10-18, [ADR-0017](decisions/0017-pages-load-what-they-show.md)).
  - The explorer and the Map read one slim structure file (17 KB gzip instead of 164 KB), and an entry's details when it is opened.
  - Stories carry their own data; search reads files by word range; hub and type pages stay bounded.
  - Synthetic builds at 100k and 1M entries: entry, story and search files stay small at any scale; the static explorer holds about 40k links, past which routes need the route service.
  - See [sprints/sprint-10.md](sprints/sprint-10.md).

## Now

- **Sprint 11: the record, step by step** ([ADR-0018](decisions/0018-legal-records.md)).
  - Legal records (charged, convicted, acquitted, overturned, settled, sanctioned), each step of a case beside the others, never a route.
  - The first records on primary sources: the SEC and Musk and Tesla, Citadel Securities, Robinhood; FINRA and Robinhood.
  - Dates with only an end ("until 1 Dec 2009"), and Listen reading each side's quote.
  - See [sprints/sprint-11.md](sprints/sprint-11.md). The founder can redirect it.

## Next (candidates, chosen at review)

- **Story v1.**
  - Map-to-graph morph.
  - Borders changing through time.
  - A "capture shot" tool.
- **Contribution loop.**
  - "Edit this page" links, and Issue Form → PR bot.
  - `ctd check` on PRs, plus review rules.
  - A History tab with per-claim diffs.
- **Deploy** (on hold: the founder works locally for now, 2026-10-17).
  - A Cloudflare preview, then production.
  - `ctd publish`, with a build manifest and asset versioning.
- **Content depth.**
  - About 300 entities, with Wikidata identities imported as proposed claims.
  - An SEC 13F holdings dataset.
  - The first showcase chapter.

## Later

- Path kernel in WASM; world map at full scale; a path API server once the graph outgrows the browser.
- Editor v1 (Sveltia or Decap open authoring), then our own editor.
- Archive bot, image ingest and takedown tooling.
- Legal entity, licenses, policies → **public alpha**.
- Video export of chapters, and share cards for paths and chapters.
- v2: the social layer (spaces, votes on claims with bridging-based scoring, comments).
