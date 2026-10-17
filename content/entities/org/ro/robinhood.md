---
uid: 01M54JKTHGS2SQV03QZGZ1V3RJ
id: robinhood
type: org
name: "Robinhood Markets"
aliases: ["Robinhood Markets, Inc.", "Robinhood"]
summary: "American retail brokerage and financial services company founded in 2013."
when: "2013/.."
claims:
  - id: c1
    rel: routed_orders_to
    to: citadel-securities
    when: "2019/2021-03"
    note: "Through its subsidiary Robinhood Securities. Citadel Securities paid Robinhood for these orders (payment for order flow): 34% of Robinhood's total revenues in 2020 and 27% in the first quarter of 2021. The S-1 says such arrangements are not documented under binding contracts."
    src:
      - {s: robinhood-s1-2021-07-01, at: "Notes to the consolidated financial statements, Note 1, Concentration of credit risk, p. F-10", quote: "We had revenues from market makers in excess of 10% of total revenues, as follows: Year Ended December 31, 2019 2020 Market maker: Citadel Securities, LLC 29 % 34 %"}
      - {s: robinhood-s1-2021-07-01, at: "Notes to the condensed consolidated financial statements (unaudited), Note 1, Concentration of credit risk, p. F-48", quote: "We had transaction-based revenues from market makers in excess of 10% of total revenues, as follows: Three Months Ended March 31, 2020 2021 Market maker: Citadel Securities, LLC 31 % 27 %"}
      - {s: hfsc-hearing-117-3-transcript, at: "Vladimir Tenev, answering Mr. Torres", quote: "Citadel is indeed an important counterparty. It's our largest counterparty in terms of where we route orders to", by: vlad-tenev}
      - {s: hfsc-hearing-117-3-transcript, at: "Vladimir Tenev, answering Mrs. Axne", quote: "The 606 reports do publicly detail the payment for order flow arrangements we have with Citadel Securities and our other market makers.", by: vlad-tenev}
      - {s: hfsc-hearing-117-3-transcript, at: "Kenneth C. Griffin, answering Mr. Gonzalez of Texas", quote: "Now, Citadel Securities owes a duty of best execution for every order that comes from Robinhood", by: ken-griffin}
---
