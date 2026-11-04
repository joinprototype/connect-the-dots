# web/: browser code for connect-the-dot

The Rust engine (`ctd build`) renders every page and writes the data files under `dist/data/`. This package builds the
browser code that enhances those pages: plain TypeScript, no framework. `ctd build` copies `web/dist/` to
`dist/assets/` (and `ctd serve` copies it again whenever `web/dist/` changes). What the code may read is
[`docs/data-contract.md`](../docs/data-contract.md); how it should look is [`docs/ux-vision.md`](../docs/ux-vision.md).

```sh
npm install
npm run dev             # the built site (../dist) on http://localhost:5173, with this code live (HMR)
npm run typecheck       # tsc for src/ and vite.config.ts
npm run build           # tsc, then writes web/dist/
```

## Bundles

One per entry in `vite.config.ts` (`ENTRIES`). Each entry imports its own CSS, and shared code is split into `chunks/`.

| Output | Entry | Loaded by | What it does |
|---|---|---|---|
| `islands.js` + `islands.css` | `src/islands/main.ts` | every page | `<ctd-box>` (the Ask box in the header), `<ctd-lens-chips>`, `<ctd-atlas-links>` and the home page's threads |
| `ask.js` + `ask.css` | `src/ask/main.ts` | `/ask/` | Ask: the box as the page's heading, answers drawn on a canvas stage |
| `read.js` + `read.css` | `src/read/main.ts` | `/c/<id>/` | Read: a story over its field of dots (`lib/dotfield.ts`), with doors to its names |
| `life.js` | `src/read/life.ts` | `/e/_life/` | An entry's own story, drawn from its pack in `data/life/` |
| `place.js` + `place.css` | `src/place/main.ts` | `/w/` | `<ctd-place>`: the Map (ADR-0034), every story an island and every entry a dot |
| `atlas.js` + `atlas.css` | `src/atlas/main.ts` | `/a/` | Open data's entries (ADR-0023), one shard each |
| `play.js` + `play.css` | `src/play/main.ts` | `/play/` | The daily puzzle (ADR-0036) |
| `forward.js` | `src/forward.ts` | old Explore and Connect addresses | Sends them on to where their entries are now (ADR-0031) |

`vite build` emits only these files: entries are TypeScript modules, not HTML, and `publicDir` is off. Built files
expect to be served from `/assets/` (`base: '/assets/'`). The site's Content-Security-Policy allows no inline scripts,
so pages pass data in `<script type="application/json">` blocks.

## Shared code (`src/lib/`)

- `data.ts`: every data file is fetched once per page, with one promise per file shared by every bundle; a failed
  fetch is not kept, so the next call tries again.
- `paths.ts`: the route finder. It must give the same routes as the engine's (`crates/ctd/src/paths.rs`):
  `node tools/qa/paths-golden.mjs <built dir>` checks that. `walks()` is the rule for which links a way may use,
  the same as `Edge::walkable` in the engine.
- `claims.ts`, `plain.ts`, `dates.ts`: a link's sentence and proof, in the plain words readers see.
- `search.ts` and `fuzzy.ts`: names and aliases from the search files; whole name, prefix, word and substring
  matches first, scattered letters only when nothing else matches.
- `dotfield.ts`: the world as grey dots with the written places named, behind Read and Ask.
- `history.ts`: every URL update goes through it, at most one `history.replaceState` per 300 ms. Safari throws a
  `SecurityError` after 100 history writes in 10 seconds.

## Look

Black on white, colour only on the dots ([ADR-0024](../docs/decisions/0024-black-on-white.md)). Everything reads
the tokens in `theme/static/site.css` (`--ink`, `--paper`, `--muted`, `--rule`, `--highlight`, the fonts, and one
ink per kind of entry), light by default and dark with `prefers-color-scheme`. `--highlight` marks quoted passages:
never yellow on dark. Meaning is never carried by hue alone. No CSS filters, `backdrop-filter` or blurred copies of
canvases: Safari re-rasterizes those on every frame.

## Dev server

`npm run dev` serves a `ctd build` output with this code live, so run `cargo run -q -- build` first (and again after
content or template changes; `ctd serve` is the other way to work, rebuilding everything on save).

**How it maps requests** (`vite.config.ts`, `apply: 'serve'` only):
- Pages and `/data/*` come from `../dist`, or `$CTD_DIST`.
- `/assets/<entry>.js` serves the TypeScript source, and the `<script>` tags in pages are rewritten to point at it.
- `/assets/<entry>.css` is empty in dev, because each entry imports its own CSS.
- `/static/site.css` serves `../theme/static/site.css`, so theme edits show without a rebuild.

## Checks

The QA tools in `tools/qa/` drive one headless Chrome (see `CLAUDE.md`): `cdp.mjs` for one page, `sweep.mjs` for
every built page. They see console errors and uncaught exceptions only, so a `catch` that hides a failure must also
`console.error` it.
