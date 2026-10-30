# ADR-0019: Disputing a finding: each side in its own words, nothing decided

- Status: accepted (Sprint 12)
- Date: 2026-10-30

## Context

The common-ownership debate lived only in a chapter. A study says fares were higher, BlackRock says the result does not hold, the authors answer. `harmed_by` could carry the study's account, but nothing could carry the reply, so a question page would have shown one side (backlog, Sprint 9).

`status: disputed` does not fit. It marks a link in our own data, with our words as the reason. Here the dispute is itself a sourced event: someone, on a date, in a document, said a finding does not hold.

- **What it needs:** the finding in the study's words, and each dispute in the disputer's words.
- **Why it needs care:** a site that prints one side louder has taken a side. The firms are large and their words reach further. "Disputed by BlackRock" must not read as "wrong".

## Decision

1. **One relation, `disputes_finding`,** from whoever disputes (a person, an organization or a work) to the work whose finding they dispute. It reads "disputes a finding of" and "finding disputed by". The schema flag is `dispute: true`.
2. **A dispute is always its owner's own account.**
   - The relation is `attributed`, so never a route: disputing a study connects nobody to it.
   - `according_to` names the owner and nobody else. `ctd check` refuses anything else.
   - A claim needs a quote in the owner's own words: a source in their voice, or a quote marked `by` them. `ctd check` refuses one without.
3. **A dispute needs a finding to answer.** A work gets a `finding`: one citation quoting what it found, in its words. `ctd check` refuses a dispute of a work with none, and a `finding` on a type that no dispute can point to.
4. **A dispute names its target.** It needs a document that names the work or plainly answers it. A letter against a general idea is not a dispute of a study. Vanguard's 2021 letter calls common ownership an unproven hypothesis and names no study, so it stays in the chapter and is not a link. We found no State Street document on the finding, so State Street has none.
5. **The debate card** on the study's page: "What it found", then "Who disputes it" by date, each in its own words. The disputer's page shows "What it disputes" with the same words. The relation's `caveat` closes the card: "Each side is quoted in its own words. Whether a finding holds is not decided here."
6. **A reply is the same relation.** When the authors answer, they dispute the critic's finding, on the critic's page. Neither side gets the last word by design: the card shows what is on the record, by date.
7. **Who paid for the work is said where a source says it,** in a neutral note: "Analysis Group is a consultant BlackRock hired."

8. **On a question page (Sprint 13),** a question group can look one step along a link: `via: [appears_in]`, `in: [disputes_finding]` reads the works X appears in. Each disputer then gets an equal column, A to Z, beside the study's own account, and each line names the study. Without this, a `harmed_by` account would have shown one side.

## Rejected

- **`status: disputed` on a study's link:** our data would be judging. It is also one flag where the debate has several voices and dates.
- **Disputes aimed at the event** ("common ownership of US airlines"): the disputes answer a paper's method and numbers, not an event.
- **A separate `finds` relation from a study to its subject:** a second relation for one quote, with no target that says more than the study's page does.
- **Showing a score or a count of sides:** two papers against one proves nothing. Nothing is counted.

## Consequences

- **Content:** Azar, Schmalz and Tecu (2018) and Elhauge (2016) get findings. Dennis, Gerardi and Schenone (2022) and the authors' 2022 reply become entries. BlackRock, the 2022 study, the 2022 reply, Isabel Tecu and Einer Elhauge hold the disputes.
- **Pages:** a "The debate" card. The "How each side tells it" card leaves disputes out, since the debate card tells them. "Who benefited from common ownership of US airlines?" has a page, with the study's account and every dispute.
- **Explorer:** an ordinary attributed link. No browser code changes.

## Revisit when

- **Findings need to be compared across several works:** make findings entries of their own.
