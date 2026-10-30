# Sprint 17: Borders through time

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: built and self-checked (2026-10-30); demo and review with the founder pending

## Goal

A story's map shows the world of its date: Russia and Germany in 1917, Germany's reach in 1918, the Soviet Union in 1922 and 1991.

## Why now

- **It was in the founder's first brief,** and it is the biggest thing left in Story v1.
- **A modern map is wrong for 1917.** The Soviet chapter's narration talks about borders the map cannot show.

## Scope

### Must
- [x] **S17-01 The data** ([ADR-0020](../decisions/0020-historical-borders.md)): Cliopatria, CC BY 4.0, cut to three polities by `tools/borders.py`. The source and the changes are credited.
- [x] **S17-02 The engine:** `content/borders/` loads and is checked, a shot's `borders` must name a file, and a date with no period warns. Files are copied to `data/borders/`.
- [x] **S17-03 The story map** draws the period for the shot's date, fades between shots, and shows a small key and the credit.
- [x] **S17-04 The Soviet chapter** uses borders in six scenes.

### Found on the way
- [x] **A gap in the data.** The first 1918 picture drew "Russia" as a patch in the south-east, with Moscow outside it. Cliopatria has no polity at Moscow in 1918 and 1919, so `russia.json` stops at 1917 and the Brest-Litovsk scene draws Germany alone.

### Not in this sprint
- Other chapters, the Map and the explorer's time slider.
- Contested present-day borders.

## Demo script

1. The Soviet chapter's first scene: Russia and the German Empire, 1917.
2. Brest-Litovsk: Germany's reach, from Estonia to Ukraine.
3. The founding: the Soviet Union, 1922. The end: 1991.
4. The same on a phone.

## Exit criteria

- Every map with borders credits Cliopatria and says the borders are approximate.
- No border contradicts its scene.
- Sweep clean; 0 console errors.

## Self-check

- [x] Tests and lints pass (69 engine tests)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y --touch`): 768 pages, 0 problems; contrast 62,972 texts, 0 too low
- [x] 18 city checks against the shapes (Moscow, Petrograd, Berlin, Kyiv, Minsk, Warsaw, Brest, Zurich): 0 wrong
- [x] Scenes looked at on desktop and phone, on a real GPU; screenshots saved in `docs/sprints/sprint-17/`
- [x] Docs and ADR updated (ADR-0020, content model, data contract, CONTRIBUTING, deploy)
- [x] Known issues listed

## Known issues

- The 1991 scene (8 December) shows the Soviet Union at its 1991 extent: the data is by year, not by day.
- Borders fade in on map scenes only; a move from one map scene to the next does not morph one shape into the other.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
