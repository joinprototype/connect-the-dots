---
uid: 01M6FB43F803QC9BM0W62RVXT0
id: bank-concentration-2026
type: event
name: "Bank assets at 30 June 2026"
summary: "On 30 June 2026 the four largest of 4,213 FDIC-insured banks held about 40 percent of all their assets, by our sum of the FDIC’s list."
when: "2026-06-30"
claims:
  - id: c1
    rel: involved
    to: jpmorgan-chase
    role: "largest bank: $4.09 trillion in assets, 15.5 percent of the total (our sum)"
    src:
      - {s: fdic-bankfind-2026-06-30-institutions, at: "first record", quote: "\"REPDTE\":\"06/30/2026\",\"ASSET\":4091315000,\"CERT\":628,\"DEP\":2820284000,\"NAME\":\"JPMorgan Chase Bank, National Association\""}
  - id: c2
    rel: involved
    to: bank-of-america
    role: "second largest: $2.65 trillion in assets"
    src:
      - {s: fdic-bankfind-2026-06-30-institutions, at: "second record", quote: "\"REPDTE\":\"06/30/2026\",\"ASSET\":2654645000,\"CERT\":3510,\"DEP\":2121804000,\"NAME\":\"Bank of America, National Association\""}
  - id: c3
    rel: involved
    to: fdic
    role: "source of the list: 4,213 active institutions"
    src:
      - {s: fdic-bankfind-2026-06-30-institutions, at: "meta", quote: "\"total\":4213"}
---

Our sums, from the FDIC’s BankFind list of 30 October 2026 (data at 30 June 2026): all 4,213 institutions held $26.45 trillion in assets and $20.69 trillion in deposits. The four largest by assets (JPMorgan Chase Bank, Bank of America, Citibank, Wells Fargo Bank) held 40.2 percent of the assets and 38.9 percent of the deposits; the ten largest, 54.2 and 52.5 percent. These are banks, not holding companies.
