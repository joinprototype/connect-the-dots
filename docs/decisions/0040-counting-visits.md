# ADR-0040: Counting visits

- Status: accepted
- Date: 2026-11-12

## Context

The founder asked whether anyone uses the site. Nothing measured it: Cloudflare injects its Web Analytics beacon into every page of the zone, but the site's Content-Security-Policy allowed scripts only from the site itself, so the beacon was blocked on every page and counted nothing ([deploy.md](../deploy.md)).

## Decision

1. Count visits with Cloudflare Web Analytics, which the zone already injects: the policy now allows its script (`https://static.cloudflareinsights.com`) and its report (`https://cloudflareinsights.com`), and nothing else from outside.
2. No cookie, no local storage and no fingerprint: Cloudflare counts page views, referrers, countries and page speed per visit, and keeps no visitor id. So no consent banner.
3. No Google Analytics or any tracker that sets cookies or follows a reader across sites.
4. The bot detection's inline script stays blocked; turning it off is a zone setting.

## Consequences

- The numbers are in the Cloudflare dashboard, under Web Analytics for dots.joinprototype.com, from the first release with this policy. There are none from before it.
- The privacy notice on the legal list (deploy.md) names Cloudflare's counting beside OpenFreeMap's map requests.
