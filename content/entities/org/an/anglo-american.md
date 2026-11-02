---
uid: 01M6DHS2CE96QWA86RH66TC668
id: anglo-american
type: org
name: "Anglo American"
aliases: ["Anglo American plc", "Anglo American Corporation"]
summary: "Mining company founded in 1917 by Ernest Oppenheimer; owns 85% of De Beers."
when: "1917/.."
claims:
  - id: c1
    rel: acquired
    to: de-beers
    when: "2012"
    note: "Bought out the Oppenheimer family's 40 percent stake."
    src:
      - {s: jck-anglo-american-de-beers-sale, quote: "Anglo American has owned 85% of De Beers since 2012, when De Beers’ longtime owners, the Oppenheimer family, sold their 40% share."}
  - id: c2
    rel: owns_stake
    to: de-beers
    as_of: "2000"
    note: "In 2000 each of the two companies held more than 30 percent of the other, the New York Times reported."
    src:
      - {s: nyt-2000-cowell-controversy-over-diamonds, quote: "Each company still holds more than 30 percent of the other's stock."}
  - id: c3
    rel: owns_stake
    to: de-beers
    percent: 85
    as_of: "2024"
    src:
      - {s: jck-anglo-american-de-beers-sale, quote: "Anglo controls 85% of De Beers, while the government of Botswana owns 15%."}
---
