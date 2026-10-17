# Sprint 6: Ready to share

- Starts: 2026-10-17 · Length: 1 week
- Status: **done** (2026-10-17). Musts S6-01 to S6-03 and Could S6-06 are done. S6-04 (share images) waits for the first deploy, and S6-05 (preview deploy) waits for the founder's `npx wrangler login` and go-ahead.

## Goal

The founder can send a link to anyone: the site is safe to host in public, every shared link previews well, and the deploy is one command once the founder logs in to Cloudflare.

## Why now

Since Sprint 4 the founder has wanted a link to share (S4-06). The content now proves every acceptance scenario. What is left before a public link is hosting hygiene, not features.

## Scope

### Must
- [x] **S6-01 Content-Security-Policy.** Written by the engine into `dist/_headers`. Inline scripts are hashed (or moved to files), and the story maps' tile, glyph and worker sources are allowed. Then sweep every page type with the policy enforced: 0 violations.
  - Done (2026-10-17). `default-src 'self'; script-src 'self'`, with OpenFreeMap for the story maps' fetches and blob workers. The Ask form and the fold opener moved into `theme/static/`.
  - Two negative tests prove the harness catches violations: with `script-src 'none'` the Ask script is blocked, and without OpenFreeMap the story map's style fetch is blocked. With the real policy, home and Ask, entity, question, story with map, route story, chapter, explorer (links and world) and the map show 0 violations.
- [x] **S6-02 Deploy dry run.** `wrangler deploy --dry-run` passes: config, file count and size limits. `docs/deploy.md` is a copy-paste path.
  - Done (2026-10-17): Wrangler 4.151.1 read 1,246 files from `dist/`, with no bindings and no warnings. `docs/deploy.md` now has the dry run as step 2.
- [x] **S6-03 Accessibility pass.** Every page:
  - a single `h1`;
  - landmarks;
  - keyboard paths through Ask, the question pages, the life line, the explorer and the map;
  - visible focus;
  - text alternatives for every visual (the cover SVGs, the map, the graph);
  - reduced motion respected.
  - Done (2026-10-17). `sweep.mjs --a11y` checks every page's structure: one `h1`, a `main` landmark, named links and buttons, labelled fields, image alt text. 568 pages, 0 problems, with the CSP enforced. The map page gained a screen-reader `h1`, as `/x/` did in Sprint 5.
  - Keyboard path (real key events): Tab goes skip link → navigation → search → the question picker; arrow keys reach "Who is behind"; Tab reaches its field; submitting opens `/q/behind/meta-platforms/`. The focus ring is a 3 px accent outline.
  - Already in place from earlier sprints: story canvases are `aria-hidden`, with their step text carrying the content; the explorer and map canvases are labelled; reduced motion is respected in the stories, the explorer and the map.

### Should
- [ ] **S6-04 Share images** (carried from S5-07). One PNG per featured route, question page and featured entry for `og:image`, rendered from the covers with bundled fonts, so builds stay reproducible.
  - Deferred until the first deploy: an image only shows once a public link exists. Text previews (title, description, notice) already work. When it is built, render it only in production builds (`ctd build` without `--dev`), so live reload stays fast.
- [ ] **S6-05 Preview deploy** (carried from S5-05). As soon as the founder runs `npx wrangler login` and says go.

### Could
- [x] **S6-06** A short "About" page: what the site is, how links are sourced, how to propose a source, and the methodology version.
  - `/about/` ("How this site works"), linked from every footer. It covers:
    - the proof on every link (tier labels and descriptions come from the schema);
    - the account, agreement, disputed and being-verified marks;
    - what a connection is not;
    - each question with its scope line;
    - how routes are ranked (methodology version);
    - the rule for family ties;
    - how to propose a correction.

### Not in this sprint
- A custom domain and licenses (founder decisions, ADR-0011).
- The contribution loop. It needs the repository on GitHub first.

## Also done

- The home shelf shows the first four featured questions ("Who is behind Meta Platforms?", BlackRock, the Communist Party, the Soviet Union) right after the written stories, in `featured.yaml` order. The Stories library's Questions shelf uses the same order.

## Demo script

1. Open a page with the CSP on; play a story with a map; open the explorer and the world map. 0 violations.
2. Paste a question link into a link-preview checker: title, description, image.
3. Keyboard only: Ask a question, open an answer, read its proof, play its story.
4. Deploy a preview (if the founder has logged in) and open it on a phone.

## Exit criteria

- 0 CSP violations across every page type; sweep clean.
- `wrangler deploy --dry-run` clean.
- No accessibility blocker in the pass.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 51/51, clippy clean, `ctd check` 0 errors / 0 warnings
- [x] Phone sweep clean (static build), with the CSP enforced: 568 pages, 0 problems, with accessibility checks on
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-06/`: 24 screenshots of 6 pages, 0 console errors. The CSP and keyboard steps were run separately (see S6-01 and S6-03).
- [x] Docs and ADRs updated: deploy (CSP, dry run, stop the dev server), data contract (`_headers`, `about/`), CLAUDE.md (QA with `serve-headers.py`), backlog (F2 done)
- [x] Known issues listed

## Known issues

- ~~The dev server and `ctd build` share `dist/`.~~ Fixed after the review: the dev server builds into `.cache/serve/`.
- The accessibility pass is structural (headings, landmarks, names, labels). It is not yet a contrast or screen-reader audit.

## Review

- **What worked:**
  - Moving the two inline scripts into files gave a strict policy (`script-src 'self'`) with no hashing machinery.
  - `serve-headers.py` plus the sweep makes the policy testable locally, and two negative tests prove the harness catches violations.
- **What felt wrong:** nothing can be shared until the founder logs in to Cloudflare. Everything up to that point is ready.
- **New ideas (moved to the backlog):** a contrast and screen-reader audit; a production build folder separate from the dev server's.
- **Decisions (ADRs):** none needed; the hosting rules follow ADR-0006.
- **Next sprint goal:** proposed at the Sprint 6 review: see [roadmap.md](../roadmap.md).
