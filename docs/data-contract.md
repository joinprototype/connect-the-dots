# Build output contract (v0)

`ctd build` writes `dist/`. The web code (islands, explorer, story player, world viewer) reads only what is described here, plus the world tiles in [world-tiles.md](world-tiles.md). Change this contract and the web code (`web/src/lib/types.ts`) in the same change.

## Files

```
dist/
  index.html                 home (a name and the stories it runs through, a few stories, what the box takes)
  e/<id>/index.html          entity page
  e/_life/index.html         the one page every life story opens in (`/e/<id>/story/`, ADR-0026)
  e/<alias>/index.html       redirect page for a slug alias (also in _redirects)
  p/<a>--<b>/index.html      route story for a featured pair (content/featured.yaml)
  q/<q>/index.html           a question's index: its richest answers (a route question lists the route stories)
  q/<q>/<id>/index.html      the answer to question <q> about entity <id>   q/<q>/<id>/story/index.html   its story
  c/index.html               Stories library         c/<id>/index.html           written chapter
  x/index.html               explorer                w/index.html                world map
  404.html
  about/index.html           how the site works: the proof marks, the questions and their scope, the methodology
  _redirects                 "/e/<alias>/ /e/<id>/ 301", one line per slug alias, then "/e/:id/story/ /e/_life/ 200"
  _headers                   security headers and the Content-Security-Policy for every file (Cloudflare format)
  t/<type>/index.html        every entry of one type, A to Z (past 500, its letters; t/<type>/<letter>/ lists one)
  data/schema.json           the vocabulary: types, relations, lenses, tiers, questions, methodology, route stories
  data/graph-slim.json       every entry and link, structure only: what the explorer draws and routes price
  data/ways.json             what a route needs and nothing else, read by a pair's answer on `/r/`
  data/e/<n>.json            the words and proof of the entries in pack <n>, loaded when one is opened
  data/life/<n>.json         the life stories in pack <n>, loaded by the page at `/e/<id>/story/`
  data/more/<n>.json         long lists past their first 40 names, fetched when a reader opens one
  data/spots.json            where each entry sits on the Map, read by the explorer
  data/stories.json          the written stories each entry is in, read by the explorer, the Map, the Earth and atlas pages
  data/islands.json          the Stories page's surface: where every entry lies, on a story's island or in the water
  data/borders/<id>.json     one polity's historical borders, loaded by a story that draws them (ADR-0020)
  data/borders/world-<year>.json   every polity of a year (world-1960, world-3000-bce), loaded by the Map's era slider (ADR-0021)
  data/search/index.json     the search files' word ranges      data/search/<n>.json   search entries by word
  data/graph.json            only with `ctd build --graph`: everything in one file, for tools; no page reads it
  world/                     manifest.json, entities.json, {z}/{x}/{y}.bin (world-tiles.md)
  static/site.css            theme CSS and tokens (from theme/static/)
  assets/                    built by web/ (Vite): islands.js|css, explorer.js|css, story.js|css, world.js|css, place.js|css (the Stories page), maplibre-gl.css (loaded by the story maps and the Map's Earth when they first draw a map), chunks/
  build-manifest.json        engine, built, commit, methodology hash, counts
  .ctd-build                 marks the folder as a build, so the next build may empty it
```

An entry gets a life story when it has at least two links that are not withdrawn. A featured pair gets a route story when a route joins them. A question gets a page about an entry when its answer names at least the question's `min` entries or gives two accounts (at most 5,000 pages per question, featured first, then the richest), and that page gets a story when it has two published lines or two accounts. `schema.json` lists the route stories; an entry's detail file names its life story and its question pages.

**Pages load what they show** ([ADR-0017](decisions/0017-pages-load-what-they-show.md)). Entry, question and type pages need no data file. The explorer and the Map's Earth read `schema.json` and `graph-slim.json`. The explorer also reads `spots.json` and `stories.json`, and loads an entry's `e/<id>.json` when a panel shows it or its links, or a pointer rests on its name. A story reads its own data from its page and `schema.json`. The box reads `search/` and `schema.json`, from the moment a person focuses it. No page reads `graph.json`; the QA sweep fails one that does. All of `data/` is served with `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.

## Dates

A date is `{ "start": <decimal year>, "end": <decimal year|null>, "label": "<human text>" }`.
- Decimal years use astronomical numbering: `0` = 1 BCE, `-449` = 450 BCE.
- `start` is inclusive and `end` exclusive. A point date lasts its own precision: `end` = `start + 1/365` (`1/366` in a leap year) for a day, `start + 1/12` for a month, `start + 1` for a year. An interval ends where its last point ends.
- `end: null` means open or ongoing.
- `label` is ready to display, e.g. `"16–28 Oct 1962"`, `"c. 450 BCE"`, `"2008 –"`.
- `open_start: true` (present only then): only the end is known, as in `"until 1 Dec 2009"`. `start` is where the end falls, for ordering; the date holds at any time before its end, so a time view never shows it as not yet begun. In `graph-slim.json` such a date is `[start, end, label, 1]`.

## `data/schema.json`

The vocabulary, with the route stories:

```jsonc
{
  "meta": { "engine": "0.1.0", "built": "2026-10-16T12:00:00Z", "commit": "abc1234", "methodology": "sha256…" },  // commit: null outside git
  "layers":   { "money": { "label": "Money", "color": "#6e6e73" } },
  "types":    { "person": { "label": "Person", "plural": "People", "layer": "people", "color": "#6e6e73" } },
  "relations":{ "founded": { "label": "founded", "inverse": "founded by", "layers": ["people","power"],
                             "traversable": true, "passive": false, "sensitive": false, "kinship": false, "attributed": false,
                             "identity": false } },
  "lenses":   [ { "id": "money", "label": "Money", "view": "graph", "layers": ["money"] } ],
  "tiers":    { "T1": { "label": "Primary record", "description": "…", "rejected": false } },  // description may be null; users see labels, never codes
  "stories":  { "paths": ["moses--elon-musk", "…"] },     // "<from>--<to>", directional: a route story at /p/<from>--<to>/
  "questions": [ {                                        // content/schema/questions.yaml, in its order
    "id": "behind", "ask": "Who is behind {x}?",          // {x} = the subject; a route question has {a} and {b}
    "label": "Who is behind",                             // the words before the first blank
    "route": false,                                       // true: answered by routes (/x/?from=&to=, /p/…), no pages
    "subjects": ["org", "place", "…"],                    // entity types it is asked about ([] for a route question); never a family type
    "shows": "documented founders, …", "not": "who made decisions, or why",   // raw; pages print "Shows ….", "Not …."
    "groups": [ { "label": "Founded by", "in": ["founded"], "out": [], "empty": null } ],
    "min": 2
  } ],
  "methodology": { /* content/methodology/paths.yaml as JSON */ },
  "perspectives": [ { "id": "us-government", "name": "United States government", "claims": 4 } ]   // every according_to target, with its claim count
}
```

## Entries, links and sources

The data files hold entries (`nodes`), links (`edges`) and sources in these shapes, or parts of them (see each file below):

```jsonc
{
  "nodes": [ {
    "id": "elon-musk", "type": "person", "name": "Elon Musk", "summary": "…",   // summary may be null
    "aliases": ["Elon Reeve Musk"],
    "when": { "start": 1971.49, "end": null, "label": "28 Jun 1971 –" },   // or null
    "coords": [28.19, -25.75],          // [lon, lat]: places; others inherit from `place` if it has coords, else null
    "place": "pretoria",                // or null
    "url": "/e/elon-musk/",
    "degree": 12                        // links touching it, both directions
  } ],
  "edges": [ {
    "id": "elon-musk#c1",               // a claim with several targets yields "<entity>#<claim>/1", "/2", …
    "from": "elon-musk", "to": "spacex", "rel": "founded",   // `from` owns the claim: it lives in that entity's file
    "label": "founded",                 // the relation label; use relations[rel].inverse when reading from the target's side
    "detail": "co-founder, 6%, as of 30 Jun 2026",   // optional: the qualifiers as text, a role first
    "layers": ["people","power"],
    "when": { "start": 2002, "end": 2003, "label": "2002" },              // or null
    "according_to": ["us-government"],  // [] = presented as documented fact
    "sources": [ { "id": "spacex-company-history", "at": "para 2", "quote": "…" } ],   // at, quote: or null; "by": entity id, present when the quote is someone's words quoted in the source
    "tier": "T1",                       // best tier among its sources; null only if none resolved
    "voices": ["spacex"],               // distinct source voices (a source's `voice`, else its publisher)
    "cross_confirmed": false,           // see "Both sides agree" below
    "status": "published",              // published | draft | disputed | deprecated
    "passive": false, "traversable": true,
    "qualifiers": { "role": "co-founder", "percent": 6.0, "as_of": "2026-06-30" },   // always present; {} when none
    "note": "…",                        // optional: the author's short clarification
    "reason": "…"                       // optional: why the claim is disputed or deprecated
                                        // on disputed/deprecated claims a note that repeats the reason (exactly,
                                        // or as its first words) is dropped; any other note is kept as written
  } ],
  "sources": { "spacex-company-history": { "title": "…", "publisher": "spacex", "publisher_name": "SpaceX",
               "url": "https://…", "tier": "T1", "voice": "spacex", "published": "2002", "published_label": "2002",
               "archive_url": null } }   // url and archive_url: http(s) or null
}
```

**Relation flags** (`relations[rel]`):
- `identity`: the same body under a new name (`became`). Question answers about the later form include what was recorded about the earlier one, marked "as …".
- `traversable`: routes may use the link. Places (`born_in`) and interpretations are `false`.
- `passive`: shares held for clients (index funds). Drawn as one "Index funds" group and left out of routes unless the reader asks.
- `sensitive`: stricter sourcing, one T1 record or two independent T1/T2 voices. A claim that falls short is **withheld**: it is in no output (no edge here, no page row, story, family card, tile or route) until it is sourced.
- `kinship`: a family relation, gathered into "Family ties". Its `role` qualifier describes the claim's owner (`from`), not its target. `mary-maxwell-gates#c1` (`relative_of` `bill-gates`, `role: mother`) says Mary is Bill's mother. Put the role beside `from` ("Mary Maxwell Gates · mother", "Mary Maxwell Gates, mother of Bill Gates") or make it the phrase on `from`'s own side ("Mother of Bill Gates"), never beside `to`. `detail` starts with the role, so drop it from `detail` when the role is the phrase.
- `attributed`: an interpretation, such as `benefited_from`. Every claim names `according_to`, and the relation is always `traversable: false`, so no route runs through one side's account.

**Status** (`edges[].status`), in plain words:
- `published`: the default.
- `draft`: "Being verified". Routes use it at reduced strength (`methodology.evidence.draft_factor`).
- `disputed`: "Disputed", shown with its `reason`.
- `deprecated`: "Withdrawn". It stays listed and marked, with its `reason`, under the entry's connections, and is left out of routes, stories, life lines and family ties.

**Both sides agree** (`cross_confirmed`): the claim has no `according_to`, is published (not a draft, disputed or withdrawn), and its `voices` include two members of one contested set in `content/schema/perspectives.yaml`.

## `data/graph-slim.json`

Every entry and link, with only what the explorer draws and routes price, as rows:

```jsonc
{
  "nodes": [ ["elon-musk", "Elon Musk", "person", 12, [1971.49, null, "28 Jun 1971 –"], 0, 41] ],
  //          id           name         type     degree when (or 0)                      coords place
  "edges": [ [17, 52, "founded", "c1", [2002, 2003, "2002"], "T1"],
  //          from to  rel       claim when (or 0)            tier (or null)
             [17, 9, "benefited_from", "c7", 0, "T2", { "according_to": ["us-government"], "status": "draft" }] ]
}
```
- **An entry** is `[id, name, type, degree, when, coords, place]`. `coords` is its own `[lon, lat]` or 0. `place` is the index of the entry it is set in, or -1. An entry without coords of its own is drawn at its place's (the node's `coords` above), and its `url` is `/e/<id>/`.
- **A link** is `[from, to, rel, claim, when, tier]`, with its ends as entry indexes. Its id is `<from id>#<claim>`. `label`, `layers`, `passive` and `traversable` are its relation's. An object follows when any of these is not the default: `according_to` (default `[]`), `status` (default `published`) and `voices`, which is there only on a link both sides agree on (`cross_confirmed`).
- **Left out:** summaries, aliases, qualifiers, notes and sources. They are in the entries' detail files.
- **Size:** 17 KB gzip today (338 entries, 642 links). Its budget is 1 MB gzip, which holds about 40,000 links of today's kind. Past it the build warns, and the explorer and routes need the route service ([ADR-0017](decisions/0017-pages-load-what-they-show.md)).

## `data/ways.json`

What a route needs and nothing else: 70 KB gzip where `graph-slim.json` is 170. A pair's answer finds its way here with `findPaths`, and reads the words of what it found from the detail files of its stops:

```jsonc
{
  "nodes": [ ["elon-musk", "person", 12] ],          // id, type, degree
  "edges": [ [17, 52, "founded", "c1", "T1"],        // from, to, rel, claim, tier
             [17, 9, "regarded_as", "c7", "T2", { "according_to": ["christianity"], "status": "draft" }] ]
}
```
- **Links:** only those a route may use (`traversable`, not `passive`, not withdrawn), with ends as entry indexes, and the object a link in `graph-slim.json` has. `tools/qa/paths-golden.mjs` checks that it finds the routes the slim file does.
- **Left out:** names, dates, places, and every link that stays off routes. A sealed entry keeps its row and has no link here.

## `data/e/<n>.json`

Entries share 256 packs ([ADR-0026](decisions/0026-entries-share-files.md)). `<n>` is the 32-bit FNV-1a hash of the id, modulo 256, and the file is an object keyed by id. `loadEntryFile(id)` in `web/src/lib/data.ts` reads the one entry out. An entry's words and proof load when the explorer opens the entry or shows one of its links:

```jsonc
{
  "id": "blackrock", "name": "BlackRock", "type": "org",
  "summary": "American asset manager founded in 1988.", "aliases": ["BlackRock, Inc."],
  "story": "/e/blackrock/story/",        // its life story, or null
  "asked": [ { "q": "behind", "title": "Who is behind BlackRock?", "url": "/q/behind/blackrock/",
               "links": 9, "accounts": 0, "counts": "9 links" } ],   // the question pages about it
  "open": 120,                           // how many more links open data holds for it, or null
  "w": "Q219635",                        // its Wikidata id, or null: `/r/` steps from here into open data
  "links": [ { "id": "blackrock#c3", "to": "spacex", "rel": "invested_in", "when": [2019, 2020, "2019"], "tier": "T1",
               "sources": [ { "id": "…", "at": null, "quote": "…" } ],
               "according_to": ["…"], "status": "draft", "voices": ["…"],
               "detail": "$240M", "qualifiers": { "amount": 240000000, "currency": "USD" }, "note": "…", "reason": "…" } ],
               // the link in full, so that a pair's tie needs no other file: its owner is the id's first part, `when` is
               // as in graph-slim.json, and according_to, status, voices, detail, qualifiers, note and reason come only when set
  "sources": { "…": { /* as in "Entries, links and sources" */ } }   // the sources its links cite
}
```
- **Its links:** every link touching the entry, both directions. A hub keeps the 100 strongest of each kind (relation and direction), ranked as answers rank them (`methodology` cost); the rest are in the slim file, and a link past the cap of one end is in the other end's file. Its entry page lists the same links, with "and N more" opening the explorer.
- **Never in it:** an entry's `background` lines (ADR-0016).

## `data/life/<n>.json`

The same packs, for life stories: `{ "<id>": { "title": "The story of Alphabet: Connect the Dots", "main": "…" } }`. `main` is what a chapter page holds inside `<main>`. An id with no story is absent.

## A story's own data

A story page embeds the entries, links and sources its scenes name, beside its shots (`script.ctd-story-data`, see "Chapter" below): `{ "nodes": [...], "edges": [...], "sources": {...} }` in the shapes above, with links in full. Its entries are the scenes' `focus`, `perspective`, `reveal`, `places` and `routes`, and the ends, accounts and quoted speakers of the links its scenes reveal (`reveal_claims`). Its sources are those links' and the overlays'. The player reads this and `schema.json`, and nothing else.

## `data/islands.json`

The Stories page's one surface ([ADR-0028](decisions/0028-one-box.md), after the One Place prototype), read by `<ctd-place>` with `graph-slim.json`, whose entries and links it places: every written story is an island, and every entry a dot, on an island's land or in the water between. The build settles every position, deterministically, so nothing is laid out on screen and the same content gives the same picture.

```jsonc
{
  "w": 6000, "h": 4100,              // the map, in its units
  "coast": 29,                       // how far land reaches around a dot on it: land is the discs around them
  "at": [812, 340, 790, 361],        // every entry's place, [x, y] in the order of graph-slim.json's nodes
  "sealed": [212, 1840],             // entries sealed (ADR-0027), by index
  "told": [[3, 17], [], [3]],        // for each entry, the stories that tell of it, the one with the most scenes on it first
  "stories": [ { "id": "pain", "title": "Pain", "subtitle": "…", "scenes": 22,
                 "x": 2310, "y": 3790, "r": 182,      // the island: its centre, and the radius its land reaches
                 "land": [17, 40, 41],                // the entries on its land
                 "trail": [17, 902, 40] } ],          // the subject of each scene in order: its focus, else the first it names
  "lines": [[4, 17, 2, 1]]           // [a, b, strength, shown at rest]: stories by index
}
```
- **Land and water.** An island's name sits over its land, so only what the story is about lies on it: an entry no other story tells of, and, for a person (a type marked `family`), only one a scene of that story is about (its `focus`). Whoever two stories share, or a story only mentions, floats in the water near the stories that name them, off every island's land; an entry no story tells of floats near what it links to. A sealed entry, a `group` and a `tradition` never lie on land.
- **A story tells of** a scene's `focus`, `perspective`, `reveal`, `places` and `routes`, and both ends of each link in its `reveal_claims`. `told` and `trail` leave out sealed entries, groups and traditions: no story is listed through them, and no trail runs through them (ADR-0016, ADR-0027).
- **Where islands lie:** each starts at the middle of the places its entries are set (a flat Earth), so a new story lands near its part of the world and disturbs the others little; stories that share entries are drawn together, and all are pushed apart until their shores stop touching.
- **`subtitle`** is null when it would name a sealed person, by name, alias or family name (ADR-0027). The list under the picture still prints it. A story whose title names one stays off the picture.
- **`lines`** join stories that share an entry. An entry in few stories counts for more than one in many. A sealed entry, and what is about it, joins nobody (ADR-0027), and neither does a `group` or a `tradition`: no line says two stories belong together because of who someone is (ADR-0016). Each island keeps its five strongest. The strongest of each shows at rest, and the rest when a pointer rests on the island. `strength` is 1 to 3.
- **Size:** 35 KB gzip today (76 stories, 3,453 entries). Its budget is 100 KB gzip; past it the build warns. With `graph-slim.json` and `schema.json`, the surface loads about 220 KB gzip, after the page's words have painted.

## `data/borders/<id>.json`

A GeoJSON FeatureCollection, copied from `content/borders/`: `name` (what the key says), `source` (a source id), and one feature per period, with `properties.from` and `properties.to` (years, inclusive) and a MultiPolygon. A shot's `borders` lists ids; the story takes the feature whose years hold the floor of the shot's `t`, and draws nothing for an id with none.

## `data/search/`

The search entries, filed by word:

```jsonc
// data/search/index.json: each file's first word (the first file's is "")
{ "files": ["", "kennedy", "smith"] }
// data/search/<n>.json
{ "entries": [ { "id": "meta-platforms", "name": "Meta Platforms", "aliases": ["Facebook"], "type": "org", "summary": "…",
                 "when": "2004 –", "url": "/e/meta-platforms/", "q": ["behind"], "rank": 41 } ],
  "words": [ ["facebook", [0]], ["meta", [0]], ["meta platforms", [0]] ] }   // a word and its entries' places in `entries`
```
- **Entries:** entities (best-connected first, then by name), then written chapters (`type: "chapter"`), then question pages (`type: "question"`, question by question in `questions.yaml` order, featured first, then the richest). `rank` is an entry's place in that order, across files. Go to `url`; only entity entries can be shown in place by the explorer or the map.
- **Words:** each entry is filed under every word, and every pair of neighbouring words, of its name and aliases. A word is folded: lower case, accents dropped, apostrophes and full stops removed, split at everything else that is not a letter or digit ("O'Brien" is `obrien`). A word lists its 100 best entries; a longer query finds the rest.
- **Files:** the words are sorted and cut into files between words, at about 50 KB gzip. While everything fits in one file, which is today, that file holds every entry and no `words`: search reads all of it.
- **Looking up a query:** fold its words, take each word and each pair of neighbouring words, find the file whose range holds it (and the next file when its first word starts with it), and gather the entries under the words that start with it.
- `q` (entity entries only, present when non-empty): the ids of the questions with a page about this entry, in `questions.yaml` order. The box reads a question through it.
- `sealed` (present only then): `true` on an entry marked `sealed` (ADR-0027). The box finds it by name and answers a person who types it, and never offers a pair through it.
- `when` (entity entries only): the entry's dates as a label, or null.
- A question page's `aliases` are its question asked with the subject's other names, so "Who is behind Facebook?" finds Meta's page.
- A question entry's `name` is the asked sentence, its `summary` its counts ("7 links, 6 accounts"). Code that wants only entities filters out `chapter` and `question` entries.

## `data/graph.json` (only with `ctd build --graph`)

Everything in one file, for tools and tests: `schema.json`'s fields, plus every node (with `summary` and `aliases`), every edge in full and every source, `questions[].pages` (the answer pages by entity id: `title`, `url`, `links`, `accounts`, `story`) and `stories.entities` and `stories.questions` (the ids with a life story, and the `<q>/<id>` answers with a story). No page reads it.

## Page markup the scripts rely on

Every page's `<head>` carries link-preview tags made from its own title and description blocks: `og:title`, `og:description`, `og:type` ("website"), `og:site_name` and `twitter:card` ("summary"). A question page's description ends with the notice.

All reading pages load `/static/site.css`, `/assets/islands.css` and `/assets/islands.js` (`type="module"`). The CSS variables in `site.css` are the design tokens. Every color has a light and a dark value (`prefers-color-scheme`):
- surfaces: `--paper` (the page), `--paper-2` (a grouped area on it), `--sheet` (a card), `--raised` (a field or quote on `--paper-2`), `--selected` (the chosen segment of a control), `--fill` (tracks, badges and quiet buttons on a sheet);
- text and lines: `--ink`, `--ink-2`, `--muted`, `--rule`, `--contour`;
- accent: `--accent` (links, selection, focus, the active path, filled buttons), `--accent-hover`, `--on-fill` (text on a filled button);
- `--highlight`: quoted proof;
- layers: `--layer-<layer-id>` (set by `base.html` from `layers.yaml`, one value for both modes);
- fonts: `--font-display`, `--font-body`, `--font-ui`, `--font-mono`;
- misc: `--radius`, `--shadow`, `--shadow-lift`, `--measure`, `--gutter`.

`site.css` also supplies the base rules the scripts' markup relies on: border-box sizing, `[hidden]` (`display: none !important`), `.sr-only` (visually hidden, still read aloud) and a reduced-motion reset (no animations or transitions when `prefers-reduced-motion: reduce`).

**Islands** (custom elements, light DOM):

| Element | Behaviour |
|---|---|
| `<ctd-box>` | Enhances the server's `<form role="search"><input>`, in every header ([ADR-0028](decisions/0028-one-box.md)). Until a person focuses it, it loads nothing: no search file, and only a focus listener of script. Then `web/src/islands/box-field.ts` reads `search/` (the entries for the typed words) and `schema.json` (the inks), and `web/src/lib/box.ts` reads the text as one name, two names, a year or a question. Each name gets a dot in its type's ink, and arrow keys, Enter and Escape work the suggestions. Enter goes to `/e/<id>/` or `/a/?q=Q<n>`, `/r/?a=<id or Qn>&b=<id or Qn>`, `/q/<q>/<id>/`, `/w/?t=<year>`, or with an empty box `/c/`. Otherwise it answers in its own panel, in fixed words, and never repeats the text. For a single name on the explorer and world pages (`html[data-ctd-explorer]`) it first dispatches a cancelable `ctd:focus` `{id}`; a page that can show the entry calls `preventDefault()` and the box stays put. Without JavaScript the field is hidden (`@media (scripting: none)`) and a link to `/c/` stands in. |
| `<ctd-lens-chips focus="<id>">` | Holds server-rendered chips, `button[data-lens][data-layers]` (`data-layers`: the lens's layer ids, space-separated), so it needs no data file; without chips it builds them from `schema.json`. Clicking dispatches `ctd:lens` `{lens}` on `document`, hides `li.claim` items whose `data-layers` miss the lens layers (and any `.claim-group` left empty), and keeps `?lens=` in the URL. Lens `all` shows everything. |

**Stories** (`/c/`, `chapters.html`): `<ctd-place class="place">` takes the first screen, and `/assets/place.js` and `/assets/place.css` load on this page alone. It holds `.place-hello`, the page's `h1` and the fixed words that say what the picture is, which the script leaves in place and fades when the camera leaves the whole map. The script adds one canvas (`aria-hidden`), a layer of words, and one button that zooms out. It reads `graph-slim.json`, `islands.json` and `schema.json`; an entry's detail file when it is opened or a link's proof is read; `ways.json` when a way is asked for; and `search/` when someone types in the way field. The address is the stop, so Back walks back: `#/e/<id>` an entry, `#/i/<story id>` an island, `#/l/<link id>/<from id>` a link and its proof, `#/w/<a id>/<b id>` the way between two entries and `#/w/<a id>/<b id>/<n>` its step `n`. Any other hash, such as `#all`, leaves the surface as it is. The page sets `html[data-ctd-explorer]`, so the header's box shows a single name here. Every move is one straight eased move, and nothing runs at rest. A way is the first `findPaths` finds over `ways.json`, as `/r/` finds it; a sealed entry is never offered as one end. The list under it (`#all`) is its alternative for screen readers, and all that shows without JavaScript.

**Entity page:** a person's page may open with a "Background" card: the links whose relation has `background: true` (born in, citizen of, educated at), and the entry's `background` lines, each with footnotes. Background lines are on that page only. They are in no data file (`graph-slim.json`, `e/<id>.json`, `search/`, a story's data and shots, nor `graph.json`), by rule ([ADR-0016](decisions/0016-who-a-person-is.md)), and a test checks it.

**Entity page:** the one a legal record is about gets a "Legal records" card ([ADR-0018](decisions/0018-legal-records.md)): its links on `legal` relations, grouped by `case`, each case's steps in date order, then the `caveat` of each relation it holds.

**Entity page:** a work with a `finding`, and anyone who disputes one, gets a "The debate" card ([ADR-0019](decisions/0019-disputing-a-finding.md)): the finding, then who disputes it and what it disputes, by date, each in its own words, then the relation's `caveat`.

**Entity page:** no tabs. Timeline, Proof and Page history are `details.fold` sections (`#timeline`, `#proof` with `li#src-<n>`, `#history`). A small inline script opens the fold that holds the URL's hash target, so footnote links (`#src-<n>`) work. No island is involved.

**Explorer:** `/x/index.html` contains `<div id="explorer-root"></div>` and loads `/assets/explorer.js` and `/assets/explorer.css`. Its state lives in the query string, and a change of `focus`, `link`, `from` or `to` is a step in the browser's history ([ADR-0029](decisions/0029-the-walk.md)):
- `focus`: entity id, name or alias;
- `link`: the id of the link whose proof is open;
- `lens`: lens id;
- `p`: perspective entity id, `facts` or `all`;
- `t`: decimal year;
- `from`, `to`: route ends (id, name or alias). `from` alone asks for the other end;
- `view=world`: an old address, which opens `/w/?focus=<id>`.

The picture is made of `.ctdx-scene` elements, one for each stop: `a.ctdx-dot[data-walk="<id>"]` for a dot and `line.ctdx-hit[data-link="<link id>"]` for a line. A move animates the `.ctdx-world` transform and the scenes' opacity, and the page holds no running animation at rest.

**World map:** `/w/index.html` contains `<div id="world-root" data-src="/world/"></div>` and loads `/assets/world.js` and `/assets/world.css`. Query: `view` (`earth`; Links when absent), `t` (a year: it opens on the era around it, `-449` for 450 BCE), `src` (another same-origin world), `focus` (entity id), `stats=0|1`, `labels=0`, `rs` (dot size factor), `soak=1&soakSec=<n>` (soak test).
- A switch where the title would be, "Links | Earth", picks the view and keeps it in the URL (`?view=earth`; Links has no `view`). Synthetic worlds and the explorer's world mode show Links only.
- **Links** draws the world tiles ([world-tiles.md](world-tiles.md), which has the field details):
  - It opens on the manifest's `bounds`, and ⌂ returns there.
  - Zoomed out it names the manifest's `regions`; clicking a name flies to it. Zooming in fades the names out and the dots' own names in.
- **Earth** (`?view=earth`) draws the entries in `graph-slim.json` that have `coords` (their own or their place's) on a MapLibre globe, with the story maps' calm OpenFreeMap basemap, so like them it fetches from `tiles.openfreemap.org` (ADR-0014). MapLibre and `/assets/maplibre-gl.css` load only when Earth is opened.
  - One dot per spot: entries with the same `coords` (to about 100 m, such as an entry and its `place`) share it. It is named after the entry with coords of its own, else the best-connected one, and is a little bigger where more entries are. Gray; the accent marks the selected one.
  - It opens on the whole planet, turned to where the spots are, and ⌂ returns there. With `focus`, it centres the entry's spot and opens the entry's card.
  - The box shows an entry there when it has a place; for the others it opens their page.
- An era slider (one range input, "All time" at its right end) appears when entities have `start` dates, and serves both views. Its eras are two steps wide and one step apart: decades (twenty-year eras) when they fit, wider steps for very long spans, plus "Before …" for the earliest few and "Since …" at the present. Dots whose dates miss the era, and undated ones, fade but stay (an Earth spot fades when none of its entries meets the era). `t` opens on an era; moving the slider does not change the URL.
- Clicking a dot opens its card: "Open page ›" (the entry's `url`) and "Explore" (`/x/?focus=<id>`). On the Earth the card is the spot's named entry (or the `focus` entry), followed by "Also here": the spot's other entries, each a link to its page.

**Stories:** written chapters (`/c/<id>/`) and generated stories (`/e/<id>/story/`, `/p/<a>--<b>/`) share one template (a life story's is in `data/life/`):
```html
<ctd-story chapter="<id>">
  <script type="application/json" class="ctd-shots">[ …shots… ]</script>
  <script type="application/json" class="ctd-story-data">{ "nodes": […], "edges": […], "sources": {…} }</script>
  <div class="story-stage" aria-hidden="true"></div>
  <div class="story-steps">
    <section class="step" data-shot="<shot name>"><div class="step-card">…narration HTML…</div></section>
  </div>
</ctd-story>
```
A step card may hold `p.step-time` and `p.step-explore`. The page loads `/assets/story.js` and `/assets/story.css`; MapLibre and `/assets/maplibre-gl.css` load only when the story first shows a map scene.

**Doors** ([ADR-0028](decisions/0028-one-box.md)): in a step card's narration, the first mention of an entry in a scene is a plain link, `<a class="door-<layer>" href="/e/<id>/">`, and so is any link the narration already made to an entry. `door-<layer>` gives the dotted underline in that kind's ink; the page's own `<style>` maps it to `--layer-<layer>`. No script touches them. The engine (`crates/ctd/src/doors.rs`) adds links and changes no word:
- It looks only for the story's own entries (`focus`, `perspective`, `reveal`, `places`, `routes`). A one-word name needs the scene itself to list the entry; a longer name may be listed by any scene.
- It uses the entry's name, `in_sentence` and aliases, by whole words, case-sensitive, longest first.
- It leaves plain a name two entries share, a form with no capital, a very short name ("X", "Ur"), a one-word name that is the surname of another person in the story ("Krupp" beside Gustav Krupp), and a piece of a longer name ("New York Times", "Great Britain", "Bank of England").
- It leaves alone anything in quotation marks, a bold scene title, a link, a blockquote or code, and it never reads overlays.

**Listen** (in watch mode, off unless the viewer turns it on) reads each child of a step's `.step-card` aloud as plain text, one utterance per paragraph, with the browser's own speech (Web Speech API), leaving out `p.step-time` and `p.step-explore`. The narration HTML is what is heard. Then it reads the scene's quote card: "In their words:" and the quote, then its caption (who said it), or "The source says:" and a proof card's quote. The viewer's choice is kept in `localStorage` under `ctd-listen` (`1` or `0`).

**Back:** on leaving, a story keeps its scene in `sessionStorage` under `ctd-scene:<path>`. Arriving by Back, it goes to that scene only if the browser has not restored the scroll there (a life story arrives too late for it).

Shot fields (from the chapter's `scene` blocks, or generated; the build adds `t` and `time_label`). The narration's HTML is in the step cards only. A `reveal_claims` entry `<entity>#<claim>` matches that edge and any `<entity>#<claim>/<n>` edges:

| Field | Meaning |
|---|---|
| `shot` | Shot name |
| `view` | `map`, `graph` or `timeline` |
| `camera` | `{ center: [lon, lat], zoom, pitch?, bearing?, globe?: bool, fit?: bool, duration?: seconds }`; `fit` zooms out once settled until every marker shows |
| `focus` | Entity id |
| `lens` | Lens id |
| `perspective` | Entity id |
| `time` | EDTF string; the build adds `t` (decimal year) and `time_label` |
| `reveal` | `[entity ids]` |
| `reveal_claims` | `["<entity-id>#<claim-id>"]` |
| `places` | `[place ids]` to mark on the map |
| `routes` | `[[place-id, place-id], …]` lines to draw on the map |
| `overlay` | `{ kind: "source"\|"quote"\|"image"\|"stat", source?, quote?, image?, caption?, value?, label? }`; a `stat` is a big number (`value`, `label`) with its `source` and `quote` beside it |
| `narration` | Markdown |
| `duration` | Seconds in watch mode; with Listen on, the scene also waits for its narration to be read |
| `explore` | Show the "Explore from here" button, which links to `/x/?focus=&lens=&p=&t=` |

**The map view** flies to each shot's `camera` and marks its places. Once the camera settles, no marker (dot or name) is left under the quote card, the time pills or the controls: the map moves as little as it can, up or left, or, when no small move does it (on a phone the card spans the width), zooms out until every marker fits the room left. Where a marker names a place, the basemap does not name it again.

A map scene dated before 1800 hides the basemap's modern borders, roads and names: land, sea and rivers stay.

**The graph view** keeps what earlier shots revealed and draws the world as of the shot's `t`: what has not begun is hidden, and what is over is faded.
- **A shot's own reveals are never faded.** What a shot itself reveals (`reveal`, `focus`, the ends of `reveal_claims`) is its subject, so its `t` never hides or fades it.
- **The camera frames that subject.** The camera frames those entries, not everything shown so far.
- **The camera avoids what covers the stage.** The time pills and the quote card sit over the stage, and so do the controls on phones. The camera keeps the subject clear of them, and names are never placed under them.
- **Names never overlap.** They go right of the dot, else left, above or below; a name that fits nowhere whole is left out.
- **Link labels are few and short.** Only the shot's own links carry a label, and only when it adds three or fewer. The label is the bare phrase.

**Events between scripts** (CustomEvents on `document`):
- `ctd:lens` `{lens}`
- `ctd:time` `{t}` (decimal year or null)
- `ctd:focus` `{id}`: the explorer sends it when its focus changes; the explorer and the world viewer listen. The box sends it cancelable (see `<ctd-box>`); the other events are not cancelable.

## Template context (engine → `theme/templates/`)

Every template gets `site` (`title`, `tagline`, `dev`, `assets`, `lenses`, `layers`, `manifest`). Withdrawn links never reach `dossier` or any story.

`entity.html`:
- `entity`: `id`, `name`, `kind`, `type_label`, `summary`, `when` (label), `aliases`, `same_as` (`key`, `value`, `url`), `place`, `image`, `body_html`, `rel_path`, `url`, `story_url`, `coords`, `cover` (SVG), `evidence_line`. `coords` is `[lon, lat]` as in `graph.json` (its own, or its place's) or null; when set, the page links "On the map ›" to `/w/?view=earth&focus=<id>`.
- `groups[]`: `{ phrase, layers, items[], more }`, one group per phrase; `more` counts a hub's links of that kind past its 100 strongest (on the kind's last group), which the explorer shows. An item is one link: `edge_id`, `phrase`, `outgoing`, `other` (`id`, `name`, `kind`, `type_label`, `url`), `when`, `detail`, `according_to[]` (`id`, `name`, `url`), `tier_label`, `status`, `cross_confirmed`, `passive`, `layers`, `refs` (source numbers), `note`, `reason`. On a family link the owner's page gets the phrase `"<role> of"` (lowercase, e.g. "mother of") and a `detail` without the role; the other person's page gets the inverse and a `detail` that starts with the role.
- `/a/` and `data/a/<n>.json` (ADR-0023): the atlas, read by `web/src/atlas`. An entry lives in shard `<Wikidata number> % 2048`; `p` is its place on the Map in 65,535ths, `r` its next step towards a landmark as `[number, phrase]`, and a neighbour is `[number, name, kind, place, hand id?]`. As `"Q42": { n: name, k: kind (index), g: [[phrase, [[number, name, kind, id written by hand?], ...], how many more]], d: summary, y: years, c: [lon, lat], i: Commons file, u: page written by hand }`. Search rows for the atlas have `url: /a/?q=Q42`.
- `data/more/<n>.json`: lists that run past 40 names, from name 41 to at most 5,040, as `{ "Q42": { "<group index in g>": [[number, name, kind, hand id?], ...] } }`, in file `<Wikidata number> % 512`. A reader's "Show 834 more" costs one file, and the number of files never grows.
- `data/routes.json` (ADR-0023): the landmark table, read by `web/src/lib/atlas-route.ts`. `l`: landmarks by Wikidata number. `p`: phrases, each `[one way, the other way]`. `n[i][j]`: the landmark after `i` on the way to `j` (65535: none). `b["i:j"]`, `i < j`: `[x, y, phrase * 2 + flip]`, the crossing between two landmarks' territories, `x` in `i`'s.
- `earth/index.json`: `{ maxzoom, entries, tiles: { "<z>": [x * 2^z + y, …] } }`, and `earth/<z>/<x>/<y>.json`: rows of `[lon, lat, Wikidata number, name, kind]`, then its years `start, end` if dated (`end` exclusive, 32767: still going), on the web map's tile grid. Read by `web/src/world/earth.ts`, for what is in view.
- `data/stories.json`: `{ "<entry id>": [[title, url], …] }`, an entry's written stories, most scenes first, at most three. A dot's card lists them, then those of what it links to.
- `data/spots.json`: `[x0, y0, x1, y1, …]`, each entry's place on the Map in 65,535ths, in the order of the `nodes` of `graph-slim.json`. The explorer reads only the direction from one entry to another, to choose which side of the picture a neighbour goes on. About 19 KB gzip for 3,397 entries.
- `/r/` (`route.html`, ADR-0028): the one answer for any two, `?a=<id or Qn>&b=<id or Qn>`, with `&way=<n>` for an alternative. The page is written by `route.js`, its heading from the entries the data holds. It loads what the pair needs: `schema.json` and the two ends' detail files, which hold their ties; `ways.json` and the stops' detail files when both ends have a link a route may use; the atlas and `routes.json` only when no written way exists and both ends have open data. `/r/?a=Q937` alone keeps one name and asks for the other. `/w/` also takes `?focus=Q42` and `?route=Q1,Q2,…`.
- `chapter.ink` (chapter.html): `{ bg, fg, text }`, the band a story opens on. `world/picture.svg`: the map's best-connected dots, a picture no page draws today.
- `stories[]`: up to three written stories that name the entry, the one with the most scenes on it first: `{ title, url, counts }`.
- `dossier`: `family`, `lifeline`, `holders`, `holdings` and `split`, each null when empty, plus `share_scale` (the largest percent shown, at least 10).
- `background` (people, else null; ADR-0016): `{ rows[{ phrase, node, when, detail, refs, draft, disputed, reason }], lines[{ text, refs }] }`. `rows` are the person's own links whose relation has `background: true` (born in, citizen of, educated at); `lines` are the entry's sourced `background` lines. The lines appear on this page only.
- `legal` (or null; ADR-0018): `{ cases[{ case, steps[{ when, phrase, node, detail, refs, draft, disputed, reason, note }] }], caveats[] }`. Cases come in the order of their first step, and `case` is null for a step that names none (it stands alone); `caveats` are the sentences of the relations the card holds.
- `debate` (or null; ADR-0019): `{ finding, disputed_by[], disputes[], caveats[] }`. `finding`: `{ quote, refs }`, or null. A side: `{ node, when, quote, refs, draft, disputed, reason, note }`, by date; `quote` is that side's own words.
- `here` (places only, else null): `{ items[{ node, type_label, when }], more }`, the entries whose `place` is this entry, by date then name, at most 12.
  - `family[]`: `{ node, role, self_role, draft, disputed, reason, attributed, according_to[], did[] }`. `self_role` is set on the owner's page ("Mother of …"), `role` on the other person's page ("…, mother"). `did[]` (up to four): `{ phrase, other, detail, when, draft, disputed, reason, according_to[] }`.
  - `lifeline`: `{ rows[], ticks[{ left, label }], more }`, or null. Tenures only (links dated as a range, such as "2001-07/2011-04" or "2015-10/.."): a moment such as a founding is told in the Timeline. The first row is the entry's own span when it has one (`own: true`, `phrase` "Life", "Active" or "Span", `when`); then up to 8 tenures, the longest kept, by start date. A tenure row: `{ own: false, phrase, name, url, detail, when, according_to[] (names), status, reason, left, width, point }`; `left` and `width` are percent of the shared axis, and `point` marks a tenure of a year or less. `more`: tenures left out, all of them in the Timeline.
  - `holders[]`, `holdings[]`: `{ node, percent, shares, passive, as_of, edge, refs }`. Owners first, then what is held for clients; within each, by percent, then rows with shares alone. `percent` is null when a filing gives only shares; `shares` is the count as displayed. A stake that ended (a range or an open start, with an end in the past) is left out; a dated snapshot stays, with its date. Rows are never summed: each has its own date and source.
  - `split` (two or more accounts): `{ sides[{ who, claims[{ phrase, other, when, draft, disputed, reason }] }], confirmed[{ phrase, other, when, disputed, reason }] }`.
- `timeline[]`: `{ when, start, phrase, subject, object, layers, according_to[], own, status }`, read from the claim's owner.
- `sources[]`: `{ n, id, title, publisher, publisher_url, published, url, archive_url, tier_label, quotes[] }`.
- `history[]`: `{ hash, date, author, subject }`. `claims_count`: the number of links.
- `questions[]` (up to 3, in `questions.yaml` order): the question pages about this entry, `{ title, url, links, accounts, counts }` (`counts`: "8 links", "7 links, 6 accounts"). Never about a person under "behind": no such page exists.
- `connect`: `{ title: "How is Bill Gates connected to …?", url: "/x/?from=bill-gates" }` from the route question, or null.
- `split_url`: the first question page about this entry with two or more accounts (for "How each side tells it"), or null.

`chapter.html`: `chapter` (`id`, `title`, `subtitle`, `summary`, `authors`, `intro_html`, `outro_html`, `shots_json`, `data_json` (the story's own data), `steps[]`, `shot_count`; written stories add `rel_path`, generated ones `generated`, `back` and `explore_url`) and `history`. A question story's `subtitle` is its scope line, its `intro_html` the notice and its `back` the question page.

`home.html`:
- `threads[]`: the picks in `threads` of `content/featured.yaml`, in order, each with at least two stories: `{ node, name, count, stories[], more, cut }`. `name` is the entry's name as it opens a sentence ("The Federal Reserve"). `count` is how many stories it runs through, in words. `stories[]` (the first four): `{ title, subtitle, url }`. `cut`: there are more, `more` in words.
  - A pick is a person, an organization or a place (`thread: true` in `entity-types.yaml`), never sealed. `ctd check` refuses anything else, and warns of a pick left with too few stories.
  - A story counts from two scenes that name the entry, most scenes first, and only if it is free of sealed entries (ADR-0027): no scene shows one or reveals a link to one, and no sentence names one.
  - Every thread is in the page, in one grid cell, so the tallest holds the room. `.thread.on` is the one shown, and `web/src/islands/threads.ts` moves it.
- `shelf[]`: the first six written stories free of sealed entries, in the library's order (`featured: true` first), as `book` takes them. `stories`: how many written stories there are.
- `kinds[]`: `{ id, label }`, each type with entries, for the last line. Its `#index-h` is where a type page's back link lands.

`chapters.html` also gets `questions[]`, the Questions list (question stories, featured first, then the richest, at most 24): `{ title, subtitle, url, kind: "Question", cover }`, and `questions_more`. It lists every story as plain rows, with no covers (the page's budget is 150 KB). `inks[]`: `{ color, label }`, the key under its surface, one row per ink with the kinds drawn in it ("Works, concepts and traditions"), for kinds with entries.

`question.html` (`/q/<q>/<id>/`); a node is `{ id, name, kind, type_label, color, url }`:
- `question`: `{ id, ask, label, title, shows, not, url, story_url, explore_url }`. `title` is the asked sentence ("Why did the dissolution of the Soviet Union happen?"); `shows` and `not` are full sentences; `story_url` may be null; `explore_url` is `/x/?focus=<id>`.
- `x` (the subject): `{ id, name, sentence, kind, type_label, when, aliases, url, rel_path }`. `sentence` is the name as used mid-sentence (`in_sentence`, e.g. "the Bolsheviks"). `when` is a label or null.
- `counts`: `{ links, accounts, names, label }`. `links`: published lines on the record or in an account, each link once; `accounts`: distinct accounts (columns, including any cut); `label`: "7 links, 6 accounts".
- `records[]`: one per question group that has lines on the record, or that no line answers and has `empty` text: `{ label, lines[], more, empty }` (`empty`: the text, or null).
- `accounts[]`: account columns, A–Z: `{ who (node), lines[], more }`. `more_accounts`: columns cut.
- `shared[]`: `{ n, group, names[] (nodes) }`, entries that two or more accounts name in the same group, most first: "Named in n of the counts.accounts accounts recorded here (group): names". `group` is the group's label when the question has several groups, else null; a name under "Gained" in one account and "Lost" in another never counts as agreement.
- `over_time` (or null): the answer's tenures (published lines dated as a range), one row each on a shared axis, the longest 12, by start: `{ rows[{ phrase (the group label), name, url, detail, when, according_to[] (names), status, left, width, point }], ticks[{ left, label }] }`. It is drawn like an entry's life line.
- `disputed`, `drafts`: `{ lines[], more }`. Drafts are never counted, and neither are disputed lines.
- `further[]`: up to 3 pages of the same question about entries this answer names, `{ title, url, links, accounts, counts }`. `ask_next[]`: the other questions' pages about the same subject, same shape.
- `sources[]`: as on entity pages; footnotes `#src-<n>` number in page order (record, accounts, Disputed, drafts). `methodology`: the `paths.yaml` version.
- A line: `{ edge_id, other (node), phrase, group, when, detail, according_to[], tier_label, cross_confirmed, status, reason, note, refs[], quote, form }`.
  - `phrase` reads from `other` toward the subject: "founded", "invested in", "caused", "led to".
  - `when` is the link's date or, for a link with no time of its own between two entries of the same type (an event caused by an event), the other entry's dates; a label or null.
  - `quote`: in an account column, only words from a source that speaks for that account (its `voice` or `author`); elsewhere the line's first quote; or null.
  - `tier_label`: the strongest source's tier. In an account column, another account's own sources do not count.
  - `form`: null, or `{ node, label: "as the Bolsheviks (until 8 Mar 1918)" }` when the line was recorded about an earlier form of the subject.
  - `about`: null, or the node a line is about when a group's `via` reached it: "BlackRock disputes a finding of <study>" on a page about an event.
- Every page prints its scope line and the fixed notice "A connection is not evidence of wrongdoing."; "and N more" links go to `question.explore_url`.

`questions.html` (`/q/<q>/`): `question` (`{ id, ask, label, title, shows, not, url, route, subjects }`, `title` with "…" in its blanks), `pages[]` (up to 100: `{ title, url, counts, story_url }`) and `more`.

`type.html` (`/t/<type>/`): `type` (`{ id, label, plural }`), `total`, and `letters[]`: `{ letter, url, items[{ node, when, summary }] }`, A to Z by name (`#` for names that do not start with a letter), `url` the letter's anchor. Past 500 entries the type is `split`: its page gets the letters without items, each `url` is the letter's page (`/t/<type>/<letter>/`, `other` for `#`), and each letter's page also gets `letter`, its own group.
