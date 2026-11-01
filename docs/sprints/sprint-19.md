# Sprint 19: Two new stories

- Starts: 2026-10-31, at the founder's word · Length: 1 week
- Status: released in 0.2.0, phone fixes in 0.2.1, one name in 0.2.2 (2026-10-31); demo and review with the founder pending

## Goal

GameStop and the road from clay to print each play as a story, and the Cold War's map shows the world of 1962.

## Why now

- **Stories are what the founder likes most,** and two of our test cases, the Bible and GameStop, have no chapter yet.
- **Backlog E4** names the next borders (the Cold War in Thirteen Days) and a history or religion showcase chapter.
- **The site is public now,** so a story that ends with nowhere to go loses its reader.

## Scope

### Must
- [x] **S19-01 Thirteen Days has borders:** the United States, Cuba, the Soviet Union and Turkey in 1962. "Turkey adjoins us" is now on the map.
- [x] **S19-02 Big numbers:** a `stat` card, a number with its proof beside it. `ctd check` refuses one without a source and a quote.
- [x] **S19-03 GameStop chapter:** "The Week the Buying Stopped", 16 scenes, each party in its own words, on primary records.
- [x] **S19-04 Clay to print chapter:** "From Clay to Print", 14 scenes, map-led, from accounts in Uruk to Mainz, with who wrote the Torah as each side tells it.
- [x] **S19-05 Next story:** a written story ends with the next two, round the shelf.

### Found on the way
- [x] **The border key sat under the time pills** on a phone, when the pills took two rows. It now sits in the same column as the pills, and on a phone it is one line, and the scene count gives way to the dots.
- [x] **Every written story looked the same on the shelf.** A chapter's cover is now its own map: the places it visits in their true positions, its routes in the accent. A story with fewer than three places keeps a constellation.
- [x] **"Shot" and "claims" reached readers** at the end of Thirteen Days. Now "scene" and "what each side says".
- [x] **A modern map is wrong for 3200 BCE.** A map scene dated before 1800 hides today's borders, roads and names. Land, sea and rivers stay.
- [x] **Names piled up on a phone** in the last scene of the clay chapter. Where names overlap, the later ones give way and their dots stay. `camera.fit` keeps every marker on screen.
- [x] **The "faded" pill ran under Watch** on a story with many scenes. The pills now wrap beside the controls.
- [x] **Two links said less than the truth.** The Jikji and the Gutenberg Bible now share `made_with` movable type, and the Dead Sea Scrolls `holds_copies_of` the Torah, instead of stand-ins.

- [x] **Found after 0.2.0 went live: blank graphs on phones.** The card leaving a scene stayed in the layout for its fade, stacked above the new one. Under a tall card it counted as a band across the top of the stage, so the graph framed its dots under the card, in 5 GameStop scenes and 3 of BlackRock's. The sweep could not see it, since a graph is drawn on a canvas, and the scenes looked at by hand were other ones. The leaving card now leaves the layout at once, and `tools/qa/scene-fit.js` measures every graph scene. Fixed in 0.2.1.
- [x] **On a short phone the card covered the stage:** 13 BlackRock scenes at 320x640 lost their dots. Below 720 px high, a card keeps to three lines of quote, and the scene below says who speaks.
- [x] **One name:** pages said "connect the dot" while the repo and the studio say Connect the Dots. Titles, the header and the share image now say Connect the Dots, the home title and description say what the site is, and the footer links to Prototype. Internal names (`ctd`, the crate, the package) stay.

### Not in this sprint
- The Map's era slider.
- Border shapes that morph from one map scene to the next.

## Demo script

1. Thirteen Days, the Soviet story: the Soviet Union and Turkey meet on the map beside Khrushchev's quote.
2. The GameStop chapter, with a big number and its proof.
3. Clay to print: the route across 4,700 years, then who wrote the Torah as two equal accounts.
4. The end of a story leads to the next.

## Exit criteria

- Every quote in the new chapters was read in its source.
- No border contradicts its scene.
- Sweep clean; 0 console errors.

## Self-check

- [x] Tests and lints pass (71 engine tests); `ctd check --base origin/main` clean; the Rust and TypeScript route finders agree on 60 pairs; every featured route has as many stops as before
- [x] Phone sweep clean with the Content-Security-Policy on (`--a11y --touch`): 804 pages, 0 problems, 66,799 texts, 0 too low; stories again at 320x640 and 844x390 after the last change. Only Sprint 16's narrow scene dots (9 px wide at 320 with 19 scenes) and the home page's route dot remain
- [x] Scenes looked at on desktop and phone, in software rendering; screenshots saved in `docs/sprints/sprint-19/`. Watch and Listen were not played on a real GPU or phone
- [x] Every quote on a card matched against its source text, or the link that quotes it; the 17 border cities checked against the shapes (Byblos sits on the edge of Cliopatria's coast)
- [x] Docs updated (CHANGELOG, roadmap, backlog, data contract, content model, CONTRIBUTING)
- [x] Known issues listed

## Known issues

- The Jikji scene and the Luther scene are the chapter's thinnest: see the backlog entry of 2026-10-31.
- A move between two map scenes jumps from modern to ancient names at once; they do not fade.
- The soft spots in the GameStop record are in the backlog too: no civil-suit relation, and two documents known only through others.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
