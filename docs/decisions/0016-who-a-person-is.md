# ADR-0016: Who a person is: family, citizenship and heritage, never a connector

- Status: accepted (Sprint 9)
- Date: 2026-10-17

## Context

The founder asked to show who a person is: their father and mother, the families they are connected to, their nationality and their ethnicity. The examples were Larry Fink and Sam Altman.

- **Family ties already exist.** `relative_of` is kinship, sensitive (one T1 or two independent T1/T2 sources), and entity pages gather it into "Family ties".
- **Nationality and ethnicity do not.**
- **Why ethnicity needs care:**
  - It is special-category personal data (GDPR Art. 9).
  - This product asks "Who is behind BlackRock?" and "Who is behind the Bolsheviks?". In such a product, linking or counting people by ethnicity is exactly how "they are all X" conspiracy narratives are made.

## Decision

1. **Families connect through what is documented.**
   - Kin ties of public figures, with the same sensitive sourcing as today:
     - parents and spouses;
     - siblings and in-laws who have public roles.
   - One family connects to another only through documented acts: a marriage, money, a board seat, a school, a job.
   - Minors and private relatives stay out.
2. **Citizenship is a link:**
   - `citizen_of` (person → place), dated and sourced, read as "Elon Musk, *citizen of* Canada".
   - It is not traversable: sharing a passport is not a connection, so no route runs through one.
   - It is passive: collapsed around a country.
3. **Background is a set of lines on the person's own page**, never a link. The person's entry carries `background:`: short, neutral lines about origin and upbringing, each with its sources. They cover:
   - who their parents were, by occupation, when the parents have no entry of their own;
   - where they grew up;
   - their heritage: ethnic or national origin, or the faith they were raised in.

   The rules:
   - **Who may have one:** people only.
   - **Living people:** only their own public words, from a source in their own voice. These are facts they have made public themselves.
   - **Historical figures:** established scholarship (one T1 or two independent T1/T2), as for kinship.
   - **Never inferred** from a name, a face, a relative, or a relative's faith.
4. **Background, heritage included, is never a connector.** It is not any of these:
   - a link, a node or a group;
   - a lens, a question or a count;
   - a filter, a search facet or a map layer;
   - a route step;
   - a field in `graph.json`, `search.json`, stories or answers.
   The site says where people were born and what they did. It never sorts people by origin.

## Rejected

- **Ethnicity as a relation to a group entry** ("Jewish people", "Germans"):
  - everyone with that heritage would meet at one node;
  - routes, "Named in N of M" counts and "who is behind" answers would run through it.
- **Ethnicity in answers, in the explorer's filters, or on the Map:** together they make a census of who runs things, by origin.
- **Inferring heritage** from surnames, photos or relatives.
- **Heritage of private relatives or minors.**

## Consequences

- **Person pages** get a "Background" card: born (date and place), citizenship, background lines (parents, upbringing, heritage) in the sources' words, and education.
- **`ctd check` enforces the rules:**
  - background only on people;
  - a quote on every source;
  - a living person's background from a source in their own voice;
  - a historical figure's from one T1 or two independent T1/T2.
- **Tests** check that background never reaches `graph.json`, `search.json` or story narration.

## Revisit when

- Readers or contributors use heritage lines to group people anyway, for example in shared screenshots or proposed edits.
- A person asks for a background line to be removed.
