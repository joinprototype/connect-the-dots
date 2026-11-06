---
uid: 01M54JKTHF7XYW8BWBD51BTQVK
id: robinhood-trading-restrictions-2021
type: event
name: "Robinhood trading restrictions of 2021"
in_sentence: "the Robinhood trading restrictions of 2021"
aliases: ["Early 2021 Trading Restrictions"]
summary: "Robinhood's temporary limits on customer purchases of GameStop and other volatile stocks, 28 January to 5 February 2021."
when: "2021-01-28/2021-02-05"
claims:
  - id: c1
    rel: caused_by
    to: nscc-margin-calls-january-2021
    according_to: [robinhood]
    note: "SEC staff add that NSCC's rules do not let it tell member firms to stop trading individual stocks: the restrictions were the brokers' own decision."
    src:
      - {s: robinhood-s1-2021-07-01, at: "Business, Legal Proceedings, Early 2021 Trading Restrictions Matters", quote: "Beginning on January 28, 2021, due to increased deposit requirements imposed on RHS by the NSCC in response to unprecedented market volatility, particularly in certain securities, RHS temporarily restricted or limited its customers’ purchase of certain securities"}
      - {s: robinhood-2021-01-29-what-happened-this-week, at: "Post of 29 January 2021", quote: "this week alone, our clearinghouse-mandated deposit requirements related to equities increased ten-fold. And that’s what led us to put temporary buying restrictions in place on a small number of securities that the clearinghouses had raised their deposit requirements on"}
      - {s: hfsc-2021-02-18-tenev-testimony, at: "Section I, Introduction", quote: "the trading limits we put in place on GameStop and other stocks were necessary to allow us to continue to meet the clearinghouse deposit requirements that we pay to support customer trading on our platform."}
      - {s: sec-staff-report-2021-10-14, at: "Section 3.6, Broker-Dealer Reactions and Trading Restrictions, p. 33, footnote 93", quote: "Instead, some of the impacted broker-dealers maintained that the trading restrictions were a reaction to margin calls and capital charges imposed by NSCC in response to the extraordinary volatility in GME and other stocks."}
  - id: c2
    rel: involved
    to: gamestop
    role: "restricted security"
    src:
      - {s: robinhood-s1-2021-07-01, at: "Business, Legal Proceedings, Early 2021 Trading Restrictions Matters", quote: "RHS temporarily restricted or limited its customers’ purchase of certain securities, including GameStop Corp. and AMC Entertainment Holdings, Inc., on our platform (the “Early 2021 Trading Restrictions”)."}
  - id: c3
    rel: involved
    to: robinhood
    role: "imposed the restrictions"
    note: "Restrictions ran from 28 January to 5 February 2021, through Robinhood Securities, its clearing broker."
    src:
      - {s: robinhood-2021-01-28-keeping-customers-informed, at: "Post of 28 January 2021", quote: "In light of recent volatility, we restricted transactions for certain securities to position closing only."}
      - {s: robinhood-s1-2021-07-01, at: "Business, Regulation, Net Capital and Deposit Requirements", quote: "As a result, RHS temporarily limited customer purchases for certain volatile securities from January 28 to February 5, 2021 in order to comply with its deposit requirements."}
  - id: c4
    rel: part_of
    to: gamestop-short-squeeze
    when: "2021-01-28/2021-02-05"
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 1, Introduction, p. 2", quote: "Then, as the end of January approached, several retail broker-dealers temporarily prohibited certain activity in some of these stocks and options."}
      - {s: sec-staff-report-2021-10-14, at: "Section 3.6, footnote 88, p. 32", quote: "For example, Robinhood and Interactive Brokers stated that in some cases, investors would only be able to sell their position in certain securities and not open a new position."}
  - id: c5
    rel: involved
    to: ken-griffin
    role: "testified that Citadel Securities had no role in Robinhood's decision and that Citadel did not ask Robinhood to restrict buying"
    note: "Griffin's own account. In the hearing he was asked whether anyone in his organization had talked to Robinhood about restricting buying of GameStop."
    src:
      - {s: hfsc-2021-02-18-griffin-testimony, at: "Introduction", quote: "I want to be perfectly clear: we had no role in Robinhood’s decision to limit trading in GameStop or any other of the “meme” stocks. I first learned of Robinhood’s trading restrictions only after they were publicly announced.", by: ken-griffin}
      - {s: hfsc-hearing-117-3-transcript, at: "Kenneth C. Griffin, answering Mr. Vargas", quote: "Let me be perfectly clear: Absolutely not.", by: ken-griffin}
  - id: c6
    rel: involved
    to: vlad-tenev
    role: "testified that no one pressured Robinhood to restrict buying"
    note: "Tenev's own account. Asked by Rep. McHenry whether the decision was based on pressure from anyone on the witness panel."
    src:
      - {s: hfsc-hearing-117-3-transcript, at: "Vladimir Tenev, answering Mr. McHenry", quote: "Not at all. Zero pressure from anyone. It was a collateral depository requirement decision made by our Robinhood Securities president, and we stand by it.", by: vlad-tenev}
      - {s: hfsc-2021-02-18-tenev-testimony, at: "Section VIII, GameStop and Market Volatility, p. 9, footnote 20", quote: "Robinhood Securities did not impose these trading restrictions at the request of hedge funds or to try and move prices in GameStop one way or the other.", by: vlad-tenev}
  - id: c7
    rel: involved
    to: nscc
    role: "clearing agency; SEC staff say its rules do not let it tell firms to stop trading a stock"
    note: "SEC staff add that some broker-dealers restricted trading in reaction to NSCC's margin calls and capital charges, and that this was their decision, not NSCC's."
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 3.5, Clearing Agency Margin and Capital Issues, p. 32", quote: "NSCC, like most similar central counterparties, does not instruct its member firms to stop trading or clearing individual symbols because its rules do not give it that ability."}
  - id: c8
    rel: involved
    to: citadel-securities
    role: "market maker that received Robinhood's customer orders; the subject of the narrative that hedge funds and their partners pressed brokers to restrict"
    note: "SEC staff describe that narrative, and record that witnesses testified the restrictions did not result from such pressure."
    src:
      - {s: sec-staff-report-2021-10-14, at: "Section 3.6, Broker-Dealer Reactions and Trading Restrictions, pp. 32–33", quote: "This narrative was the subject of testimony at a Congressional hearing, where witnesses testified that the trading restrictions did not result from such pressure."}
  - id: c9
    rel: involved
    to: robinhood
    role: "broker whose internal liquidity warning differed from its chief executive’s public description"
    according_to: [house-financial-services-committee]
    note: "The House majority staff reported that clearing president Jim Swartwout texted COO Gretchen Howard at 6:29 a.m. Eastern on 28 January about a huge liquidity issue. Tenev told CNBC that evening that there was no liquidity problem, and told Congress in February that the company had always been comfortable with its liquidity. Swartwout later explained that his message concerned the ability to meet the DTCC collateral requirement. NSCC waived the excess capital premium that morning, before the CNBC interview; Howard said Robinhood was comfortable with its liquidity after the waiver. Staff found earlier liquidity concerns and inadequate preparation, and said the waiver gave the leadership breathing room."
    src:
      - {s: hfsc-2022-06-24-game-stopped-staff-report, at: "Section III.1.l, p. 54", quote: "Huge liquidity issue."}
      - {s: hfsc-2022-06-24-game-stopped-staff-report, at: "Section III.1.o, p. 66", quote: "there’s no liquidity problem.", by: vlad-tenev}
      - {s: hfsc-2022-06-24-game-stopped-staff-report, at: "Section III.1.o, p. 66", quote: "we were always comfortable with our liquidity.", by: vlad-tenev}
  - id: c10
    rel: involved
    to: nscc
    role: "clearinghouse that waived the excess capital premium charge after Robinhood decided to restrict purchases"
    note: "Tenev’s written testimony places the restriction decision between 6:30 and 7:30 a.m. Eastern and the complete waiver of that day’s excess capital premium shortly after 9 a.m. on 28 January. His oral testimony named Robinhood Securities’ president as the decision maker; the House majority report identifies him as Jim Swartwout."
    src:
      - {s: hfsc-2021-02-18-tenev-testimony, at: "Section VIII, p. 9", quote: "Between 6:30 and 7:30 am EST, the Robinhood Securities operations team made the decision to impose trading restrictions on GameStop and other securities.", by: vlad-tenev}
      - {s: hfsc-2021-02-18-tenev-testimony, at: "Section VIII, p. 9", quote: "Then, shortly after 9:00 am EST, NSCC informed Robinhood Securities that the excess capital premium charge had been waived entirely for that day", by: vlad-tenev}
      - {s: hfsc-hearing-117-3-transcript, at: "Vladimir Tenev, answering Representative McHenry", quote: "It was a collateral depository requirement decision made by our Robinhood Securities president, and we stand by it.", by: vlad-tenev}
      - {s: hfsc-2022-06-24-game-stopped-staff-report, at: "Section III.1.e, p. 22", quote: "Jim Swartwout, President and Chief Operating Officer for Robinhood’s clearing operation"}
---
