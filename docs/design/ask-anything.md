# Ask anything: design

Sprint 4 proposal (S4-01 to S4-05), to become ADR-0015. It builds on the engine design and adds parts of the story and honesty designs.

## v1 scope: the simplicity cut (founder, 2026-10-17: "make sure you are not overengineering and keeping it simple")

Build these first; everything else waits until a real page needs it.

**Keep:**
- `questions.yaml` with four questions (connected, behind, why, benefited). Each has `ask`, `shows`, `not`, `subjects`, `groups` (label + in/out relation ids) and `min`.
- Earlier forms via `became`: up to 3 steps back, shown "as the Bolsheviks (until Mar 1918)".
- Placement:
  - records first;
  - then equal A–Z account columns with "Named in N of M";
  - then Disputed;
  - drafts last, never counted;
  - withdrawn never shown.
- Pages `/q/<q>/<id>/`, the index `/q/<q>/`, and stories `/q/<q>/<id>/story/`.
- "Going further" as plain links ("Who is behind Microsoft? ›") to answers that have their own page. No embedded sub-answers.
- An optional `in_sentence` on entities, for natural titles.
- The Ask form:
  - a four-way segmented control;
  - "Which one?" (up to 5 choices);
  - "No sourced answer yet";
  - "Not asked about people".
- Up to 3 question rows on the subject's own entity page; the "How each side tells it" card links to the why page.
- Question pages appear in `search.json` as ordinary entries (type `question`), so the header search finds them with no new browser code.
- A Questions shelf in the Stories library.
- `ctd check` rules:
  - unknown relation;
  - missing `shows`/`not`;
  - `ask` placeholder;
  - sensitive/kinship/passive relation in a question;
  - banned words.

**Later (backlog):**
- `ties`;
- causes of causes (`chain` > 1);
- embedded `further` sub-answers;
- an "Over time" band on question pages;
- an `answers:` methodology block (v1 uses code constants for caps);
- the explorer `?q=` mode;
- the "said YEAR" badge;
- page-size warnings and richness scoring (v1 keeps pages with the most lines).

## Decisions

1. **Questions are data. One `Answer` feeds the page, story, rows and explorer,** so they never disagree.
2. **Records come first, then equal account columns, A–Z.** Disputed lines go apart and drafts go last, and neither is counted, so an opinion never passes as fact.
3. **Every question has a required scope line, and the notice is fixed in the template.** The caveat cannot be dropped.
4. **"Behind" is never asked about people, and steps back once, time-checked, in separate sub-answers.** That finds funders without insinuating.
5. **"Benefited" sets Gained beside Lost and uses quoted accounts only.** A benefit is never inferred.
6. **"Why" chains stay inside one account.** Theories are never spliced.
7. **`became` gets `identity: true`.** The CPSU inherits the Bolsheviks' links.
8. **Ranking uses the `paths.yaml` cost, with caps in an `answers:` block.** There is one methodology.
9. **Pages are made only where answers exist, at most 5,000 per question.** About 30k files.
10. **Counts are "links" and "accounts".** "Answers" would sound like verdicts.

## Rejected alternatives

- **One `direction` per question:** it cannot express "why".
- **Layout modes and the `step_back`, `mirror`, `widen` and `aside` options:** groups already cover all four questions.
- **"Behind" at one hop only:** it misses the 1917 funding.
- **A "Where accounts meet" section or a caption naming rival sides:** both imply consensus.
- **Disputed lines in their own columns:** false balance.
- **A reverse index, with question rows on people's pages:** it accuses. Backlog.
- **Phrase parsing:** it overpromises.
- **A native `<select>`:** it hides the questions.
- **Kin ties in answers:** `relative_of` is sensitive, and the Family ties card covers it.

## 1. Data model

```yaml
# content/schema/questions.yaml   (order = Ask picker order)
banned_words: [mastermind, puppet, orchestrated, controlled, secretly, cabal, plot]
questions:
  - {id: connected, ask: "How is {a} connected to {b}?", route: true,
     shows: routes of sourced links, not: influence, intent or wrongdoing}
  - id: behind
    ask: "Who is behind {x}?"
    subjects: [org, group, place, event, tradition, artifact, work, concept]
    shows: documented founders, leaders, board members, funders and owners
    not: who made decisions, or why
    groups:                       # in = links pointing at {x}; out = links {x} owns
      - {label: Founded by, in: [founded]}
      - {label: Led by,     in: [leads, head_of, ceo_of, chair_of]}
      - {label: Board,      in: [board_member_of]}
      - {label: Money in,   in: [funded, invested_in]}
      - {label: Owners,     in: [owns_stake, acquired]}
    min: 2                        # names needed; 2+ accounts always qualify
    further: 1                    # re-ask of each answer, as sub-answers
  - id: why
    ask: "Why did {x} happen?"
    subjects: [event]
    shows: causes on the record, then each account's causes side by side
    not: a single settled cause
    groups: [{label: Causes, out: [caused_by], in: [led_to]}]
    chain: 2                      # causes of causes, inside one account
  - id: benefited
    ask: "Who benefited from {x}?"
    subjects: [event]
    shows: who gained or lost, in the words of whoever says so
    not: that anyone caused it
    groups: [{label: Gained, in: [benefited_from]}, {label: Lost, in: [harmed_by]}]
    ties: 2                       # record routes (≤ 2 links) from a name to {x}
```

Other changes:
- `became` gets `identity: true`.
- `paths.yaml` v0.4 adds `answers: {per_group: 8, per_account: 6, columns: 12, further: 3, max_follow: 2, shots: 14, max_pages: 5000, page_kb: 80}`.
- `featured.yaml` gets `questions:`.
- Entities get an optional `in_sentence`, e.g. "the dissolution of the Soviet Union".

`ctd check` errors:
- duplicate ids;
- an `ask` without its placeholders or its "?";
- a missing `shows` or `not`;
- an unknown or repeated relation;
- an unreachable subject type;
- a `sensitive`, `kinship` or `passive` relation (hint: family lives on entity pages);
- `further` or `chain` above `max_follow`;
- an `identity` relation that is attributed or changes type;
- an `in_sentence` that differs from the name;
- a banned word.

`ctd check` warnings:
- a featured question with no page;
- an account line with no quote (left off the page);
- a cause dated after its effect.

## 2. Answer computation

- **Memo:** for each question, one O(E) pass files matching links by subject; `further` and `chain` reuse it. Withdrawn links drop. Withheld claims never reach `kb.edges`.
- **Earlier forms:** whatever `became` X joins it, up to 3 steps back, shown as "as the Bolsheviks (until Mar 1918)".
- **Placement:**
  - unattributed lines go to records, "Both sides agree" first;
  - attributed lines go into each named account's column;
  - disputed lines go under Disputed, with the reason;
  - drafts go last as dashed "Being verified", never counted, chained or narrated.
- **Badges:** tier, "Both sides agree", "Gaidar's account · said 2007" (year shown when the source's voice is that account), and the note.
- **Ranking:** the shared hop cost (`paths::costs`) decides which lines survive a cap. Survivors show by date. An exact "and N more ›" opens the explorer.
- **Time:**
  - A line's date is its link's `when`, or else the answer's.
  - Level-1 lines are never filtered by time.
  - A deeper line must start before the line it extends ends. "Microsoft invested, Oct 2007" keeps "Gates founded Microsoft, 1975".
- **Extras (never counted):**
  - `further` asks the question again for the 3 cheapest non-person answers.
  - `chain` adds a cause to account A only if it is a record or A's own. Otherwise it links "Why did Y happen? ›".
  - `ties` shows the cheapest route of at most 2 record links from each top-3 name to X, skipping hubs.
- **Accounts:** equal A–Z columns under "Named in 3 of the 6 accounts recorded here: August 1991 coup attempt". Contested sets only drive "Both sides agree".
- **Counts:** links are published level-1 lines; accounts are distinct `according_to` values.
- **Richness:** evidence plus accounts picks the pages to keep. Featured pages are always kept.

Today's data gives 20 pages: 13 "behind" (Meta Platforms has 5 names and 8 links), 3 "why" and 4 "benefited".

## 3. URLs and pages

| URL | Generated when |
|---|---|
| `/q/<q>/<id>/` | `min` names or 2 accounts; the 5,000 richest |
| `/q/<q>/<id>/story/` | 2+ published lines or 2+ accounts |
| `/q/<q>/` | always: Ask preset, 100 richest, "and N more" |
| `/x/?from=&to=`, `/p/<a>--<b>/` | connected, unchanged |
| `/x/?focus=<id>&q=<q>`, `/?q=<q>&x=<id>` | browser only |

- About 30k files at most.
- The build warns on pages over 80 KB and counts what each cap cut.
- `graph.json` gains `questions` and `stories.questions`.
- `search.json` gains `q`.
- data-contract.md changes in the same commit.

## 4. Page UX

Section order:
1. question, scope, counts, Play;
2. notice;
3. Over time;
4. records, then accounts;
5. Disputed;
6. Going further, or ties;
7. Ask next;
8. folded: Proof, "How this answer is built";
9. Propose a source.

```
PHONE 375                          DESKTOP 1280, contested
‹ Meta Platforms                   Why did the dissolution of the Soviet Union happen?
Who is behind Meta Platforms?      Shows causes on the record, then each account's.
Also known as Facebook             Not a single settled cause.
Shows documented founders,         7 links · 6 accounts · Dec 1991   [▶ Play] [Explore]
leaders, board, funders, owners.   A connection is not evidence of wrongdoing.
Not who made decisions, or why.    Over time Sep 1985 oil · perestroika · 1986 Chernobyl
8 links · 2004 to today              · Aug 1991 coup · Dec referendum · Belovezha ▶ ◉
[▶ Play]  [Explore]                ON THE RECORD
A connection is not evidence       Belovezha Accords · led to it · 8 Dec 1991
of wrongdoing.                       Primary record · Both sides agree ¹
── Over time ─────────────         EACH ACCOUNT (A–Z, none ranked above another)
2004 ●─●─●─────────────── now      Named in 3 of the 6 accounts recorded here: Aug coup
  Thiel  ━━━━━━━━━━━━━┥ 2022       ┌ Gorbachev ──────┐┌ Russian gov't ──┐┌ Plokhy ───────┐
── Founded by ────────────         │ August coup ²   ││ Republics' right││ Ukrainian     │
Mark Zuckerberg     Feb 2004       │ Chernobyl ³     ││ to secede ⁴     ││ referendum ⁵  │
  Primary record ¹                 │ said 2006       ││ said 2022       ││               │
── Led by ────────────────         ├ Shushkevich ────┤├ US government ──┤├ Gaidar ───────┤
Mark Zuckerberg  CEO 2004 –        │ August coup ²   ││ August coup ²   ││ Oil price     │
── Board ─────────────────         │                 ││ Perestroika ⁶   ││ collapse ⁷    │
Peter Thiel        2005–2022       └─────────────────┘└─────────────────┘└───────────────┘
Jim Breyer         2005–2013       Ask next: Who benefited from it? ›
── Money in ──────────────
Peter Thiel · $500k     2004       STATES
  Scholarship & press ²            Empty: no page; Ask says "No sourced answer yet"
Accel · $12.7M      May 2005         · Open Accel · Connect… · Propose a source
Jim Breyer · $1M    May 2005       One account: "One account recorded. Others may
Microsoft · $240M   Oct 2007         exist." The card keeps column width.
── Going further ─────────         Draft: ╎ dashed, "Being verified", last ╎
Who is behind Microsoft?           Empty group: one muted line ("No account in our
  Bill Gates · founded · 1975 ³      sources says who gained.")
  Paul Allen · founded · 1975 ⁴
▸ Proof  ▸ How this is built
```

- On phones, account cards stack at equal size.
- Designed dark first, following the system setting. The accent marks only links, Play and the active line; quotes get the blue-gray highlight; no account has its own hue.
- The meta description repeats the scope line and the notice.

## 5. Stories

`answer_story(&Answer)` reuses `caption`, `quote_overlay` and `time_fields`, skips empty shots, and stops at 14.

| Shot | Behind: Meta Platforms | Why: dissolution | Benefited: October Revolution |
|---|---|---|---|
| question | map, Menlo Park 2004 | map, Moscow 1991 | map, Petrograd 1917 |
| records | one per group, in time order | Belovezha, both sides agree | – |
| accounts | each account | each account, A–Z, with its chain | Gained, then Lost |
| turn | step back: Microsoft → Gates, Allen | "Named in 3 of the 6" | ties: 1917 German funding |
| close | notice, Explore, Ask next | "We do not pick one." + notice | "Gaining is not causing." + notice |

- **Connected** keeps `path_story` and adds the scope line.
- **Every account** gets equal time.
- **Drafts** are never shown.
- **Narration** uses only labels and template words. A test fails on banned words or on "therefore".

## 6. Ask form

```
┌ How is ──────┬ Who is behind ● ┐   (radios + CSS :has(); 2×2 on phone)
├ Why did ─────┼ Who benefited ──┤
Who is behind [ facebook      ]?  [Ask]      Try Meta Platforms · the Bolsheviks
```

Segment labels and the sentence come from `ask`.

Names:
- 100 richest are embedded per question; the rest come from `search.json` `q` flags.
- A leading "the" is dropped.
- Only entries with a page are scored.

What happens on Ask:
- **Exact or prefix match:** opens the page.
- **Looser match:** "Which one?", up to 5, with type and dates ("soviet union" under Why → "Dissolution of the Soviet Union · Event · 1991").
- **No page:** "No sourced answer yet".
- **A person under Behind:** "Not asked about people. Open Bill Gates: family ties and every link ›".

## 7. Integration

- **Entity page:** only on the subject's own page, up to 3 rows ("Who is behind Meta Platforms? · 8 links ›") plus "How is … connected to…? ›". Bill Gates gets only the last.
- **"How each side tells it":** links "Side by side, with proof ›".
- **Explorer:**
  - same rows;
  - `?q=` draws level-1 links from `graph.json.questions` in the accent, dashed for accounts, others dimmed;
  - "and N more" lands here.
- **Stories library:** a Questions shelf.

## 8. Risks

| Risk | Mitigation |
|---|---|
| "Behind" chains insinuate (Facebook ← Microsoft ← Gates) | Own verb and proof per line; steps back separate, time-checked, uncounted; never about people |
| Benefit read as cause | Quoted accounts only; Lost beside Gained; ties from records only |
| False balance | Records first, with tiers; disputed lines get no column; S4-05 review asks for a competing account |
| Thin flagship content | S4-05; check warning |
| Family missing from answers | Family ties card and routes; Ask links there |
| Scale | Caps; O(Q·E); later, stories embed their own subgraph |
| Domain words in code | Test bans relation-id literals in `crates/` and `theme/` (fixes `share_rels`) |

## 9. Plan (1–2 days)

0. **S4-05 content, in parallel:**
   - sourced founders and leaders of `soviet-union` (today only Gorbachev, so no page; likely `place` in `founded`, org-to-place `leads`);
   - 2+ quoted `benefited_from` accounts on the dissolution;
   - October Revolution causes;
   - `in_sentence`.
1. **Schema and check (2 h):** ADR-0015, docs, rules, one bad fixture each. Putting `relative_of` in `behind` must fail.
2. **Engine (4 h):** `answers.rs`, `paths::costs`. Tests:
   - directions and earlier forms;
   - one line in 3 columns;
   - drafts and disputed lines uncounted;
   - time rule, no splicing;
   - exact "and N more";
   - route golden output unchanged;
   - 1M bench under 15 s.
3. **Pages and data (3 h).** Tests:
   - every line has a footnote and badge;
   - every page has scope and notice;
   - nothing below `min`;
   - no `/q/behind/<person>/`;
   - pages stay at 80 KB or less.
4. **Stories (2 h):** equal durations, no drafts, word test.
5. **Ask and explorer (2 h).**
6. **Should (2 h):** ties, Questions shelf, 404 alias lookup.
7. **QA (1 h):** 375 and 1280 px, light and dark. No horizontal scroll, no console errors, no yellow on dark.

Accept when:
- **Meta:** 8 links in 4 groups, plus "Who is behind Microsoft?".
- **CPSU:** "as the Bolsheviks" lines, the 1917 funding with its "debated" note, and Sutton under Disputed.
- **Dissolution "why":** Belovezha shows "Both sides agree", with 6 equal columns and "Named in 3 of the 6".
- **October Revolution "benefited":** Ludendorff's quote and "One account recorded".
- **Dissolution "benefited":** Lost only.
- **Bill Gates:** the people message.
- **Meta's page:** its row.
- **After S4-05:** `/q/behind/soviet-union/` exists.
- **`dist/q/`:** no "T1", "claim" or "edge".
