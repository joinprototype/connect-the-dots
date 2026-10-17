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
---
