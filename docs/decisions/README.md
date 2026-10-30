# Decisions (ADRs)

One short file per decision: context, decision, consequences, and when to revisit. Superseded ADRs stay in place, marked "superseded by NNNN". New ADRs take the next number.

| # | Decision | Status |
|---|---|---|
| [0001](0001-rust-core-typescript-draws.md) | Rust core; TypeScript draws in the browser; no Elixir in the MVP | accepted |
| [0002](0002-static-first-no-database-no-accounts.md) | Static-first; no database and no accounts of our own in the MVP | accepted |
| [0003](0003-github-as-identity-and-discussion.md) | GitHub is identity and discussion: PRs are posts | accepted |
| [0004](0004-content-format.md) | One markdown file per entity; slug + ULID; claims inline; schema as data | accepted |
| [0005](0005-attribution-and-evidence.md) | Facts vs attributed claims; evidence tiers; confirmation computed; no labels on people | accepted |
| [0006](0006-cloudflare-hosting-ram-light.md) | Cloudflare static hosting; RAM-light design; Axum only when a server is needed | accepted |
| [0007](0007-local-builds.md) | Builds run locally; only `ctd check` runs on GitHub | accepted |
| [0008](0008-reading-pages.md) | Rust-rendered HTML (MiniJinja) with vanilla islands; React only for apps; no SSR framework | accepted |
| [0009](0009-explorer.md) | Close views with sigma now; streaming world with deck.gl tiles after the scale spike | accepted |
| [0010](0010-storytelling-chapters.md) | Chapters are markdown plus scene blocks; scroll / watch / explore modes | accepted |
| [0011](0011-repos-and-licenses.md) | Monorepo now, split at launch; licenses | proposed |
| [0012](0012-english-only.md) | English only for now | accepted |
| [0013](0013-world-layout.md) | World layout: communities + pivot MDS + alignment between builds | accepted |
| [0014](0014-calm-design.md) | Calm design: three places (Ask, Stories, Map), one accent, neutral layers, plain words, generated covers | accepted |
| [0015](0015-ask-anything.md) | Ask anything: questions are data; records, account columns, Disputed and drafts kept apart; scope line and notice on every answer | accepted |
| [0016](0016-who-a-person-is.md) | Who a person is: family ties, citizenship as a link, heritage only as a sourced line on the person's own page, never a connector | accepted |
| [0017](0017-pages-load-what-they-show.md) | Pages load what they show: a slim structure for the explorer and routes, an entry's details on demand, stories with their own data, search by word range; a route service past about 55k links | accepted |
| [0018](0018-legal-records.md) | Legal records: what courts and regulators decided, every step of a case side by side, never a route | accepted |
| [0019](0019-disputing-a-finding.md) | Disputing a finding: a study's words, then each disputer's own, nothing decided, never a route | accepted |
