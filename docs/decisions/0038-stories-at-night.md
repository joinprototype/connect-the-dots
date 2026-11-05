# ADR-0038: Stories at night

- Status: accepted
- Date: 2026-11-04

## Context

A story takes a writer, a skeptic, the writer's fixes and a careful read, about an hour of agents for each. Fourteen were written this way on 2026-11-04, in two waves, with a person starting each wave. Every first draft failed its skeptic, and the careful read after the fixes still caught slips. Stories are the riskiest part of the record: they tell of harms, name living people and weigh disputed accounts. The founder asked how many could be made in a day, and chose a nightly run that ends in a pull request, not a merge.

## Decision

A scheduled run each night ([tools/loop/stories.md](../../tools/loop/stories.md)) takes one topic from the story queue, a new story and one to deepen in turn. It:

1. has a scout, on the cheapest model, fetch the sources, save their text and list the facts with their quotes;
2. has a writer, on a mid-priced model, write the story from those facts on its own branch, as the writer brief says;
3. has a skeptic, on the mid-priced model, report what is wrong;
4. sends the report back to the writer to fix;
5. reads the whole story itself against a checklist of what earlier reads caught;
6. runs `ctd check`, the quote check, and a sweep of the story's built page;
7. opens a pull request titled "For review: …".

The run never merges into `main`, pushes to it, or deploys. The founder reads and merges each story; a release still needs the founder's go in chat.

## Consequences

- The story work runs on OpenAI's Codex, on the founder's ChatGPT plan (`tools/loop/codex-stage.sh`): GPT-6-Luna scouts, GPT-6.1-Sol writes, checks and fixes. Claude's plan pays only for the session that orchestrates, reads and runs the checks; the founder keeps Claude for code. Codex runs without the user's own config, so none of its plugins or connectors (mail, calendar, chat, browser) is loaded, and its sandbox writes only in the worktree and the story workspace. Fetched pages and the briefs go to OpenAI under the founder's account.
- One story a night, while the desktop app is open. The founder found the first design, with careful models writing and checking two stories a night, too costly for its share of the weekly plan; fetching and reading pages looked like the largest part of a story's tokens, so the cheapest model now does it, and no agent reads a whole page into its context. Each run logs the weekly usage it took, so the real cost is measured, not guessed.
- `main` gets a story only after a person has read it. That is stricter than the leads loop of [ADR-0037](0037-the-loop.md), where a reviewer may merge small sourced links.
- Saved source text stays out of the repository, in `.cache/stories/research/`, kept across runs so a later deepening can reuse it.
- Two open story pull requests may add the same entry; the second then needs a hand merge, and its body says so.
