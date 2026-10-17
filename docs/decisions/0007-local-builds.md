# ADR-0007: Builds run locally

- Status: accepted
- Date: 2026-10-16

## Context

The founder does not want heavy builds on GitHub Actions, which are slow (4-core runners) and queue-bound. A laptop-class machine runs layout and builds roughly twice as fast.

## Decision

- `ctd publish` runs on a maintainer machine: pull → check → incremental build → upload changed files → build manifest.
- `ctd watch` (optional) runs on an always-on machine. It polls GitHub for merges on `main` and publishes them, so "merge → live" stays automatic.
- Only `ctd check` runs on GitHub. It uses a prebuilt binary, takes seconds, and gives contributors fast feedback.

## Rules

- Pinned toolchain and deterministic output, so any machine builds identical bytes.
- Every deploy includes `build-manifest.json`: engine version, content commit, methodology hash, world version.
- Cloudflare tokens are scoped narrowly and stay local.
- Never attach a self-hosted GitHub runner to the public repo, because fork PRs could run code on our machine. `ctd watch` builds only merged `main`.

## Revisit when

Merges are frequent enough that manual or single-machine publishing becomes a bottleneck. Then move `ctd watch` to a cheap server or back into CI.
