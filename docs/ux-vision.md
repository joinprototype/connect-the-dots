# UX vision: ask how anything connects, see the proof

> This page is the design brief; it beats any earlier styling decision. Rewritten 2026-11-01, twice: the Apple Books look (ADR-0014) gave way to dots and lines ([ADR-0022](decisions/0022-dots-and-lines.md)), and then to black on white with colour only on the dots ([ADR-0024](decisions/0024-black-on-white.md)).

## The product in one line

**Ask how anything connects. See the proof.**

## Focus: four places only

| Place | What it is |
|---|---|
| **Ask** (home) | One question field and a shelf of story covers. Questions: "How are A and B connected?", "Who is behind X?", "Why did X happen?", "Who benefited from X?" |
| **Stories** | Every answer plays as a story: written chapters, generated entity stories, generated path stories. Scroll or Watch; pause anywhere; "Explore from here". |
| **Map** | The eagle view: one continuous zoom from planet (eras, regions) to a single dot and its links. Click a dot and its web appears. |
| **Connect** | Any two of the million, and the way between them, drawn stop by stop and on the Map. |

Entity pages are the "book pages" these three lead to:
- a cover;
- one paragraph;
- "Play the story";
- at most three cards that matter for this entry: family ties, life line, holdings, how each side tells it;
- links, with the lens control on their heading (the only control on the page);
- the timeline, the proof and the page history as folded rows, opened on request. A footnote link opens the proof.

## Say no

No social features, no editor, and no seven-lens control panels in the MVP UI. No colour without a meaning. No jargon: users see "primary record", "link", "proof", "both sides agree", "one side's account", never T1, claim, edge or tier.

## Materials and type

- **The idea:** dots and lines, black on white ([ADR-0024](decisions/0024-black-on-white.md)).
- **Colour only on the dots.** Each kind of thing has its ink (`content/schema/layers.yaml`). Text, links, buttons, bands and rules are black, white and grey, so a colour always means something.
- **One left edge.** The header and every page hang from one column (`--page`). The Map and the explorer take the whole window, and the header goes with them.
- **Rules, not cards.** Grouped things sit between hairlines. A card is only for something floating over a map or picture.
- **Links inside text are underlined,** since colour no longer marks them.
- **Contrast:** every text keeps 4.5:1 on what is behind it in both modes (3:1 from 24 px, or 18.66 px bold). Text that steps back turns to the secondary, never fainter. `node tools/qa/sweep.mjs --a11y` checks every page.
- **Highlight** for quoted proof only: a grey behind the words.
- **Type:** Bricolage Grotesque for titles, set large and tight; Literata for reading; the system's own face for controls. The first two are hosted here. The basemap's country and capital names are drawn with its own glyphs until we host it ourselves.
- **Shapes:** books have a spine (3 px on the left, 8 on the right). Buttons and fields are 8 px.
- **Stories read on white,** in every mode, and open on a black band: long reading needs paper (founder, 2026-11-01).
- **Dark mode** follows the system everywhere else, on black.
  - "Being verified" is a dashed neutral outline in both modes.

## Covers

Every entry and story has a cover, like a book:
- a licensed photo when we have one;
- otherwise a generated constellation drawn from the entry's own links, deterministic and unique.

Covers make the shelf on the home page and the header of each entry.

## Motion

Motion only shows continuity or answers an action:
- the route drawing itself;
- the camera moving from globe to dot;
- a dot opening into its page.

One orchestrated moment per screen. Reduced motion is respected.

## Honesty is the design

- Contested stories show the sides in equal-weight columns, plus what both sides' records confirm.
- Every line has a "proof" affordance: the sentence, the date, the quote, the source, the archived copy.
- Every route carries "a connection is not evidence of wrongdoing".

## The demo

Type *Bill Gates* and *IBM*; the route draws itself (Gates → his mother Mary Gates → the United Way board → IBM's chairman → the 1980 deal), each step with its proof. Press Play to watch it as a story. Then zoom out to the planet: the 20th century as one connected map.
