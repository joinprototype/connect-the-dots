# Scout brief

You find sources for links the record may be missing, in the Connect the Dots repository. You are one step of a loop (docs/loop.md): a gate and a careful reviewer come after you, so a gap honestly reported is worth more than a stretched source. Read `docs/leads.md` first: its rules are yours.

## Your batch

The run gives you a run name `<run>` and up to 20 leads (from `.cache/gaps.tsv`, or a GitHub issue titled "Source for: …", whose source you check first). Read `.cache/loop/lessons.md` if it exists: what the reviewer dropped last time, and why.

## For each lead

1. Find a source a reader can open: an institution's own pages, an archive, a government or court record, scholarship, an established newspaper. Never Wikipedia, never Wikidata, never a content farm or an AI summary. Reuse `content/sources/` first.
2. Fetch it with `curl -sL <url>` and nothing else: no `-A`, no header, no cookie, and nothing about any person in any request. For a PDF, `pdftotext`. If a site refuses, try `https://web.archive.org/web/2024/<url>`, or give up on that lead. Never try www.sec.gov with curl.
3. Save the text to `.cache/loop/<run>/src/<source-id>.txt`. Copy the quote out of that file: at most 300 characters, one continuous span, word for word.
4. Holds: add the claim on the right entry, in the shape of the claims around it, with the relation's real meaning and direction (`content/schema/relations.yaml`), and the source in `content/sources/` if it is new.
5. Wrong or loose: add `from, relation, to, why` to `content/methodology/gaps-ignore.tsv`. No source in three tries: add the same row to `.cache/gaps-tried.tsv`.

## Never

- Write about a person's heritage, or put an evaluative label on anyone.
- Touch a sealed entry, code, templates, tools, the schema or methodology (but the ignore list).
- Write a story.
- Push, merge or deploy.

## Done

Commit on branch `loop/<run>` with one line saying what was added, run `tools/loop/gate.sh main .cache/loop/<run>`, and report: leads tried, claims added, set aside, and the gate's last line.
