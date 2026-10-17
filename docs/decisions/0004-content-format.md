# ADR-0004: Content format

- Status: accepted (v0; expect changes during Sprint 1)
- Date: 2026-10-16

## Context

The content must be:
- readable and editable by humans;
- reviewable in PRs;
- usable as an Obsidian vault;
- valid against a schema;
- able to express any domain.

Research disagreed on two points:
- **Claims inline vs one claim per file.**
- **Slug filenames vs ULID filenames.**

## Decision

- **One markdown file per entity**, with YAML frontmatter followed by prose. One page = one file, so `git log` on the file is the page's history.
- **Filename = slug `id`**, which keeps Obsidian `[[wikilinks]]` working and diffs readable. A permanent ULID `uid` sits in the frontmatter, and renames add the old id to `aliases`, which become automatic redirects.
- **Claims live inline in the owner's file.** The relation schema decides the owner. Each claim has a stable claim id. The engine derives reverse views, and many-party facts live in event entities.
- **Sources are their own files.** Inline URLs get normalized into source files by `ctd fmt` or the bot.
- **YAML** parsed by serde-saphyr in a strict subset: values are read as strings, then converted by schema, so `NO` never turns into false and dates are never auto-parsed.
- **Schema and methodology are data** in `content/schema/` and `content/methodology/`.
- **Bulk datasets stay out of git**, in R2 with a hash manifest.

## Rejected

- **One claim per file with ULID filenames.** No merge conflicts and no redirect tables, but unreadable diffs, broken Obsidian links, and a file count many times the entity count. We keep an escape hatch: the engine can also read a `claims/` folder for high-churn hubs.

## Consequences

- Popular hub files can conflict. `ctd fmt` sorts claims so concurrent additions land in different places.
- Full spec: [content-model.md](../content-model.md).

## Revisit when

Hub files conflict often, or one file per claim becomes necessary for v2 votes or provenance tooling.
