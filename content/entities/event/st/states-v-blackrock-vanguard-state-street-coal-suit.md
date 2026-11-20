---
uid: 01M6DJ3BX992G79QPMSAX64V62
id: "states-v-blackrock-vanguard-state-street-coal-suit"
type: "event"
name: "Texas-led states’ antitrust suit against BlackRock, State Street and Vanguard"
summary: "Eleven states sued three asset managers in November 2024 over alleged efforts to cut coal output. Thirteen were on the amended complaint. A judge let 18 counts proceed in August 2025, and Vanguard settled in February 2026."
when: "2024-11-27/.."
claims:
  - {id: c1, rel: involved, to: blackrock, role: defendant, note: "The states’ claims are allegations. The judge’s refusal to dismiss is not a finding on them.", src: [{s: texas-ag-coal-announcement-2024, at: "Opening paragraph", quote: "Attorney General Ken Paxton sued BlackRock, State Street Corporation, and Vanguard Group, three of the largest institutional investors in the world, for conspiring to artificially constrict the market for coal through anticompetitive trade practices."}, {s: marketscreener-2025-08-texas-blackrock, at: "defendants’ response", quote: "The three asset managers said they would continue to defend against the claims"}]}
  - {id: c2, rel: involved, to: the-vanguard-group, role: defendant, src: [{s: texas-ag-coal-announcement-2024, at: "Opening paragraph", quote: "Attorney General Ken Paxton sued BlackRock, State Street Corporation, and Vanguard Group, three of the largest institutional investors in the world, for conspiring to artificially constrict the market for coal through anticompetitive trade practices."}]}
  - {id: c3, rel: involved, to: state-street, role: defendant, src: [{s: texas-ag-coal-announcement-2024, at: "Opening paragraph", quote: "Attorney General Ken Paxton sued BlackRock, State Street Corporation, and Vanguard Group, three of the largest institutional investors in the world, for conspiring to artificially constrict the market for coal through anticompetitive trade practices."}]}
  - id: c4
    rel: involved
    to: texas-office-of-the-attorney-general
    role: "Ken Paxton filed the November 2024 suit for Texas, joined by ten other states"
    note: "The amended complaint named thirteen states and pointed to BlackRock and State Street’s votes against, or decisions to withhold support from, coal-company directors. In the relevant markets from 2019 to 2022, the states alleged that coal output fell about 18–19% and average market prices rose about 21–25%."
    src:
      - {s: texas-ag-coal-announcement-2024, at: "Filing coalition", quote: "A coalition of 10 other States joined Attorney General Paxton on the lawsuit."}
      - {s: texas-coal-complaint-2024, at: "Introduction, paragraph 1", quote: "the price in higher utility bills and higher costs."}
      - {s: edtx-coal-dismissal-order-2025, at: "Part I, Background", quote: "On January 16, 2025, Plaintiff States of Texas, Alabama, Arkansas, Indiana, Iowa, Kansas, Missouri, Montana, Nebraska, Louisiana, Oklahoma, West Virginia, and Wyoming filed a 110-page amended complaint"}
      - {s: edtx-coal-dismissal-order-2025, at: "Introduction, p. 4, summarizing the amended complaint", quote: "relevant coal companies collectively decreased output by about 18–19% while the average market price increased by about 21–25%."}
  - id: c5
    rel: appears_in
    to: texas-coal-dismissal-order
    role: "Section 7 supplies the rule the judge applied to acquisitions and use of stock"
    note: "Judge Jeremy D. Kernodle allowed the claim to proceed, citing Einer Elhauge and Fiona Scott Morton and Herbert Hovenkamp. Scott Morton and Hovenkamp argued that Section 7’s effects test did not require identifying the exact way prices rose."
    src:
      - {s: edtx-coal-dismissal-order-2025, at: "Part III.A, Clayton Act claim", quote: "acquisition and use of the stock to bring about, or attempt to bring about, a substantial lessening of competition that is unlawful."}
      - {s: edtx-coal-dismissal-order-2025, at: "Part III.A, p. 28, citations", quote: "Fiona S. Morton & Herbert Hovenkamp, Horizontal Shareholding and Antitrust Policy, 127 YALE L.J. 2026 (2018); Einer Elhauge, Horizontal Shareholding, 129 HARV. L. REV. 1267 (2016)."}
      - {s: morton-hovenkamp-yale-2018, at: "Abstract", quote: "the “effects” test expressed in the Clayton Act does not require proof of the precise mechanism."}
  - id: c6
    rel: answered_by
    to: federal-trade-commission
    role: "joined the Justice Department in arguing the limits of the exception for stock bought solely for investment"
    src:
      - {s: ftc-doj-coal-statement-of-interest-2025, at: "Part I.A, p. 9", quote: "Section 7 thus creates a provisional carve-out for purchases made “solely for investment” that can be lost depending on how investors use those investments."}
  - id: c7
    rel: answered_by
    to: blackrock
    role: "disputed the charge that it conspired with coal producers to cut output"
    note: "Before the suit, BlackRock said it was transferring its Climate Action 100+ participation to BlackRock International, which would pursue decarbonization through its engagements and votes only if clients instructed it to. BlackRock later argued that requiring funds to sell coal shares could make it harder for coal companies to raise money and could raise energy prices."
    src:
      - {s: esgdive-coal-dismissal-responses-2025, at: "BlackRock statement", by: blackrock, quote: "This case is based on an absurd theory that coal companies conspired with their shareholders to reduce coal production"}
      - {s: marketscreener-2025-08-texas-blackrock, at: "Possible divestment remedy", quote: "which BlackRock has said would harm the companies' access to capital and likely raise energy prices."}
      - {s: blackrock-climate-action-100-2024, at: "Opening letter, p. 1", quote: "participation in Climate Action 100+ to BlackRock International, and BlackRock, Inc. will no longer be a signatory."}
      - {s: blackrock-climate-action-100-2024, at: "Client mandates, p. 1", quote: "BlackRock International will only conduct issuer engagements and cast proxy votes consistent with decarbonization investment objectives where clients have instructed us to do so."}
  - id: c8
    rel: answered_by
    to: state-street
    role: "denied collusion"
    src:
      - {s: esgdive-coal-dismissal-responses-2025, at: "State Street statement", by: state-street, quote: "There is no collusion here, and we remain confident that the facts and legal substance are on our side"}
  - id: c9
    rel: answered_by
    to: the-vanguard-group
    role: "said it would defend against the claims after the August order"
    src:
      - {s: esgdive-coal-dismissal-responses-2025, at: "Vanguard statement", by: the-vanguard-group, quote: "looks forward to the opportunity to vigorously defend against plaintiffs' claims"}
  - id: c10
    rel: answered_by
    to: us-department-of-justice
    role: "filed a statement of interest jointly with the Federal Trade Commission"
    note: "The agencies argued the comparison was between actual coal output and what it would have been without the alleged agreement."
    src:
      - {s: ftc-doj-coal-statement-of-interest-2025, at: "Interest of the United States and the Federal Trade Commission", quote: "The Federal Trade Commission (“FTC” or “Commission”) and the United States through the U.S. Department of Justice respectfully submit this Statement of Interest"}
      - {s: ftc-doj-coal-statement-of-interest-2025, at: "Part II.B, output restraint", quote: "not whether coal production rose, but whether production was lower than it would have been without Defendants’ alleged agreement."}
---

The states alleged that the managers individually used their holdings to lessen competition and agreed with one another to restrict production. The managers disputed those allegations. The August 2025 order let Counts I–XVII and XXI proceed and dismissed Counts XVIII–XX. At that stage the court had to assume the alleged facts were true. [[the-vanguard-group|Vanguard]] later settled its part of the case without admitting liability.
