# ADR-0005: Attribution and evidence model

- Status: accepted
- Date: 2026-10-16

## Context

The core motivation is critical thinking: readers should see who claims what, on which evidence, with narratives side by side instead of one story. Naive upvotes cannot decide truth: they can be brigaded, and labels such as "compromised" are defamation risks.

## Decision

- **A claim with no `according_to` is presented as documented fact** and needs T1/T2 sources.
- **A claim with `according_to: [x]` renders as "According to X …".** That covers narratives, beliefs, interpretations, contested causes, and what a text says. X is an entity: a government, school, tradition, scripture or person.
- **Source tiers T1–T4 are visible.** Sensitive relations need two independent T1/T2 voices or one T1 record, plus two approvals.
- **Confirmation is computed** from the voices behind the sources. Agreement across opposing perspectives earns the strongest badge.
- **A narrative diff** shows what each perspective asserts or omits.
- **No evaluative labels on people.** Record sourced events instead: convicted, charged, settled, sanctioned.
- **Every path carries the notice** "a connection is not evidence of wrongdoing", and passive index holdings collapse by default.

## Consequences

- Avoids false balance: weak evidence looks weak.
- v2 votes will ask "does the source support the claim?", scored with a bridging algorithm, not "is it true?"

## Revisit when

Real usage shows the model cannot express a common case.
