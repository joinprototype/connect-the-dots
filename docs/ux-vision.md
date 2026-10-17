# UX vision: ask how anything connects, see the proof

> Rewritten 2026-10-17 after founder feedback: "I actually like the stories", "we do not need so many colors… make it like the Apple Books app, simple and usable", "think like Jony Ive and Steve Jobs". This page is the design brief; it beats any earlier styling decision.

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

No social features, no editor, and no seven-lens control panels in the MVP UI. No decorative color, glow or grid. No jargon: users see "primary record", "link", "proof", "both sides agree", "one side's account", never T1, claim, edge or tier.

## Materials and type

- **Palette:** white and Apple gray. Ink `#1d1d1f`, secondary `#66666b`, separators `#d2d2d7`.
  - Secondary is a shade darker than Apple's `#6e6e73`, so it keeps 4.5:1 on the gray and tinted surfaces too: a selected row, a badge, the "both sides agree" card.
- **Contrast:** every text keeps 4.5:1 on what is behind it in both modes (3:1 from 24 px, or 18.66 px bold). Text that steps back (an ended link, an empty lens, an entry outside the picked era) turns to the secondary gray or a light fade that still keeps 4.5:1, never fainter. `node tools/qa/sweep.mjs --a11y` checks every page.
- **One accent,** `#0066cc`, for links, selection, the focus dot and the active path.
- **Highlighter** only for quoted proof, as in Books:
  - yellow `#fde68a` on light paper;
  - a soft blue-gray `#1f374f` in dark mode.

  Never yellow on black. Founder, 2026-10-17: "yellow on black is hard to see, hurts my eyes".
- **Type:** system fonts only. `ui-serif` / New York for reading and titles; `system-ui` / SF for controls. No web-font downloads. The one exception is the OpenFreeMap basemap of the story maps and the Map's Earth view: its country and capital names, and the names on the Earth's dots, are drawn with its glyphs until we host it ourselves ([ADR-0014](decisions/0014-calm-design.md)).
- **Shapes:** rounded cards (12–16 px), soft shadows, generous white space, segmented controls.
- **Dark mode** follows the system setting.
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
