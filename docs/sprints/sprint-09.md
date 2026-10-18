# Sprint 9: Who owns BlackRock and Vanguard?

- Starts: 2026-10-17 · Length: 1 week
- Status: **done** (2026-10-17). S9-01 to S9-06 are done and reviewed; the founder's requests that arrived during the sprint are listed under Also done.

## Goal

The first showcase chapter. A reader can watch and listen to "Who owns BlackRock and Vanguard?", from BlackRock's start inside Blackstone in 1988 and Vanguard's in 1974–76 to who holds them today. The chapter shows that index funds hold shares for their clients, and lets each side of the common-ownership debate speak in its own words.

## Why now

- BlackRock is one of the founder's test cases, and "who is behind it" is the mission.
- The graph already holds the base:
  - PNC's 22% until 2020 and the Kuwait Investment Authority's 5%;
  - the Vanguard funds owning Vanguard;
  - Vanguard's and BlackRock's holdings in Tesla, Microsoft and Amazon.
- What is missing is the backstory, and a story that ties it together.
- The roadmap's "Content depth" candidate asks for the first showcase chapter. Stories are what the founder responds to, and Listen (Sprint 8) now reads them aloud.

## Scope

### Must
- [x] **S9-01 BlackRock's backstory.** Every step is a sourced link:
  - Blackstone Financial Management inside Blackstone (1988), and the rename to BlackRock (`became`);
  - the split from Blackstone, and PNC's purchase (1995);
  - the 1999 listing;
  - Merrill Lynch Investment Managers (2006) and Barclays Global Investors with iShares (2009), each with the stake its seller received.
- [x] **S9-02 Vanguard's backstory.** John C. Bogle at Wellington Management, Vanguard's founding (1974–75), the first index fund for individual investors (1976), and the mutual structure. All sourced, with Bogle's own words where they exist.
- [x] **S9-03 The debate, in its own words.** What academics found about common ownership, and what the index firms reply. Each is an account that quotes only its own words (ADR-0015), and nothing is stated as fact.
- [x] **S9-04 The chapter** `who-owns-blackrock-and-vanguard`:
  - about 10 scenes with a map and the graph, with quotes as overlays;
  - it reads well aloud;
  - it is featured on the Stories shelf.
  - Done (2026-10-17). Research ran in three strands, each followed by an independent verifier who re-fetched every quote; all links and quotes were verified.
    - **BlackRock:**
      - Blackstone Financial Management (1988): Blackstone took 50% for a $5 million credit line, according to the book King of Capital as reported by Bloomberg;
      - the rename (1992), PNC's purchase ($240 million, February 1995) and its 70% after the 1999 listing;
      - Merrill Lynch at 49.3% (2006–2011) and Barclays at 19.8% (2009–2012), with their exits sourced to BlackRock's own filings.
    - **Vanguard:** Bogle at Wellington (1951–1974), Vanguard's incorporation (24 September 1974), the 500 Index Fund (31 August 1976), and the fund's 14% of Vanguard's capital.
    - **Vanguard's 2026 filings:** after an internal realignment on 12 January 2026, The Vanguard Group reports 0 shares, and Vanguard Capital Management reports the funds' holdings (Tesla 5.61%, Microsoft 7.48%, Amazon 6.77%). The older figures keep a note saying what replaced them.
  - **The debate is told in the chapter, not as links.** The academics' finding fits the "harmed by" relation, but the firms' rebuttal fits none, so a question page would have shown only one side. Each voice gets its own scene, in date order:
    - Elhauge (2016);
    - the Big Three study (2017);
    - the airline study (2018);
    - Bogle's warning (2018);
    - BlackRock's reply (2019);
    - Vanguard's reply (2021);
    - Tecu on later work (2021).

    It closes with the European Parliament study: "still an open debate".
  - **Review** (a sentence-by-sentence fact check and a played-through experience check). All findings are fixed:
    - **Facts:**
      - "the largest holders" left out BlackRock's own funds (6.17%); it now reads "among the largest holders".
      - Bogle's warning was overstated: he wrote that the Big Three "might own 30% or more", not "most".
      - BlackRock's re-analysis is now said to be by a consultant BlackRock hired, and to depend on two changed assumptions.
      - "Not the same as owning" was one side's framing. The scene, and the holders note on entry pages, now say who gets the gains and losses, and that the firms vote the shares.
      - The 1994 agreement and the 1995 purchase are told as one sale, and the 2011 and 2012 exits gained their sources.
    - **Experience:**
      - On phones every graph collapsed into unlabeled dots, because framing reserved the widest name as margin; the story graph is reworked (see Also done).
      - Scene times now sit on the event dates.
      - Narrations are about 45 words or fewer, and Watch durations follow the reading time.

- [x] **S9-06 Who a person is** (founder, 2026-10-17; [ADR-0016](../decisions/0016-who-a-person-is.md)). A "Background" card on person pages:
  - born (date and place), citizenship (`citizen_of`), education;
  - `background:` lines on parents, upbringing and heritage, in the person's own words (historical figures from scholarship).
  - Heritage is never a link, group, count, filter, map layer or route.
  - Research packs: Larry Fink's family and career, Sam Altman's path (Loopt, Y Combinator, OpenAI), the Nazarbayev family, and citizenship for key figures.
  - Engine done (2026-10-17):
    - `background:` on people, checked by `ctd check`: a living person's own words; one T1 or two independent T1/T2 for historical figures; a quote on every source.
    - `citizen_of` (never a route), and `background: true` on born in, citizen of and educated at.
    - The card, with footnotes.
    - Tests prove the lines reach no other file.
  - Content (2026-10-17), every pack verified quote by quote:
    - **Larry Fink:** UCLA (BA 1974, MBA 1976); First Boston, 1976–1988, with Vanity Fair's account of the 1986 loss and his own; his wife Lori Fink, co-donor of the 2008 UCLA gift; co-founders Rob Kapito and Susan Wagner; roles at the World Economic Forum, NYU Langone, MoMA and Trump's 2016 business forum. His background in his own words: his mother taught English and his father owned a shoe store.
    - **Sam Altman:**
      - Stanford, which he left in 2005, and Loopt, in Y Combinator's first batch and sold to Green Dot for $43.4 million in 2012;
      - Y Combinator's four founders, then Altman as part-time partner (2011) and president (2014–2019);
      - OpenAI: co-chair at its launch in 2015, then CEO (to 17 November 2023, and again from 29 November 2023);
      - his brothers Jack and Max, who have public roles;
      - in his own words, that he grew up in St. Louis and that he is Jewish.
    - **Citizenship:** Musk (United States since 2002, Canada), Thiel (United States, Germany, New Zealand since 2011), Brin, Bezos, Zuckerberg and Gates.
    - **Own-words background:** Musk, Brin, Bezos, Zuckerberg and Gates. For Bogle and Lenin, filings and scholarship.
    - **The Nazarbayev family** (founder's request). Each kin tie meets the kinship rule; T1 sources include his office's family page, his official biography and Halyk Bank's own reports.
      - **Kin ties:** his wife Sara (founder of the Bobek children's fund); his daughters Dariga, Dinara and Aliya; Dinara's husband Timur Kulibayev; Dariga's former husband Rakhat Aliyev; and his grandson Nurali Aliyev.
      - **Their roles:**
        - Nazarbayev: president (1990 to 19 March 2019), and chair of the Security Council and of Nur Otan until January 2022;
        - Dariga: Senate chair (2019–2020), and member of the Mazhilis (2021–2022);
        - Kulibayev: Atameken (2013–2022), Samruk-Kazyna (2008–2011) and KazMunayGas (2002–2005);
        - Halyk Bank: Holding Group ALMEX holds 62.4%, and the bank names Timur Kulibayev and Dinara Kulibayeva as its ultimate controlling parties;
        - Nurali Aliyev: deputy mayor of Astana (2014–2016).
      - **His background,** in his office's words: born in 1940 in Chemolgan (now Shamalgan), "a son, grandson and great-grandson of shepherds".
      - **Court matters** (such as the 2020 London High Court ruling on the unexplained wealth orders) live in neutral notes until there is a relation for them.

### Should
- [x] **S9-05** Links that point at an entry read as sentences in its story, without a plural inverse after a comma ("GameStop, *stakeholders* Ryan Cohen"). This is a Sprint 8 backlog item.
  - Done (2026-10-17). `inverse_reads` in `relations.yaml` (`verb`, or `list` for a plural that names the others) replaces Sprint 8's `inverse_verb`.
  - Lists take a colon: "Google, *investors*: Ram Shriram and Stanford University." Other inverses still follow a comma: "Islam, *patriarch* Abraham."

### Also done
- **Story graph names never overlap** (2026-10-17). Before, the names in a story's graph were drawn where they fell, so Belarus and Ukraine collided in the Soviet Union story.
  - Story graphs now use the explorer's label placement, one shared helper (`drawPlacedLabels`): right of the dot, else left, above or below. A name that fits nowhere whole is left out; the narration still names it.
  - On phones the graph is framed above the quote card, measured from where the card really sits (above the controls). Before, two of the four founders were under the card.
  - The explorer's hover card now keeps other names off its second line too ("Organization · 1911 –").

- **Life stories play by year** (founder: "a lot of founder, chair, founder … combine those little islands"). A year with several links is one scene: one paragraph per date, and links of one kind and date share a sentence. "Google, *founded by* Larry Page and Sergey Brin." "Google, *board members*: Larry Page, Ram Shriram and Sergey Brin." The Google story went from 16 scenes to 6.
- **Question stories are dated.** Each line leads with its date, and like links share a sentence: "*May 1999:* Google, *board members*: John Doerr and Michael Moritz." Repeated names ("Eric Schmidt, chair") now read as separate tenures.
- **The explorer's time slider spans the focus's years** (founder: "Nazarbayev doesn't need to start from 3000 BC"). These are the entry's own dates and its links' dates, with a little room on each side: Gorbachev 1926–2026, Larry Fink 1948–2026. Without a focus it spans all the data, as before.

- **Story graphs reworked** after the chapter review:
  - the camera frames the scene's own entries;
  - what a scene reveals is never faded by its date;
  - names stay clear of the time pills, the quote card and the controls;
  - the focus card moves left of its dot, or below it, when it would run off the screen;
  - link labels are short, and only for scenes that add three links or fewer.
- **Checks:** `ctd check` counts chapter quote cards as citations, and a quote card's source must exist.
- **Life stories open with where a person comes from.** Undated birthplace and citizenship links are said in the first scene, not as one-line scenes at the end. Sam Altman's story opens: "Born in Chicago. Citizen of the United States." His story then runs Stanford, Loopt, Y Combinator part-time partner (2011), Green Dot, Y Combinator president (2014, with Paul Graham's announcement as the quote card) and OpenAI.

- **Contributor guide** (founder, 2026-10-17: "a readme and guideline on how to create such stuff"). This adds:
  - `CONTRIBUTING.md`: the rules, set-up, seven worked recipes copied from real files (source, link, new entry, family link, citizenship and background lines, accounts and disputes, a story), "Writing a story that plays well", the `ctd check` messages and what they mean, and a pull-request checklist;
  - a pull-request template;
  - a GitHub check that runs `ctd check --base` on pull requests.
  - **Tested:** a second agent followed the guide word for word in a scratch copy (a source, a link, a person with a family link, citizenship, a background line, a three-scene story) and tried 63 deliberate mistakes. The 19 gaps it found are fixed in the text.
  - **Engine follow-ups** it found:
    - misspelled keys inside `src` are silently ignored;
    - a renamed entry's id is not resolved in `voice`, `by` and story links;
    - YAML line numbers count from the front matter;
    - `fmt` does nothing on Windows (CRLF) files.

- **QA no longer overloads the laptop** (founder, 2026-10-17). The load average had reached 47.
  - **Cause:** 24 headless Chromes left behind by QA runs that were interrupted or timed out, some 16 hours old, about 200 MB each. One from the Sprint 8 review harness had kept a software-WebGL page drawing for three hours.
  - **Fix:** `tools/qa/chrome.mjs` now starts the QA tools' one headless Chrome. It kills that Chrome when the run ends, is interrupted or crashes, and it first stops our own Chromes over an hour old. `sweep.mjs` and `cdp.mjs` share it (about 15 lines of duplicated set-up removed). Tested: a killed sweep leaves no Chrome behind.
  - The load fell to about 6.
  - The contrast audit's review was stopped. Its fixes had already passed the full sweep.

- **Engine refactor** (founder: "refactor and simplify"). A scout listed 25 candidates, a skeptic kept 16, and they were applied one by one. Each was proven by tests, clippy, and a site build compared file by file with the one before (identical apart from build times). The engine went from 8,116 to 8,025 lines.
  - **What changed:**
    - duplicate helpers merged (cover randomness and escaping, the "other end" of a link, coords, story reveal lists, the life-line axis shared with "Over time");
    - dead fields dropped;
    - `ctd fmt` and `ctd check` share one file walker;
    - the route-length cap is read from `paths.yaml`;
    - `_redirects` comes out in a stable order, so builds are now byte-for-byte reproducible.
  - **The engine no longer names types, tiers or relations:**
    - stakes are relations whose qualifiers include `percent`;
    - the sourcing rule reads `primary` and `strong` flags in `source-tiers.yaml`;
    - life-line labels come from `span` in `entity-types.yaml`;
    - map behaviour comes from `map: true` there.
  - **Dropped as not worth it:** splitting the two long build functions (code motion, medium risk) and a few other code-motion ideas.
- **Contributor guardrails** (from the guide test):
  - a renamed entry's old id now works everywhere through its alias: in a source's `voice`, a quote's `by` and stories, which are rewritten to the current id for the page;
  - a misspelled key inside `src` warns (`unknown source field `qoute``);
  - front-matter errors give the file's line numbers;
  - `fmt` handles Windows line endings;
  - the missing-source hint asks for the quote.
  - Four new tests; 60 in all.

### Not in this sprint
- A 13F holdings dataset (a separate content-depth item).
- The State Street side of "the Big Three", except where a source names all three.

## Demo script

1. Stories → "Who owns BlackRock and Vanguard?": Watch with Listen. It goes from 1988 to today, scene by scene.
2. The ownership scene: the Vanguard funds own Vanguard, and Vanguard and BlackRock hold shares in BlackRock for their clients.
3. The debate scene: two accounts side by side, each in its own words.
4. "Who is behind BlackRock?" now includes what was recorded about Blackstone Financial Management.

## Exit criteria

- Every new link has a source with a verbatim quote, checked by an independent verifier.
- 0 console errors and 0 CSP violations; no yellow on dark; phone layout works.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 60/60, clippy clean, web typecheck and build, `ctd check` 0 errors and 0 warnings (338 entries, 642 links, 411 sources)
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 695 pages, 0 problems (2026-10-17, dark, 390x844). The new contrast check read 54,093 texts: 0 below the WCAG ratio, and 336 unverifiable (canvas, image or gradient behind).
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-09/`: 36 screenshots (dark and light, desktop and phone) of the chapter and two of its scenes, "Who is behind BlackRock?", Larry Fink, Sam Altman's story, Nursultan Nazarbayev, the Google story and the Stories shelf. No console errors.
- [x] Docs and ADRs updated:
  - ADR-0016 (who a person is);
  - content model: background lines, `citizen_of`, `noun` and `inverse_reads`, `span` and `map` on types, `primary` and `strong` on tiers;
  - data contract: the graph view's rules and the `background` context;
  - `CONTRIBUTING.md`, with a pull-request template and a GitHub check;
  - the README;
  - CLAUDE.md: the heritage rule and QA browsers.
- [x] Known issues listed

## Known issues

- **Two links have no relation.** The firms' rebuttal in the common-ownership debate is told only in the chapter, because nothing can say "disputes a finding". Court and sanctions records live in notes. Both are in the backlog.
- **Open-start dates** ("until 5 January 2022") still parse as one day. Five links keep the date in a note, and Tesla's holders card shows The Vanguard Group's pre-2026 stake next to Vanguard Capital Management's, each with its own "as of".
- **Long names can go unlabelled in a crowded scene.** A name that fits nowhere whole is left out, as PNC is in the chapter's 1995 scene on a phone. The narration names it.
- **The contrast audit's own review was stopped** to spare the laptop. Its fixes passed the full sweep (0 low-contrast texts in 54,093), and it will re-run one browser at a time.
- **The repository on GitHub was renamed** to `joinprototype/connect-the-dots`. Pushes follow GitHub's redirect; the local remote still names the old path.

## Review

- **What worked:**
  - Research in strands, each followed by an independent verbatim verifier, in about a dozen runs. Every link and quote in the chapter, the people packs and the Nazarbayev pack was re-fetched and checked word for word.
  - A sentence-by-sentence fact check of the chapter caught two real errors (the "largest holders", Bogle's 30%) and three framing problems before anyone read it.
  - A second agent followed the contributor guide word for word on a throwaway copy, and its 19 gaps and four engine problems were fixed.
  - The refactor was proven by builds that are identical file by file.
- **What felt wrong:**
  - Headless Chrome left behind by interrupted runs overloaded the founder's laptop (load 47). QA now runs one browser at a time through one self-cleaning launcher.
  - Every agent ran on the top model, even for plain web lookups. Models are now matched to the task.
- **New ideas (moved to the backlog):** a relation for disputing a finding; relations for court and sanctions records; proper open-start dates; Listen reading the quote cards; a scale plan (neighbourhood shards, sharded search, R2 pages) before bulk imports.
- **Decisions (ADRs):** ADR-0016, who a person is: citizenship as a link, and background and heritage only as sourced lines on the person's own page, never a connector.
- **Next sprint goal:** proposed in [roadmap.md](../roadmap.md): scale (neighbourhood shards and sharded search), so the explorer and stories stay small at a million entries, before any bulk import.
