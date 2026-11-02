# ADR-0027: Contact on the record is never a route

- Status: accepted
- Date: 2026-11-02

## Context

The founder asked to link billionaires, politicians and presidents to Jeffrey Epstein. Many of these ties are on the record: a payment, a job, a meeting, a flight. Such a tie shows that two parties dealt with each other. It shows nothing about what either knew or did.

Routes would make that worse. Epstein would become one of the shortest ways between any two prominent people, so Connect would answer "How are these two connected?" with him, for no reason but fame. Legal relations already stay off routes for the same reason (ADR-0018): being charged by one regulator joins nobody.

## Decision

1. A relation `dealt_with`, from a person or organization to a person or organization, `sensitive` and `traversable: false`, with `role`, `amount` and `currency`. It shows on both pages, in Explore and in stories, always with its caveat.
2. It needs a documented dealing: a payment, a job, a meeting, a flight. A name in an address book, a mention by someone else and an unverified tip are not dealings, and make no link.
3. A claim that someone worked for an intelligence service is told as a claim, with `according_to` and `tale_about`, until a government or court record shows it. It makes no link to the service.

## Consequences

- Readers can see every documented tie on a person's page, but Connect never passes through one.
- Any later hub of the same kind can use this relation.
- The founder can reopen the routing choice. It is one word in `content/schema/relations.yaml`.
