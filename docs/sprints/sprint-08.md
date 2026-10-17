# Sprint 8: Watch and listen

- Starts: 2026-10-17 · Length: 1 week
- Status: **done** (2026-10-17). S8-01 to S8-03 are built and reviewed; the review's findings are fixed.

## Goal

A story can be watched and heard, start to finish, hands-free, and every question page shows its answer over time at a glance.

## Why now

The founder's strongest reaction so far was to the stories ("Stories resonate"). Watch mode already advances by itself; a voice makes it a short film. The design's "Over time" band for question pages was left for later in Sprint 4; with the life line's tenure rows (Sprint 4 refactor) it is now a small step.

## Scope

### Must
- [x] **S8-01 Listen.** In a story's watch mode, a "Listen" toggle reads each scene's narration aloud with the browser's own speech (Web Speech API: no third party, no new CSP host). Each scene waits for its sentence to finish before moving on. Pause stops the voice; leaving the page stops it. The toggle is off by default and remembered per viewer (localStorage, wrapped in try/catch). Where the browser has no speech, it is hidden.
  - Done (2026-10-17). A "Listen" pill beside Watch (`aria-pressed`, keyboard, the site's focus ring). It reads each scene's card, one paragraph at a time, without the date line, "Explore from here" or the source link.
  - **The voice:** a voice on the device that speaks English, the default first. Online voices (Chrome's "Google …" voices) are skipped, so the narration stays on the device.
  - **Timing:** the next scene comes when both the scene's time and its voice are done. Only the scene Watch is heading to speaks, so scenes the page scrolls past on the way back to the start stay silent. Pause, scrolling, a scene dot, a hidden tab and leaving the page stop the voice at once. A safety timer moves on if the speech engine never reports the end.
  - **Review fixes:**
    - On phones Watch skipped scene 0 and cut its voice. This was an older Watch bug that only became audible with a voice. Watch now puts a scene's card on the scene-change line. A card too tall for that starts just below the stage and its controls, so the eye and the voice begin together.
    - Replaying from the last scene no longer clips the scene before the first.
    - The map credits are readable in dark mode; they were black on dark before.
  - **Captions read as sentences now that they are heard:**
    - "Mike Markkula, *CEO of* Apple", where they used to read "Mike Markkula *CEO of* Apple". The `noun` and `inverse_reads` fields in `relations.yaml` say how each phrase reads.
    - 47 entries got their sentence form, so "part of Cold War" reads "part of the Cold War".
    - A group names each entry once, even when several accounts link it.
  - **Verified with a silent speech engine:**
    - Four stories (17, 4, 4 and 9 scenes) played to the end on phone and desktop. Every scene was read once, in order, and nothing was cut.
    - A replay from the last scene speaks only scene 0.
- [x] **S8-02 Over time on question pages.** A question page shows its dated lines (tenures such as "Led by" and board seats) as rows on one time axis, the same design as an entry's life line: what and who, the dates, a bar. Accounts keep their own marks. Undated lines and moments stay in the lists below.
  - Done (2026-10-17). `over_time` in the question context; the card reuses the life line's rows (subgrid, phone layout, dates hidden on narrow screens). "Who is behind the Soviet Union?" shows Lenin, Stalin, Khrushchev, Brezhnev and Gorbachev on one axis. Pages without tenures show nothing new. On why pages, causes that span time (perestroika 1985–1991, the 1985–86 oil price collapse, the August 1991 coup) line up the same way; accounts keep their stripes and "according to".

### Should
- [x] **S8-03 Lighter story pages.** MapLibre's CSS (83 KB) loads only when a story actually shows a map, not on every story page.
  - Done (2026-10-17). `story.css` went from 91.4 KB to 9.7 KB. MapLibre's stylesheet is added with the first map, by one loader in `basemap.ts` that the Earth view shares.
  - 166 of 248 story pages never load it.
  - The reviewer compared the map area before and after: its computed styles were identical in all 24 runs (pages, light and dark, phone and desktop, reduced motion).

### Not in this sprint
- Recorded or AI voices; captions in other languages.
- Historical borders on maps.

## Demo script

1. Open "Who is behind the Soviet Union?": Over time shows Lenin → Stalin → Khrushchev → Brezhnev → Gorbachev.
2. Press Play, then Listen: the story plays and speaks, scene by scene, to the end.
3. Pause: the voice stops at once.

## Exit criteria

- 0 console errors and 0 CSP violations; no yellow on dark; phone layout works.
- Listen never starts by itself and never speaks over itself.

## Self-check (before the demo)

- [x] Tests and lints pass: `cargo test` 53/53, clippy clean, web typecheck and build, `ctd check` 0 errors
- [x] Phone sweep clean (static build, CSP enforced, `--a11y`): 580 pages, 0 problems. The reviewer also swept all 248 story pages at 390x844 dark and 1440x900 light: 0 problems.
- [x] Demo script executed; screenshots saved in `docs/sprints/sprint-08/`: 16 screenshots (Over time on the Soviet Union and dissolution pages; Listen playing a question story and a map story; dark and light, desktop and phone). The Listen runs used a silent speech engine.
- [x] Docs and ADRs updated:
  - data contract (story section);
  - `web/README.md` (story player);
  - content model (`noun`, `inverse_verb`);
  - the `relations.yaml` header.
  - No new ADR: the browser's own speech adds no host to the CSP.
- [x] Known issues listed

## Known issues

- **iOS is untested.** The voice is unlocked by a silent utterance on the tap on Watch or Listen; this has not been tried on a device.
- **No local English voice.** On a device without one, the browser picks a voice by language, and that may be an online voice that sends the text away.
- **A stuck speech engine** holds a scene for up to 10 s, plus 1 s per 5 characters, before the story moves on.
- **Hidden tab.** Watch now pauses when the tab is hidden, even with Listen off.
- **Plural inverse phrases read stiffly** after a comma ("GameStop, *stakeholders* Ryan Cohen"). This is rare: only in entry stories, for links that point at the entry.
- **Story graph labels can overlap on phones** (Belarus and Ukraine in the Soviet Union story). This is the older label-collision item in the backlog.

## Review

- **What worked:**
  - Build, then a skeptical review, again. The reviewer drove a silent speech engine through every interruption, and found the phone scene-0 skip.
  - Hearing the narration exposed captions that read as labels, not sentences. They were fixed in the content vocabulary, not in code.
- **What felt wrong:** the builder's first real-voice run was not muted, and it read a story aloud on this Mac for about 38 seconds. The QA tools (`cdp.mjs`, `sweep.mjs`) now start Chrome with `--mute-audio`.
- **New ideas (moved to the backlog):** plural inverse phrases in sentences; try Listen on an iPhone.
- **Decisions (ADRs):** none. Listen uses the browser's own speech, with no new host.
- **Next sprint goal:** see [roadmap.md](../roadmap.md).
