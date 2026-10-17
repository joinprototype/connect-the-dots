# Sprint 4: Ask anything

- Status: **done** (2026-10-17). Musts S4-01 to S4-05 and Should S4-07 are built and reviewed. S4-06 (deploy) waits for the founder's Cloudflare login, and S4-08 (share cards) moved to Sprint 5.
- **Design:** [design/ask-anything.md](../design/ask-anything.md).
  - Three independent designs (engine, story, honesty), judged and merged.
  - Implementation follows its plan (section 9) and acceptance list.
  - It becomes ADR-0015 when built.
- Why: the founder's mission, in short:
  - who people are and what public ties connect them
  - "who created and sponsored soviet union, why this happened, and who benefited"
  - "who and why collapsed soviet union"

  Today the product answers only "How is A connected to B?". These are the other questions people actually ask.

## Goal

Four questions, each answered on its own page and each playable as a story:

| Question | Built from | Example |
|---|---|---|
| How is A connected to B? | ranked routes (exists) | Jeff Bezos → Sputnik 1 |
| Who is behind X? | founders, leaders, board seats, owners, investors, funders, over time | Facebook, Soviet Union |
| Who benefited from X? | `benefited_from` links, each with its account | Dissolution of the Soviet Union |
| Why did X happen? | `caused_by` / `led_to` chains, with every competing account side by side | Collapse of the Soviet Union |

Answers stay honest:
- Each line carries its proof and its badge ("Primary record", "Being verified", "X's account").
- Contested causes appear as equal columns, as in "How each side tells it".
- "A connection is not evidence of wrongdoing" stays on every answer.

## Design rule

The engine knows no domain vocabulary. Questions are data in a new `content/schema/questions.yaml`. The sketch below is the original proposal; the design doc supersedes it with groups, scope lines (`shows` / `not`), `further`, `chain` and `ties`:

```yaml
- id: behind
  ask: "Who is behind {name}?"
  relations: [founded, ceo_of, chair_of, head_of, board_member_of, owns_stake, invested_in, funded]
  direction: incoming        # links that point at X
- id: benefited
  ask: "Who benefited from {name}?"
  relations: [benefited_from]
  direction: incoming
- id: why
  ask: "Why did {name} happen?"
  relations: [caused_by, led_to]
  follow: 2                  # walk causes up to two steps back
```

## Scope

### Must
- [x] **S4-01** `questions.yaml` plus validation in `ctd check` (relation ids exist, direction valid). Also: `identity` on `became`, `in_sentence`, and banned words.
- [x] **S4-02** Question pages `/q/<question>/<id>/`, generated only when an entry has answers.
  - 19 behind, 5 benefited and 3 why pages from today's data, plus an index per question (`/q/<q>/`).
  - In reading order: the scope line, counts, Play, the notice; On the record; each account in its own equal column, A to Z; Disputed; Being verified; Going further; Ask next; folded Proof and "How this answer is built".
  - Entity pages show up to 3 question rows ("Who is behind Meta Platforms? · 8 links ›"), only on the subject's own page. "How each side tells it" links to the why page.
  - The Stories library has a Questions shelf.
- [x] **S4-03** The Ask form gets the question as its first word: "How are / Who is behind / Why did / Who benefited from".
  - A four-way segmented control (radios and CSS `:has()`, 2×2 on phones), each with its own sentence and name list. It works without JavaScript (the route form opens the explorer, the others the question index).
  - An exact or prefix match opens the page; several give "Which one?" with type and dates; an entry with no page gets "No sourced answer yet" or "Not asked about people", with a link to its page.
  - The route question reads "How are A and B connected?", so plural names read right ("the Bolsheviks").
- [x] **S4-04** Each question page can be played as a generated story (`/q/<q>/<id>/story/`). Every account gets equal time.
- [ ] **S4-05** Content: the Soviet Union (creation, sponsors, collapse) and three tech backstories (Gates, Bezos, Zuckerberg), each with competing accounts where they exist.
  - Done 2026-10-17. A research workflow produced 29 rows (13 claims); the verifier dropped 8 overstated rows. Added:
    - Soviet leaders with dates: Lenin, Stalin, Khrushchev, Brezhnev, Gorbachev. With these, "Who is behind the Soviet Union?" qualifies.
    - Who took part in the 1922 founding: Lenin, the Party's Central Committee, the Transcaucasian SFSR, Stalin.
    - Causes of the October Revolution: World War I (Lenin's and the Digital History Reader's accounts) and party organisation (Lenin's).
    - The US benefited from the dissolution, according to the US government (Bush, 25 Dec 1991 and 28 Jan 1992).
  - Tech backstories came in content pack 2 (Sprint 3).
  - Content pack 3 (2026-10-17) added "who is behind" Google/Alphabet, Apple and OpenAI. It went through the same research → verbatim-verification → integration pipeline:
    - 36 entities, 97 claims, 33 sources;
    - mostly T1 primary records: SEC S-1, 424B4, DEF 14A, 10-K and 8-K filings, Apple's 1980 prospectus, and company announcements.
    - Totals now: 194 entities, 379 claims, 183 sources.
    - Microsoft's overlapping "$13B total commitments" row was left out; its dated rounds remain.
    - Musk's OpenAI funding carries both accounts: his lawsuit says more than $44M, OpenAI says less than $45M.
  - Apple bridges (2026-10-17, from Apple newsroom primary records):
    - Eric Schmidt was an Apple director from August 2006 to 3 Aug 2009.
    - Arthur Levinson joined Apple's board in 2000 and was named chairman on 15 Nov 2011.
    - Apple was an island before; "Steve Jobs ↔ Elon Musk" now has a 7-step route.
  - Content pack 4: the January 2021 GameStop squeeze (2026-10-17). This was the founder's very first example.
    - 25 entities, 41 claims, 19 sources, almost all T1: the SEC staff report of Oct 2021, House Financial Services hearing records of 18 Feb 2021, the Robinhood S-1, and GameStop proxies and 13D filings.
    - Citadel ($2B) and Point72 ($750M) invested in Melvin Capital on 25 Jan 2021.
    - Robinhood's 28 Jan restrictions are attributed to NSCC deposit calls, per Robinhood. A note gives the SEC staff view that the decision was the brokers' own.
    - Witnesses' own denials are kept as notes: Griffin and Plotkin say they had no role in the platforms' decisions.
    - The verifier dropped "Robinhood contracted Citadel Securities": the S-1 says payment-for-order-flow deals are not binding contracts.
    - Totals: 219 entities, 423 claims, 204 sources.
  - `in_sentence` is in for 16 entries ("the dissolution of the Soviet Union", "the GameStop short squeeze").
  - "Who is behind the Soviet Union?" now answers who created it (2026-10-17): the four republics that concluded the 1922 Treaty of Union (Russia, Ukraine, Belarus and the Transcaucasian SFSR), quoted from the treaty text. `founded` may now join places, since states found states. The Communist Party is recorded as leading the Union, quoted from Article 6 of the 1977 Constitution, so the page leads on to "Who is behind the Communist Party of the Soviet Union?" and its 1917 funding.
  - "Who is behind GameStop?" is back with 10 links, all primary records (2026-10-17): George Sherman (CEO from 15 Apr 2019), Matt Furlong (CEO 21 Jun 2021 to 5 Jun 2023), Dan DeMatteo (executive chairman in 2019), and Alan Attal and Jim Grube (directors with Ryan Cohen from 11 Jan 2021). Sources: GameStop's own releases and an 8-K, read verbatim from Internet Archive copies of the SEC exhibits.
  - "Who benefited from the dissolution of the Soviet Union?" now has 7 accounts, each quoting its own words (2026-10-17). They came from a research workflow (2 agents), and a separate verifier re-fetched every quote and found it verbatim:
    - gained: the United States (US government), Ukraine (Leonid Kravchuk, quoted by Reuters), Belarus (Stanislav Shushkevich's memoir, read in an RFE/RL interview);
    - lost: Russia (Russian government), the Soviet people (Gorbachev's resignation speech), Kazakhstan (Nazarbayev's 2019 address) and Cuba (Castro, 2001).
    - Notes keep the nuance: Castro also names the wider socialist camp, and Nazarbayev's address presents independence as an achievement.
  - A citation can now say whose words its quote is (`by:`), for a speaker quoted in a report. An account's column quotes those words as its own, and nothing else from the report.

### Should
- [ ] **S4-06** Cloudflare preview deploy, so the founder can share a link (static output already fits Workers static assets).
- [x] **S4-07** "Eagle view" v1: the Map gets an era slider and region names. Zoom from the whole map to one dot to its page.
  - **Opens on the content.** The map had shrunk to 13% of its square: aligning each build to the last one also fitted a scale. Now only rotation or mirror carry over, with the angle snapped, so an unchanged graph rebuilds byte for byte (tested).
  - **Region names.** Up to 24 quiet names, one per sizable group of entries, fade out as you zoom in; tap one to fly there. A region is named after its best-connected entry that is not a person or a family, and a people-only group stays unnamed, so a name never reads as someone's territory. The hint explains what regions are. Withdrawn links and "not the same as" links no longer pull entries together.
  - **Era slider.** A native range input, "All time" by default, with twenty-year eras. Dots outside the era and undated ones fade but stay, and region names step back. It is Safari-safe (no URL writes) and keyboard-friendly.
  - **Dot → page.** Tap a dot for its card, then "Open page ›".
  - **Review** (skeptic, 2 medium and 8 low findings), all fixed:
    - Labels above or below a dot always hit the dot itself (shared label code), and after flying in, the hubs had no names. Fixed with the right gap, a deeper fly-in, and letting the six most important names sit over smaller dots.
    - No per-frame work while names are hidden.
    - The canvas focus ring now shows.
    - The explorer's world view fits below its own controls.
    - The tooltip stays hidden after a tap.
    - Plainer wording, and docs (ADR-0013, world tiles, data contract).

### Could
- [ ] **S4-08** Share cards (an image per route or question) for posting.

## Review (2026-10-17)

A build workflow (engine, then UX, then review) built S4-01 to S4-04. Two skeptical reviewers then checked it against the design's acceptance list: one for acceptance (22 items pass), one for honesty and defamation risk. Fixed the same day:

- **"Who is behind" about peoples and families.** `group` (peoples, communities, families) was a subject. `behind` is now asked only about organizations, places and artifacts, and `ctd check` refuses any question asked about a type with family ties.
- **A private person under "Money in".** Keith Gill's call options were an `invested_in` link to GameStop. Options bought on the market put no money into a company, so the link is gone; his testimony stays on the squeeze as a note.
- **Third-party words shown as an account's own.** A column now quotes only a source whose voice or author is that account. Plokhy's and the Provisional Government's columns no longer show an interviewer's or historian's summary, and Gorbachev's column now shows his own resignation speech.
- **Borrowed proof.** A column's "Primary record" badge could come from another account's source. A column now counts only its own sources (or a third party's report), never another account's.
- **Opposite accounts counted as agreement.** "Named in N of M" now counts a name only within one group, so "gained" in one account and "lost" in another never add up.
- **Disputed words as a quote card** in stories: removed. Sutton's book is now "Scholarship & press", not "Primary record".
- **Featured route story** named a runner-up route resting on one account with no attribution; it now says whose account it rests on.
- **Ludendorff's quote** under "Who benefited from the October Revolution?" now leads with his words about the benefit, not the sending of Lenin.
- **A question id that is not a slug** could write files outside the output folder; ids are now checked.
- Smaller: footnotes in order, question pages found by the subject's other names in search ("Who is behind Facebook?"), the notice in story link previews, no repeated "According to" in account shots, the story shot limit, record shot dates, plain "every link" wording, the two-row phone header, and TS types for the new data.

## Refactor pass (2026-10-17)

- `site.rs` (1,500 lines) split: page history (`site/history.rs`), the entity dossier (`site/dossier.rs`) and the question page context (`site/question.rs`) are their own modules. `build()` stays one readable pass with labelled sections.
- The life line ("Over time") was busy on large entries: Google had four stacked rows of bars with clipped labels and rows of unlabelled dots, and on phones every label shrank to "C…". It now shows tenures only, one row each (what and who, the dates, a bar on a shared axis), the 8 longest, with "N more in the Timeline". Moments such as a founding or a funding round stay in the Timeline, where their words fit. Phones show the name over its bar. The row packing code is gone.
- `chair_of` takes a `title`, so Eric Schmidt's 2011–2015 term reads "Executive Chairman".
- Sprint 3 leftovers fixed:
  - Explorer route steps read each link in its own direction ("Elon Musk invested in Tesla", not "Tesla investors Elon Musk").
  - `/x/` has an `h1` for screen readers.
  - `search.json` lists entries best-connected first, so a name that matches several resolves to the best-connected one.
- `tools/qa/sweep.mjs` checks every built page in one Chrome (folds open): console errors and sideways scroll.
- `/t/<type>/` lists every entry of a type, A to Z, with a letter bar. The home index's "and N more" now leads there; it was plain text, a dead end.

## Demo script (draft)

1. Home: "Who is behind [Facebook]?" → the answer page with founders, early investors and board seats over time. Each line has proof. Then press Play.
2. "Why did [the Soviet Union] collapse?" → three accounts side by side (economy and oil, arms race, the Ukrainian referendum), plus what the records confirm.
3. "Who benefited from [the dissolution of the Soviet Union]?" → answers with their accounts.
4. Share the preview link from a phone.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 50/50, `cargo clippy --all-targets -- -D warnings` clean, `ctd check` 0 errors / 0 warnings (252 entries, 474 links, 241 sources), web typecheck and build clean.
- [x] Review of S4-01 to S4-04: an acceptance check (22 items pass) and an honesty and defamation review; every finding fixed (see Review).
- [x] Review of S4-07 (eagle view): 10 findings, all fixed (see S4-07).
- [x] Phone sweep: every built page at 390 × 844, dark, folds open (`tools/qa/sweep.mjs` on a static build): 517 pages, no sideways scroll, no console errors. One chunk-load error appeared only under Python's test server; the same page was clean on the dev server and in a fresh browser.
- [x] Demo pages in dark and light, desktop and phone (`tools/qa/demo-shots.sh docs/sprints/sprint-04`): 76 screenshots of 19 pages. One console error during a concurrent rebuild; the page was clean on re-run.
- [x] Docs updated: data contract, content model, ADR-0013, ADR-0015, architecture, ux-vision, world tiles, roadmap, backlog.

## Exit criteria

- Every answer line has a source. Contested lines say whose account they are.
- No question template mentions a domain word in code.
- Dark mode first.
- No yellow on dark.
- Phone layout works.

## Sprint review (2026-10-17)

- **What worked:**
  - Questions as data. Four questions, one engine, no domain words in code: the founder's own questions ("who created and sponsored the Soviet Union", "who benefited") are pages and stories.
  - Two skeptical reviews per feature, one for acceptance and one for honesty, caught real problems before the founder saw them:
    - third-party words shown as an account's own;
    - borrowed proof badges;
    - "Who is behind" asked about families;
    - a private person under "Money in";
    - a region lettered with a living person's name.
  - Research packs with an independent verbatim verifier: about 40 new links, and nothing went in that the source did not say.
- **What felt wrong:**
  - The life line had become a puzzle on large entries (unlabelled dots, clipped labels).
  - The map opened on a tiny blob. Its alignment step had quietly shrunk it for weeks.
  - Long QA sweeps against the dev server crawl (live-reload connections); use a static build.
- **New ideas (moved to the backlog):**
  - fund shareholders owning the Vanguard funds (no honest relation yet);
  - a "did not happen as told" layer for historians' conclusions;
  - Vanguard's January 2026 realignment also affects its older holdings links;
  - EDTF open-start intervals.
- **Decisions (ADRs):**
  - ADR-0015: questions as data, with a column quoting only its own account (`voice`, `author` or `by`).
  - ADR-0013 was updated: the map keeps its orientation, never its scale.
- **Next sprint goal:** [Sprint 5](sprint-05.md), every MVP acceptance scenario holds.

