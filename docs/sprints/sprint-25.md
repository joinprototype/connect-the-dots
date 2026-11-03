# Sprint 25: One map

- Starts: 2026-11-03 · Length: 1 day
- Status: in review

## Goal

One picture of the record that reads at a glance and shows a dot's connections when picked, by story and on the Earth (ADR-0034).

## Why now

The founder found the Map's Links view a mess at every zoom, picking a dot gave nothing, and the Earth view showed no connections.

## Scope

### Must
- [x] S25-01 The Map is the Stories surface over the whole window; the wheel zooms.
- [x] S25-02 A picked dot draws its links in ink, the rest steps back, and its words list every link.
- [x] S25-03 "On Earth": the same dots move to their places over the field of dots; people, peoples and families never placed; sealed never placed.
- [x] S25-04 A relation flag, `locates`, stands an organization, event or work at the place it is headquartered, located or written in.
- [x] S25-05 The old Map's addresses work: `?focus=`, `?view=earth`; a typed year goes to Ask.

### Should
- [ ] S25-06 Remove the old viewer (`web/src/world/`), deck.gl, MapLibre and the world tiles, once the founder has tried this; draw the home page's picture from the islands instead.

## Demo script

1. Open `/w/`. Islands, named. Click Standard Oil: its links draw, the rest fades.
2. Press "On Earth". The dots fly to their places; Europe and the US fill in.
3. Click Cleveland: its line to Standard Oil, headquartered there.
4. Open John D. Rockefeller from the box: the islands come back, since a person has no place on the Earth.

## Exit criteria

The demo runs on 1280x800 and 390x844 with no console errors, the moves keep frame, and `tools/qa/sweep.mjs` finds nothing on `/w/` and `/c/`.

## Self-check (before the demo)

- [x] Tests and lints pass
- [ ] Demo script executed on the preview
- [x] Docs and ADRs updated
- [x] Known issues listed

## Known issues

- The era slider and the historical borders are not on the new Map.
- On the Earth far out, no names show until one zooms in.
- Only about a fifth of the record has a place on the Earth.
- Real phones and Safari are unmeasured.

## Review

- What worked:
- What didn't:
- Next:
