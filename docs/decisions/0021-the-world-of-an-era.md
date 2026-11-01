# ADR-0021: The Map's era slider draws the world of that year

- Status: accepted (Sprint 20)
- Date: 2026-11-01

## Context

[ADR-0020](0020-historical-borders.md) cut only the polities a story names, and said to revisit that when the Map needs borders. The Map's Earth view has an era slider that only faded dots. Picking 1500 still showed today's countries, which is the wrong world, as it was for the stories.

The slider's stops were also a poor fit. One even step had to span 5,000 years, so it was a century wide, while half of our dated entries start after 1960.

- **A polity file per polity will not do here:** a map of one year needs every polity of that year, not the ones a story names.
- **The whole of Cliopatria is 170 MB,** so it cannot be what a phone loads.
- **Today's borders are contested,** and ADR-0020 kept them out until they get their own decision.

## Decision

1. **One file per year:** `content/borders/world-<year>.json`, cut by `tools/borders.py`. It holds every polity of that year, largest first, each with a name, a shade and a point for its name. It is an ordinary borders file, so `ctd check` reads its source and the build copies it.
2. **Thirty years, from 3000 BCE to 1990.** Files are at most 180 KB, about 53 KB compressed, and 2.7 MB in all.
3. **The slider's stops are fixed years, closer together as history comes closer:** 500 years apart in antiquity, 100 from 1000, 25 from 1800, 10 from 1900. An era is two stops wide, and the Earth draws the year in its middle. `TICKS` in `web/src/world/era.ts` and `WORLD_YEARS` in `tools/borders.py` have to match.
4. **After 1990 the basemap stays,** with its modern borders and names, and the era note says nothing about borders.
5. **One grey, three shades:** a polity keeps its shade from year to year. Names are italic, so they read as different from our entries. The basemap's borders and names step aside while a year is drawn.
6. **Relations are drawn as their members, and an empire with members is drawn whole.** Cliopatria files a personal union or an alliance as a row of its own, on top of its members, so taking every row would stack shapes and long names like "Personal union of Kingdom of Poland with Kingdom of Hungary".
7. **Three plain names:** the Soviet Union, the United States and Cuba, as in the story files. Other names are Cliopatria's, without its parentheses.
8. **Every map says what it is:** the era bar reads "Approximate borders of 1960: Cliopatria".

## Rejected

- **Every polity in every year, or vector tiles of them:** far more data, and a service to run, for a slider that shows one year at a time.
- **A colour per polity:** the site has one accent, and hundreds of colours would say nothing.
- **Worlds up to 2024:** see ADR-0020. Cliopatria's Russian Federation includes Crimea from 2014.
- **Sharing the slider's ticks through the build:** one more field to carry two short lists that change together about never.

## Consequences

- 30 more files in the build. A full drag of the slider can load all of them, about 800 KB compressed.
- The slider has 34 stops instead of about 20, and the map of links uses the same ones.
- Neighbours simplified apart leave small gaps when zoomed in close. The Earth says "approximate", and that is what it means.
- Stories could use these files as a backdrop, but do not yet.

## Revisit when

- We decide how to draw contested present-day borders.
- A story wants the whole world behind its map.
