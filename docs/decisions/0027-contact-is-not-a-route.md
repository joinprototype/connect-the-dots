# ADR-0027: Contact on the record is never a route

- Status: accepted
- Date: 2026-11-02

## Context

The founder asked to link billionaires, politicians and presidents to Jeffrey Epstein. Many of these ties are on the record: a payment, a job, a meeting, a flight. Such a tie shows that two parties dealt with each other. It shows nothing about what either knew or did.

Routes would make that worse. Epstein would become one of the shortest ways between any two prominent people, so Connect would answer "How are these two connected?" with him, for no reason but fame. Legal relations already stay off routes for the same reason (ADR-0018): being charged by one regulator joins nobody.

## Decision

1. A relation `dealt_with`, from a person or organization to a person or organization, `sensitive` and `traversable: false`, with `role`, `amount` and `currency`. It shows on both pages, in Explore and in stories, always with its caveat: on an entry page under its group, the life line and the timeline, in Explore on the link's card.
2. It needs a documented dealing: a payment, a job, a meeting, a flight. A name in an address book, a mention by someone else and an unverified tip are not dealings, and make no link.
3. A claim that someone worked for an intelligence service is told as a claim, with `according_to` and `tale_about`, until a government or court record shows it. It makes no link to the service.

4. A relation `party_to`, for who a case, an agreement or an event names as a party, also off routes.
5. `sealed: true` on an entry makes this a rule the build checks: `ctd check` refuses any traversable claim that touches the entry, or an event or work linked to it. The first four writers each opened routes without seeing it, through ordinary links on events ("involved"), so a brief was not enough. Jeffrey Epstein and Ghislaine Maxwell are sealed.

6. Open data honours the same mark. It goes unread, and for these entries it said things the record refutes, such as an authored "client list". So a sealed entry keeps its dot and loses every open-data link and word, and what is about it leaves the atlas altogether: the events, works and things joined to it, and every entry whose own name or description names it. No page, route, search result or Map dot shows them.

## Consequences

- Readers can see every documented tie on a person's page, but Connect never passes through one.
- Plain facts about a sealed person, such as a job, must use these relations too. That costs little, and leaves no way round the rule.
- Any later hub of the same kind can use this relation.
- The founder can reopen the routing choice. It is one word in `content/schema/relations.yaml`.
