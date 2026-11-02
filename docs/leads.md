# Checking leads

`ctd gaps` lists what the record may be missing ([ADR-0025](decisions/0025-leads-not-links.md)). This page is how a lead becomes a link, for a person or an agent. Wikidata suggested each lead and nobody has checked it: it is a question, not a fact.

The columns of `.cache/gaps.tsv` are `kind, score, from, relation, to, why`. `from` and `to` are entry ids, or Wikidata ids for what the record does not hold yet.

## Order

1. `ids`: read each by eye. Many are false alarms, because the atlas leaves some entries out. Change an id only after `wbsearchentities` and the item's own description agree. Never type an id from memory.
2. `links` scoring 20 or more, then 10 to 19.
3. `thin` rows with score 2, where a well-known entry has one link or none.

Prefer a lead that joins two stories (chapters list their entries in `reveal:`). Skip `located_in` to a country, and country memberships past the first few: true, and they join nothing.

## For each lead

- Find a source a reader can open: an institution's own history page, an archive, a government or court record, scholarship, an established newspaper. Reuse `content/sources/` first. Never Wikipedia. Never Wikidata as the source.
- **It holds:** add an ordinary claim on the right entry, in the shape of the claims around it, with the relation's real meaning and direction (`content/schema/relations.yaml`), its date if the source gives one, and a quote of at most 300 characters, word for word, one continuous span.
- **It is wrong, loose or an interpretation:** do not write it. Add `from, relation, to, why` to `content/methodology/gaps-ignore.tsv`, tab-separated. It will not come back.
- **No source in a few tries:** do not stretch one. Add the same row to `.cache/gaps-tried.tsv`, outside the repo, so the next run tries something else. It may still be true.

Known traps: `founded` is the weakest relation, since a president who signed an act did not found the agency. `produced` often means a contractor. `citizen_of` is never worth writing. Interpretations carry `according_to`. No evaluative labels on people. Nothing about a person's heritage (ADR-0016).

## Quotes

Get text with `curl -sL`, and `pdftotext` for a PDF, and save it to `.cache/sources/leads/<source-id>.txt`, outside the repo. Copy each quote from that text. A summary from a fetch tool is never the origin of a quote. If a site refuses `curl`, try the Internet Archive copy (`https://web.archive.org/web/2024/<url>`) or leave it. Never change a User-Agent to get round a refusal, and do not try www.sec.gov with `curl`.

Before each commit, both must pass:

```sh
ctd check
python3 tools/qa/quotecheck.py <saved text> main
```

## The rolling branch

A scheduled run adds to one branch, `leads`, in its own worktree, and stops there. It never pushes, merges or deploys. A person reviews the branch before a release, as with any change.
