---
uid: 01M54JKTHFQZ5HXD4T334J8G6W
id: gamestop-short-squeeze
type: event
name: "GameStop short squeeze"
in_sentence: "the GameStop short squeeze"
aliases: ["January 2021 GME market events", "GameStop trading frenzy", "meme stock episode"]
summary: "GameStop's share price rose about 2,700% between 8 and 28 January 2021, then fell more than 86% by early February. The episode is widely called a short squeeze."
same_as: {wikidata: Q105086394}
image: {url: "https://thumb.wikimedia.org/wikipedia/commons/thumb/5/51/GameStop_%2814666287269%29.jpg/960px-GameStop_%2814666287269%29.jpg", license: "CC BY 2.0", author: "Mike Mozart from Funny YouTube, USA", page: "https://commons.wikimedia.org/wiki/File:GameStop_(14666287269).jpg"}
when: "2021-01-08/2021-02-05"
claims:
  - id: c1
    rel: caused_by
    to: individual-investor-sentiment
    according_to: [sec]
    note: "A finding of SEC staff, not of the Commission. Staff found that short covering likely added to the price in some short periods but was a small fraction of overall buying."
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 3.4, Short Selling and Covering Short Positions, p. 26", quote: "Whether driven by a desire to squeeze short sellers and thus to profit from the resultant rise in price, or by belief in the fundamentals of GameStop, it was the positive sentiment, not the buying-to-cover, that sustained the weeks-long price appreciation of GameStop stock."}
  - id: c2
    rel: involved
    to: gamestop
    role: "company whose stock (GME) surged and then fell"
    src:
      - {s: sec-staff-report-2021-10-14, at: "§3.2 GME Equities Trading, p. 19", quote: "Overall, GME’s intraday share price increased approximately 2,700% from its intraday low on January 8 to its intraday high on January 28, followed by a decrease of over 86% from that day to the closing price at the end of the first week of February."}
      - {s: sec-staff-report-2021-10-14, at: "§3.2 GME Equities Trading, p. 18", quote: "The following day, share prices jumped further to an intraday high of $483.00."}
  - id: c3
    rel: involved
    to: keith-gill
    role: "individual investor who posted his GameStop analysis on social media"
    note: "He testified that he bought call options on GameStop stock on 7 June 2019, and added to his position through much of 2019 and 2020."
    src:
      - {s: hfsc-2021-02-18-gill-testimony, at: "pp. 1–2", quote: "I am an individual investor. My investment in GameStop and my posts on social media were entirely my own."}
  - id: c4
    rel: involved
    to: melvin-capital
    role: "held a short position in GameStop"
    note: "Plotkin testified that Melvin closed out all of its GameStop positions days before trading platforms limited trading in the stock."
    src:
      - {s: hfsc-2021-02-18-plotkin-testimony, at: "GameStop Position, p. 2", quote: "In fact, we had been short GameStop since Melvin’s inception six years earlier"}
  - id: c5
    rel: involved
    to: retail-investors
    role: "individual investors trading GME"
    note: "SEC staff count: accounts trading GME on a given day rose from under 10,000 in early January to nearly 900,000 by 27 January 2021."
    src:
      - {s: sec-staff-report-2021-10-14, at: "§3.2 GME Equities Trading, p. 20", quote: "The increases coincided with a sharp increase in the number of individual accounts actively trading GME."}
      - {s: sec-staff-report-2021-10-14, at: "§3.2 GME Equities Trading, p. 20", quote: "by January 27, the number of unique accounts trading GME on a given day increased from less than 10,000 at the beginning of the month to nearly 900,000."}
  - id: c6
    rel: involved
    to: ryan-cohen
    role: "investor whose appointment to the GameStop board was announced on 11 January 2021, as media attention on GME increased"
    note: "“Mr. Cohen, of Chewy” in the SEC report is Ryan Cohen, not Steven A. Cohen of Point72."
    src:
      - {s: sec-staff-report-2021-10-14, at: "§3.2 GME Equities Trading, p. 18", quote: "Media attention on GME increased with the January 11 announcement that Mr. Cohen, of Chewy, would join the GameStop board of directors."}
  - id: c7
    rel: involved
    to: citadel-securities
    role: "market maker; executed nearly half, by dollar volume, of the GME trades that wholesalers filled in-house in January 2021"
    note: "SEC staff figures, which shorten the name to Citadel: nearly $4.2 billion of GME internalized on 27 January 2021, against just under $37 million a day in December 2020."
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 3.7, Role of Off-Exchange Market Makers, p. 37", quote: "Citadel Securities accounted for nearly 50% of internalizer dollar volume during the month, rising to as high as 55% of daily internalized dollar volume twice."}
  - id: c8
    rel: involved
    to: gamestop
    role: "heavily shorted before January 2021: SEC staff put short interest around 100% of the public float through most of 2020"
    note: "Short interest can exceed 100% when the same shares are lent more than once. SEC staff also give a January 2021 figure of 122.97% of float, a different measure."
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 3.4, Short Selling and Covering Short Positions, pp. 24–25", quote: "From then until early 2021, GME short interest hovered around 100%, hitting its high of 109.26% on December 31, 2020."}
  - id: c9
    rel: led_to
    to: game-stopped-hearing-2021-02-18
    src:
      - {s: hfsc-2022-06-24-game-stopped-staff-report, at: "Executive Summary, Overview, p. 3", quote: "The House Financial Services Committee (Committee) held a full Committee hearing shortly after the Meme Stock Market Event with key industry players, including the CEOs of Robinhood and Citadel Securities"}
  - id: c10
    rel: led_to
    to: shortening-the-securities-transaction-settlement-cycle
    according_to: [sec]
    note: "The SEC's final rule says it was informed in part by episodes of volatility in 2020 and 2021. The adopting text does not name GameStop; its economic analysis footnote ties the January 2021 clearing-fund demands on brokers to “meme” stocks, and the October 2021 staff report lists a shorter settlement cycle as one method to reduce clearinghouse risk."
    src:
      - {s: sec-2023-02-15-shortening-settlement-cycle-final-rule, at: "Part I, Introduction, p. 8", quote: "Now, in part informed by episodes in 2020 and 2021 of increased market volatility that highlighted potential vulnerabilities in the U.S. securities market, the Commission believes that shortening the settlement cycle from T+2 to T+1 can promote investor protection, reduce risk"}
      - {s: sec-staff-report-2021-10-14, at: "Section 4, Conclusions, pp. 43–44", quote: "One method to mitigate the systemic risk posed by such entities to the clearinghouse and other participants is to shorten the settlement cycle."}
  - id: c11
    rel: involved
    to: robinhood
    src:
      - {s: hfsc-2021-02-18-tenev-testimony, at: "Written statement, opening", quote: "the trading limits we put in place on GameStop and other stocks were necessary to allow us to continue to meet the clearinghouse deposit requirements that we pay to support customer trading on our platform."}
---
