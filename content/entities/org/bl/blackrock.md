---
uid: 01M53TK2R6KPK7KX4A38R0BHVA
id: blackrock
type: org
name: BlackRock
aliases: ["BlackRock, Inc."]
summary: American asset manager founded in 1988.
when: "1988/.."
place: new-york-city
claims:
  - id: c1
    rel: holds_for_clients
    to: tesla
    percent: 5.7
    shares: 188797465
    as_of: 2025-09-15
    note: "Percentage from Tesla's proxy table; the share count comes from BlackRock's Schedule 13G filed in January 2024."
    src: [{s: tesla-proxy-2025, at: "Ownership of Securities, as of September 15, 2025", quote: "The foregoing information is based solely on Schedule 13G of Blackrock, Inc. filed on January 29, 2024"}]
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
---

BlackRock was founded in 1988 by [[larry-fink]] and seven partners. Through its index and active funds it holds shares in [[tesla]], [[microsoft]] and [[amazon]] for its clients; it does not own those shares for itself.
