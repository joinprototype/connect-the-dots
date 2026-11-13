# Harvest brief

You read sources the record has already saved and write the links they support that the record does not hold yet, in the Connect the Dots repository. You are one step of a loop (docs/loop.md, "Harvest"): a gate and a careful reviewer come after you, so ten links that hold are worth more than forty that stretch. Read `docs/leads.md` first: its rules on quotes and relations are yours.

## What the run gives you

`<run dir>` holds:

- `src/<source id>.txt`: the saved text of each source, one file per entry in `content/sources/`. These are the only texts you quote. Fetch nothing: no network.
- `sources.tsv`: each source's id, title and address.
- `entries.tsv`: every entry in the record (id, type, name, when, sealed). Grep it; never read it whole.
- `links.tsv`: every link the record already holds (from, rel, to). A link already there is not new, in either direction.
- `candidates.tsv`: pairs of entries that one saved text names close together and the record does not join yet, most often named first. Columns: `a, a_name, b, b_name, source, passages, passage`; `passage` is one place in `src/<source>.txt` where both are named.

Read `.cache/loop/lessons.md` if it exists: what the reviewer dropped before, and why.

## Your work: every candidate, in order

Go through `candidates.tsv` row by row, all of it. For each row:

1. Read its passage. Then grep `src/<source>.txt`, and the other files in `src/`, for more places that name both (a person is often named by surname alone: "Nehru", "Lord Mountbatten").
2. Ask: does one continuous span of one text state a link between these two, in a relation of `content/schema/relations.yaml`? Being named side by side is not a link: two leaders at one conference, a survivor who mentions a leader, a book that discusses a man.
3. If it does, and nothing under "Never" forbids it, write the claim (below).
4. Append one line to `<run dir>/judged.tsv`, tab-separated: `a, b, verdict, relation, source`, where the verdict is `written`, `not stated` or `forbidden` (a Never rule; name it in the relation column). Every row of `candidates.tsv` gets a line.

Typical links: who held which office and when; who was a member of which body, party, commission or delegation; who wrote, signed or enacted which document; which body was part of which; who took part in which conference or negotiation. `involved` is for a person who took part in an event, not for one who lived through a war.

When the candidates are done, you may add other links you met on the way, by the same rules, and log them too.

A new entry only when a source names a person, body or document plainly and the same sources give it two or more links to entries already in `entries.tsv`. Give it the shape of entries of its type around it, an id like theirs, and a one-line summary with no evaluative label. At most five new entries in a run.

## For each link

1. The quote is copied from `src/<source id>.txt`: at most 300 characters, one continuous span, word for word. It must say the whole link by itself: both ends named (or the page's own subject plainly one of them), the relation, and its date if the link has one. Never a menu item, a lone name from a list, a heading, or a date alone. Write it on one line: a line break in the saved text becomes a space, and a word split by a hyphen at a line's end is joined.
2. Use the relation's real meaning and direction in `content/schema/relations.yaml`. `founded` is not "signed the act"; `member_of` is not "spoke to"; `part_of` is not "reported to"; `involved` is the weakest and is for an event only when nothing more exact fits.
3. Add the claim on the right entry, after its other claims, in their shape, with the next free claim id (`c1`, `c2`, …) on that entry and the source id from `sources.tsv`.
4. A link you are unsure of: leave it out, and log it as `not stated`.

## Never

- A relation marked `sensitive`, `legal`, `kinship` or `background`, or `attributed`, or any `according_to` or dispute.
- Anything about a person's heritage, religion or ethnicity, or an evaluative label on anyone. Religion and community appear in these sources often: they are never a link.
- Killings, abuse, crimes or deaths as a link to a named person. Those stay in the stories, with their writer and skeptic.
- A person who may be alive beyond an office, a company role, a party or body they belonged to, a degree or a public statement. Many entries have no dates: judge by the sources and the entry's summary. Someone in public life before 1940 is not alive.
- A sealed entry, code, templates, tools, the schema, methodology, stories (`content/chapters/`), or `content/sources/` (all the sources you need are there).
- More than 40 new quotes, or more than three from one modern book of scholarship. A published collection of a person's own speeches or letters is that person's words, not scholarship.
- Commit, push, merge, or fetch anything.

## Done

Run `ctd check` (the run gives you its path) until it reports 0 errors, then `python3 tools/qa/quotecheck.py <run dir> origin/main`, and report: how many candidates you judged and each verdict's count (from `judged.tsv`), links added (from, rel, to, source, one line each), new entries, and the checks' last lines.
