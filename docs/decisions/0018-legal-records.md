# ADR-0018: Legal records: what courts and regulators decided, every step of a case side by side

- Status: accepted (Sprint 11)
- Date: 2026-10-18

## Context

The founder asked for court and sanctions records (Sprint 9): charged, convicted, acquitted, sanctioned. They should be sourced and always dated, so legal matters stop living in notes. The founder also asked that a record say who decided and which court, and that appeals and reversals show next to the original decision.

- **What exists:** nothing. A settlement or a fine can only be a note on another link.
- **Why it needs care:**
  - A charge is an accusation, not a finding. A settlement often comes "without admitting or denying" anything.
  - A conviction can be overturned. A record shown without its later steps misleads.
  - These are records about named people, many of them living.
  - Two parties charged by one regulator have nothing to do with each other through it.

## Decision

1. **Six relations, flagged `legal: true`**, each from the person or organization the record is about to whoever decided:

   | Relation | Reads | To |
   |---|---|---|
   | `charged_by` | "charged by" | a prosecutor, regulator or court |
   | `convicted_by` | "convicted by" | a court |
   | `acquitted_by` | "acquitted by" | a court |
   | `overturned_by` | "decision overturned by" | the court that set aside an earlier decision in the same case |
   | `settled_with` | "settled with" | a regulator or the other party |
   | `sanctioned_by` | "sanctioned by" | a government or body that imposes sanctions |

   - **Qualifiers:** `title` is what the record calls it ("securities fraud", "without admitting or denying the allegations"), in the record's words. `case` names the case as the record does ("SEC v. Elon Musk"). Settlements and fines take `amount` and `currency`.
   - **The verbs are the record's.** No other word judges anyone: no "fraudster" and no "criminal", here or anywhere (as for every claim).
2. **A case's steps sit together.** On the page of the one the record is about, a "Legal records" card groups the steps that share a `case`, in date order: charged, then settled; convicted, then overturned. An appeal sits next to the decision it changed. A step without a `case` stands alone.
   - The card comes last among the page's at-a-glance cards: who a person is and what they did come first.
   - A life story never tells a step without the later steps of its case, even past its usual length.
3. **Stricter sourcing, always dated.**
   - Every legal relation is `sensitive`: one T1 record or two independent T1/T2 voices. The T1 record is the court's, regulator's or government's own: a judgment, a complaint, a press release, a sanctions list. A claim short of that is withheld from the site, as today.
   - A legal claim must have `when`, the date of the step. `ctd check` refuses one without it.
4. **Plain words about what a step means.** A card that holds a charge says: "A charge is an accusation, not a finding of guilt."
5. **Never a connector.** Legal relations are `traversable: false`: no route runs through a court or a regulator. They are not in any question's answer. They stay ordinary links: drawn in the explorer, listed on both pages, and told in life stories by date. On a hub's page (a regulator's), the 100 strongest of each kind are listed, as for every link.
6. **The schema says it.** `legal: true` requires `sensitive: true` and `traversable: false`, and the schema refuses a legal relation without them.

## Rejected

- **One "legal matter" relation with the outcome as text:** a conviction and an acquittal would look the same to every reader and every check.
- **Marking an overturned conviction `deprecated` or `disputed`:** the conviction did happen. The reversal is a later step of the same case, shown next to it.
- **Cases as entries of their own** (an event per case, with parties and courts linked to it): heavier to write and to read, for no gain until cases need pages. A case can become an entry later; `case` is the bridge.
- **Charges in routes or answers:** "connected through the SEC" says nothing true about two people.

## Consequences

- **Content:** the first records come with T1 sources: the SEC's 2018 case against Elon Musk and Tesla, its 2017 and 2020 settlements with Citadel Securities and Robinhood, and FINRA's 2021 order against Robinhood.
- **`ctd check`:** a legal claim without `when` is an error; one short of its sources is withheld with a warning.
- **Pages:** the "Legal records" card on the page of the one the record is about.

## Revisit when

- A case needs its own page (many parties, many steps): make cases entries.
- Pardons, sentences or civil suits are needed: add a relation, with the same flags.
