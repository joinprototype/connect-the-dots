# Borders

Historical borders that stories draw on their maps. Each file is one polity, one feature per period.

## Credit

These files are adapted from [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria) version 0.2.1, by the Seshat Global History Databank, licensed under [CC BY 4.0](http://creativecommons.org/licenses/by/4.0/).

**Changes made:** only the polities listed in `tools/borders.py` are kept. Their outlines are simplified, small islands are dropped, and their periods are limited to the years our stories need. `russia.json` joins Cliopatria's "Russian Empire" and "Russian Republic" under one plain name.

`russia.json` stops at 1917: Cliopatria has no polity at Moscow in 1918 and 1919, so a story shows no Russian borders for those years rather than a wrong one.

Cliopatria's authors say their maps reflect one version of the territory a polity held. These shapes are approximate, and a story says so.

## Remaking them

Download `cliopatria.geojson.zip` from the repository above, unzip it, then:

```bash
python3 -I tools/borders.py cliopatria.geojson content/borders
```
