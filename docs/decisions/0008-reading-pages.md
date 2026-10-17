# ADR-0008: Reading pages are Rust-rendered HTML with islands

- Status: accepted
- Date: 2026-10-16

## Context

Entity pages and chapters may reach 100k–1M pages. They must be fast on phones, indexable and accessible. The question was plain JS vs React, and whether React needs SSR (TanStack Start and similar).

## Decision

- **Rust renders every reading page to static HTML**, using MiniJinja runtime templates in `theme/` so theme edits need no Rust.
- **Interactivity comes from vanilla TypeScript custom elements** (islands) that enhance the markup and never re-render it. They load on demand, keeping JS under 15 KB at page load. Preact is allowed only for genuinely stateful widgets.
- **React 19 + Vite powers the apps only**: the explorer and, later, the editor. They are SPAs without SSR.
- **No full-page React framework** (TanStack Start, Next.js, Astro) for reading pages:
  - SSR would duplicate the HTML that Rust already produces;
  - hydration costs ≈60 KB of JS per page;
  - Astro needs 13–52 minutes for 100k pages.
- **No duplicated components:** both sides share one CSS token vocabulary. Explorer panels reuse HTML fragments rendered by Rust (e.g. `/frag/e/<id>/card.html`).

## Consequences

- Very fast pages with small JS.
- Two UI worlds, templates and React, kept consistent through shared tokens and fragments.

## Revisit when

The UI team is mostly TSX and the page count stays at or below ~100k. In that case Astro with React islands becomes reasonable.
