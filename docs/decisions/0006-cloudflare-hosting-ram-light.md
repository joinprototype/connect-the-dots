# ADR-0006: Cloudflare hosting, RAM-light design, Axum when a server is needed

- Status: accepted
- Date: 2026-10-16

## Context

The site is static. Memory prices rose 80–90% in Q1 2026 and keep rising, and Hetzner raised prices twice in 2026.

## Decision

- **Hosting:**
  - Cloudflare Workers Paid ($5 a month) for static assets, with free requests and up to 100k files per version.
  - R2 for long-tail pages, data, tiles and images ($0.015 per GB-month, free egress).
- **RAM-light rule:** never hold in RAM what can be a file.
  - Precompute at build time.
  - Compact Rust structures: ~40 B per link, versus ~400 B for JS objects.
  - Memory-mapped graph files when a server exists.
  - Hard memory budgets in the browser.
- **Servers** come only when a trigger fires: a path API once the graph outgrows the browser, or the v2 social layer. Use Axum (tower middleware, tokio-native, easy sharing of an `Arc` graph) on one small VPS behind Cloudflare. Not actix-web: it is equally fast but gives us nothing extra.
- **Low lock-in:** published output is plain files in S3-compatible storage, so moving takes about a day.

## Consequences

- No server to patch in the MVP.
- Workers' 128 MB memory cap rules out in-memory graphs at the edge, which is why heavy work goes to a VPS when needed.

## Revisit when

Any scale switch in architecture.md §11 fires.
