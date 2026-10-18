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
| World map | Rust `ctd world`: Louvain communities, pivot MDS layout, quota LOD, binary tiles (docs/world-tiles.md), alignment between builds (ADR-0013) | 1M nodes in ~1.4 s; PMTiles packaging later |
| Path finder | Rust `ctd path` (native, also draws the home-page route) + TypeScript in the explorer, same formula; one Rust kernel as WASM *(planned)* | One implementation for build and browser |
| Close graph views | sigma 3.0.3 + graphology (Sprint 1; move to sigma 4 later) | WebGL2, fast to build; v4's API is newer than our tooling knows |
| World view *(planned)* | deck.gl 9.4 TileLayer + OrthographicView | Streams tiles, ~1M items at 60 fps |
| Maps and stories | MapLibre GL JS 6 (globe, terrain) + GSAP | Explainer-style animation |
| Explorer and editor apps | React 19 + Vite 8 (no SSR) | Reading pages are already HTML from Rust |
| Reading-page widgets | Vanilla TS custom elements (islands) | ≤15 KB JS on load |
| Dev server | Axum 0.8 (`ctd serve`, live reload) | The same framework serves later APIs |
| Hosting | Cloudflare Workers static assets + R2 | About $5 a month; free egress |
| Identity and discussion | GitHub | No accounts or database of our own |

## 3. Repository layout (monorepo until public launch)

```
crates/ctd/        Rust: model, check, build, serve (split into crates when a part needs its own consumers)
web/               Vite workspace: islands/, explorer/ (React), story/ (scene player), worker/ (planned)
theme/             MiniJinja templates, CSS tokens, fonts
content/           schema/, methodology/, entities/, sources/, chapters/  (see content-model.md)
docs/              you are here
```

At public launch the repo splits, with history kept, into `engine` (crates, web, theme, docs) and `content` (content). A private `ops` repo holds deploy configs and runbooks. See [ADR-0011](decisions/0011-repos-and-licenses.md).

## 4. The `ctd` CLI

| Command | Does | When |
|---|---|---|
| `ctd check` | Validates content against the schema; readable errors with file:line and a fix hint | Sprint 1 |
| `ctd fmt` | Fills missing `uid`s. Canonical YAML, claim ids and sorted claims are *(planned)* | Sprint 1 (basic) |
| `ctd build` | Compiles `content/` to `dist/` (pages, stories, JSON, search index, world tiles) | Sprint 1 |
| `ctd serve` | Axum dev server: watches files, rebuilds what changed, live reload. Builds into `.cache/serve/`, so `dist/` holds only production builds | Sprint 1 |
| `ctd path <a> <b>` | Path query from the terminal, for debugging ranking | Sprint 1 |
| `ctd world` | World tiles for the content graph, or a synthetic test world (`--synthetic N`) | Sprint 2 |
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
7. Write the data files (schema, slim structure, one detail file per entry, search by word range).
8. *(planned)* History index, layout and tiles.

```
dist/
  e/<id>/index.html          entity pages            c/<id>/index.html   chapters
  x/                         explorer app            world/              the Map's tiles
  data/schema.json           vocabulary              data/graph-slim.json   every entry and link, structure only
  data/e/<id>.json           one entry's words and proof          data/search/   search entries by word range
  build-manifest.json        engine version, content commit, methodology hash, counts
```

Pages load what they show ([ADR-0017](decisions/0017-pages-load-what-they-show.md)): entry, question and story pages stay the same size at any scale (a story embeds its own data); the explorer reads the slim file, about 27 bytes gzip per link of today's content (its entries included), until it passes its 1 MB budget at about 40,000 links, when the explorer and routes move to the route service.

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
  - `/e/<id>/story/`: generated life story; `/p/<a>--<b>/`: route story;
  - `/q/<question>/<id>/` (and `/story/`): question pages, "Who is behind X?", "Why did X happen?", "Who benefited from X?". Defined as data in `content/schema/questions.yaml` ([ADR-0015](decisions/0015-ask-anything.md));
  - `/t/<type>/`: every entry of one type, A to Z (the home index shows each type's best-connected entries and links here);
  - `/c/<id>`: chapter;
  - `/x?focus=&lens=&p=&t=`: explorer;
  - aliases redirect to the canonical id.
- **Entity page** (calm layout, [ADR-0014](decisions/0014-calm-design.md)):
  - a cover, name, type, one-line summary and "Play the story";
  - at-a-glance cards when they apply: family ties, life line (tenures only, one row each: who led or sat on the board, and when), holders, how each side tells it;
  - links grouped by relation, with the lens chips on their heading; each has its strongest-source badge, its footnoted sources, "According to X" where attributed, and a status badge with its reason;
  - Timeline, Proof (with archive links) and Page history as folded sections; no tabs.
- **Rendering:**
  - MiniJinja templates produce static HTML.
  - Islands are light-DOM custom elements, loaded when they scroll into view.
  - No React on reading pages; ≤15 KB JS before islands.
- **SEO and accessibility:** all content is real HTML. Every graph and timeline has a list or table equivalent, and reduced motion is respected.

## 8. Explorer (game-like)

- React SPA at `/x`; the engine owns the world state and React owns the controls. React never holds per-node state.
- **Close views** (ego graph, paths): sigma 4 over per-entity neighbourhood data, laid out live in a worker.
- **World view** *(planned)*:
  - deck.gl TileLayer over PMTiles built by Rust.
  - Leiden super-nodes when zoomed out, people when zoomed in.
  - Stable world versions; only changed clusters are re-laid-out.
- **Controls:**
  - Lens filters by layer mask.
  - Perspective filters by perspective set and drives the narrative diff.
  - Time filters by validity, with play.
  - Filters run on the GPU where possible.
- **Hubs:**
  - Above 500 links, a hub becomes a fan glyph with counts per relation, the top 32 links inline, and paged links loaded on demand.
  - Passive index holders collapse into one "index funds" node by default.

| Budget | Desktop | Phone |
|---|---|---|
| Visible nodes / links | 200k / 400k | 50k / 100k |
| Labels | 1,500 | 400 |
| GPU buffers | ≤ 96 MB | ≤ 48 MB |
| Tile cache | ≤ 128 MB | ≤ 48 MB |
| Main-thread JS per frame | ≤ 4 ms | ≤ 4 ms |

- **Leak control:**
  - one owner per GPU resource, destroyed when its tile unloads;
  - one AbortController per tile and view;
  - a 10-minute automated pan/zoom soak test where heap and GPU buffers must plateau.

## 9. Storytelling chapters

- **Format:** markdown plus ```` ```scene ```` blocks, each a YAML list of shots. See [content-model.md](content-model.md#chapter-with-scenes).
- **Player:** a small TS runner that drives the same engines (MapLibre for map shots, sigma/deck.gl for graph shots, the timeline). Overlays (source cards, document highlights, photos) are animated with GSAP.
- **Modes:**
  - **Scroll:** ScrollTrigger drives the shots.
  - **Watch:** autoplay with narration and captions.
  - **Explore from here:** opens `/x` at the shot's lens, focus and time.
- **Assets:**
  - MapLibre globe and terrain;
  - open imagery (NASA Blue Marble, Natural Earth);
  - historical borders from OpenHistoricalMap or Cliopatria, driven by the time cursor;
  - poster frames rendered by Rust for no-JS and reduced-motion readers.
- **Authoring:**
  - YAML by hand, with live reload;
  - a "capture shot" button in the explorer *(planned)*;
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
- Content arrives as public PRs, so the build treats it as untrusted: raw HTML in markdown is shown as text, links keep only relative, `#`, http(s) and `mailto:` targets, source and image URLs must be http(s) (`ctd check` error), and free text placed into generated stories is escaped. A Content-Security-Policy is in the backlog.
