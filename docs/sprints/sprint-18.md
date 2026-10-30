# Sprint 18: Ready for dots.joinprototype.com

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: released (2026-10-30); demo and review with the founder pending

## Goal

The repo is public, and the site runs at dots.joinprototype.com.

## Why now

- **The founder raised it** on 2026-10-30, which ends the hold of 2026-10-17.
- **Eight sprints wait for review.** A real URL is the easiest way to do that, and the only way to try the site on a real iPhone and Android phone (backlog, Sprints 8 and 16).

## Scope

### Must
- [x] **S18-01 The address:** `wrangler.jsonc` takes the domain as a Custom Domain and turns off `workers.dev`, so the site has one public address. Version URLs stay on for previews.
- [x] **S18-02 Unlisted:** `LISTED` in `site.rs`. While false, every response says `X-Robots-Tag: noindex`, previews included. A header, not `robots.txt`, because a crawler that is kept out never reads the noindex.
- [x] **S18-03 `tools/deploy.sh`:** refuses a dirty tree, checks URLs against the last release, builds, and uploads a preview or releases.
- [x] **S18-04 Caching:** chunks have a hash in the name, so they cache for a year. Everything else revalidates, as Cloudflare does by default.
- [x] **S18-05 Corrections:** pages link to their file on GitHub, the About page offers issues too, and the footer links the source and license.
- [x] **S18-06 License:** [LICENSE.md](../../LICENSE.md), on the terms of [ADR-0011](../decisions/0011-repos-and-licenses.md), now accepted. Cliopatria's borders, quotations, images and libraries keep their own terms.
- [x] **S18-07 Public repo:** opened on 2026-10-30, so the corrections route works.
- [x] **S18-08 Live:** 0.1.0 is at dots.joinprototype.com, checked with the list in `docs/deploy.md`.
- [x] **S18-09 Versions:** the founder's word on 2026-10-30: start at 0.1.0. `version` in `Cargo.toml` is the one number, the footer shows it, [CHANGELOG.md](../../CHANGELOG.md) says what changed, and `tools/deploy.sh live` tags each release.
- [x] **S18-10 Addresses:** `sitemap.xml`, `robots.txt` and a canonical link on every page. Cloudflare's own `robots.txt` was being served, with no sitemap. While `LISTED` is false, search engines can read all of this but are told not to list the pages.
- [x] **S18-11 Listed:** the founder chose to list the site in 0.1.1, ahead of the legal list. Previews keep `noindex`, which a real preview confirmed, and the sitemap is in Search Console.

### Found on the way
- [x] **The repo scan:** no secrets or key files in any version of any file. History was cleaned once, before 0.1.0: commits carry a private address, and the research notes moved out of the repo.
- [x] **GSAP is not open source,** which the AGPL would not allow by itself. LICENSE.md adds a section 7 permission.
- [x] **`_headers` was written twice** in a row. Now once.
- [x] **Suggestions opened in the wrong place.** With two browsers side by side, the browser's own list for a datalist opened over the other one. The Ask form now draws its own list under the field, with arrow keys, Enter and Escape. The datalist stays for readers without JavaScript.

### Not in this sprint
- The legal list in `docs/deploy.md`.
- Share images.
- Self-hosting the basemap, analytics.

## Demo script

1. dots.joinprototype.com on a phone: the footer shows the version and links the source and license.
2. Ask, with suggestions under the field.
3. `tools/deploy.sh` prints a Version URL, which search engines are told not to list: `curl -sI <url> | grep -i x-robots-tag`.
4. A bad deploy undone with `npx wrangler@4 rollback`.

## Exit criteria

- `dots.joinprototype.com` serves the site over HTTPS with the Content-Security-Policy.
- The sweep against the live URL finds 0 console errors of our own.
- The About page offers a way to correct something that works.

## Self-check

- [x] Tests and lints pass (69 engine tests)
- [x] `npx wrangler@4 deploy --dry-run` reads the new config with no warnings
- [x] `dist/_headers` has `noindex` and the chunk rule, and stays within Cloudflare's limits (3 rules, longest line 329 characters; the limits are 100 and 2,000)
- [x] Sample phone sweep with the Content-Security-Policy on (About, an entry, a question page): 0 problems beyond Sprint 16's known narrow scene dots
- [x] Full phone sweep of the live site on 0.1.0: 768 pages, 0 problems apart from Cloudflare's blocked scripts, the narrow scene dots and the home page's route dot, both from Sprint 16
- [x] `tools/deploy.sh` released 0.1.0 and 0.1.1. Its refusals were tried against a scratch remote.
- [x] Docs updated (`deploy.md`, ADR-0011, `architecture.md`, `README.md`, `CONTRIBUTING.md`, `CLAUDE.md`)

## Known issues

- Cloudflare's zone adds Web Analytics and bot-detection scripts to every page. The Content-Security-Policy blocks them, so they never run, but every page logs console errors until they are turned off on the zone (`docs/deploy.md`).
- A Version URL is public to anyone who has it. Cloudflare Access can put a sign-in in front of it if that stops being enough.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
