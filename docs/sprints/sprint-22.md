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
- [x] **S22-04 Two more top stories:** "We Choose the Moon" (17 scenes) and "The Plumbers" (16 scenes).
- [ ] **S22-05 The million on the Map,** under Cloudflare's limit of 20,000 files.
- [ ] **S22-06 Fast on a real GPU:** first dots under a second, smooth panning, flat memory.

### Should
- [x] **S22-07 Entries list their stories.** Done in 0.4.0; carried on here.
- [ ] **S22-08 Open data on hand-written pages:** an entry shows its wider links from the atlas.
- [ ] **S22-09 The explorer and the Earth stream by view.**

### Found on the way
- [x] **Real data broke what synthetic data hid.** A real graph has a component per lonely entry, and the layout compared every pair: over ten minutes. Placing them on one spiral and finding overlaps with a uniform grid, as a game's physics does, took the whole build to 27 seconds on 2.3 GB.
- [x] **Wikidata moved many names to a "mul" label,** so Douglas Adams had no English name and fell out of the fetch.
- [x] **Wikidata's class tree files physics under occurrence and Islam under organization.** An item now takes the first of an ordered list of classes, narrow ones first.
- [x] **Automatic matches were wrong:** Donald Douglas matched a Scottish actor and Nicholas II a pope. Every match was reviewed by hand, and `tools/atlas/corrections.tsv` keeps the fixes.
- [x] **Wikidata ids typed from memory were wrong** in 15 cases of 20. Ids are now only ever taken from a search.

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

- [ ] Tests and lints pass
- [ ] Phone sweep clean with the Content-Security-Policy on (`--a11y --touch`)
- [ ] Scenes looked at on desktop and phone
- [ ] Every new quote matched against its source text
- [ ] Docs updated
- [ ] Known issues listed

## Known issues

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
