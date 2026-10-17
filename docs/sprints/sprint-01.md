# Sprint 1: Look and feel slice

- Starts: at kickoff · Length: 1 week
- Status: demo ready (2026-10-16), waiting for founder review

## Goal

Click through a local site that already feels like connect-the-dot:
- open a few pages;
- switch lenses, scrub time and flip perspectives;
- ask "how is X connected to Y";
- scroll one short story.

It is built from real files by the real engine, at small scale.

## Why this first

The biggest open questions are about feel, not scale:
- Does the page read well?
- Do lenses and perspectives make sense to a newcomer?
- Does the story format work?

Answering these early steers every later sprint. The scale spike follows within two sprints.

## Scope

### Must
- [x] **S1-01 Scaffold:** Cargo workspace (`crates/ctd`), `web/` (Vite + TS), `theme/`, `content/`, `.gitignore`, pinned Rust toolchain.
- [x] **S1-02 Schema v0:** entity types, ~25 relations, layers, lenses, source tiers, `methodology/paths.yaml`.
- [x] **S1-03 Model and parser:** YAML frontmatter (serde-saphyr), markdown with wikilinks (pulldown-cmark), the EDTF subset.
- [x] **S1-04 `ctd check`:** rules 1–11 from [content-model.md](../content-model.md#ctd-check-rules-v0), with readable errors (file:line plus a fix hint).
- [x] **S1-05 Seed content:** about 35 entities, ~100 claims and ~40 sources in three mini-worlds:
  - tech and capital (Musk, Gates, Bezos, Tesla, SpaceX, Microsoft, Amazon, BlackRock, Vanguard, founders);
  - Abrahamic religions (Abraham, Moses, Jesus, Muhammad, the three traditions, their scriptures, Jerusalem);
  - one Cold War event with two perspectives (Cuban Missile Crisis).

  Plus a few places for the map. Facts are real and sourced; anything not yet verified is marked `status: draft`.
- [x] **S1-06 `ctd build`:**
  - entity pages with Overview, Timeline and Graph tabs;
  - lens chips, attribution and evidence badges, sources list;
  - `data/graph.json`, per-entity JSON and a search index.
- [x] **S1-07 Design v0:** type scale, colors per layer, a light reading theme, a dark explorer theme, a paper texture for stories.
- [x] **S1-08 Islands:** ego graph (sigma 3.0.3 for now), timeline, lens chips, search box.
- [x] **S1-09 `ctd serve`:** Axum dev server with file watching, rebuild and live reload.
- [x] **S1-10 Explorer v0** (`/x`, React + sigma):
  - lens filter, time slider;
  - perspective toggle with narrative diff;
  - path finder with evidence on every hop (TypeScript for now);
  - passive holders collapsed into "index funds".

### Should
- [x] **S1-11 Story chapter v0:** 5–7 shots in scroll mode: a MapLibre globe shot, graph reveal shots, source cards, and "Explore from here".
- [x] **S1-12 History tab:** the commit list for each entity file (gix).

### Could
- [ ] **S1-13** Cloudflare preview deploy, to share a demo link.
- [ ] **S1-14** Map tab for places.

### Not in this sprint

World-map tiles, WASM, editor, GitHub flows and CI, archive bot, imports, per-claim history diffs, production deploy.

## Demo script

1. `ctd serve`. Open the home page, search "Moses", open the entity page. Read the Overview and check the "According to …" badges and sources.
2. Open Elon Musk and switch the lens between Money and Relations. Open the Timeline tab.
3. In the explorer, ask "How is Bill Gates connected to Elon Musk?" Expect ranked paths, index funds collapsed, and evidence on every hop.
4. Drag the time slider to 1999. Links that were not valid then disappear.
5. Open the Cuban Missile Crisis and switch the perspective between US and Soviet. Expect different causes; the cross-confirmed fact keeps its badge.
6. Scroll the story chapter, then press "Explore from here".
7. Edit a `.md` file and watch the page reload. Break a date on purpose and see `ctd check` explain the error.

## Exit criteria

- The demo script runs end to end on a laptop.
- `ctd check` passes on all seed content; `cargo test` and `clippy` are clean.
- An entity page loads in under 300 ms locally, with at most 15 KB of JS before islands.
- Known issues are listed honestly below.

## Self-check (before the demo)

- [x] Tests and lints pass (cargo test 6/6, clippy 0 warnings, web typecheck and build clean, `ctd check` 0 errors / 0 warnings)
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-01/` (headless Chrome)
- [x] Seed facts spot-checked against their sources (60/64 URLs return 200; 4 Britannica pages block bots but exist)
- [x] Docs updated (architecture, content model, data contract, ADR-0009 note)

## Known issues

- **Time slider semantics:** an event disappears outside its own dates, so at t=1999 the Cuban Missile Crisis is hidden. Decide: snapshot ("what existed at t") or cumulative ("what had happened by t").
- **Ego graph:** labels can overlap on dense nodes; parallel claims between the same pair overlap on the canvas (the panel lists them).
- **Story map:** needs network access for OpenFreeMap tiles (fallback message otherwise). `view: timeline` shots render as graph shots. On mobile the source card covers much of the graph.
- **Path ranking:** the TypeScript explorer and the Rust `ctd path` produce the same top route (Moses → Elon Musk: 7 hops, cost 20.55), but no golden test enforces it yet.
- **Content:** two claims are marked draft (Gise at ARPA in 1958; the crisis influencing Pacem in Terris). Hub fan glyph not built (no hub has 500+ links yet).
- **Not done:** S1-13 (Cloudflare preview needs the founder's account), S1-14 (map tab).

## How to see it

```sh
cargo run -q -- serve        # then open http://127.0.0.1:4321
```

Pages to try: `/`, `/e/moses/`, `/e/cuban-missile-crisis/`, `/x/?from=moses&to=elon-musk`, `/x/?focus=cuban-missile-crisis&p=soviet-government`, `/c/thirteen-days/`. Edit any file in `content/` and the page reloads.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
