# Architecture

> Living document. Designed in Sprint 0 (2026-10-16). Built through Sprint 3 and the Sprint 4 engine (2026-10-17). *(planned)* marks parts not built yet. The reasons behind each choice are in [decisions/](decisions/).

## 1. Big picture

```
 contributors                                              readers
     │ PR (files)                                             │ browser
     ▼                                                        ▼
┌──────────────────────────────┐            ┌─────────────────────────────────┐
│ GitHub: content repo         │            │ Cloudflare                      │
│ PR = post · review = reply   │            │ static HTML / JS / CSS          │
│ `ctd check` on PRs (seconds) │            │ R2: data, tiles, images         │
└──────────────┬───────────────┘            └────────────────▲────────────────┘
               │ merge                                       │ upload changed files
               ▼                                             │
┌────────────────────────────────────────────────────────────┴──────┐
│ Maintainer machine: `ctd publish` (or the `ctd watch` daemon)     │
│ pull → check → incremental build → deploy → build manifest        │
└───────────────────────────────────────────────────────────────────┘
```

No database and no server in production for the MVP. Rust compiles the content; TypeScript draws in the browser.

## 2. Stack

| Layer | Technology | Why |
|---|---|---|
| Compiler and validator | Rust CLI `ctd` | Builds 100k pages in seconds; one binary for contributors |
| Parsing | serde-saphyr (YAML), pulldown-cmark 0.13 (wikilinks) | `serde_yaml` is deprecated |
| Page templates | MiniJinja 3 (runtime templates in `theme/`) | Theme edits need no Rust or recompile |
| Graph core | Rust: interned ids, CSR, typed and time-bounded links | ~40 B per link, including the reverse index |
| Path finder | Rust `ctd path` (native) + TypeScript in Ask and the Map (`web/src/lib/paths.ts`), same formula, checked equal by `tools/qa/paths-golden.mjs`; one Rust kernel as WASM *(planned)* | One implementation for build and browser |
| Maps | MapLibre GL JS 6 (globe, terrain), on the Map's Earth | Globe and terrain without our own tiles |
| Browser code | TypeScript bundled by Vite 8, no framework | Reading pages are already HTML from Rust. React, GSAP, sigma and graphology were dropped with the explorer and story player ([ADR-0031](decisions/0031-fewer-views.md)) |
| Reading-page widgets | Vanilla TS custom elements (islands) | ≤15 KB JS on load |
| Dev server | Axum 0.8 (`ctd serve`, live reload) | The same framework serves later APIs |
| Hosting | Cloudflare Workers static assets + R2 | About $5 a month; free egress |
| Identity and discussion | GitHub | No accounts or database of our own |

## 3. Repository layout (monorepo until public launch)

```
crates/ctd/        Rust: model, check, build, serve (split into crates when a part needs its own consumers)
web/               Vite workspace: islands/, atlas/, ask/, read/ (every story's page), place/ (the Map), forward.ts, worker/ (planned). Bundles: islands, atlas, ask, read, life, place, forward
theme/             MiniJinja templates, CSS tokens, fonts
content/           schema/, methodology/, entities/, sources/, chapters/  (see content-model.md)
docs/              you are here
```

The repo stays one piece when it goes public. It can split into `engine` and `content` later, once outside contributions make that worth doing. See [ADR-0011](decisions/0011-repos-and-licenses.md).

## 4. The `ctd` CLI

| Command | Does | When |
|---|---|---|
| `ctd check` | Validates content against the schema; readable errors with file:line and a fix hint | Sprint 1 |
| `ctd fmt` | Fills missing `uid`s. Canonical YAML, claim ids and sorted claims are *(planned)* | Sprint 1 (basic) |
| `ctd build` | Compiles `content/` to `dist/` (pages, stories, JSON, search index, world tiles) | Sprint 1 |
| `ctd serve` | Axum dev server: watches files, rebuilds what changed, live reload. Builds into `.cache/serve/`, so `dist/` holds only production builds | Sprint 1 |
| `ctd path <a> <b>` | Path query from the terminal, for debugging ranking | Sprint 1 |
| `ctd publish` | pull → check → build → upload changed files → manifest | *(planned)* |
| `ctd watch` | Polls GitHub for merges on `main`, then publishes | *(planned)* |
| `ctd assets` | Ingests images and source snapshots into R2 | *(planned)* |

## 5. Build pipeline and outputs

Stages:
1. Load schema.
2. Parse entities and sources in parallel.
3. Validate.
4. Intern ids and build the graph.
5. Derive reverse claims, backlinks and confirmation badges.
6. Render pages.
7. Write the data files (schema, slim structure, entries' details and life stories in shared packs, search by word range).
8. The islands (`data/islands.json`), which the Map draws, and the home page's picture of them (`w/picture.svg`).
9. The atlas, when `.cache/atlas` holds it: 2,048 shards, search, the Earth's tiles, the field of dots behind Read and Ask, and the landmark table for routes; the Map draws only the record ([ADR-0033](decisions/0033-the-map-draws-the-record.md)) ([ADR-0023](decisions/0023-the-atlas.md)). A dev server leaves it out.

```
dist/
  e/<id>/index.html          entity pages            c/<id>/index.html   stories
  ask/                       Ask                     w/                  the Map
  data/schema.json           vocabulary              data/graph-slim.json   every entry and link, structure only
  data/e/<n>.json            entries' words and proof, in packs   data/search/   search entries by word range
  data/life/<n>.json         life stories, in packs               e/_life/   the one page that opens them (read.html)
  data/a/<n>.json            atlas entries, packed by Wikidata number    a/   the one page that reads them
  data/routes.json           landmark table for routes                   x/ r/   forward old addresses to /c/ and /ask/
  earth/                     the Earth's places, by view
  build-manifest.json        engine version, content commit, methodology hash, counts
```

Pages load what they show ([ADR-0017](decisions/0017-pages-load-what-they-show.md)): entry, question and story pages stay the same size at any scale (a story embeds its own data); Ask and Stories read the slim file, about 27 bytes gzip per link of today's content (its entries included), until it passes its 1 MB budget at about 40,000 links, when they and routes move to the route service.

What a build writes today, file by file, is in [data-contract.md](data-contract.md).

Builds are deterministic: a pinned toolchain, sorted output and fixed seeds. Any machine produces the same bytes.

## 6. Graph engine and path ranking

- **Model.**
  - String ids are interned to `u32`, with CSR adjacency in both directions.
  - Per link: relation, layer bits, valid-from and valid-to, evidence level, perspective set and claim reference.
  - Size: about 200 MB for 5M links, versus about 2 GB as JS objects.
- **Cost of a hop.** All parameters live in `content/methodology/paths.yaml`, which is public and changed by PR.
  `cost = w_rel × (1 + β·(1 − p)) + λ·½·(ln(1+deg_rel(u)) + ln(1+deg_rel(v))) + δ_undated`
  `deg_rel` is degree per relation type, so a fund's 10k holdings do not penalize its founder link.
- **Search.**
  - Bidirectional Dijkstra.
  - Top-k diverse paths by the penalty method (k = 5, +3 per reused node).
  - Constraints are arc filters: relation mask, banned nodes, minimum sources, as-of date.
  - A hop cap.
- **Time.** "As of a date" filters links by validity interval. "What led to what" uses a time-respecting search over events, never plain Dijkstra.
- **Explanation.**
  - Each path shows its specificity, weakest evidence and time overlap.
  - Flags: "via passive holding", "via mega-hub".
  - Every path carries the notice: *a connection is not evidence of wrongdoing*.
- **Where it runs.**
  - Sprint 1: TypeScript in the browser (tiny graph, temporary).
  - Then: the Rust kernel compiled to a small WASM module with raw exports, the same code `ctd` runs natively, with golden tests to prove identical results.
  - Above ~1M traversable links or a ~5 MB compressed graph: an Axum path API over a memory-mapped CSR on a small server *(planned)*.

## 7. Reading pages

- **URLs:**
  - `/e/<id>`: the canonical entity page;
  - `/e/<id>/story/`: generated life story, one shared page ([ADR-0026](decisions/0026-entries-share-files.md)). Every story, written or generated, is drawn by one template, `read.html` ([ADR-0031](decisions/0031-fewer-views.md));
  - `/q/<question>/<id>/` (and `/story/`): question pages, "Who is behind X?", "Why did X happen?", "Who benefited from X?". Defined as data in `content/schema/questions.yaml` ([ADR-0015](decisions/0015-ask-anything.md));
  - `/t/<type>/`: every entry of one type, A to Z (the home index shows each type's best-connected entries and links here);
  - `/c/<id>`: written story (`/read/<id>/` redirects here);
  - `/ask/?a=&b=`: any two names, and a name, a year or a question ([ADR-0028](decisions/0028-one-box.md)); the old `/p/<a>--<b>/` and `/r/` addresses forward to it, and `/x/` to Ask, an entry's page or Stories;
  - aliases redirect to the canonical id.
- **Entity page** (calm layout, [ADR-0014](decisions/0014-calm-design.md)):
  - a cover, name, type, one-line summary and "Read the story";
  - at-a-glance cards when they apply: family ties, life line (tenures only, one row each: who led or sat on the board, and when), holders, how each side tells it;
  - links grouped by relation, with the lens chips on their heading; each has its strongest-source badge, its footnoted sources, "According to X" where attributed, and a status badge with its reason;
  - Timeline, Proof (with archive links) and Page history as folded sections; no tabs.
- **Rendering:**
  - MiniJinja templates produce static HTML.
  - Islands are light-DOM custom elements, loaded when they scroll into view.
  - No React on reading pages; ≤15 KB JS before islands.
- **SEO and accessibility:** all content is real HTML. Every graph and timeline has a list or table equivalent, and reduced motion is respected.

## 8. The Map

- **The Map** (`/w/`): the Stories surface (`web/src/place/`) over the whole window, by story or on the Earth ([ADR-0034](decisions/0034-one-map.md)). Positions come settled from `data/islands.json`; the Earth's are computed in the browser from coordinates and locating links, over `data/field.bin`. The old deck.gl viewer, its tiles and `ctd world` were removed in 0.5.3; the home page's picture is drawn from the islands.
- Each job has one view ([ADR-0031](decisions/0031-fewer-views.md)): Stories to read, Ask to find how two things connect, the Map to look around. The React explorer and its walk ([ADR-0029](decisions/0029-the-walk.md)) are gone.

- **Budget:** one 2D canvas, every dot of the record drawn each frame of a move and nothing at rest; names planned once per arrangement, so they never jitter; the Earth's land as one picture far out and only the dots in view nearer in, at most about 40,000 a frame.

## 9. Storytelling chapters

- **Format:** markdown plus ```` ```scene ```` blocks, each a YAML list of shots. See [content-model.md](content-model.md#chapter-with-scenes).
- **The page:** a story is one HTML page of words over the field of dots where it happens (`read.html`, `web/src/read/`); the words read with no script. A scene's `focus`, `reveal`, `places` and `camera` place it on the field; `overlay` shows as a quote, number or source card beside the words. The scene player, graph view, map view, Watch and "Explore from here" were cut ([ADR-0031](decisions/0031-fewer-views.md)). Details are in [data-contract.md](data-contract.md#story-cidc).
- **Assets:**
  - MapLibre globe and terrain (the Map's Earth);
  - open imagery (NASA Blue Marble, Natural Earth);
  - historical borders from OpenHistoricalMap or Cliopatria, on the Map's era slider;
- **Authoring:**
  - YAML by hand, with live reload;
  - video export by stepping frames in a headless browser *(planned)*.

## 10. Contribution and verification

- **P0 (GitHub-native):**
  - "Edit this page" opens the GitHub web editor.
  - Issue Forms ("Add a connection", "Report a problem") are turned into PRs by a bot.
  - `ctd check` runs on every PR.
  - The PR template asks for sources and conflict-of-interest disclosure.
  - Squash merges; DCO sign-off.
- **Review:**
  - One approval by default.
  - Sensitive relations (crime, sanctions, health, family, allegations) need two approvals, plus either two independent T1/T2 voices or one T1 record. The build withholds a sensitive claim that falls short, draft or not, until it is sourced.
  - A maintainer reviews every contributor's first PR.
  - CODEOWNERS per area.
- **Readers and the loop** ([ADR-0036](decisions/0036-play-and-help.md), [ADR-0037](decisions/0037-the-loop.md)):
  - `/missing/` lists what open data says and the record lacks, each with a link that opens an issue to send a source.
  - The loop ([loop.md](loop.md)): cheap scouts source leads on their own branches, `tools/loop/gate.sh` refuses what is mechanically wrong, one careful reviewer fetches every source again and merges into `main` what holds. Sealed entries, harms, living people beyond their public acts, interpretations, sensitive links and stories wait for the founder; a release always does.
- **Evidence:**
  - source tiers T1–T4;
  - archive bot (Wayback Machine plus sha256) *(planned)*;
  - claim status published / draft / disputed / deprecated ("Withdrawn": listed, never in a route or story);
  - cross-perspective confirmation computed from source voices.
- **Images** *(planned)*: link → download → license gate → strip metadata → resize → hash → R2.
- **Takedowns:**
  - A hide-list kept outside git: redeploy in under an hour.
  - History is rewritten only for doxxing, court orders or GDPR.
  - Sensitive tips come through a private channel.
  - No allegations in PR titles or commit messages.
- **Later:**
  - v1 editor: Sveltia CMS or Decap open authoring (forks and PRs under the contributor's own account).
  - v2: own editor, plus votes on "does the source support the claim" with bridging-based scoring.

## 11. Hosting, cost and scale switches

Cloudflare Workers Paid ($5 a month) serves static assets (free requests, 100k files per version). R2 holds long-tail pages, data, tiles and images ($0.015 per GB-month, free egress). Builds run on a maintainer machine.

| Trigger | Switch |
|---|---|
| More than ~80k static files | Serve long-tail pages from R2 through a Worker |
| More than ~1M traversable links, or a graph above ~5 MB compressed | Axum path API with a memory-mapped CSR on a small server behind Cloudflare |
| Sustained merges above ~1 per minute, or more than 1,000 open PRs | Batch-commit bot, then Dolt or Postgres with a git export |
| `.git` above 5 GB | Shard content repos by domain; builds pull pinned commits |
| WebGPU measurably helps | Add it behind feature detection, with a WebGL2 fallback |

## 12. Security notes

- Fork PRs get no secrets. Never run untrusted code under `pull_request_target`, and never use self-hosted runners on the public repo.
- Cloudflare tokens are scoped to one bucket and one Worker, and stay on maintainer machines.
- Every deploy carries `build-manifest.json`, so what is live traces back to a commit.
- Content arrives as public PRs, so the build treats it as untrusted: raw HTML in markdown is shown as text, links keep only relative, `#`, http(s) and `mailto:` targets, source and image URLs must be http(s) (`ctd check` error), and free text placed into generated stories is escaped. Every page carries a strict Content-Security-Policy (`dist/_headers`), so templates hold no inline scripts.
