# ADR-0013: World layout with communities, pivot MDS and alignment

- Status: accepted (Sprint 2); revisit at the next scale step
- Date: 2026-10-17

## Context

The open-world map needs a stable, readable 2D layout for up to millions of nodes, computed on every publish. The plan in ADR-0009 was a Leiden hierarchy with a pinned ForceAtlas2 layout. While building it in Sprint 2 we hit three failures on a 1M-node synthetic world:
1. A force layout of communities scattered small, weakly linked communities into a halo, leaving the real structure a tiny blob.
2. A second Louvain level produced three giant regions plus 95 crumbs.
3. Mega-hubs (like index funds holding stakes everywhere) put every community about two hops from every other, collapsing any distance-based layout.

## Decision

1. **Units:** Louvain communities, one level, deterministic, become the map's units: discs with area proportional to size.
2. **Hubs:** links of hub nodes (more than max(500, n/2000) links) are excluded when computing the layout. They are still drawn on the map.
3. **Community positions:** pivot MDS (Brandes & Pich) over weighted shortest-path distances between communities, where stronger links are shorter.
   - Each connected component is laid out separately; components are packed on a spiral around the largest.
   - Far outliers are pulled in to 1.25× the 90th-percentile radius.
   - Overlaps are then removed.
4. **Nodes:** each community's nodes sit on a phyllotaxis disc, with the most important at the centre.
5. **Stability:** every build is turned to the previous one's orientation with 2D Procrustes over shared node keys (rotation or mirror only, the angle snapped to 1e-4 rad), then normalised into the square. The state lives in `.cache/world-state.json`, and the mean drift (how far previously placed nodes moved) is recorded in the manifest. Sprint 4 dropped the scale and shift fit: it shrank the map a little with every edit (to 13% of the square), and the snapped angle makes an unchanged graph rebuild byte for byte.

## Consequences

- 1M nodes and 3.3M links become a full world in about 1.4 s in Rust. Identical content gives identical worlds, and small edits drift by about 1–2% of the map.
- Communities are discs, so internal structure shows only as rank (hubs at the centre), not as sub-shapes.
- No incremental re-layout yet: the whole map is recomputed and then aligned.

## Revisit when

- Readability inside large communities matters (recursive layout).
- Alignment drift becomes visible to users after real edits.
- Builds exceed about 10M nodes.
