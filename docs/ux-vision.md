# UX vision: ask how anything connects, see the proof

> This page is the design brief; it beats any earlier styling decision. Rewritten 2026-11-01, twice: the Apple Books look (ADR-0014) gave way to dots and lines ([ADR-0022](decisions/0022-dots-and-lines.md)), and then to black on white with colour only on the dots ([ADR-0024](decisions/0024-black-on-white.md)).

## The product in one line

**Ask how anything connects. See the proof.**

## Focus: one box ([ADR-0028](decisions/0028-one-box.md))

The header on every page holds the mark and one box. Type a name, two names, a year or a question, and you get the answer with its proof. Home opens on one name and the written stories it runs through.

| What an answer leads to | What it is |
|---|---|
| **Stories** | Every answer can be read as a story, a column of words over the dots where it happens. The Stories page draws them as islands of dots, with a plain list beside it. Any name in a story is a door to that entry. |
| **The Map** | The whole record as one surface: every story an island, every entry a dot. Pick one and its links draw in ink while the rest steps back; "On Earth" moves whatever has a place to it ([ADR-0034](decisions/0034-one-map.md)). |
| **Ask** (`/ask/`) | Any name, two names, a year or a question. For two names: a direct tie first, with its caveat, then the way between them, stop by stop, with the proof for every link. |

Each job has one view ([ADR-0031](decisions/0031-fewer-views.md)): Explore, Connect and the route stories are gone, and their old addresses forward to Ask or Stories. The header holds the box and two plain links: Stories and Map. The footer adds Ask and About. Home opens on Ask and Stories, shows the Map beside the thread, and lists every way in.

Entity pages are the "book pages" these lead to:
- a cover;
- one paragraph;
- "Read the story";
- at most three cards that matter for this entry: family ties, life line, holdings, how each side tells it;
- links, with the lens control on their heading (the only control on the page);
- the timeline, the proof and the page history as folded rows, opened on request. A footnote link opens the proof.

## Say no

No social features, no editor, and no seven-lens control panels in the MVP UI. No colour without a meaning. No jargon: users see "primary record", "link", "proof", "both sides agree", "one side's account", never T1, claim, edge or tier.

## Materials and type

- **The idea:** dots and lines, black on white ([ADR-0024](decisions/0024-black-on-white.md)).
- **Colour only on the dots.** Each kind of thing has its ink (`content/schema/layers.yaml`). Text, links, buttons, bands and rules are black, white and grey, so a colour always means something.
- **One left edge.** The header and every page hang from one column. The Map takes the whole window; the header keeps its place ([ADR-0032](decisions/0032-one-look.md)).
- **Rules, not cards.** Grouped things sit between hairlines. A card is only for something floating over a map or picture.
- **Links inside text are underlined,** since colour no longer marks them.
- **Contrast:** every text keeps 4.5:1 on what is behind it (3:1 from 24 px, or 18.66 px bold). Text that steps back turns to the secondary, never fainter. `node tools/qa/sweep.mjs --a11y` checks every page.
- **Highlight** for quoted proof only: a grey behind the words.
- **Type:** Bricolage Grotesque for titles, set large and tight; Literata for reading; the system's own face for controls. The first two are hosted here. The basemap's country and capital names are drawn with its own glyphs until we host it ourselves.
- **Shapes:** books have a spine (3 px on the left, 8 on the right). Buttons and fields are 8 px.
- **One look on every page, in every mode: black on white** ([ADR-0032](decisions/0032-one-look.md)). Black is ink, never a large fill: a story opens on its title set large on white, covers are white with a hairline, and the footer is white under a rule.
  - "Being verified" is a dashed neutral outline.

## Covers

Every entry and story has a cover, like a book:
- a licensed photo when we have one;
- otherwise a generated constellation drawn from the entry's own links, deterministic and unique.

Covers make the shelf on the home page and the header of each entry.

## Motion

Motion only shows continuity or answers an action:
- the way between two names drawing itself on Ask;
- the camera moving from globe to dot;
- a dot opening into its page.

One orchestrated moment per screen. Reduced motion is respected.

## Honesty is the design

- Contested stories show the sides in equal-weight columns, plus what both sides' records confirm.
- Every line has a "proof" affordance: the sentence, the date, the quote, the source, the archived copy.
- Every way between two names carries "a connection is not evidence of wrongdoing".

## The demo

Type *Bill Gates* and *IBM*; Ask draws the route (Gates → his mother Mary Gates → the United Way board → IBM's chairman → the 1980 deal), each step with its proof. Then zoom out to the planet: the 20th century as one connected map.
