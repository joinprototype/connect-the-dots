---
uid: 01M6DMVXY557T07X5FM3R5AP5B
id: fuel-island
type: chapter
title: Fuel Island
subtitle: Why a gallon of gasoline costs about $1.40 more in California than in the U.S., and who says why
summary: California drivers pay about $1.40 a gallon more than the U.S. average. Here is that gap split into taxes, climate programs, a special blend and what is left, each estimate credited. The state's own market watchdog, the oil industry and the economist who named the "mystery gasoline surcharge" disagree about the rest; the story follows each, from state data, testimony to the Legislature, Attorney General announcements and company statements.
---

California drivers pay about $1.40 a gallon more than the U.S. average. Higher taxes, climate programs and a special fuel blend explain much of it. The remainder has put an economist, a governor, investigators and refinery executives into a fight over who receives the money and what would bring prices down.

Officials gained power to penalize high refining margins, then paused it as refineries closed. Drivers kept paying the gap while the state faced another choice: how to leave fossil fuels behind and still supply the people who need gasoline today.

```scene
- shot: the-gap
  view: map
  camera: {center: [-119.5, 36.6], zoom: 5.2, pitch: 0, duration: 6}
  places: [sacramento, los-angeles]
  time: "2026-08"
  reveal: [california, us-energy-information-administration, eia-california-gasoline-price-series, eia-us-gasoline-price-series, sacramento, los-angeles]
  reveal_claims: [us-energy-information-administration#c1, us-energy-information-administration#c2]
  overlay: {kind: stat, value: "$1.40", label: "August 2026, California minus U.S. average, regular gasoline: our subtraction from EIA’s $5.458 and $4.058", source: eia-california-retail-gasoline-prices, quote: "Regular 5.949 5.547 5.305 5.458 5.924 6.063"}
  narration: "**The gap.** On 5 May 2026, Severin Borenstein told an Assembly committee that California drivers still paid a surcharge beyond taxes and environmental costs, years after he had first raised the problem. By August, federal monthly figures put regular gasoline at $5.46 a gallon in California and $4.06 across the U.S., about $1.40 apart by subtraction; the annual gaps were $1.36 in 2022, $1.25 in 2023, $1.22 in 2024 and $1.31 in 2025. State officials, the industry and Borenstein agree drivers pay more, but their explanations differ. Borenstein had asked lawmakers to investigate what his calculations left unexplained; by his reckoning, drivers were still paying it."
  duration: 13

- shot: the-pieces
  view: graph
  focus: california
  time: "2026-08"
  reveal: [california, us-energy-information-administration, eia-state-gasoline-taxes-2026, california-energy-commission, western-states-petroleum-association, california-air-resources-board, low-carbon-fuel-standard, california-cap-and-trade, california-reformulated-gasoline]
  reveal_claims: [us-energy-information-administration#c3, california#c1, california#c2, california#c3]
  overlay: {kind: quote, source: borenstein-2022-assembly-testimony, quote: "I hope it will have the power and resources to do a deep dive into California’s gasoline prices.", caption: "Severin Borenstein to Assembly members, 30 June 2022"}
  narration: "**The gap in pieces.** Before Assembly members in June 2022, Borenstein challenged the industry's explanation: his surcharge already subtracted taxes and environmental fees. Applying that approach to August 2026 gives this calculation from several sources: state taxes and fees about 38 cents above the national average (EIA's January figures: 70.9 against 33.3 cents); two climate programs about 49 to 51 cents (Energy Commission and trade group); the special blend 10 to 15 cents. Subtracting these from $1.40 leaves about 36 to 43 cents, assuming full pass-through and subtracting some climate costs other states also bear, with no separate price assigned to fuel isolation. Such unexplained costs were why Borenstein asked lawmakers for an investigation with the power and resources he said his committee had lacked."
  duration: 13

- shot: taxes-and-programs
  view: graph
  focus: california-air-resources-board
  time: "2026-08"
  reveal: [western-states-petroleum-association, california-air-resources-board, low-carbon-fuel-standard, california-cap-and-trade]
  reveal_claims: [california-air-resources-board#c2, california-air-resources-board#c3]
  overlay: {kind: stat, value: "$1.46", label: "Per gallon in taxes, fees and climate-program costs, August 2026, by the Western States Petroleum Association’s count; every state pays some of it", source: wspa-2026-08-taxes-and-fees, quote: "Total $1.46 Total Per Gallon 100%"}
  narration: "**Taxes and program costs.** In June 2025, Energy Commission vice chair Siva Gunda urged Governor Newsom to continue cap-and-trade while containing costs, calling climate and air-quality policies critical to community health. Drivers pay for those choices: for August 2026, the oil trade group counts $1.46 a gallon in taxes, fees and climate costs, against the Commission's $1.44; only cap-and-trade differs, 28 cents against 26, because the group uses the latest allowance auction and assumes full pass-through. Every state taxes fuel and pays the 18-cent federal tax, so most of this total is not California's excess. The Commission says the money funds roads, transit and clean-air work; Borenstein subtracts these costs before investigating the surcharge."
  duration: 13

- shot: special-blend
  view: graph
  focus: california-reformulated-gasoline
  time: "1996-03-01"
  reveal: [california-air-resources-board, california-reformulated-gasoline, california, western-states-petroleum-association]
  reveal_claims: [california-air-resources-board#c1, california#c1]
  overlay: {kind: quote, source: sbx12-senate-committee-analysis-2023, quote: "California’s unique, cleaner-burning gasoline blend costs more to produce than other types of gasoline, accounting for an additional 10 to 15 cents per gallon (according to the CEC).", caption: "Senate Committee on Energy, Utilities and Communications, analysis of SB X1-2, March 2023"}
  narration: "**A fuel made for California.** Testifying to senators in February 2023, industry president Catherine Reheis-Boyd pointed to a recipe few refineries outside California could make. The Air Resources Board introduced its first phase in 1992 and its second on 1 March 1996 to reduce vehicle emissions; the Board says the latter cut carcinogenic air contaminants by more than a third. Cleaner fuel carried a cost: the Energy Commission's estimate, quoted in a Senate analysis, is 10 to 15 cents a gallon; Borenstein subtracts 10 cents, as does the watchdog, which says that likely overestimates the difference as other states tightened their rules. Reheis-Boyd argued that this recipe left California especially exposed to outages, and asked lawmakers to increase supply."
  duration: 13

- shot: no-pipeline
  view: map
  camera: {center: [-120.5, 37.0], zoom: 5.0, pitch: 0, duration: 6}
  places: [sacramento, los-angeles, san-francisco]
  time: "2023-02-22"
  reveal: [california, sacramento, los-angeles, san-francisco, cec-cdtfa-2024-report]
  reveal_claims: [california-energy-commission#c4]
  overlay: {kind: quote, source: reheis-boyd-2023-senate-testimony, quote: "There are no pipelines that bring crude oil or gasoline products into California.", caption: "Catherine Reheis-Boyd, Western States Petroleum Association, to a Senate committee, 22 February 2023"}
  narration: "**An island for fuel.** On 22 February 2023, Reheis-Boyd asked senators to address supply rather than penalize profits: no pipeline brings crude or gasoline into California, she testified, and ships take 30 to 45 days when local supplies run short. The Energy Commission agrees fuel comes from in-state refineries or ships, putting overseas delivery at three weeks. A joint tax-agency and Commission report found the other West Coast states' premium grew from about 4 percent above the U.S. in 2004–2014 to 12 percent in 2015–2023, although those states have fuel programs too. Reheis-Boyd argued that isolation made outages especially dangerous; one California refinery's failure had already shown how long drivers could pay."
  duration: 13

- shot: torrance
  view: map
  camera: {center: [-118.34, 33.84], zoom: 10.2, pitch: 25, duration: 6}
  places: [torrance-california]
  time: "2015-02-18"
  reveal: [torrance-refinery-explosion-2015, torrance-refinery, torrance-california, exxonmobil, pbf-energy, us-chemical-safety-board]
  reveal_claims: [torrance-refinery-explosion-2015#c2, pbf-energy#c1, us-chemical-safety-board#c1, torrance-refinery-explosion-2015#c5]
  overlay: {kind: quote, source: csb-torrance-final-report-2017, quote: "Does the leaking spent slide valve invalidate the Variance?", caption: "ExxonMobil manager’s meeting notes, morning of 18 February 2015, quoted by the Chemical Safety Board"}
  narration: "**18 February 2015.** The Chemical Safety Board reports that before the Torrance explosion, an ExxonMobil manager wrote, “Does the leaking spent slide valve invalidate the Variance?”; managers continued maintenance using a procedure previously successful in 2012 without adequately checking its safeguards, the Chemical Safety Board found. The slide valve failed and hydrocarbons ignited in the fluid catalytic cracking unit; the Board reported four contractors sought first aid for injuries sustained while fleeing. The Board found improper procedures at a refinery making about a tenth of California's gasoline, where repairs took over a year; Consumer Watchdog cited a RAND estimate of at least $2.4 billion in higher pump prices over six months. Even after full repair in May 2016, the state's watchdog says, the price gap kept growing."
  duration: 13

- shot: a-gap-with-a-name
  view: graph
  focus: severin-borenstein
  time: "2022-06-30"
  reveal: [severin-borenstein, petroleum-market-advisory-committee, california-energy-commission, torrance-refinery-explosion-2015]
  reveal_claims: [severin-borenstein#c2, severin-borenstein#c3]
  overlay: {kind: quote, source: borenstein-2022-assembly-testimony, quote: "Since then, California’s gas prices have exceeded the average elsewhere in the US by an amount that in each year has averaged 28 cents to 50 cents above the differential that could be explained by our higher taxes and environmental fees, a difference I have called the “mystery gasoline surcharge.”", caption: "Severin Borenstein, testimony to the California Assembly, 30 June 2022"}
  narration: "**A gap with a name.** On 30 June 2022, Borenstein asked Assembly members for investigative power he said his committee had lacked. Before February 2015, his calculations explained virtually all California's premium through taxes and environmental fees; afterward, subtracting those costs and an assumed 10 cents for the blend still left annual averages of 28 to 50 cents a gallon through mid-2022. He named it the “mystery gasoline surcharge”, put drivers' accumulated cost at about $40 billion, and found refinery-gate spot prices explained little of it. By his account, the Energy Commission's advisory committee he chaired identified something amiss but lacked staff, resources and authority to establish why; he now asked legislators to equip an investigation that could find the cause."
  duration: 13

- shot: the-state-checks
  view: graph
  focus: dpmo-2024-annual-report
  time: "2025-10"
  reveal: [division-of-petroleum-market-oversight, dpmo-2024-annual-report, severin-borenstein, california-energy-commission, cec-2019-gasoline-price-report]
  reveal_claims: [division-of-petroleum-market-oversight#c1, severin-borenstein#c1, california-energy-commission#c3]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "Between 2015 and 2024, the mystery gasoline surcharge averaged $0.41 per gallon, costing Californians $59 billion.", caption: "Division of Petroleum Market Oversight, 2024 Annual Report, October 2025"}
  narration: "**The state's watchdog checks.** In October 2025, Tai Milder's Division of Petroleum Market Oversight reported that it had independently validated Borenstein's finding using public and industry data: a 41-cent average surcharge during 2015–2024, costing drivers $59 billion. DPMO compared the two periods' averages: 2 cents during June 2013–January 2015 and 42 cents during February 2015–July 2025. It attributed 35 cents of that 40-cent difference to higher gross industry margins and 5 cents to crude costs. Its report proposed market power as one explanation, differing from the Commission's 2019 report, which assigned $11.6 billion over five years to retail margins and ruled out refiners' margins. Milder's team put the industry's wider margins at the center of the investigation."
  duration: 13

- shot: few-sellers
  view: graph
  focus: dpmo-2024-annual-report
  time: "2025-01"
  reveal: [chevron, marathon-petroleum, dpmo-2024-annual-report]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "In total, the top four companies control 90 percent of in-state refining capacity.", caption: "Division of Petroleum Market Oversight, 2024 Annual Report, October 2025"}
  narration: "**Few sellers.** In his 2022 Assembly testimony, Borenstein urged lawmakers to obtain contracts between refiners and retailers to understand who controlled prices. The watchdog's 2025 report shows the scale: four firms control about 90 percent of California refining capacity, against 48 percent elsewhere; about half of refiners' sales used company stations or tank-wagon deliveries in 2019, against 9 percent elsewhere. A 1999 Attorney General task force already found California's markets less competitive than the nation's. The watchdog offers market power as a possible explanation, while the tax agency says California's higher costs and incomes raise refining costs; Borenstein's request put the contracts controlling sales before lawmakers as something to investigate."
  duration: 13

- shot: what-a-margin-is
  view: graph
  focus: division-of-petroleum-market-oversight
  time: "2025-06"
  reveal: [division-of-petroleum-market-oversight, california-energy-commission, cec-margin-cap-staff-report-2025]
  reveal_claims: [division-of-petroleum-market-oversight#c2, california-energy-commission#c2]
  overlay: {kind: stat, value: "67 to 93 cents", label: "Average gross gasoline refining margin per gallon, before and after February 2015, in 2025 dollars, by Energy Commission staff", source: cec-staff-report-max-margin-2025, quote: "Average GGRMs in California have increased from an average of 67 cents per gallon between June 2013 and January 2015 to an average of 93 cents per gallon between February 2015 and June 2025."}
  narration: "**What a margin is.** In October 2025, Milder's team compared refiners' operating costs averaging about 24 cents a gallon reported to investors during 2019–mid-2025, against 72 cents reported to the Energy Commission. Commission staff measured average gross gasoline margins of 67 cents during June 2013–January 2015 and 93 cents during February 2015–June 2025, in 2025 dollars. These wholesale-rack margins cover costs as well as profit. In November 2025, Pacific Research Institute authors Wayne Winegarden and Kerry Jackson argued that refinery closures contradicted exceptional profits, citing Commission data showing losses in five of eleven months during June 2023–April 2024. Milder's division, facing conflicting cost disclosures, recommended more complete, consistent reporting to establish profits."
  duration: 13

- shot: a-suit-over-the-spot-market
  view: graph
  focus: vitol-sk-spot-market-case
  time: "2024-07-10"
  reveal: [vitol-sk-spot-market-case, vitol, sk-energy-americas, california-department-of-justice, xavier-becerra, rob-bonta]
  reveal_claims: [california-department-of-justice#c1, vitol#c1, sk-energy-americas#c1]
  overlay: {kind: quote, source: bloomberg-law-2024-vitol-sk-settle, quote: "Any allegations of wrongdoing by Vitol are untrue and unfounded.", caption: "Vitol spokesperson, July 2024, as reported by Bloomberg Law"}
  narration: "**A suit over the spot market.** In May 2020, Attorney General Xavier Becerra sued Vitol and SK, alleging they had exploited the Torrance disruption to manipulate benchmark spot prices for profit, possibly adding more than a cent a gallon against Borenstein's 28-to-50-cent surcharge. Vitol said it imported gasoline to aid California at competitive prices and managed risk through routine commercial practices; it said the suit lacked merit. In July 2024, Becerra's successor Rob Bonta announced a $50 million settlement, saying market manipulation was especially unacceptable when people were vulnerable; no court ruled on the allegations, Vitol called them “untrue and unfounded”, and SK did not respond to Bloomberg Law. The settlement resolved this case, while the much larger surcharge still awaited an explanation."
  duration: 13

- shot: autumn-2022
  view: graph
  focus: california-gasoline-spike-2022
  time: "2022-09-30"
  reveal: [california-gasoline-spike-2022, gavin-newsom, california-air-resources-board, gasoline-special-session-2022]
  reveal_claims: [california-gasoline-spike-2022#c1, california-gasoline-spike-2022#c2, california-gasoline-spike-2022#c3]
  overlay: {kind: quote, source: gov-2022-09-30-windfall-tax, quote: "These price hikes cannot be attributed solely to refinery maintenance issues, hurricane disruptions, or even state taxes.", caption: "Governor’s office, 30 September 2022"}
  narration: "**Autumn 2022.** In Sacramento on 30 September, Governor Gavin Newsom demanded a windfall tax to return excess oil profits to drivers: “This doesn’t add up,” he said. His office counted an 84-cent gasoline rise in ten days while crude fell, rejecting maintenance, hurricanes and taxes as sufficient explanations; he also ordered an early winter-blend switch to increase supply. The watchdog later counted a $1.21 California rise during the fall spike while U.S. prices fell 9 cents and crude fell 39 cents; a Senate analysis noted a record $2.50 gap with the U.S. around refinery maintenance outages. Newsom turned his accusation into a legislative fight: on 30 November he convened a special session for 5 December."
  duration: 13

- shot: sb-x1-2
  view: graph
  focus: senate-bill-x1-2
  time: "2023-06-26"
  reveal: [senate-bill-x1-2, gasoline-special-session-2022, division-of-petroleum-market-oversight, maximum-gross-gasoline-refining-margin, gavin-newsom, california-department-of-justice]
  reveal_claims: [gavin-newsom#c1, senate-bill-x1-2#c1, senate-bill-x1-2#c2, gasoline-special-session-2022#c2, gasoline-special-session-2022#c1]
  overlay: {kind: quote, source: cec-staff-report-max-margin-2025, quote: "The commission shall not set a maximum gross gasoline refining margin or accompanying penalty under subdivisions (b) and (c), respectively, unless it finds that the likely benefits to consumers outweigh the potential costs to consumers.", caption: "Public Resources Code section 25355.5(e), as added by SB X1-2, quoted in the Energy Commission’s staff report"}
  narration: "**SB X1-2.** Senator Nancy Skinner wrote the bill, co-sponsored by Newsom and Attorney General Bonta, after Newsom's special-session proclamation called for penalties to deter price gouging and return money to Californians. He signed it in March 2023, effective 26 June: refiners would disclose more data and give a year's notice before closing or reconfiguring, and a new Division of Petroleum Market Oversight would investigate. The Energy Commission could cap gross gasoline refining margins and penalize excesses, but only after finding likely consumer benefits outweighed costs. The law gave officials the information Borenstein had sought and a penalty they would have to decide whether to use."
  duration: 13

- shot: the-industrys-answer
  view: graph
  focus: western-states-petroleum-association
  time: "2025-11-12"
  reveal: [western-states-petroleum-association, gasoline-special-session-2022, senate-bill-x1-2, severin-borenstein, pacific-research-institute, pri-no-mystery-surcharge-2025]
  reveal_claims: [western-states-petroleum-association#c2, pacific-research-institute#c1]
  overlay: {kind: quote, source: cbs-sacramento-2024-wspa-response, quote: "This has been looked into by numerous attorneys general over the years. Every single time, they come back with the same findings which is that it was market forces. The industry was acting responsibly", caption: "Kevin Slagle, Western States Petroleum Association spokesman, to CBS Sacramento, 2024"}
  narration: "**The industry's answer.** Reheis-Boyd opposed Skinner's bill before a Senate committee because it “misguidedly focuses on profits, rather than the root cause of price spikes - a lack of supply.” After passage on 27 March 2023, she warned that price caps, taxes and penalties could reduce investment, leaving Californians with less gasoline and higher costs. In 2024, trade-group spokesman Kevin Slagle told CBS that attorneys general repeatedly found market forces and that the industry acted responsibly. Reheis-Boyd asked officials to ensure affordable, reliable supply."
  duration: 13

- shot: los-angeles-phillips-66
  view: map
  camera: {center: [-118.26, 33.8], zoom: 9.6, pitch: 20, duration: 6}
  places: [los-angeles]
  time: "2025-10-16"
  reveal: [phillips-66-los-angeles-refinery, phillips-66, los-angeles]
  reveal_claims: [phillips-66#c1]
  overlay: {kind: quote, source: hp-2024-phillips-66-la-notice, quote: "With the long-term sustainability of our Los Angeles Refinery uncertain and affected by market dynamics, we are working with leading land development firms to evaluate the future use of our unique and strategically located properties near the Port of Los Angeles", caption: "Mark Lashier, chairman and CEO of Phillips 66, October 2024"}
  narration: "**Los Angeles, Phillips 66.** In October 2024, chief executive Mark Lashier announced a fourth-quarter 2025 closure for the Los Angeles-area refinery, operated by about 600 employees and 300 contractors; Lashier said, “We will work to help and support them through this transition.” He called its long-term sustainability uncertain because of market dynamics, while describing talks with developers about the 650-acre properties near the port. The company promised California supplies from inside and outside its network; the Commission records crude processing stopping on 16 October 2025, with remaining units to idle by year's end. It projected a loss of about 75,000 barrels of Southern California gasoline production a day, increasing the need for replacement supplies."
  duration: 13

- shot: the-bay-area
  view: map
  camera: {center: [-122.2, 38.0], zoom: 8.9, pitch: 20, duration: 6}
  places: [benicia-california, martinez-california, richmond-california]
  time: "2026-04"
  reveal: [valero-benicia-refinery, valero-energy, marathon-martinez-refinery, marathon-petroleum, chevron-richmond-refinery, benicia-california, martinez-california, richmond-california]
  reveal_claims: [valero-energy#c1, marathon-petroleum#c1, valero-benicia-refinery#c1]
  overlay: {kind: quote, source: hp-2025-valero-benicia-closure, quote: "California has been pursuing policies to move away from fossil fuels for the past 20 years, and the consequence of that is the regulatory and enforcement environment is the most stringent and difficult of anywhere else in North America", caption: "Lane Riggs, Valero chief executive, on an analysts’ call, April 2025, as reported by Hydrocarbon Processing"}
  narration: "**The Bay Area.** On an April 2025 analysts' call, Valero chief executive Lane Riggs explained the decision to stop refining at Benicia: California's regulatory and enforcement environment was, he said, North America's most stringent and difficult, and Benicia cost considerably more to maintain than Wilmington. Valero recorded a $1.1 billion pretax impairment for its California refineries; executive Rich Walsh said the company was meeting the Energy Commission to minimize the closure's effects. Marathon's Martinez and Phillips 66's Rodeo had already converted to renewable fuels, cutting northern California gasoline production by roughly 140,000 barrels a day, the Commission says. Valero stopped refining at Benicia in April 2026, adding another lost source to the region's supply problem."
  duration: 13

- shot: more-from-the-sea
  view: graph
  focus: california-energy-commission
  time: "2025-06-27"
  reveal: [california-energy-commission, valero-benicia-refinery, phillips-66-los-angeles-refinery, california]
  overlay: {kind: quote, source: cec-response-to-governor-2025-06-27, quote: "Gasoline imports statewide could increase to 25-35% of demand by the summer of 2026, and up to 50% in the northern California region after the announced anticipated refinery closures, bringing risk of supply disruptions and price volatility.", caption: "California Energy Commission, letter to the governor, 27 June 2025: a projection, not a count"}
  narration: "**More from the sea.** On 27 June 2025, Siva Gunda answered Newsom's request for a plan to keep fuel reliable and affordable as refineries closed. His letter projected imports rising from about 10–20 percent of demand to 25–35 percent by summer 2026, and up to 50 percent in northern California, warning of supply disruptions and price volatility. The Commission's measured 2025 share was 19 percent for imported gasoline and blending components together, with in-state refineries supplying 81 percent of gasoline consumed. Gunda recommended coordinating ports, agencies and local governments to improve import capacity, preparing for a larger share of the state's fuel to arrive by sea."
  duration: 13

- shot: a-cap-paused
  view: graph
  focus: cec-margin-cap-pause-2025
  time: "2025-08-29"
  reveal: [cec-margin-cap-pause-2025, cec-margin-cap-staff-report-2025, california-energy-commission, western-states-petroleum-association, maximum-gross-gasoline-refining-margin]
  reveal_claims: [california-energy-commission#c5, western-states-petroleum-association#c1, maximum-gross-gasoline-refining-margin#c1, california-energy-commission#c6]
  overlay: {kind: quote, source: cec-staff-report-max-margin-2025, quote: "The CEC’s preliminary analysis demonstrates that imposing a maximum gross refining margin penalty at this time may affect refiners’ capital outlay plans in essential refinery maintenance and upgrades", caption: "California Energy Commission staff report, October 2025"}
  narration: "**A cap, paused.** Gunda's June 2025 letter recommended pausing the margin cap to prioritize resupply and inventory rules; on 29 August, commissioners set it aside for at least five years. Their staff report, final in October, warned a cap could affect investment in essential maintenance and upgrades despite staff lacking direct data on capital outlays or exit thresholds; it also said a well-designed cap could theoretically induce more supply at lower prices. Reheis-Boyd welcomed “a needed step” toward certainty for investors but said it fell short of repeal. Commissioners retained power to revise or rescind the pause; for now, they would pursue supply safeguards while leaving the penalty unused."
  duration: 13

- shot: where-it-stands
  view: map
  camera: {center: [-119.5, 36.6], zoom: 5.2, pitch: 0, duration: 6}
  places: [sacramento]
  time: "2026-11"
  reveal: [california, california-energy-commission, severin-borenstein, assembly-gasoline-hearing-2026, senate-bill-x1-2]
  reveal_claims: [assembly-gasoline-hearing-2026#c1]
  overlay: {kind: quote, source: laist-2026-05-06-assembly-hearing, quote: "Based on what we’re hearing from the industry and what we have heard, the pricing will move molecules towards California, but it will come at a price,", caption: "Siva Gunda, California Energy Commission vice chair, May 2026 Assembly hearing, reported by KQED via LAist"}
  narration: "**Where it stands.** At the May 2026 Assembly hearing, Siva Gunda described the price of keeping California supplied: attracting oil meant bidding against Asian markets to divert it to the West Coast, he said. His response put a cost on the state's choice to seek replacement supplies as refineries closed. Borenstein again described an unexplained surcharge, about 50 cents in press reports; Gunda warned that securing imports would itself require paying more. Commissioners had chosen to pursue supply safeguards while pausing the margin penalty, retaining power to revise or rescind that pause. They committed to continued data collection and analysis; the Commission plans an updated margin-cap analysis by early 2027. Drivers face both questions: what keeps fuel coming, and what keeps its price above known costs."
  duration: 13
```
