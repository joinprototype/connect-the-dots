# ADR-0032: One look, everywhere

- Status: accepted
- Date: 2026-11-03

## Context

ADR-0024 made the site black on white, with dark mode the same on black. Stories were then set to read on white in every mode, and opened on a black band. So in dark mode the site was black until a story, which turned white; in light mode a story opened on a band of black over most of the first screen, and the story covers and the footer were black blocks too. Moving between pages, the founder found the site flipping from black to white and back, and could not tell what it was meant to be.

The Map also took the whole window and widened the page column with it, so the header's links moved about 130 px sideways on the Map and back on every other page.

## Decision

1. **One look on every page, in every mode: black on white.** Dark mode is gone; the system's setting no longer changes the site (`color-scheme: light`).
2. **Black is ink, not a fill.** Text, lines, dots' rings and small controls are black. No large area is: a story opens on its title set large on white, with the thread running through it; covers are white with a hairline, the title in black and the dots in colour; the footer is white under a rule; "Keep reading" and the Stories card are outlined.
3. **The header keeps its place.** It hangs from its own fixed column (`--column`), so a page that uses the whole window, like the Map, still has the header where every other page has it.

## Consequences

- Amends ADR-0024: its rules 1 (dark mode on black), 3 (the header goes with the Map) and 5 (black bands and covers) no longer hold. Its colour rule stands: colour only on the dots.
- A reader in a dark room gets a white page. Long reading already asked for paper; now everything does.
- One set of tokens to check: the QA sweep's `--scheme=dark` now renders the same page as light.
