# Sprint 18: Ready for dots.joinprototype.com

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: active. Everything local is built; the rest waits for the founder (see Scope).

## Goal

The repo is public, and the site runs at dots.joinprototype.com.

## Why now

- **The founder raised it** on 2026-10-30, which ends the hold of 2026-10-17.
- **Eight sprints wait for review.** A real URL is the easiest way to do that, and the only way to try the site on a real iPhone and Android phone (backlog, Sprints 8 and 16).

## Scope

### Must
- [x] **S18-01 The address:** `wrangler.jsonc` takes the domain as a Custom Domain and turns off `workers.dev`, so the site has one public address. Version URLs stay on for previews.
- [x] **S18-02 Unlisted:** `LISTED` in `site.rs`. While false, every response says `X-Robots-Tag: noindex`, previews included. A header, not `robots.txt`, because a crawler that is kept out never reads the noindex.
- [x] **S18-03 `tools/deploy.sh`:** refuses a dirty tree, checks URLs against what is live, builds, uploads a preview or deploys, and tags the deploy.
- [x] **S18-04 Caching:** chunks have a hash in the name, so they cache for a year. Everything else revalidates, as Cloudflare does by default.
- [x] **S18-05 Corrections:** pages link to their file on GitHub, the About page offers issues too, and the footer links the source and license.
- [x] **S18-06 License:** [LICENSE.md](../../LICENSE.md), on the terms of [ADR-0011](../decisions/0011-repos-and-licenses.md), now accepted. Cliopatria's borders, quotations, images and libraries keep their own terms.
- [ ] **S18-07 Public repo:** push, then open the repo. The corrections route depends on it. Needs the founder's go.
- [ ] **S18-08 Live:** `tools/deploy.sh live`, then the checks in `docs/deploy.md`. Needs S18-07 and the founder's go, and their word on whether search engines may list it yet (`LISTED`).

### Found on the way
- [x] **The repo scan:** no secrets or key files in the tree or in history. A research digest names scratch folders on the founder's Mac, which is harmless.
- [x] **GSAP is not open source,** which the AGPL would not allow by itself. LICENSE.md adds a section 7 permission.
- [x] **`_headers` was written twice** in a row. Now once.

### Not in this sprint
- The legal list in `docs/deploy.md`.
- A sitemap, `robots.txt` and share images.
- Self-hosting the basemap, analytics.

## Demo script

1. `tools/deploy.sh` prints a Version URL. Open it on a phone.
2. Search engines are told not to list it: `curl -sI <url> | grep -i x-robots-tag`.
3. `tools/deploy.sh live`, then dots.joinprototype.com on a phone.
4. A bad deploy undone with `npx wrangler@4 rollback`.

## Exit criteria

- `dots.joinprototype.com` serves the site over HTTPS with the Content-Security-Policy, and every response carries `noindex`.
- The sweep against the live URL finds 0 console errors.
- The About page offers a way to correct something that works.

## Self-check

- [x] Tests and lints pass (69 engine tests)
- [x] `npx wrangler@4 deploy --dry-run` reads the new config with no warnings
- [x] `dist/_headers` has `noindex` and the chunk rule, and stays within Cloudflare's limits (3 rules, longest line 329 characters; the limits are 100 and 2,000)
- [x] Sample phone sweep with the Content-Security-Policy on (About, an entry, a question page): 0 problems beyond Sprint 16's known narrow scene dots
- [x] `tools/deploy.sh` refuses a dirty tree. Its upload steps have not run for real.
- [x] Docs updated (`deploy.md`, ADR-0011, `architecture.md`, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`)

## Known issues

- Whether `versions upload` works on a Worker that was never deployed is undocumented; `docs/deploy.md` has the way around it.
- The `deployed` tag lives on this Mac only. A deploy from another machine starts from `origin/main`.
- A Version URL is public to anyone who has it. Cloudflare Access can put a sign-in in front of it if that stops being enough.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
