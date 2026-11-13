# ADR-0039: Harvest the sources we already saved

- Status: accepted; nightly since 2026-11-13, one older story a night after the leads run (pilot runs: 10 links, then 4 people and 8 links)
- Date: 2026-11-12

## Context

The leads run (ADR-0025, ADR-0037) starts from a lead that open data suggests and hunts the web for a source. In nine runs from 2026-11-03 to 2026-11-12 it kept 26 links from about 160 leads, and three nights kept none. Most leads are the dull kind open data holds in bulk (located in, born in, headquarters), and each one costs a web search that a cheap model usually loses. At that rate the record never reaches a million read dots.

The story runs (ADR-0038) meanwhile save the text of every source they read: 5,190 files from 96 stories by 2026-11-12. Hearings, treaties, gazettes, court opinions, speeches and letters, each naming far more people, bodies and acts than its story uses.

## Decision

1. A **harvest** starts from a source instead of a lead. It reads a story's saved sources and writes the links they state between entries already in the record, quoted word for word from the saved text. Steps in [docs/loop.md](../loop.md#harvest), brief in [tools/loop/harvest.md](../../tools/loop/harvest.md).
2. `tools/loop/harvest-prep.py` (no model) matches each saved file to its source by the quotes the record already cites from it, so the harvester knows which text is which source and quotes only those.
3. The harvester fetches nothing. The gate and the reviewer are the leads run's: the reviewer fetches every source again itself, and a book it cannot fetch is read from the saved copy and named.
4. What a harvest may not write is narrower than a leads run: no harms or deaths tied to a named person, no heritage or religion, no stories, no sensitive, legal, kinship or background relation, and at most five new entries, each joined to two or more old ones.

## Pilot

One run by hand on 2026-11-12, `harvest-2026-11-12-1`, line in `.cache/loop/runs.tsv`. The bar set before it: keep harvest if one run keeps 20 links or more, against about 3 a night from leads.

- **Midnight, 1947** (25 sources, written the same day): 107 candidates, 3 links written, 2 kept (the Commons and the Lords adopted the Indian Independence Act). Nehru as the Congress's president was dropped: the source dates it to 10 July 1946, the Prime Minister's Office to 6 July.
- **The Crash of 2008** (19 sources, the Inquiry Commission's report the largest): 120 candidates, 8 links written, 8 kept, 2 of them with a quote trimmed: Congress founded the Federal Reserve, the FDIC, the CFTC and the Inquiry Commission and passed Dodd-Frank; the Fed and the New York Fed funded Bear Stearns; the Senate Banking Committee is part of the Senate.
- In all: **10 links kept, 1 dropped, 0 for the founder**, against 26 in nine leads runs. The reviewer fetched every source again and found no invented quote.
- The harvester fetched nothing. GPT-6-Luna wrote nothing in 80 candidates (it marked all "not stated" in four minutes); GPT-6.1-Sol at medium read them: 1.8M input tokens for one story, 4.7M for the other, 95% cached, on the ChatGPT plan. Claude's weekly use went from 29% to 30%.

What limited it:

1. Most pairs named side by side are not a stated link: 185 of 227 were "not stated" and 33 forbidden, mostly two leaders who "dealt with" each other, a sensitive relation.
2. A new story has already taken its sources' best links; an older one with big official reports gives more (no-model counts of candidates with role words: the 2008 crash 103, Watergate 105, Cuba 106, against 9 for Partition).
3. The people the sources name most are often not in the record (Maulana Azad, Liaquat Ali Khan, Stafford Cripps, Winston Churchill), and the harvester added no new entry. Newcomers, below, answer this.

**Newcomers** (a second run, `harvest-2026-11-12-2`, the same day). Prep now also lists the people a story's texts name whom the record lacks, found by their names in the atlas (420,000 well-known people, with a Wikidata id, description and years; a lead to the right person, never a source), each named near two or more record entries. People the record holds under another spelling ("Mohammad Ali Jinnah"), and a bare surname the record already uses ("Nehru"), do not count. On Partition's 25 newcomers the harvester wrote 4 new people with two links each: Liaquat Ali Khan (the Muslim League's general secretary, finance minister in the interim government), Rajendra Prasad, Abul Kalam Azad and Winston Churchill, who was not in the record at all. It set aside 3 as not the atlas's person. The reviewer checked each Wikidata id against Wikidata and kept all 4 entries and 8 links, trimming 2 quotes. Cost: 2.1M input tokens (94% cached) to write, 1.1M to review.

So one story gave 2 links from its pairs and 8 links and 4 people from its newcomers. Newcomers yield more because a story's sources name many more people than the record holds. On the 2008 crash's sources the atlas matched famous namesakes for lesser-known bankers (a silent-film comedian for Citigroup's Charles Prince): the harvester must judge, and does.

**Two older stories** (`harvest-2026-11-12-3` and `-4`, the same night, newcomers then pairs, 145 rows each). Watergate's sources gave 11 links and 4 new people: Elliot Richardson (Attorney General, Secretary of Defense), Egil Krogh (head of the Plumbers), William Rehnquist and William Ruckelshaus; Mitchell as head of the re-election committee; the Defense Department produced the Pentagon Papers. Cuba's gave 10 links and 1 new person, McGeorge Bundy, and who sat on Operation MONGOOSE's oversight groups: McNamara, Gilpatric, McCone, Helms, Rusk. The reviewers kept all 21 links and 5 Wikidata ids; three Watergate quotes held scan errors from the Senate report's OCR ("Pentagoi Papers") and were swapped for clean spans of the Special Prosecution Force's report. 10 of 50 newcomers were the atlas's namesakes (a Scottish footballer for Haldeman's aide Gordon Strachan, an English physician for the CIA's William Harvey) and were set aside; the right man then goes unwritten, since a new entry needs its Wikidata id. Cost: 5.6M input tokens to write and 1.0M to review, 95% cached, about ten minutes a story.

The founder gave the word for a nightly harvest on 2026-11-12: one older story a night, newcomers then pairs, run by the 03:00 leads run after its own merge, under the same lock ([night.md](../../tools/loop/night.md), "Harvest"; the order in `tools/loop/harvest-pick.py`).

## Consequences

- Links that join two stories come from the stories' own reading, which is where the site's value is.
- No fetching in the cheap step, so it costs less and cannot break the fetch rules.
- A harvest only reaches what a story already read: it deepens the record around stories, and does not replace leads for entries no story touches.
