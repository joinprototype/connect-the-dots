---
uid: 01M6DMVXY557T07X5FM3R5AP5B
id: fuel-island
type: chapter
title: Fuel Island
subtitle: Why a gallon of gasoline costs about $1.40 more in California than in the U.S., and who says why
summary: California drivers pay about $1.40 a gallon more than the U.S. average. Here is that gap split into taxes, climate programs, a special blend and what is left, each estimate credited. The state's own market watchdog, the oil industry and the economist who named the "mystery gasoline surcharge" disagree about the rest; the story follows each, from state data, testimony to the Legislature, Attorney General announcements and company statements.
---

California drivers pay about $1.40 a gallon more than the U.S. average, and nobody in this story disputes that. The story splits the gap into taxes, climate programs, a special blend and what is left, says whose number each is, and then follows the argument over the remainder: a surcharge the state's own market watchdog now confirms, and the industry's reply.

Where a figure is a count by one side, a plan or a projection, or our own subtraction, it says so. It does not say who is right.

```scene
- shot: the-gap
  view: map
  camera: {center: [-119.5, 36.6], zoom: 5.2, pitch: 0, duration: 6}
  places: [sacramento, los-angeles]
  time: "2026-08"
  reveal: [california, us-energy-information-administration, eia-california-gasoline-price-series, eia-us-gasoline-price-series, sacramento, los-angeles]
  reveal_claims: [us-energy-information-administration#c1, us-energy-information-administration#c2]
  overlay: {kind: stat, value: "$1.40", label: "August 2026, California minus U.S. average, regular gasoline: our subtraction from EIA’s $5.458 and $4.058", source: eia-california-retail-gasoline-prices, quote: "Regular 5.949 5.547 5.305 5.458 5.924 6.063"}
  narration: "**The gap.** In August 2026 the U.S. Energy Information Administration's monthly figures put regular gasoline at $5.46 a gallon in California and $4.06 across the U.S., a gap of about $1.40 (our subtraction). By its annual averages the gap was $1.36 in 2022, $1.25 in 2023, $1.22 in 2024 and $1.31 in 2025. Nobody in this story disputes the gap. The argument is over what it is made of, and the next scenes split it and credit each number."
  duration: 13

- shot: the-pieces
  view: graph
  focus: california
  time: "2026-08"
  reveal: [california, us-energy-information-administration, eia-state-gasoline-taxes-2026, california-energy-commission, western-states-petroleum-association, california-air-resources-board, low-carbon-fuel-standard, california-cap-and-trade, california-reformulated-gasoline]
  reveal_claims: [us-energy-information-administration#c3, california#c1, california#c2, california#c3]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "DPMO confirms the “mystery gasoline surcharge.” California retail gasoline prices are higher than prices in other states, even after accounting for taxes, fees, and environmental programs.", caption: "Division of Petroleum Market Oversight, 2024 Annual Report, October 2025"}
  narration: "**The gap in pieces.** This sum is ours, for one month, from different sources. State taxes and fees run about 38 cents above the national average (EIA: 70.9 against 33.3 cents, January 2026). California's two climate programs cost about 49 to 51 cents in August (Energy Commission, trade group), some of which other states have too. The special blend is put at 10 to 15 cents. Taking those off the $1.40 leaves about 36 to 43 cents. Nobody publishes this exact split, nobody prices the state's fuel isolation alone, and it assumes costs are passed on in full."
  duration: 13

- shot: taxes-and-programs
  view: graph
  focus: california-air-resources-board
  time: "2026-08"
  reveal: [western-states-petroleum-association, california-air-resources-board, low-carbon-fuel-standard, california-cap-and-trade]
  reveal_claims: [california-air-resources-board#c2, california-air-resources-board#c3]
  overlay: {kind: stat, value: "$1.46", label: "Per gallon in taxes, fees and climate-program costs, August 2026, by the Western States Petroleum Association’s count; every state pays some of it", source: wspa-2026-08-taxes-and-fees, quote: "Total $1.46 Total Per Gallon 100%"}
  narration: "**Taxes and program costs.** For August 2026 the oil trade group counts $1.46 a gallon in taxes, fees and climate-program costs; the Energy Commission's chart for the same month adds to $1.44. They differ only on cap-and-trade, 26 cents against 28: the trade group uses the latest allowance auction price and assumes full pass-through. Most of that total is not California's excess, since every state taxes gasoline and the 18-cent federal tax is paid everywhere. The state's case is that taxes fund roads and transit and the program costs fund clean-air work."
  duration: 13

- shot: special-blend
  view: graph
  focus: california-reformulated-gasoline
  time: "1996-03-01"
  reveal: [california-air-resources-board, california-reformulated-gasoline, california, western-states-petroleum-association]
  reveal_claims: [california-air-resources-board#c1, california#c1]
  overlay: {kind: quote, source: sbx12-senate-committee-analysis-2023, quote: "California’s unique, cleaner-burning gasoline blend costs more to produce than other types of gasoline, accounting for an additional 10 to 15 cents per gallon (according to the CEC).", caption: "Senate Committee on Energy, Utilities and Communications, analysis of SB X1-2, March 2023"}
  narration: "**A fuel made for California.** The Air Resources Board began setting California's own gasoline recipe in 1992, and the second phase reached the market on 1 March 1996. The Energy Commission, as quoted in a Senate analysis, puts the extra cost at 10 to 15 cents a gallon. Borenstein assumed 10 and the state's market watchdog follows him, though it says that likely overestimates it, because other states tightened their rules too. The industry says few refineries elsewhere can make the blend; we found no industry figure for its cost."
  duration: 13

- shot: no-pipeline
  view: map
  camera: {center: [-120.5, 37.0], zoom: 5.0, pitch: 0, duration: 6}
  places: [sacramento, los-angeles, san-francisco]
  time: "2023-02-22"
  reveal: [california, sacramento, los-angeles, san-francisco, cec-cdtfa-2024-report]
  reveal_claims: [california-energy-commission#c4]
  overlay: {kind: quote, source: reheis-boyd-2023-senate-testimony, quote: "There are no pipelines that bring crude oil or gasoline products into California.", caption: "Catherine Reheis-Boyd, Western States Petroleum Association, to a Senate committee, 22 February 2023"}
  narration: "**An island for fuel.** The state and the industry agree that no pipelines bring fuel into California, so gasoline comes from in-state refineries or by ship. The Energy Commission says overseas supply can take three weeks; the trade group says 30 to 45 days. The industry points to this isolation and to supply limits as the main drivers of price. A tax-agency and Energy Commission report found the premium also grew in the West Coast states without California, from about 4 percent over the U.S. in 2004 to 2014 to 12 percent in 2015 to 2023, though those states have fuel programs of their own."
  duration: 13

- shot: torrance
  view: map
  camera: {center: [-118.34, 33.84], zoom: 10.2, pitch: 25, duration: 6}
  places: [torrance-california]
  time: "2015-02-18"
  reveal: [torrance-refinery-explosion-2015, torrance-refinery, torrance-california, exxonmobil, pbf-energy, us-chemical-safety-board]
  reveal_claims: [torrance-refinery-explosion-2015#c2, pbf-energy#c1, us-chemical-safety-board#c1]
  overlay: {kind: stat, value: "$2.4 billion", label: "What drivers paid in higher pump prices in the six months after the explosion, by a RAND study as reported by Consumer Watchdog", source: consumer-watchdog-2016-torrance-rand, quote: "motorists paying at least $2.4 billion in higher pump prices in the following six months, according to a recent RAND study"}
  narration: "**18 February 2015.** An explosion in the fluid catalytic cracking unit of ExxonMobil's Torrance refinery. The U.S. Chemical Safety Board found that a slide valve meant to act as a barrier failed, and said the unit was operating without proper procedures. The refinery, which the Board's report says made about ten percent of the state's gasoline, was under repair for over a year. The state's market watchdog says the price gap kept growing even after the refinery was fully repaired in May 2016."
  duration: 13

- shot: a-gap-with-a-name
  view: graph
  focus: severin-borenstein
  time: "2022-06-30"
  reveal: [severin-borenstein, petroleum-market-advisory-committee, california-energy-commission, torrance-refinery-explosion-2015]
  reveal_claims: [severin-borenstein#c2, severin-borenstein#c3]
  overlay: {kind: quote, source: borenstein-2022-assembly-testimony, quote: "Since then, California’s gas prices have exceeded the average elsewhere in the US by an amount that in each year has averaged 28 cents to 50 cents above the differential that could be explained by our higher taxes and environmental fees, a difference I have called the “mystery gasoline surcharge.”", caption: "Severin Borenstein, testimony to the California Assembly, 30 June 2022"}
  narration: "**A gap with a name.** Economist Severin Borenstein calculated that until February 2015 California's premium over the rest of the country was virtually entirely explained by its taxes and environmental fees. After that, by his calculation, prices ran 28 to 50 cents a gallon above what those and an assumed 10 cents for the special blend could explain, on average each year to mid-2022. He called it the \"mystery gasoline surcharge\" and put its cost at about $40 billion. He says the Energy Commission's advisory committee, which he chaired, could show something was amiss but never had the staff or authority to find the cause."
  duration: 13

- shot: the-state-checks
  view: graph
  focus: dpmo-2024-annual-report
  time: "2025-10"
  reveal: [division-of-petroleum-market-oversight, dpmo-2024-annual-report, severin-borenstein, california-energy-commission, cec-2019-gasoline-price-report]
  reveal_claims: [division-of-petroleum-market-oversight#c1, severin-borenstein#c1, california-energy-commission#c3]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "Between 2015 and 2024, the mystery gasoline surcharge averaged $0.41 per gallon, costing Californians $59 billion.", caption: "Division of Petroleum Market Oversight, 2024 Annual Report, October 2025"}
  narration: "**The state's watchdog checks.** In October 2025 the Division of Petroleum Market Oversight, part of the Energy Commission, reported that it had independently validated his finding: a surcharge averaging 41 cents a gallon from 2015 to 2024, costing Californians $59 billion. Of the 40-cent rise to 42 cents between February 2015 and July 2025, it attributes 35 cents to higher gross industry margins and 5 to crude costs. It names market power as one potential explanation, and says the report does not necessarily represent the state's views. The Commission's own 2019 report put $11.6 billion over five years on retail margins and ruled out refiners' margins, so the state's account has moved."
  duration: 13

- shot: few-sellers
  view: graph
  focus: standard-oil
  time: "2025-01"
  reveal: [standard-oil, standard-oil-v-united-states, chevron, mobil, exxonmobil, ohio-oil-company, marathon-petroleum, dpmo-2024-annual-report]
  reveal_claims: [standard-oil-v-united-states#c7, standard-oil-v-united-states#c8, standard-oil-v-united-states#c9, ohio-oil-company#c3]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "In total, the top four companies control 90 percent of in-state refining capacity.", caption: "Division of Petroleum Market Oversight, 2024 Annual Report, October 2025"}
  narration: "**Few sellers.** The watchdog says four companies control about 90 percent of in-state refining capacity, against 48 percent in the rest of the country, and that about half of California refiners' sales go through their own stations or tank-wagon deliveries, against 9 percent elsewhere (2019). It calls market power a possible reason, not a finding. Chevron and Marathon, the two largest, trace back to Standard Oil and Ohio Oil (see The Trust); no source here ties 1911 to today's prices, though a 1999 Attorney General task force already found California's markets less competitive than the nation's. Against this, the tax agency's report says California refining costs reflect higher costs and incomes here."
  duration: 13

- shot: what-a-margin-is
  view: graph
  focus: division-of-petroleum-market-oversight
  time: "2025-06"
  reveal: [division-of-petroleum-market-oversight, california-energy-commission, cec-margin-cap-staff-report-2025]
  reveal_claims: [division-of-petroleum-market-oversight#c2, california-energy-commission#c2]
  overlay: {kind: stat, value: "67 to 93 cents", label: "Average gross gasoline refining margin per gallon, before and after February 2015, in 2025 dollars, by Energy Commission staff", source: cec-staff-report-max-margin-2025, quote: "Average GGRMs in California have increased from an average of 67 cents per gallon between June 2013 and January 2015 to an average of 93 cents per gallon between February 2015 and June 2025."}
  narration: "**What a margin is.** Refiners now report margins to the Energy Commission, whose staff found their average gross gasoline margin rose from 67 cents a gallon (June 2013 to January 2015) to 93 cents (February 2015 to June 2025), in 2025 dollars: 68 cents to $1.01 for refiners selling mostly branded gasoline, 64 to 76 cents for the rest. A margin is measured to the wholesale rack, not to the spot market, and covers costs as well as profit. The cost data do not agree: refiners told investors about 24 cents a gallon in operating costs and told the Commission about 72. So profit is not known."
  duration: 13

- shot: a-suit-over-the-spot-market
  view: graph
  focus: vitol-sk-spot-market-case
  time: "2024-07-10"
  reveal: [vitol-sk-spot-market-case, vitol, sk-energy-americas, california-department-of-justice, xavier-becerra, rob-bonta]
  reveal_claims: [california-department-of-justice#c1, vitol#c1, sk-energy-americas#c1]
  overlay: {kind: quote, source: bloomberg-law-2024-vitol-sk-settle, quote: "Any allegations of wrongdoing by Vitol are untrue and unfounded.", caption: "Vitol spokesperson, July 2024, as reported by Bloomberg Law"}
  narration: "**A suit over the spot market.** In May 2020 Attorney General Xavier Becerra sued Vitol and SK, alleging they manipulated benchmark spot prices after the Torrance explosion; the suit said this may have added more than a cent a gallon, against the 28 to 50 cents of Borenstein's surcharge. Vitol said the suit lacked merit. In July 2024 Attorney General Rob Bonta announced a $50 million settlement resolving the allegations. No court ruled on them; Vitol said they were \"untrue and unfounded\" and SK did not respond."
  duration: 13

- shot: autumn-2022
  view: graph
  focus: california-gasoline-spike-2022
  time: "2022-09-30"
  reveal: [california-gasoline-spike-2022, gavin-newsom, california-air-resources-board, gasoline-special-session-2022]
  reveal_claims: [california-gasoline-spike-2022#c1, california-gasoline-spike-2022#c2, california-gasoline-spike-2022#c3]
  overlay: {kind: quote, source: gov-2022-09-30-windfall-tax, quote: "These price hikes cannot be attributed solely to refinery maintenance issues, hurricane disruptions, or even state taxes.", caption: "Governor’s office, 30 September 2022"}
  narration: "**Autumn 2022.** On 30 September 2022 Governor Newsom said oil companies had raised California prices by a record 84 cents a gallon in ten days while crude fell, called for a windfall tax, and ordered an early switch to winter-blend gasoline. His office said the rise could not be blamed only on refinery maintenance, hurricanes or taxes. The state's watchdog later reported that in the fall 2022 spike California prices rose $1.21 a gallon while the rest of the U.S. fell 9 cents and crude fell 39 cents; a Senate analysis noted a record $2.50 gap with the U.S. average, around the time some refineries were off line for maintenance. On 30 November the governor convened a special session for 5 December."
  duration: 13

- shot: sb-x1-2
  view: graph
  focus: senate-bill-x1-2
  time: "2023-06-26"
  reveal: [senate-bill-x1-2, gasoline-special-session-2022, division-of-petroleum-market-oversight, maximum-gross-gasoline-refining-margin, gavin-newsom, california-department-of-justice]
  reveal_claims: [gavin-newsom#c1, senate-bill-x1-2#c1, senate-bill-x1-2#c2, gasoline-special-session-2022#c2, gasoline-special-session-2022#c1]
  overlay: {kind: quote, source: cec-staff-report-max-margin-2025, quote: "The commission shall not set a maximum gross gasoline refining margin or accompanying penalty under subdivisions (b) and (c), respectively, unless it finds that the likely benefits to consumers outweigh the potential costs to consumers.", caption: "Public Resources Code section 25355.5(e), as added by SB X1-2, quoted in the Energy Commission’s staff report"}
  narration: "**SB X1-2.** Signed in March 2023 and in effect from 26 June 2023, the law created the Division of Petroleum Market Oversight, made refiners report more data and give a year's notice before shutting or reconfiguring a refinery, and let the Energy Commission set a cap on refiners' gross gasoline margin with a penalty above it. The Commission may do so only if it finds benefits to consumers outweigh costs. Senator Nancy Skinner wrote the bill; the governor and the attorney general co-sponsored it."
  duration: 13

- shot: the-industrys-answer
  view: graph
  focus: western-states-petroleum-association
  time: "2025-11-12"
  reveal: [western-states-petroleum-association, gasoline-special-session-2022, senate-bill-x1-2, severin-borenstein, pacific-research-institute, pri-no-mystery-surcharge-2025]
  reveal_claims: [western-states-petroleum-association#c2, pacific-research-institute#c1]
  overlay: {kind: quote, source: cbs-sacramento-2024-wspa-response, quote: "This has been looked into by numerous attorneys general over the years. Every single time, they come back with the same findings which is that it was market forces. The industry was acting responsibly", caption: "Kevin Slagle, Western States Petroleum Association spokesman, to CBS Sacramento, 2024"}
  narration: "**The industry's answer.** The Western States Petroleum Association opposed the bill; its president told a Senate committee it \"misguidedly focuses on profits, rather than the root cause of price spikes - a lack of supply.\" A spokesman later said that attorneys general had looked into prices over the years and \"every single time\" found market forces. Borenstein's answer on supply is his spot-price finding, that prices at the refinery gate explain little of the gap. We found no trade-association reply to the October 2025 report. The Pacific Research Institute wrote in November 2025 that gross margins are not profits."
  duration: 13

- shot: los-angeles-phillips-66
  view: map
  camera: {center: [-118.26, 33.8], zoom: 9.6, pitch: 20, duration: 6}
  places: [los-angeles]
  time: "2025-10-16"
  reveal: [phillips-66-los-angeles-refinery, phillips-66, los-angeles]
  reveal_claims: [phillips-66#c1]
  overlay: {kind: quote, source: hp-2024-phillips-66-la-notice, quote: "With the long-term sustainability of our Los Angeles Refinery uncertain and affected by market dynamics, we are working with leading land development firms to evaluate the future use of our unique and strategically located properties near the Port of Los Angeles", caption: "Mark Lashier, chairman and CEO of Phillips 66, October 2024"}
  narration: "**Los Angeles, Phillips 66.** In October 2024 Phillips 66 gave notice that it would stop operating its Los Angeles-area refinery in the fourth quarter of 2025, saying its long-term sustainability was \"uncertain and affected by market dynamics\". The Energy Commission's list says it stopped processing crude oil on 16 October, with remaining units to be idled by the end of 2025. The Commission projected the closure would cut Southern California gasoline production by about 75,000 barrels a day."
  duration: 13

- shot: the-bay-area
  view: map
  camera: {center: [-122.2, 38.0], zoom: 8.9, pitch: 20, duration: 6}
  places: [benicia-california, martinez-california, richmond-california]
  time: "2026-04"
  reveal: [valero-benicia-refinery, valero-energy, marathon-martinez-refinery, marathon-petroleum, chevron-richmond-refinery, benicia-california, martinez-california, richmond-california]
  reveal_claims: [valero-energy#c1, marathon-petroleum#c1, valero-benicia-refinery#c1]
  overlay: {kind: quote, source: hp-2025-valero-benicia-closure, quote: "California has been pursuing policies to move away from fossil fuels for the past 20 years, and the consequence of that is the regulatory and enforcement environment is the most stringent and difficult of anywhere else in North America", caption: "Lane Riggs, Valero chief executive, on an analysts’ call, April 2025, as reported by Hydrocarbon Processing"}
  narration: "**The Bay Area.** Marathon's Martinez refinery and Phillips 66's Rodeo refinery were converted to renewable fuels, which cut northern California gasoline production by roughly 140,000 barrels a day, the Energy Commission says. In April 2025 Valero said it would stop refining at Benicia, its chief executive naming the regulatory and enforcement environment and saying the refinery costs considerably more to maintain than its Wilmington one. Valero stopped refining there in April 2026."
  duration: 13

- shot: more-from-the-sea
  view: graph
  focus: california-energy-commission
  time: "2025-06-27"
  reveal: [california-energy-commission, valero-benicia-refinery, phillips-66-los-angeles-refinery, california]
  overlay: {kind: quote, source: cec-response-to-governor-2025-06-27, quote: "Gasoline imports statewide could increase to 25-35% of demand by the summer of 2026, and up to 50% in the northern California region after the announced anticipated refinery closures, bringing risk of supply disruptions and price volatility.", caption: "California Energy Commission, letter to the governor, 27 June 2025: a projection, not a count"}
  narration: "**More from the sea.** In June 2025 the Commission projected that gasoline imports could rise from about 10 to 20 percent of demand to 25 to 35 percent by the summer of 2026, and up to 50 percent in northern California. That is a projection: no 2026 figure has been reported yet. The Commission's figure for 2025 is 19 percent of supply, imported gasoline and blending components together, and 81 percent of the gasoline Californians consumed came from refineries in the state."
  duration: 13

- shot: a-cap-paused
  view: graph
  focus: cec-margin-cap-pause-2025
  time: "2025-08-29"
  reveal: [cec-margin-cap-pause-2025, cec-margin-cap-staff-report-2025, california-energy-commission, western-states-petroleum-association, maximum-gross-gasoline-refining-margin]
  reveal_claims: [california-energy-commission#c5, western-states-petroleum-association#c1, maximum-gross-gasoline-refining-margin#c1]
  overlay: {kind: quote, source: cec-staff-report-max-margin-2025, quote: "The CEC’s preliminary analysis demonstrates that imposing a maximum gross refining margin penalty at this time may affect refiners’ capital outlay plans in essential refinery maintenance and upgrades", caption: "California Energy Commission staff report, October 2025"}
  narration: "**A cap, paused.** On 29 August 2025 the Commission resolved to set aside a margin cap for at least five years. Its staff report, final in October, said its preliminary analysis showed a cap now \"may affect refiners' capital outlay plans in essential refinery maintenance and upgrades\", though it had no direct data on capital outlays or exit thresholds, and that in theory a well-designed cap would induce more supply at lower prices. The oil trade group called the vote \"a needed step\" that stopped short of repeal. The Commission kept the right to revise or rescind it."
  duration: 13

- shot: where-it-stands
  view: map
  camera: {center: [-119.5, 36.6], zoom: 5.2, pitch: 0, duration: 6}
  places: [sacramento]
  time: "2026-11"
  reveal: [california, california-energy-commission, severin-borenstein, assembly-gasoline-hearing-2026, senate-bill-x1-2]
  reveal_claims: [assembly-gasoline-hearing-2026#c1]
  overlay: {kind: quote, source: cec-what-drives-gasoline-prices, quote: "In 2024, the annual average price of a gallon of gasoline was 20 cents lower than in 2023 and 70 cents lower compared to 2022, adjusted for inflation.", caption: "California Energy Commission, \"What Drives California’s Gasoline Prices?\", updated July 2026"}
  narration: "**Where it stands.** The Energy Commission says the new laws are delivering, citing a 2024 average price 20 cents below 2023 and 70 below 2022, adjusted for inflation. By EIA's unadjusted annual averages, prices fell across the U.S. too: California by 25 and 79 cents, the U.S. by 22 and 65. The gap was $1.22 in 2024, $1.31 in 2025 and about $1.40 in August 2026, and the Commission's own page says price changes are driven mainly by global crude. At an Assembly committee hearing on 5 May 2026, press reports quoted Borenstein at about 50 cents for the surcharge; his chart shows it near 60 cents for 2026 to April. The Commission plans an updated margin-cap analysis by early 2027."
  duration: 13
```
