# ADR-0041: More stories: topics from the record, two a night

- Status: accepted
- Date: 2026-11-13

## Context

The nightly story run ([ADR-0038](0038-stories-at-night.md)) wrote 5 stories in the 8 nights from 2026-11-05 to 2026-11-12. Three nights gave none: the laptop slept mid-run, the network dropped, and a scout found too little for the Dutch Golden Age and the run stopped. The queue of topics is written by hand and held 11 open items, about two weeks. The founder asked what the engine could do so that there are more and more stories, and chose to build two things.

Since 2026-11-04 the story work runs on Codex, on the founder's ChatGPT plan; Claude's plan pays only for the session that orchestrates and reads, about 1 to 2% of the weekly limit a story. The "too costly" of ADR-0038 was a Claude cost and no longer holds at that size.

## Decision

1. **`ctd seeds`** reads the record and writes topics for stories to `.cache/seeds.tsv`, each with the record's sources most cited for it. A seed is a lead, never a story. Rules in `content/methodology/seeds.yaml`.
   - `new`: an entry no written story shows (a person, a body, an event or a thing), by how many entries its sourced links reach, and more for each story where two or more of those entries are.
   - `thread`: a person or a body that runs through 3 to 10 stories with none about it, by those stories and its sourced links that no story tells.
   - `deepen`: a written story, by the entries it lacks that are joined to two or more of its own (the harvest of [ADR-0039](0039-harvest.md) adds most of them), and the sourced links between its own entries that no story tells.
2. **The queue stays full.** When either kind has fewer than 3 open items, the story run adds up to three from the seeds at the end of the queue, written as the founder's items are, and marked "from seeds". It skips any seed already in the queue in any state, so one the founder strikes (`- [-]`) never comes back, and anything the queue's notes rule out.
3. **Two stories a run.** After its first story the run starts a second, of the other kind, if it started under 4 hours ago, Claude's weekly usage is under 75% and no Codex stage hit a usage limit. A first story that ended without a pull request makes the second its retry. Never more than two.

The founder still reads and merges every story, and still gives each release.

## Consequences

- A night that loses its first story to a thin scout still gives one.
- Most of the record is told by some story, so `new` seeds are few (13 on 2026-11-13: Scale AI, Y Combinator, Project Vanguard, the Grassley inquiry); `thread` (23: Google, Stalin, Amazon, John F. Kennedy, Al Qaeda) and `deepen` (83) carry the queue. Each nightly harvest makes `deepen` seeds richer: Partition's lists the four people the harvest added.
- A seed of a living person is marked `living`; the briefs' rules for living people decide what such a story may say.
- Two stories a night means two pull requests a day for the founder to read. If they pile up, the next step is a review sheet on each one (new names, living people named, quotes checked, long scenes flagged).
