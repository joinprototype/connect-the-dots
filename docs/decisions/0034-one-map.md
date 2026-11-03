# ADR-0034: One map

- Status: accepted
- Date: 2026-11-03

## Context

After ADR-0033 the Map drew only the record that has been read, and it was still a mess. Its Links view pulled all 3,453 entries and 6,550 links into one shape: a few hubs (the US government with 136 links, Congress with 100, the Justice Department with 90) dragged everything into one ball, and the 508 entries with one link or none drifted to a ring around it. Picking a dot drew a ring and an empty card: its own links were lost among the hundreds crossing it. The Earth view read well as geography, but showed no connections, and nearly all its dots were open data.

The record has a shape of its own: every entry is there because a story or an answer needed it. The Stories page already draws that shape (ADR-0030, One Place): every story an island, every entry a dot on it or in the water between, and a picked dot's links drawn in ink while the rest steps back.

## Decision

1. **The Map is the Stories surface, over the whole window** (`/w/`, `map.html`). Same dots, same islands, same stops and addresses as `/c/`; the wheel zooms there, as on any map.
2. **"On Earth" is a second arrangement of the same dots.** One switch moves every dot that has a place to it, over the land drawn as the field of dots behind Read and Ask; the islands step away. A picked dot draws its links to whatever else stands on the Earth, and the words beside it list them all.
3. **What has a place:** an entry's own coordinates, else its `place`'s, else the place a link that `locates` names (a new relation flag: headquartered in, located in, written at; the least connected place, so a city before its country). About 730 of 3,453 entries.
4. **What never does:** a person, a people or a family (types with `family: true`). A person's coordinates are a grave, not a life, and no dot on the Earth may read as where someone comes from (ADR-0016). Nor a sealed entry (ADR-0027). They fade out on the Earth, and opening one brings the islands back.
5. **No nearer than a country** on the Earth, as on Read and Ask: past that the land's dots are few and far apart.
6. The old Map's deck.gl viewer, its Links layout and its era slider leave the Map. Its addresses still work (`?focus=`, `?view=earth`).

## Consequences

- One picture of the record instead of two that disagreed. Connections are always drawn the same way: a picked dot's links in ink, the rest faded.
- The Earth holds about a fifth of the record. The rest is people and ideas, which is honest: they have no place of their own.
- The era slider and the Earth's historical borders are gone from the Map for now.
- The old viewer's code (`web/src/world/`, deck.gl, MapLibre), its tiles, the Earth's open-data tiles and `ctd world` were removed in 0.5.3; the home page's picture of the Map is drawn from the islands (`w/picture.svg`), and the policy no longer lets a page fetch map tiles from elsewhere.
- Amends ADR-0033 (the Map still draws only the record, but as islands and an Earth, not as Links).
