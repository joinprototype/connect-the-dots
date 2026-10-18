# Contributing to connect-the-dot

connect-the-dot is an open map of how people, organizations, places, events and ideas connect. Every line on it is a link backed by a source you can check, and readers can see whose account each link is. The whole site is built from plain text files in this repository, so you add to it with a pull request.

This guide covers the rules, setting up, worked examples copied from the repository, how to write a story that plays well, how to check your work, and a checklist for your pull request. The full reference for every field is [docs/content-model.md](docs/content-model.md).

## How it works

- **Fork, edit, open a pull request.** Content lives in `content/` as Markdown and YAML files. Add or change files on a branch of your fork, run the checks below, and open a pull request. You can also edit a file in GitHub's web editor and propose the change; the same check runs on your pull request. The web editor cannot run `fmt`, so new files arrive without a `uid` (the check only warns); a maintainer runs `fmt` before merging.
- **A pull request is a proposal.** Review comments are the discussion, a trusted reviewer's approval is the verification, and a merge means accepted ([ADR-0003](docs/decisions/0003-github-as-identity-and-discussion.md)). One approval is the default; family links and other sensitive links need two.
- **GitHub checks every pull request** with `ctd check` (see [Check your work](#check-your-work)). Builds and deploys run on a maintainer's machine ([ADR-0007](docs/decisions/0007-local-builds.md)).
- **Issues** are for questions, disputes and research requests.
- **Licenses** are not decided yet. [ADR-0011](docs/decisions/0011-repos-and-licenses.md) proposes CC0 for structured data and CC BY-SA 4.0 for prose and stories.

## The rules

1. **Every link has a source, with its exact words.** Copy a short `quote` from the source, word for word (at most 300 characters). For a long document, say where it is with `at`: a section, page or paragraph. If you cannot quote it, do not add it.
2. **Facts and accounts are kept apart** ([ADR-0005](docs/decisions/0005-attribution-and-evidence.md)).
   - A link with no `according_to` is shown as documented fact. It needs a primary record (tier T1), or scholarship or established press (T2).
   - An interpretation names whose account it is, with `according_to`: a cause, a belief, who gained or lost, what a text says. Readers then see "According to …".
3. **No labels on people.** Never call anyone corrupt, a fraud, a puppet or a mastermind: not in a link, a summary, prose or a story. Record what happened instead, with its source: charged, convicted, settled, sanctioned. No relation exists for these yet; until one does, a neutral `note` carries them.
4. **A connection is not evidence of wrongdoing.** Every route and answer page says so, and nothing you write may suggest otherwise. A shared board seat, school or shareholder is a documented fact, not a plot. Avoid words that insinuate, such as secretly, orchestrated, controlled or cabal.
5. **Family links need stronger proof.** `relative_of` is a sensitive relation. It needs one T1 record, or two independent T1/T2 sources: sources with different voices (a source's `voice`, or else its publisher). A family link that falls short is withheld from the site, and `ctd check` fails. Only public figures' kin belong here: parents and spouses, and siblings and in-laws who have public roles. Minors and private relatives stay out ([ADR-0016](docs/decisions/0016-who-a-person-is.md)).
6. **Where a person comes from is told in their own words** ([ADR-0016](docs/decisions/0016-who-a-person-is.md)).
   - Parents, upbringing and heritage go in `background:` lines on the person's own page, never in a link.
   - For a living person, only what they have said publicly themselves. For a historical figure, one T1 source or two independent T1/T2 sources.
   - Never infer heritage from a name, a face, a relative or a relative's faith.
   - Never group or count people by ethnicity: no link from a person to a group such as "Germans" for their origin.
7. **Keep allegations out of public titles.** Never put a sensitive allegation in a pull-request title or a commit message. Sensitive tips come in through a private channel: ask a maintainer.
8. **Neutral, plain English.** An entry's summary is one neutral line. No personal contact data: `ctd check` rejects emails and phone numbers in an entry's summary and prose, and reviewers check notes, background lines and stories. English only for now ([ADR-0012](docs/decisions/0012-english-only.md)).
9. **Open images only.** An image must be openly licensed or in the public domain (Wikimedia Commons, public-domain archives), with its license and author.

## Set up

You need Git, [Rust](https://rustup.rs) through rustup, and, to play stories, [Node.js](https://nodejs.org) 22.12 or newer. `rust-toolchain.toml` pins the Rust version, and rustup installs it the first time you run `cargo`.

From the root of your clone:

```sh
cargo run -q -- check          # validate all content (the first run compiles the engine)
npm --prefix web ci            # install the browser code's packages
npm --prefix web run build     # build the browser code; stories need it
cargo run -q -- serve          # the site on http://127.0.0.1:4321, rebuilt whenever you save
```

`ctd` is the engine, and `cargo run -q --` runs it. In this guide, `ctd check` means `cargo run -q -- check`.

- **Without `npm --prefix web run build`,** `serve` and `build` still succeed, but stories and maps do not play, and nothing warns you.
- **`npm ci` reports vulnerabilities in development packages.** It also warns about install scripts. Both are expected and do not affect the content checks.

| Command | What it does |
|---|---|
| `cargo run -q -- check` | Validates all content. Prints each problem, then a summary line, and exits with 1 when there are errors. |
| `cargo run -q -- check --base origin/main` | Also fails when an entry id that exists at `origin/main` is gone without an alias, because its URL would break. The pull-request check runs this against the branch you merge into. In a fork, add the main repository as `upstream` and use `--base upstream/main`. |
| `cargo run -q -- fmt` | Gives new files (entries, sources and stories) their permanent `uid`. |
| `cargo run -q -- serve` | The site with live reload; `--port` picks another port. |
| `cargo run -q -- path <from> <to>` | Prints the best routes between two entries, so you can see what a new link connects. |
| `cargo run -q -- build` | Builds the production site into `dist/` (maintainers). |
| `cargo run -q -- --help` | Lists every command. |

## Where things live

```text
content/
  entities/<type>/<xx>/<id>.md   one entry: a person, an organization, a place, an event, ...
  sources/<xx>/<id>.yaml         one source document
  chapters/<id>.md               one story
  schema/                        the vocabulary: entry types, relations, source tiers, lenses, questions
  featured.yaml                  editorial picks for the home page and the Stories shelf
```

- **Entry types** (`content/schema/entity-types.yaml`): `person`, `org`, `place`, `event`, `work` (texts, laws, films), `artifact` (technologies, objects), `concept`, `tradition` (religions, movements) and `group` (peoples, communities, families).
- **`<xx>`** is the first two letters or digits of the id: `content/entities/person/la/larry-fink.md`, `content/sources/bl/blackrock-10k-2025.yaml`, `content/entities/org/de/d-e-shaw.md`.
- **Ids** are lowercase letters, digits and single hyphens. An id equals its file name and is unique across all entries and sources. To tell two people apart, add a qualifier: `john-smith-economist-1950`.
- **A relation you need is missing?** The vocabulary lives in `content/schema/relations.yaml`. Propose the new relation in its own pull request, or open an issue.

**Words used in this guide.** An *entry* is anything with its own page. A *link* is one sourced statement from one entry to another; it is listed under `claims:` in the file of the entry that owns it. A source's *tier* says how strong it is:

- **T1**, primary record: filings, court records, official archives and publications, and the text itself for what a text says;
- **T2**, scholarship and established press;
- **T3**, self-published: only for what a subject says about itself;
- **T4**, known unreliable: rejected.

Readers never see the words claim, tier or T1. The site says "link", "proof" and "primary record".

## Recipes

Every example below is copied from the repository. The `uid:` line that `ctd fmt` adds is left out of each one: never copy a `uid`.

### 1. Add a source

Create `content/sources/<xx>/<id>.yaml`. This is `content/sources/bl/blackrock-10k-2025.yaml`:

```yaml
id: blackrock-10k-2025
title: "BlackRock, Inc. annual report for 2025 (Form 10-K)"
publisher: "blackrock"
published: 2026-02-25
url: https://www.sec.gov/Archives/edgar/data/2012383/000119312526071966/blk-20251231.htm
retrieved: 2026-10-17
tier: T1
voice: blackrock
```

| Field | Meaning |
|---|---|
| `id` | Equal to the file name. Most ids read publisher, date, subject: `wsj-2018-11-29-bogle-index-funds`. |
| `title` | The document's title. |
| `publisher` | An entry id (the source then links to that page), or a plain name such as `"Vanity Fair"`. |
| `author` | Optional: an entry id or a plain name. |
| `published` | The document's date. |
| `url` | Where to read it: an http(s) address. |
| `archive_url` | Optional: an archived copy, such as a web.archive.org address. |
| `retrieved` | The day you read it. |
| `tier` | `T1`, `T2` or `T3`. |
| `voice` | Whose words it carries: an entry id. It defaults to the publisher. |
| `note` | Optional: a short note about the source. |

**`voice` matters.** When a document is a person's own words (their letter, op-ed or memoir), set `voice` to that person. Their account can then quote it, and their background lines can cite it. John C. Bogle's op-ed in The Wall Street Journal (`content/sources/ws/wsj-2018-11-29-bogle-index-funds.yaml`):

```yaml
id: wsj-2018-11-29-bogle-index-funds
title: "Bogle Sounds a Warning on Index Funds"
publisher: "The Wall Street Journal"
author: "john-c-bogle"
published: 2018-11-29
url: https://www.wsj.com/articles/bogle-sounds-a-warning-on-index-funds-1543504551
archive_url: https://web.archive.org/web/20190105000141/https://www.wsj.com/articles/bogle-sounds-a-warning-on-index-funds-1543504551
retrieved: 2026-10-17
tier: T2
voice: john-c-bogle
```

Until a link or a story cites the source, `ctd check` warns: `source is not cited by any claim or story`.

### 2. Add a link to an entry

1. **Pick the relation** in [`content/schema/relations.yaml`](content/schema/relations.yaml). Its `from` and `to` say which entry types it joins, `temporal: true` means it takes a date (`when`), and `qualifiers` lists the extra fields it takes.
2. **Write it in the owner's file**, the `from` side: "founded" lives in the founder's file, "headquartered in" in the organization's. The other entry's page shows the reverse ("Founded by …") by itself, so never write a link twice.
3. **Give it the next free id** under `claims:` (`c5` after `c4`). Never reuse an id, not even one you deleted. If the file says `claims: []`, change it to `claims:` and start the list on the next line; links added below `claims: []` break the file.
4. **Cite the source**: `s` is the source id, `at` says where in the document, and `quote` is its exact words.

BlackRock's head office, from the annual report above (`content/entities/org/bl/blackrock.md`):

```yaml
  - id: c4
    rel: headquartered_in
    to: new-york-city
    src: [{s: blackrock-10k-2025, at: "Item 2. Properties", quote: "BlackRock's principal office, which is leased, is located at 50 Hudson Yards, New York, New York."}]
```

A dated link with a qualifier and two sources (`content/entities/person/la/larry-fink.md`):

```yaml
  - id: c6
    rel: educated_at
    to: ucla
    when: "1974"
    title: "BA, political science"
    src:
      - {s: blackrock-larry-fink, at: "biography", quote: "Mr. Fink earned an MBA from the University of California at Los Angeles (UCLA) in 1976 and a BA from UCLA in 1974."}
      - {s: ucla-newsroom-2016-03-11-fink-medal, at: "paragraph 2", quote: "Fink, who earned his bachelor’s degree in political science from UCLA and his M.B.A. from UCLA Anderson School of Management"}
```

| Field | Meaning |
|---|---|
| `id` | `c1`, `c2`, …: unique in the file, never reused. |
| `rel` | A relation from `relations.yaml`. |
| `to` | The other entry's id. |
| `when` | When it was true: a date or a span (see below). |
| `role`, `title`, `percent`, `shares`, `amount`, `currency`, `as_of` | Qualifiers, where the relation lists them. |
| `according_to` | Whose account it is (recipe 6). Leave it out for documented fact. |
| `src` | One or more `{s, at, quote}`. Add `by: <entry id>` when the quote is someone's own words reported by the source. |
| `status`, `reason` | `draft`, `disputed` or `deprecated`, with the reason (recipe 6). |
| `note` | A short neutral clarification, shown with the link: `note: "Current role as of October 2026; start date not recorded here."` |

**Dates** are written in EDTF. Put them in quotes.

| Write | For |
|---|---|
| `"1988"`, `"1988-06"`, `"1988-06-30"` | A year, a month, a day |
| `"1976/1988"` | A span |
| `"2008-10/.."` | A span that has not ended |
| `"1250~"`, `"1250?"` | Approximate, uncertain |
| `"-0449"` | 450 BCE (astronomical years: `"0000"` is 1 BCE) |

**YAML tips.** Put text in double quotes. Inside it, use curly quotes (“ ”), or write a straight one as `\"`. Indent with spaces, two per level, as the examples do.

### 3. Add a new entry

Create `content/entities/<type>/<xx>/<id>.md`: YAML between two `---` lines, then optional prose. A person (`content/entities/person/jo/jose-azar.md`):

```markdown
---
id: jose-azar
type: person
name: "José Azar"
aliases: ["Jose Azar"]
summary: "Economist at the University of Navarra and IESE Business School; co-author of a 2018 study of common ownership of US airlines."
claims:
  - id: c1
    rel: authored
    to: anticompetitive-effects-of-common-ownership
    when: "2014/2018"
    src:
      - {s: tecu-2021-antitrust-common-ownership, at: "Opening paragraph (PDF p. 1)", quote: "2014, JOSÉ AZAR, MARTIN SCHMALZ, AND I posted a working paper titled “Anti-Competitive Effects of Common Ownership” (AST)."}
      - {s: azar-schmalz-tecu-2018-jof, at: "Article header (title and authors)", quote: "Anticompetitive Effects of Common Ownership JOSÉ AZAR Search for more papers by this author MARTIN C. SCHMALZ Search for more papers by this author ISABEL TECU"}
---
```

A place needs `coords: [longitude, latitude]`, or it is left off the maps (`content/entities/place/ch/chicago.md`):

```markdown
---
id: chicago
type: place
name: "Chicago"
summary: "City in Illinois, United States."
coords: [-87.6298, 41.8781]
claims: []
---
```

An event, with its date, its place and some prose (`content/entities/event/fa/fall-of-the-berlin-wall.md`):

```markdown
---
id: fall-of-the-berlin-wall
type: event
name: Fall of the Berlin Wall
in_sentence: "the fall of the Berlin Wall"
aliases: [Opening of the Berlin Wall]
summary: The opening of the border between East and West Berlin on 9 November 1989.
when: 1989-11-09
place: berlin
claims:
  - id: c1
    rel: located_in
    to: berlin
    src: [{s: state-milestone-fall-of-communism, quote: "On November 9, 1989, thousands of jubilant Germans brought down the most visible symbol of division at the heart of Europe—the Berlin Wall."}]
  - id: c2
    rel: part_of
    to: end-of-the-cold-war
    src: [{s: state-milestone-fall-of-communism, quote: "But just as the Wall had come to represent the division of Europe, its fall came to represent the end of the Cold War."}]
---

On 9 November 1989 East Germany opened its borders and Berliners began tearing down the Wall. According to the [[us-government]], the momentum behind it came from [[mikhail-gorbachev]]'s decision to loosen Soviet control of Eastern Europe.
```

| Field | Meaning |
|---|---|
| `id`, `type`, `name` | Required. `type` must match the folder. |
| `aliases` | Other names, for search. An alias written as an id (`old-name`) also keeps that old URL working. |
| `summary` | One neutral line. |
| `when` | A person's life (`"1952-11-02/.."` while alive), an event's dates, an organization's years. |
| `place` | The id of its main place. |
| `coords` | Places: `[longitude, latitude]`. |
| `in_sentence` | The name inside a sentence, for question and route titles. It may only add "the" and lower the first letter. |
| `same_as` | The same entry elsewhere: `{wikidata: Q317521}`. |
| `image` | `{url, license, author}`: an openly licensed image. |
| `background` | People only (recipe 5). |
| `claims` | The entry's links. |

**Prose** below the front matter is neutral and sourced. Link other entries with `[[id]]` or `[[id|shown text]]`. A link to an entry that does not exist yet is shown as wanted, and `ctd check` warns.

**Renaming an entry:** change its `id` and its file name, and add the old id to `aliases`. Without the alias, the pull-request check fails: `` entry `old-id` was renamed to `new-id`: add `old-id` to its aliases, so /e/old-id/ keeps working ``. Everything that names the old id keeps working through the alias: links (`to:`), wikilinks, a source's `voice`, a quote's `by` and stories (`old-id#c4`). For links, `ctd check` warns until you update them to the new id.

**Removing an entry** breaks its URL. Instead, keep its id as an alias of the entry that replaces it; otherwise the pull-request check fails: `` entry `old-id` was removed: /e/old-id/ would break. Keep `old-id` as an alias of the entry that replaces it ``.

Then run `cargo run -q -- fmt` to give the new file its `uid`.

### 4. Add a family link

Mary Maxwell Gates, mother of Bill Gates (`content/entities/person/ma/mary-maxwell-gates.md`):

```yaml
  - id: c1
    rel: relative_of
    to: bill-gates
    role: mother
    src:
      - {s: gates-foundation-bill-gates, quote: "His late mother, Mary Gates, was a schoolteacher, University of Washington regent, and chair of United Way International."}
      - {s: historylink-7188-mary-maxwell-gates, quote: "His mother, Mary Gates, influenced him to become one of the highest-profile contributors to United Way and to start a gift-matching program at Microsoft."}
```

- **`role` describes the owner of the file.** Mary's file says `role: mother`: she is Bill's mother. Her page reads "Mother of Bill Gates", and his reads "Mary Maxwell Gates, mother". Write a tie once, in one of the two files. In Bill's file it would be `{rel: relative_of, to: mary-maxwell-gates, role: son}`.
- **No `when`.** A family link takes no date (`ctd check` warns that it is ignored). Put a marriage date in the `note`: `note: "Married on 25 August 1962."`
- **The sourcing rule.** The Gates Foundation page is a T1 record, which is enough on its own; HistoryLink (T2) adds a second voice. With neither one T1 nor two independent T1/T2 sources, `ctd check` fails with `` `relative_of` is sensitive: it needs one T1 record or two independent T1/T2 voices; withheld until sourced ``. Marked `status: draft`, the same link only warns, and it stays off the site until it is sourced.
- **Who.** Public figures' parents and spouses, and siblings and in-laws who have public roles. Never minors or private relatives. Two families connect only through what is documented: a marriage, money, a board seat, a school, a job.
- **Review.** A family link needs two approvals.

### 5. Add citizenship and background lines

**Citizenship** is a link, `citizen_of`, from a person to a place. It never carries a route: sharing a passport is not a connection. Larry Fink's (`content/entities/person/la/larry-fink.md`):

```yaml
  - id: c8
    rel: citizen_of
    to: united-states
    src:
      - {s: forbes-profile-larry-fink, at: "Personal Stats", quote: "Citizenship United States"}
```

Add `when` when a source dates it, such as a naturalization. Citizenship, birthplace (`born_in`) and education (`educated_at`) appear in the person's "Background" card.

**Background lines** say where a person comes from: their parents (by occupation, when the parents have no entry of their own), where they grew up, and their heritage. They sit in the person's front matter. Each is a short neutral `text` of at most 120 characters, with sources, and every source needs a quote. Two of Larry Fink's:

```yaml
background:
  - {text: "His mother taught English at Cal Northridge; his father owned a shoe store.", src: [{s: blackrock-2024-chairmans-letter, at: "opening section, “Time to rethink retirement”", quote: "My mom taught English at the local state college (Cal Northridge), and my dad owned a shoe store."}]}
  - {text: "He says he arrived on Wall Street as \"just an L.A. kid\".", src: [{s: vanity-fair-2010-04-fink, at: "section “Risky Business”", quote: "he was, he says, “just an L.A. kid” who showed up on Wall Street “with my turquoise jewelry and long hair.”", by: larry-fink}]}
```

- The first line cites his own letter, whose source file says `voice: larry-fink`.
- The second cites a magazine that quotes him, so the quote is marked `by: larry-fink`.

`ctd check` holds background lines to these rules:

- **People only.**
- **A living person** (whose `when` has an open end, or who has no `when`): only their own words, from a source in their voice or a quote `by` them. Otherwise: `background line 1: a living person's background is only what they have said themselves`.
- **A historical figure:** one T1 source or two independent T1/T2 sources. Otherwise: `background line 1: needs one T1 source or two independent T1/T2 voices`.
- **Every source quoted:** `background line 1: every source needs a quote of at most 300 characters`.
- **Plain text:** `background line 1: text must be 1 to 120 characters, without [, ] or |`. So no wikilinks in a background line.

Reviewers add the rest. A line is never inferred from a name, a face or a relative, and it is never a link, a group, a count or a filter. The lines show on the person's own page and nowhere else on the site.

### 6. Mark one side's account, or a dispute

**One side's account.** Add `according_to` with the entry ids of whoever says it: a government, a newspaper, a scholar, a tradition, a scripture or a person. The Seattle Times wrote that Mary Maxwell Gates "helped cement Microsoft's early connection with IBM". That is the paper's account, not established fact (`mary-maxwell-gates.md`):

```yaml
  - id: c3
    rel: influenced
    to: ibm-pc-dos-deal
    according_to: [the-seattle-times]
    note: "The obituary reports that IBM president John Opel, who sat with her on United Way's national board, called Microsoft the company 'run by Bill Gates, Mary Gates' son'. The IBM and Microsoft records cited here do not say her tie decided the deal."
    src:
      - {s: seattle-times-1994-06-10-mary-gates, quote: "Mrs. Gates also figured in her son's success. She helped cement Microsoft's early connection with IBM, which led to development of the IBM PC with DOS, an operating system supplied by Microsoft."}
```

**Quote that side's own words**: a source in its voice, or a quote marked `by` it. "Who benefited" (`benefited_from`) and "who was harmed" (`harmed_by`) are always someone's account. Fidel Castro's view of who gained from the end of the Cold War, from a CNN interview (`content/entities/place/un/united-states.md`):

```yaml
  - id: c3
    rel: benefited_from
    to: end-of-the-cold-war
    according_to: [fidel-castro]
    note: "Interview recorded for CNN's Cold War series in March 1998, translated from Spanish."
    src:
      - {s: cnn-1999-cold-war-castro-interview, at: "'On the end of the Cold War', 2nd paragraph", quote: "At the end of the Cold War, one superpower ceased to exist, and only one superpower remained, which had absolute hegemony. The bipolar world was transformed into a unipolar world, leaving the United States with enormous power.", by: fidel-castro}
```

- Without `according_to`, such a link fails: `` `benefited_from` is always someone's account: add `according_to` ``.
- An account with no quote is left off question pages. For the relations that answer a question (founded, leads, head of, CEO of, chair of, board member of, funded, invested in, owns a stake in, acquired, caused by, led to, benefited from, harmed by), `ctd check` warns: `an account with no quote is left off question pages`.
- **Never type a verdict.** When sources from opposing sides (`content/schema/perspectives.yaml`) back the same fact, the site shows "Both sides agree" by itself.

**A disputed link** stays in place, marked "Disputed", with its `reason` beside it. The Reagan Library's account of what ended the Cold War (`content/entities/event/en/end-of-the-cold-war.md`):

```yaml
  - id: c2
    rel: caused_by
    to: strategic-defense-initiative
    according_to: [reagan-library]
    status: disputed
    reason: "Pavel Podvig (Bulletin of the Atomic Scientists, 30 April 2013) argues from Soviet archival documents that SDI did not push the Soviet Union toward economic collapse; Serhii Plokhy calls the key American role in the Soviet demise a myth."
    src: [{s: reagan-library-sdi-exhibit, quote: "With SDI, President Reagan was able to unleash America’s entrepreneurial spirit. The project ultimately helped end the Cold War."}]
```

| `status` | Readers see |
|---|---|
| (none) | The link, published. |
| `draft` | "Being verified". |
| `disputed` | "Disputed", with the `reason`. |
| `deprecated` | "Withdrawn", with the `reason`. The link stays listed on the entry's page and never appears in a route or a story. |

To take a link back, mark it `deprecated` with a reason rather than deleting it, so readers can see that it was withdrawn and why.

### 7. Add a legal record

A charge, a conviction, an acquittal, a decision overturned on appeal, a settlement or a sanction ([ADR-0018](docs/decisions/0018-legal-records.md)). Write it in the file of the one the record is about, as a link to whoever decided: a court, a regulator or a government. The SEC's 2018 case against Elon Musk (`content/entities/person/el/elon-musk.md`):

```yaml
  - id: c16
    rel: charged_by
    to: sec
    when: "2018-09-27"
    case: "SEC v. Elon Musk"
    title: "securities fraud"
    src:
      - {s: sec-2018-09-27-musk-charged, quote: "charged Elon Musk, CEO and Chairman of Silicon Valley-based Tesla Inc., with securities fraud for a series of false and misleading tweets about a potential transaction to take Tesla private."}
  - id: c17
    rel: settled_with
    to: sec
    when: "2018-09-29"
    case: "SEC v. Elon Musk"
    title: "without admitting or denying the SEC’s allegations"
    amount: 20000000
    currency: USD
    src:
      - {s: sec-2018-09-29-musk-tesla-settle, quote: "Musk and Tesla have agreed to settle the charges against them without admitting or denying the SEC’s allegations."}
```

- **The relations:** `charged_by`, `convicted_by`, `acquitted_by`, `overturned_by`, `settled_with` and `sanctioned_by`.
- **`when` is required:** the day of that step. Without it, `ctd check` fails with `` `charged_by` is a legal record, so it needs the date of that step ``.
- **`case`** names the case as the record does. Steps with the same `case` sit together in the page's "Legal records" card, in date order, so a settlement or an appeal shows next to the charge.
- **`title`** is what the record calls it, in its words: the charge, or the terms ("without admitting or denying"). Never a word of your own about anyone.
- **The source** is the court's, regulator's or government's own record: a judgment, a complaint, an order, a press release or a sanctions list. Legal records are sensitive, so the rule of recipe 4 applies.
- **Every step.** A charge shown without its outcome misleads: when a case was settled, dismissed, decided or overturned, add that step too.
- **Review.** A legal record needs two approvals, as a family link does.

### 8. Write a story

A story (a chapter) is one file, `content/chapters/<id>.md`: front matter, an introduction, a `scene` block, and a closing paragraph. Here is the start of `content/chapters/who-owns-blackrock-and-vanguard.md`, its first and fourteenth scenes, and its last line:

````markdown
---
id: who-owns-blackrock-and-vanguard
type: chapter
title: Who Owns BlackRock and Vanguard?
subtitle: From a firm under Blackstone's umbrella and a fund company owned by its own funds to today’s holders, and the debate about their reach
summary: BlackRock began in 1988 under Blackstone and later had PNC, Merrill Lynch and Barclays as big shareholders; Vanguard is owned by its own funds. Who holds them now, and what each side says about their reach.
featured: true
---

BlackRock and Vanguard hold shares in most large American companies, for the people invested in their funds. This story follows who owned the two firms themselves, from 1974 and 1988 to today, then lets each side of a debate about their reach speak in its own words.

Every line drawn below is a sourced link, and every quote is the speaker's own words. A connection is not evidence of wrongdoing.

```scene
- shot: "open"
  view: "map"
  camera: {center: [-74.6, 40.35], zoom: 6.0, duration: 5}
  places: ["blackrock", "the-vanguard-group"]
  narration: "**Two firms.** BlackRock has its head office at 50 Hudson Yards in New York; Vanguard's is in Malvern, Pennsylvania. Through their funds, both hold shares in many of America's largest companies, for the people invested in those funds. So who owns the two firms themselves?"
  duration: 16

- shot: "blackrock-replies"
  view: "graph"
  lens: "all"
  focus: "blackrock"
  time: "2019-01-15"
  reveal: ["blackrock", "common-ownership-of-us-airlines"]
  reveal_claims: ["common-ownership-of-us-airlines#c1"]
  overlay: {kind: "quote", source: "blackrock-ftc-hearing-8-letter-2019-01-15", quote: "When the aforementioned erroneous assumptions are corrected, Analysis Group finds no statistically significant relationship between ‘common ownership’ and airline ticket prices.", caption: "BlackRock, letter to the U.S. Federal Trade Commission, 15 January 2019"}
  narration: "**2019: BlackRock replies.** In 2017 BlackRock called the evidence fragile. In a 2019 letter to the U.S. Federal Trade Commission it cited Analysis Group, a consultant it hired, which reported that with two of the study's assumptions changed, the link to fares lost statistical significance."
  duration: 16
```

Explore further: open [[blackrock]]'s page for its owners over time, or read "Who is behind BlackRock?" on its question page.
````

- **Front matter:** `title` and `subtitle` show on the story's cover and at its top, and `summary` is its description in link previews. `featured: true` puts the story first on the Stories shelf. `authors: [github:your-name]` adds "written by @your-name".
- **Prose** before the scene block is the introduction, and prose after it closes the story. Wikilinks work in both.
- **The scene block** is a YAML list of scenes ("shots"), in order. Readers scroll through them, or press Watch.

| Scene field | Meaning |
|---|---|
| `shot` | A short name; `#shot-<name>` at the end of the story's URL opens that scene. |
| `view` | `map` or `graph`. (`timeline` is drawn as the graph for now.) |
| `camera` | Map scenes: `{center: [longitude, latitude], zoom, pitch, bearing, globe, duration}`. The map is a globe unless `globe: false`; `duration` is the flight time in seconds. |
| `lens` | `all`, `power`, `money`, `ideas` or `history`. |
| `focus` | The entry the scene is about, drawn in the accent color. |
| `perspective` | An entry whose account the scene follows; other sides' accounts are dimmed. |
| `time` | The scene's date. The graph shows the world as of that date. |
| `reveal` | Entries that appear. |
| `reveal_claims` | Links that draw, as `<entry id>#<link id>`, such as `larry-fink#c4`. |
| `places` | Entries to mark on the map: places, or entries whose place has coordinates. |
| `routes` | Lines to draw on the map: `[[from-id, to-id], …]`. |
| `overlay` | A card. `{kind: quote, source, quote, caption}` is a quote card; `kind: source` shows the source as proof, with the quote highlighted; `kind: image` takes `image` (an address) and `caption`. A card without `quote` borrows the quote of a revealed link from the same source, or shows nothing. |
| `narration` | The scene's text, in Markdown. Listen reads it aloud. |
| `duration` | Seconds Watch stays on the scene (6 when left out). |
| `explore` | `true` shows "Explore from here", which opens the explorer at this scene. The BlackRock chapter's last scene sets it. |

`ctd check` makes sure that every entry, link and quote-card source a scene names exists, and that its lens, view and date are valid. A scene that reveals a link still withheld for lack of sources gets a warning.

## Writing a story that plays well

These lessons come from reviewing "Who owns BlackRock and Vanguard?" scene by scene, with Watch and Listen.

- **About 45 words or fewer per scene.** Set `duration` to the reading time: that chapter gives 45 words 16 seconds, and 34 words 12. With Listen on, Watch also waits for the voice to finish.
- **Open with a short bold title**, such as `**1974: Vanguard.**`. A scene's first sentence is its name on the scene dots, so end the title on a word, not on an abbreviation such as "U.S.".
- **Set a scene's `time` on or just after its events.** The scene shows that date, and the graph draws the world as of it: links that begin later are hidden, and ended ones fade. A bare year means 1 January, so `"1988"` is 1 January 1988. PNC sold its BlackRock shares in May 2020, and that scene uses `time: "2020-06"`.
- **One voice per scene, in its own words.** Each voice in a debate gets its own scene and its own quote card. The `caption` says who, where and when, with the source's date: `"BlackRock, letter to the U.S. Federal Trade Commission, 15 January 2019"`. When a news report carries the words, the caption says so: `"Stephen A. Schwarzman on Bloomberg Radio, reported by Bloomberg News, 30 September 2013"`.
- **A quote card shows the speaker's exact words only.** Copy them from the source. Never put a paraphrase, or a reporter's or scholar's summary, on a card as the speaker's words.
- **Name the subject instead of "it".** A scene is often heard on its own, or opened from its dot or a `#shot-` link. "In 2017 BlackRock called the evidence fragile" works; "It called the evidence fragile" does not.
- **Write "U.S.", not "US".** Listen reads the narration in the browser's voice, which can say "US" as the word "us".
- **The narration carries the point.** Listen reads the narration, not the quote card.
- **Give each side of a debate equal room:** a scene each, of about the same length, in date order. The BlackRock chapter gives seven voices a scene each, then closes on a study for the European Parliament that calls the question "still an open debate".
- **Every sentence rests on a source:** a link the scene reveals, or its quote card. When only one source carries a fact, say whose it is: "according to the book King of Capital".
- **Plain words.** Write "link", "proof" and "primary record", never claim, edge, tier or T1.
- **Play it before you open the pull request.** Run `cargo run -q -- serve`, open `http://127.0.0.1:4321/c/<id>/`, press **Watch** and turn on **Listen**. Try a phone-width window and dark mode too.

## Check your work

1. **`cargo run -q -- fmt`** gives new files a `uid` and says how many, such as `assigned 2 uids`. Never edit a `uid` or copy one into another file.
2. **`cargo run -q -- check`** ends with a summary such as `checked 338 entities, 642 claims, 411 sources, 4 chapters: 0 errors, 0 warnings`. Errors fail the pull-request check. Warnings do not, but read each one.
3. **`cargo run -q -- serve`** shows your change: an entry at `http://127.0.0.1:4321/e/<id>/`, a story at `/c/<id>/`.

Each message names the file and, in brackets, the link. Many add a hint. When many errors appear at once, fix the `invalid frontmatter` or id error first: an entry that fails to load breaks every link and story that names it, and messages are sorted by file, so the real cause can come last.

```text
error content/entities/person/la/larry-fink.md [c14]: source `blackrock-10k-2024` does not exist
      hint: create content/sources/bl/blackrock-10k-2024.yaml
```

Messages you are likely to meet:

| Message | What to do |
|---|---|
| `` source `blackrock-10k-2024` does not exist `` | Create the source file (the hint gives its path), or fix the `s:` id. |
| `` target `new-york-bank` does not exist `` | Create the entry, or fix the `to:` id. |
| `claim #16 has no id` | Add `id: c<n>` to the 16th link in the file. |
| `` unknown relation `sponsored` `` | Pick a relation from `content/schema/relations.yaml`. |
| `` `ceo_of` cannot point to a person (bill-gates) `` | The relation does not join these types; the hint lists the ones it allows. |
| `` `relative_of` is sensitive: it needs one T1 record or two independent T1/T2 voices; withheld until sourced `` | Add sources (recipe 4). |
| `` `benefited_from` is always someone's account: add `according_to` `` | Name whose account it is (recipe 6). |
| `` `charged_by` is a legal record, so it needs the date of that step `` | Add `when`, the day of that step (recipe 7). |
| `background line 1: a living person's background is only what they have said themselves` | Cite a source in their voice, or a quote marked `by` them (recipe 5). |
| `background line 1: needs one T1 source or two independent T1/T2 voices` | A historical figure needs stronger sources. |
| `quote is longer than 300 characters` | Quote only the words that prove the link. |
| `` id `jane-roe` does not match the file name `jane-doe.md` `` | Rename the file or fix the id. |
| `` when: month out of range in `1988-13` `` | Fix the date (see Dates in recipe 2). |
| `invalid frontmatter: error: line 7 column 8: mapping values are not allowed in this context` | The YAML is malformed, usually by indentation. The line is the file's line (a missing field is reported where its link starts). The wording varies ("did not find expected key", "missing field `rel`", "duplicate mapping key"). |
| `` shot `one`: claim `larry-fink#c99` does not exist `` | Fix the `reveal_claims` entry: `<entry id>#<link id>`. |
| `` uid `…` is also used by … `` | A `uid` was copied. The error can appear on either file: delete the `uid` line only in the file you created, never in the existing one, and run `fmt`. |
| `` entry `old-id` was renamed to `new-id`: add `old-id` to its aliases, so /e/old-id/ keeps working `` | Add the old id to `aliases` (recipe 3). |
| `2 entity files without a uid` (warning) | Run `cargo run -q -- fmt`. |
| `source is not cited by any claim or story` (warning) | Cite it, or remove it. |
| `[[blackrock-solutions]] has no page yet (wanted)` (warning) | Create the entry, or fix the wikilink. |
| `` qualifier `percent` is not expected for `founded` `` (warning) | Use only the qualifiers the relation lists. |
| `` unknown claim field `acording_to` `` (warning) | A misspelled field, ignored until you fix it. |
| `` unknown source field `qoute` `` (warning) | A misspelled key inside `src` (it takes `s`, `at`, `quote` and `by`); what it carries is ignored until you fix it. |
| `place has no coords, so it will not appear on maps` (warning) | Add `coords: [longitude, latitude]`. |
| `background line 1: every source needs a quote of at most 300 characters` | Add the source's exact words as `quote` (recipe 5). |
| `` background line 1: `by: x` is not an entry `` | `by` must be the id of an existing entry. |
| ``only people have `background` lines`` | Say it in the summary or prose, or as a sourced link. |
| `` entry `old-id` was removed: /e/old-id/ would break `` | Keep the old id as an alias of the entry that replaces it (recipe 3). |
| `` `relative_of` is not a temporal relation; `when` is ignored `` (warning) | Put the date in `note` (recipe 4). |
| `` dated 1950 but Jane Roe was born 1 May 1960 `` (warning) | Check the link's date against the person's life. |
| `` unknown field `summery` `` (warning) | A misspelled field in the front matter, ignored until you fix it. |
| `` shot `family`: claim `jane-roe#c1` is withheld until sourced `` (warning) | The story reveals a link that is not yet sourced well enough to show. |

What `ctd check` does not catch, and reviewers do:

- a quote that is not in the source, or a link with no quote at all;
- a fact that rests only on a T3 source;
- a narration sentence that its sources do not support;
- labels or insinuating words in a summary, a note, prose or a story;
- a story wikilink to an entry that does not exist (it shows as "No page yet", without a warning);
- misspelled scene or story front-matter fields, such as `narations:` or `subtitel:`;
- an image without its license or author;
- an account that quotes a source not in its own voice;
- the same tie written in both entries' files, or a reused link id;
- a file in the wrong `<xx>` folder.

## Pull-request checklist

- [ ] I ran `cargo run -q -- fmt` and `cargo run -q -- check`: 0 errors, and the warnings explained in the pull request.
- [ ] Every new link has a T1 or T2 source (T3 only for what a subject says about itself) and an exact `quote` that I checked against the document.
- [ ] Interpretations name whose account they are (`according_to`) and quote that account's own words.
- [ ] No labels on people, and nothing that suggests a connection is wrongdoing.
- [ ] Family links have one T1 or two independent T1/T2 sources, and name only public figures' kin: no minors, no private relatives.
- [ ] Background lines are on people only, in a living person's own words, and inferred from nothing.
- [ ] A renamed entry keeps its old id in `aliases`.
- [ ] Stories: about 45 words a scene, times on the events, quote cards in the speaker's exact words, played through with Watch and Listen.
- [ ] The pull request says whether I have any tie to the people or organizations in it, and its title and commit messages carry no sensitive allegation.
