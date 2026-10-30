# Deploy

The site is static files (ADR-0002), hosted on Cloudflare Workers static assets (ADR-0006) at `dots.joinprototype.com`. Builds run locally (ADR-0007); nothing builds on GitHub except `ctd check`.

## Three steps to public

| Step | Command | Who can see it |
| --- | --- | --- |
| 1. Preview | `tools/deploy.sh` | Anyone with its long Version URL. Nothing goes live. For real phones and review. |
| 2. Live, unlisted | `tools/deploy.sh live` | Anyone with `dots.joinprototype.com`. Search engines are told not to list it. |
| 3. Public | Set `LISTED = true` in `crates/ctd/src/site.rs`, commit, `tools/deploy.sh live` | Everyone. Only after the lists below are done. |

Costs nothing new. The domain is already ours, the `joinprototype.com` zone is on Cloudflare, and requests to static assets are free and unlimited on any plan.

## What the script does

`tools/deploy.sh` refuses a dirty tree, because every page names the commit it was built from. Then it:

1. checks the content against what is live (`ctd check --base deployed`, or `origin/main` before the first deploy), so no URL breaks;
2. rebuilds the browser bundles and `dist/`. `dist/` only ever holds production builds: the dev server builds into `.cache/serve/`, so its live-reload scripts (which the Content-Security-Policy would block) never reach a deploy. The build also writes `dist/_redirects` for alias URLs and `dist/_headers` for security headers;
3. uploads a preview, or deploys and moves the local `deployed` tag.

The Wrangler login is already on this Mac (Kaizu's site deploys from it). `npx wrangler@4 login` opens a browser if it ever expires. To check without uploading anything: `npx wrangler@4 deploy --dry-run` (reads `dist/`, checks the config; no login needed). Its "Read N files" counts folders too: on 2026-10-30 it said 2,050 for 1,248 files and 803 folders.

Config: `wrangler.jsonc` at the repo root. It serves `dist/` with these rules:
- an unknown path serves `dist/404.html`;
- `/e/<id>` serves `/e/<id>/index.html` and redirects to the trailing slash;
- the domain is the only public address (`workers_dev: false`); Version URLs stay on for previews.

## The first deploy

- **The domain is free.** `dots.joinprototype.com` had no DNS record on 2026-10-30. A Custom Domain refuses a hostname that has a CNAME, so check again if someone adds one. The deploy creates the record and the certificate.
- **Not known yet:** Cloudflare's docs do not say whether `versions upload` works for a Worker that was never deployed. If it refuses, remove `routes` from `wrangler.jsonc` for one `npx wrangler@4 deploy`: that creates the Worker with no public address. Then put `routes` back.

## After every live deploy

```sh
curl -sI https://dots.joinprototype.com/ | grep -i -E 'HTTP/|x-robots-tag|content-security'
curl -sI http://dots.joinprototype.com/ | head -1                 # should redirect to https
curl -sI https://dots.joinprototype.com/not-a-page | head -1      # 404
curl -sI https://dots.joinprototype.com/e/facebook/ | grep -i location   # an alias, to /e/meta-platforms/
node tools/qa/sweep.mjs --dist=dist --base=https://dots.joinprototype.com --scheme=dark --size=390x844
```

To undo a deploy: `npx wrangler@4 rollback` makes the version before it live at once. Then move the tag back with `git tag -f deployed <commit>`.

## Limits to watch

- **File count:** up to 20,000 files per version on the free plan, 100,000 on Workers Paid.
  - Today the site has about 1,250 files (270 entries, their stories and question pages, world tiles).
  - World tiles grow fastest: the 1M-node synthetic world is 2,693 tiles.
  - Past roughly 50k files, move tiles and long-tail pages to R2 (ADR-0006).
- **File size:** at most 25 MiB per asset. The largest files today are the lazily loaded map and deck.gl chunks (about 1 MB each, uncompressed). The data files are small: `graph-slim.json` is about 65 KB (17 KB gzip), a detail file a few KB.
- **Third-party requests:** story maps and the Map's Earth view load OpenFreeMap tiles and glyphs (ADR-0014). Everything else is same-origin.

## Before step 2 (live, unlisted)

- [x] A way to correct something: every page links to its file on GitHub, and the About page offers issues too.
- [ ] The repo is public, or those links lead nowhere. `gh repo edit joinprototype/connect-the-dots --visibility public --accept-visibility-change-consequences`. On 2026-10-30 no secrets or key files were found in the tree or in any of its 22 commits. Commits show the author's email.
- [ ] The founder has reviewed Sprints 10 to 17, on real phones, from the preview.
- [x] Nothing from this Mac in the build: no local paths, `localhost` or live-reload script in `dist/` (2026-10-30).

## Before step 3 (public)

- [x] Security headers via `dist/_headers`, written by the engine (Sprint 5): `nosniff`, no framing, `strict-origin-when-cross-origin` referrers, no camera, microphone, location or payment APIs, and `Cross-Origin-Opener-Policy: same-origin`.
- [x] A Content-Security-Policy in the same file (Sprint 6). It is defense in depth on top of the URL allowlist fixed in the Sprint 3 self-check.
  - Scripts come only from the site (`script-src 'self'`). The Ask form and the fold opener moved from inline scripts into `theme/static/`.
  - The story maps may fetch from `tiles.openfreemap.org` and run blob workers.
  - Inline styles stay allowed: content is escaped, and the life line and covers position things with `style` attributes.
  - Test locally with `python3 tools/qa/serve-headers.py <build dir> 4430`, which sends `_headers` like Cloudflare does, then sweep that port. Violations show up as console errors.
- [x] A custom domain: `dots.joinprototype.com`, in `wrangler.jsonc`. The site uses relative URLs, so nothing in the build names a domain.
- [x] The dev-only client error reporter is off: `ctd build` (no `--dev`) omits it.
- [x] Licenses: [LICENSE.md](../LICENSE.md) (ADR-0011).
- [ ] The legal list in the backlog (E6): terms, a privacy notice that names OpenFreeMap's map requests, a content policy for living people, a takedown runbook. The site carries court records and "who is behind" answers about living people, so have a lawyer read it first.
- [ ] A sitemap and `robots.txt`, and share images (`og:image`). Both need the site's address in the build, which has none today.
