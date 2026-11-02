---
uid: 01M6DPCVRED7R67WAKGH07N0XC
id: us-energy-information-administration
type: org
name: "U.S. Energy Information Administration"
aliases: ["EIA"]
summary: "Federal statistics agency that publishes weekly, monthly and annual retail gasoline prices by state."
claims:
  - id: c1
    rel: authored
    to: eia-california-gasoline-price-series
    src:
      - {s: eia-california-retail-gasoline-prices, quote: "Regular 5.949 5.547 5.305 5.458 5.924 6.063"}
      - {s: eia-california-retail-gasoline-prices, quote: "Regular 3.050 4.013 5.311 4.773 4.526 4.410"}
  - id: c2
    rel: authored
    to: eia-us-gasoline-price-series
    src:
      - {s: eia-us-retail-gasoline-prices, quote: "Regular 4.479 4.050 3.932 4.058 4.355 4.310"}
      - {s: eia-us-retail-gasoline-prices, quote: "Regular 2.168 3.008 3.951 3.519 3.304 3.097"}
  - id: c3
    rel: authored
    to: eia-state-gasoline-taxes-2026
    when: "2026-02-12"
    src:
      - {s: eia-2026-02-12-state-gasoline-taxes, quote: "State taxes and fees on motor gasoline as of January 1, 2026, ranged from a high of 70.9 cents per gallon (c/gal) in California to a low of 9.0 c/gal in Alaska."}
      - {s: eia-2026-02-12-state-gasoline-taxes, quote: "The national average state taxes and fees were also revised, from 33.5 c/g to 33.3 c/g for gasoline"}
      - {s: eia-2026-02-12-state-gasoline-taxes, quote: "California requires a special blend of gasoline that requires more processing steps and more expensive blending components but is intended to alleviate air quality issues associated with gasoline consumption."}
---
