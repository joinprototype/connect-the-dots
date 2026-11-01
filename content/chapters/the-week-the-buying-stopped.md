---
uid: 01M6AJTPXRE0CSSEKQ1GVDA1QZ
id: the-week-the-buying-stopped
type: chapter
title: The Week the Buying Stopped
subtitle: GameStop, January 2021, through the records of an investor, a hedge fund, a broker, a clearing house and those who looked into it
summary: GameStop's share price rose about 2,700% in under three weeks, then several brokers stopped their customers buying it. The records show what happened, and who says why.
---

In January 2021 the share price of a video game retailer rose about 2,700%, and then several brokers stopped their customers from buying it. Many people formed a view about who was behind that.

This story keeps to the records: filings, testimony to Congress, a regulator's report, a committee's report and a court's opinions. Where a record is one party's account, the story says whose. A connection is not evidence of wrongdoing.

```scene
- shot: open
  view: map
  camera: {globe: true, center: [-100, 38], zoom: 2.7, duration: 5}
  places: [grapevine-texas, menlo-park]
  time: "2021-01"
  reveal: [gamestop-short-squeeze, gamestop, robinhood]
  reveal_claims: [gamestop#c1, robinhood#c2, gamestop-short-squeeze#c2]
  overlay: {kind: stat, value: "2,700%", label: "GameStop's rise, from its low of 8 January to its high of 28 January", source: sec-staff-report-2021-10-14, quote: "GME’s intraday share price increased approximately 2,700% from its intraday low on January 8 to its intraday high on January 28"}
  narration: "**One stock.** GameStop, a video game retailer based in Grapevine, Texas, saw its share price rise about 2,700% between 8 and 28 January 2021. Then Robinhood, a broker in Menlo Park, California, stopped its customers from buying more."
  duration: 12

- shot: the-bet-for
  view: graph
  lens: all
  focus: keith-gill
  time: "2019-06-07"
  reveal: [keith-gill, gamestop]
  reveal_claims: [keith-gill#c1]
  overlay: {kind: quote, source: hfsc-2021-02-18-gill-testimony, quote: "I believed the company was dramatically undervalued by the market.", caption: "Keith Gill, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**The bet for.** In June 2019 Keith Gill, an individual investor, bought call options on GameStop, and he posted his analysis on social media. He later told Congress that he thought the company was undervalued, and that his investment and his posts were entirely his own."
  duration: 13

- shot: the-bet-against
  view: graph
  focus: melvin-capital
  time: "2021-01-08"
  reveal: [gamestop, melvin-capital, gabe-plotkin, gamestop-short-squeeze]
  reveal_claims: [gabe-plotkin#c1, gamestop-short-squeeze#c4, gamestop-short-squeeze#c8]
  overlay: {kind: stat, value: "About 100%", label: "GameStop's shares sold short, as a share of those available to trade, until early 2021", source: sec-staff-report-2021-10-14, quote: "From then until early 2021, GME short interest hovered around 100%, hitting its high of 109.26% on December 31, 2020."}
  narration: "**The bet against.** A short seller gains if a share price falls. Melvin Capital, a hedge fund, had been short GameStop since it began in 2014. Through most of 2020 short interest hovered around 100% of the shares available to trade, because a lent share can be lent again."
  duration: 13

- shot: the-crowd
  view: graph
  focus: retail-investors
  time: "2021-01-11"
  reveal: [ryan-cohen, gamestop, retail-investors, gamestop-short-squeeze]
  reveal_claims: [ryan-cohen#c1, gamestop-short-squeeze#c6, gamestop-short-squeeze#c5]
  overlay: {kind: stat, value: "Nearly 900,000", label: "Accounts trading GameStop in one day by 27 January, from under 10,000 early in the month", source: sec-staff-report-2021-10-14, quote: "the number of unique accounts trading GME on a given day increased from less than 10,000 at the beginning of the month to nearly 900,000"}
  narration: "**The crowd.** On 11 January GameStop named Ryan Cohen, of Chewy, to its board, and media attention grew. Early in the month fewer than 10,000 accounts traded the stock in a day. By 27 January nearly 900,000 did."
  duration: 12

- shot: new-money
  view: graph
  focus: melvin-capital
  time: "2021-01-25"
  reveal: [melvin-capital, citadel, point72, gabe-plotkin, gamestop-short-squeeze]
  reveal_claims: [citadel#c1, point72#c1, melvin-capital#c1]
  overlay: {kind: quote, source: hfsc-2021-02-18-plotkin-testimony, quote: "Melvin Capital was not “bailed out” in the midst of these events. Citadel proactively reached out to become a new investor, similar to the investments others make in our fund.", caption: "Gabe Plotkin, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**New money.** On 25 January Citadel and Point72 said they would put $2.75 billion into Melvin Capital. Its founder, Gabe Plotkin, says Melvin was then closing its GameStop short at a loss. He told Congress that the fund was not bailed out."
  duration: 12

- shot: the-deposit-call
  view: graph
  focus: nscc
  time: "2021-01-27"
  reveal: [nscc, nscc-margin-calls-january-2021, robinhood]
  reveal_claims: [nscc-margin-calls-january-2021#c1]
  overlay: {kind: stat, value: "$6.9 billion", label: "Called from 36 clearing members in one day, 27 January", source: sec-staff-report-2021-10-14, quote: "NSCC made intraday margin calls from 36 clearing members totaling $6.9 billion"}
  narration: "**The deposit call.** Trades then took two business days to settle, and a clearing house, NSCC, holds deposits from its members until they do. On 27 January GameStop closed at its high of $347.51, and NSCC called for $6.9 billion more."
  duration: 13

- shot: before-dawn
  view: graph
  focus: robinhood
  time: "2021-01-28"
  reveal: [robinhood, vlad-tenev, nscc, nscc-margin-calls-january-2021, robinhood-trading-restrictions-2021, gamestop]
  reveal_claims: [nscc-margin-calls-january-2021#c2, robinhood-trading-restrictions-2021#c3, robinhood-trading-restrictions-2021#c2, robinhood-trading-restrictions-2021#c1]
  overlay: {kind: stat, value: "About $3 billion", label: "Robinhood's deposit shortfall that morning, by its own account", source: hfsc-2021-02-18-tenev-testimony, quote: "an automated notice stating that Robinhood Securities had a deposit deficit of approximately $3 billion"}
  narration: "**Before dawn.** Early on 28 January NSCC told Robinhood it was about $3 billion short, according to Vlad Tenev, its chief executive. Within hours customers could sell GameStop but not buy it. Robinhood says the limits were necessary to meet its deposit requirements."
  duration: 13

- shot: whose-decision
  view: graph
  focus: nscc
  time: "2021-01-29"
  reveal: [nscc, robinhood-trading-restrictions-2021, sec]
  reveal_claims: [robinhood-trading-restrictions-2021#c7]
  overlay: {kind: quote, source: sec-staff-report-2021-10-14, quote: "NSCC, like most similar central counterparties, does not instruct its member firms to stop trading or clearing individual symbols because its rules do not give it that ability.", caption: "SEC staff report, 14 October 2021"}
  narration: "**Whose decision.** SEC staff added a point. NSCC's rules do not let it tell members to stop trading a stock. A deposit call can lead a broker to restrict trading, the staff wrote, but that decision is the broker's."
  duration: 11

- shot: the-question
  view: graph
  focus: ken-griffin
  time: "2021-02-18"
  reveal: [ken-griffin, citadel, citadel-securities, robinhood, game-stopped-hearing-2021-02-18]
  reveal_claims: [robinhood#c1, game-stopped-hearing-2021-02-18#c5, robinhood-trading-restrictions-2021#c5]
  overlay: {kind: quote, source: hfsc-2021-02-18-griffin-testimony, quote: "we had no role in Robinhood’s decision to limit trading in GameStop or any other of the “meme” stocks.", caption: "Ken Griffin, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**The question.** Citadel Securities paid Robinhood for its customers' orders: 34% of Robinhood's revenue in 2020. At a House hearing on 18 February, a member asked if anyone at Citadel had talked to Robinhood about stopping the buying. Ken Griffin, Citadel's chief executive, said no."
  duration: 14

- shot: the-same-question
  view: graph
  focus: vlad-tenev
  time: "2021-02-18"
  reveal: [vlad-tenev, robinhood, citadel-securities, game-stopped-hearing-2021-02-18]
  reveal_claims: [game-stopped-hearing-2021-02-18#c7, robinhood-trading-restrictions-2021#c6, robinhood-trading-restrictions-2021#c8]
  overlay: {kind: quote, source: hfsc-hearing-117-3-transcript, quote: "Not at all. Zero pressure from anyone. It was a collateral depository requirement decision made by our Robinhood Securities president, and we stand by it.", caption: "Vlad Tenev, hearing of the U.S. House Financial Services Committee, 18 February 2021"}
  narration: "**The same question.** Vlad Tenev was asked if the decision came from pressure by anyone on the witness panel. He said no. SEC staff later recorded that witnesses testified to this, and the staff reached no finding of their own."
  duration: 12

- shot: what-moved-the-price
  view: graph
  focus: gamestop-short-squeeze
  time: "2021-10-14"
  reveal: [gamestop-short-squeeze, individual-investor-sentiment, sec]
  reveal_claims: [gamestop-short-squeeze#c1]
  overlay: {kind: quote, source: sec-staff-report-2021-10-14, quote: "it was the positive sentiment, not the buying-to-cover, that sustained the weeks-long price appreciation of GameStop stock", caption: "SEC staff report, 14 October 2021"}
  narration: "**What moved the price.** The episode is widely called a short squeeze. In October 2021 SEC staff wrote that short sellers buying back added to the price at times, but that positive sentiment sustained the rise. This is the staff's finding, not the Commission's."
  duration: 13

- shot: melvin-closes
  view: graph
  focus: melvin-capital
  time: "2022-05-18"
  reveal: [melvin-capital, gabe-plotkin, melvin-capital-wind-down-2022]
  reveal_claims: [melvin-capital-wind-down-2022#c1, melvin-capital-wind-down-2022#c2]
  overlay: {kind: quote, source: cnbc-2022-05-18-melvin-capital-unwind, quote: "I have given everything I could, but more recently that has not been enough to deliver the returns you should expect.", caption: "Gabe Plotkin, letter to investors, 18 May 2022, reported by CNBC"}
  narration: "**Melvin closes.** In May 2022 Melvin Capital said it would unwind its funds and return cash to its investors, CNBC reported. Gabe Plotkin wrote that he would step away from managing outside money."
  duration: 11

- shot: the-house-report
  view: graph
  focus: hfsc-game-stopped-staff-report-2022
  time: "2022-06-24"
  reveal: [hfsc-game-stopped-staff-report-2022, house-financial-services-committee, robinhood, nscc]
  reveal_claims: [hfsc-game-stopped-staff-report-2022#c1, hfsc-game-stopped-staff-report-2022#c2, hfsc-game-stopped-staff-report-2022#c3]
  overlay: {kind: stat, value: "$9.7 billion", label: "Deposits waived for clearing members on 28 January, according to the House report", source: hfsc-2022-06-24-game-stopped-staff-report, quote: "The Depository Trust & Clearing Corporation (DTCC) waived $9.7 billion of collateral deposit requirements on January 28, 2021."}
  narration: "**The House report.** In June 2022 the committee's majority staff said Robinhood's risk management was inadequate, and that DTCC, NSCC's parent, waived $9.7 billion of deposits on 28 January. These findings are the majority staff's, not the whole committee's."
  duration: 13

- shot: one-day-shorter
  view: graph
  focus: shortening-the-securities-transaction-settlement-cycle
  time: "2023-02-15"
  reveal: [shortening-the-securities-transaction-settlement-cycle, sec, gamestop-short-squeeze]
  reveal_claims: [gamestop-short-squeeze#c10]
  overlay: {kind: quote, source: sec-2023-02-15-shortening-settlement-cycle-final-rule, quote: "in part informed by episodes in 2020 and 2021 of increased market volatility that highlighted potential vulnerabilities in the U.S. securities market", caption: "U.S. Securities and Exchange Commission, final rule, 15 February 2023"}
  narration: "**One day shorter.** In February 2023 the SEC cut settlement from two business days to one, starting on 28 May 2024. In the SEC's words, that step was informed in part by episodes of market volatility in 2020 and 2021."
  duration: 12

- shot: in-court
  view: graph
  focus: january-2021-short-squeeze-trading-litigation
  time: "2024-06-26"
  reveal: [january-2021-short-squeeze-trading-litigation, robinhood, citadel-securities]
  reveal_claims: [january-2021-short-squeeze-trading-litigation#c1, january-2021-short-squeeze-trading-litigation#c2, january-2021-short-squeeze-trading-litigation#c3]
  overlay: {kind: quote, source: ca11-2024-06-26-guzman-v-robinhood, quote: "we need not decide whether Plaintiffs plausibly alleged an agreement", caption: "U.S. Court of Appeals for the Eleventh Circuit, Guzman v. Robinhood, 26 June 2024"}
  narration: "**In court.** Investors sued. A federal appeals court upheld the dismissal of state-law claims against Robinhood in 2023, and of an antitrust claim against Robinhood and Citadel Securities in 2024. The court did not decide whether the investors had plausibly alleged an agreement."
  duration: 13

- shot: still-explaining
  view: graph
  focus: gamestop-short-squeeze
  reveal: [gamestop-short-squeeze, keith-gill, gamestop, melvin-capital, robinhood, nscc, citadel-securities, retail-investors]
  reveal_claims: [gamestop-short-squeeze#c3, gamestop-short-squeeze#c4, gamestop-short-squeeze#c5, gamestop-short-squeeze#c7, robinhood-trading-restrictions-2021#c4]
  overlay: {kind: quote, source: hfsc-2021-02-18-gill-testimony, quote: "As for what happened in January, others will have to explain it.", caption: "Keith Gill, testimony to the U.S. House of Representatives, 18 February 2021"}
  narration: "**Others will explain.** Keith Gill left the explaining to others. A regulator, a committee and a court have each looked at a part, and each line here shows its proof. A connection is not evidence of wrongdoing."
  explore: true
  duration: 11
```

Every record in this story is one click away on the page for the [[gamestop-short-squeeze]], and each link there shows its proof.
