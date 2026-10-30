# Sprint 15: The map becomes the graph

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: built and self-checked (2026-10-30); demo and review with the founder pending

## Goal

When a story moves between the map and the graph, the entries travel with it: each dot flies from where it sits in one view to where it sits in the other.

## Why now

- **Stories are what the founder likes most,** and Story v1 is the next item on the roadmap.
- **Today every switch is a crossfade.** The four chapters switch views 15 times, and generated stories switch too. Two pictures fade into each other; nothing says they show the same things.

## Scope

### Must
- [x] **S15-01 The morph, both ways:** dots leave from the view being left and land on the same entries in the other, following the camera while it moves.
  - Done: `web/src/story/morph.ts`. Each view says what it shows and where (`Placed`), and a dot aims at its target's position on every frame, so it lands true while the camera moves.
  - Matching by place as well as by id: a pin fans out into the entries based there, and they gather back into it. Of 129 switches across all stories, 120 now have something to fly; in "Behind the Success Stories" the first switch went from none to seven dots.
  - The flight runs by the clock, not a tween: on a busy map a tween stretched and left dots on screen.
- [x] **S15-02 Reduced motion** stays a plain switch. A switch with no entry in common stays a crossfade.

### Not in this sprint
- Borders through time: it needs a historical dataset, its license and somewhere to host it, so it gets its own plan.
- The "capture shot" tool for authors.

## Demo script

1. The BlackRock and Vanguard chapter, first two scenes: Vanguard's dot flies from Malvern on the map into the graph.
2. Thirteen Days, a scene moving from the graph back to the map: the dots land on the map's markers.
3. The same on a phone, and with reduced motion on: no flight, no errors.

## Exit criteria

- 0 console errors; sweep clean.
- Scrolling fast through a switch leaves no dot behind.

## Self-check (before the demo)

- [x] Typecheck and build pass; no engine change
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 768 pages, 0 problems; contrast 62,966 texts, 0 too low
- [x] Fan-out (7 dots, desktop and phone), gathering (3 dots), a fast scroll through ten switches and reduced motion, in headless Chrome: 0 errors, no dot left behind
- [x] Docs updated (roadmap, backlog)
- [x] Known issues listed

## Known issues

- Checked by sampling dot positions and one frozen frame (`docs/sprints/sprint-15/`), not by eye at full speed: headless Chrome draws the map in software, so it needs your eye in the demo.
- Thirteen Days' move from the graph back to the map has nothing in common, so it stays a crossfade.
- The dots do not carry names: both ends already show them.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
