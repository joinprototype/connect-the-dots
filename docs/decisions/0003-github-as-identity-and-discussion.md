# ADR-0003: GitHub is identity and discussion

- Status: accepted
- Date: 2026-10-16

## Context

We want contributions, review and discussion without building accounts or a social layer.

## Decision

| GitHub | Means on our site |
|---|---|
| Pull request | A post proposing a change |
| Review comments | Replies |
| Approval by a trusted reviewer | Verification |
| Reactions | A signal only, never a verdict |
| Issues | Questions, disputes, research requests |
| Merged / closed | Accepted / rejected (both visible) |

Entity pages link to their open proposals, and each History entry links to the PR that made it.

## Consequences

- Contributors need a GitHub account. That is a filter against spam, but also a barrier for non-technical people. The v1 editor lowers it.
- We depend on GitHub's terms and limits (about 1 merge per minute per repo). Mitigations:
  - a nightly mirror of PR and issue threads to R2;
  - an off-GitHub git mirror;
  - the scale switches in architecture.md.
- Sensitive allegations never go in public PR titles or commit messages. They come in through a private channel.

## Revisit when

GitHub's limits or policies block us, or v2 brings our own discussion layer.
