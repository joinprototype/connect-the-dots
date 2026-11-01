# Sprint 21: One airfield

- Starts: 2026-11-01, at the founder's word · Length: 1 week
- Status: released in 0.4.0 (2026-11-01); demo and review with the founder pending

## Goal

Santa Monica, the last of our test cases without a story, plays as one: an airfield in a beach town, from the first flight around the world to the satellite on paper, the network on paper and the Pentagon's history copied.

## Why now

- **Stories are what the founder likes most,** and every other test case now has a chapter.
- **The city's page is the thinnest of the test cases:** 3 links, though its entries already run from Douglas to RAND to Paul Baran's 1964 reports.
- **It ties the shelf together.** The Cold War chapters, Sputnik and the ARPANET all pass through this one airfield, so the graph gets denser where readers already are.

## Scope

### Must
- [x] **S21-01 The record.** New entries and links on primary sources: the 1924 flight, the DC-3, how Project RAND began, the 1946 report's own words, Baran and the network, the Pentagon Papers.
- [x] **S21-02 The chapter.** "The Airfield and the Think Tank", 21 scenes in date order, map and graph in turn, with the pin of Santa Monica fanning out into the entries based there.
- [x] **S21-03 The nuclear-war story, told straight.** Baran's own aim and what the ARPANET's builders say, each in their own words: the network that was built is not the one that was meant to survive a war.

### Should
- [x] **S21-04 A page can be corrected.** Entries and written stories end with "Something wrong or missing?": a public issue already filled in with the page and asking for a source, or the file itself. Entries had an edit link, inside Page history, where a reader would not look. It moved out. Generated stories have no file, so they have no line.

### Found on the way
- [x] **A globe shows half the planet,** so the 1924 route could not fit in one view. It now takes two, turning from the Pacific to the Atlantic, and the first draws the Soviet Union, so the route is seen going around it.
- [x] **"That's wrong, isn't it?" is the interviewer's line,** not Baran's, and the usual AT&T quote comes from Baran's 1990 oral history, not Wired. Each now names where it comes from.
- [x] **Albert Tucker did not name the prisoner's dilemma,** as often said: he told the prison story, and the name first appears in print in 1957, per the Stanford Encyclopedia. The story says only what he did.
- [x] **No entry page linked to a written story.** Search brings readers to entries, and the stories were only reachable from the shelf. An entry now lists up to three stories that name it, right under its facts.
- [x] **The route from RAND to the ARPANET** now says up front that it is a route of links, not a line of cause.

### Not in this sprint
- Moving the airfield's story past what sources say: no claim that RAND caused Sputnik, or that Baran's reports caused the ARPANET.
- Issue forms, a bot, a History tab.

## Demo script

1. Santa Monica's page: its story sits right under the facts, and "In Santa Monica" lists the planes, the papers and the reports made there.
2. Play the chapter: the World Cruisers leave and return, the pin fans out into RAND, the report's sentence, then Sputnik.
3. Baran and the rumor: two scenes, two voices, nothing decided for the reader.
4. The end: the Pentagon Papers, the court, Douglas leaves, RAND stays.

## Exit criteria

- Every quote in the chapter was read in its source, by script.
- No scene says more than its source.
- Sweep clean; 0 console errors; every graph scene keeps its entries on screen.

## Self-check

- [x] Tests and lints pass (73 engine tests); `ctd check --base origin/main` clean; the Rust and TypeScript route finders agree on 60 pairs; all 11 featured routes keep their number of scenes
- [x] Phone sweep clean with the Content-Security-Policy on (`--a11y --touch`): 855 pages, 0 problems, 73,455 texts, 0 too low. Only the narrow scene dots and the home page's route dot remain
- [x] Scenes looked at on desktop and phone, dark and light; `scene-fit` keeps every graph scene's entries on screen at 390x844. Watch and Listen were not played on a real GPU or phone
- [x] Every new quote matched by script against the saved source text. The 1946 report is a scan, so its sentence was read on the page image
- [x] Docs updated (CHANGELOG, roadmap, backlog, data contract)
- [x] Known issues listed

### After the release
- [x] **A refactor pass, with the site byte for byte the same.** The world's `build` went from 320 lines to 56, in named stages. A chapter's checks went from 149 lines to 49, and the shot fields that name entries are now listed once, where they were listed three times, so a new field cannot be missed. One CSS rule nothing used is gone. The proof: 1,430 files the same but for the build time, the CSS rule and the world's timer; a 60,000-node world's tiles the same; a chapter broken on purpose gives the same 32 lines of errors.

## Known issues

- Not tried on a real phone or GPU. The globe scenes need several seconds to settle in software rendering.
- Story maps show today's country names, so 1924 has a Pakistan on it (see the backlog).
- With 21 scenes the scene dots on a phone are 7 px wide, narrower than Sprint 16's. They still work as one strip, and Watch and scrolling do not depend on them.
- The AT&T scene rests on Baran's account alone: he is the only witness we have, and the scene says so. The card leaves the official unnamed.
- RAND's own histories disagree on how it began. The story says so and leaves it open.
- See the backlog entry of 2026-11-01 for what could not be read at source.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
