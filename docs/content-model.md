# Content model (v0)

> Draft for Sprint 1. The format will change as we learn; each change gets an ADR and an update here. The engine knows only the generic concepts below. All domain vocabulary lives in `content/schema/`.

## Terms

| Term | Meaning |
|---|---|
| Entity | Anything with its own page: person, org, place, event, work, artifact, concept, tradition, group. One file each. |
| Claim | A sourced statement linking an entity to another (`rel` + `to`), with optional time, qualifiers and attribution. It lives in the file of the entity that owns it. |
| Source | A document backing claims: a filing, archive record, book, article or scripture edition. One file each. |
| Voice | Whose perspective a source speaks for (e.g. `us-government`). Used to compute cross-perspective confirmation. |
| Attribution | `according_to` on a claim. The claim is shown as "according to X", not as established fact. |
| Layer | A family of relations: people, power, money, tech, history, ideas, places. |
| Lens | A named way of looking: which layers to show and the default view (graph, timeline or map). |
| Methodology | Public parameters for path ranking, hub handling and layout, changed by PR. |
| Chapter | An interactive story: markdown prose plus `scene` blocks of shots. |

## Repository layout

```
content/
  schema/        entity-types.yaml  relations.yaml  layers.yaml  lenses.yaml  source-tiers.yaml  perspectives.yaml  questions.yaml
  methodology/   paths.yaml
  entities/<type>/<xx>/<id>.md      # <xx> = first two characters of <id>
  sources/<xx>/<id>.yaml
  chapters/<id>.md
  featured.yaml                     # editorial picks: featured connections, home-shelf lives, question pages (see below)
  datasets/manifest.yaml            # (planned) bulk data lives in R2; only hashes here
```

Directories hold at most ~2,500 entries, against GitHub's 3,000 guideline. `ctd check` warns at that size.

## IDs and URLs

- **`id`:** a lowercase slug `[a-z0-9-]+`, equal to the file name and unique across all entities and sources. Disambiguate with a qualifier, e.g. `john-smith-economist-1950`.
- **`uid`:** a ULID assigned once by `ctd fmt`. It never changes and survives renames; history, v2 votes and external links rely on it.
- **Renames:** change `id` and the file name, then add the old id to `aliases`. The build writes a redirect for every slug alias. `ctd check --base <git ref>` (e.g. `origin/main` in a pull request) fails when an id that existed at the ref is neither an entry nor an alias now, and says whether it was renamed (same `uid`) or removed. Without the alias, the old URL breaks.
- **Claim reference:** `<entity-id>#<claim-id>`, e.g. `elon-musk#c2`.
- **URLs:**
  - `/e/<id>/`: entity page; `/e/<id>/story/`: its generated life story;
  - `/c/<id>/`: chapter; `/c/`: the Stories library;
  - `/p/<a>--<b>/`: the generated story of a featured connection;
  - `/q/<question>/<id>/`: the answer to a question about an entry ("Who is behind Meta Platforms?"), `/q/<question>/<id>/story/` its story, `/q/<question>/` the question's index;
  - `/x/?focus=<id>&lens=<lens>&p=<perspective>&t=<date>&from=<id>&to=<id>&view=world`: explorer;
  - `/w/`: the world map.
- **Wikilinks in prose:** `[[spacex]]` or `[[spacex|SpaceX]]`, resolved by id or alias. An unknown target becomes a "wanted" page (a red link).
- **Other links in prose:** a link may point to a relative path, a `#` anchor, an http(s) address or `mailto:`. Any other target (`javascript:`, `data:` and the like) is shown as plain text, and raw HTML is shown as text. Content arrives as public pull requests.

## Dates (EDTF, Level 1 subset)

| Form | Examples |
|---|---|
| Year, month, day | `1962`, `1962-10`, `1962-10-16` |
| Interval | `1962-10-16/1962-10-28` |
| Open end | `2008-10/..` |
| Open start: only the end is known | `../2009-12-01` reads "until 1 Dec 2009" and holds at any time before then |
| Approximate / uncertain | `1250~` / `1250?` |
| BCE | Negative years in astronomical numbering: `0000` = 1 BCE, `-0449` = 450 BCE |

- BCE years are always displayed as "450 BCE", never as a negative number.
- Traditional dating and scholarly dating are two claims with different `according_to`.

## Entity file

```markdown
---
uid: 01JB8Z3K9Q7C2V5M4N6P8R0S1T      # filled by ctd fmt
id: elon-musk
type: person                         # schema/entity-types.yaml
name: Elon Musk
in_sentence: …                       # optional: the name inside a sentence (see below)
aliases: [Elon Reeve Musk]
summary: Entrepreneur; CEO of Tesla and SpaceX.   # one neutral line
when: 1971-06-28/..                  # lifespan for people; extent for events and orgs
place: pretoria                      # optional primary place
same_as: {wikidata: Q317521}
image:                               # optional; url must be http(s); the ingest bot adds sha256
  url: https://upload.wikimedia.org/...
  license: CC BY-SA 4.0
  author: ...
background:                          # people only: where they come from (ADR-0016)
  - text: Grew up in Pretoria        # a short neutral line; the quote says the rest
    src: [{s: musk-interview-2017, quote: "…", by: elon-musk}]
claims:
  - id: c1
    rel: founded
    to: spacex
    when: 2002
    src: [{s: spacex-company-history}]
  - id: c2
    rel: ceo_of
    to: tesla
    when: 2008-10/..
    src: [{s: tesla-10k-2025}]
---

Neutral, sourced prose about the subject, with links such as [[spacex]] and [[tesla]].
```

**`background`** (optional, people only): lines about where a person comes from: their parents (by occupation, when the parents have no entry), where they grew up, their heritage ([ADR-0016](decisions/0016-who-a-person-is.md)).
- **Living people:** only their own words. That means a source in their voice, or a quote marked `by` them.
- **Historical figures:** one T1 source or two independent T1/T2 voices.
- **Quotes:** every source needs one. A line is at most 120 characters.
- **Where it shows:** the person's "Background" card, with the links whose relation has `background: true` (born in, citizen of, educated at). It is never a link, and never in `graph.json`, `search.json`, stories or answers. A line that falls short is an error and is not shown.

**`in_sentence`** (optional): the name as it reads inside a sentence, for question and route titles: `the dissolution of the Soviet Union` makes "Why did the dissolution of the Soviet Union happen?". It may only add a leading "the" and lower the first letter; any other difference is an error.

## Claim fields

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Unique within the file and never reused. Write the next `c<n>` by hand; `ctd fmt` fills only `uid`s. |
| `rel` | yes | A relation from `schema/relations.yaml`. |
| `to` | yes | Target entity id. A list only where the relation allows it, e.g. event participants. |
| `when` | no | Valid time (EDTF). |
| qualifiers | no | As allowed per relation: `role`, `title`, `percent`, `shares`, `amount`, `currency`, `as_of`. On a family relation, `role` describes this file's entity (see "Family roles"). |
| `according_to` | no | Entity ids of whoever asserts this: a government, school, tradition, scripture or person. If absent, the claim is presented as documented fact. |
| `src` | yes | One or more `{s: <source-id>, at: <locator>, quote: <≤300 chars>}`. Add `by: <entity-id>` when the quote is someone's own words reported by the source (a speaker quoted in a news story): an account column then quotes them as their words. |
| `status` | no | `draft`, `disputed` or `deprecated`; published is the default, and an open PR is "proposed". See "Status". |
| `reason` | no | Why the claim is disputed or deprecated. Pages and stories show it with the status. |
| `note` | no | A short neutral clarification, shown with the link and in stories. |

**Which file owns a claim.** The relation's `owner` side in the schema decides, usually the subject: `founded` lives in the founder's file. The engine builds the reverse view, so `spacex.md` shows "Founded by Elon Musk" without repeating it. Facts with many participants live in an event entity.

**Family roles.** On a relation with `kinship: true` (today `relative_of`), `role` describes the claim's owner, the entity whose file holds it. `mary-maxwell-gates.md` holds `{rel: relative_of, to: bill-gates, role: mother}`: Mary is Bill's mother. Her page reads "Mother of Bill Gates", his reads "Mary Maxwell Gates · mother", and stories read "Mary Maxwell Gates, mother of Bill Gates". Written in Bill's file, the same tie would be `{rel: relative_of, to: mary-maxwell-gates, role: son}`.

**Status.** What readers see:
- `draft`: "Being verified". Routes still use it, at reduced strength.
- `disputed`: "Disputed", with the `reason`. Stories and life lines say "disputed" too.
- `deprecated`: "Withdrawn", with the `reason`. The link stays listed and marked on the entry's page, and never reaches a route, story, life line or family card.

## Source file

```yaml
uid: 01JB8ZA1RX6Q0M3T2W9Y5N8K7D
id: jfk-address-1962-10-22
title: Address on the Soviet arms buildup in Cuba
publisher: us-government          # entity id
author: john-f-kennedy
published: 1962-10-22
url: https://www.jfklibrary.org/...        # http(s) only
archive_url: https://web.archive.org/...   # http(s) only; filled by the archive bot (planned)
sha256: ...                                # filled by the archive bot (planned)
retrieved: 2026-10-16
tier: T1                          # schema/source-tiers.yaml
voice: us-government              # defaults to publisher
```

Source tiers:
- **T1:** primary record (filings, court records, official archives; the scripture text itself, for "the text says" claims).
- **T2:** scholarship and established press.
- **T3:** self-published, allowed only for a subject's statements about itself.
- **T4:** deprecated; rejected by `ctd check`.

## Attribution, evidence and confirmation

- **No `according_to`:** shown as fact. Needs at least one T1/T2 source.
- **Sensitive relations** (`sensitive: true`) need two independent T1/T2 voices or one T1 record. A claim that falls short stays in its file but is withheld from the site (no page row, story, family card, `graph.json` link, world tile or route) until it is sourced. `ctd check` warns for a draft and fails otherwise.
- **`according_to: [x]`:** shown as "According to X, …". Used for narratives, beliefs, interpretations, contested causes, and what a text says. Relations marked `attributed: true` (who benefited, who was harmed) always need it.
- **Confirmation is computed, never typed in:**
  - the build counts the distinct source voices behind each claim;
  - when the voices come from two members of a contested set in `schema/perspectives.yaml` (e.g. `[us-government, soviet-government]`), an unattributed, non-draft claim gets the "confirmed by opposing sides" badge.
- **Narrative diff:** the claims attributed to perspective A but not B, and the reverse.
- **No evaluative labels on people.** Record events through sensitive relations, with sources: convicted, charged, settled, sanctioned.
- **Legal records** ([ADR-0018](decisions/0018-legal-records.md)): `charged_by`, `convicted_by`, `acquitted_by`, `overturned_by`, `charge_dismissed_by`, `settled_with` and `sanctioned_by` run from the one a record is about to whoever decided. Each is dated (`when` is required), sensitive, and never a route step. `title` says what the record calls it ("securities fraud", "without admitting or denying the allegations"); `case` names the case as the record does, and the steps of one case sit together on the page, in date order. The person's or company's page gathers them in a "Legal records" card, with each relation's `caveat` ("A charge is an accusation, not a finding of guilt.").
- **Disputing a finding** ([ADR-0019](decisions/0019-disputing-a-finding.md)): a `work` may carry a `finding`, one citation quoting what it found. `disputes_finding` runs from whoever disputes (a person, an organization or a work) to that work. It is always its owner's account (`according_to: [<owner>]`), quoted in the owner's words, and never a route step. The study's page and the disputer's page show it in a "The debate" card, by date, and nothing decides between the sides. A question group with `via` brings disputes to a question: `{label: Disputes the finding, via: [appears_in], in: [disputes_finding]}` reads the works X appears in, so each disputer gets its own column on X's page, and each line names the study.

## Schema files

`relations.yaml`:

```yaml
founded:
  label: founded
  inverse: founded by
  from: [person, org, group]
  to: [org, tradition, artifact, work, concept, group]
  owner: from                 # the claim lives in the "from" entity's file
  layers: [people, power]
  temporal: true
  qualifiers: [role]
  traversable: true           # routes may use it (the default)
  sensitive: false            # true = stricter sourcing; a claim short of it is withheld
  kinship: false              # true = a family relation, gathered into "Family ties"
  attributed: false           # true = an interpretation: `according_to` is required
  identity: false             # true = the same body under a new name (`became`): answers include earlier forms
  noun: false                 # true = the label is not a verb ("CEO of"): sentences put it after a comma
  inverse_reads: comma        # how the inverse joins a sentence: comma ("founded by"), verb ("includes") or list ("board members")
  legal: false                # true = a step of a legal case (ADR-0018): must be sensitive and not traversable; claims need `when`
  dispute: false              # true = one side saying a finding is not shown (ADR-0019): must be attributed; see below
  caveat: null                # a plain sentence shown with records of this relation
relative_of:
  {label: relative of, inverse: relative of, from: [person], to: [person], owner: from, layers: [people], qualifiers: [role], sensitive: true, kinship: true}
benefited_from:
  {label: benefited from, inverse: benefited, from: any, to: [event], owner: from, layers: [power, history], attributed: true, traversable: false}
holds_for_clients:
  label: holds shares for clients in
  inverse: shares held for clients by
  from: [org]
  to: [org]
  owner: from
  layers: [money]
  qualifiers: [percent, shares, as_of]
  traversable: true
  passive: true               # collapsed into "index funds" by default
```

The engine knows these flags, never relation names:
- `kinship` relations may only join entity types marked `family: true` in `entity-types.yaml` (today `person` and `group`). Their `role` describes the owner (`from`).
- `attributed` relations must also be `traversable: false`, so no route runs through one side's account.
- `became` (the same body under a new name or form: a party renamed, a company reorganised) lets a long-lived thing be two entries, each with honest dates. Routes treat it as a near-identity step (weight 1.0 in `paths.yaml`).
- `identity` relations (today `became`) make answers about the later form include the earlier one: the CPSU's "Who is behind" page lists what was recorded about the Bolsheviks, marked "as the Bolsheviks (until 8 Mar 1918)", up to three steps back. An identity relation is never `attributed`, and each claim joins two entries of the same type.

- `noun` and `inverse_reads` say how a label reads in a story's sentences, which Listen also reads aloud: "Ronald Wayne *founded* Apple", but "Mike Markkula, *CEO of* Apple" and "Apple, *founded by* Ronald Wayne" (titles, nouns and participles follow a comma, as family roles do). An inverse that is a verb reads as one ("The Cold War *includes* …"), and one that names a list takes a colon ("Apple, *board members*: Mike Markkula and Arthur Rock").

`ctd` refuses to load a schema that breaks the first two rules.

`entity-types.yaml`:

```yaml
person: {label: Person,       plural: People,        layer: people, family: true, span: Life}
org:    {label: Organization, plural: Organizations, layer: power, span: Active}
place:  {label: Place,        plural: Places,        layer: places, map: true}
```

`span` is what an entry's own dates are called on its life line ("Span" when unset). `map: true` marks types that are points on the map: such an entry needs `coords` (`ctd check` warns), and stories show it there.

`source-tiers.yaml` gives each tier a label and description, plus two flags the sourcing rules read: `primary: true` (one such source is enough for a sensitive link or a historical figure's background line) and `strong: true` (two independent voices of these are enough). `rejected: true` tiers fail `ctd check`.

`lenses.yaml`:

```yaml
- {id: all,     label: Everything,     view: graph,    layers: [people, power, money, tech, history, ideas, places]}
- {id: power,   label: People & power, view: graph,    layers: [people, power]}
- {id: money,   label: Money,          view: graph,    layers: [money]}
- {id: ideas,   label: Ideas & tech,   view: graph,    layers: [ideas, tech]}
- {id: history, label: History,        view: timeline, layers: [history, power]}
```

Keep the list short: five lenses is the design limit ([ux-vision.md](ux-vision.md)). Places are not a lens; the Map is its own place.

`questions.yaml` ([ADR-0015](decisions/0015-ask-anything.md)): the questions readers can ask, in Ask-picker order.

```yaml
banned_words: [mastermind, puppet, orchestrated, controlled, secretly, cabal, plot]
questions:
  - {id: connected, ask: "How are {a} and {b} connected?", route: true, shows: routes of sourced links, not: influence, intent or wrongdoing}
  - id: behind
    ask: "Who is behind {x}?"
    subjects: [org, place, artifact]   # bodies with founders, leaders and owners; never people, families, events or ideas
    shows: documented founders, leaders, board members, funders and owners
    not: who made decisions, or why
    groups:                        # in = links pointing at {x}; out = links {x} owns
      - {label: Founded by, in: [founded]}
      - {label: Money in,   in: [funded, invested_in]}
    min: 2                         # names a page needs; two or more accounts always earn one
  - id: benefited
    ask: "Who benefited from {x}?"
    subjects: [event]
    shows: who gained or lost, in the words of whoever says so
    not: that anyone caused it
    groups:
      - {label: Gained, in: [benefited_from], empty: "No account in our sources says who gained."}
      - {label: Lost,   in: [harmed_by],      empty: "No account in our sources says who lost."}
```

- `ask` holds `{x}` (or `{a}` and `{b}` with `route: true`) and ends with "?". `shows` and `not` are printed on every page as "Shows ….", "Not ….".
- A group's `empty` text is said when no link answers it; without it an empty group is left out.
- `ctd check` refuses: an id that is not a slug, family, sensitive and index-fund relations in a group, a subject type with family ties (`family: true`), and the banned words.
- How answers are placed: links nobody claims as their account are on the record; attributed links sit in each account's column (A–Z); disputed links go under Disputed; drafts come last; withdrawn links never appear. Disputed links and drafts are never counted. An account line needs a quote, or it is left off.
- A column quotes only words that speak for its account (the source's `voice` or `author`, or a quote marked `by` the account), and its badge shows the strongest of its own sources: another account's source never lends it weight. To quote an account, cite its own words.
- Caps (v1, code constants in `answers.rs`): 8 lines per group, 6 per account, 12 account columns, 5,000 pages per question. The `paths.yaml` link cost picks which lines stay.

`methodology/paths.yaml` holds:
- relation weights;
- the evidence factor β, hub penalty λ and undated penalty δ;
- the hub threshold and collapse rules.

Changing it is a reviewed PR, and every result shows the methodology version.

## Featured picks (`content/featured.yaml`)

```yaml
connections:
  - [moses, elon-musk]              # the first pair is drawn as the example route on the home page
  - [bill-gates, ibm]
  - between: [mark-zuckerberg, cia]
    note: "Each step below is a documented business link. No source here says the CIA or In-Q-Tel had any role in Facebook."
lives: [bill-gates, jeff-bezos, soviet-union]
questions: [behind/meta-platforms, why/dissolution-of-the-soviet-union]
```

- Each connection gets a route story at `/p/<a>--<b>/`, one scene per step, along the best route of at most 10 steps that does not run through index-fund holdings. The first four pairs are the home page's "Try" links; all of them are in the Stories library.
- A `note` is said up front in the story's first scene. Use it for what the sources do not show.
- `lives` are the life stories on the home shelf.
- `questions` are question pages, `<question>/<entity id>`: the Ask form's "Try" links and the first books of the Questions shelf. They are always kept when pages are capped.
- Ids or aliases both work.

## More examples

### One figure, several traditions

```markdown
---
id: moses
type: person
name: Moses
aliases: [Musa, Moshe]
claims:
  - id: c1
    rel: leads
    to: the-exodus
    according_to: [book-of-exodus]
    src: [{s: jps-tanakh-1917, at: "Exodus 3–14"}]
  - id: c2
    rel: prophet_in
    to: islam
    according_to: [islam]
    src: [{s: quran-pickthall-1930, at: "19:51"}]
---
```

### Competing narratives and a cross-confirmed fact

```markdown
---
id: cuban-missile-crisis
type: event
name: Cuban Missile Crisis
when: 1962-10-16/1962-10-28
claims:
  - {id: c1, rel: caused_by, to: soviet-missiles-in-cuba,   according_to: [us-government],     src: [{s: jfk-address-1962-10-22}]}
  - {id: c2, rel: caused_by, to: jupiter-missiles-in-turkey, according_to: [soviet-government], src: [{s: khrushchev-letter-1962-10-27}]}
  - {id: c3, rel: led_to,    to: jupiter-withdrawal-1963,    src: [{s: frus-1961-63-v11}, {s: soviet-archive-example}]}
---
```

`c3` has sources with voices from opposite sides, so it shows as confirmed across perspectives.

### Family ties

```yaml
# claims in mary-maxwell-gates.md: the role describes Mary
- id: c1
  rel: relative_of
  to: bill-gates
  role: mother
  src: [{s: gates-foundation-bill-gates}, {s: historylink-7188-mary-maxwell-gates}]
```

`relative_of` is sensitive, so this claim needs one T1 record or two independent T1/T2 voices before it appears anywhere.

### A body under a new name

```yaml
# a claim in bolsheviks.md
- id: c1
  rel: became
  to: communist-party-of-the-soviet-union
  when: 1918-03-08
  title: renamed the Russian Communist Party (Bolsheviks)
  src: [{s: lenin-1918-7th-congress-rename}]
```

### Passive holding vs ownership

```yaml
# a claim in blackrock.md
- id: c4
  rel: holds_for_clients
  to: tesla
  as_of: 2026-06-30
  percent: 6.0          # illustrative; the real value comes from the cited 13F
  src: [{s: blackrock-13f-2026q2}]
```

### Chapter with scenes

````markdown
---
id: thirteen-days-two-stories
type: chapter
title: Thirteen days, two stories
authors: [github:alibek]
---

Intro prose…

```scene
- shot: open
  view: map
  camera: {globe: true, center: [-80, 22], zoom: 2.5}
  narration: "October 1962. Two superpowers, two stories."
- shot: us-story
  perspective: us-government
  reveal_claims: [cuban-missile-crisis#c1]
- shot: soviet-story
  perspective: soviet-government
  reveal_claims: [cuban-missile-crisis#c2]
- shot: what-both-confirm
  reveal_claims: [cuban-missile-crisis#c3]
  explore: true
```
````

Shot fields (v0; the full list is in [data-contract.md](data-contract.md)):

| Field | Meaning |
|---|---|
| `shot` | Shot name |
| `view` | `map`, `graph` or `timeline` |
| `camera`, `lens`, `perspective`, `time`, `focus` | Where the view is |
| `reveal` | Entities that appear |
| `reveal_claims` | Claims whose links draw |
| `places`, `routes` | Places to mark and lines to draw on the map |
| `borders` | Historical borders to draw, by file name in `content/borders/`; the shot's date picks the period ([ADR-0020](decisions/0020-historical-borders.md)) |
| `overlay` | Source card, image or quote |
| `duration` | Seconds in watch mode |
| `narration` | Voice-over text |
| `explore` | Show the "Explore from here" button |

## `ctd check` rules (v0)

1. Files parse; required fields are present; unknown fields warn.
2. `id` equals the file name, matches the slug pattern, and is unique across entities, sources and aliases.
3. `uid` is a valid ULID and unique. If missing, `ctd fmt` fills it.
4. `type` exists and matches the folder.
5. `rel` exists, its `from`/`to` types are allowed, targets exist, a claim never points to its own entity, and qualifiers fit the relation (warning).
6. Claim ids are unique per file, and `status` is one of `published`, `draft`, `disputed`, `deprecated`.
7. Every claim has at least one source, every source exists, quotes are at most 300 characters, and T4 sources are rejected.
8. Sensitive relations meet the stricter source rule. A claim that falls short is withheld from the site: a warning for a draft, an error otherwise.
9. `according_to` targets exist, and claims on `attributed` relations have one.
10. Dates are valid EDTF and intervals have start ≤ end. A dated claim about a person before their birth gives a warning.
11. Wikilinks resolve. An unresolved link gives a warning and shows as a red link.
12. No personal contact data in entity text: emails and phone numbers are errors. Street addresses are left to review.
13. No directory holds more than 2,500 entries (warning).
14. Scene blocks reference existing entities and claims, one of the five lenses and a known view. A scene that reveals a withheld claim gives a warning.
15. Source `url` and `archive_url`, and an entity's `image.url`, are http(s) addresses. Anything else is an error, and the value never reaches a page.
16. `featured.yaml` names existing entities. A pair that names one entity twice is an error. A repeated pair or life, a pair with no route, and a life with fewer than two links give warnings. A featured question must be `<question>/<entity id>` for a question with pages (error); one with no page, or listed twice, gives a warning.
17. `questions.yaml` (`ctd` refuses to load a file that breaks these): ids are unique; `ask` holds its placeholders and ends with "?"; `shows` and `not` are present and not empty; non-route questions have `subjects`, `groups` and a `min` of at least 1; every relation exists, appears once, and is not `kinship`, `sensitive` or `passive` (family lives on entity pages); a `via` relation exists and is a plain link on the record; every subject type is reachable by a group relation; no text uses a banned word; unknown fields are errors.
18. An `identity` relation is never `attributed` (load error), and each identity claim joins two entries of the same type (error).
    A `legal` relation is `sensitive` and not `traversable` (load error), and every legal claim has `when` (error).
    A `dispute` relation is `attributed` (load error). Each claim names only its owner in `according_to`, quotes the owner's own words, and points to a work with a `finding`; a `finding` is quoted and sits only on a type a dispute can point to (errors).
19. `in_sentence` may only add "the" and lower the first letter of the name (error otherwise).
20. An attributed claim on a relation that answers a question needs a quote, or it is left off question pages (warning).
