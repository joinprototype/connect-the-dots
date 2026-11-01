# Borders

Historical borders. A story draws polity files on its maps: one polity, one feature per period. The Map's era slider draws `world-<year>.json`: every polity of that year, largest first.

## Credit

These files are adapted from [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria) version 0.2.1, by the Seshat Global History Databank, licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/).

**Changes made:** the polity files keep only the polities listed in `tools/borders.py`, for the years our stories need. `russia.json` joins Cliopatria's "Russian Empire" and "Russian Republic" under one plain name. The world files keep 30 years from 3000 BCE to 1990: a relation (an alliance, a personal union) is drawn as its members, an empire with members is drawn whole, parentheses are dropped from names, and three names are made plain (the Soviet Union, the United States, Cuba). In both, outlines are simplified and small islands are dropped.

`russia.json` stops at 1917: Cliopatria has no polity at Moscow in 1918 and 1919, so a story shows no Russian borders for those years rather than a wrong one.

Cliopatria's authors say their maps reflect one version of the territory a polity held. These shapes are approximate, and every map that draws them says so.

## Remaking them

Download `cliopatria.geojson.zip` from the repository above, unzip it, then:

```bash
python3 -I tools/borders.py cliopatria.geojson content/borders
```
