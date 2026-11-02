# ADR-0024: Black on white, and colour only on the dots

- Status: accepted (Sprint 22). Supersedes the palette of [ADR-0022](0022-dots-and-lines.md), its story inks and its controls' typeface. Its dots, lines and typefaces for titles and reading stand, and so do stories on white and the home page's real map.
- Date: 2026-11-01

## Context

The same day ADR-0022 shipped to the branch, the founder looked at it and said the UI "looks really weird", that there was overlapping on the map, that alignment looked weird, and "I thought white and black is best".

Looking again, each was true:
- the header and every kind of page started at a different left edge;
- Home's picture ran under its headline and form, and the Map's era card covered its key;
- lavender panels, blue links, tomato buttons, gold bands and eight story inks competed, so no colour meant anything;
- rounded tinted cards made every page look like a template.

The founder's earlier "no minimalist bullshit" still holds, so this is not a return to ADR-0014's calm grey. Life comes from large type and from the dots.

## Decision

1. **Black on white.** Text, links, buttons, bands and rules are black, white and grey. Dark mode is the same on black. Links inside text are underlined, since colour no longer marks them.
2. **Colour only on the dots.** Each kind of thing keeps its ink (`content/schema/layers.yaml`), on the Map, the Earth, entry pages and covers. Nothing else on a page is coloured, so a colour always means something.
3. **One left edge.** `--page` sets one column. The header and every page hang from it. The Map and the explorer take the whole window, and the header goes with them.
4. **Rules, not cards.** Grouped things sit between hairlines, with no tint, shadow or big radius. A card is used only where something floats over a map or picture.
5. **Stories open on a black band,** and covers are black with their dots in colour, so a shelf reads as one set of books. Photographs stay as they are.
6. **Three faces, each with one job.** Bricolage Grotesque for titles, Literata for reading, and the system's own face for controls, where Bricolage's quirks read as odd at small sizes.

## Consequences

- Each story losing its own ink makes stories less distinct on the shelf. Covers carry that now, through their titles and drawings.
- The highlight on quoted proof is grey, not yellow, which also ends the old worry about yellow on black.
- Filled controls swap in dark mode, so anything filled uses `--on-fill` for its text, never a fixed white.
