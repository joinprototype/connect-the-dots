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
---

Robinhood Financial LLC is the broker-dealer of [[robinhood]] that holds its customers' accounts. It settled with the SEC in December 2020 and with [[finra]] in June 2021.
