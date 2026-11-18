# ADR-0042: Telling search engines what a page is about

- Status: accepted
- Date: 2026-11-17

## Context

The founder asked why so few pages are found. Search Console showed the site map listing about 4,650 pages, about 1,000 of them indexed and 3,500 "discovered, not indexed", with no link from any other site. An entry's page said who or what it was about only in prose: nothing told a search engine that the page for Trevor Blackwell is about a person, or that he is the same person as Wikidata's Q4088422.

## Decision

1. Every entry's page carries one block of schema.org JSON-LD in its head: the page (`WebPage`, part of the site), and its subject, joined by `mainEntity` and `mainEntityOfPage`.
2. The subject's type comes from the content schema, never the engine: `schema_org` on a type in `entity-types.yaml` (`Person`, `Organization`, `Place`, `CreativeWork`). A type that names none is a `Thing`.
3. The subject states only what the page shows in its heading and facts: name, "also known as", the one-line summary, the picture, and the `same_as` links that have an address (Wikidata, LEI, SEC). A place also gives its own coordinates.
4. It never states: dates (a page gives a span that may be approximate, and structured data would state it as exact), a `url` for the subject (our page is about it, not its home), any link between entries, or anything from Background. Heritage stays a sourced line on the person's page and nowhere else ([ADR-0016](0016-who-a-person-is.md)).
5. Events stay a `Thing` for now. Search engines expect an `Event` to have a start date, and report every one without it as an error.
6. The block is data, not script: the Content-Security-Policy does not change.

## Consequences

- The first release with this changes one line on every entry's page, so all of them upload once.
- `schema.json` is unchanged: `schema_org` is read by the engine and not written for the browser.
- To revisit: exact dates, and with them `Event`; stories as `Article`. Both are in the backlog.
- Whether more pages get indexed shows in Search Console over the following weeks, under Pages. Structured data makes a page clearer to a search engine; it does not oblige one to index it.
