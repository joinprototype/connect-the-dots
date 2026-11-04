# ADR-0037: The loop

- Status: accepted
- Date: 2026-11-03

## Context

The record grows by hand: a person finds a lead, a source and a quote, and another reads it. That is too slow for a million read dots. The founder asked for cheap models to keep finding and sourcing, and one agent to check, approve and merge. Until now no automated run could push or merge (the leads branch waited for a person), and a mistake by a cheap model looks as confident as a fact.

## Decision

A run has four steps ([docs/loop.md](../loop.md)):

1. A **scout**, on a cheap model, sources a batch of leads on its own branch, saving each source's text.
2. A **gate** with no model, `tools/loop/gate.sh`, refuses what is mechanically wrong: any change outside entries, sources, stories and the ignore list; a request header or a personal detail; more than 40 new quotes; a failing `ctd check --base main`; a quote that is not word for word in saved text.
3. One **reviewer**, on a careful model, fetches every source again itself, reads each claim against its relation's meaning, and merges into `main` what holds and passes the gate on its own copy. It never merges what touches sealed entries, harms, living people beyond their offices and public acts, interpretations, sensitive or legal links, or stories: those wait for the founder.
4. A **release** still needs the founder's go in chat.

What the reviewer drops is written down for the next scout, and every run logs what it cost and what it merged.

## Consequences

- An agent may now merge into `main`, within these limits. `main` stays what a careful reader checked; the live site stays what the founder released.
- The quote check needs no model and the second fetch needs no trust in the first, so the cheap step cannot pass off an invented quote.
- Running it unattended needs a schedule, which needs the founder's word. The founder gave it on 2026-11-04: one run a night ([tools/loop/night.md](../../tools/loop/night.md)).
- Amends the leads loop of ADR-0025, where a run could not push or merge.
