# ADR-0025: A scan finds leads, a source makes a link

- Status: accepted (Sprint 22)
- Date: 2026-11-01

## Context

The Map holds a million dots and 2.48 million links, but the record holds about 700 entries, and many of them stand nearly alone: Albert Einstein had one link while Wikidata offers 49. Nothing looked for what was missing, so gaps were found only by a reader who clicked and found nothing. The founder asked for an index that finds links, efficiently, at a million dots and beyond.

Every claim needs a source, and Wikidata is a lead, never proof (ADR-0023). So a scan cannot publish.

## Decision

1. `ctd gaps` reads the record against the atlas and writes `.cache/gaps.tsv`. It never writes to `content/`. Each row is a lead, for a person or an agent to check against a source and then write as an ordinary claim.
2. It runs four passes: `ids` (an id that may name the wrong thing), `links` (atlas links between two hand entries the record does not join), `thin` (what the atlas offers an entry with one link or none), `dots` (imported entries that join hand entries kept apart: the best next dots to write).
3. One index serves them: both ends of every link, sorted by entry, relation and fame, in three flat arrays. It is rebuilt each run, in under a second; there is nothing to store and no database.
4. Hubs are judged by relation group, not by total links. A group over `group` rows is skipped at no cost, so BlackRock with 5,000 holdings stays a normal entry through its founders, and the United States' citizens are not walked.
5. Pair scores are not a lead. Adamic-Adar finds that two things are related, not how: tested on the real graph, its top 30 held no useful pair. Its one useful part, the entry in the middle, is what `dots` ranks.
6. Thresholds live in `content/methodology/gaps.yaml`. A lead someone checked and rejected goes in `gaps-ignore.tsv`, so it does not come back.

7. Checking runs on a schedule, by the steps in [leads.md](../leads.md), on one rolling branch. A run never pushes, merges or deploys.

## Consequences

- A full scan takes about 2 seconds and 380 MB on the laptop.
- The atlas holds only a third of the pairs the record has, and no money links, so this finds the structural half. Investments and board seats need text or filings.
- `ids` is noisy on purpose: a person reads each row. Harvard and Princeton show up there until the atlas stops filtering them out (`tools/atlas/build.py`).
