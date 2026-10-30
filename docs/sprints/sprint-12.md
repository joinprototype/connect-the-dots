# Sprint 12: The Big Three, and both sides of the debate

- Starts: 2026-10-30, at the founder's word · Length: 1 week
- Status: built and self-checked (2026-10-30); demo and review with the founder pending (the review of Sprints 10 and 11 is also still open)

## Goal

State Street joins BlackRock and Vanguard on the map, each holding shares for its clients in the same companies, and the common-ownership debate is told as links, each side in its own words.

## Why now

- **The flagship is two-thirds done.** The showcase chapter asks who owns BlackRock and Vanguard, and the scholarship it cites is about the "Big Three" (Fichtner, Heemskerk and Garcia-Bernardo, 2017). State Street, the third, has no entry.
- **Its records are verified and waiting** (Sprint 11 research, backlog): SEC settlements by State Street Bank and Trust (2010, 2016, 2017, 2019) and State Street Corporation's 2021 deferred prosecution agreement.
- **The debate has no link.** The chapter tells the common-ownership debate, but no relation can carry "a study finds X" and "BlackRock disputes that finding" side by side (backlog, Sprint 9). A question page would show one side only.

## Scope (proposed)

### Must
- [x] **S12-01 State Street**: State Street Corporation, State Street Bank and Trust and State Street Global Advisors, each tied to its parent by its own filings; its holdings for clients in the companies BlackRock and Vanguard hold (Tesla, Microsoft, Amazon), from 13F or 13G filings; its legal records (ADR-0018).
  - Done: `state-street`, `state-street-bank-and-trust` and `state-street-investment-management` (the 10-K: "previously State Street Global Advisors"), plus Boston and the U.S. Department of Justice as new entries.
  - Holdings come from the restated 13F of 22 September 2026, as of 30 June 2026, in shares: Tesla, Microsoft, Amazon and BlackRock. State Street filed no 13G on them, so no percent is shown and none is computed.
  - Records on the SEC's and the Justice Department's own documents: the bank in 2010, twice in 2016 (the SEC and the Justice Department in one settlement), twice in 2017 and in 2019; the corporation's deferred prosecution agreements of 2017 and 2021, each charged, then settled.
  - Corrected on the way: the 2019 case is about custody expenses, not ADRs, and the parent was organized in 1969.
- [x] **S12-02 Disputing a finding** (ADR-0019): a relation, always one side's account, from whoever disputes to the work whose finding it disputes, quoted in their words. The common-ownership studies become entries, with BlackRock's and the academics' accounts on both.
  - Done: `disputes_finding`, `finding` on a work, and a "The debate" card. Dennis, Gerardi and Schenone (2022) and the authors' 2022 reply are entries.
  - Who holds a dispute: BlackRock and the 2022 study against the 2018 study; Tecu, Elhauge and the reply against the 2022 study.
  - Vanguard's 2021 letter names no study, and we found no State Street document on the finding, so neither holds a dispute.
- [x] **S12-03 The chapter** gains State Street where the Big Three are named, and its debate scenes reveal the new links.
  - Two new scenes, a second study and the authors' reply, each with a quote card (19 scenes now). The 2021 scene now quotes Azar and Vives directly, and the airline quote runs to the end of its sentence.

### Should
- [x] **S12-04** The holders card on a company's page lists the Big Three's holdings for clients together, each with its own date and source (no sum: their dates differ).
  - Done: owners first, then what is held for clients, each row with its date and footnotes; a filing with shares and no percent shows its count. A stake that ended leaves the card and stays in Over time and the Timeline, so The Vanguard Group's pre-2026 holdings (now dated "until 12 Jan 2026", on its own 13G/As) stop sitting beside Vanguard Capital Management's. PNC's 70% from 1999 left the same way.

### Not in this sprint
- Bulk imports of 13F data (one filing per holding, by hand, as today).
- Deploy (on hold).

## Demo script

1. Tesla's page: BlackRock, Vanguard and State Street, each "held for clients", with dates and sources.
2. State Street's page: its parts, and its legal records card.
3. The common-ownership study's page: the finding, and who disputes it, each in their own words.
4. The BlackRock and Vanguard chapter: the debate scenes show the new links.

## Exit criteria

- Every new link has its sources and quotes; the debate shows both sides equally.
- Sweep clean; 0 console errors.

## Self-check (before the demo)

- [x] Tests and lints pass (66 engine tests, clippy clean)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 764 pages, 0 problems; contrast 62,434 texts, 0 too low
- [x] Demo script executed in a real build: Tesla's holders card, State Street's parts and records, the study's debate card, and the chapter's new scenes; no console errors; screenshots saved in `docs/sprints/sprint-12/`
- [x] Every new quote matched by machine against its document (press releases and filings in a browser, orders and papers with `pdftotext`)
- [x] Docs and ADRs updated (ADR-0019, content model, data contract, CONTRIBUTING recipe 6)
- [x] Known issues listed

## Known issues

- ~~How the two deferred prosecution cases ended is not on the record here.~~ Closed in Sprint 13: both were dismissed, on the dockets.
- State Street's rows show shares, not a percent, because its filings give none. BlackRock's and Vanguard's percents have their own, different dates.
- Dennis, Gerardi and Schenone's abstract says "prior research", and the journal's disclosure statement could not be read (the publisher declined automated access). The working paper's disclosure names only a university research fund.
- The authors' reply and Azar and Vives are working papers: scholarship (T2), not peer-reviewed, and each title says so. No journal publication was verified.
- ~~"Who benefited from common ownership of US airlines?" has no page.~~ Closed in Sprint 13.

## Review

- What worked:
- What felt wrong:
- New ideas (moved to the backlog):
- Decisions (ADRs):
- Next sprint goal:
