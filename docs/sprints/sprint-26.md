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
- [x] S26-05 Ask, Read and the Map read a link as the stories do: "Moses, regarded as a prophet in Christianity", not "Moses regarded as a prophet in Christianity". `schema.json` carries each relation's `noun` and `inverse_reads`.
- [x] S26-06 Ask's heading marks a name as a story does, dotted under in its kind's ink, in place of a dot that read as punctuation ("are·Moses").
- [x] S26-07 Entry pages: a stake's bar is its share of the whole, so Elon Musk's 19.8% of Tesla no longer fills the track; a year near either end of a time axis is no longer cut ("20" for 2027); a life line reads "board members: Kimbal Musk".
- [x] S26-08 A type's A-to-Z page goes back to "Home", where it is linked from, not "On the map".

## Demo script

1. Open `/`: the page opens on Standard Oil, under the header, with nothing repeated.
2. Open `/w/?on=earth` at 1280x800: Russia, Ukraine, Israel, the United States government and a few events are named; no name runs off the edge.
3. Zoom in over Europe: Spain, Italy, Malta, Tehran and more are named as the room allows.
4. The same at 390x844.
5. Open `/ask/`: "How are Moses and Elon Musk connected?" with both names dotted under in red, and the first link reads "Moses, regarded as a prophet in Christianity." Type "Bill Gates and IBM": each name is dotted under as it is recognised.

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
