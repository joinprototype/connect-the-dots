# ADR-0009: Explorer, close views now, streaming world later

- Status: accepted
- Date: 2026-10-16

## Context

The explorer must feel like an open-world game: render only what is near, keep memory bounded, survive hubs with 10k+ links, and reach millions of nodes. The research disagreed on whether to draw it with a TypeScript renderer or with Rust wgpu compiled to WASM.

## Decision

- **Close views (Sprint 1):** sigma 3.0.3 + graphology (upgrade to sigma 4 once we have learned its new API) for ego graphs and paths, using per-entity neighbourhood data and a live layout in a worker.
- **World view (after the scale spike):**
  - deck.gl 9.4 TileLayer with OrthographicView over PMTiles built by Rust.
  - Content: Leiden hierarchy, pinned incremental layout, LOD ladder, per-tile caps.
  - Stable, versioned worlds.
- **Hubs:** above 500 links, a fan glyph with counts, the top 32 links inline, the rest paged on demand. Passive index holders collapse into one "index funds" node by default.
- **Budgets and leak control** as in architecture.md §8, with a 10-minute soak test.
- **TypeScript draws; no wgpu.** Measured download sizes favour TS engines by 20–100×, and mature TS engines still ship WebGL2 by default. WebGPU comes later, behind feature detection.

## Consequences

- The scale spike must run by Sprint 3 to prove the budgets on a synthetic 1M-node graph.
- Two renderers (sigma and deck.gl) cost about 320 KB brotli in the explorer only. Reading pages do not load them.

## Revisit when

The spike fails its budgets, or sigma's close views become a bottleneck. Then unify on deck.gl.
