# ADR-0035: Stories is the shelf

- Status: accepted
- Date: 2026-11-03

## Context

After ADR-0034 the Map was the Stories surface over the whole window, and the Stories page still opened on that same surface, with the list of stories under it. Two links in the header led to one picture. The founder saw it at once: Stories and the Map looked the same.

## Decision

Each link has one job:

1. **Stories** (`/c/`) is the shelf: every written story's cover, title and line, to pick one and read it, then the connections, question books and life stories. It loads no script, and one line sends a reader to the Map for the islands.
2. **The Map** (`/w/`) is the picture: the islands, a picked dot's links, and the Earth.

## Consequences

- Stories is a plain page again: fast, readable without JavaScript, and the same at every size.
- The surface's code loads on the Map alone.
- Amends ADR-0030 (One Place now lives on the Map) and ADR-0034.
