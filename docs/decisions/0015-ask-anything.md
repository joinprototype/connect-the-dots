# ADR-0015: Ask anything: questions are data, answers keep records and accounts apart

- Status: accepted (Sprint 4, v1 "simplicity cut")
- Date: 2026-10-17
- Design: [design/ask-anything.md](../design/ask-anything.md)

## Context

Until Sprint 4 the product answered one question: "How is A connected to B?". The founder's mission names others: who created and sponsored the Soviet Union, why it collapsed, and who benefited. These questions invite insinuation ("who is *really* behind…"), false balance and opinion passed off as fact. The founder also asked us to keep it simple: "make sure you are not overengineering and keeping it simple".

## Decision

1. **Questions are data.** `content/schema/questions.yaml` lists four questions (connected, behind, why, benefited). Each has an `ask` sentence, `shows` and `not` (the scope line), the entity types it is asked about (`subjects`), labelled `groups` of relations (`in` = links pointing at the subject, `out` = links it owns, optional `empty` text) and `min`, the names a page needs. The engine knows no question words.
2. **One `Answer` feeds everything.** `crates/ctd/src/answers.rs` computes it once; the page, its story, the entity-page rows, `graph.json` and `search.json` read the same answer, so they never disagree.
3. **Placement keeps opinion apart from the record.**
   - Published links that nobody claims as their account are **on the record**, by group, "Both sides agree" first.
   - Attributed links sit in the **column of each account** that gives them, A–Z, equal width, none ranked first. One link in three accounts appears in three columns and counts once. "Named in N of the M accounts recorded here" says where accounts meet, without implying consensus.
   - **Disputed** links get their own section with the reason; **drafts** come last as "Being verified". Neither is counted. **Withdrawn** links never appear.
   - An account line without a quote is left off (`ctd check` warns). A column quotes only words that are that account's own: a source whose `voice` or `author` is the account, or a quote marked `by` it (a speaker quoted in a report). It never quotes a reporter's or scholar's summary, and its tier badge never counts another account's sources.
   - "Named in N of M" counts a name only within one group: "gained" in one account and "lost" in another is not agreement.
4. **Every page carries its scope line and the fixed notice** "A connection is not evidence of wrongdoing." The notice is in the template; no question can drop it.
5. **No question is asked about people or families.** `ctd check` refuses a subject type with family ties (`family: true`: people, and groups such as peoples and families), so no `/q/behind/<person>/` page exists. "Who is behind" is asked only about organizations, places and artifacts: about an event or an idea it would read as orchestration, and "Why did it happen?" covers events. Family ties stay on entity pages: `ctd check` refuses family (`kinship`), `sensitive` and index-fund (`passive`) relations in a question.
6. **Earlier forms answer for later ones.** `became` gets `identity: true`. Up to three identity steps back, what was recorded about the Bolsheviks joins the CPSU's answer, marked "as the Bolsheviks (until 8 Mar 1918)". An identity joins two entries of one type and is never attributed.
7. **One methodology.** Caps keep the lines the `paths.yaml` link cost ranks strongest (weight × evidence, without the routes' hub term); survivors show by date, and "and N more" opens the explorer. v1 caps are code constants (8 per group, 6 per account, 12 columns, 5,000 pages per question).
8. **Pages only where answers exist:** `min` names or two accounts. A story is generated when there are two published lines or two accounts; every account gets the same time in it.
9. **Natural titles.** Entities may set `in_sentence` ("the dissolution of the Soviet Union"); it may only add "the" and lower the first letter. Question titles and route-story titles use it.
10. **Plain counts:** "links" and "accounts", never "answers", which would sound like verdicts.

## Rejected

- One `direction` per question: it cannot express "why". Groups with `in` and `out` cover all four questions.
- Layout modes, `step_back`, `mirror`, `widen` and `aside` options: groups already cover them.
- Disputed lines in their own account columns: false balance.
- A "Where accounts meet" section, or a caption naming rival sides: both imply consensus.
- Question rows on the pages of people *named* in answers (a reverse index): it accuses. Backlog.
- Phrase parsing of free-text questions: it overpromises.
- Kin ties in answers: `relative_of` is sensitive, and the Family ties card covers it.

## Consequences

- New outputs: `/q/<q>/<id>/`, `/q/<q>/<id>/story/`, `/q/<q>/`; `graph.json` gains `questions` and `stories.questions`; `search.json` gains question entries and `q` flags (see [data-contract.md](../data-contract.md)).
- Today's content gives 24 pages (17 behind, 3 why, 4 benefited) and 21 stories.
- `search.json` now holds `type: "question"` entries: code that wants only entities must filter them out, as it already does chapters.
- Later (backlog, not built): `ties`, causes of causes (`chain`), embedded `further` sub-answers, an "Over time" band, an `answers:` methodology block for the caps, the explorer's `?q=` mode, the "said YEAR" badge, page-size warnings and richness scoring.

## Revisit when

- A question needs a shape groups cannot express.
- Pages approach the 5,000-per-question cap, or a page passes 80 KB.
- Readers misread account columns as equally supported facts.
