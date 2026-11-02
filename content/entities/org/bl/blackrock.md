---
uid: 01M53TK2R6KPK7KX4A38R0BHVA
id: blackrock
type: org
name: BlackRock
aliases: ["BlackRock, Inc."]
summary: American asset manager founded in 1988.
same_as: {wikidata: Q219635}
image: {url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/50_Hudson_Yards.png/960px-50_Hudson_Yards.png", license: "CC BY-SA 4.0", author: "Dazzling4", page: "https://commons.wikimedia.org/wiki/File:50_Hudson_Yards.png"}
when: "1988/.."
place: new-york-city
claims:
  - id: c1
    rel: holds_for_clients
    to: tesla
    percent: 4.96
    shares: 196348742
    as_of: 2026-09-30
    note: "BlackRock reported sole voting power over 180,605,472 of them. Tesla's 2025 proxy table gave 5.7%, from a 2024 filing."
    src:
      - {s: blackrock-13ga-4-2026-10-27-tesla, at: "Item 4(a) and (b)", quote: "Amount beneficially owned: 196348742 (b) Percent of class: 4.96 %"}
      - {s: tesla-proxy-2025, at: "Ownership of Securities, as of September 15, 2025", quote: "The foregoing information is based solely on Schedule 13G of Blackrock, Inc. filed on January 29, 2024"}
  - id: c2
    rel: holds_for_clients
    to: microsoft
    percent: 7.3
    shares: 540020228
    as_of: 2025-09-30
    note: "Percentage from Microsoft's proxy table; the share count comes from BlackRock's Schedule 13G/A filed in February 2024."
    src: [{s: msft-proxy-2025, at: "Principal Shareholders, as of 09/30/2025", quote: "All information about BlackRock, Inc. is based on a Schedule 13G/A filed with the SEC on February 13, 2024."}]
  - id: c3
    rel: holds_for_clients
    to: amazon
    percent: 5.9
    shares: 630188686
    as_of: 2026-02-24
    note: "Percentage from Amazon's proxy table; the share count is as of December 31, 2023, per BlackRock's Schedule 13G."
    src: [{s: amazon-proxy-2026, at: "Security ownership table, as of February 24, 2026", quote: "Based on information provided in a Schedule 13G filed February 12, 2024."}]
  - id: c4
    rel: headquartered_in
    to: new-york-city
    src: [{s: blackrock-10k-2025, at: "Item 2. Properties", quote: "BlackRock's principal office, which is leased, is located at 50 Hudson Yards, New York, New York."}]
  - id: c5
    rel: acquired
    to: merrill-lynch-investment-managers
    when: "2006-09-29"
    note: "BlackRock paid in shares. Its 10-K values the total consideration at $9,083,928 thousand (about $9.1 billion), net of cash acquired. The deal was agreed on 15 February 2006."
    src:
      - {s: blackrock-10k-2006, at: "Notes to the Consolidated Financial Statements, Note 2, Mergers and Acquisitions", quote: "On September 29, 2006, the Company completed the MLIM Transaction and issued 52,395,082 shares of BlackRock common stock and 12,604,918 of series A non-voting participating preferred stock to Merrill Lynch in consideration for the MLIM Business."}
  - id: c6
    rel: acquired
    to: barclays-global-investors
    when: "2009-12-01"
    amount: 15180000000
    currency: "USD"
    note: "$8.53 billion in BlackRock shares at closing plus $6.65 billion in cash. BGI brought the iShares exchange-traded funds."
    src:
      - {s: blackrock-10k-2009, at: "Item 7, Overview (sentence begins \"On December 1, 2009,\")", quote: "BlackRock acquired from Barclays Bank PLC (“Barclays”) all of the outstanding equity interests of subsidiaries of Barclays conducting the business of Barclays Global Investors (“BGI”) in exchange for capital shares valued at closing of $8.53 billion and $6.65 billion in cash"}
  - id: c7
    rel: settled_with
    to: sec
    when: "2017-01-17"
    case: "In the Matter of BlackRock, Inc."
    title: "removing whistleblower incentives in separation agreements; without admitting or denying the findings"
    amount: 340000
    currency: USD
    src:
      - {s: sec-2017-01-17-blackrock, quote: "has agreed to pay a $340,000 penalty to settle charges that it improperly used separation agreements"}
      - {s: sec-34-79804-blackrock, quote: "Through its conduct described above, BlackRock violated Rule 21F-17 under the Exchange Act."}
      - {s: sec-34-79804-blackrock, at: "Section II", quote: "without admitting or denying the findings herein"}
  - id: c8
    rel: disputes_finding
    to: anticompetitive-effects-of-common-ownership
    when: "2019-01-15"
    according_to: [blackrock]
    note: "The letter calls the study the “AST Paper”. Analysis Group is a consultant BlackRock hired."
    src:
      - {s: blackrock-ftc-hearing-8-letter-2019-01-15, at: "Part I", quote: "When the aforementioned erroneous assumptions are corrected, Analysis Group finds no statistically significant relationship between ‘common ownership’ and airline ticket prices."}
      - {s: blackrock-ftc-hearing-8-letter-2019-01-15, at: "Part I", quote: "This testing was performed by a third party consultant, Analysis Group, hired by BlackRock."}
  - id: c9
    rel: holds_for_clients
    to: procter-and-gamble
    percent: 6.65
    shares: 155762299
    as_of: "2023-12-31"
    note: "Percentage and share count from the table in P&G's 2025 proxy statement, which relies on BlackRock's Schedule 13G/A of January 2024."
    src:
      - {s: pg-proxy-2025, quote: "Based on information as of December 31, 2023, contained in a Schedule 13G/A filed with the SEC on January 29, 2024, by BlackRock, Inc."}
  - id: fh1
    rel: holds_for_clients
    to: estee-lauder-companies
    when: "2022-02-01"
    percent: 7.3
    shares: 16953258
    as_of: "2022-02-01"
    note: "7.3 per cent of Class A shares, which carry one vote each; 1.1 per cent of the total voting power. The proxy relies on BlackRock’s Schedule 13G amendment of 1 February 2022."
    src:
      - {s: elc-proxy-2022, quote: "BlackRock, Inc.(29) 16,953,258 7.3% — — 1.1%"}
  - id: fh2
    rel: holds_for_clients
    to: unilever
    when: "2025-12-31"
    percent: 8.5
    as_of: "2025-12-31"
    src:
      - {s: unilever-annual-report-2025, quote: "BlackRock, Inc. with a shareholding of 8.5%"}
  - id: fh3
    rel: holds_for_clients
    to: exxonmobil
    when: "2021-05"
    percent: 6.7
    as_of: "2021-05"
    note: "As stated in a law firm’s account of the 2021 proxy fight."
    src:
      - {s: mondaq-2021-07-07-engine-no-1-exxon, quote: "namely Vanguard (8.2%), Blackrock (6.7%) and State Street Corporation (5.7%)"}
  - id: fh4
    rel: launched
    to: blackrock-voting-choice
    when: "2022"
    src:
      - {s: blackrock-voting-choice-page, quote: "We launched BlackRock Voting Choice in 2022 to make participation in the proxy voting process easier and more accessible for eligible clients."}
      - {s: blackrock-voting-choice-page, quote: "$923bn of our eligible AUM ($3.96tn) committed to BlackRock Voting Choice"}
  - {id: c10, rel: "invested_in", to: xai, when: "2024-12-23", note: "xAI names BlackRock among the investors in its $6 billion Series C round. It does not say which BlackRock funds took part or how much.", src: [{s: xai-2024-12-23-series-c, at: announcement, quote: "We have closed our Series C funding round of $6 billion with participation from key investors including A16Z, Blackrock, Fidelity Management & Research Company, Kingdom Holdings, Lightspeed, MGX, Morgan Stanley, OIA, QIA, Sequoia Capital, Valor Equity Partners and Vy Capital, amongst others"}]}
  - {id: c11, rel: "member_of", to: ai-infrastructure-partnership, when: "2024-09/..", role: "announcing partner, with Global Infrastructure Partners, a part of BlackRock", src: [{s: blackrock-2025-03-19-aip, at: "opening paragraph", quote: "BlackRock, Global Infrastructure Partners (GIP), a part of BlackRock, Microsoft, and MGX today announced that NVIDIA and xAI will join the Global AI Infrastructure Investment Partnership"}, {s: blackrock-2025-03-19-aip, at: body, quote: "AIP has attracted significant capital and partner interest since its inception in September 2024"}]}
  - {id: c12, rel: "invested_in", to: texas-stock-exchange, when: "2024-05", note: "The TRADE understands BlackRock took a minority investment; the amount is not given.", src: [{s: thetrade-2024-06-txse, at: opening, quote: "Texas Stock Exchange (TXSE) has raised $120 million from around a dozen investors including BlackRock and Citadel Securities in a funding round closed in May."}, {s: thetrade-2024-06-txse, at: "BlackRock’s statement", quote: "BlackRock is proud to be a founding investor in the Texas Stock Exchange to increase liquidity and improve market efficiency for BlackRock’s clients and other investors in the US capital markets"}]}
  - id: c13
    rel: holds_for_clients
    to: chevron
    percent: 7.0
    shares: 131461833
    as_of: "2023-12-31"
    note: "From BlackRock’s Schedule 13G/A of January 2024, as Chevron’s 2026 proxy lists it; the proxy says BlackRock’s holding may have changed since."
    src:
      - {s: chevron-proxy-2026, at: "Security ownership table", quote: "BlackRock, Inc.(5) 131,461,833 — 131,461,833 7.00%"}
      - {s: chevron-proxy-2026, at: "Security ownership table", quote: "The following table shows, to our knowledge, the ownership interest in Chevron common stock as of March 16, 2026 (unless otherwise noted), for (i) holders of more than 5% of our outstanding common stock;"}
---

BlackRock was founded in 1988 by [[larry-fink]] and seven partners. Through its index and active funds it holds shares in [[tesla]], [[microsoft]] and [[amazon]] for its clients; it does not own those shares for itself.
