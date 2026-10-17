# ADR-0002: Static-first, no database, no accounts of our own

- Status: accepted
- Date: 2026-10-16

## Context

The MVP covers knowledge only. Social features wait for v2. The founder wants no login of our own and minimal running cost.

## Decision

- The production site is static files: HTML, JSON, tiles and images, served by Cloudflare.
- No database and no user accounts.
- Everything dynamic in the MVP (contributions, discussion, approvals) happens on GitHub; see ADR-0003.

## Consequences

- About $5 a month. Survives traffic spikes. Nearly zero ops. Nothing personal to protect.
- Votes, comments and reputation are not possible until v2 adds a small service plus a database. The data model already uses stable `uid`s and claim ids so v2 can attach to them.
- Anything that needs RAM or CPU per request waits for a trigger (ADR-0006).

## Revisit when

v2 starts, or when a dynamic feature becomes core to the product.
