# connect-the-dot docs

These docs are the project's shared memory: what we are building, why, what we decided, and what we are doing this sprint. Read this page first.

## Map

| Doc | Holds | Changes when |
|---|---|---|
| [vision.md](vision.md) | Why this exists, principles, what it is and is not | Product direction shifts |
| [requirements.md](requirements.md) | Founder decisions, non-negotiables, platform limits, acceptance scenarios | A decision is made or reversed |
| [architecture.md](architecture.md) | How the system works and where it is going | Any sprint that changes the design |
| [content-model.md](content-model.md) | File formats: entities, claims, sources, schema, chapters, featured picks; `ctd check` rules | The format changes (with an ADR) |
| [../CONTRIBUTING.md](../CONTRIBUTING.md) | How to add entries, links, sources, background lines and stories by pull request: rules, worked examples, checks, checklist | The format, `ctd check` or the review rules change |
| [data-contract.md](data-contract.md) | What `ctd build` writes and the browser code reads: files, the data files (`schema.json`, `graph-slim.json`, `e/<id>.json`, `search/`), page markup, template context | The output changes (with the web code) |
| [world-tiles.md](world-tiles.md) | The world map's manifest and binary tiles | The tile format changes (with the viewer) |
| [ux-vision.md](ux-vision.md) | The design brief: three places, one accent, plain words | Founder feedback on look and feel |
| [deploy.md](deploy.md) | Preview and production hosting | Hosting changes |
| [decisions/](decisions/) | One short ADR per decision | A decision is made |
| [design/](design/) | Designs for proposed work, before they become ADRs (Sprint 4: Ask anything) | A proposal is drafted |
| [roadmap.md](roadmap.md) | Now / Next / Later | Every sprint review |
| [backlog.md](backlog.md) | Ideas inbox and prioritized epics | Anytime |
| [sprints/](sprints/) | One file per sprint: goal, tasks, demo, review | During the sprint |

## How we work: startup sprints, not waterfall

A sprint is one week by default and has one goal that a demo can prove.

1. **Plan.** Pick the goal from the roadmap's "Now" and the backlog. Write `sprints/sprint-NN.md` from the [template](sprints/_template.md): scope (must / should / could), tasks, demo script, exit criteria.
2. **Build.** Thin vertical slices. Working software beats complete documents. Keep `main` green.
3. **Self-check.** Before the demo: tests and lints pass, the demo script runs end to end, screenshots are saved, known issues are listed honestly.
4. **Demo.** Walk through the demo script locally.
5. **Review.** What worked, what felt wrong (look and feel matters), new ideas into the backlog, decisions into ADRs.
6. **Decide.** Pick the next sprint goal. Anything can change; the ADRs record why.

## Rules of thumb

- Decisions are cheap to reverse early. Write a ten-line ADR and move on.
- New ideas go to the backlog **Inbox** first. They enter a sprint at planning, unless they change the current sprint's goal.
- Docs follow the code. Update `architecture.md` or `content-model.md` in the same change that alters behaviour.
- Keep sprint screenshots few and small: one per demo step at most, as JPEG. They are most of the repository's weight.
- Prove a refactor: build before and after, and compare every file, ignoring the build timestamp.
- The examples in these docs (Musk, BlackRock, the Bible, GameStop, the Cold War, Santa Monica) are test cases for a generic engine. They are not the scope, and no domain logic is hard-coded.
