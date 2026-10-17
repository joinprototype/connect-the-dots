# World tiles (v0)

The "open world" is a 2D map of the whole graph, cut into a quadtree of tiles that the browser streams by viewport. Rust writes the tiles (`ctd world`, `ctd build`). The world viewer's Links view (`/w/`) reads only what this file describes; its Earth view (`/w/?view=earth`) reads `graph.json` coords instead ([data-contract.md](data-contract.md), "World map"). Change this contract and the viewer together.

## Files

```
<world>/manifest.json
<world>/{z}/{x}/{y}.bin        one tile; missing file = empty tile
```

`<world>` is `/world/` for the real content and `/world-synth/` for the synthetic test world.

## Coordinates

- **World space** is the unit square: x grows right and y grows down, both in `[0, 1)`.
- **Tile `(z, x, y)`** covers `[x/2^z, (x+1)/2^z) × [y/2^z, (y+1)/2^z)`, for `z = 0 … maxzoom`.
- **Contents:** a tile holds every node whose `minzoom ≤ z` and whose position falls inside it. Refinement is "replace": each zoom level's tiles are complete for that zoom.
- **Zoomed out** (`z < cluster_zoom`), tiles hold cluster super-nodes and meta-edges instead of individual nodes.

## `manifest.json`

```jsonc
{
  "version": 0,
  "kind": "synthetic" | "content",
  "nodes": 100000, "edges": 399900, "clusters": 647,
  "maxzoom": 4, "cluster_zoom": 2, "tile_quota": 1500,
  "palette": ["#2e5c9a", "#b0333f", "…"],   // color index → hex; content worlds use the layer colors (all one gray)
  "palette_labels": ["People", "Power", "…"],
  "built": "2026-10-17T06:49:18Z",
  "build_ms": 1387,
  "stats": { "tiles": 227, "max_tile_nodes": 1500, "max_tile_edges": 8192, "max_tile_bytes": 188028,
             "max_tile_gzip": 91222, "bytes": 21592732 },
  "entities": "entities.json",              // content worlds: node index → { id, name, url, start?, end? }; null on synthetic worlds
  "stability": { "aligned_nodes": 69, "mean_drift": 0.0149 },  // vs the previous build (content worlds); 0 and null otherwise
  "bounds": [0.13, 0.04, 0.87, 0.96],       // [x0, y0, x1, y1] around every node, in world units: the viewer opens on it
  "regions": [ { "label": "OpenAI", "x": 0.354, "y": 0.712, "r": 0.046, "size": 17 } ]   // content worlds, biggest first; [] otherwise
}
```

- **`regions`:** the communities with at least 3 nodes, biggest first (ties: the lower community index), at most 24. Each is named after its best-connected member that is not a person or a family (a type with `family: true`), so a region never reads as someone's territory; a region of people only goes unnamed. Best-connected: the most links, where a link that is one side's account, a draft or disputed counts 0.6 and a passive holding 0.3. `x`, `y` and `r` are the community's disc; `size` counts its nodes. Zoomed out, the viewer shows the names instead of the dots' own names, and says what they are: "Regions are groups of entries with many links between them, named after their best-connected one." A region name marks a place on the map; it is not a claim about who runs what.
- **`entities.json` dates:** `start` and `end` are the entry's own dates as decimal years ([data-contract.md](data-contract.md) "Dates": `end` exclusive, `null` = ongoing), rounded to 0.001. Both are absent when the entry is undated. The map's era slider dims the dots whose dates miss the era, and the undated ones.
- **Orientation:** a content build turns its map to the previous build's orientation (rotation or mirror, 2D Procrustes over shared entity ids; state in `.cache/world-state.json`), then normalises it into the square. The angle is snapped to 1e-4 rad, so an unchanged graph rebuilds byte for byte. Scale and shift are not carried over, so the map cannot shrink over many builds. Builds before this rule had shrunk the content world to about 13% of the square.

A content world draws the same entities and links as `data/graph.json`, except withdrawn links and links on no layer ("not the same as"), so a withheld claim (see [data-contract.md](data-contract.md)) is not in the tiles either.

## Tile binary layout (little-endian)

| Offset | Type | Field |
|---|---|---|
| 0 | `u8[4]` | magic `CTDT` |
| 4 | `u16` | version (0) |
| 6 | `u16` | flags (bit 0: cluster tile, i.e. super-nodes and meta-edges) |
| 8 | `u32` | `n`, the node count |
| 12 | `u32` | `m`, the edge count |
| 16 | `u32` | `label_bytes` |
| 20 | … | arrays below, in order, each padded to a multiple of 4 bytes |

| Array | Type | Meaning |
|---|---|---|
| `x` | `f32[n]` | world x |
| `y` | `f32[n]` | world y |
| `id` | `u32[n]` | node index (cluster index on cluster tiles) |
| `size` | `f32[n]` | radius in world units at zoom 0. The viewer scales and clamps to pixels. |
| `color` | `u8[n]` | palette index |
| `minzoom` | `u8[n]` | zoom where this node first appears; the viewer uses it to fade in |
| `ex0, ey0, ex1, ey1` | `f32[m]` each | edge endpoints, stored inline so no cross-tile lookup is needed |
| `ecolor` | `u8[m]` | palette index |
| `eweight` | `u8[m]` | 0–255 relative weight, for opacity and width |
| `label_offsets` | `u32[n+1]` | byte offsets into the label bytes. A label is empty when it should not be drawn at this zoom. |
| labels | `u8[label_bytes]` | UTF-8 |

**Edge placement:** an edge appears at a zoom once both its ends are visible there, and is stored in the tile of each end. Viewers dedupe by endpoint pair when drawing.

**Budgets (enforced by the writer):**
- `maxzoom` is the first zoom (at least 3) where every tile holds at most 2,500 nodes;
- below `maxzoom`, at most `tile_quota` nodes per tile: the best-connected nodes appear first, the rest at a deeper zoom;
- at most 8,192 edges per tile: node tiles keep the links between the best-connected nodes, cluster tiles the heaviest meta-edges;
- target ≤ 150 KB gzip per tile.
