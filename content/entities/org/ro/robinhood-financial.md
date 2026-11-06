---
uid: 01M56DCEEZ8NQ4B2EYAGZSZNZ6
id: robinhood-financial
type: org
name: "Robinhood Financial"
aliases: ["Robinhood Financial LLC", "Robinhood Financial, LLC"]
summary: "Robinhood's broker-dealer for its customers' accounts."
when: "2013-10/.."
claims:
  - id: c1
    rel: part_of
    to: robinhood
    src:
      - {s: sec-x17a5-2021-02-26-robinhood-financial, at: "Notes to the statement of financial condition, Note 1", quote: "Robinhood Financial, LLC (the “Company”, “we” or “us”) is a wholly owned subsidiary of Robinhood Markets, Inc. (the “Parent”)."}
      - {s: finra-2021-06-30-robinhood-financial-awc, at: "Background", quote: "Robinhood Financial LLC became a FINRA member firm in October 2013 and launched online trading in December 2014."}
  - id: c2
    rel: charged_by
    to: sec
    when: "2020-12-17"
    case: "In the Matter of Robinhood Financial, LLC"
    title: "misleading customers about revenue sources, and failing its duty of best execution"
    src:
      - {s: sec-2020-12-17-robinhood-financial, quote: "charged Robinhood Financial LLC for repeated misstatements that failed to disclose the firm’s receipt of payments from trading firms for routing customer orders to them"}
  - id: c3
    rel: settled_with
    to: sec
    when: "2020-12-17"
    case: "In the Matter of Robinhood Financial, LLC"
    title: "censured, without admitting or denying the SEC’s findings"
    amount: 65000000
    currency: USD
    src:
      - {s: sec-2020-12-17-robinhood-financial, quote: "Robinhood agreed to pay $65 million to settle the charges."}
      - {s: sec-2020-12-17-robinhood-financial, quote: "Without admitting or denying the SEC’s findings, Robinhood agreed to a cease-and-desist order prohibiting it from violating the antifraud provisions of the Securities Act of 1933"}
  - id: c4
    rel: settled_with
    to: finra
    when: "2021-06-30"
    case: "FINRA Letter of Acceptance, Waiver, and Consent No. 2020066971201"
    title: "censured and fined, without admitting or denying the findings"
    amount: 57000000
    currency: USD
    note: "FINRA also ordered it to pay $12,598,445.16 in restitution, plus interest, to customers."
    src:
      - {s: finra-2021-06-30-robinhood-financial-awc, at: "Acceptance and consent", quote: "Respondent hereby accepts and consents, without admitting or denying the findings and solely for the purposes of this proceeding"}
      - {s: finra-2021-06-30-robinhood-financial-awc, at: "Sanctions", quote: "a censure; a $57 million fine; restitution of $12,598,445.16 plus interest as described below;"}
  - id: c5
    rel: "charged_by"
    to: "massachusetts-securities-division"
    when: "2021-10-21"
    case: "E-2020-0047"
    title: "amended administrative complaint alleging Massachusetts securities-law violations"
    note: "The consent order describes allegations about app features and promotions, supervision, options approvals and platform outages. An allegation is not a finding of guilt."
    src:
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "p. 1", quote: "amended administrative complaint filed by the Enforcement Section of the Massachusetts Securities Division"}
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "p. 1", quote: "Robinhood on October 21, 2021 (the \"Complaint\"), alleging Robinhood violated the"}
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "Section VI(A), pp. 6–9", quote: "Digital confetti raining down from the top of the screen after a customer's first trade;"}
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "Section VI(A), p. 9", quote: "Robinhood failed to adequately supervise the approval process through which Massachusetts customer accounts were approved to engage in options trading."}
  - id: c6
    rel: "settled_with"
    to: "massachusetts-securities-division"
    when: "2024-01-18"
    case: "E-2020-0047 and E-2022-0006"
    title: "consent order resolving complaint and cybersecurity investigation"
    amount: 7500000
    currency: "USD"
    note: "Robinhood neither admitted nor denied the complaint-related factual allegations or the legal violations; it admitted the facts of the joined investigation into a November 2021 data breach. The order also required changes to app features and an independent consultant’s review."
    src:
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "p. 2", quote: "Respondent neither admits nor denies the factual allegations set forth in Section VI(A), admits the factual allegations set forth in Section VI(B), neither admits nor denies the Violations of Law set forth in Section VII"}
      - {s: "mass-robinhood-consent-order-2024-01-18", at: "p. 23", quote: "pay an administrative fine in the amount of $7,500,000 to the Commonwealth of Massachusetts."}
  - id: c7
    rel: charged_by
    to: massachusetts-securities-division
    when: "2020-12-16"
    case: "E-2020-0047"
    title: "original administrative complaint alleging tactics aimed at inexperienced investors, supervision failures and platform outages"
    note: "The Securities Division filed the original complaint before the January 2021 trading restrictions. It amended the complaint on 21 October 2021; Robinhood settled it on 18 January 2024 without admitting or denying its facts or legal violations."
    src:
      - {s: "hfsc-2021-02-15-game-stopped-hearing-memo", at: "p. 5", quote: "On December 16, 2020, Massachusetts regulators filed a complaint against Robinhood"}
      - {s: "hfsc-2021-02-15-game-stopped-hearing-memo", at: "p. 5", quote: "aggressive tactics to attract inexperienced investors, its use of gamification strategies to manipulate customers, and its failure to prevent frequent outages and disruptions on its trading platform."}
---

Robinhood Financial LLC is the broker-dealer of [[robinhood]] that holds its customers' accounts. It settled with the SEC in December 2020 and with [[finra]] in June 2021.
