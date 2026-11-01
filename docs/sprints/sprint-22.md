# Sprint 22: A million dots, with life in them

- Starts: 2026-11-01, at the founder's word · Length: 1 week
- Status: active

## Goal

The site holds a million real dots and stays fast, and it looks and reads like something made with love.

## Why now

The founder, after 0.4.0: stories "sometimes feel empty", get to a million dots "so that we have even better understanding of the world", and find out "if we have efficient engine". Then, as the work went on: white reads better for stories, render only what is in view "like real game engine", and "no need for minimalist".

## Scope

### Must
- [x] **S22-01 A new look** ([ADR-0022](../decisions/0022-dots-and-lines.md)): Bricolage Grotesque and Literata, print inks that mean something, each story its own ink, covers in colour, stories on white, the real map on the home page.
- [x] **S22-02 Pictures.** Entries are linked to Wikidata by hand-reviewed match, and 270 carry a freely licensed picture with its author and license. Each story scene shows one; a scene can fill the stage with a photograph.
- [x] **S22-03 The atlas** ([ADR-0023](../decisions/0023-the-atlas.md)): a million of the best-known things in the world, from Wikidata, marked as open data, in 4,096 shards.
- [x] **S22-04 Four more top stories:** "We Choose the Moon" (17 scenes), "The Plumbers" (16), "The Most Terrible Bomb" (20) and "The Crash of 2008" (19). Death tolls say who counted; the case for and against the bomb, and the commission's majority and dissents, each get their full say.
- [x] **S22-05 The million on the Map,** under Cloudflare's limit of 20,000 files: 1,000,174 dots, 2,484,598 links, 8,928 files, 773 MB, built in 14.5 s with 2.4 GB of memory.
- [x] **S22-06 Fast on a real GPU:** first tile in 142 ms, 4 tiles and 375 KB to open, 59.8 fps average over a 30 s flight (lowest 59.2), at most 25,505 dots drawn.

### Should
- [x] **S22-07 Entries list their stories.** Done in 0.4.0; carried on here.
- [x] **S22-08 Open data on hand-written pages:** an entry shows its wider links from the atlas.
- [ ] **S22-09 The explorer and the Earth stream by view.**

### Found on the way
- [x] **Real data broke what synthetic data hid.** A real graph has a component per lonely entry, and the layout compared every pair: over ten minutes. Placing them on one spiral and finding overlaps with a uniform grid, as a game's physics does, took the whole build to 27 seconds on 2.3 GB.
- [x] **Wikidata moved many names to a "mul" label,** so Douglas Adams had no English name and fell out of the fetch.
- [x] **Wikidata's class tree files physics under occurrence and Islam under organization.** An item now takes the first of an ordered list of classes, narrow ones first.
- [x] **Automatic matches were wrong:** Donald Douglas matched a Scottish actor and Nicholas II a pope. Every match was reviewed by hand, and `tools/atlas/corrections.tsv` keeps the fixes.
- [x] **Wikidata ids typed from memory were wrong** in 15 cases of 20. Ids are now only ever taken from a search.
- [x] **Over a third of the dots (362,000) had no community** and sat in one disc per colour. Each now joins the community of its rarest link.
- [x] **Hubs knotted the map** and painted it with long grey lines. It is now shared out by area into one round world ([ADR-0023](../decisions/0023-the-atlas.md) point 10), and a link appears once it is short on screen.
- [x] **Pale region discs muddied the zoomed-out map.** Dots at every zoom look better and cost less, so region tiles came out of the engine and the viewer, and frames stopped dropping below 59 fps.

### Not in this sprint
- Routes through the atlas.
- A hosted copy of the data.

## Demo script

1. Home: the real map behind the headline.
2. A story on white, in its own ink. Earthrise fills the stage.
3. Search for anyone, open their atlas page, hop from dot to dot.
4. The Map at a million dots, on a phone too.

## Exit criteria

- Under 20,000 files in `dist/`.
- Sweep clean; 0 console errors.
- No atlas page shows a label on a person, or anything from the list in ADR-0023 point 5.

## Self-check

- [x] Tests and lints pass
- [x] Phone sweep clean with the Content-Security-Policy on (`--a11y --touch`): 1,078 pages, 0 problems, 0 low contrast
- [x] Scenes looked at on desktop and phone
- [x] Every new quote matched against its source text
- [x] Docs updated
- [x] Known issues listed

## Known issues

- **218,805 living people are in the atlas.** Their facts come from Wikidata and nobody here has read them. They are limited to the list in ADR-0023 (years only, no labels), marked as open data, kept out of search engines, and each page has "Something wrong?". The founder should know this is the main risk of the atlas.
- Atlas dots ignore the era slider, and routes do not reach them.
- Wikidata misfiles some items (Facebook as an artifact, the Renaissance as an organization).
- Scene dots on phones are 16 by 28 px, under the 24 px target, in every story. With 20 scenes they cannot be wider in one row.
- A story's map shows today's country names.
- Nothing here has been tried on a real phone, only an emulated one.
- The legal list in `docs/deploy.md` is still open.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
