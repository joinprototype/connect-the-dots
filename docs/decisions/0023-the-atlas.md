# ADR-0023: The atlas: a million dots from open data, marked as what they are

- Status: accepted (Sprint 22)
- Date: 2026-11-01

## Context

The founder wants a million dots: a better picture of the world, and the test of whether the engine is efficient. Hand-sourcing gives about a hundred entries a day; a million would take decades. Three things had to be true for a million to be worth having:

- **Dots people care about.** Filling up on villages, asteroids or shell companies would reach the number and teach nothing.
- **No lowering of the record.** "Every link shows its proof" is what this site is. A million unread claims cannot sit beside hand-read ones as if they were the same thing.
- **A way to host it.** Measured on 2026-11-01 with synthetic entries: the map (1M nodes, 1.9 s, 2,714 tiles) and search (1,608 files) already scale. One file per entry does not: Cloudflare allows 20,000 files per version, or 100,000 on a paid plan. Nor does one graph file for the browser: 41 MB gzip at 1M.

## Decision

1. **Two layers.** The *record* is `content/`: read by hand, every claim quoted from its source. The *atlas* is imported open data. A page always says which it is.
2. **The best-known things in the world.** The atlas takes Wikidata items (CC0) by how many language editions of Wikipedia cover them, with a share for each type, so that it is not all footballers. That count only ranks; no fact rests on it. About 1.7M items reach 10 language editions.
3. **Wikipedia stays out of the proof.** Wikidata is a lead, not a source: an atlas page says it comes from "an open database anyone can edit" and that "we have not checked it by hand", and links to the record. It never counts as a source for a claim in `content/`.
4. **A whitelist of facts.** Only structural properties come in: born in, citizen of, educated at, worked at, member of a team or body, founded, chief executive, chair, head of state or government, part of, located in, headquartered in, took part in, author, maker. See `tools/atlas/fetch.py`.
5. **What never comes in:** ethnicity, religion, family, political party, health, sexuality, crime, and every interpretive property ("influenced by", "has cause"). Heritage stays under ADR-0016. Legal records stay in `content/` under ADR-0018. Ethnic groups are not dots. A person's summary line is dropped if it carries a label (`LABELS` in `tools/atlas/build.py`). Dates are years only, so no birthday of a living person is published.
6. **Hand-written entries win.** An entry with `same_as: {wikidata: Q…}` is one dot: the atlas points to its page, and never overrides it.
7. **No page per entry.** Entries are packed by Wikidata number into 4,096 files, `data/a/<n>.json`. One page, `/a/?q=Q42`, reads the one file it needs and swaps in place as a reader moves. With the map's tiles and search, the whole site is about 9,000 files (8,928 on 2026-11-01). No server, no paid plan, no R2.
8. **Not for search engines.** Atlas pages are `noindex` and left out of the sitemap: a million thin generated pages would be bad for readers arriving from Google, and bad for the site.
9. **Draw only what is on screen.** Every view loads by what is in view and simplifies with distance, as a game engine does. The map streams tiles by zoom; an atlas page loads one shard; images load as they near the screen. The browser never holds the whole graph.
10. **One round world, dots at every zoom.** Real links are nothing like synthetic ones: a few hubs pull everything into one knot. So on a map over 20,000 entries:
    - each entry of a tiny community joins the community of its rarest link, because sharing a country says little and a teacher says much; the few with nothing to join make a disc per ink;
    - the map is shared out by area, keeping what was near near, and bent into a circle, so there is no knot and no empty quarter;
    - each zoom takes every community's best known by their share of it, so the map stays equally dense and every colour shows;
    - a link appears only once it is short on screen.
    Pale region discs and their tiles are gone: dots at every zoom are clearer and cheaper. Measured on a real GPU, the opening view loads 4 tiles and 375 KB, and a 30 s flight holds 59.8 fps.

## What this does not settle

- Routes. "How are A and B connected?" still runs in the browser over the record alone. Through the atlas, it needs a compact graph file or a route service.
- The explorer stays on the record, for the same reason.
- The atlas has no link dates yet, so atlas dots ignore the Map's era slider.
- A hosted copy of the data: it lives in `.cache/atlas` and is rebuilt with `tools/atlas/`. Releases could carry it if contributors want it.

## Consequences

- Imported facts can be wrong, and some are about living people. The page says so, and "Something wrong?" must reach them.
- The data is a snapshot. Refreshing it is a re-run of `tools/atlas/`, one query at a time: QLever is a shared public service.
