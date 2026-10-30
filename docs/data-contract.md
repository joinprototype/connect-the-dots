# Build output contract (v0)

`ctd build` writes `dist/`. The web code (islands, explorer, story player, world viewer) reads only what is described here, plus the world tiles in [world-tiles.md](world-tiles.md). Change this contract and the web code (`web/src/lib/types.ts`) in the same change.

## Files

```
dist/
  index.html                 home (Ask, story shelf, index)
  e/<id>/index.html          entity page             e/<id>/story/index.html     its life story
  e/<alias>/index.html       redirect page for a slug alias (also in _redirects)
  p/<a>--<b>/index.html      route story for a featured pair (content/featured.yaml)
  q/<q>/index.html           a question's index: its richest answers (a route question lists the route stories)
  q/<q>/<id>/index.html      the answer to question <q> about entity <id>   q/<q>/<id>/story/index.html   its story
  c/index.html               Stories library         c/<id>/index.html           written chapter
  x/index.html               explorer                w/index.html                world map
  404.html
  about/index.html           how the site works: the proof marks, the questions and their scope, the methodology
  _redirects                 "/e/<alias>/ /e/<id>/ 301", one line per slug alias
  _headers                   security headers and the Content-Security-Policy for every file (Cloudflare format)
  t/<type>/index.html        every entry of one type, A to Z (past 500, its letters; t/<type>/<letter>/ lists one)
  data/schema.json           the vocabulary: types, relations, lenses, tiers, questions, methodology, route stories
  data/graph-slim.json       every entry and link, structure only: what the explorer draws and routes price
  data/e/<id>.json           one entry's words and proof, loaded when it is opened
  data/search/index.json     the search files' word ranges      data/search/<n>.json   search entries by word
  data/graph.json            only with `ctd build --graph`: everything in one file, for tools; no page reads it
  world/                     manifest.json, entities.json, {z}/{x}/{y}.bin (world-tiles.md)
  static/site.css            theme CSS and tokens (from theme/static/)
  assets/                    built by web/ (Vite): islands.js|css, explorer.js|css, story.js|css, world.js|css, maplibre-gl.css (loaded by the story maps and the Map's Earth when they first draw a map), chunks/
  build-manifest.json        engine, built, commit, methodology hash, counts
  .ctd-build                 marks the folder as a build, so the next build may empty it
```

An entry gets a life story when it has at least two links that are not withdrawn. A featured pair gets a route story when a route joins them. A question gets a page about an entry when its answer names at least the question's `min` entries or gives two accounts (at most 5,000 pages per question, featured first, then the richest), and that page gets a story when it has two published lines or two accounts. `schema.json` lists the route stories; an entry's detail file names its life story and its question pages.

**Pages load what they show** ([ADR-0017](decisions/0017-pages-load-what-they-show.md)). Entry, question and type pages need no data file. The explorer and the Map's Earth read `schema.json` and `graph-slim.json`, and the explorer loads an entry's `e/<id>.json` when a panel shows it or its links. A story reads its own data from its page and `schema.json`. Search and Ask read `search/`. No page reads `graph.json`; the QA sweep fails one that does. All of `data/` is served with `Cache-Control: public, max-age=300, stale-while-revalidate=86400`.

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
  "questions": [ {                                        // content/schema/questions.yaml, in Ask-picker order
    "id": "behind", "ask": "Who is behind {x}?",          // {x} = the subject; a route question has {a} and {b}
    "label": "Who is behind",                             // the words before the first blank: the picker's segment label
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

## `data/e/<id>.json`

One entry's words and proof, loaded when the explorer opens the entry or shows one of its links:

```jsonc
{
  "id": "blackrock", "summary": "American asset manager founded in 1988.", "aliases": ["BlackRock, Inc."],
  "story": "/e/blackrock/story/",        // its life story, or null
  "asked": [ { "q": "behind", "title": "Who is behind BlackRock?", "url": "/q/behind/blackrock/",
               "links": 9, "accounts": 0, "counts": "9 links" } ],   // the question pages about it
  "links": [ { "id": "blackrock#c3", "sources": [ { "id": "…", "at": null, "quote": "…" } ],
               "detail": "$240M", "qualifiers": { "amount": 240000000, "currency": "USD" }, "note": "…", "reason": "…" } ],
               // detail, qualifiers, note and reason only when set
  "sources": { "…": { /* as in "Entries, links and sources" */ } }   // the sources its links cite
}
```
- **Its links:** every link touching the entry, both directions. A hub keeps the 100 strongest of each kind (relation and direction), ranked as answers rank them (`methodology` cost); the rest are in the slim file, and a link past the cap of one end is in the other end's file. Its entry page lists the same links, with "and N more" opening the explorer.
- **Never in it:** an entry's `background` lines (ADR-0016).

## A story's own data

A story page embeds the entries, links and sources its scenes name, beside its shots (`script.ctd-story-data`, see "Chapter" below): `{ "nodes": [...], "edges": [...], "sources": {...} }` in the shapes above, with links in full. Its entries are the scenes' `focus`, `perspective`, `reveal`, `places` and `routes`, and the ends, accounts and quoted speakers of the links its scenes reveal (`reveal_claims`). Its sources are those links' and the overlays'. The player reads this and `schema.json`, and nothing else.

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
- `q` (entity entries only, present when non-empty): the ids of the questions with a page about this entry, in `questions.yaml` order. The Ask form uses it for names it does not embed.
- `when` (entity entries only): the entry's dates as a label, or null. "Which one?" lists show it.
- A question page's `aliases` are its question asked with the subject's other names, so "Who is behind Facebook?" finds Meta's page.
- A question entry's `name` is the asked sentence, its `summary` its counts ("7 links, 6 accounts"). Code that wants only entities filters out `chapter` and `question` entries.

## `data/graph.json` (only with `ctd build --graph`)

Everything in one file, for tools and tests: `schema.json`'s fields, plus every node (with `summary` and `aliases`), every edge in full and every source, `questions[].pages` (the answer pages by entity id: `title`, `url`, `links`, `accounts`, `story`) and `stories.entities` and `stories.questions` (the ids with a life story, and the `<q>/<id>` answers with a story). No page reads it.

## Page markup the scripts rely on

Every page's `<head>` carries link-preview tags made from its own title and description blocks: `og:title`, `og:description`, `og:type` ("website"), `og:site_name` and `twitter:card` ("summary"). A question page's description ends with the notice.

All reading pages load `/static/site.css`, `/assets/islands.css` and `/assets/islands.js` (`type="module"`). The CSS variables in `site.css` are the design tokens. Every color has a light and a dark value (`prefers-color-scheme`):
- surfaces: `--paper` (the page), `--paper-2` (a grouped area on it), `--sheet` (a card), `--raised` (a field or quote on `--paper-2`), `--selected` (the chosen segment of a control), `--fill` (tracks, badges and quiet buttons on a sheet), `--cover`;
- text and lines: `--ink`, `--ink-2`, `--muted`, `--rule`, `--contour`;
- accent: `--accent` (links, selection, focus, the active path), `--accent-ink`, `--accent-soft`, `--accent-fill` and `--accent-fill-hover` (filled buttons with white text);
- `--highlight`: quoted proof (yellow on light, blue-gray in dark mode);
- canvases (explorer, world, story): `--night`, `--night-2`, `--night-ink`, `--night-muted`, `--night-rule`;
- layers: `--layer-<layer-id>` (set by `base.html` from `layers.yaml`, one value for both modes);
- fonts: `--font-display`, `--font-body`, `--font-ui`, `--font-mono`;
- misc: `--radius`, `--shadow`, `--shadow-lift`, `--measure`, `--gutter`.

`site.css` also supplies the base rules the scripts' markup relies on: border-box sizing, `[hidden]` (`display: none !important`), `.sr-only` (visually hidden, still read aloud) and a reduced-motion reset (no animations or transitions when `prefers-reduced-motion: reduce`).

**Islands** (custom elements, light DOM):

| Element | Behaviour |
|---|---|
| `<ctd-search>` | Enhances the server's `<form role="search"><input>` (without JavaScript it submits to `/x/?focus=<text>`). Reads `search/` (the entries for the typed words); Enter or click goes to the result's `url`. On the explorer and world pages (`html[data-ctd-explorer]`) it first dispatches a cancelable `ctd:focus` `{id}`; a page that can show the entry calls `preventDefault()` and the search stays put. |
| `<ctd-lens-chips focus="<id>">` | Holds server-rendered chips, `button[data-lens][data-layers]` (`data-layers`: the lens's layer ids, space-separated), so it needs no data file; without chips it builds them from `schema.json`. Clicking dispatches `ctd:lens` `{lens}` on `document`, hides `li.claim` items whose `data-layers` miss the lens layers (and any `.claim-group` left empty), and keeps `?lens=` in the URL. Lens `all` shows everything. |

**Entity page:** a person's page may open with a "Background" card: the links whose relation has `background: true` (born in, citizen of, educated at), and the entry's `background` lines, each with footnotes. Background lines are on that page only. They are in no data file (`graph-slim.json`, `e/<id>.json`, `search/`, a story's data and shots, nor `graph.json`), by rule ([ADR-0016](decisions/0016-who-a-person-is.md)), and a test checks it.

**Entity page:** the one a legal record is about gets a "Legal records" card ([ADR-0018](decisions/0018-legal-records.md)): its links on `legal` relations, grouped by `case`, each case's steps in date order, then the `caveat` of each relation it holds.

**Entity page:** a work with a `finding`, and anyone who disputes one, gets a "The debate" card ([ADR-0019](decisions/0019-disputing-a-finding.md)): the finding, then who disputes it and what it disputes, by date, each in its own words, then the relation's `caveat`.

**Entity page:** no tabs. Timeline, Proof and Page history are `details.fold` sections (`#timeline`, `#proof` with `li#src-<n>`, `#history`). A small inline script opens the fold that holds the URL's hash target, so footnote links (`#src-<n>`) work. No island is involved.

**Explorer:** `/x/index.html` contains `<div id="explorer-root"></div>` (optional `data-world`: the world URL, default `/world/`) and loads `/assets/explorer.js` and `/assets/explorer.css`. Its state lives in the query string:
- `focus`: entity id, name or alias;
- `lens`: lens id;
- `p`: perspective entity id, `facts` or `all`;
- `t`: decimal year;
- `from`, `to`: route ends (id, name or alias);
- `view`: `graph` (default) or `world`.

**World map:** `/w/index.html` contains `<div id="world-root" data-src="/world/"></div>` and loads `/assets/world.js` and `/assets/world.css`. Query: `view` (`earth`; Links when absent), `src` (another same-origin world), `focus` (entity id), `stats=0|1`, `labels=0`, `rs` (dot size factor), `soak=1&soakSec=<n>` (soak test).
- A switch where the title would be, "Links | Earth", picks the view and keeps it in the URL (`?view=earth`; Links has no `view`). Synthetic worlds and the explorer's world mode show Links only.
- **Links** draws the world tiles ([world-tiles.md](world-tiles.md), which has the field details):
  - It opens on the manifest's `bounds`, and ⌂ returns there.
  - Zoomed out it names the manifest's `regions`; clicking a name flies to it. Zooming in fades the names out and the dots' own names in.
- **Earth** (`?view=earth`) draws the entries in `graph-slim.json` that have `coords` (their own or their place's) on a MapLibre globe, with the story maps' calm OpenFreeMap basemap, so like them it fetches from `tiles.openfreemap.org` (ADR-0014). MapLibre and `/assets/maplibre-gl.css` load only when Earth is opened.
  - One dot per spot: entries with the same `coords` (to about 100 m, such as an entry and its `place`) share it. It is named after the entry with coords of its own, else the best-connected one, and is a little bigger where more entries are. Gray; the accent marks the selected one.
  - It opens on the whole planet, turned to where the spots are, and ⌂ returns there. With `focus`, it centres the entry's spot and opens the entry's card.
  - Site search shows an entry there when it has a place; for the others it opens their page.
- An era slider (one range input, "All time" at its right end) appears when entities have `start` dates, and serves both views. Its eras are two steps wide and one step apart: decades (twenty-year eras) when they fit, wider steps for very long spans, plus "Before …" for the earliest few and "Since …" at the present. Dots whose dates miss the era, and undated ones, fade but stay (an Earth spot fades when none of its entries meets the era). The era is not kept in the URL.
- Clicking a dot opens its card: "Open page ›" (the entry's `url`) and "Explore" (`/x/?focus=<id>`). On the Earth the card is the spot's named entry (or the `focus` entry), followed by "Also here": the spot's other entries, each a link to its page.

**Stories:** written chapters (`/c/<id>/`) and generated stories (`/e/<id>/story/`, `/p/<a>--<b>/`) share one template:
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

**Listen** (in watch mode, off unless the viewer turns it on) reads each child of a step's `.step-card` aloud as plain text, one utterance per paragraph, with the browser's own speech (Web Speech API), leaving out `p.step-time` and `p.step-explore`. The narration HTML is what is heard. Then it reads the scene's quote card: "In their words:" and the quote, then its caption (who said it), or "The source says:" and a proof card's quote. The viewer's choice is kept in `localStorage` under `ctd-listen` (`1` or `0`).

Shot fields (from the chapter's `scene` blocks, or generated; the build adds `t`, `time_label` and `narration_html`). A `reveal_claims` entry `<entity>#<claim>` matches that edge and any `<entity>#<claim>/<n>` edges:

| Field | Meaning |
|---|---|
| `shot` | Shot name |
| `view` | `map`, `graph` or `timeline` |
| `camera` | `{ center: [lon, lat], zoom, pitch?, bearing?, globe?: bool, duration?: seconds }` |
| `focus` | Entity id |
| `lens` | Lens id |
| `perspective` | Entity id |
| `time` | EDTF string; the build adds `t` (decimal year) and `time_label` |
| `reveal` | `[entity ids]` |
| `reveal_claims` | `["<entity-id>#<claim-id>"]` |
| `places` | `[place ids]` to mark on the map |
| `routes` | `[[place-id, place-id], …]` lines to draw on the map |
| `overlay` | `{ kind: "source"\|"quote"\|"image", source?, quote?, image?, caption? }` |
| `narration` | Markdown |
| `duration` | Seconds in watch mode; with Listen on, the scene also waits for its narration to be read |
| `explore` | Show the "Explore from here" button, which links to `/x/?focus=&lens=&p=&t=` |

**The map view** flies to each shot's `camera` and marks its places. Once the camera settles, no marker (dot or name) is left under the quote card, the time pills or the controls: the map moves as little as it can, up or left, or, when no small move does it (on a phone the card spans the width), zooms out until every marker fits the room left. Where a marker names a place, the basemap does not name it again.

**The graph view** keeps what earlier shots revealed and draws the world as of the shot's `t`: what has not begun is hidden, and what is over is faded.
- **A shot's own reveals are never faded.** What a shot itself reveals (`reveal`, `focus`, the ends of `reveal_claims`) is its subject, so its `t` never hides or fades it.
- **The camera frames that subject.** The camera frames those entries, not everything shown so far.
- **The camera avoids what covers the stage.** The time pills and the quote card sit over the stage, and so do the controls on phones. The camera keeps the subject clear of them, and names are never placed under them.
- **Names never overlap.** They go right of the dot, else left, above or below; a name that fits nowhere whole is left out.
- **Link labels are few and short.** Only the shot's own links carry a label, and only when it adds three or fewer. The label is the bare phrase.

**Events between scripts** (CustomEvents on `document`):
- `ctd:lens` `{lens}`
- `ctd:time` `{t}` (decimal year or null)
- `ctd:focus` `{id}`: the explorer sends it when its focus changes; the explorer and the world viewer listen. Site search sends it cancelable (see `<ctd-search>`); the other events are not cancelable.

## Template context (engine → `theme/templates/`)

Every template gets `site` (`title`, `tagline`, `dev`, `assets`, `lenses`, `layers`, `manifest`). Withdrawn links never reach `dossier` or any story.

`entity.html`:
- `entity`: `id`, `name`, `kind`, `type_label`, `summary`, `when` (label), `aliases`, `same_as` (`key`, `value`, `url`), `place`, `image`, `body_html`, `rel_path`, `url`, `story_url`, `coords`, `cover` (SVG), `evidence_line`. `coords` is `[lon, lat]` as in `graph.json` (its own, or its place's) or null; when set, the page links "On the map ›" to `/w/?view=earth&focus=<id>`.
- `groups[]`: `{ phrase, layers, items[], more }`, one group per phrase; `more` counts a hub's links of that kind past its 100 strongest (on the kind's last group), which the explorer shows. An item is one link: `edge_id`, `phrase`, `outgoing`, `other` (`id`, `name`, `kind`, `type_label`, `url`), `when`, `detail`, `according_to[]` (`id`, `name`, `url`), `tier_label`, `status`, `cross_confirmed`, `passive`, `layers`, `refs` (source numbers), `note`, `reason`. On a family link the owner's page gets the phrase `"<role> of"` (lowercase, e.g. "mother of") and a `detail` without the role; the other person's page gets the inverse and a `detail` that starts with the role.
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

`chapter.html`: `chapter` (`id`, `title`, `subtitle`, `summary`, `authors`, `intro_html`, `outro_html`, `shots_json`, `data_json` (the story's own data), `steps[]`, `shot_count`; generated stories add `generated`, `back` and `explore_url`) and `history`. A question story's `subtitle` is its scope line, its `intro_html` the notice and its `back` the question page.

`home.html` also gets `questions[]`, one per question in Ask-picker order: `{ id, ask, label, route, subjects, shows, not, url, names[], more, try[] }`.
- `shows` and `not` are full sentences ("Shows ….", "Not ….").
- `names[]` (up to 100, featured first, then the richest; `[]` for a route question): `{ id, name, aliases, url }`, where `url` is the answer page. `more`: pages not embedded (find them through the search entries' `q`).
- `try[]`: the featured pages for this question, `{ id, name, url }`, `name` as it reads in a sentence ("the Bolsheviks").
- A name whose type is not in `subjects` is not asked about ("Not asked about people"); a subject with no page has no sourced answer yet.

`chapters.html` also gets `questions[]`, the Questions shelf (question stories, featured first, then the richest, at most 24): `{ title, subtitle, url, kind: "Question", cover }`, and `questions_more`.

`question.html` (`/q/<q>/<id>/`); a node is `{ id, name, kind, type_label, color, url }`:
- `question`: `{ id, ask, label, title, shows, not, url, index_url, story_url, explore_url }`. `title` is the asked sentence ("Why did the dissolution of the Soviet Union happen?"); `shows` and `not` are full sentences; `story_url` may be null; `explore_url` is `/x/?focus=<id>`.
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
