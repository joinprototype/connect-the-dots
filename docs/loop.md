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
4. Story ideas in `.cache/stories/queue.md`, for the story run below. When the queue runs low, the run adds topics from `ctd seeds`: entries no story shows, names that run through several stories with none of their own, stories that lack entries joined to theirs, and stories told as a list of cases, to be retold as one storyline ([ADR-0041](decisions/0041-more-stories.md)).
5. The texts a story run already saved: a harvest reads them for links the story did not use ([Harvest](#harvest), [ADR-0039](decisions/0039-harvest.md)).

## One run

1. **Scout** (a cheap model: since 2026-11-04, GPT-6-Luna on Codex, the founder's ChatGPT plan, through `tools/loop/codex-stage.sh`; any model that can fetch a page and edit a file will do). Brief: [tools/loop/scout.md](../tools/loop/scout.md). It takes a batch of at most 20 leads, finds a source for each, saves the source's text under `.cache/loop/<run>/src/`, and writes the claims on a branch `loop/<run>` in its own worktree. A lead it cannot source goes to `.cache/gaps-tried.tsv`; one it finds wrong, to `content/methodology/gaps-ignore.tsv`.
2. **Gate** (no model): `tools/loop/gate.sh main .cache/loop/<run>`. Only entries, sources, stories and the ignore list may change; no request header and no personal detail; at most 40 new quotes; `ctd check --base main`; every new quote word for word in saved text. A branch that fails goes back to the scout once, then is dropped.
3. **Reviewer** (one careful model: since 2026-11-04, a fresh GPT-6.1-Sol session on Codex; the Claude session that runs the night keeps the gate, the commits, the push and a last read of each claim's line). Brief: [tools/loop/review.md](../tools/loop/review.md). It fetches every source again itself, into its own folder, and runs the gate on that copy, so a scout's saved text is never the only proof. It reads each claim against its relation's meaning, keeps, fixes or drops it, and writes what it dropped and why to `.cache/loop/lessons.md`, which the next scout reads. If what is left passes the gate, it merges the branch into `main` and pushes.
4. **Release**: as always, `tools/deploy.sh live` only on the founder's go in chat.

## What the reviewer never merges

It leaves the branch, labelled for the founder, when a change:

- touches a sealed entry, or a story about crimes, deaths, abuse or someone's private life;
- says anything about a living person beyond an office, a company role, a degree, a public statement or a court's finding;
- is a story, or a new story's scene (stories keep their writer and skeptic, and the founder reads them);
- uses `according_to`, a dispute, or a relation marked `sensitive` or `legal`.

## Running it

A run is a Claude Code session in this checkout that follows [tools/loop/night.md](../tools/loop/night.md): it runs the scout and the reviewer as Codex stages on the founder's ChatGPT plan, so Claude's plan stays for code, and keeps the gate, the commits and the push itself. The founder gave the word to run it unattended on 2026-11-04: a scheduled task in the Claude desktop app starts one every night at 03:00, and only while the app is open (a night missed runs at the next launch). At most one run at a time, behind a lock; a run that finds the laptop busy (a browser check, a build) waits, then gives up for the night. To run one by hand, ask a session to "run one night of the loop as tools/loop/night.md says".

## Harvest

A leads run starts from a lead and hunts the web for a source; most hunts find nothing. A harvest starts from a source the record already holds and reads it for every link it states ([ADR-0039](decisions/0039-harvest.md)). A story run saves the text of every source it reads under `.cache/stories/research/<story>/src/`, and a story uses a small part of each.

1. **Prepare** (no model): in the run's worktree, `CTD=<engine> python3 tools/loop/harvest-prep.py .cache/stories/research/<story> .cache/loop/<run>`. It reads the record through `ctd build --graph`, finds for each source the saved file that holds the quotes the record already cites from it, and copies it to `<run>/src/<source id>.txt`. Then it lists the **candidates**: pairs of entries that one of those texts names within a few lines of each other and the record does not join, with up to three passages each, those with words such as "President", "member" or "signed" first. People, bodies, events and works only; a surname or an alias counts only where the full name is in the same text. It also lists the **newcomers**: people the texts name whom the record lacks, found by name in the atlas (`.cache/atlas`, open data: it gives the Wikidata id and description to check, never proof), each named near two or more record entries.
2. **Harvester** (no network). Brief: [tools/loop/harvest.md](../tools/loop/harvest.md). It judges every newcomer (is the atlas's person the one the texts mean? do the texts state two links to the record?) and then every candidate, logs a verdict for each in `<run>/judged.tsv`, writes a link only where one continuous span states it, and adds at most eight new people, each with two or more links. No harms, no heritage, no stories, no sensitive or legal relations. GPT-6-Luna judged too quickly in the pilot; GPT-6.1-Sol at medium effort reads each passage.
3. **Gate, reviewer, merge**: as in a leads run. The reviewer fetches every source again itself; a book it cannot fetch is read from the saved copy and named in its report. It checks each new person's Wikidata id against Wikidata, and removes a new entry left with fewer than two links.

**Each night**, since 2026-11-13 on the founder's word, the 03:00 run harvests one story after its leads are merged, under the same lock ([night.md](../tools/loop/night.md), "Harvest"). `tools/loop/harvest-pick.py` picks the oldest story not yet in `.cache/loop/harvested.tsv` that saved 15 texts or more, leaving out the Epstein set, whose named people get a second reading by hand. A story whose texts match fewer than five sources in the record is logged and passed over.

## Sources that still open

Each night the leads run also runs the archive bot, `tools/loop/sources.py`, with no model: it checks a seventh of the sources with plain curl, so each is seen once a week, and gives every source without one the Internet Archive's copy closest to the day it was read. It only reads what the Archive has; it asks nothing to be saved. Sources it finds gone are listed in the run's report. Its last check is in `.cache/sources-health.tsv`.

## Stories at night

Stories go further than links: a writer, a skeptic, the writer's fixes, a careful read, then a person ([ADR-0038](decisions/0038-stories-at-night.md)). A second scheduled task runs [tools/loop/stories.md](../tools/loop/stories.md) each night at 00:30, before the 03:00 leads run. It takes a topic from the queue, new and deepen in turn, and a second one after it while the run is young and the plan has room, so a night that loses one story still gives another ([ADR-0041](decisions/0041-more-stories.md)): Codex on the founder's ChatGPT plan does the story work (GPT-6-Luna fetches and lists the facts, GPT-6.1-Sol writes the story on a branch `story/<id>`, checks it in a fresh session and fixes it), a Claude session reads it and runs the checks, and the run opens a pull request titled "For review: …". It never merges: the founder reads and merges each story, and releases as always. The run keeps its own lock, workspace and log in `.cache/stories/` (`runs.tsv`), apart from the leads loop's.

## What it costs and what it shows

Each run ends with one line in `.cache/loop/runs.tsv`: date, leads tried, claims merged, dropped, left for the founder, and tokens. A week of lines says whether the loop is worth its cost.
