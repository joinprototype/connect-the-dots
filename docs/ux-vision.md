# UX vision: ask how anything connects, see the proof

> This page is the design brief; it beats any earlier styling decision. Rewritten 2026-11-01: the Apple Books look (ADR-0014) gave way to dots and lines ([ADR-0022](decisions/0022-dots-and-lines.md)): warm, lively, made with love.

## The product in one line

**Ask how anything connects. See the proof.**

## Focus: three places only

| Place | What it is |
|---|---|
| **Ask** (home) | One question field and a shelf of story covers. Questions: "How are A and B connected?", "Who is behind X?", "Why did X happen?", "Who benefited from X?" |
| **Stories** | Every answer plays as a story: written chapters, generated entity stories, generated path stories. Scroll or Watch; pause anywhere; "Explore from here". |
| **Map** | The eagle view: one continuous zoom from planet (eras, regions) to a single dot and its proof. Starts from a topic or question, never from the full hairball. |

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

- **The idea:** dots and lines. A thick line runs through routes and story progress, and every dot has a colour.
- **Palette:** white paper, deep indigo ink `#171a3a`, secondary `#565a80`, separators `#cfd2e8`.
- **Print inks,** each with a job:
  - tomato for people, cobalt for power, teal for money, sky for science and tech, amber for history, plum for ideas and faith, leaf for places (`content/schema/layers.yaml`);
  - each story takes one ink by its id, for its cover, header and scene titles;
  - cobalt `#2346d6` for links, tomato `#d4351f` for the one thing to press.
- **Contrast:** every text keeps 4.5:1 on what is behind it in both modes (3:1 from 24 px, or 18.66 px bold). Text that steps back (an ended link, an empty lens, an entry outside the picked era) turns to the secondary or a light fade that still keeps 4.5:1, never fainter. `node tools/qa/sweep.mjs --a11y` checks every page.
- **Highlighter** only for quoted proof: sun yellow `#ffe27a` on paper, a soft blue `#2d3f7d` in dark mode. Never yellow on black. Founder, 2026-10-17: "yellow on black is hard to see, hurts my eyes".
- **Type:** Bricolage Grotesque for titles and controls, set large and tight; Literata for reading. Both hosted here. The basemap's country and capital names are drawn with its own glyphs until we host it ourselves.
- **Shapes:** books have a spine (6 px on the left, 14 on the right), buttons are pills, cards are 16 px.
- **Stories read on white,** in every mode: long reading needs paper (founder, 2026-11-01).
- **Dark mode** follows the system setting everywhere else, in deep indigo.
  - No yellow or other warm accent text on dark backgrounds.
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
