# ADR-0038: Stories at night

- Status: accepted
- Date: 2026-11-04

## Context

A story takes a writer, a skeptic, the writer's fixes and a careful read, about an hour of agents for each. Fourteen were written this way on 2026-11-04, in two waves, with a person starting each wave. Every first draft failed its skeptic, and the careful read after the fixes still caught slips. Stories are the riskiest part of the record: they tell of harms, name living people and weigh disputed accounts. The founder asked how many could be made in a day, and chose a nightly run that ends in a pull request, not a merge.

## Decision

A scheduled run each night ([tools/loop/stories.md](../../tools/loop/stories.md)) takes at most two topics from the story queue: one new story and one to deepen. For each it:

1. has a writer, on a mid-priced model, research and write the story on its own branch, as the writer brief says;
2. has a skeptic, on a careful model, report what is wrong;
3. sends the report back to the writer to fix;
4. reads the whole story itself, on a careful model, against a checklist of what earlier reads caught;
5. runs `ctd check`, the quote check, and a sweep of the story's built page;
6. opens a pull request titled "For review: …".

The run never merges into `main`, pushes to it, or deploys. The founder reads and merges each story; a release still needs the founder's go in chat.

## Consequences

- About two stories a night, roughly a million model tokens each, while the desktop app is open.
- `main` gets a story only after a person has read it. That is stricter than the leads loop of [ADR-0037](0037-the-loop.md), where a reviewer may merge small sourced links.
- Saved source text stays out of the repository, in `.cache/stories/research/`, kept across runs so a later deepening can reuse it.
- Two stories in one night may add the same entry; the second pull request then needs a hand merge, and its body says so.
