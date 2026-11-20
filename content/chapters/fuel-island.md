---
uid: 01M6DMVXY557T07X5FM3R5AP5B
id: fuel-island
type: chapter
title: Fuel Island
subtitle: How a cleaner gasoline blend, a refinery explosion and a fight over prices reshaped California's fuel market
summary: California drivers paid $1.40 more per gallon than the U.S. average in August 2026. The state can price its higher taxes, climate programs and cleaner blend. The fight over what accounts for the rest runs from the Torrance explosion to a new watchdog and the closure of two refineries.
---

In August 2026, regular gasoline averaged $5.46 in California and $4.06 nationwide. Economist Severin Borenstein found that the price gap stayed wider after a refinery explosion in Torrance. California gave itself new powers to investigate prices and penalize high refining margins. As two more refineries prepared to close, commissioners chose to work first on how to replace fuel when a plant goes down.

```scene
- shot: the-gap
  view: map
  camera: {center: [-119.5, 36.6], zoom: 5.2, pitch: 0, duration: 6}
  places: [sacramento, los-angeles]
  time: "2026-08"
  reveal: [california, severin-borenstein, us-energy-information-administration, eia-california-gasoline-price-series, eia-us-gasoline-price-series, sacramento, los-angeles]
  reveal_claims: [us-energy-information-administration#c1, us-energy-information-administration#c2]
  overlay: {kind: stat, value: "$1.40", label: "California minus the U.S. average for regular gasoline in August 2026, from the EIA’s $5.458 and $4.058", source: eia-california-retail-gasoline-prices, quote: "Regular 5.949 5.547 5.305 5.458 5.924 6.063"}
  narration: "**Why does California pay more for gasoline?** In August 2026, federal figures put regular gasoline at $5.46 in California and $4.06 nationwide. The state’s watchdog found wider industry margins explained most of the lasting increase after the 2015 Torrance explosion. Oil trade group president Catherine Reheis-Boyd pointed to how few suppliers can replace California gasoline when a refinery goes down. That constraint began with a decision about what came out of a car’s tailpipe."
  duration: 13

- shot: special-blend
  view: graph
  focus: california-reformulated-gasoline
  time: "1996-03-01"
  reveal: [california-air-resources-board, california-reformulated-gasoline, california]
  reveal_claims: [california-air-resources-board#c1, california#c1]
  overlay: {kind: quote, source: carb-california-reformulated-gasoline, quote: "In addition to reducing smog-forming emissions, the use of reformulated gasoline also reduced carcinogenic toxic air contaminants by more than a third.", caption: "California Air Resources Board on its second-phase gasoline standards"}
  narration: "**A different recipe.** To cut emissions from cars, the California Air Resources Board tightened the gasoline standards it had introduced in 1992. The second blend reached pumps on 1 March 1996 with less sulfur and new limits on ingredients such as benzene. The board says the fuel cut smog-forming emissions and reduced cancer-causing air pollutants by more than a third. The U.S. Energy Information Administration says the recipe takes more processing and more expensive ingredients. Replacement gasoline had to meet the same rules, a constraint that would matter when a plant making about one gallon in ten for California went down."
  duration: 13

- shot: torrance
  view: map
  camera: {center: [-118.34, 33.84], zoom: 10.2, pitch: 25, duration: 6}
  places: [torrance-california]
  time: "2015-02-18"
  reveal: [torrance-refinery-explosion-2015, torrance-refinery, torrance-california, exxonmobil, us-chemical-safety-board]
  reveal_claims: [torrance-refinery-explosion-2015#c2, torrance-refinery-explosion-2015#c5]
  overlay: {kind: quote, source: csb-torrance-final-report-2017, quote: "Does the leaking spent slide valve invalidate the Variance?", caption: "ExxonMobil manager’s meeting notes, morning of 18 February 2015, quoted by the Chemical Safety Board"}
  narration: "**The question in the meeting notes.** At ExxonMobil’s Torrance refinery on 18 February 2015, a manager overseeing maintenance wrote down a question about a leaking safety valve. The U.S. Chemical Safety Board found that managers reused a procedure because it had been developed, approved and used successfully in 2012. They knew the valve leaked and proceeded without adequately checking whether the old safeguards would hold. Hydrocarbons got through and ignited in pollution-control equipment. Four contractors sought first aid for injuries they suffered as they fled. The wreckage left investigators with another question about what had almost happened beyond the unit."
  duration: 13

- shot: torrance-investigation
  view: graph
  focus: torrance-refinery-explosion-report
  time: "2017-05-03"
  reveal: [torrance-refinery-explosion-report, torrance-refinery-explosion-2015, us-chemical-safety-board, exxonmobil, pbf-energy]
  reveal_claims: [torrance-refinery-explosion-2015#c3, torrance-refinery-explosion-2015#c6, us-chemical-safety-board#c1, pbf-energy#c1]
  overlay: {kind: quote, source: csb-torrance-news-release-2017, quote: "This explosion and near miss should not have happened, and likely would not have happened, had a more robust process safety management system been in place.", caption: "Vanessa Allen Sutherland, U.S. Chemical Safety Board chair, 3 May 2017"}
  narration: "**Debris at the acid tanks.** When Vanessa Allen Sutherland released the Chemical Safety Board’s findings, she said the unit had operated without proper procedures. Investigators found the refinery had violated ExxonMobil’s own safety rules. A fragment narrowly missed a tank holding tens of thousands of pounds of highly toxic modified hydrofluoric acid, and catalyst dust fell on the surrounding community up to a mile away. The board sought to enforce subpoenas in federal court after ExxonMobil refused to supply details on safeguards against an acid release. The refinery ran at limited capacity until full production resumed in May 2016. Consumer Watchdog cited a RAND estimate that drivers paid at least $2.4 billion extra in the first six months, and Borenstein kept tracking prices after the plant came back."
  duration: 13

- shot: a-gap-with-a-name
  view: graph
  focus: severin-borenstein
  time: "2022-06-30"
  reveal: [severin-borenstein, petroleum-market-advisory-committee, california-energy-commission, torrance-refinery-explosion-2015, cec-2019-gasoline-price-report]
  reveal_claims: [severin-borenstein#c2, severin-borenstein#c3, california-energy-commission#c3]
  overlay: {kind: quote, source: borenstein-2022-assembly-testimony, quote: "I hope it will have the power and resources to do a deep dive into California’s gasoline prices.", caption: "Severin Borenstein, Assembly testimony, 30 June 2022"}
  narration: "**The gap stayed wider.** Borenstein told an Assembly committee on 30 June 2022 that California prices never returned to their old relationship with prices elsewhere after Torrance restarted. He said taxes and environmental fees had explained virtually all of the earlier premium. Allowing for those costs and 10 cents for the blend, he put the remaining gap at 28 to 50 cents a gallon in annual averages after the explosion and above 50 cents so far in 2022, with about $40 billion in added costs since 2015. Spot prices explained little of the gap, so he asked lawmakers to examine contracts between refiners and gas stations, work his advisory committee had lacked the staff and authority to do. That autumn brought another spike."
  duration: 13

- shot: autumn-2022
  view: graph
  focus: california-gasoline-spike-2022
  time: "2022-11-30"
  reveal: [california-gasoline-spike-2022, gavin-newsom, california-air-resources-board, gasoline-special-session-2022]
  reveal_claims: [california-gasoline-spike-2022#c1, california-gasoline-spike-2022#c2, california-gasoline-spike-2022#c3]
  overlay: {kind: quote, source: gov-2022-09-30-windfall-tax, quote: "I’m calling for a windfall tax to ensure excess oil profits go back to help millions of Californians who are getting ripped off.", caption: "Governor Gavin Newsom, 30 September 2022"}
  narration: "**Newsom calls a special session.** After his office counted an 84-cent rise in ten days, Gavin Newsom called for a windfall tax and directed the Air Resources Board to allow early sales of winter gasoline. His office said maintenance, hurricanes and taxes could explain only part of the spike, which hit lower- and middle-income families hardest. The watchdog later measured a $1.21 rise that fall as gasoline fell 9 cents in the rest of the U.S. and crude fell 39 cents a gallon. When five major refiners skipped the November hearing, Newsom cited their absence as evidence that a penalty and more disclosure were needed. On 30 November he called lawmakers into a special session starting 5 December, where the industry made its case for more supply."
  duration: 13

- shot: the-industrys-answer
  view: map
  camera: {center: [-120.5, 37.0], zoom: 5.0, pitch: 0, duration: 6}
  places: [sacramento, los-angeles, san-francisco]
  time: "2023-02-22"
  reveal: [western-states-petroleum-association, gasoline-special-session-2022, senate-bill-x1-2, california, sacramento, los-angeles, san-francisco]
  reveal_claims: [western-states-petroleum-association#c2]
  overlay: {kind: quote, source: reheis-boyd-2023-senate-testimony, quote: "Our industry is strongly opposed to Senate Bill X1-2 because it misguidedly focuses on profits, rather than the root cause of price spikes - a lack of supply.", caption: "Catherine Reheis-Boyd, Western States Petroleum Association, Senate testimony, 22 February 2023"}
  narration: "**The industry asks for more fuel.** In the special session’s February hearing, Catherine Reheis-Boyd argued that refinery outages drove price spikes because few plants outside California made its blend and no pipeline brought gasoline into the state. She put the wait for a replacement cargo at 30 to 45 days, while the Energy Commission says overseas supply can take three weeks. A Senate analysis recorded a $2.50 gap with the national average the previous fall and dated the state’s letters to refiners to around the time some plants were down for maintenance. Reheis-Boyd told senators that penalties could shrink supply, leaving them to decide how far the bill should go."
  duration: 13

- shot: sb-x1-2
  view: graph
  focus: senate-bill-x1-2
  time: "2023-03"
  reveal: [senate-bill-x1-2, gasoline-special-session-2022, division-of-petroleum-market-oversight, maximum-gross-gasoline-refining-margin, gavin-newsom, rob-bonta, california-energy-commission]
  reveal_claims: [gavin-newsom#c1, senate-bill-x1-2#c1, senate-bill-x1-2#c2, gasoline-special-session-2022#c2, gasoline-special-session-2022#c1]
  overlay: {kind: quote, source: cec-staff-report-max-margin-2025, quote: "The commission shall not set a maximum gross gasoline refining margin or accompanying penalty under subdivisions (b) and (c), respectively, unless it finds that the likely benefits to consumers outweigh the potential costs to consumers.", caption: "Consumer-benefit test in the law, quoted by Energy Commission staff"}
  narration: "**A watchdog and a conditional penalty.** Senator Nancy Skinner’s bill, co-sponsored by Newsom and Attorney General Rob Bonta, created an independent watchdog within the Energy Commission. The law took effect on 26 June 2023 and required more price and outage reporting and a year’s notice before a refinery shut or reconfigured. Commissioners could set a maximum gross refining margin or a penalty for exceeding it only if they found the likely benefits to consumers outweighed the potential costs to consumers. Reheis-Boyd warned that penalties could deter investment and raise prices. The commission began work on the cap in October and used the new reporting powers to get a closer look at the trades that set benchmark prices."
  duration: 13

- shot: a-suit-over-the-spot-market
  view: graph
  focus: vitol-sk-spot-market-case
  time: "2024-07-10"
  reveal: [vitol-sk-spot-market-case, vitol, sk-energy-americas, california-department-of-justice, xavier-becerra, rob-bonta, senate-bill-x1-2]
  reveal_claims: [california-department-of-justice#c1, vitol#c1, sk-energy-americas#c1]
  overlay: {kind: quote, source: bloomberg-law-2024-vitol-sk-settle, quote: "Any allegations of wrongdoing by Vitol are untrue and unfounded.", caption: "Vitol spokesperson, July 2024, as reported by Bloomberg Law"}
  narration: "**A $50 million settlement.** On 10 July 2024, as commissioners expanded inventory and spot-market reporting, Bonta announced a settlement resolving allegations that Vitol and SK coordinated trades after Torrance to inflate benchmark prices for profit. Xavier Becerra’s 2020 complaint alleged a possible increase of more than a cent a gallon, smaller than Borenstein’s lasting surcharge, and a possible $150 million in profits for the firms. Vitol denied wrongdoing, saying it imported fuel at competitive prices and managed risk through routine trading. Bonta said the firms would have to disclose daily trades, weekly inventories and contracts if they resumed California operations under the settlement and SB X1-2. The state could now ask what fuel companies had on hand, and lawmakers took up whether refiners should have to keep more."
  duration: 13

- shot: a-plan-for-outages
  view: graph
  focus: california-energy-commission
  time: "2024-10"
  reveal: [california-energy-commission, division-of-petroleum-market-oversight, gavin-newsom, senate-bill-x1-2, western-states-petroleum-association]
  reveal_claims: [division-of-petroleum-market-oversight#c2, senate-bill-x1-2#c1]
  overlay: {kind: quote, source: cec-sbx12-abx21-implementation, quote: "require oil refiners to plan for resupply during planned maintenance outages to avoid supply shortages that create higher gasoline prices for consumers.", caption: "Energy Commission on the resupply authority in Assembly Bill X2-1"}
  narration: "**From reporting stocks to keeping them.** In his first year as watchdog, Tai Milder urged the state to use minimum stocks and resupply plans to cushion outages. Responding to Milder’s findings that summer, trade group spokesman Kevin Slagle said companies had acted responsibly and that station location, real estate costs and services helped explain higher branded prices. In October, Newsom signed AB X2-1, giving the Energy Commission authority to require reserve stocks or plans to replace fuel during scheduled maintenance. With that work ahead, a notice under the 2023 law warned the state to prepare for the lasting loss of a Los Angeles plant."
  duration: 13

- shot: los-angeles-phillips-66
  view: map
  camera: {center: [-118.26, 33.8], zoom: 9.6, pitch: 20, duration: 6}
  places: [los-angeles]
  time: "2024-10-16"
  reveal: [phillips-66-los-angeles-refinery, phillips-66, los-angeles, gavin-newsom, california-energy-commission]
  reveal_claims: [phillips-66#c1, phillips-66-los-angeles-refinery#c1, division-of-petroleum-market-oversight#c2]
  overlay: {kind: quote, source: hp-2024-phillips-66-la-notice, quote: "With the long-term sustainability of our Los Angeles Refinery uncertain and affected by market dynamics, we are working with leading land development firms to evaluate the future use of our unique and strategically located properties near the Port of Los Angeles", caption: "Mark Lashier, Phillips 66 CEO, 16 October 2024"}
  narration: "**Phillips 66 gives notice.** On 16 October, under the 2023 notice rule, Phillips 66 chief executive Mark Lashier said the Los Angeles-area refinery would shut in late 2025. Citing uncertain long-term prospects and market conditions, he said developers were studying the company’s 650 acres near the port. About 600 employees and 300 contractors operated the plant, and Lashier pledged to help them through the transition. Phillips 66 said it would supply customers from sources inside and outside its network. Then a Bay Area refiner gave the state a deadline of its own."
  duration: 13

- shot: valero-gives-notice
  view: map
  camera: {center: [-122.2, 38.0], zoom: 8.9, pitch: 20, duration: 6}
  places: [benicia-california, martinez-california, richmond-california]
  time: "2025-04"
  reveal: [valero-benicia-refinery, valero-energy, benicia-california, marathon-martinez-refinery, marathon-petroleum, california-energy-commission]
  reveal_claims: [valero-energy#c1, valero-benicia-refinery#c2, marathon-petroleum#c1]
  overlay: {kind: quote, source: hp-2025-valero-benicia-closure, quote: "California has been pursuing policies to move away from fossil fuels for the past 20 years, and the consequence of that is the regulatory and enforcement environment is the most stringent and difficult of anywhere else in North America", caption: "Lane Riggs, Valero CEO, on an April 2025 analysts’ call, as reported by Hydrocarbon Processing"}
  narration: "**Valero puts a price on staying.** Valero gave the state notice in April 2025 that it planned to idle, restructure or cease refining in Benicia by the end of April 2026. Executive Rich Walsh told analysts the company intended to close the refinery and was working with the Energy Commission to soften the supply impact. Chief executive Lane Riggs cited California’s regulatory and enforcement environment and said Benicia cost considerably more to maintain than Valero’s Wilmington plant. Valero recorded a $1.1 billion pretax impairment for its California refineries. With two notices in hand, Newsom asked the commission how it would keep fuel affordable and available."
  duration: 13

- shot: more-from-the-sea
  view: graph
  focus: california-energy-commission
  time: "2025-06-27"
  reveal: [california-energy-commission, valero-benicia-refinery, phillips-66-los-angeles-refinery, california, california-cap-and-trade]
  reveal_claims: [california-energy-commission#c6, california#c3]
  overlay: {kind: quote, source: cec-response-to-governor-2025-06-27, quote: "Gasoline imports statewide could increase to 25-35% of demand by the summer of 2026, and up to 50% in the northern California region after the announced anticipated refinery closures, bringing risk of supply disruptions and price volatility.", caption: "Siva Gunda’s projection in the Energy Commission’s letter to the governor, 27 June 2025"}
  narration: "**Gunda looks to the ports.** Answering Newsom on 27 June, Energy Commission vice chair Siva Gunda said imports supplied about 10 to 20 percent of gasoline demand and could reach 25 to 35 percent statewide by summer 2026 and as much as half in Northern California. He warned of shortages and volatile prices and urged ports and agencies to clear bottlenecks before the refineries shut. He backed continuing cap-and-trade with cost controls to cut emissions and said the commission needed more work to design a penalty that protected consumers. He asked it to put the cap on hold and develop resupply and reserve-stock rules first."
  duration: 13

- shot: a-cap-paused
  view: graph
  focus: cec-margin-cap-pause-2025
  time: "2025-08-29"
  reveal: [cec-margin-cap-pause-2025, cec-margin-cap-staff-report-2025, california-energy-commission, western-states-petroleum-association, maximum-gross-gasoline-refining-margin]
  reveal_claims: [california-energy-commission#c5, western-states-petroleum-association#c1, maximum-gross-gasoline-refining-margin#c1, california-energy-commission#c6]
  overlay: {kind: quote, source: cec-draft-max-margin-2025-08-28, quote: "imposing a maximum gross refining margin penalty at this time may affect refiners’ capital outlay plans in essential refinery maintenance and upgrades", caption: "Energy Commission staff draft, 28 August 2025"}
  narration: "**Commissioners leave the penalty unused.** An Energy Commission draft on 28 August warned that a cap could deter essential maintenance and upgrades and said staff lacked direct data on when refiners would cut investment or leave. The watchdog argued that a well-designed cap could prompt refiners to supply more fuel and bring prices down. The next day, commissioners followed Gunda’s advice and set the cap and penalty aside for at least five years, keeping the power to revisit the decision and committing to keep collecting data. The trade group read the vote as a signal to refiners weighing whether to invest."
  duration: 13

- shot: the-industry-answers-the-pause
  view: graph
  focus: western-states-petroleum-association
  time: "2025-09-05"
  reveal: [western-states-petroleum-association, cec-margin-cap-pause-2025, california-energy-commission, california-cap-and-trade]
  reveal_claims: [western-states-petroleum-association#c1, california-energy-commission#c5]
  overlay: {kind: quote, source: wspa-2025-statement-margin-cap-pause, quote: "While today’s action by the CEC stopped short of a full statutory repeal or a 20-year pause, it represents a needed step to provide some certainty for California’s fuels market.", caption: "Catherine Reheis-Boyd, statement dated 5 September 2025"}
  narration: "**What refiners wanted from the pause.** Reheis-Boyd welcomed the vote on 5 September for giving refiners more certainty about investing, though the industry had wanted repeal or a 20-year pause. She said a cap would have worsened the investment concerns she associated with recent closures and urged legislators to keep fuel supply in mind as they renewed cap-and-trade. The commission’s analysis was still underway as Phillips 66 approached its scheduled shutdown."
  duration: 13

- shot: los-angeles-stops-refining
  view: map
  camera: {center: [-118.26, 33.8], zoom: 9.6, pitch: 20, duration: 6}
  places: [los-angeles]
  time: "2025-10-16"
  reveal: [phillips-66-los-angeles-refinery, phillips-66, los-angeles, california-energy-commission, cec-margin-cap-staff-report-2025]
  reveal_claims: [phillips-66#c1, phillips-66-los-angeles-refinery#c1, phillips-66-los-angeles-refinery#c2, california-energy-commission#c2]
  overlay: {kind: quote, source: cec-oil-refinery-history, quote: "Phillips 66, Wilmington Refinery ceased processing crude oil at the Los Angeles Refinery on Oct. 16, with remaining units expected to be idled by end of 2025.", caption: "Energy Commission refinery history"}
  narration: "**Los Angeles loses a source of gasoline.** As the investment debate continued, the commission’s 9 October final analysis estimated that the Phillips 66 closure would cut Southern California gasoline production by about 75,000 barrels a day. Staff still lacked direct data on what would trigger decisions to cut spending or shut a plant. On 16 October, Phillips 66 stopped processing crude at its Los Angeles refinery, where the commission expected the remaining units to go idle by year’s end. With fewer producers left, the watchdog’s findings pointed to how much control the remaining refiners would have over local supply."
  duration: 13

- shot: the-state-checks
  view: graph
  focus: dpmo-2024-annual-report
  time: "2025-10"
  reveal: [division-of-petroleum-market-oversight, dpmo-2024-annual-report, severin-borenstein, cec-2019-gasoline-price-report, chevron, marathon-petroleum, phillips-66-los-angeles-refinery]
  reveal_claims: [division-of-petroleum-market-oversight#c1, severin-borenstein#c1, california-energy-commission#c3, phillips-66-los-angeles-refinery#c2]
  overlay: {kind: quote, source: dpmo-annual-report-2024-source, quote: "Between 2015 and 2024, the mystery gasoline surcharge averaged $0.41 per gallon, costing Californians $59 billion.", caption: "Tai Milder’s Division of Petroleum Market Oversight, October 2025 report"}
  narration: "**Milder follows the money.** Tai Milder’s watchdog checked Borenstein’s work against prices and taxes in the rest of the U.S. It put the surcharge at 2 cents a gallon in June 2013–January 2015 and 42 cents in February 2015–July 2025, attributing 35 cents of the rise to wider gross industry margins relative to the rest of the country and 5 cents to crude costs. It estimated drivers paid $59 billion extra in 2015–2024. The watchdog projected that after Phillips 66 closed, four firms would control 98 percent of California’s crude refining capacity, versus 90 percent in January and 48 percent for the top four elsewhere. Its analysts said concentration could help explain the surcharge and branded sales could sustain higher markups. How much of those gross margins did refiners keep?"
  duration: 13

- shot: what-a-margin-is
  view: graph
  focus: cec-margin-cap-staff-report-2025
  time: "2025-11-12"
  reveal: [division-of-petroleum-market-oversight, california-energy-commission, cec-margin-cap-staff-report-2025, pacific-research-institute, pri-no-mystery-surcharge-2025, western-states-petroleum-association]
  reveal_claims: [division-of-petroleum-market-oversight#c2, california-energy-commission#c2, pacific-research-institute#c1]
  overlay: {kind: quote, source: pri-2025-11-12-no-mystery-surcharge, quote: "If refiners are earning exceptionally high profits in California, then why are they shutting down their operations in the state?", caption: "Wayne Winegarden and Kerry Jackson, Pacific Research Institute, 12 November 2025"}
  narration: "**What refiners kept.** In November, Pacific Research Institute writers Wayne Winegarden and Kerry Jackson pointed to closures and cited state data showing volume-weighted net refining losses in five of eleven months from June 2023 to April 2024. Energy Commission staff measured average California gross refining margins at 67 cents a gallon in June 2013–January 2015 and 93 cents in February 2015–June 2025, in 2025 dollars. Gross refining margins include costs, and the commission and state tax agency found California a higher-cost place to operate. Milder’s team found that the same refiners reported average operating expenses of 24 cents a gallon to investors and 72 cents to the commission from 2019 to mid-2025. The watchdog sought more consistent figures as another plant prepared to leave the market."
  duration: 13

- shot: the-bay-area
  view: map
  camera: {center: [-122.2, 38.0], zoom: 8.9, pitch: 20, duration: 6}
  places: [benicia-california, martinez-california, richmond-california]
  time: "2026-04-16"
  reveal: [valero-benicia-refinery, valero-energy, marathon-martinez-refinery, marathon-petroleum, chevron-richmond-refinery, benicia-california, martinez-california, richmond-california]
  reveal_claims: [valero-energy#c1, marathon-petroleum#c1, valero-benicia-refinery#c1]
  overlay: {kind: quote, source: benicia-bridge-2026-valero-stopped-refining, quote: "Bird said about 20 employees will ultimately be left at the facility after the layoffs conclude.", caption: "The Benicia Bridge reporting refinery manager Lauren Bird’s account, 16 April 2026"}
  narration: "**The stacks go quiet.** In April, refinery manager Lauren Bird confirmed Valero had stopped refining in Benicia. The plant had employed roughly 400 people. The Benicia Bridge reported that about 60 were expected to remain after another round of layoffs, and Bird expected about 20 would eventually stay to help import, store and distribute fuel. Commission staff estimated that earlier conversions to renewable fuels at Marathon’s Martinez plant and Phillips 66’s Rodeo plant had already cut Northern California gasoline production by about 140,000 barrels a day. Benicia left lawmakers facing the price of replacing still more local fuel."
  duration: 13

- shot: where-it-stands
  view: graph
  focus: assembly-gasoline-hearing-2026
  time: "2026-05-05"
  reveal: [california, california-energy-commission, severin-borenstein, assembly-gasoline-hearing-2026, senate-bill-x1-2]
  reveal_claims: [assembly-gasoline-hearing-2026#c1, assembly-gasoline-hearing-2026#c2, california-energy-commission#c5]
  overlay: {kind: quote, source: laist-2026-05-06-assembly-hearing, quote: "Based on what we’re hearing from the industry and what we have heard, the pricing will move molecules towards California, but it will come at a price,", caption: "Siva Gunda, Energy Commission vice chair, Assembly hearing, 5 May 2026, reported by KQED via LAist"}
  narration: "**The price of getting a ship.** After Benicia stopped refining, Gunda warned Assembly members that California could draw oil away from Asian markets by outbidding other buyers. Before Benicia closed, the commission had counted imported gasoline and blending components at 19 percent of supply in 2025 and put the in-state share of gasoline consumed that year at 81 percent. KQED reported that at the May hearing Borenstein put his surcharge at about 50 cents a gallon after accounting for policy costs. His estimate returned the Assembly to the question of how much of what drivers paid could be traced to California’s own policies."
  duration: 13

- shot: the-pieces
  view: graph
  focus: california
  time: "2026-10-15"
  reveal: [california, us-energy-information-administration, eia-state-gasoline-taxes-2026, california-energy-commission, western-states-petroleum-association, low-carbon-fuel-standard, california-cap-and-trade, california-reformulated-gasoline]
  reveal_claims: [us-energy-information-administration#c3, california#c1, california#c2, california#c3]
  overlay: {kind: stat, value: "49¢", label: "August 2026 cost per gallon of California’s two climate programs, from the Energy Commission’s October update", source: cec-august-2026-price-breakdown-data, quote: "Cap and Trade | 0.26259369964900475 Low Carbon Fuel Standard | 0.22945785715292932"}
  narration: "**What California pays for.** The commission’s October workbook puts August’s two climate programs at 49 cents a gallon and at $1.45 with listed taxes and fees. The Western States Petroleum Association estimates 51 cents and $1.46, pricing cap-and-trade at auction and assuming full pass-through. Both totals include federal tax. The commission says the programs support cleaner air in communities and help them adapt to climate change."
  duration: 13

- shot: planning-for-the-next-outage
  view: graph
  focus: california-energy-commission
  time: "2026-11-09"
  reveal: [california-energy-commission, cec-margin-cap-pause-2025, division-of-petroleum-market-oversight, maximum-gross-gasoline-refining-margin, senate-bill-x1-2, california-reformulated-gasoline]
  reveal_claims: [california-energy-commission#c5, california-energy-commission#c6, division-of-petroleum-market-oversight#c1]
  overlay: {kind: quote, source: cec-sbx12-abx21-implementation, quote: "The California Energy Commission (CEC) will host a workshop to discuss resupply rulemaking.", caption: "Energy Commission notice for 9 November 2026"}
  narration: "**Planning for the next outage.** The commission scheduled a 9 November workshop to work out how refiners would line up replacement fuel before maintenance under AB X2-1, with an updated cap analysis planned for early 2027. California pays for higher taxes, cleaner gasoline and climate programs, and Gunda’s warning explains how scarce supplies and a long trip by sea can drive prices higher when a plant goes down. Milder’s findings place most of the lasting increase after Torrance in wider gross industry margins, with the share kept as profit still uncertain. The commission’s immediate choice was to work on keeping fuel available when the next refinery went offline."
  duration: 13
```
