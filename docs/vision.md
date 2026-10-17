# Vision

## In one line

An open, interactive map of knowledge where anyone can connect the dots, and see the evidence and the perspectives behind every line.

## The problem

- Encyclopedias are walls of text. The connections between people, organizations, events and ideas are buried in prose.
- One article tells one story. Which story you get often depends on who wrote it and where you live; US and Soviet accounts of the same Cold War event are the classic case.
- Readers rarely see why a statement is believed: who says so, based on which document, and who stands behind that source.

## What we are building

1. **A knowledge graph of any topic.** People, organizations, places, events, works, ideas and traditions, linked by sourced claims.
2. **Lenses.** As with map modes, one subject can be seen through People & power, Money (ownership and investment), Ideas & tech, or History (timeline). The Map shows everything by place and era.
3. **Perspectives side by side.** Interpretations are attributed ("according to X"). Facts carry visible evidence. Agreement across opposing sides counts most. Readers compare the narratives and judge for themselves.
4. **A game-like explorer.** An open world of dots you can fly through. Only what is near is loaded and drawn, so it stays fast with millions of nodes.
5. **Interactive stories.** Chapters in the style of a strong explainer video: globe fly-ins, borders changing through time, documents with highlighted quotes. Every frame is live data you can pause and explore.
6. **Open contribution through git.** Content lives in a public repo as readable files. Anyone can propose changes through a pull request, and every page shows its change history.

## Principles

- **Evidence over assertion.** Every claim has a source, and the strength of the evidence is visible.
- **Attribution over verdicts.** Interpretations are labelled with who holds them. There are no crowd-voted labels on people ("compromised", "bad actor"); we record sourced events instead.
- **No false balance.** Weak evidence looks weak. Fringe claims are attributed and flagged, not given parity.
- **A connection is not evidence of wrongdoing.** Paths explain how things link, with evidence on every hop.
- **Generic engine, vocabulary as data.** Domains such as finance, religion and history are data in the content repo, never code.
- **Open by default.** The engine, the data and the ranking methodology are public, so anyone can check how a result was produced.
- **Cheap and fast.** Static files first. Render only what is near. Precompute once, serve many times.
- **English first.**

## Not now

- Social features (communities, comments, votes, feeds) wait for v2, if the project picks up.
- No accounts or database of our own in the MVP.
- No AI-generated claims about people.

## Example journeys (test cases, not scope)

- Bible → prophets → Jesus → other religions, and how each tradition sees the same figures.
- Elon Musk, Bill Gates and Jeff Bezos → the companies they built and funded → their largest holders (BlackRock, Vanguard) → who owns those, and why holding shares for clients is not ownership.
- GameStop → Robinhood → Citadel → Melvin Capital: several different kinds of link between the same names.
- One Cold War event told by the US and by the USSR, side by side, with the facts both sides confirm.
- Santa Monica as a place hub: everything that happened there or came from there.

## Success at public alpha

- People explore for minutes, not seconds, and share paths and chapters.
- Outside contributors get properly sourced PRs merged.
- Pages load fast on a mid-range phone, and hosting stays around $5 a month.
