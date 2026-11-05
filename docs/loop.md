# The loop

How the record grows without a person in every step ([ADR-0037](decisions/0037-the-loop.md)): cheap scouts find and source, a gate refuses what is mechanically wrong, one reviewer reads every claim against its source and merges what holds, and a person releases. Every rule of [leads.md](leads.md) and of the story briefs still holds; the loop only changes who does the steps.

```
 ideas ──> scouts (cheap) ──> branch ──> gate ──> reviewer (careful) ──> main ──> release (the founder's go)
   ^                                       │            │
   └──────────── lessons, ignore list <────┴────────────┘
```

## Where ideas come from

1. `ctd gaps`: the links open data has and the record lacks (`.cache/gaps.tsv`).
2. The missing-links page's issues on GitHub, titled "Source for: …": a reader sent a source. These go first.
3. A puzzle's dead ends and Ask's "no written way" pairs, as they are logged.
4. Story ideas in `.cache/stories/queue.md`, for the story run below.

## One run

1. **Scout** (a cheap model, such as Haiku; any model that can fetch a page and edit a file will do). Brief: [tools/loop/scout.md](../tools/loop/scout.md). It takes a batch of at most 20 leads, finds a source for each, saves the source's text under `.cache/loop/<run>/src/`, and writes the claims on a branch `loop/<run>` in its own worktree. A lead it cannot source goes to `.cache/gaps-tried.tsv`; one it finds wrong, to `content/methodology/gaps-ignore.tsv`.
2. **Gate** (no model): `tools/loop/gate.sh main .cache/loop/<run>`. Only entries, sources, stories and the ignore list may change; no request header and no personal detail; at most 40 new quotes; `ctd check --base main`; every new quote word for word in saved text. A branch that fails goes back to the scout once, then is dropped.
3. **Reviewer** (one careful model, such as Opus). Brief: [tools/loop/review.md](../tools/loop/review.md). It fetches every source again itself, into its own folder, and runs the gate on that copy, so a scout's saved text is never the only proof. It reads each claim against its relation's meaning, keeps, fixes or drops it, and writes what it dropped and why to `.cache/loop/lessons.md`, which the next scout reads. If what is left passes the gate, it merges the branch into `main` and pushes.
4. **Release**: as always, `tools/deploy.sh live` only on the founder's go in chat.

## What the reviewer never merges

It leaves the branch, labelled for the founder, when a change:

- touches a sealed entry, or a story about crimes, deaths, abuse or someone's private life;
- says anything about a living person beyond an office, a company role, a degree, a public statement or a court's finding;
- is a story, or a new story's scene (stories keep their writer and skeptic, and the founder reads them);
- uses `according_to`, a dispute, or a relation marked `sensitive` or `legal`.

## Running it

A run is a Claude Code session in this checkout that follows [tools/loop/night.md](../tools/loop/night.md): it spawns the scout as a subagent on the cheap model and reviews in its own context. The founder gave the word to run it unattended on 2026-11-04: a scheduled task in the Claude desktop app starts one every night at 03:00, and only while the app is open (a night missed runs at the next launch). At most one run at a time, behind a lock; a run that finds the laptop busy (a browser check, a build) waits, then gives up for the night. To run one by hand, ask a session to "run one night of the loop as tools/loop/night.md says".

## Stories at night

Stories go further than links: a writer, a skeptic, the writer's fixes, a careful read, then a person ([ADR-0038](decisions/0038-stories-at-night.md)). A second scheduled task runs [tools/loop/stories.md](../tools/loop/stories.md) each night at 00:30, before the 03:00 leads run. It takes one topic from the queue, new and deepen in turn: Codex on the founder's ChatGPT plan does the story work (GPT-6-Luna fetches and lists the facts, GPT-6-Sol writes the story on a branch `story/<id>`, checks it in a fresh session and fixes it), a Claude session reads it and runs the checks, and the run opens a pull request titled "For review: …". It never merges: the founder reads and merges each story, and releases as always. The run keeps its own lock, workspace and log in `.cache/stories/` (`runs.tsv`), apart from the leads loop's.

## What it costs and what it shows

Each run ends with one line in `.cache/loop/runs.tsv`: date, leads tried, claims merged, dropped, left for the founder, and tokens. A week of lines says whether the loop is worth its cost.
