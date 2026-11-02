---
uid: 01M6DQ0WVGCTQM8B11M74XYD6V
id: alden-global-capital
type: org
name: "Alden Global Capital"
summary: "Hedge fund that owns newspaper chains, including the Chicago Tribune."
claims:
  - id: c1
    rel: owns_stake
    to: tribune-publishing
    percent: 32
    as_of: "2021-05"
    src:
      - {s: npr-2021-alden-buys-tribune, quote: "The hedge fund already held a 32% stake in Tribune."}
  - id: c2
    rel: acquired
    to: tribune-publishing
    when: "2021-05"
    note: "Shareholders approved the sale on 21 May 2021."
    src:
      - {s: npr-2021-alden-buys-tribune, quote: "In a statement Friday, Freeman, Alden's president, said, \"Local newspaper brands and operations are the engines that power trusted local news in communities across the United States."}
  - id: c3
    rel: owns_stake
    to: chicago-tribune
    when: "2025"
    note: "Described by Medill as the paper's owner."
    src:
      - {s: medill-2025-state-of-local-news, quote: "No money was directed to news outlets owned by the largest U.S. newspaper owner, Gannett, or to Chicago Tribune owner Alden."}
---
