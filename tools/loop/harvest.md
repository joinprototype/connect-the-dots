# Harvest brief

You read sources the record has already saved and write the links they support that the record does not hold yet, in the Connect the Dots repository. You are one step of a loop (docs/loop.md, "Harvest"): a gate and a careful reviewer come after you, so ten links that hold are worth more than forty that stretch. Read `docs/leads.md` first: its rules on quotes and relations are yours.

## What the run gives you

`<run dir>` holds:

- `src/<source id>.txt`: the saved text of each source, one file per entry in `content/sources/`. These are the only texts you quote. Fetch nothing: no network.
- `sources.tsv`: each source's id, title and address.
- `entries.tsv`: every entry in the record (id, type, name, when, sealed). Grep it; never read it whole.
- `links.tsv`: every link the record already holds (from, rel, to). A link already there is not new, in either direction.
- `candidates.tsv`: pairs of entries that one saved text names close together and the record does not join yet, best first. Columns: `a, a_name, b, b_name, source, passages, passage`; `passage` holds up to three places where both are named, each led by its source id in brackets.
- `newcomers.tsv`: people the texts name whom the record lacks, each named near two or more record entries, best first. Columns: `wikidata, name, description, years, living, same_name, mentions, joined, passages`. The name, id, description and years come from the atlas, open data anyone can edit: a lead to the right person, never a source. `same_name` counts atlas people with that name; `joined` lists the record entries named near them; `passages` are led by `[source id · entry id]`.

Read `.cache/loop/lessons.md` if it exists: what the reviewer dropped before, and why.

## Your work: newcomers first, then every candidate

### Newcomers

Go through `newcomers.tsv` row by row. For each person:

1. Read the passages, and grep `src/` for more places that name them. Is the person the texts mean the atlas's person? The description and years must fit the texts (a 1947 governor is not a judge born in 1960); with `same_name` over 1, be sure. If not, log `not this person`.
2. Find links to entries in `entries.tsv` that one continuous span states, by the rules for each link below. A new entry needs two or more such links, to two different entries; with fewer, log `not stated` and write nothing.
3. Write the entry at `content/entities/person/<first two letters of id>/<id>.md`, in the shape of the person entries around it: `id` (the name in lower case with hyphens, unused in `entries.tsv`), `type: person`, `name`, a one-line `summary` that says what the sources show them doing, with no evaluative label, `same_as: {wikidata: <id>}` only when step 1 is sure, and its `claims`. A link that belongs on the other entry (a body's chair, say) still goes on the new person's entry, in the relation's direction.
4. Log one line in `judged.tsv`: `<wikidata>, <name>, verdict, <links written>, <sources>`, the verdict `written`, `not stated`, `not this person` or `forbidden`.

At most eight new people in a run. When you have added them, run `ctd fmt` (the engine's path, as for `check`) once, so each new file gets its permanent id.

### Candidates

Then go through `candidates.tsv` row by row, all of it. For each row:

1. Read its passage. Then grep `src/<source>.txt`, and the other files in `src/`, for more places that name both (a person is often named by surname alone: "Nehru", "Lord Mountbatten").
2. Ask: does one continuous span of one text state a link between these two, in a relation of `content/schema/relations.yaml`? Being named side by side is not a link: two leaders at one conference, a survivor who mentions a leader, a book that discusses a man.
3. If it does, and nothing under "Never" forbids it, write the claim (below).
4. Append one line to `<run dir>/judged.tsv`, tab-separated: `a, b, verdict, relation, source`, where the verdict is `written`, `not stated` or `forbidden` (a Never rule; name it in the relation column). Every row of `candidates.tsv` gets a line.

Typical links: who held which office and when; who was a member of which body, party, commission or delegation; who wrote, signed or enacted which document; which body was part of which; who took part in which conference or negotiation. `involved` is for a person who took part in an event, not for one who lived through a war.

When the candidates are done, you may add other links you met on the way, by the same rules, and log them too.


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

Run `ctd check` (the run gives you its path) until it reports 0 errors, then `python3 tools/qa/quotecheck.py <run dir> origin/main`, and report: how many newcomers and candidates you judged and each verdict's count (from `judged.tsv`), new entries (id, wikidata or none), links added (from, rel, to, source, one line each), and the checks' last lines.
