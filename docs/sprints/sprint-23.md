# Sprint 23: One box

- Starts: 2026-11-02 · Length: 1 week
- Status: active

## Goal

A first-time reader types two names and gets how they connect, with proof, from any page, with no nav to learn.

## Why now

The founder found the four places "too much and complicated", and picked One Box from three working prototypes (ADR-0028).

## Scope

### Must
- [x] S23-01 The box in every header, parsing a name, two names, a year or a question. The nav goes.
- [x] S23-02 Home opens on one name and the written stories it runs through, with "Another name".
- [ ] S23-03 `/r/` answers any pair: a direct tie first, with its caveat, then the way, with proof at each step.
- [ ] S23-04 The Stories page draws stories as islands, with a plain list beside it.
- [ ] S23-05 Names in stories link to their entries.
- [x] S23-06 Every old address still works. The footer lists Stories, Map, Explore and Connect.

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

- [ ] Tests and lints pass
- [ ] Demo script executed; screenshots saved in `docs/sprints/sprint-23/`
- [ ] Docs and ADRs updated
- [ ] Known issues listed

## Known issues

## Review

- What worked:
