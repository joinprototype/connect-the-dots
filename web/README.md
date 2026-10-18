# web/: browser code for connect-the-dot

The Rust engine (`ctd build`) renders every page and writes the data files (`dist/data/`: `schema.json`, `graph-slim.json`,
`e/<id>.json`, `search/`) and the world tiles.
This package builds the browser code that enhances those pages. `ctd build` copies `web/dist/` to `dist/assets/`
(and `ctd serve` re-copies it whenever `web/dist/` changes).
The contracts are [`docs/data-contract.md`](../docs/data-contract.md) and [`docs/world-tiles.md`](../docs/world-tiles.md).

```sh
npm install
npm run dev             # the built site (../dist) on http://localhost:5173, with this code live (HMR)
npm run typecheck       # tsc for src/ and vite.config.ts
npm run build           # writes web/dist/
```

## Bundles

| Output | Entry | Loaded by | What it does |
|---|---|---|---|
| `islands.js` + `islands.css` | `src/islands/main.ts` | every page | Search and lens chips: vanilla custom elements in light DOM, no framework. About 3 KB gzip. |
| `explorer.js` + `explorer.css` | `src/explorer/main.tsx` | `/x/` | React 19 app on `#explorer-root`. |
| `story.js` + `story.css` | `src/story/main.ts` | `/c/<id>/` | `<ctd-story>` chapter player. |
| `world.js` + `world.css` | `src/world/main.ts` | `/w/` | The open-world map on `#world-root` (deck.gl). |
| `chunks/*.js` | shared or lazy code | | `deck` (deck.gl 9.4 + luma.gl, only on world pages and in the explorer's world mode), `sigma` (sigma 3 + graphology + ForceAtlas2, explorer and story), `gsap`, `map-view` (MapLibre 6, lazy), `preload-helper` and small shared libs. |
| `chunks/maplibre-gl-worker-*.mjs` | MapLibre's worker | `map-view` | Copied as is and passed to `setWorkerUrl`. |

`vite build` emits only these files: entries are TypeScript modules, not HTML, and `publicDir` is off. Built files expect to be served from `/assets/` (`base: '/assets/'`).
The `preload-helper` chunk is pinned on purpose: left to the bundler it ended up inside the deck.gl chunk, which made
`islands.js` import deck.gl on every page.

## Look

Calm and simple, like a reading app. Everything reads the site tokens (light by default, dark with
`prefers-color-scheme`; check dark mode first, it is what the founder uses): canvases sit on the page surface
(`--paper`), panels and cards use the `--night*` tokens. One accent (`--accent`) marks selection, focus and paths;
filled buttons and badges with white text use `--accent-fill` (`--accent-fill-hover` on hover), at least 4.5:1 in both
modes. Focus is a solid 3px `--accent` ring, as on the reading pages (drawn inside buttons whose group clips it);
text fields show it on their field instead.
`--highlight` marks quoted passages (yellow on light, a soft blue-gray in dark mode: never yellow on dark). Graphs are neutral: each app defines `--graph-node` (#8e8e93) and
`--graph-edge` (#c7c7cc, darker in dark mode) on its root, and the WebGL renderers read them at runtime. Meaning is never
carried by hue alone: attributed and draft claims are a lighter gray, past things are faded. No CSS filters,
`backdrop-filter` or blurred copies of WebGL canvases (Safari re-rasterizes those on every frame).

## Islands (`src/islands/`)

- `<ctd-search>`: enhances the server's `<input>`. The dropdown is a fuzzy match on the names and aliases of the entries the search files give for the text (`src/lib/search.ts`: every entry while there is one file) (`src/lib/fuzzy.ts`: whole name, prefix, word and substring matches first; scattered-letter matches only when nothing else matches) and supports arrow keys, Enter and Escape. It is right-aligned to the field and never wider than `min(420px, 100vw - 32px)`. On the explorer and world pages it dispatches a cancelable `ctd:focus` (`requestFocus()` in `src/lib/events.ts`): a page that can show the entry calls `preventDefault()` and the search stays put; anything else (chapters, entries not on the map, a world still loading) goes to the result's page.
- `<ctd-lens-chips>`: uses the server's `button[data-lens]` chips, or builds them from `schema.json`. It shows counts, hides `li.claim` items (and emptied `.claim-group`s) whose `data-layers` miss the lens, dispatches `ctd:lens`, and keeps `?lens=` in the URL.
- The Ask form on the home page (`src/islands/ask.ts`) turns names into pages with its own matcher (names with or without "the"; exact, then prefix, then word starts; best-connected first by `rank`). It reads the names the page embeds, the search files for the rest, and an entry's detail file to name its other question pages.
- Data is fetched once per page: `src/lib/data.ts` keeps one promise per file on `globalThis`, shared by every bundle on the page.
- URL updates (`?lens=`, the explorer state) all go through `src/lib/history.ts`: at most one `history.replaceState` per 300 ms, trailing, inside `try/catch`. Safari throws a `SecurityError` after 100 history writes in 10 seconds; see "Safari crash" below.
- The tabs and the `<ctd-ego-graph>` island were removed when entity pages moved to folded sections and an "Explore connections" link (no template uses them). The ego graph's Sprint 2 fixes (no overlapping labels, parallel links merged into one line with a count) were built and checked first; the label placement lives on in `src/lib/labels.ts`, used by the explorer and the world map.

## Explorer (`src/explorer/`)

- **`engine.ts`** owns the world state:
  - the graphology graph, laid out once by seeded, deterministic ForceAtlas2;
  - the sigma renderer: gray dots sized by degree, gray lines; selection, focus and the active path in the accent; hover and selection emphasis;
  - lens, time and perspective visibility, and passive collapse. Sigma's pixel ratio is capped at 2.
  - Passive collapse folds holders whose every link is passive into "Index funds"; their holdings are drawn as that group's lines. A holding on the shown route (or the selected link) whose holder is drawn as itself, like BlackRock, is drawn as the holder's own line, so the route never breaks off at a faded group dot.
- **Parallel links:** several links shown between the same two entries are drawn as one line, a little thicker for each (the most visible one: documented fact before an account or a draft). Selecting any of them, or a route through one, highlights that line; the link panel lists the others under "Also between them".
- **Search first:** with no `focus` and no `from`/`to`, nothing is drawn; the canvas shows one field ("Start from a person, place or event") and suggestion chips (the most connected entry of each kind). Picking an entry draws its links; clicking a dot (or picking another entry) opens that one's links too. At most 6 entries stay open and at most 60 entries are drawn (most recent first, then by degree), so it never becomes a hairball. With a route, the routes' entries are drawn.
- **Data** (ADR-0017): the explorer draws everything from `graph-slim.json` and `schema.json`; when a panel shows an entry or links, `useWords` (`words.ts`) loads the detail files that hold their words and proof (`e/<id>.json`: an entry's summary, aliases and life story, its links' qualifiers, notes and sources) and renders again. A link is looked up in its owner's file, then its target's (a hub's file keeps the strongest 100 links of each kind). What is drawn never depends on what is loaded. From, To and `?focus=` take aliases through the search files.
- **Plain words** (`src/lib/plain.ts`): "link", "proof", tier labels from `schema.json` `tiers` ("Primary record", "Scholarship & press", "Self-published"; a built-in copy covers older files), "Both sides agree", "X's account", "Being verified", "Disputed", "Withdrawn".
- **Why a link is disputed:** link cards and route steps (`ClaimCard`) show "Disputed: <reason>" (or "Withdrawn: …") and the author's note from the claim's `reason` and `note`, as entry pages do, in quiet italic lines under the badges. A note that only repeats the reason is left out; one that repeats it and says more takes its place (`claimNotes` in `src/lib/plain.ts`).
- **Family roles** (`src/lib/claims.ts` `kinshipRole`): on a relation with `kinship: true`, the claim's `role` qualifier describes its owner (`from`). Link cards and route steps always read from the owner ("Mary Maxwell Gates, mother of Bill Gates"); the owner's panel lists "Mother of Bill Gates" and the other person's panel "Mary Maxwell Gates · mother". The story graph labels the arrow "mother of".
- **Play:** when the focused entry's detail file names its life story, the details panel leads with "Play the story" (`/e/<id>/story/`); when `schema.json` `stories.paths` has the shown route as `from--to` (directional), the route panel shows "Play this route" (`/p/<from>--<to>/`). One accent button per panel. Routes read "2 links, all backed by primary records"; no costs, hops or tier codes, and "How routes are ranked" folds a plain explanation.
- **Labels** in the explorer, like the ego graph, are placed by `src/lib/labels.ts` (emphasized entries first, then the biggest dots), never overlapping each other, dots or the hover cards.
- **React** (`App.tsx`, `ui.tsx`, `panels.tsx`) owns only the controls. It passes a view object (filters, scope, selection, route) to `engine.setView()`.
  - **Left panel:** search; "Show" (the lenses as a segmented control); "Find a route" (From and To take names or aliases, also in the URL; picking To shows the routes). "More" folds the accounts select, the time slider (ease curve, play, "All time", BCE labels) and the index-fund options; it opens by itself when one of them is set.
  - **Canvas:** a labelled `<section>` (the page already has its `<main>`). Links | World map switch (`?view=world` loads the world viewer lazily, deck.gl included; picking a dot selects the entity, and focusing an entity in the panel flies there). Optional `data-world` on `#explorer-root` sets the world URL (default `/world/`). The world sits in its own stacking context under the explorer's controls; if it cannot load (or has no WebGL 2), the explorer says "The world map could not be loaded" with a "Show links" button and hides the zoom buttons and key.
  - **Right panel:** details of the selected node, claim or Index funds group, or the explanation of the selected path. A second tab holds the narrative diff.
  - **URL:** state is synced to `focus`, `lens`, `p`, `t`, `from`, `to` and `view`.
  - **Events:** dispatches `ctd:lens`, `ctd:time` and `ctd:focus`, and listens for `ctd:focus` (calling `preventDefault()` when it shows the entry, so site search stays on the page).
- **Time "as of t"** (`src/lib/dates.ts` `timeState`, `src/lib/filters.ts` `edgeTime`): a node or claim whose interval contains t shows normally; one that ended before t stays visible but faded ("past"); one that starts after t is hidden; undated ones always show. A claim is as late as its latest part: it is future if it or either entity has not begun, past if it or either entity is over. The key, the slider hint and the details panel explain "faded".
- **Slider load:** the slider keeps a local draft and hands the app at most one new time per animation frame. The map follows every frame; the path search, the URL and `ctd:time` follow a copy of t throttled to 250 ms.
- **Resilience:** engine calls from effects run through `guard()` (logged once, never thrown), and `ExplorerBoundary` shows "Try again" instead of a blank page if rendering ever fails.
- **Path finder** (`src/lib/paths.ts`):
  - Dijkstra over `(node, hops)` on an undirected view, capped at `max_hops`.
  - Hop cost uses the methodology formula with `deg_rel` per relation. The time penalty `delta_undated` applies only while a time filter is set.
  - It skips claims that are non-traversable, passive (unless included), deprecated, or hidden by the current filters. As of t it may use current and past claims, never future ones; paths that use past claims are flagged "includes ended links".
  - It returns `k_paths` diverse paths, using the penalty method with `reuse_penalty` per reuse of an intermediate node. Results are ranked by cost, and every tie-break is on ids.

### Safari crash (fixed)

Scrubbing the time slider wrote the URL on every `input` event. WebKit throws `SecurityError: Attempt to use
history.replaceState() more than 100 times per 10 seconds` (Chrome only throttles), the error escaped a React effect,
and React unmounted the whole explorer, so the page went blank. Reproduced in Chrome by emulating WebKit's limit
(after ~100 slider steps `#explorer-root` was empty) and confirmed by the founder's Safari error log. Fixed at the
source (`src/lib/history.ts`), plus the per-frame slider coalescing, the throttled path search, `guard()`,
`ExplorerBoundary`, and no blurred WebGL copies (the old glow layer read the WebGL canvases back on every frame).

## Story player (`src/story/`)

- **Data:** a story reads its own entries, links and sources from its page (`script.ctd-story-data`, beside the shots) and the vocabulary from `schema.json`, nothing else (ADR-0017).
- **Layout:** a sticky stage sits beside the scrolling `.step` cards. Below 860 px the stage is stacked above the cards.
- **Scrolling:** ScrollTrigger activates a shot when its step crosses the trigger line.
- **Map shots** (`map-view.ts`, lazy): MapLibre (pixel ratio capped at 2) with the OpenFreeMap Positron style on the globe projection, quieted to the page surface: land is `--paper`, water a faint tint, borders and roads hairlines, and the only basemap labels are countries (smaller ones from zoom 3) and capitals (from zoom 4), in `--night-muted` without halos. `flyTo` camera moves; one labelled marker per spot (an entry placed at its birthplace replaces that place's marker); great-circle `routes` in the accent, drawn progressively. The basemap (style, vector tiles, sprites, and the Noto Sans glyphs for its labels) comes from `tiles.openfreemap.org`, a third-party host: a story with a map scene makes about 20 requests there. MapLibre's stylesheet (`/assets/maplibre-gl.css`, 83 KB) is not part of `story.css`: `loadMapCss()` (`src/world/basemap.ts`, shared with the Earth view) links it when the first map is made, so stories without a map scene never load it. It comes after `story.css`, so the story's rules that override it start with `ctd-story` to be more specific.
- **Graph shots** (`graph-view.ts`, lazy): sigma, one layout for every entity and claim in the chapter, so positions stay put while `reveal` and `reveal_claims` add to the picture cumulatively. The camera frames the revealed entries with about 13% padding, room for the labels on the right, and away from the overlay card (whichever of the bottom or right band costs less room). Sigma 3 ignores programmatic camera moves while wheel and drag are disabled (they are, so the page scrolls), so `moveCamera()` lifts the flags only for each `setState`; before this fix the story graph was never framed at all. Gray dots and lines; the focus and the claims each shot adds are drawn in the accent, then turn gray. Claims attributed to other perspectives are dimmed. Graph shots show the world **as of the shot's time** (past faded, future hidden), and the HUD says "faded: already over by …" when anything is faded. A `reveal_claims` entry `x#c1` also matches `x#c1/1`, `x#c1/2`, ….
- **Views and overlays:** map and graph crossfade; overlay cards are white cards (source cards with title, publisher, tier and the quote under a yellow highlighter; quote cards; image cards) plus an "According to X" badge.
- **Controls:** **Watch** steps through the shots using `shot.duration` (default 6 s). Wheel, touch scrolling and the scroll keys (arrows, Page Up/Down, Home, End, Space) pause it from anywhere, also while the Watch button or a dot has focus. Only a tap on the controls, or Space on a focused control, is left to its click (so Pause pauses on touch, Space and Enter); a touch that starts on the controls and moves more than 12 px is scrolling, so it pauses too. The dots jump to a shot and are labelled "Scene 3: <first sentence of its narration>"; `#shot-<name>` deep-links to one. Hiding the tab or leaving the page (`visibilitychange`, `pagehide`) pauses Watch. "Explore from here" fills in `/x/?focus=&lens=&p=&t=`.
- **Listen:** a toggle beside Watch (`aria-pressed`) that reads each scene aloud while watching, with the browser's own voice (`speechSynthesis`; no new host). It is off by default, remembered in `localStorage` (`ctd-listen`, inside try/catch), and hidden when the browser has no speech; it works under reduced motion too.
  - What is read: the step card's paragraphs as plain text, one utterance each, without `p.step-time`, `p.step-explore` and `p.step-source`. "Step 1 of 2." in route stories is read too.
  - The voice: the browser's default voice if it is English; otherwise none is forced and `lang: en-US` lets the browser pick. The rate is the browser's.
  - Timing: a scene's voice starts 0.4 s after the scene, so scenes that Watch only passes on its way back to the start stay silent. The next scene comes when both the scene's `duration` and its last utterance are done. Before a scene speaks, whatever is still speaking is cancelled.
  - Pause, a scroll, a dot, turning Listen off and leaving the page cancel the voice at once; Play speaks the current scene again from its start.
  - A tap on Watch or Listen also starts an empty utterance: iOS speaks only after a voice started from a tap. A voice that never reports its end is given up after 10 s plus 1 s per 5 characters, so Watch cannot stall.
- **Accessibility:** the stage is `aria-hidden`, so nothing in it takes keyboard focus (a MutationObserver sets `tabindex="-1"` on proof-card links and the map attribution). A proof card's "Read the source" link is repeated in its step card, visible when it has focus.
- **Reduced motion:** `jumpTo` replaces `flyTo`, there are no tweens, and views switch instantly.

## World viewer (`src/world/`)

`/w/` serves `<div id="world-root" data-src="/world/">`. Query parameters: `?src=/world-synth/` (any same-origin world;
other origins are ignored), `?focus=<entity id>` (content worlds), `?stats=0|1`, `?labels=0`, `?rs=<size factor>`,
`?soak=1&soakSec=300`. The handle is on `window.__ctdWorld` for tests.

- **Tiles** (`tiles.ts`): `parseTile()` validates the header and returns typed-array views straight over the response buffer (zero copy; a big-endian fallback copies). `labelAt()` decodes one label on demand. Missing tiles (404/410, or an HTML fallback page) are empty tiles.
- **Coordinates:** the unit square is drawn `WORLD_SIZE = tileSize = 512` common units wide in an `OrthographicView` (`flipY`, so y grows down like the contract). For non-geospatial views deck.gl 9.4 picks tile `z = ceil(zoom + zoomOffset)` and tile `(x, y, z)` covers `[x, x + 1) · tileSize / 2^z`; with `zoomOffset: 0` that is exactly the contract's tile, drawn 256-512 px wide. `extent: [0, 0, 512, 512]`, `minZoom: 0`, `maxZoom: manifest.maxzoom` (deeper zooms overzoom the last level).
- **Layers** (`layers.ts`): a `TileLayer` subclass draws every tile's edges first (`LineLayer`), then every tile's nodes (`ScatterplotLayer`), then one shared `TextLayer` for the labels of the visible tiles (a TextLayer per tile would create a font texture per tile).
  - Positions are interleaved once per tile (8 B per node, 16 B per edge); radius (`size`) and `minzoom` stay zero-copy views.
  - Radius is `size × 512 × 2^(3 − maxzoom) × 2^zoom` (×2.4 on content worlds), clamped to 1.35-11 px (4-13 px on content worlds).
  - Edge opacity follows `eweight` and fades long links. Edges are stored in both end tiles, and best-available refinement briefly draws a parent with its children: edges use MAX blending of premultiplied colours, so a re-drawn segment never gets brighter. That is the dedupe by endpoint pair, with no bookkeeping.
  - Nodes fade (and grow) in when they first appear (`NodeStyleExtension`: a time uniform set in `draw()`, with no per-frame uploads): nodes with `minzoom > ` the zoom of the loaded ancestor that stood in for the tile; nothing fades when zooming out over loaded children. Region discs (cluster tiles) are soft gray.
  - Labels: up to 40 per tile (256 on content worlds), biggest first, placed on the CPU by `src/lib/labels.ts` (no overlaps, clear of the HUD, legend, card and stats). `CollisionFilterExtension` was tried and dropped: it only samples each label's anchor pixel, so labels beside their dot and partly overlapping labels got through.
- **Look:** gray dots and lines on the page surface (`--paper`), no grid; the selected dot is the accent.
- **Interaction:** wheel or pinch zoom, drag pan with inertia, keyboard; hover shows the label (entity name on content worlds) or "Node <id>"; clicking a region flies into it; clicking an entity dot shows a card with "Open page" and "Explore" (`/x/?focus=<id>`). Site search flies to the entity on content worlds. "s" toggles the stats overlay (fps, zoom, tiles, cache, nodes, edges, labels drawn, parse time, `performance.memory` heap).
- **Failure:** `mountWorld()` rejects when the world cannot load. On `/w/` the viewer says "The world map could not be loaded" (or that WebGL 2 is missing) in plain words; the build commands go to the console, and on the page only under the Vite dev server. Embedded, it shows nothing of its own and calls `onFail`.
- **Teardown:** deck.gl 9 keeps its GPU device, and so its WebGL context, alive after `finalize()` (devices are shared, so `device.destroy()` does nothing). `destroy()` therefore also stops the device's canvas observers and loses the context (`WEBGL_lose_context`), after deck.gl has finished creating it if it was still pending. Without this, about 14 World map/Links switches in the explorer pushed Chrome past its 16 live contexts, it dropped the sigma graph's, and Links turned into a blank panel.
- **Budgets:** `maxCacheByteSize` 128 MB (48 MB with `navigator.deviceMemory <= 4` or a small screen), counting each tile's buffer, derived arrays and an estimate of its GPU buffers; `maxRequests: 6`; off-screen requests are aborted through the TileLayer's `AbortSignal`; `onTileUnload` drops every array and sublayer of the tile. Device pixel ratio is capped at 2.
- **Soak** (`soak.ts`): `?soak=1[&soakSec=300]` loops a 48 s zoom in/out over a slow Lissajous pan, logs `[soak] {"t","fps","heap","tiles","tilesVisible","cacheMB","nodesDrawn","edgesDrawn"}` every 5 s, and finally sets `window.__soakResult` (min, max, avg of each metric, heap growth from the first to the last minute, and the average heap per minute).

### Measurements (2026-10-16, MacBook Pro M3 Pro, headless Chrome 155 with ANGLE Metal, production build)

| Test | Result |
|---|---|
| Tile parse + GPU arrays (1M world, 2,693 tiles, Node) | 0.10 ms max for the parse alone; in the browser 0.3-0.75 ms avg, 2-4 ms max per tile including interleaving |
| Pan at fixed zoom 1.5 / 2.5 / 3.5 / 4.5 / 5.5 / 7 (1M world) | 60 fps at every zoom (p95 frame 16.8 ms, max 16.8 ms); up to 20k nodes and 83k edges drawn |
| 5-minute soak, 1M world | fps min 55, avg 59.7; cache reaches the 128 MB budget after ~2 min and stays there (557-593 tiles); heap per minute 64.6 / 140.1 / 155.7 / 160.5 / 156.2 MB, so flat (±3%) once the cache is full; GC swings 139-180 MB inside a minute |
| Bundle | `world.js` 0.5 KB + viewer chunk ~13 KB gzip + `chunks/deck` 271 KB gzip (loaded only on world pages); `islands.js` 3.8 KB gzip |

SwiftShader (software WebGL, as in CI screenshots) renders correctly but at 30-40 fps; those numbers are not representative.

## Dev server

`npm run dev` serves a `ctd build` output with this code live, so run `cargo run -q -- build` first (and again after
content or template changes; `ctd serve` is the other way to work, rebuilding everything on save).

**How it maps requests** (`vite.config.ts`, `apply: 'serve'` only):
- Pages and `/data/*` come from `../dist`, or `$CTD_DIST`.
- `/assets/<entry>.js` serves the TypeScript source, and the `<script>` tags in pages are rewritten to point at it.
- `/assets/<entry>.css` is empty in dev, because each entry imports its own CSS.
- `/static/site.css` serves `../theme/static/site.css`, so theme edits show without a rebuild.
- `/world/` and `/world-synth/` are tile pyramids (missing tiles are plain 404s). `/world-synth/` falls back to
  `../.cache/world-synth` (`ctd world --synthetic 1000000`), like `ctd serve`. `CTD_WORLD=<dir>` and
  `CTD_WORLD_SYNTH=<dir>` point them elsewhere.

Useful URLs:
- `/e/elon-musk/`
- `/x/?from=bill-gates&to=elon-musk`, `/x/?t=1999&focus=cuban-missile-crisis`, `/x/?view=world&focus=elon-musk`
- `/c/who-owns-blackrock-and-vanguard/`
- `/w/`, `/w/?src=/world-synth/`, `/w/?src=/world-synth/&soak=1&soakSec=60`

## Assumptions about the contracts

- `li.claim[data-layers]` is space- or comma-separated. Lens chips may arrive without `data-layers`, in which case the layers are read from `schema.json`.
- Time filter: "as of t" (see the explorer section). Point-dated works and events become "past" after their date and stay visible, faded.
- Perspective = a specific id shows facts and that perspective's claims, and dims other attributed claims. The path finder may still use dimmed claims, because only hidden claims are excluded.
- The narrative diff compares claims whose `according_to` includes A but not B, and the reverse. "Both sides agree" lists only `cross_confirmed` claims whose voices include both A and B; when there are none it says so (it never stands in other confirmed links). Perspective B defaults to the perspective sharing the most entities with A.
- Source extras from the engine (`publisher_name`, `published_label`) are used when present. ISO dates are formatted otherwise.
- A `timeline` shot is drawn with the graph view, because there is no timeline view yet.
- Colours and fonts come only from contract tokens (plus the derived `--graph-node`/`--graph-edge`). WebGL renderers resolve tokens at runtime.
- World tiles: `entities.json` is an array indexed by node index. Entity `url`s are only used when they are same-site paths. The world legend is shown only when the manifest palette has hues; with the neutral palette it is hidden.
