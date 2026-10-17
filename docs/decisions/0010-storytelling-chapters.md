# ADR-0010: Storytelling chapters

- Status: accepted
- Date: 2026-10-16

## Context

The founder wants interactive "connect the dots" articles in the style of explainer videos such as Johnny Harris's: globe fly-ins, borders through time, documents with highlighted quotes, routes and money flows, and map-to-graph morphs.

## Decision

- **Chapters are content:** markdown plus fenced `scene` blocks, each a YAML list of shots. They are reviewed in PRs like everything else.
- **One player drives the same engines** as the site: MapLibre (globe, terrain, historical borders), sigma/deck.gl (graph), the timeline. Overlays are animated with GSAP, which is free including its former paid plugins; Motion (MIT) is the fallback.
- **Three modes:**
  - Scroll, driven by ScrollTrigger.
  - Watch: autoplay with narration and captions.
  - Explore from here: opens the explorer at the shot's lens, focus and time.
- **Each shot can reveal one more claim.** A line draws and its source appears, so the story literally connects the dots, and every line stays clickable for its evidence.
- **Imagery is open and licensed only:** NASA Blue Marble, Natural Earth, public-domain archives, Wikimedia Commons. No Google photoreal 3D: it is a paid API with strict terms.
- **Accessibility:** reduced-motion readers get static poster frames rendered by Rust, and narration has captions.

## Consequences

- Showcase chapters need craft (design, motion, sound) as well as tech.
- Video export (step frames in a headless browser, encode to MP4) and a "capture shot" authoring tool are later backlog items.

## Revisit when

Authors find YAML scenes too painful. Then build the visual capture tool earlier.
