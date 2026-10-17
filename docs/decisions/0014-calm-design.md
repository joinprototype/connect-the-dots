# ADR-0014: Calm design: three places, one accent, plain words

- Status: accepted (Sprint 3)
- Date: 2026-10-17

## Context

The Sprint 1 theme was a "nautical chart":
- about ten hues (seven layer colors, chart magenta, graticule);
- two web fonts;
- seven lenses;
- pages that exposed engine vocabulary (T1, claim, edge, cost).

Founder review:
- "some colors are chosen bad, we do not need so many colors… make it like apple books app, simple and usable";
- "think like Jony Ive and Steve Jobs";
- "I actually like the stories".

The full brief is [ux-vision.md](../ux-vision.md).

## Decision

1. **Three places.**
   - **Ask** (home): one question field ("How is [ ] connected to [ ]?") and a shelf of story covers.
   - **Stories:** a library of written, connection and life stories.
   - **Map:** the world view.
   - The explorer is reached from these places. It starts from a topic or a question, never from the whole graph.
2. **Materials.**
   - Apple neutrals and ink.
   - One accent, `#0066cc`, for links, selection, focus and the active path.
   - The highlighter is only for quoted proof:
     - yellow `#fde68a` on light paper;
     - blue-gray `#1f374f` in dark mode.

     Never yellow on black: the founder found it hard to read.
   - System fonts only: `ui-serif` (New York) for reading, `system-ui` (SF) for controls.
   - Rounded cards and segmented controls.
   - Dark mode follows the system.
3. **Layers are neutral.**
   - Every layer color in `layers.yaml` is the same gray. Meaning comes from labels and shape, not hue.
   - At most five lenses: Everything, People & power, Money, Ideas & tech, History. Places are the Map's job.
4. **Covers.** The engine generates a cover for every entry and story (`crates/ctd/src/covers.rs`). Each is deterministic and drawn from the entry's own links, with the title set in the reading serif. A licensed photo replaces it when present.
5. **Plain words.** Users see:
   - "link" and "proof";
   - "Primary record", "Scholarship & press" and "Self-published" (from `source-tiers.yaml` labels);
   - "Both sides agree", "One side's account" and "Being verified".

   Engine words stay in files and docs.
6. **Depth on demand.**
   - Entity pages show a cover, one paragraph, Play, a few cards that matter for this entry (family ties, life line, holders, perspective split) and the links.
   - The proof list is folded until asked for. Footnote links open it.
   - The connection fingerprint and the evidence meter were removed.

## Consequences

- There are no web fonts. Reading pages, the explorer and the Map's links view make no third-party request.
- **One exception: the OpenFreeMap basemap**, used by story maps (recorded after the Sprint 3 review, F13) and, since Sprint 7, by the Map's Earth view (`/w/?view=earth`, opened by choice or from an entry's "On the map ›"). Earth also draws our own dot names with the basemap's Noto Sans glyphs, since MapLibre needs glyphs for any map text. Links never touches OpenFreeMap. Map scenes load their basemap from OpenFreeMap (`tiles.openfreemap.org`): the style, the vector tiles, the sprites, and the Noto Sans glyph files MapLibre needs to draw country and capital names. Opening `/e/elon-musk/story/` makes about 20 requests there, plus the tiles the map's worker fetches.
  - Why we accept it for now: a world basemap is a large dataset to host and keep current, OpenFreeMap needs no key or account, and its labels are part of the map picture, not page text.
  - The cost: visitors' IP addresses reach a third party, map labels are not in the system font, and when that host is down map scenes lose their basemap (the narration still reads).
  - The way out is in the backlog: self-host the basemap (PMTiles on R2, the style and sprites, and local glyphs).
  - An entry photo (`image.url`) would also load from its own host until image ingest (backlog E5) stores it in R2. No entry has one yet.
- Layer hue can no longer carry information anywhere in the UI. The explorer legend and graph styling must use labels, line style (solid, dashed for attributed) and the accent.
- Content files did not change; only `lenses.yaml` and `layers.yaml` did. Chapter scenes may only use the five lens ids, and `ctd check` enforces this.
- A cover with the title in it duplicates the title next to it, as book covers do. We accept that.

## Revisit when

- User testing shows people cannot tell layers apart in the explorer. Add shape or glyphs first; hue last.
- Real images become common. Covers may then switch to photos by default.
