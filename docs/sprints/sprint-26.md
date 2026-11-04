# Sprint 26: A fresh look

- Starts: 2026-11-03 · Length: 1 day
- Status: active

## Goal

A first visitor finds no repeats on the home page, and the Map's Earth names what is where from the first view.

## Why now

After four releases of cuts, each page was looked at again as a first visitor would: the home page linked to Stories twice above the fold, and the Earth showed coloured dots with no names until one zoomed in.

## Scope

### Must
- [x] S26-01 Home loses its "Ask, Stories" links: the header and "More ways in" already have them.
- [x] S26-02 On the Earth, names show from the whole world's view: the best-connected dots that fit, twice as many with each step in, none cut by the edge.
- [x] S26-03 The Earth's land is a light grey however dense the open data, so Europe reads as land, not a blotch.
- [x] S26-04 Refactor pass: dead CSS, unused templates, assets, data files and exports checked; one dead rule left the stylesheet.

## Demo script

1. Open `/`: the page opens on Standard Oil, under the header, with nothing repeated.
2. Open `/w/?on=earth` at 1280x800: Russia, Ukraine, Israel, the United States government and a few events are named; no name runs off the edge.
3. Zoom in over Europe: Spain, Italy, Malta, Tehran and more are named as the room allows.
4. The same at 390x844.

## Exit criteria

The demo runs at both sizes with no console errors, and `tools/qa/sweep.mjs --touch` finds nothing on `/w/`.

## Self-check (before the demo)

- [x] Tests and lints pass
- [x] Demo script executed on a local build
- [x] Docs updated
- [x] Known issues listed

## Known issues

- Far out on a phone, only the names whose dots are in view show, so the Earth names two or three things until one pans or zooms.
- The densest part of Europe stays unnamed until the third step in: its names collide.

## Review

- What worked:
- What felt wrong:
- Next sprint goal:
