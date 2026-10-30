# License

connect-the-dot is open. Code, data and writing need different things, so each has its own license ([ADR-0011](docs/decisions/0011-repos-and-licenses.md)).

Copyright 2026 the connect-the-dot contributors.

| Part | Where | License |
| --- | --- | --- |
| Code | `crates/`, `web/`, `theme/`, `tools/` | [AGPL-3.0-only](LICENSES/AGPL-3.0.txt) |
| Structured data | `content/`: YAML files, and the YAML front matter of entries | [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/) |
| Writing | `content/`: the text of entries and everything in `content/chapters/`; `docs/` and the other Markdown files | [CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/) |

## What these licenses do not cover

- **Historical borders.** The files in `content/borders/` are adapted from [Cliopatria](https://github.com/Seshat-Global-History-Databank/cliopatria) 0.2.1 by the Seshat Global History Databank, under [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). [Their README](content/borders/README.md) lists the changes.
- **Quotations.** Words quoted from a cited source belong to their authors and publishers.
- **Images.** Each image keeps the license named next to it.
- **Libraries.** Each library the code uses keeps its own license.

## GSAP

The browser code uses [GSAP](https://gsap.com), which has its own [no-charge license](https://gsap.com/standard-license) and is not open source. As an additional permission under section 7 of the AGPL, the code here may be combined and conveyed with GSAP.

## Contributing

By contributing, you agree that your work is licensed the same way as the part you changed. Sign off your commits with `git commit -s` to confirm the [Developer Certificate of Origin](https://developercertificate.org).
