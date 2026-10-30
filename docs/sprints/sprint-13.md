# Sprint 13: Ask shows the debate

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: built and self-checked (2026-10-30); demo and review with the founder pending

## Goal

"Who benefited from common ownership of US airlines?" gets a page: what the study says, and everyone who disputes it, each in an equal column in their own words.

## Why now

- **Sprint 12 stopped one step short.** The debate reads well on a study's page, but a reader who asks a question never reaches it. ADR-0019 named what is missing.
- **Two known gaps sit on the showcase:** how State Street's two criminal cases ended (a charge without its outcome, which ADR-0018 warns about), and BlackRock's newest filing on Tesla.

## Scope

### Must
- [x] **S13-01 A question looks one step along** (ADR-0019, decision 8): a group with `via: [appears_in]` also reads the links of the works X appears in, so a dispute of a study about X answers a question about X. Each line names the study it is about.
  - Done: `via` on a question group, checked at load. The story draws the study and the link to it, and an earlier-form line and a `via` line stay separate.
- [x] **S13-02 The study's account:** who gained and lost, in the 2018 study's words, on the event.
  - Done: `airline-consumers` and `us-airlines`, each on the study's sentence "a large wealth transfer from consumers to producers", with a note on which result it follows. The page has 6 accounts, A to Z, each line quoted, and is featured.
- [x] **S13-03 The outcome of State Street's two cases,** from a court, a filing or the Justice Department, or a plain note that none was found.
  - Done: both were dismissed, from the dockets on CourtListener. The government dismissed the 2017 case on 28 July 2022 and the court ordered it the next day; it dismissed the 2021 case on 29 February 2024. `charge_dismissed_by` is a new legal relation, as ADR-0018 foresaw.

### Should
- [x] **S13-04** BlackRock's Tesla holding from its filing of 27 October 2026: 196,348,742 shares, 4.96%, as of 30 September 2026.

### Not in this sprint
- Deploy (on hold).

## Demo script

1. Ask "Who benefited from common ownership of US airlines?": gained and lost in the study's words, then a column for each side, A to Z.
2. Play its story: every account gets the same time, each quoted.
3. State Street's page: each case ends with its outcome, or says none was found.
4. Tesla's page: BlackRock's row with its new date.

## Exit criteria

- No account on the page without its own words; the disputes never count as fact.
- Sweep clean; 0 console errors.

## Self-check (before the demo)

- [x] Tests and lints pass (67 engine tests, clippy clean)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 768 pages, 0 problems; contrast 62,960 texts, 0 too low
- [x] Demo script executed in a real build; no console errors; screenshots saved in `docs/sprints/sprint-13/`
- [x] Docs and ADRs updated (ADR-0018, ADR-0019, content model, data contract, CONTRIBUTING)
- [x] Known issues listed

## Known issues

- Both working papers now count as scholarship (T2), so the authors' reply no longer reads "Self-published" beside BlackRock's "Primary record". They are not peer-reviewed; each title says "working paper".
- BlackRock's own letter still reads "Primary record", because a filing to a regulator is one. A reader could take that as stronger proof than a journal article. Worth a look at review: on an account, the tier says what kind of document it is, not whether it is right.
- The dockets come through CourtListener's copy of PACER, not the court's own site.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
