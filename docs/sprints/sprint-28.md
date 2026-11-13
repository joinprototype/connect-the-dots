# Sprint 28: Worth coming back to

- Starts: 2026-11-04 · Length: until the founder's next review
- Status: active

## Goal

A reader on a phone finds something new each day, can play and read without fighting the page, and we can see whether anyone does.

## Why now

The site is live and listed (2026-10-30), the story and leads runs add to it every night (ADR-0037, ADR-0038), and the founder read it on a phone: story covers too bare, the puzzle easy to go round in circles, the Map jumping after a pinch, and no idea whether anyone visits.

## Scope

### Must
- [x] S28-01 Stories with soul: all 80 stories but the Epstein set retold through the people who decided, and why (0.5.12, 2026-11-05).
- [x] S28-02 Stories at night end in a pull request the founder merges: Midnight, 1947; How America Became a Superpower; The Trust, deeper (0.5.14, 2026-11-12).
- [x] S28-03 The puzzle: no going back and forth between two names, each name once, a step back, and how far the end is after each step (0.5.14).
- [x] S28-04 The Map on a phone: a pinch no longer throws the map away when a finger lifts (0.5.15; 198 px to 2 px in a scripted pinch).
- [x] S28-05 Counting visits: Cloudflare Web Analytics let through the Content-Security-Policy, no cookie, no tracker (ADR-0040, 0.5.15).
- [x] S28-06 Story covers drawn from each story's own web, and "N scenes, years" on every card (0.5.16).
- [x] S28-07 Today's puzzle on the home page (0.5.17; S27-06).

### Should
- [x] S28-08 Harvest pilot: links from sources the stories already saved (ADR-0039). Kept 10 from 227 candidates, under its bar of 20; stays a tool run by hand.
- [ ] S28-09 Harvest proposes the people a story's sources name often and the record lacks, each joined to two old entries (ADR-0039, "Next").
- [x] S28-10 A phone pass over the live site with touch checks: `sweep.mjs --touch --size=390x844` on `/w/`, `/play/`, `/ask/` and all 89 pages under `/c/` found no touch problem; each page's one console error is the zone's blocked bot-detection script (S28-12). (2026-11-12)
- [ ] S28-13 The founder's own try on a real iPhone: the pinch fix, the puzzle, the covers (backlog, 2026-10-30).

### Could
- [ ] S28-11 The founder decides on the stopped Dutch Golden Age run (`.cache/stories/queue.md`): reopen or drop.
- [ ] S28-12 Turn off the zone's JavaScript detections, whose inline script the policy blocks on every page (a zone setting, the founder's).

### Not in this sprint
- Google Analytics or any tracker with cookies (ADR-0040).
- A nightly harvest, until a run keeps 20 links.

## Demo script

1. On a phone, open the home page: today's puzzle under the Map, story covers that show each story's web.
2. Open the puzzle, step forward, press "Back a step"; the line under "Where next" says how far the end is.
3. Open the Map, pinch in, lift one finger: the map stays where it was.
4. In Cloudflare, Web Analytics for joinprototype.com shows dots.joinprototype.com visits since 0.5.15.

## Exit criteria

The demo runs at 390x844 on the live site with no console errors but the zone's blocked bot-detection script, and `tools/qa/sweep.mjs --touch` finds nothing on the home page, `/c/`, `/w/`, `/play/` and `/ask/`.

## Self-check (before the demo)

- [x] Tests and lints pass
- [ ] Demo script executed on the live site
- [x] Docs and ADRs updated (ADR-0039, ADR-0040, data-contract, deploy.md)
- [x] Known issues listed

## Known issues

- Visits on dots.joinprototype.com are counted only from 0.5.15; most of its 95.6k requests in the month before were crawlers (ClaudeBot, ElevenLabs, Semrush, Keenable, Exa, Google, Bing) and our own headless checks.
- The leads run keeps about 3 links a night, mostly headquarters; the harvest about 5 a story. A million read dots needs another way to add entries.
- Doubt's cover is a dense knot with a long tail: its web really is one hub and a chain.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs): 0039 harvest, 0040 counting visits.
- Next sprint goal:
