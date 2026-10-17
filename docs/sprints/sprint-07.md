# Sprint 7: The Map shows the Earth

- Starts: 2026-10-17 · Length: 1 week
- Status: **done** (2026-10-17). S7-01 to S7-04 are built and reviewed; the review's findings are fixed.

## Goal

On the Map, a reader can switch from the map of links to the Earth. They see every entry that has a place, move through eras, and zoom from the planet to a city, to one dot, to its page.

## Why now

The ux-vision's Map is "the eagle view: one continuous zoom from planet (eras, regions) to a single dot and its proof". Sprint 4 built the links half (regions, eras, dot to page); this sprint adds the planet. The data is already there: `graph.json` nodes carry `coords` (their own, or their place's), and the story maps already use MapLibre with OpenFreeMap, which the CSP allows.

## Scope

### Must
- [x] **S7-01 Earth view.** `/w/` gets a two-way switch, "Links" (today's map, the default) and "Earth" (`?view=earth`). Earth draws every entry with coordinates on a MapLibre globe, with the same quiet styling as the story maps. Dots are grey, with the accent for the selected one; dark mode first.
- [x] **S7-02 Eras on Earth.** The same era slider as Links: dots outside the era, and undated ones, fade but stay.
- [x] **S7-03 Planet → dot → page.** Clicking or tapping a dot opens its card ("Open page ›"); several entries at one place open a short list. The home button flies back to the whole planet. Keyboard and reduced motion work as on Links.

### Should
- [x] **S7-04** An entry's page links to its spot on the Earth ("On the map ›") when it has coordinates.

### Built and reviewed (2026-10-17)

- **Earth.** A MapLibre globe, lazy-loaded; Links makes no OpenFreeMap request. One dot per spot: 76 entries with a place make 27 dots, each named after its place.
- **Era fading.** A paint expression over per-dot state, so no data is rebuilt per input. The reviewer checked all 33 slider positions against all 27 spots and found 0 mismatches.
- **The card** opens on tap and click, with "Also here". Escape and × close it, ⌂ shows the planet again, keyboard and reduced motion work, and "On the map ›" appears on the 76 entry pages that have a place.
- **Review** (skeptic, 2 medium and 5 low findings), all fixed:
  - **An entry drawn at its place's point read as its exact location.** The card now says "Person · shown at Pretoria, its place", with "Also at Pretoria".
  - **Docs.** ADR-0014, ux-vision and the deploy notes now record that Earth uses the OpenFreeMap basemap and its glyphs.
  - **Small fixes:**
    - basemap names in English (story maps too);
    - on phones a tapped spot moves above the card, and padding never outgrows the map;
    - picking a search result while Earth loads no longer leaves the page;
    - a failed Earth hides its zoom and era controls;
    - phones get a wider globe margin;
    - the demo uses a real era.
  - **No regressions found:** 0 console errors and 0 CSP violations (including inside MapLibre's worker), WebGL contexts are released when switching views, and Links and the story maps are unchanged.

### Not in this sprint
- Historical borders, and a morph between the map and the graph (Story v1, later).
- Self-hosted tiles (backlog F13).

## Also done

- **Second voices** (2026-10-17). A research workflow found them, and an independent verifier re-fetched every quote.
  - "Who benefited from the end of the Cold War?" now has three accounts, where it had only the US government's "America won":
    - Gorbachev: humanity gained (1991 Nobel lecture), and "It was our joint victory. We all won.";
    - Fidel Castro: the USSR lost and the United States gained (CNN interview, 1998).
  - "Who benefited from the GameStop short squeeze?": Senvest Capital gained, in its own 2020 annual report ("tremendous success in January with our GME investment"). It sits beside Melvin Capital's loss.
  - Keith Gill's "my investment multiplied" was rejected: he dates his success to December 2020, before the event, and says others must explain January.
  - "Who benefited from the October Revolution?" (only Ludendorff before) now has three accounts:
    - Lenin: the working peasants were liberated, and the landowners "finished off";
    - Kerensky: the Provisional Government was overthrown, and Russia lost to civil war and terror;
    - Ludendorff.
  - "Who benefited from the Treaty of Brest-Litovsk?" now has four accounts:
    - Lenin on both sides: the "breathing space" Soviet Russia gained, and the "humiliating peace";
    - Hindenburg: Germany's military advantage;
    - Sokolnikov, at the signing: Turkey gained Ardahan, Kars and Batum;
    - Ludendorff.
    "Named in 2 of the 4 accounts (Gained): Imperial German government".
  - Every quote is the account's own words (Lenin's Collected Works, Kerensky's 1927 memoir, Hindenburg's memoir), checked word for word by an independent verifier. Content: 277 entries, 534 links, 290 sources, 0 errors.

## Demo script

1. Map → Earth: the planet with dots; drag the era slider to 1900–1940.
2. Zoom to Moscow and tap its dot ("Also here": what is set there); then tap the Soviet Union's dot (drawn at the Union's centre) and open its page.
3. From Santa Monica's page, "On the map ›".

## Exit criteria

- 0 console errors and 0 CSP violations on `/w/?view=earth`, phone and desktop, dark and light.
- No yellow on dark; focus visible; reduced motion respected.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 51/51, clippy clean, web typecheck and build, `ctd check` 0 errors
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 580 pages, 0 problems. The sweep cannot reach `?view=earth`; the reviewer checked Earth separately: 0 errors, 0 CSP violations, accessibility probe clean.
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-07/`: 28 screenshots. Earth pages need about 12 s in headless Chrome for tiles and software WebGL (`WAIT=12000`).
- [x] Docs and ADRs updated: ADR-0014 (the OpenFreeMap exception now covers Earth), ux-vision, deploy, data contract (World map section, entity `coords`), world tiles, backlog F13
- [x] Known issues listed

## Known issues

- Country entries (the United States, Turkey, Cuba) are dots at their centre, sometimes next to the basemap's own country name.
- An open-ended entry (a living person) stays lit in every recent era at its place's dot. The card says it is shown at its place.
- `sweep.mjs` walks pages, not views, so `?view=earth` is checked separately.

## Review

- **What worked:**
  - The build-then-skeptic workflow again: the reviewer drove real touch, mouse and keyboard input, checked all 33 eras against all 27 dots, and caught the one misleading thing (a place's dot read as a person's location).
  - Second voices made four answer pages balanced (Cold War, GameStop, October Revolution, Brest-Litovsk).
- **What felt wrong:** Earth widens the OpenFreeMap exception (ADR-0014). Self-hosting the basemap (F13) is now worth more.
- **New ideas (moved to the backlog):** country outlines instead of centre dots for country entries; self-host the basemap (F13).
- **Decisions (ADRs):** ADR-0014 updated (Earth uses the basemap and its glyphs).
- **Next sprint goal:** chosen at the review; see [roadmap.md](../roadmap.md).
