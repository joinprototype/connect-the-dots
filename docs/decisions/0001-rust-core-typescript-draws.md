# ADR-0001: Rust core, TypeScript draws

- Status: accepted
- Date: 2026-10-16

## Context

The system must:
- compile 100k–1M entity files quickly;
- keep a stable world map of 1M+ nodes (clustering, layout, tiles);
- rank paths;
- run a game-like explorer in the browser with bounded memory.

The founder asked whether to use Rust or Elixir, and asked that the choice be judged on project needs only.

## Decision

- **Rust** for the compiler and validator (`ctd`), the graph core, layout and tiles. It runs natively. The path kernel later ships to the browser as a small WASM module.
- **TypeScript** for everything drawn in the browser (sigma, deck.gl, MapLibre, GSAP) and for the explorer and editor apps (React).
- **No Elixir in the MVP.** Its strength, real-time social features, is v2 scope.
- **No Rust GPU stack** (wgpu, Bevy, egui) in the browser.

## Evidence

- Rust CPM Leiden on 1M nodes takes 5.8 s at 0.98 GB; the best JS option could not keep up.
- A Rust build prototype handles 100k notes in 6.3 s. Astro's published rate implies 13–52 minutes for 100k pages.
- Rust GPU stacks cost 2.8–10.5 MB compressed, against ≈228 KB for deck.gl and ≈89 KB for sigma.
- A pure-Elixir path engine is 35–40× slower than Rust.
- Three adversarial judges (MVP velocity, scale, openness) all confirmed the choice, with conditions. The strongest rival was TypeScript-only, not Elixir.

## Consequences

- Two languages, Rust and TypeScript.
- Contributors must not need Rust for content or themes. That means MiniJinja templates, prebuilt `ctd` binaries, and the WASM module published as an npm package.
- Ranking and layout parameters are public data (`content/methodology/`), not code.

## Revisit when

- Scope stays at or below ~100k entities for years and the world map is dropped. TypeScript-only would then be simpler.
- Or fewer than two maintainers can work in Rust.
