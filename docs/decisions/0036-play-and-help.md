# ADR-0036: A puzzle a day, and missing links to help with

- Status: accepted
- Date: 2026-11-03

## Context

Nothing on the site gave a reader a reason to come back tomorrow, or a way to add to the record short of a pull request. The record's worth is its proof: links a person has read a source for. The founder asked for something fun that people would not want to miss, and for readers to help.

## Decision

1. **The puzzle** (`/play/`): two names a day, the same for every reader, and the reader steps from one to the other by the links a way may use (as `data/ways.json` holds them), each with its proof a tap away. The build picks every day's pair from `content/methodology/play.yaml`: both ends of a type that may open the home page, well known in open data, in a written story free of sealed entries, in no story the rules leave out (deaths and harms are no game), sharing no story, and the fewest links apart that the day asks for. `data/play.json` holds each day's way by the fewest links. A reader's steps stay in their browser; the result is shared as a line of coloured dots, which gives no name away.
2. **Missing links** (`/missing/`): the leads of `ctd gaps` between two entries the record holds, each as a question ("Algeria, member of OPEC?") with "Open data says so" and a link that opens an issue to send a source. Family, background, legal and sensitive links are never asked, nor anything Ask keeps out. Nothing there is on the record: a lead is never proof (ADR-0025), and a sent source goes on the record only after a person has checked it.

## Consequences

- The header gains "Puzzle", and the footer "Missing links". The puzzle's end points to the missing links.
- The dev server has no open data, so it picks puzzles from every end, and has no missing-links page.
- The puzzle's picks change when the record does; a day already played keeps the reader's own steps.
- Each day's way is in `data/play.json`, so a reader who wants to can read ahead. It is a game, not a test.
