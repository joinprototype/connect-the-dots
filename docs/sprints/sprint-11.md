# Sprint 11: The record, step by step

- Starts: 2026-10-18 · Length: 1 week
- Status: built and self-checked (2026-10-18); demo and review with the founder pending (proposed after Sprint 10 from the founder's Sprint 9 asks)

## Goal

An entry's page shows what courts and regulators decided about it, each step of a case next to the others ([ADR-0018](../decisions/0018-legal-records.md)). Dates that only have an end read right, and Listen reads each side's own words.

## Why now

- **Legal records:** the founder asked for court and sanctions records in Sprint 9 (backlog). Today a settlement or a fine can only be a note.
- **Open starts:** five links keep "Until <date>" in a note because `../2022-01-05` parses as one day (backlog, Sprints 5 and 9).
- **Quote cards:** in the BlackRock chapter's debate scenes each side's words are seen but not heard (Sprint 9 review).

## Scope

### Must
- [x] **S11-01 Legal relations** (ADR-0018).
  - `charged_by`, `convicted_by`, `acquitted_by`, `overturned_by`, `settled_with` and `sanctioned_by`, flagged `legal: true`: sensitive, never in routes, always dated, with `title`, `case`, `amount` and `currency`.
  - `ctd check` refuses a legal relation that is not sensitive and untraversable, and a legal claim without `when`.
- [x] **S11-02 The "Legal records" card** on the page of the one a record is about: cases in date order, each with its steps, and "A charge is an accusation, not a finding of guilt." when the card holds a charge.
- [x] **S11-03 The first records**, each on a T1 record, quotes verified:
  - the SEC and Elon Musk and Tesla (2018: charged, then settled);
  - Citadel Securities (2017) and Robinhood (2020) settling with the SEC;
  - FINRA's 2021 order against Robinhood.
  - Done: Musk and Tesla (charged, then settled, $20M each), Citadel Securities ($22.6M), and Robinhood Financial, a new entry and a wholly owned part of Robinhood Markets by its own SEC filing (the SEC in 2020, $65M; FINRA in 2021, a $57M fine and $12.6M in restitution). The quotes were checked on sec.gov and in FINRA's order: FINRA's 2021 press release is no longer on finra.org, so its order (the AWC) is the source.
  - Found on the way: a life story told only its first 12 dated links, which cut Musk's charge off from its settlement two days later. A case is now never cut short, and a scene with a charge closes with the caveat.
- [x] **S11-04 Open starts.** `../2022-01-05` reads "until 5 Jan 2022", counts as current before that date in every time view, and the four links with "Until" in a note move it into their dates.
- [x] **S11-05 Listen reads quote cards**: after a scene's narration, "In their words:" and the quote, with who said it.

### Should
- [ ] **S11-06** The explorer merges parallel links between two entries into one line with a count, as the story graph does (backlog).

### Not in this sprint
- Cases as entries of their own; pardons, sentences and civil suits (ADR-0018, "Revisit when").
- A relation for disputing a finding (backlog).
- Deploy (on hold).

## Demo script

1. Elon Musk's page: the Legal records card shows "SEC v. Elon Musk": charged on 27 Sep 2018, settled on 29 Sep 2018 with its terms, each with its source.
2. Robinhood's page: two settlements, with the SEC (2020) and FINRA (2021), with amounts.
3. A route from Elon Musk to Robinhood never runs through the SEC.
4. Barclays Global Investors: its link to Barclays reads "until 1 Dec 2009" with no note.
5. The BlackRock chapter in Watch with Listen on: a debate scene reads the quote card after its narration.

## Exit criteria

- Every legal claim has a date and a T1 record; nothing on a page judges a person.
- Sweep clean (phone, dark, CSP enforced, `--a11y`); 0 console errors.

## Self-check (before the demo)

- [x] Tests and lints pass (65 engine tests, clippy, typecheck)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 699 pages, 0 problems; contrast 55,041 texts, 0 too low
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-11/` (Watch with Listen not heard: no voice in headless Chrome)
- [x] Docs and ADRs updated (ADR-0018, content model, data contract, CONTRIBUTING recipe 7)
- [x] Known issues listed

## Known issues

- **S11-06** (Should) is not done: parallel links between two entries still overlap in the explorer. Clicking one shows the others under "Also between them".
- Listen reading quote cards was checked in code and for errors, not by ear: headless Chrome has no voice.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
