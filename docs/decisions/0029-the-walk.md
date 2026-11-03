# ADR-0029: Explore is a walk

- Status: superseded by [ADR-0031](0031-fewer-views.md): Explore is gone, and Stories moves from dot to dot
- Date: 2026-11-02

## Context

The founder liked how the One Place prototype moved from one thing to the next, found that it wobbled from place to place, and had to click the dots before the first view made sense. `/x/` was a control panel: search, lenses, a route form, tabs, and a graph that ran ForceAtlas2 in the browser for over a second on every load, drew names only where they fitted, and refitted its camera after each click.

## Decision

1. **An entry on the left, the entry as a dot on the right.** Its neighbours sit around it, each named at rest. A click on a neighbour, on the picture or in the list, moves there, and the address follows (`?focus=`), so Back walks back the same way. A click on a line opens its proof.
2. **One straight eased move.** 450 ms, no overshoot, no zoom, no arc, nothing that settles. Reduced motion gets a plain cut.
3. **No dot moves against another.** Every entry uses the same fixed slots around it, and the set of slots is symmetrical through the middle. So whatever slot B has around A, the opposite slot is free for A around B: going from A to B leaves A exactly where it was. The two stops fade, and only the camera moves.
4. **The Map's layout sets the directions.** An entry takes the free slot nearest the way its neighbour lies on the Map, which the build writes to `data/spots.json`. Things that sit together on the Map stay together here, and a pair always faces each other. No layout runs in the browser.
5. **The compositor does the moving.** A stop is plain elements, drawn once. A move is one transform and two opacities, which run with no script and survive a busy main thread. At rest nothing runs. Sigma, graphology and ForceAtlas2 leave this page.
6. **A hub shows its strongest.** As many as there are slots, and the rest in the list. Only named dots have lines.
7. **Fewer controls.** Lenses, accounts, time, a route to another name and the comparison of two accounts fold into one "More" over a corner of the picture. Search is the header's. `/x/?view=world` opens the Map itself.

## Rejected

- **Real positions on the Map, at the Map's scale:** a neighbour can be on the other side of the Map, so the camera would have to zoom out and in, and most names would not fit.
- **One canvas redrawn each frame:** it works, and it is what the prototype does, but every frame then costs script, and a move stutters whenever the panel renders.
- **Open data's unread dots on the picture:** their names need a file for each entry, which would arrive after the dots. The panel gives the count and leads to them, in grey.

## Consequences

- The same entry looks the same each time, with one exception: the entry you came from keeps its place, which can move a neighbour by a slot or two around a crowded hub.
- A stop shows at most 32 neighbours on a laptop and 10 on a phone. A picture no longer shows how the neighbours link to each other: only how each links to the middle.
- Going from a hub to one of its weaker links, the list has to do it: that neighbour has no dot until it is clicked.
