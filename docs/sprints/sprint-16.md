# Sprint 16: Comfortable on a phone

- Starts: 2026-10-30, at the founder's word · Length: 1 session
- Status: built and self-checked (2026-10-30); review with the founder pending

## Goal

The whole site is comfortable on a phone, upright or on its side, not just free of sideways scroll.

## Why now

The sweep already ran at phone size, but it only looked for console errors and sideways scroll. The founder asked for the site to be mobile friendly, and a new check found 30 kinds of problem.

## Scope

### Must
- [x] **S16-01 A phone check in the sweep:** `--touch` reports tap targets under 24px (WCAG 2.5.8), text under 12px, fields under 16px, and anything past the screen's edge.
- [x] **S16-02 Fields:** the search box and the explorer's fields are 16px, so iOS no longer zooms the page on focus.
- [x] **S16-03 Tap targets:** footnotes, the header, badges, "more" links and lists are at least 24px on touch screens, and the header stays the same height.
- [x] **S16-04 Scene dots:** one row of 28px tall targets however long the story, instead of 9px dots in two rows.
- [x] **S16-05 Names:** the explorer keeps its labels whole on a phone, and the life line wraps names instead of cutting them short.
- [x] **S16-06 Sideways phones:** stories stay side by side with a small, wide quote card, the header scrolls away, and the stage fits the screen. The Watch bar used to cover the quote.

### Not in this sprint
- A real iPhone or Android device: everything here was emulated.

## Exit criteria

- No page with sideways scroll at 320, 390 or 844 wide.
- Sweep clean; 0 console errors.

## Self-check

- [x] Typecheck and build pass; 68 engine tests pass
- [x] Phone sweep at 390x844 with `--a11y --touch`: 768 pages, 0 problems; contrast 62,975 texts, 0 too low
- [x] 320x640 and 844x390 with `--touch`: 0 pages with problems
- [x] Portrait, sideways and explorer looked at in screenshots
- [x] Docs updated (CLAUDE.md, backlog)
- [x] Known issues listed

## Known issues

- Scene dots are 9px wide in long stories (28px tall): 19 dots share one row. A slip lands on the next scene, and scrolling is the main way through a story.
- The home page's route dots are 18px to the sweep, which measures the element; their tap area reaches 30px.
- Emulated only: the iOS zoom fix and touch gestures still need a real iPhone.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
