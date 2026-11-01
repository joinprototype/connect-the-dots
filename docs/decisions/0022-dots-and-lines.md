# ADR-0022: Dots and lines, printed with love

- Status: accepted (Sprint 22). Supersedes the palette and type of [ADR-0014](0014-calm-design.md); its three places and its plain words stand.
- Date: 2026-11-01

## Context

The founder, on the Apple Books look of ADR-0014: stories "sometimes feel empty", white reads better than dark, and the site should have "better fonts and style overall", "nice with life, no need for minimalist", "like it was made with love".

The first ADR-0014 complaint still holds: ten hues with no meaning read as busy. So colour comes back only where it means something.

## Decision

1. **The idea is dots and lines.** The site speaks transit map and print shop: a thick line runs through routes and story progress, and every dot has a colour.
2. **Print inks with a job.** White paper, deep indigo ink `#171a3a`, and seven inks: each family of links has one (`content/schema/layers.yaml`), so a dot's colour says what it is, on every view. Each story takes one ink by its id, shared by its cover, its header and its scene titles.
3. **Two typefaces, hosted here.** Bricolage Grotesque for titles and controls, Literata for reading. Both under the SIL Open Font License, in `theme/static/fonts/`. About 180 KB for a page that uses both, cached after the first visit.
4. **Stories read on white,** in every mode. Other pages follow the system; dark mode is deep indigo, not black.
5. **The home page shows the real map,** `world/picture.svg`, generated from the graph at build time, so it grows as the graph grows.

## What stays

- Plain words; users never see T1, claim, edge or tier.
- 4.5:1 contrast, checked on every page by `tools/qa/sweep.mjs --a11y`.
- Never yellow on black. Sun yellow is a surface with ink on it, or a highlight on paper.
- Colour never carries meaning alone: labels and shape say the same.

## Consequences

- First visit downloads fonts. `font-display: swap` keeps text readable while they load.
- Generated covers are no longer neutral; two entries can share an ink.
