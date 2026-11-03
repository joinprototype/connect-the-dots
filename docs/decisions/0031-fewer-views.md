# ADR-0031: Fewer views

- Status: accepted
- Date: 2026-11-03

## Context

By 0.4.10 the site had about ten ways to look at one record, and most jobs had two or more. A story read on its old page (`/c/<id>/`, a scene player with a moving graph and maps) and again on Read (`/read/<id>/`, over the dots). Two things connected on the header box, on Ask, on Connect (`/r/`), on eleven route story pages (`/p/`) and on 316 question pages. Browsing happened on Stories, on Explore (`/x/`) and on the lists by kind. Each view had to be learned, kept working and checked, and each said the same thing a little differently. The founder asked whether all of them were needed, and agreed to cut them to one per job.

## Decision

One view for each thing a visitor does:

| A visitor wants | The view |
|---|---|
| To read a story | **Read**, at the story's own address `/c/<id>/`. Stories drawn from links (an entry's life, a question's answer) read the same way. |
| To know how things connect | **Ask** (`/ask/`). The box in every header asks it. |
| To browse | **Stories** (`/c/`), the islands. Clicking a dot there already does what Explore did. |
| To see where | **The Map** (`/w/`). |
| To look a name up | **Its entry page** (`/e/<id>/`), where the proof lives. |

1. **Read is every story's page.** The old story page and its player are gone (`chapter.html`, `story.js`). Read gained what only the old page had: a drawn story's way back to the page it was drawn for and its "drawn from sourced links" line, a scene's picture, the outro, picture credits, who wrote it, and the corrections line.
2. **Ask answers every pair.** Connect (`/r/`) and the route story pages (`/p/`) are gone: a pair's way, stop by stop with its proof, is Ask's answer. The library's connections and the route question link there.
3. **Explore is gone** (ADR-0029). An entry page lists its links, Ask lists all of a hub's, and Stories moves from dot to dot.
4. **No address breaks.** `/read/<id>/` and `/p/<a>--<b>/` redirect for good; `/read/` goes to the story Read opened on. `/x/` and `/r/` are small pages that read the ids they were given and go on: two names to Ask, one name to its page, nothing to Stories or Ask. They carry ids, never words.
5. **Ask shows what it can be asked.** Under the box, one example of each kind it understands: a name, two names, a year, a question. They come from the record (the first featured thread, a featured pair, the year Read's first story begins, a question about a featured name), never from a sealed entry (ADR-0027).
6. The header holds the box, Stories and Map; the footer adds Ask and About. Home opens on Ask and Stories.

## Consequences

- About 5,000 lines of browser code and ten packages leave the build (React, GSAP, sigma and graphology among them). Read no longer loads the Map's code: two pages' shared code now always gets a chunk of its own (`preserveEntrySignatures: 'strict'`).
- Life stories are smaller: their packs hold Read's page instead of the old one (35 MB to 33 MB in all).
- What the old reader did and Read does not, it no longer does: Watch, Listen (a story read aloud), the moving graph, MapLibre maps in a story, and "Explore from here". A story's places are drawn on Read's field of dots instead, never nearer than a country's view: the old cameras were set for maps with roads, and closer in the dots are only speckle. Only the story's own places are named around a scene. A scene's `explore` and `duration` fields are ignored.
- The 316 question pages stay as they are, built and unlinked from the header: search engines may still bring readers to them.
- Amends ADR-0028 (its places become fewer, and the header loses Explore) and ADR-0030 (Read moves to `/c/`), and supersedes ADR-0029.
