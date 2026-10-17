---
uid: 01M54Z0PY4ZEV6SB6R46HHV8B2
id: pnc-financial-services
type: org
name: "PNC Financial Services Group"
in_sentence: "the PNC Financial Services Group"
aliases: ["PNC", "The PNC Financial Services Group, Inc."]
summary: "American financial services company based in Pittsburgh, Pennsylvania."
claims:
  - id: c1
    rel: owns_stake
    to: blackrock
    when: "1995/2020-05-15"
    percent: 22.4
    as_of: "2020-05-06"
    note: "Held through PNC Bancorp, Inc., a wholly owned PNC subsidiary. PNC sold the stake in a public offering and a buyback by BlackRock, both completed on 15 May 2020, keeping 500,000 shares to give to the PNC Foundation."
    src:
      - {s: pnc-8k-2020-05-15, at: "Item 1.01, Stock Repurchase Agreement", quote: "As of May 6, 2020, PNC Bancorp and its affiliates owned approximately 34.8 million shares of Common Stock and Series B Preferred Stock of BlackRock, representing 22.4% ownership."}
      - {s: pnc-2020-05-11-blackrock-sale-release, at: "Press release of May 11, 2020, paragraph 4", quote: "PNC originally purchased BlackRock in 1995 and the two companies have had a mutually beneficial relationship for more than 25 years."}
      - {s: pnc-8k-2020-05-15, at: "Item 1.01, Stock Repurchase Agreement", quote: "Upon completion of the Secondary Offering and the Stock Repurchase, PNC Bancorp will have divested its entire holding in BlackRock, excluding 500,000 shares of Common Stock that PNC Bancorp is retaining for a donation to the PNC Foundation"}
      - {s: pnc-8k-2020-05-15, at: "Item 1.01, Underwriting Agreement", quote: "The Secondary Offering closed on May 15, 2020."}
  - id: c2
    rel: acquired
    to: blackrock
    when: "1995-02-28"
    amount: 240000000
    currency: "USD"
    note: "PNC was then named PNC Bank Corp. It agreed to the purchase on 16 June 1994. The price was $71 million in cash at closing and $169 million in debt payable to the firm's partners (BlackRock's 1999 prospectus)."
    src:
      - {s: pnc-10k-1994, at: "Item 1, Business", quote: "On February 28, 1995, the Corporation completed the acquisition of BlackRock Financial Management L.P. and related partnerships (\"BlackRock\") for approximately $240 million in cash and notes."}
  - id: c3
    rel: owns_stake
    to: blackrock
    percent: 70
    as_of: "1999-12-31"
    note: "After the initial public offering of 1 October 1999 (9 million shares at $14 each). PNC's 2020 exit is already recorded."
    src:
      - {s: blackrock-10k-1999, at: "Item 1, Business, Overview", quote: "On October 1, 1999, BlackRock offered 9 million shares of class A common stock in an initial public offering. Following our IPO, PNC owns 70%, the public owns 14% and BlackRock employees own 16% of BlackRock."}
---
