# ADR-0026: Entries share files, and generated stories are one page

- Status: accepted
- Date: 2026-11-02

## Context

Cloudflare's free plan takes 20,000 files per version. With 71 written stories the site reached 20,633 files and had to halve the atlas (2,048 entry files, 512 long-list files) to ship at 18,034. Two kinds of file grew by one for every entry: 3,286 detail files in `data/e/` and 2,780 generated story pages in `e/<id>/story/`. Together they were a third of the site, and each new entry cost two more files.

Workers Paid lifts the limit to 100,000 files for about $5 a month. That choice stays open, and the founder chose to stay free for now. Moving files to R2 would mean running something (ADR-0006).

## Decision

1. Entries' detail files share 256 packs. `data/e/<n>.json` is an object keyed by entry id, and `<n>` is the 32-bit FNV-1a hash of the id, modulo 256. `crates/ctd/src/site/data.rs` and `web/src/lib/data.ts` compute it the same way, so no lookup table is needed.
2. A generated story is one shell page, `e/_life/index.html`, plus its body in `data/life/<n>.json` under the same hash. `_redirects` serves the shell at every `/e/<id>/story/` address with status 200, so no address changes. `web/src/story/life.ts` reads the id from the address and puts the story in the page, where `ctd-story` upgrades it as usual.
3. Written chapters, question stories and route stories stay real pages. They are what a reader shares and a search engine should find.
4. The shell is marked `noindex`. These pages were never in the sitemap.

## Consequences

- 12,482 files, down from 18,034, and 7,518 under the limit. A new entry now adds one file, its page.
- Opening an entry costs a little more: a pack is 10 KB gzip at the median and 48 KB at most, against a few KB for one entry. The hash scatters entries, so an entry's neighbours sit in other packs: each new entry opened usually fetches another pack, until the browser holds them all.
- A generated story needs JavaScript to show anything. Its pack is 20 KB gzip at the median and 77 KB at most. Without JavaScript the page says so.
- A shared link to a generated story shows the same title and description for every entry. The entry page and the written stories keep their own.
- An unknown id at `/e/<id>/story/` answers 200 with "This entry has no story yet", where it used to be a 404. The shell's `noindex` keeps that out of search.
- The local servers (`ctd serve`, Vite, `tools/qa/serve-headers.py`) each imitate the `_redirects` rule, so a change to it has to be made in all three, and only a preview upload proves it.
- Past 20,000 files, Workers Paid is the next step. Pack count goes up only if a pack grows past what a reader should wait for.
