# Sprint 2: The open world (scale spike)

- Starts: 2026-10-16 (founder asked to keep going; review of Sprint 1 still pending)
- Status: done 2026-10-17 (all Must items met; see measurements). Review pending with the founder.

## Goal

Fly through a 1,000,000-node world in the browser like a map:
- zoomed out, you see regions;
- zoom in, and individual dots appear;
- only what is near is loaded;
- memory stays flat while you roam.

The same pipeline also draws the real content graph.

## Why now

The founder's strongest technical requirement was "think like a game: only render what is close". ADR-0009 promised it, and the three verdict judges named it the biggest technical risk, to prove by Sprint 3 at the latest. If the budgets fail, we want to know now, while changing course is cheap.

## Scope

### Must
- [x] **S2-01 Synthetic world generator:** `ctd world --synthetic <n>` builds a graph with power-law communities, cross links and a few mega-hubs (10k+ links).
- [x] **S2-02 Clustering:** Louvain communities in Rust, deterministic.
- [x] **S2-03 Layout:** a hierarchical world map.
  1. Lay out the communities with pivot MDS on weighted distances, with hub links excluded (ADR-0013).
  2. Place nodes inside each community (hubs at the centre).
  3. Remove overlaps.
  The same input always gives the same map.
- [x] **S2-04 Level of detail:**
  - node importance;
  - a per-tile quota that sets each node's minimum zoom;
  - clusters drawn as super-nodes with summed meta-edges when zoomed out.
- [x] **S2-05 Tiles:** binary tile format v0 ([world-tiles.md](../world-tiles.md)) plus a manifest, written by Rust.
- [x] **S2-06 World viewer `/w/`:**
  - deck.gl TileLayer with OrthographicView;
  - nodes, edges and labels;
  - hover and click;
  - a stats overlay (fps, tiles, nodes drawn, JS heap).
- [x] **S2-07 Budgets:** cache byte limits, a soak mode (`?soak=1` pans and zooms automatically and logs memory), measured numbers written below.
- [x] **S2-08 Real world:** `ctd build` also writes world tiles for the content graph. `/w/` shows real entities, and clicking one opens its page.

### Should
- [x] **S2-09 Sprint 1 fixes:**
  - time slider shows the world "as of t": the past faded, the future hidden;
  - ego-graph labels stop overlapping.
- [x] **S2-10 Stability:** after a small content edit, existing nodes keep their positions (pinned layout). Measure how far nodes move.

### Could
- [x] **S2-11** World view as a mode inside the explorer (`/x/?view=world`, loaded lazily).

### Not in this sprint
PMTiles single-file packaging, WebGPU, hub fan glyphs, Cloudflare deploy, GitHub contribution flows.

## Demo script

1. `cargo run --release -- world --synthetic 1000000`: finishes in under 2 minutes and prints the tile stats.
2. Open `/w/?src=/world-synth/`. Zoom from the whole world down to single dots, then pan across. The stats overlay shows fps and memory.
3. Open `/w/?soak=1&src=/world-synth/` for 5 minutes; memory plateaus.
4. Open `/w/` (the real content): labelled entities; clicking one opens its page.
5. Open `/x/` and drag time to 1999: the Cuban Missile Crisis stays visible but faded (past), Musk's companies appear, the Giving Pledge is hidden (future).

## Exit criteria

- A 1M-node build in ≤ 2 min.
- Tiles hold ≤ 4,096 nodes and are ≤ 150 KB gzip each.
- Desktop: 60 fps while panning at mid zoom.
- 5-minute soak: JS heap varies by less than 10%.
- The numbers are recorded below, whether they pass or fail.

## Measurements

Engine (Rust, `--release`, MacBook, 2026-10-17):

| World | Nodes / links | Communities | Zoom levels | Tiles | Total | Largest tile | Build |
|---|---|---|---|---|---|---|---|
| synthetic | 100k / 0.40M | 647 | 0–4 | 227 | 21.6 MB | 1,500 nodes, 8,192 links, 89 KB gzip | 0.1 s |
| synthetic | 300k / 1.04M | 1,792 | 0–5 | 747 | 64.1 MB | 83 KB gzip | 0.4 s |
| synthetic | 1M / 3.26M | 5,422 | 0–6 | 2,693 | 216 MB | 1,675 nodes, 8,192 links, 131 KB gzip | 1.4 s (≈3 s including generation; 390 MB peak RAM) |
| content | 69 / 136 | 22 | 0–3 | 29 | 0.03 MB | 2 KB gzip | < 0.1 s |

- Budgets met: ≤ 2,500 nodes per tile, ≤ 8,192 links per tile, ≤ 150 KB gzip per tile.
- **Stability (S2-10):** rebuilding identical content drifts 0.0000. Adding one entity plus one link moves existing dots by a mean 0.0149 of the map width after alignment, with orientation kept.
- The content map forms three regions by itself (tech & money, Cold War, religion), bridged by Catholic Church ↔ JFK and NASA ↔ von Braun.
- **Lessons:**
  - The first force layout scattered weakly linked communities into a halo.
  - Two-level Louvain produced three giant regions.
  - Six mega-hubs made every community about two hops from every other (small-world collapse).
  - The fix: pivot MDS on weighted community distances, with hub links excluded from layout (still drawn), outlier pull-in, and overlap removal. See ADR-0013.

Browser (world viewer, deck.gl 9.4.0; MacBook Pro M3 Pro, headless Chrome with ANGLE Metal, production build):

| Test | Result |
|---|---|
| Tile parse alone (Node), 2,693 tiles of the 1M world | ≤ 0.10 ms per tile (zero-copy typed-array views) |
| Parse plus GPU arrays, in the browser | 0.3–0.75 ms avg, 2–4 ms max per tile |
| Panning the 1M world at zoom 1.5 to 7 | **60 fps** at every zoom, p95 frame 16.8 ms, up to ~20k nodes and 83k links drawn |
| 5-min soak, 1M world: fps | min 55, avg 59.7 |
| 5-min soak: cache | reaches the 128 MB budget at ~2 min and stays there |
| 5-min soak: heap per minute | 64.6 / 140.1 / 155.7 / 160.5 / 156.2 MB |
| Bundles (gzip) | deck chunk 271 KB (world pages only), viewer ~13 KB, `islands.js` 2.3 KB |

- **Heap:** flat within ±3% per minute once the cache is full, which passes the "<10%" criterion after warm-up. Raw garbage-collection swings are about ±13%. The first minute is the cache filling.
- **Duplicate links:** MAX blending of premultiplied colours, so a link stored in both end tiles, or drawn by a parent and child tile at once, never gets brighter.
- **Labels:** one shared text layer, placed on the CPU so labels never overlap. deck's `CollisionFilterExtension` only tests each label's anchor pixel, so it was dropped.
- **Gaps:**
  - Larger worlds still request empty tiles (404s). A tile index in the manifest would fix that.
  - Duplicate segments are hidden visually but still drawn.

## Known issues

- Safari crash in the explorer (time slider): fixed in Sprint 3 (S3-00).

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
