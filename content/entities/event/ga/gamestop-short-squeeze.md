---
uid: 01M54JKTHFQZ5HXD4T334J8G6W
id: gamestop-short-squeeze
type: event
name: "GameStop short squeeze"
in_sentence: "the GameStop short squeeze"
aliases: ["January 2021 GME market events", "GameStop trading frenzy", "meme stock episode"]
summary: "GameStop's share price rose about 2,700% between 8 and 28 January 2021, then fell more than 86% by early February. The episode is widely called a short squeeze."
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
---
