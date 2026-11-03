# Sprint 23: One box

- Starts: 2026-11-02 · Length: 1 week
- Status: done

## Goal

A first-time reader types two names and gets how they connect, with proof, from any page, with no nav to learn.

## Why now

The founder found the four places "too much and complicated", and picked One Box from three working prototypes (ADR-0028).

## Scope

### Must
- [x] S23-01 The box in every header, parsing a name, two names, a year or a question. The nav goes.
- [x] S23-02 Home opens on one name and the written stories it runs through, with "Another name".
- [x] S23-03 `/r/` answers any pair: a direct tie first, with its caveat, then the way, with proof at each step.
- [x] S23-04 The Stories page draws stories as islands, with a plain list beside it.
- [x] S23-05 Names in stories link to their entries.
- [x] S23-06 Every old address still works. The footer lists Stories, Map, Explore and Connect.
- [x] S23-08 Explore is a walk: an entry beside its neighbours, each named, one straight move from one to the next (ADR-0029).
- [x] Read (`/read/`, `/read/<id>/`): One Thread whole, a story over its field of dots, names as doors with their proof, the next story offered at the end with its reason. The field of dots is one shared piece, `web/src/lib/dotfield.ts`, on `data/field.bin` (docs/data-contract.md).

### Should
- [x] S23-07 Home's HTML under 100 KB (352 KB before).

### Not in this sprint

Grey open data on the Map. One drawing for all stories (the prototype's own canvas Earth). The stories keep their maps.

## Demo script

1. Open `/`. It opens on one name and the stories it runs through.
2. Press "Another name". Nothing below it moves.
3. On a story page, type "Bill Gates and IBM" in the box. The way draws, each step with its proof.
4. Type "Bill Gates and Jeffrey Epstein". The direct tie shows with its caveat, and no route passes through him.
5. Type "1914". Type "Who is behind Meta Platforms?". Type nonsense, and get a plain reply.
6. Empty the box and press Enter. The stories appear as islands.
7. In a story, tap a name.

## Exit criteria

The demo runs on 1280x800 and 390x844, light and dark, with no console errors, and `tools/qa/sweep.mjs` finds no new problem.

## Self-check (before the demo)

- [x] Tests and lints pass
- [ ] Demo script executed; screenshots saved in `docs/sprints/sprint-23/`
- [x] Docs and ADRs updated
- [x] Known issues listed

## Known issues

- Stories show a layout shift of about 0.17 on a phone during scrolling, as text swaps between scenes. 0.4.6 measures the same, so this sprint did not cause it.
- Real phones and Safari are unmeasured.
- Story progress dots are small tap targets, as before.
- `world/picture.svg` is still written, and no page draws it.

## Review

- What worked:
