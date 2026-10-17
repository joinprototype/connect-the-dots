# Deploy

The site is static files (ADR-0002), hosted on Cloudflare Workers static assets (ADR-0006). Builds run locally (ADR-0007); nothing builds on GitHub except `ctd check`.

## Preview and production

1. Build. `dist/` only ever holds production builds: the dev server builds into `.cache/serve/`, so its live-reload scripts (which the Content-Security-Policy would block) never reach a deploy. The build also writes `dist/_redirects` for alias URLs and `dist/_headers` for security headers:

   ```sh
   cargo run --release -q -- check
   npm --prefix web run build
   cargo run --release -q -- build
   ```

2. Check without uploading anything: `npx wrangler@4 deploy --dry-run` (reads `dist/`, checks the config and limits; no login needed). On 2026-10-17 it read 1,246 files with no warnings. Set `WRANGLER_SEND_METRICS=false` to turn off Wrangler's anonymous telemetry.
3. Log in once (opens a browser): `npx wrangler@4 login`
4. Deploy a preview, or production:

   ```sh
   npx wrangler@4 versions upload    # a preview URL for this version, nothing goes live
   npx wrangler@4 deploy             # production at connect-the-dot.<account>.workers.dev
   ```

Config: `wrangler.jsonc` at the repo root. It serves `dist/` with these rules:
- an unknown path serves `dist/404.html`;
- `/e/<id>` serves `/e/<id>/index.html` and redirects to the trailing slash.

## Limits to watch

- **File count:** up to 20,000 files per version on the free plan, 100,000 on Workers Paid.
  - Today the site has about 1,250 files (270 entries, their stories and question pages, world tiles).
  - World tiles grow fastest: the 1M-node synthetic world is 2,693 tiles.
  - Past roughly 50k files, move tiles and long-tail pages to R2 (ADR-0006).
- **File size:** at most 25 MiB per asset. The largest files today are the lazily loaded map and deck.gl chunks (about 1 MB each, uncompressed). graph.json is about 0.3 MB.
- **Third-party requests:** story maps and the Map's Earth view load OpenFreeMap tiles and glyphs (ADR-0014). Everything else is same-origin.

## Before the first public deploy

- [x] Security headers via `dist/_headers`, written by the engine (Sprint 5): `nosniff`, no framing, `strict-origin-when-cross-origin` referrers, no camera, microphone, location or payment APIs, and `Cross-Origin-Opener-Policy: same-origin`.
- [x] A Content-Security-Policy in the same file (Sprint 6). It is defense in depth on top of the URL allowlist fixed in the Sprint 3 self-check.
  - Scripts come only from the site (`script-src 'self'`). The Ask form and the fold opener moved from inline scripts into `theme/static/`.
  - The story maps may fetch from `tiles.openfreemap.org` and run blob workers.
  - Inline styles stay allowed: content is escaped, and the life line and covers position things with `style` attributes.
  - Test locally with `python3 tools/qa/serve-headers.py <build dir> 4430`, which sends `_headers` like Cloudflare does, then sweep that port. Violations show up as console errors.
- [ ] A custom domain.
- [ ] Turn off the dev-only client error reporter. `ctd build` (no `--dev`) already omits it.
- [ ] Decide on the licenses (ADR-0011, still proposed).
