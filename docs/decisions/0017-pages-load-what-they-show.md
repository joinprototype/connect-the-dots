# ADR-0017: Pages load what they show: a slim structure, an entry's details on demand, a story's own data

- Status: accepted (Sprint 10)
- Date: 2026-10-17
- Design notes: the Sprint 10 design and its skeptical review (2026-10-17), summarised here

## Context

- **Every page that draws a graph downloads all of `graph.json`.** The explorer and every story do, and so do route questions. The file is 164 KB gzip for 338 entries, about 0.5 KB per entry: roughly 500 MB at a million.
- **Site search and the Ask form download all of `search.json`:** 26 KB today, about 75 MB at a million.
- **A hub's entry page and the type pages list everything.**
- **The founder asked what a page weighs with millions of dots, and to keep it simple.**

The first design gave each entry its own file and let the explorer and the route search grow an index from those files as they went. A skeptical review measured it:
- a route question read a median 184 files (395 KB) on today's content;
- the route search ran out of its budget at about twice today's content;
- the explorer would have drawn differently depending on what had been loaded, and would have lost lines once several entries were open.

Most of that complexity buys nothing until the graph is a hundred times bigger, and at that size routes need a server anyway (ADR-0009 already planned a route service).

## Decision

1. **One slim structure file for the explorer and routes.**
   - **What it is:** `data/graph-slim.json` holds every entry and link with only the fields the explorer draws and the route search prices:
     - entries: id, name, type, dates, degree, coords;
     - links: id, ends, relation, dates, layers, `according_to`, status, passive, traversable, tier.
   - **What it leaves out:** no summaries, notes, sources or quotes.
   - **Size:** today 11 KB gzip, about 17.5 B per link.
   - **Effect:** layout, lines, filters, the index-funds model and routes work exactly as today, from one file.
2. **Details on demand.** `data/e/<id>.json` holds one entry's summary and aliases, its links with their notes, sources and quotes, and the names of the entries at their other ends. The explorer loads it when an entry or link is opened.
   - A hub keeps its 100 strongest links per kind (relation and direction), ranked as answers rank them, and says "and N more".
3. **Vocabulary in one small file.** `data/schema.json` holds `graph.json` without nodes, edges and sources (types, relations, lenses, tiers, perspectives, questions, methodology, story index).
4. **Story pages carry their own data.** Each story page embeds the entries, links and sources its scenes name, beside its shots. The player reads that and `schema.json`, and nothing else: a median 1.5 KB instead of 164 KB.
5. **Search by word range.**
   - **Files:** `data/search/<n>.json` hold the search entries. Each is filed under every word, and every pair of neighbouring words, of its names and aliases. The files are sorted and cut between words at 50 KB gzip, and stay one file while everything fits, which is today.
   - **Index:** `data/search/index.json` lists each file's first word, and the best-connected entries for an empty box.
   - **Ask** keeps its own matcher (names with or without "the", exact before prefix before word starts, best-connected first). It shares only the loading of candidates, and entries carry a `rank`.
6. **`graph.json` is opt-in.** `ctd build --graph` writes it, for tools and tests. No page fetches it, and the sweep fails a page that does. Cloudflare refuses files over 25 MiB, which `graph.json` would reach at about 11k entries.
7. **Pages stay bounded.**
   - **A hub's entry page** lists 100 links per kind, with "and N more" opening the explorer.
   - **Type pages** split by first letter once a type passes 500 entries.
8. **The threshold, stated.**
   - **The static explorer:** the slim file grows about 17.5 B gzip per link. It stays within its budget of about 1 MB up to about 55k links, roughly 25k entries at today's density.
   - **Past that:** the explorer and routes move to a small route service (ADR-0009's switch, moved earlier). The Map's tiles already hold a million dots.
   - **Unaffected:** entry, question and story pages stay constant in size at any scale.
   - **At build time:** the build warns when the slim file passes its budget.

## Rejected

- **A growing per-entry index for the explorer and routes** (the first design):
  - route questions would read hundreds of files;
  - the budget runs out at about twice today's content;
  - drawings would depend on browsing history;
  - lines would go missing once several entries are open.
  It would also need a route service at scale anyway.
- **Story pages loading entry files.** A scene showing one link of a hub would fetch the hub's whole file; the build knows what each story shows.
- **Search files by a fixed two-letter prefix.** At a million they average about 270 KB gzip, and common letters reach megabytes. Word ranges stay under 50 KB with 3,805 files and a 15.5 KB index (measured on a synthetic million).
- **One shared matcher for search and Ask.** Ask's matcher handles "the Cold War" and ranks by connections; the shared fuzzy matcher found the entry for 3 of 334 "the + name" queries.

## Consequences

- **Today:**
  - The explorer opens with about 11 KB of structure plus a few KB per opened entry, instead of 164 KB.
  - A life story loads about 1.5 KB of data.
  - Search is unchanged, as one 26 KB file.
  - No visible change.
- **New files:** one detail file per entry, so about 2.9 files per entry instead of 1.9. Cloudflare's file limits (20k free, 100k paid) arrive at about 7k and 34k entries; long-tail files then move to R2 (architecture §11).
- **Caching:** `/data/*` gets `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.
- **Tests:**
  - route results identical to today for all featured pairs and a random sample, with filters;
  - every story renders from its embedded data;
  - no page requests `graph.json`;
  - search finds every name and alias today;
  - a synthetic million-entry data build stays within the file budgets.

## Revisit when

- The slim file passes about 1 MB gzip (about 55k links): build the route service.
- Bulk imports make hubs of tens of thousands of links common.
