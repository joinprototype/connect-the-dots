# ADR-0020: Historical borders: a few polities cut from Cliopatria, drawn by a story's date

- Status: accepted (Sprint 17)
- Date: 2026-10-30

## Context

Borders through time were in the founder's first brief (requirements, item 12). A story about the Soviet Union on a modern map shows Ukraine and Belarus as they are now, which is the wrong world for 1917.

- **The data has to be open,** and the site never needs to ask another server for it.
- **Borders are claims.** They need a source, and they are contested.
- **Phones:** a shape has to arrive quickly.

## Decision

1. **Cliopatria,** from the Seshat Global History Databank: polities year by year, 3400 BCE to 2024, licensed CC BY 4.0. We credit it on every map that draws it, link it, and say what we changed (`content/borders/README.md`).
2. **Only what a story uses.** `tools/borders.py` cuts each polity into `content/borders/<id>.json`, simplified, with one feature per period. The full 170 MB file is not in the repository.
3. **A shot names polities, and its date picks the period:** `borders: [russia, german-empire]`. The first is drawn in the accent, the rest in gray. `ctd check` refuses an unknown file, and warns when a shot's date has no period.
4. **Each file names its source.** It counts as cited, like a quote card's.
5. **Plain names, and a stated limit.** A file may join rows under a plain name ("Russia"). Every map with borders says "Approximate borders: Cliopatria".
6. **No shape is better than a wrong one.** Cliopatria has no polity at Moscow in 1918 and 1919: its "Russian Republic" of those years is only the territory the Bolsheviks did not hold. So `russia.json` stops at 1917, and the Brest-Litovsk scene draws Germany alone.
7. **Check a shape by looking at it.** That gap was found in a screenshot, and no automated check would have caught it. Before a polity goes in, test that its cities fall inside it.

## Rejected

- **All of Cliopatria, or tiles of it:** 170 MB for a few shapes.
- **Filling the 1918 gap by subtracting Germany from Russia's 1917 shape:** that would be our own map, with no source.
- **Modern borders in v1:** Cliopatria's Russian Federation includes Crimea from 2014. Contested present-day borders need their own decision.
- **Names drawn on the map:** a polity's centre is often off-screen. A small key says what each color is.

## Consequences

- `data/borders/<id>.json` is new in the build. Files load only on a story that draws them: the Soviet Union's is 571 KB, 26 KB compressed.
- Stories draw borders on the map view only. The graph is unchanged.

## Revisit when

- A story needs a borders view on the Map or the explorer's time slider.
- A file passes about 100 KB compressed: keep only the periods stories use.
