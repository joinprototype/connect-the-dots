---
uid: 01M6DPRSJE7FCT9YQ6ETAKPD16
id: harvard-management-company
type: org
name: "Harvard Management Company"
aliases: ["HMC"]
summary: "Harvard’s subsidiary that invests its endowment and other financial assets."
claims:
  - id: c1
    rel: part_of
    to: harvard-university
    src:
      - {s: harvard-magazine-2025-05-15-compensation, at: "Article", quote: "HMC—the University subsidiary which invests endowment and other financial assets"}
      - {s: harvard-congress-memo-2016-03-31, at: "Answer to question 2", quote: "In addition to the university’s endowment funds, HMC manages certain other university investments, substantially all of which support the university’s educational and research mission."}
  - id: c2
    rel: funded
    to: harvard-university
    when: "2025-07/2026-06"
    amount: 2600000000
    currency: "USD"
    role: "endowment distribution"
    note: "The distribution comes from the endowment funds the company invests, not from the company itself."
    src:
      - {s: hmc-annual-report-fy26, at: "Letter from the chief executive", quote: "distributions from the endowment totaled $2.6 billion — nearly 40% of the University’s annual operating revenue"}
      - {s: harvard-magazine-2026-10-15-financial-report, at: "Article", quote: "Including distributions from the endowment—the result of past philanthropy—giving provided 48 percent of Harvard’s fiscal year 2026 revenue: 39 percent from the endowment distribution and 10 percent from current use gifts."}
  - id: c3
    rel: funded
    to: harvard-university
    when: "2024-07/2025-06"
    amount: 2500000000
    currency: "USD"
    role: "endowment distribution"
    note: "The distribution comes from the endowment funds the company invests, not from the company itself. Harvard’s financial report puts it at 37 percent of operating revenue; the company’s letter says nearly 40 percent."
    src:
      - {s: harvard-magazine-2025-10-23-financial-report, at: "Article", quote: "endowment distributions (37 percent of the total) rose from $2.4 billion to $2.5 billion"}
      - {s: hmc-annual-report-fy25, at: "Letter from the chief executive", quote: "Spending from the endowment now accounts for nearly 40% of annual operating revenue"}
---

Its annual report gives the endowment’s value and allocation; its top pay is listed on Harvard’s tax filings. Part of [[harvard-university]].
