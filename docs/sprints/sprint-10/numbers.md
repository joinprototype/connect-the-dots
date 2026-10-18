# Sprint 10 numbers

Measured on 2026-10-18 (ADR-0017).

## Today's site (338 entries, 642 links)

| File | Raw | Gzip |
|---|---|---|
| `data/schema.json` | 16 KB | 3.6 KB |
| `data/graph-slim.json` | 65 KB | 17 KB |
| `data/e/<id>.json` (338 files) | | median 0.9 KB, largest 6.2 KB (BlackRock) |
| `data/search/0.json` (the only search file) | 103 KB | 27 KB |
| a story's own data, in its page (295 stories) | | median 1.5 KB, largest 14 KB (the Soviet Union chapter) |
| `data/graph.json` (before; now only with `--graph`) | 586 KB | 167 KB |

What each demo page requested from `/data/` (headless Chrome, `tools/qa/cdp.mjs`):

| Page | Data files |
|---|---|
| `/x/?focus=blackrock` | `schema.json`, `graph-slim.json`, `e/blackrock.json` |
| `/x/?from=john-f-kennedy&to=cuban-missile-crisis` | `schema.json`, `graph-slim.json`, `e/cuban-missile-crisis.json` (the route's link) |
| `/c/who-owns-blackrock-and-vanguard/` (scrolled to scene 5) | `schema.json` |
| `/` (Ask "Why did Meta happen?", then search "nazarb" and "jfk") | `search/index.json`, `search/0.json`, `e/meta-platforms.json` |
| `/w/?view=earth&focus=blackrock` | `schema.json`, `graph-slim.json` |

Routes: the same from `graph-slim.json` as from `graph.json` for 300 pairs (all 11 featured, the rest random) with four filter settings (everything; everything with index funds; money, facts only, as of 1995; people, as of Oct 1962): 1,200 of 1,200 identical, 301 with routes.

## Synthetic builds (`ctd build --synthetic <n>`)

Made-up entries on the real schema, linked with the synthetic world's structure (communities, cross links and six hubs of 10–20k links), one quoted primary source per link.

```
synthetic: 100000 entries, 399900 links, 3999 sources (0 errors) in 1.3 s
graph-slim.json: 4.7 MB gzip (25.9 MB raw), 12.3 B per link; budget 1.0 MB (past it: routes need the route service)
e/<id>.json: 100000 files, median 0.5 KB, largest 36.8 KB gzip (wei-junquinis-10004)
search/<n>.json: 220 files, median 22.5 KB, largest 24.0 KB gzip; index.json 1.0 KB gzip
done in 4.0 s

synthetic: 1000000 entries, 3262162 links, 32622 sources (0 errors) in 10.4 s
graph-slim.json: 41.1 MB gzip (228.5 MB raw), 13.2 B per link; budget 1.0 MB (past it: routes need the route service)
e/<id>.json: 1000000 files, median 0.4 KB, largest 37.3 KB gzip (laura-yarmer-2c67a)
search/<n>.json: 1608 files, median 20.9 KB, largest 23.2 KB gzip; index.json 6.2 KB gzip
done in 34.9 s (9 GB of memory at most, 4 threads)
```

**The threshold:** the slim file costs about 27 bytes gzip per link of today's content (entries included; 13 at the synthetic million's 3.3 links per entry). Its 1 MB budget holds about 40,000 links, roughly 20,000 entries at today's density. Past it the build warns, and the explorer and routes need the route service. Entry, question and story pages stay the same size at any scale, and each detail and search file stays under 40 KB gzip.
