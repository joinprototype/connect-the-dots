# Sprint 27: Play and help

- Starts: 2026-11-03 · Length: 1 day
- Status: done

## Goal

A reason to come back each day, a way for readers to add to the record, and a loop that grows it with cheap models and one careful reviewer (ADR-0036, ADR-0037).

## Why now

The founder asked what makes the site a habit and a moat. The moat is proof: links a person has read a source for. The puzzle brings readers back; missing links and the loop turn them, and cheap models, into more proof.

## Scope

### Must
- [x] S27-01 `/play/`: two names a day, from one to the other by links a way may use, each step's proof a tap away; picked by the build from `content/methodology/play.yaml`.
- [x] S27-02 The puzzle's end: steps against the fewest, days in a row, and a line of coloured dots to share that names nobody.
- [x] S27-03 `/missing/`: the leads of `ctd gaps` between two entries, each as a question with a link that opens an issue to send a source.
- [x] S27-04 The loop: `docs/loop.md`, the scout and reviewer briefs, and `tools/loop/gate.sh`.

### Should
- [x] S27-05 One loop run by hand on 20 leads, and its line in `.cache/loop/runs.tsv`: 10 links merged, 7 of them fixed by the reviewer, 1 dropped; 142k tokens on Haiku, 162k on Opus.
- [x] S27-06 Today’s puzzle on the home page: its two names under the map, from `data/play.json` (2026-11-12).

## Demo script

1. Open `/play/`. "From Martin Luther to Pope John XXIII". Tap a link; the trail grows by a dot, and its proof opens under it.
2. Press "Show me a way": four steps, each name a link to its page, and Share.
3. Open `/missing/`: "Algeria, member of OPEC?", and "Send a source" opens an issue with the lead filled in.
4. Run `tools/loop/gate.sh` on a branch: it refuses a change outside content, and a quote that is not in saved text.

## Exit criteria

The demo runs at 1280x800 and 390x844 with no console errors, and `tools/qa/sweep.mjs --touch` finds nothing on `/play/` and `/missing/`.

## Self-check (before the demo)

- [x] Tests and lints pass
- [x] Demo script executed on a local build
- [x] Docs and ADRs updated
- [x] Known issues listed

## Known issues

- Ends repeat: 94 well-known names across two years, so NASA comes back about every three weeks. More stories make more ends.
- A hub such as the United States government shortens many puzzles to three steps.
- Each day's way is in `data/play.json`, so a reader can read ahead.
- The dev server has no open data: it picks puzzles from every end and has no missing-links page.
- The scout's quotes are weak: the reviewer fixed 7 of its 11 links (fragments, a menu item, a quote that never named the person). Its brief now says a quote must say the whole link by itself.
- The review costs more than the scouting, and a run yields about ten links.
- The loop has no schedule: that needs the founder's word.

## Review

- What worked: the puzzle reads as connect the dots, a line joining coloured dots; the build's picks join two stories between well-known names; the loop's gate and a second fetch caught every weak quote the cheap scout wrote.
- What felt wrong: the scout's quotes, which the reviewer had to fix seven times in eleven; only 94 names can end a puzzle.
- Next sprint goal: today's puzzle on the home page, and loop runs that need fewer fixes.
