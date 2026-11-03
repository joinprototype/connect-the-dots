# ADR-0033: The Map draws the record

- Status: accepted
- Date: 2026-11-03

## Context

ADR-0023 put the atlas on the Map: about 996,000 things from Wikidata beside the 3,453 entries written here, so that the Map held a million dots. Nobody here has read their links. Zoomed in, the founder found what that draws: a region of loose topics ("measles", "boron", "Bluetooth") laid out in an even spiral because they link to nothing written, and a hub of hundreds of people joined to one thing by ties like "citizen of". Neither says why the dots are there, and both look like connections that are not.

## Decision

1. **The Map's Links view draws the written record only:** every entry and every published link, each with its proof. It is built from the record alone (`world::from_kb`), and the atlas no longer goes into its tiles.
2. **Open data stays where it is marked as open data:** in the box's search, on its own pages (`/a/`), and as the land in the field of dots behind Read and Ask, where a dot is only a place.
3. An atlas page offers "On the map" only for a thing the Map draws, and a written entry's card on the Map shows its own page and stories, not the open data around it.

## Consequences

- Amends ADR-0023: the atlas keeps its shards, pages and search, but is no longer "the Map's million dots". The home page says the Map holds everything read.
- The Map's tiles shrink from 1,028 files to 78, and a build runs in about 20 seconds.
- The Map will grow only as fast as the record does. That is the point: a dot on it is one somebody has read.
