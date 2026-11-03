# Sprint 24: Fewer views

- Starts: 2026-11-03 · Length: 1 day
- Status: done

## Goal

One view for each thing a visitor does: read a story, ask how things connect, browse, see where, look a name up (ADR-0031).

## Why now

By 0.4.10 the site had about ten ways to look at one record, and most jobs had two or more. The founder asked whether all of them were needed, and agreed to cut them.

## Scope

### Must
- [x] S24-01 Read is every story's page, at `/c/<id>/`, and the stories drawn for a name or a question read the same way. Read gains the old page's back link, "drawn from sourced links" line, pictures, outro, credits, authors and corrections line.
- [x] S24-02 Ask answers every pair. Connect (`/r/`) and the route story pages (`/p/`) go; the library's connections link to Ask.
- [x] S24-03 Explore (`/x/`) goes. Entry pages, Stories and Ask link to Ask instead.
- [x] S24-04 No address breaks: `/read/…` and `/p/…` redirect, `/x/` and `/r/` forward the ids they were given.
- [x] S24-05 Header: the box, Stories, Map. Footer: Stories, Ask, Map, About. Home opens on Ask and Stories.
- [x] S24-06 The old story player, the explorer, the route page and their packages leave the build.

### Should
- [x] S24-07 Ask shows what it can be asked: a name, two names, a year and a question, each an example to tap.
- [x] S24-08 A word for a people never reads as a name in the box: "black people" is no Leon Black, and "White people" no Swedish firm (ADR-0016). Found by `tools/qa/box-check.mjs`, which failed on 0.4.10's data too.

## Demo script

1. Open `/c/bhopal/`. It reads over the dots, with its picture in its scene and the credits at the end.
2. Open `/e/arpanet/story/`. "Back to ARPANET" sits at the top, and it reads the same way.
3. Open `/ask/`. Under the box, tap each example.
4. Open `/x/?focus=standard-oil`: Standard Oil's page. `/r/?a=bill-gates&b=ibm`: Ask's answer. `/read/the-trust/`: the story at `/c/the-trust/`.
5. Type "black people and IBM" in the box: no pair.

## Exit criteria

The demo runs on 1280x800 and 390x844, light and dark, with no console errors, and `tools/qa/sweep.mjs` finds no new problem.

## Self-check (before the demo)

- [x] Tests and lints pass
- [ ] Demo script executed on the preview
- [x] Docs and ADRs updated
- [x] Known issues listed

## Known issues

- Watch, Listen, the moving story graph and MapLibre maps inside stories are gone with the old player. A story's places are drawn on Read's dots.
- `data/borders/<id>.json` is still written, and no page reads it.
- Real phones and Safari are unmeasured.

## Review

- What worked:
- What didn't:
- Next:
