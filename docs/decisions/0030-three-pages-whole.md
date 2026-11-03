# ADR-0030: Ask, Stories and Read, each whole

- Status: accepted; amended by [ADR-0031](0031-fewer-views.md) (Read is now each story's page, at `/c/<id>/`); amended by [ADR-0035](0035-stories-is-the-shelf.md) (One Place now lives on the Map)
- Date: 2026-11-03

## Context

ADR-0028 took pieces of three prototypes: the box in the header, names as doors in stories, islands on the Stories page and the walk in Explore. It rejected One Place and One Thread as the whole site. The founder then used all three prototypes, liked each of them whole more than the pieces, and liked the world drawn in dots most of all.

## Decision

1. **Ask** (`/ask/`) is One Box whole: the question is the page's heading as it is typed, each name gets its dot, and the answer, its proof and its picture sit below and beside it.
2. **Stories** (`/c/`) is One Place whole: one surface of story islands, named at rest, where clicking a dot glides to it and a way can be drawn. Only what a story is about lies on its island; anyone shared or merely mentioned floats in the water between, so that no one seems to belong to a story they are only named in.
3. **Read** (`/read/`, `/read/<id>/`) is One Thread whole: a story over the world drawn in dots, every name a door with its proof, and the next story offered at the end with what it shares.
4. **One world of dots** (`web/src/lib/dotfield.ts`, `data/field.bin`) draws the geography for Read and Ask, from every build.
5. Home links to all three at the top. The header keeps the box and Stories, Map and Explore (ADR-0028, amended). Every older address keeps working: story pages, the walk, two-name answers, the Map.

These are not the whole site, as the prototypes were. They are three ways in, each as good as its prototype.

## Consequences

- The worries in ADR-0028's Rejected list still hold, and each page answers them: no way, thread, chain or island passes through a sealed entry or groups people by heritage, a next step is always offered with its reason and never taken for the reader, and every page that draws a way says a connection is not evidence of wrongdoing.
- Stories takes a pinch or Ctrl and the wheel to zoom, so that an ordinary wheel still scrolls the page.
- More code to keep: three pages of their own. Each is under 16 KB gzip of script, and the dots are 297 KB gzip, loaded only on the two pages that draw them, after their words.
