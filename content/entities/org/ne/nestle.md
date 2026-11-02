---
uid: 01M6DK8E5EPM65HRM5QZX4JZEX
id: nestle
type: org
name: "Nestlé"
aliases: ["Nestlé S.A."]
summary: "Swiss food and drink company; a major shareholder of L'Oréal."
claims:
  - id: c1
    rel: owns_stake
    to: loreal
    when: "2024-12-31"
    percent: 20.14
    as_of: "2024-12-31"
    src:
      - {s: loreal-urd-2024-governance, quote: "Nestlé: 20.14%"}
  - id: c2
    rel: owns_stake
    to: loreal
    when: "2021-12-07"
    percent: 23.3
    as_of: "2021-12-07"
    note: "The stake before L'Oréal repurchased 4.0 per cent of its own shares from Nestlé for €8,904 million."
    src:
      - {s: loreal-nestle-2021, quote: "At the end of the transaction and after cancellation of the repurchased shares, Nestlé’s stake in the capital of L’Oréal will be reduced from 23.3% to 20.1%."}
  - id: c11
    rel: headquartered_in
    to: vevey
    src:
      - {s: bern-court-1976-opinion-excerpts, quote: "The company attacked in this brochure, Nestlé Alimentana SA Vevey"}
  - id: c12
    rel: adopted
    to: who-breast-milk-substitutes-code
    when: "1981-05"
    according_to: [nestle]
    src:
      - {s: nestle-news-1984-01-boycott-ends, quote: "Nestle endorsed the WHO Code the day it was passed in May, 1981"}
      - {s: nestle-canada-infant-food-marketing, quote: "Nestlé sells and markets infant formula products responsibly, and we voluntarily and unilaterally apply the WHO Code in all developing countries."}
      - {s: guardian-2007-05-22-nestle-response, quote: "Far from trying to get around the code, in developing countries, Nestlé voluntarily applies the entire WHO code - whether the government does or not.", by: nestle}
  - id: c13
    rel: founded
    to: nestle-infant-formula-audit-commission
    when: "1982-05"
    src:
      - {s: nestle-news-1984-01-boycott-ends, quote: "Nestle announced the formation of the Nestle Infant Formula Audit Commission"}
  - id: c14
    rel: disputes_finding
    to: atni-bms-marketing-index-2024
    when: "2024-05-07"
    according_to: [nestle]
    src:
      - {s: vitafoods-2024-05-07-atni-nestle-reply, quote: "Along with other members of the industry, we informed ATNI we fundamentally disagree with their methodology.", by: nestle}
      - {s: vitafoods-2024-05-07-atni-nestle-reply, quote: "The methodology adopted may unfairly penalise companies with a large portfolio assessed because the absolute numbers used by ATNI can easily trigger lower scoring", by: nestle}
---
