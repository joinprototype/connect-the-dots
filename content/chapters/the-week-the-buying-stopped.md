---
uid: 01M6AJTPXRE0CSSEKQ1GVDA1QZ
id: the-week-the-buying-stopped
type: chapter
title: The Week the Buying Stopped
subtitle: GameStop, January 2021, through the records of an investor, a hedge fund, a broker, a clearing house and those who looked into it
summary: GameStop's share price rose about 2,700% in under three weeks, then several brokers stopped their customers buying it. The records show what happened, and who says why.
---

In January 2021 GameStop’s share price rose about 2,700% from its 8 January low to its 28 January high. Robinhood restricted new purchases in eight securities, including GameStop and AMC. Its clearing subsidiary made that decision; NSCC demanded collateral but had no authority to order a stock’s trading stopped. Interactive Brokers said it acted on its own risk concerns; Webull received a restriction order from its clearing firm, Apex.

Keith Gill had bet on the retailer surviving. Gabe Plotkin had bet against it. Robinhood’s executives faced a demand for billions of dollars before the market opened. Their choices would bring them before Congress, and investors would take the restrictions to court.

```scene
- shot: open
  view: map
  camera: {globe: true, center: [-100, 38], zoom: 2.7, duration: 5}
  places: [grapevine-texas, menlo-park]
  time: "2021-01"
  reveal: [gamestop-short-squeeze, gamestop, robinhood]
  reveal_claims: [gamestop#c1, robinhood#c2, gamestop-short-squeeze#c2]
  overlay: {kind: stat, value: "2,700%", label: "GameStop's rise, from its low of 8 January to its high of 28 January", source: sec-staff-report-2021-10-14, quote: "GME’s intraday share price increased approximately 2,700% from its intraday low on January 8 to its intraday high on January 28"}
  narration: "**One stock.** On 28 January 2021, Vlad Tenev’s brokerage in Menlo Park stopped its customers buying more GameStop shares. The video game retailer in Grapevine, Texas, saw its share price rise about 2,700% from its 8 January low to its 28 January high. Tenev later told Congress that Robinhood needed the limits to meet its clearinghouse deposit requirements. Customers could sell, but anyone trying to buy more now faced a closed door."
  duration: 12

- shot: the-bet-for
  view: graph
  lens: all
  focus: keith-gill
  time: "2019-06"
  reveal: [keith-gill, gamestop]
  reveal_claims: [keith-gill#c1, gamestop-short-squeeze#c13]
  overlay: {kind: quote, source: hfsc-hearing-117-3-transcript, quote: "In early June of 2019, the price of GameStop stock declined below what I thought was its fair value.", caption: "Keith Gill, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**The bet for.** In early June 2019, GameStop’s price fell below what Keith Gill thought it was worth, he later told Congress. He invested in 2019 and 2020 because he believed the market was overestimating the likelihood of bankruptcy: he had grown up shopping at GameStop and believed its stores still had value. He also saw a chance to reinvent the business for the digital economy. He added to his position through 2019 and 2020 and posted his analysis on social media; the investment and the posts, he testified, were entirely his own."
  duration: 13

- shot: massachusetts
  view: graph
  focus: robinhood-financial
  time: "2020-12-16"
  reveal: [robinhood-financial, massachusetts-securities-division, massachusetts-robinhood-settlement-2024]
  reveal_claims: [robinhood-financial#c7, robinhood-financial#c5, robinhood-financial#c6, massachusetts-robinhood-settlement-2024#c1, massachusetts-robinhood-settlement-2024#c2]
  overlay: {kind: quote, source: mass-robinhood-consent-order-2024-01-18, quote: "Digital confetti raining down from the top of the screen after a customer's first trade", caption: "Massachusetts Securities Division's allegations, as recorded in its consent order with Robinhood, 18 January 2024"}
  narration: "**Massachusetts.** On 16 December 2020, the Massachusetts Securities Division filed a complaint accusing Robinhood Financial of “aggressive tactics to attract inexperienced investors”. It alleged failures to supervise app features such as first-trade confetti, review options approvals and prevent platform outages that blocked customers from trading. The division amended its complaint on 21 October 2021. Robinhood settled it and a separate cybersecurity investigation in an 18 January 2024 consent order carrying a $7.5 million fine: it neither admitted nor denied the complaint’s facts or legal violations, but admitted the separate facts concerning the November 2021 data breach."
  duration: 14

- shot: the-bet-against
  view: graph
  focus: melvin-capital
  time: "2021-01-08"
  reveal: [gamestop, melvin-capital, gabe-plotkin, gamestop-short-squeeze]
  reveal_claims: [gabe-plotkin#c1, gamestop-short-squeeze#c4, gamestop-short-squeeze#c8, gamestop-short-squeeze#c14]
  overlay: {kind: stat, value: "About 100%", label: "GameStop's shares sold short, as a share of those available to trade, until early 2021", source: sec-staff-report-2021-10-14, quote: "From then until early 2021, GME short interest hovered around 100%, hitting its high of 109.26% on December 31, 2020."}
  narration: "**The bet against.** Gabe Plotkin had put Melvin Capital on the other side of Gill’s wager since founding the fund in 2014. He later told Congress that GameStop’s model of selling games in physical stores “is being overtaken by digital downloads through the internet.” He said the pandemic accelerated the shift as players downloaded at home; his short position would profit if the share price fell. Through most of 2020, GameStop’s short interest hovered around 100% of the shares available to trade, because a lent share can be lent again; a rising price would make closing those bets more expensive."
  duration: 13

- shot: the-crowd
  view: graph
  focus: retail-investors
  time: "2021-01-11"
  reveal: [ryan-cohen, gamestop, retail-investors, gamestop-short-squeeze]
  reveal_claims: [ryan-cohen#c1, gamestop-short-squeeze#c6, gamestop-short-squeeze#c5, gamestop-short-squeeze#c15]
  overlay: {kind: stat, value: "Nearly 900,000", label: "Accounts trading GameStop in one day by 27 January, from under 10,000 early in the month", source: sec-staff-report-2021-10-14, quote: "the number of unique accounts trading GME on a given day increased from less than 10,000 at the beginning of the month to nearly 900,000"}
  narration: "**The crowd.** On 11 January 2021, Ryan Cohen, the Chewy co-founder, joined GameStop’s board. Gill later pointed to Cohen and the colleagues he brought in as people who “could turn around this company.” Media attention grew with the appointment, and the stock’s daily pool of traders swelled: SEC staff counted fewer than 10,000 accounts early in January and nearly 900,000 by 27 January. At Robinhood, the growing volume would put pressure on staff and cash."
  duration: 12

- shot: new-money
  view: graph
  focus: melvin-capital
  time: "2021-01-25"
  reveal: [melvin-capital, citadel, point72, gabe-plotkin, gamestop-short-squeeze]
  reveal_claims: [citadel#c1, point72#c1, melvin-capital#c1, gamestop-short-squeeze#c14]
  overlay: {kind: quote, source: hfsc-hearing-117-3-transcript, quote: "Citadel proactively reached out to become a new investor, similar to the investments that others make in our fund.", caption: "Gabe Plotkin, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**New money.** As GameStop climbed, Plotkin began closing Melvin’s short position at a loss. He told Congress that his view of the business had not changed, but “something unprecedented was happening.” On 25 January, Citadel and Point72 announced a $2.75 billion investment in his fund; Plotkin rejected the description of a bailout, saying Citadel approached him with a chance to buy low and earn returns if Melvin recovered. He testified that Melvin closed all its GameStop positions days before the buying restrictions; its investors were left with losses he pledged to earn back."
  duration: 12

- shot: the-deposit-call
  view: graph
  focus: nscc
  time: "2021-01-27"
  reveal: [nscc, nscc-margin-calls-january-2021, robinhood]
  reveal_claims: [nscc-margin-calls-january-2021#c1, nscc-margin-calls-january-2021#c3, robinhood-trading-restrictions-2021#c12]
  overlay: {kind: stat, value: "$6.9 billion", label: "Called from 36 clearing members in one day, 27 January", source: sec-staff-report-2021-10-14, quote: "NSCC made intraday margin calls from 36 clearing members totaling $6.9 billion"}
  narration: "**The deposit call.** On 27 January, Robinhood employees coded position limits; a brokerage manager explained: “The real reason is firm risk and us needing to control the velocity of trading.” The manager opposed telling customers that reason, and a product manager agreed, House majority staff later reported. Tenev raised concerns with his finance chief about keeping enough cash on hand, and Robinhood Markets drew $500 million from a credit line. NSCC, the clearinghouse standing behind unsettled trades, called on 36 member firms for another $6.9 billion that day. Trades took two business days to settle; brokers’ deposits covered the risk until money and shares changed hands. Robinhood would face another demand before the next market opening."
  duration: 13

- shot: before-dawn
  view: graph
  focus: robinhood
  time: "2021-01-28"
  reveal: [robinhood, vlad-tenev, nscc, nscc-margin-calls-january-2021, robinhood-trading-restrictions-2021, gamestop]
  reveal_claims: [nscc-margin-calls-january-2021#c2, robinhood-trading-restrictions-2021#c3, robinhood-trading-restrictions-2021#c2, robinhood-trading-restrictions-2021#c1, robinhood-trading-restrictions-2021#c9]
  overlay: {kind: stat, value: "About $3 billion", label: "Robinhood's deposit shortfall that morning, by its own account", source: hfsc-2021-02-18-tenev-testimony, quote: "an automated notice stating that Robinhood Securities had a deposit deficit of approximately $3 billion"}
  narration: "**Before dawn.** At 5:11 a.m. Eastern on 28 January, Robinhood Securities learned it was about $3 billion short of its deposit requirement, Tenev later testified. House majority staff reported that its president, Jim Swartwout, texted COO Gretchen Howard at 6:29: “Huge liquidity issue.” Swartwout later told staff he meant meeting DTCC’s collateral requirement. NSCC waived the excess capital premium that morning; Howard said the waiver left Robinhood comfortable with its liquidity. That evening, staff reported, Tenev told CNBC: “there’s no liquidity problem.” Staff found that Robinhood had been concerned about liquidity for days and was unprepared to meet the demand; the waiver gave its leaders breathing room. Customers could sell GameStop but could not buy more."
  duration: 13

- shot: whose-decision
  view: graph
  focus: nscc
  time: "2021-01-28"
  reveal: [nscc, robinhood-trading-restrictions-2021, sec, amc-entertainment]
  reveal_claims: [robinhood-trading-restrictions-2021#c7, robinhood-trading-restrictions-2021#c10, robinhood-trading-restrictions-2021#c11]
  overlay: {kind: quote, source: sec-staff-report-2021-10-14, quote: "NSCC, like most similar central counterparties, does not instruct its member firms to stop trading or clearing individual symbols because its rules do not give it that ability.", caption: "SEC staff report, 14 October 2021"}
  narration: "**Whose decision.** Jim Swartwout, Robinhood Securities’ president, made the restriction decision, Tenev told Congress. NSCC demanded money but had no power to order a stock’s trading stopped, SEC staff later explained; Tenev said it waived Robinhood’s excess capital premium shortly after 9 a.m. on 28 January. Robinhood initially stopped new purchases in eight securities: GameStop, AMC, BlackBerry, Bed Bath & Beyond, Express, Koss, Naked Brand and Nokia. On 29 January it switched to position limits, with its restricted list reaching over 50 names; the limits lasted until 5 February."
  duration: 11

- shot: different-desks
  view: graph
  focus: interactive-brokers
  time: "2021-01-28"
  reveal: [interactive-brokers, interactive-brokers-group, thomas-peterffy, webull, anthony-denier, apex-clearing, amc-entertainment, gamestop, nscc]
  reveal_claims: [thomas-peterffy#c1, interactive-brokers#c1, interactive-brokers#c2, webull#c1, anthony-denier#c1, apex-clearing#c1, gamestop-short-squeeze#c17, gamestop-short-squeeze#c18, gamestop-short-squeeze#c19, gamestop-short-squeeze#c20, gamestop-short-squeeze#c21, gamestop-short-squeeze#c22, gamestop-short-squeeze#c24, gamestop-short-squeeze#c23]
  overlay: {kind: quote, source: bloomberglaw-peterffy-2021-01-28, quote: "Simply put, we are worried about the integrity of the marketplace and the system,", caption: "Thomas Peterffy, Bloomberg Television interview, 28 January 2021"}
  narration: "**Different desks.** Interactive Brokers chairman Thomas Peterffy said his firm acted independently, worried about the market and system; it told House staff its reason was risk management rather than a capital or liquidity shortage. Webull obeyed Apex’s instruction to restrict GameStop, AMC and Koss stocks and options; CEO Anthony Denier said: “Our clearing firm simply cannot afford the cost to settle those trades,” adding that regulations barred using customer funds to front the cost. Apex told staff it expected more collateral demands, including an excess premium it calculated itself; it would still need more capital if that charge came the next morning. House majority staff reported that Apex misunderstood whether NSCC could collect that premium during the day. Webull reopened purchases that afternoon after about 193 minutes."
  duration: 14

- shot: cash-for-the-broker
  view: map
  camera: {center: [-122.1817, 37.453], zoom: 9, duration: 5}
  places: [menlo-park]
  time: "2021-02-01"
  reveal: [robinhood, jason-warnick, robinhood-capital-raise-2021]
  reveal_claims: [robinhood#c2, jason-warnick#c1, robinhood-capital-raise-2021#c1, robinhood-capital-raise-2021#c2]
  overlay: {kind: quote, source: robinhood-raises-2021-02-01, quote: "This round of funding will help us scale to meet the incredible growth we’ve seen and demand for our platform.", caption: "Jason Warnick, Robinhood chief financial officer, 1 February 2021"}
  narration: "**Cash for the broker.** On 1 February, Robinhood finance chief Jason Warnick publicly explained a $3.4 billion capital raise, including $1 billion announced on 29 January: the money would help the company meet growth and demand for its platform. Robinhood named Ribbit Capital as the lead investor, alongside existing investors including Sequoia and Andreessen Horowitz. Tenev later told Congress that the additional capital let Robinhood remove its trading restrictions; the money went to the brokerage, while customers still faced purchase limits."
  duration: 12

- shot: the-question
  view: graph
  focus: ken-griffin
  time: "2021-02-18"
  reveal: [ken-griffin, citadel, citadel-securities, robinhood, game-stopped-hearing-2021-02-18]
  reveal_claims: [robinhood#c1, game-stopped-hearing-2021-02-18#c5, robinhood-trading-restrictions-2021#c5, game-stopped-hearing-2021-02-18#c8, robinhood-trading-restrictions-2021#c8]
  overlay: {kind: quote, source: hfsc-2021-02-18-griffin-testimony, quote: "we had no role in Robinhood’s decision to limit trading in GameStop or any other of the “meme” stocks.", caption: "Ken Griffin, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**The question.** Some blamed hedge funds and their trading partners for pressuring brokers to restrict buying; SEC staff later recounted that narrative and witnesses’ denials. At the House hearing on 18 February, Representative Juan Vargas asked Ken Griffin whether anyone in his organization had talked to Robinhood about restricting GameStop buying. Citadel had invested in Melvin; the separate market maker Citadel Securities paid for Robinhood’s customer orders, providing 34% of Robinhood’s 2020 revenue. Griffin, Citadel’s chief executive, denied any role: “Let me be perfectly clear: Absolutely not.” Vargas asked whether deposing everyone in the organization would bear that out; Griffin answered, “That is correct.”"
  duration: 14

- shot: the-same-question
  view: graph
  focus: vlad-tenev
  time: "2021-02-18"
  reveal: [vlad-tenev, robinhood, citadel-securities, game-stopped-hearing-2021-02-18]
  reveal_claims: [game-stopped-hearing-2021-02-18#c7, robinhood-trading-restrictions-2021#c6, robinhood-trading-restrictions-2021#c8, game-stopped-hearing-2021-02-18#c9]
  overlay: {kind: quote, source: hfsc-hearing-117-3-transcript, quote: "Not at all. Zero pressure from anyone. It was a collateral depository requirement decision made by our Robinhood Securities president, and we stand by it.", caption: "Vlad Tenev, hearing of the U.S. House Financial Services Committee, 18 February 2021"}
  narration: "**The same question.** Representative Patrick McHenry asked Tenev whether anyone on the witness panel had pressured Robinhood to stop buying while allowing selling. Tenev told McHenry: “Not at all. Zero pressure from anyone.” He named his clearing subsidiary’s president as the decision maker and deposit requirements as the reason. By the hearing, Tenev said Robinhood had raised $3.4 billion in additional capital to let customers resume normal trading, including in the stocks it had restricted."
  duration: 12

- shot: a-different-bill
  view: graph
  focus: robinhood-financial
  time: "2021-06-30"
  reveal: [robinhood-financial, finra, robinhood-finra-settlement-2021]
  reveal_claims: [robinhood-financial#c4, robinhood-finra-settlement-2021#c1, robinhood-finra-settlement-2021#c2]
  overlay: {kind: quote, source: finra-robinhood-release-2021-06-30, quote: "Compliance with these rules is not optional and cannot be sacrificed for the sake of innovation or a willingness to ‘break things’ and fix them later,", caption: "Jessica Hopper, FINRA head of enforcement, 30 June 2021"}
  narration: "**A different bill.** On 30 June, FINRA fined Robinhood Financial $57 million and ordered $12,598,445.16 restitution plus interest. FINRA found misleading information during periods since September 2016, deficient options approvals since December 2017, technology supervision failures from January 2018 through February 2021 and unreported complaints from January 2018 through December 2020. It described a 20-year-old customer who died by suicide, leaving a note expressing confusion about margin. FINRA dated the largest outages to March 2020; outage restitution covered January 2018–December 2020, excluding January 2021’s buying restrictions. Robinhood consented without admitting or denying the findings and said it had strengthened supervision, technology and customer support."
  duration: 14

- shot: what-moved-the-price
  view: graph
  focus: gamestop-short-squeeze
  time: "2021-10-14"
  reveal: [gamestop-short-squeeze, individual-investor-sentiment, sec, gamestop, gamestop-share-sales-2021, jefferies]
  reveal_claims: [gamestop-short-squeeze#c1, gamestop-short-squeeze#c14, gamestop-short-squeeze#c2, gamestop#c2, gamestop-share-sales-2021#c1, gamestop-share-sales-2021#c2]
  overlay: {kind: quote, source: sec-staff-report-2021-10-14, quote: "it was the positive sentiment, not the buying-to-cover, that sustained the weeks-long price appreciation of GameStop stock", caption: "SEC staff report, 14 October 2021"}
  narration: "**What moved the price.** SEC staff said major short sellers bought back shares after significant losses, with short covering likely contributing to sharp rises at times but accounting for only a small fraction of buying. In October, staff said positive sentiment sustained the rise without determining whether buyers sought a squeeze or believed in the business; GameStop had fallen more than 86% from its 28 January high by the close of the first week of February. GameStop itself sold new shares: it reported 3.5 million sold for about $551 million gross by 26 April, and another 5 million for about $1.126 billion gross by 22 June. Those were proceeds before commissions and expenses; the company said the net proceeds would fund its transformation, growth and balance sheet."
  duration: 13

- shot: melvin-closes
  view: graph
  focus: melvin-capital
  time: "2022-05-18"
  reveal: [melvin-capital, gabe-plotkin, melvin-capital-wind-down-2022]
  reveal_claims: [melvin-capital-wind-down-2022#c1, melvin-capital-wind-down-2022#c2, melvin-capital-wind-down-2022#c3, gamestop-short-squeeze#c14]
  overlay: {kind: quote, source: cnbc-2022-05-18-melvin-capital-unwind, quote: "I now recognize that I need to step away from managing external capital.", caption: "Gabe Plotkin, letter to investors, 18 May 2022, reported by CNBC"}
  narration: "**Melvin closes.** In February 2021, Plotkin told Congress that Melvin’s investors had suffered significant losses: “It is now our job to earn it back.” On 18 May 2022, he wrote them a different message, reported by CNBC: “I now recognize that I need to step away from managing external capital.” CNBC put the fund’s loss at 21% for the first quarter of 2022. Plotkin said he had given everything he could and still had not delivered the returns investors should expect; Melvin would unwind its funds and return their cash."
  duration: 11

- shot: the-house-report
  view: graph
  focus: hfsc-game-stopped-staff-report-2022
  time: "2022-06-24"
  reveal: [hfsc-game-stopped-staff-report-2022, house-financial-services-committee, robinhood, nscc]
  reveal_claims: [hfsc-game-stopped-staff-report-2022#c1, hfsc-game-stopped-staff-report-2022#c2, hfsc-game-stopped-staff-report-2022#c3, hfsc-game-stopped-staff-report-2022#c5, hfsc-game-stopped-staff-report-2022#c6]
  overlay: {kind: stat, value: "$9.7 billion", label: "Deposits waived for clearing members on 28 January, according to the House report", source: hfsc-2022-06-24-game-stopped-staff-report, quote: "The Depository Trust & Clearing Corporation (DTCC) waived $9.7 billion of collateral deposit requirements on January 28, 2021."}
  narration: "**The House report.** Chairwoman Maxine Waters had called in market experts to consider what legislation was needed; on 24 June 2022, she and subcommittee chair Al Green released the majority staff’s findings. Staff said Robinhood had inadequate risk management and prioritized growth above stability. They also found that DTCC, NSCC’s parent, waived $9.7 billion of deposit requirements on 28 January; NSCC officials told them that enforcing the charges could have left several firms unable to pay at once, threatening the market. The majority staff recommended written plans for trading restrictions and emergency fundraising before another volatile week arrived."
  duration: 13

- shot: one-day-shorter
  view: graph
  focus: shortening-the-securities-transaction-settlement-cycle
  time: "2023-02-15"
  reveal: [shortening-the-securities-transaction-settlement-cycle, sec, gamestop-short-squeeze]
  reveal_claims: [gamestop-short-squeeze#c10, game-stopped-hearing-2021-02-18#c10]
  overlay: {kind: quote, source: hfsc-2021-02-18-tenev-testimony, quote: "The existing two-day period to settle trades exposes investors and the industry to unnecessary risk", caption: "Vlad Tenev, written testimony to Congress, 18 February 2021"}
  narration: "**One day shorter.** After the buying stopped, Tenev urged Congress to change the settlement system: brokers’ own cash stayed locked up while trades waited two business days to settle. He argued that real-time settlement would have let Robinhood handle volatility better without restricting purchases. In February 2023, the SEC adopted a shorter cycle, citing the market volatility of 2020 and 2021 as part of its reasoning. From 28 May 2024, the standard wait would be one business day, cutting the time brokers had to cover unsettled trades."
  duration: 12

- shot: back-on-screen
  view: graph
  focus: keith-gill
  time: "2024-06-07"
  reveal: [keith-gill, keith-gill-return-2024, gamestop, ryan-cohen]
  reveal_claims: [keith-gill-return-2024#c1, keith-gill-return-2024#c2, keith-gill-return-2024#c3, keith-gill#c1]
  overlay: {kind: quote, source: ap-keith-gill-2024-06-07, quote: "I feel like I see enough here I believe this guy might be able to do it,", caption: "Keith Gill on Ryan Cohen, YouTube livestream, 7 June 2024, reported by AP"}
  narration: "**Back on screen.** On 7 June 2024, Gill returned to YouTube after more than three years; AP counted over 600,000 views. He backed Ryan Cohen’s turnaround approach, warned “You could lose it all,” and denied working with a hedge fund or large institution. Earlier that day, GameStop reported weaker quarterly sales and proposed selling up to 75 million shares; its stock was already down about 20% before the stream. AP reported a closing fall of 39.4% to $28.22. GameStop’s filing said its extreme price fluctuations “do not appear to be based on the underlying fundamentals of our business or results of operations.”"
  duration: 13

- shot: in-court
  view: graph
  focus: january-2021-short-squeeze-trading-litigation
  time: "2024-06-26"
  reveal: [january-2021-short-squeeze-trading-litigation, robinhood, citadel-securities]
  reveal_claims: [january-2021-short-squeeze-trading-litigation#c1, january-2021-short-squeeze-trading-litigation#c2, january-2021-short-squeeze-trading-litigation#c3, january-2021-short-squeeze-trading-litigation#c4]
  overlay: {kind: quote, source: ca11-2024-06-26-guzman-v-robinhood, quote: "we need not decide whether Plaintiffs plausibly alleged an agreement", caption: "U.S. Court of Appeals for the Eleventh Circuit, Guzman v. Robinhood, 26 June 2024"}
  narration: "**In court.** Investors who said they sold at deflated prices alleged that Robinhood and Citadel Securities agreed to restrict buying to drive prices down and protect Citadel’s short positions; they said Robinhood depended on Citadel’s payments. The defendants rejected that allegation, saying Robinhood acted independently to reduce volatility and collateral requirements. The Eleventh Circuit upheld dismissal of state-law claims against Robinhood on 10 August 2023: its contract allowed restrictions, and it had no duty to prevent purely economic loss. On 26 June 2024, in Circuit Judge Branch’s opinion, the court upheld dismissal of the antitrust claim because investors had not plausibly alleged harm to competition in their defined markets; the court left undecided whether they had plausibly alleged an agreement."
  duration: 13

- shot: still-explaining
  view: graph
  focus: gamestop-short-squeeze
  reveal: [gamestop-short-squeeze, keith-gill, gamestop, melvin-capital, robinhood, nscc, citadel-securities, retail-investors]
  reveal_claims: [gamestop-short-squeeze#c3, gamestop-short-squeeze#c4, gamestop-short-squeeze#c5, gamestop-short-squeeze#c7, robinhood-trading-restrictions-2021#c4, gamestop-short-squeeze#c16]
  overlay: {kind: quote, source: hfsc-2021-02-18-gill-testimony, quote: "As for what happened in January, others will have to explain it.", caption: "Keith Gill, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**Others will explain.** Testifying in February, Gill recalled visiting family in Brockton for the holidays after GameStop passed $20 in December; he already considered his investment a success: “The money would go such a long way for us.” He acknowledged that others had lost money and welcomed the committee’s examination of how the market worked. “As for what happened in January, others will have to explain it.” He remained invested in GameStop and supported individuals’ right to invest in what they wanted, when they wanted."
  explore: true
  duration: 11
```

The [[gamestop-short-squeeze|GameStop surge]] left investors seeking answers in Congress and in court.
