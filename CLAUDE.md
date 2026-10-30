# connect-the-dot

An open, interactive "connect the dots" knowledge graph. A Rust engine (`ctd`) compiles a git repo of markdown entities into a static site plus graph data, and TypeScript draws it in the browser.

## Read first

- `docs/README.md`: map of the docs, and how we work (startup sprints)
- `docs/sprints/`: the highest-numbered sprint file is what to do now; keep its checklist current
- `docs/architecture.md` and `docs/content-model.md`: how it works
- `docs/decisions/`: why (ADRs)

## Working rules

- Sprint loop: plan → build → self-check → demo → review. Before calling a sprint done, run the self-check in the sprint file.
- New ideas from the founder go to `docs/backlog.md` (Inbox) unless they change the current sprint goal.
- A decision that changes direction gets a new ADR plus updates to `architecture.md` / `content-model.md`, in the same change.
- The examples (Musk, BlackRock, the Bible, GameStop, the Cold War, Santa Monica) are test cases. Never hard-code domain logic; vocabulary lives in `content/schema/` and ranking parameters in `content/methodology/`.
- Every claim needs a source. Use `according_to` for interpretations. No evaluative labels on people.
- Heritage (ethnicity) is only a sourced line on that person's own page (a living person's own words; scholarship for historical figures). It is never a link, group, count, filter, map layer or route ([ADR-0016](docs/decisions/0016-who-a-person-is.md)).
- Builds run locally; only `ctd check` belongs in GitHub Actions.
- English only for now.
- Prefer fast, direct work over long multi-agent runs.
- UI follows `docs/ux-vision.md` (Apple Books simplicity): neutral palette, one accent `#0066cc`, system fonts, plain words. Users never see T1/claim/edge/tier jargon.

## Commands

```sh
cargo run -q -- check                 # validate content (exit 1 on errors)
cargo run -q -- check --base origin/main   # also: every entry id at that ref still exists or is an alias (URLs never break)
cargo run -q -- fmt                   # assign permanent uids
cargo run -q -- build                 # content/ + theme/ + web/dist → dist/ (--graph also writes data/graph.json for tools)
cargo run -q -- build --synthetic 100000   # made-up entries on the real schema: every data file's size against its budget
cargo run -q -- serve                 # dev server on http://127.0.0.1:4321 with live reload (builds into .cache/serve/; dist/ is production only)
npm --prefix web run build            # rebuild islands / explorer / story bundles into web/dist
npm --prefix web run dev              # the built dist/ with the browser code live (HMR)
cargo test && cargo clippy            # engine tests and lints
node tools/qa/cdp.mjs <url> [actions.js] --shot=out.png --scheme=light   # headless Chrome check: errors, logs, screenshot
node tools/qa/sweep.mjs --scheme=dark --size=390x844 [--only=/q/]       # every built page: console errors, sideways scroll
node tools/qa/sweep.mjs --touch --size=390x844                           # also tap targets, small text, fields that zoom on iOS; try 320x640 and 844x390
node tools/qa/paths-golden.mjs <dir>                                     # the Rust and TypeScript route finders agree on a built site
# for a full sweep, build to a scratch dir and serve it statically (the dev server's live reload slows long runs):
#   ctd build --out <dir> && python3 tools/qa/serve-headers.py <dir> 4420; sweep.mjs --dist=<dir> --base=http://127.0.0.1:4420
#   (serve-headers.py sends dist/_headers, so the Content-Security-Policy is enforced: no inline scripts in templates)
# QA tools start one headless Chrome through tools/qa/chrome.mjs: it is killed on exit, Ctrl+C or a kill, and a run
# first stops our headless Chromes over an hour old. Run at most one browser-heavy check at a time: software WebGL
# makes each instance cost several CPU cores.
```

Layout: `crates/ctd` (engine), `theme/` (MiniJinja templates + site.css tokens), `web/` (TypeScript bundles), `content/` (schema, methodology, entities, sources, chapters, borders). The browser code reads only what `docs/data-contract.md` describes.
