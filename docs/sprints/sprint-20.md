# Sprint 20: The Map is worth opening

- Starts: 2026-10-31, at the founder's word · Length: 1 week
- Status: released in 0.3.0 (2026-11-01); demo and review with the founder pending

## Goal

Map opens on something a reader wants to look at: a map of links that fills the page, and an Earth that shows the world of the era they pick.

## Why now

- **The Map is one of three places in the header,** and it opened on a squeezed blob with a line running off to the far corner.
- **Backlog E4** names the Map's era slider as next, and ADR-0020 said to revisit borders then.
- **Eagle view** (founder, 2026-10-17): from the planet and its eras down to a single dot. Borders by era are the first half of that.

## Scope

### Must
- [x] **S20-01 The map of links fills the page.** Two groups of entries could land on one spot, and the step that pulls groups apart then pushed both the same way, 80 times. Merrill Lynch and Barclays ended up about 8 times further out than the rest of the map, and the view zoomed out to show them. They now part.
- [x] **S20-02 The world of an era.** On the Earth, picking an era draws every polity of its middle year, from 3000 BCE to 1990, with names, in place of today's borders ([ADR-0021](../decisions/0021-the-world-of-an-era.md)).
- [x] **S20-03 Stops that fit history.** The slider's stops run closer together as history comes closer: 1950 to 1970 is one stop, instead of a century.

### Should
- [x] **S20-04 Fewer entries alone.** 19 entries had no link at all and circled the map. Six now have a sourced one: Kerensky, Hindenburg, Sokolnikov, Sutton, Alexandria and the Letter of Aristeas. The other 13 stay alone rather than take a link that says less than the truth (see the backlog).

### Not in this sprint
- Today's contested borders. After 1990 the basemap stays.
- Polity outlines fading from one era to the next.
- The explorer's time slider.

## Demo script

1. Map: every region readable at first sight, on a phone too.
2. Earth, then drag the slider left: 1970, new states in Africa; 1930, the empires; 1600, Europe in pieces; 3000 BCE, four shapes.
3. Drag to the right end: today's map comes back.

## Exit criteria

- Every stop of the slider resolves: 30 years with a borders file, 4 stops on the basemap.
- Light and dark, phone and desktop, looked at by hand.
- Sweep clean; 0 console errors.

## Self-check

- [x] Tests and lints pass (72 engine tests); `ctd check --base origin/main` clean; the Rust and TypeScript route finders agree on 60 pairs
- [x] Phone sweep clean with the Content-Security-Policy on (`--a11y --touch`): 806 pages, 0 problems, 68,547 texts, 0 too low. Only Sprint 16's narrow scene dots and the home page's route dot remain
- [x] Every stop of the slider walked on desktop: 30 borders files, none missing, 4 stops on the basemap. Earth looked at in dark and light, on desktop and phone
- [x] Stories still draw their borders (Thirteen Days, the Soviet scene)
- [x] The six new links read against their sources. Wikipedia was tried for two and dropped: Hindenburg now rests on the U.S. Holocaust Memorial Museum, and The Seattle Times stays unlinked
- [x] Docs updated (CHANGELOG, roadmap, backlog, data contract, ADR, borders README)
- [x] Known issues listed

## Known issues

- Not tried on a real phone or GPU: dragging the slider there is the first thing to check, with up to 30 files of about 25 KB compressed.
- Names of polities are Cliopatria's, some formal ("Democratic Republic of the Congo"), some loose ("Francoist Spain").
- A polity's name sits on its largest piece: in 1825 the British Empire's is on India.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
