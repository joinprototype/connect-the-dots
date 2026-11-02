---
uid: 01M6DGJY5XC45P9KKKTKB0M28B
id: triple-a
type: chapter
title: Triple-A
subtitle: How Moody’s and S&P rated the mortgage securities behind the 2008 collapse, and who paid them
summary: Before 2008 two rating firms gave the top grade to tens of thousands of mortgage securities, and the banks that sold them paid the fees. Here is what a House committee, a Senate subcommittee and the Financial Crisis Inquiry Commission found, what the firms acknowledged in two settlements with the Justice Department, and what the firms and their critics said, in their own words.
---

Triple-A is the safest grade a rating firm gives. Before 2008, Moody’s and Standard & Poor’s gave it to tens of thousands of securities built from home loans. Most were later cut, and the Senate report says some failed outright.

“Incompetence” is a popular summary. At the House hearing one member called what he heard “incredible gross incompetence,” and a rival rater answered that it was not; none of the findings quoted here uses the word. This story reports what each body found and what each side said, and where the sources differ it says so. A settlement is not a verdict: where a firm did not admit liability, the story says that too.

```scene
- shot: who-pays
  view: graph
  focus: issuer-pays-model
  time: "1970"
  reveal: [issuer-pays-model, moodys, standard-and-poors]
  reveal_claims: [moodys#c2, standard-and-poors#c2]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "In 1970, the credit rating agencies changed to an “issuer-pays” model and have used it since.", caption: "Senate Permanent Subcommittee on Investigations staff report, 2011, citing the Congressional Research Service"}
  narration: "**Who pays.** Before the 1929 crash, rating firms sold their grades to investors by subscription. After it they fell out of favour, and the business, one expert wrote, “remained stagnant for decades.” In 1970, the Senate report says, the agencies as a group changed course: the party issuing a bond began paying to have it rated. In 2011 the SEC counted 99% of outstanding ratings as coming from agencies that use that model."
  duration: 13

- shot: a-name-in-the-rulebook
  view: graph
  focus: nrsro
  time: "1975"
  reveal: [nrsro, sec, moodys, standard-and-poors]
  reveal_claims: [sec#c2, moodys#c1, standard-and-poors#c1]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "But the watershed event in federal regulation occurred in 1975, when the Securities and Exchange Commission modified its minimum capital requirements for broker-dealers to base them on credit ratings", caption: "The Financial Crisis Inquiry Report, 2011"}
  narration: "**A name in the rulebook.** In 1975 the SEC tied the capital that broker-dealers must hold to ratings from a “nationally recognized statistical rating organization.” At the time that meant three firms: Moody’s, S&P and Fitch. Bank rules had tied capital to ratings since 1931, and later rules did the same for money market funds and pension funds. Not until the Credit Rating Agency Reform Act of 2006 did Congress define the term and give the SEC limited oversight, and it barred the SEC from regulating “the substance of the credit ratings or the procedures and methodologies.”"
  duration: 13

- shot: how-a-pool-gets-its-grade
  view: graph
  focus: mortgage-backed-security
  time: "2006"
  reveal: [mortgage-backed-security, subprime-lending, moodys, standard-and-poors]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "One key task for both the arrangers and the credit rating agencies was to calculate the amount of “subordination” required to ensure that the higher tranches in a pool were protected from loss and could be given AAA or other investment grade ratings.", caption: "Senate staff report, 2011"}
  narration: "**How a pool gets its grade.** A bank, the arranger, sent the agency a pool of loans and a plan: slices from safest to riskiest, with the riskiest taking losses first. The agency ran the pool through its model, and a committee voted the grade for each slice. From 2004 to the first half of 2007, the Senate report says, Moody’s and S&P gave AAA to a majority of the mortgage securities and CDOs issued in the U.S., sometimes to as much as 95% of one deal. Many of the loans underneath were high-risk."
  duration: 13

- shot: the-fee
  view: graph
  focus: moodys
  time: "2006"
  reveal: [moodys, standard-and-poors, mortgage-backed-security]
  overlay: {kind: stat, value: "$208,000", label: "Moody’s estimated fee for rating one Citigroup mortgage deal, 2006 (S&P received $135,000)", source: fcic-2011-final-report, quote: "For its efforts, Moody’s was paid an estimated $208,000."}
  narration: "**The fee.** The commission followed one 2006 deal put together by Citigroup from New Century loans. Moody’s was paid an estimated $208,000 to rate it, and S&P $135,000. Less than a year later, three of its slices were downgraded. Across the business, the Senate report counts Moody’s yearly revenue from rating these securities rising from over $61 million in 2002 to over $260 million in 2006."
  duration: 13

- shot: a-race
  view: graph
  focus: issuer-pays-model
  time: "2007-09"
  reveal: [issuer-pays-model, moodys, standard-and-poors, raymond-mcdaniel]
  reveal_claims: [raymond-mcdaniel#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "What happened in 2004 and 2005 with respect to subordinated tranches is that our competition, Fitch and S&P, went nuts. Everything was investment grade. It didn’t really matter. We tried to alert the market. We said we’re not rating it.", caption: "Raymond McDaniel, Moody’s chief executive, to Moody’s managers, September 2007, as read out at the House hearing"}
  narration: "**A race.** An issuer could take a deal to whichever agency gave the best grade, and the agencies were paid only for the deals they rated; the Senate report calls the result “a race to the bottom.” Moody’s chief executive told his managers that rivals had gone nuts and that Moody’s “tried to alert the market.” Asked at the House what he meant, he said Moody’s raised the protection each deal needed, so it “might not be rating those instruments”; Representative John Yarmuth answered that “That’s not the same as your interpretation of it now.” Gary Witt, a former Moody’s managing director, told the commission that when banks threatened to go to a rival, “that’s routine.”"
  duration: 13

- shot: structured-by-cows
  view: graph
  focus: standard-and-poors
  time: "2007-04"
  reveal: [standard-and-poors, deven-sharma, house-oversight-committee]
  reveal_claims: [deven-sharma#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "it could be structured by cows, and we would rate it.", caption: "An S&P employee’s message, April 2007, as read out by Chairman Waxman at the House hearing, 22 October 2008"}
  narration: "**Structured by cows.** The Senate staff report quotes an S&P analyst’s instant message of April 2007: “we rate every deal,” and it “could be structured by cows and we would rate it.”"
  duration: 13

- shot: the-house-exchange
  view: graph
  focus: standard-and-poors
  time: "2007-04"
  reveal: [standard-and-poors, deven-sharma, house-oversight-committee]
  reveal_claims: [deven-sharma#c1]
  narration: "**The House exchange.** The House read the whole exchange, in which one official said the “model definitely does not capture half the risk” and “We should not be rating it,” and the SEC told the committee that S&P did rate the deal. S&P’s president replied that the full context would show the analysts were discussing the bankers’ models, and that S&P asks “that more risks be considered than the models that were originally proposed by the bankers.” He added that SEC staff “did not find any misconduct”; Waxman answered that “it’s hard to find any misconduct if there is no standard for misconduct,” and the Senate report says the same SEC examination “raised a number of conflict of interest issues that influenced the ratings process.”"
  duration: 13

- shot: two-answers
  view: graph
  focus: moodys
  time: "2007-09"
  reveal: [moodys, house-oversight-committee, henry-waxman]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "Combined these errors make us look either incompetent at credit analysis or like we sold our soul to the devil for revenue or a little bit of both.", caption: "A Moody’s manager the day after a September 2007 town hall, as read out by Chairman Waxman, 22 October 2008"}
  narration: "**Two answers.** After a September 2007 town hall, a Moody’s manager wrote that staff had heard two answers: “people lied,” and “an unprecedented sequence of events in the mortgage markets.” He wrote that the first meant “we had blinders on and never questioned the information we were given,” and the second that “it is our job to think of the worst-case scenarios and model them.” McDaniel told the House the manager “was referring to what the perception could be,” and that by “people lied” he himself meant media reports on the information flowing through mortgage origination, not anyone at Moody’s. This is one manager’s reading of how it looked, read into the record by a committee chairman; what the inquiries found follows."
  duration: 13

- shot: what-became-of-them
  view: graph
  focus: july-2007-mass-downgrades
  time: "2007-07-10"
  reveal: [july-2007-mass-downgrades, moodys, standard-and-poors, financial-crisis-of-2008]
  reveal_claims: [july-2007-mass-downgrades#c1, july-2007-mass-downgrades#c2, july-2007-mass-downgrades#c3]
  overlay: {kind: stat, value: "83%", label: "Of the mortgage securities Moody’s rated triple-A in 2006, later downgraded, by the Financial Crisis Inquiry Commission’s count", source: fcic-2011-final-report, quote: "The results were disastrous: 83% of the mortgage securities rated triple-A that year ultimately were downgraded."}
  narration: "**What became of them.** On 10 July 2007 Moody’s downgraded 399 subprime securities and S&P put 612 classes on watch, the start of what the Senate report calls the first mass downgrades in U.S. history. The commission counts that Moody’s downgraded 83% of the triple-A mortgage securities it rated in 2006, and that 73% of all of them were cut to junk. Analysts cited by the Senate report found over 90% of triple-A subprime securities from 2006 and 2007 cut to junk by 2010; the counts cover different sets. A downgrade is not a default, and the report says “some failed outright.”"
  duration: 13

- shot: washington-october-2008
  view: map
  camera: {center: [-77.0369, 38.9072], zoom: 11.6, pitch: 30, duration: 6}
  places: [washington-dc]
  time: "2008-10-22"
  reveal: [credit-rating-agencies-hearing-2008-10-22, house-oversight-committee, henry-waxman, jerome-fons, washington-dc]
  reveal_claims: [henry-waxman#c1, jerome-fons#c1]
  overlay: {kind: stat, value: "$3 billion to $6 billion", label: "Combined yearly revenue of Moody’s, S&P and Fitch, 2002 to 2007, as Chairman Waxman put it", source: house-oversight-2008-10-22-hearing, quote: "That chart will show the total revenues for the three firms, double from $3 billion in 2002 to over $6 billion in 2007."}
  narration: "**Washington, October 2008.** Five weeks after Lehman Brothers failed, the House Oversight Committee, chaired by Henry Waxman, swore in the heads of Fitch, Moody’s and S&P. It also heard two former executives, Jerome Fons of Moody’s and Frank Raiter of S&P, and Sean Egan of the rating firm Egan-Jones. Waxman said the three firms would testify that “virtually no one anticipated what is occurring,” but that “the documents that the committee obtained tell a different story.” One member called what he heard “incredible gross incompetence”; Egan answered that “it is not, by the way, incompetence.”"
  duration: 13

- shot: moodys-in-public
  view: graph
  focus: raymond-mcdaniel
  time: "2008-10-22"
  reveal: [raymond-mcdaniel, moodys, credit-rating-agencies-hearing-2008-10-22]
  reveal_claims: [raymond-mcdaniel#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "On the one hand, we need to win the business and maintain market share or we cease to be relevant. On the other hand, our reputation depends on maintaining ratings quality.", caption: "Words the House read as McDaniel’s to his board, October 2007; Moody’s statement of facts gives them to one managing director"}
  narration: "**Moody’s, in public.** McDaniel told the House that Moody’s “did not, however, anticipate the magnitude and speed of deterioration in mortgage quality.” Representative Carolyn Maloney then read him the words shown here from a confidential paper for his board. He answered that it was “not inconsistent” with what he told the board, that maintaining standards “creates a conflict potentially with maintaining market share” which must be “identified, managed properly and controlled.” In the statement of facts Moody’s later acknowledged, the same words are credited to one managing director, writing in October 2007 about rating corporate bonds."
  duration: 13

- shot: sp-in-public
  view: graph
  focus: deven-sharma
  time: "2008-10-22"
  reveal: [deven-sharma, standard-and-poors, credit-rating-agencies-hearing-2008-10-22]
  reveal_claims: [deven-sharma#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "While we performed analysis in good faith, events have shown that the historical data we used in our analysis significantly underestimated the severity of what subsequently occurred.", caption: "Deven Sharma, S&P president, to the House Oversight Committee, 22 October 2008"}
  narration: "**S&P, in public.** Sharma told the House that S&P’s ratings “express our opinion,” that its stress tests drew on data going back 75 years, and that 1.7% of the U.S. structured securities it rated from 2005 to the third quarter of 2007 had defaulted and about a third had been downgraded. Waxman’s opening put it differently: S&P “has downgraded more than two-thirds of its investment-grade ratings.” The two measure different things. As evidence of independence, Sharma cited upgrades outpacing downgrades about 7 to 1 on its U.S. mortgage ratings from 1994 to 2006, and said the issuer-pays model “promotes transparency.”"
  duration: 13

- shot: the-senate-report
  view: map
  camera: {center: [-77.0369, 38.9072], zoom: 13.4, pitch: 45, duration: 6}
  places: [washington-dc]
  time: "2010-04-23"
  reveal: [senate-hearing-credit-rating-agencies-2010-04-23, levin-coburn-report, senate-permanent-subcommittee-on-investigations, carl-levin, tom-coburn, washington-dc]
  reveal_claims: [carl-levin#c1, tom-coburn#c1]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "Inaccurate AAA credit ratings introduced risk into the U.S. financial system and constituted a key cause of the financial crisis.", caption: "Senate Permanent Subcommittee on Investigations staff report, 13 April 2011"}
  narration: "**The Senate report.** The Permanent Subcommittee on Investigations, chaired by Carl Levin with Tom Coburn as ranking minority member, subpoenaed hundreds of thousands of documents from Moody’s and S&P. Levin told its April 2010 hearing the conflict was like “one of the parties in court paying the judge’s salary,” and the 2011 staff report calls it “one significant cause” of the inaccurate ratings, with models short of data, no re-testing of old ratings and thin staffing. It adds two causes outside the firms: rules that required investment-grade holdings, and SEC rules that left “only three NRSROs, thereby limiting competition.” Its findings say that by 2006 the firms “knew their ratings of RMBS and CDOs were inaccurate,” and “knew of increased credit risks due to mortgage fraud, lax underwriting standards, and unsustainable housing price appreciation, but failed adequately to incorporate those factors.”"
  duration: 13

- shot: new-york-june-2010
  view: map
  camera: {center: [-74.006, 40.7128], zoom: 11.4, pitch: 30, duration: 6}
  places: [new-york-city]
  time: "2010-06-02"
  reveal: [fcic-hearing-on-credit-ratings-2010-06-02, berkshire-hathaway, moodys, new-york-city]
  reveal_claims: [berkshire-hathaway#c1, berkshire-hathaway#c2]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "After share repurchases by Moody’s Corporation, Berkshire Hathaway’s holdings of outstanding shares increased to over 20% by 2008.", caption: "The Financial Crisis Inquiry Report, 2011"}
  narration: "**New York, June 2010.** At the New School, the commission heard Warren Buffett, whose Berkshire Hathaway held 15% of Moody’s when it went public in 2000 and over 20% by 2008. He told the commission he knew nothing of the firm’s management: “I’d never been at Moody’s, I don’t know where they are located.” He said he invested because the business was “a natural duopoly” with “incredible” pricing power."
  duration: 13

- shot: both-sides-of-the-table
  view: graph
  focus: warren-buffett
  time: "2010-06-02"
  reveal: [warren-buffett, berkshire-hathaway, moodys, fcic-hearing-on-credit-ratings-2010-06-02]
  reveal_claims: [warren-buffett#c3]
  overlay: {kind: quote, source: fcic-2010-06-02-hearing-transcript, quote: "It makes for a wonderful economic model for the business but, as a practical matter, I have no negotiating power.", caption: "Warren Buffett to the Financial Crisis Inquiry Commission, 2 June 2010"}
  narration: "**Both sides of the table.** Buffett said “as Chairman of Berkshire, I hate issuer pay,” and his complaint was price: Berkshire needs ratings from both firms, and “essentially there is no ‘down the street.’” He warned that a change to user pay “gets very tricky.” Asked whether the agencies should have called the housing bubble, he said “they made the wrong call,” a “mistake that virtually everybody in the country made.” Chairman Phil Angelides answered that “there were a number of people who saw this bubble.”"
  duration: 13

- shot: only-an-opinion
  view: graph
  focus: levin-coburn-report
  time: "2010"
  reveal: [levin-coburn-report, standard-and-poors, moodys, jerome-fons]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "The CRAs have successfully won dismissal of investor lawsuits, claiming that they are in the financial publishing business and their opinions are protected under the First Amendment.", caption: "Senate staff report, 2011"}
  narration: "**Only an opinion.** The agencies call a grade an opinion. S&P’s disclaimer says its ratings are “solely statements of opinion and not statements of fact or recommendations to purchase, hold, or sell any securities.” Jerome Fons, formerly of Moody’s, told the House that Moody’s would not withdraw a rating when a client fired it, because “we could still offer our opinion and express our first amendment right.” The settlements below concern what the firms said about their independence and methods, not whether a grade was right."
  duration: 13

- shot: what-the-law-changed
  view: graph
  focus: dodd-frank-act
  time: "2010-07-21"
  reveal: [dodd-frank-act, sec, nrsro]
  reveal_claims: [sec#c2]
  overlay: {kind: quote, source: public-law-111-203-dodd-frank, quote: "it shall be sufficient, for purposes of pleading any required state of mind in relation to such action, that the complaint state with particularity facts giving rise to a strong inference that the credit rating agency knowingly or recklessly failed", caption: "Dodd-Frank Act, section 933"}
  narration: "**What the law changed.** Dodd-Frank, signed in July 2010, told the SEC to examine each rating organization at least once a year, made a rating agency’s statements subject to the same enforcement as an accounting firm’s, and lowered the bar for suing: investors need only plead facts that strongly suggest the agency “knowingly or recklessly” failed to investigate or verify what its method relied on. Section 939 struck references to ratings from federal statutes, and 939A told agencies to remove them from their rules. For structured finance it also ordered a study of the issuer-pays and subscriber-pays models and told the SEC to “establish a system” so the issuer cannot pick the agency, as it determined necessary. This story does not follow what the SEC did with that order."
  duration: 13

- shot: why-they-did-it
  view: graph
  focus: fcic
  time: "2011-01"
  reveal: [fcic, keith-hennessey, douglas-holtz-eakin, bill-thomas, peter-wallison, financial-crisis-inquiry-report]
  reveal_claims: [keith-hennessey#c1, douglas-holtz-eakin#c1, bill-thomas#c1, peter-wallison#c1]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "While bad information created by credit rating agencies was an essential cause of the crisis, it is less clear why they did this.", caption: "Keith Hennessey, Douglas Holtz-Eakin and Bill Thomas, dissenting, 2011"}
  narration: "**Why they did it.** The commission’s majority concluded that “the rating agencies placed market share and profit considerations above the quality and integrity of their ratings.” Three of the four dissenters call the ratings “an essential cause” but say it is less clear why, and list bad models, an industry model that pushed ratings up to win business, and “a lack of market competition due to their government-induced oligopoly.” The fourth, Peter Wallison, wrote that the majority’s criticism of analysts and others “for failure to perceive the losses that lay ahead, is sheer hindsight.” The Senate report also names limited competition among its causes."
  duration: 13

- shot: what-sp-acknowledged
  view: graph
  focus: standard-and-poors
  time: "2007-02"
  reveal: [standard-and-poors, mortgage-backed-security, july-2007-mass-downgrades]
  overlay: {kind: stat, value: "11 deals", label: "Put on watch by S&P in February 2007, against the roughly 30 its surveillance staff recommended, per the agreed statement of facts", source: doj-2015-02-03-sp-statement-of-facts, quote: "a committee that included members of S&P’s RMBS New Issue group was convened on February 12 2007, and that committee decided to place only 18 RMBS tranches from 11 RMBS transactions on CreditWatch negative."}
  narration: "**What S&P acknowledged.** In a statement of facts agreed with the Justice Department, S&P acknowledged that in November 2006 its surveillance head circulated a spreadsheet showing that more than half of the subprime mortgage deals it rated in 2006 had severely delinquent loans equal to 25% or more of the credit protection for the lowest-rated class. In February 2007 her group recommended watching the subordinate slices of about 30 deals; a committee that included the group that rated new deals chose 18 slices in 11 deals. She wrote that she was “fine with where we are,” though colleagues said she regularly complained of being prevented from downgrading. S&P also acknowledged that the head of its CDO group had called a model test “in part based upon business decisions, considerations,” and that until 10 July 2007 it kept issuing and confirming ratings for CDOs backed substantially by subprime mortgage securities."
  duration: 13

- shot: sp-settles
  view: graph
  focus: sp-settlement-2015
  time: "2015-02-03"
  reveal: [sp-settlement-2015, standard-and-poors, us-department-of-justice]
  reveal_claims: [standard-and-poors#c3, standard-and-poors#c4]
  overlay: {kind: stat, value: "$1.375 billion", label: "S&P’s payment to the Justice Department and 19 states and D.C., 3 February 2015", source: doj-2015-02-03-sp-settlement, quote: "Half of the $1.375 billion payment – or $687.5 million – constitutes a penalty to be paid to the federal government and is the largest penalty of its type ever paid by a ratings agency."}
  narration: "**S&P settles.** On 3 February 2015 S&P and its parent, McGraw Hill Financial, settled the Justice Department’s 2013 suit and the suits of 19 states and the District of Columbia, which alleged that S&P misrepresented its ratings as objective and independent. S&P had said the suit was payback for its 2011 downgrade of the United States; in the settlement it acknowledged the evidence “does not support” that, and withdrew it. The Justice Department says S&P admitted facts showing it let business concerns bias its ratings. S&P’s release says the settlement contains “no findings of violations of law,” and that all sides settled “to avoid the delay, uncertainty, inconvenience, and expense of further litigation.”"
  duration: 13

- shot: moodys-settles
  view: graph
  focus: moodys-settlement-2017
  time: "2017-01-13"
  reveal: [moodys-settlement-2017, moodys, us-department-of-justice]
  reveal_claims: [moodys#c3]
  overlay: {kind: stat, value: "$863,791,823", label: "Moody’s payment to the Justice Department and 21 states and D.C., 13 January 2017", source: doj-2017-01-13-moodys-settlement-agreement, quote: "Moody’s shall pay a total amount of $863,791,823.00 to resolve pending and potential legal claims as set forth herein"}
  narration: "**Moody’s settles.** The January 2017 agreement, with 21 states and the District of Columbia, resolved three pending state suits and “potential claims” of the Justice Department, with $437.5 million of the total a federal civil penalty."
  duration: 13
```


- shot: the-statement-of-facts
  view: graph
  focus: moodys-settlement-2017
  time: "2017-01-13"
  reveal: [moodys-settlement-2017, moodys, us-department-of-justice]
  reveal_claims: [moodys#c3]
  narration: "**The statement of facts.** In a statement of facts Moody’s acknowledged that from April 2004 it rated many Aaa CDO tranches to “the more lenient geomean target” instead of its published standard, while its own minutes called the Aaa target “extraordinarily conservative” and “a serious business issue for synthetics.” “Many arrangers and issuers were aware,” the statement says, but Moody’s did not tell the market; in 2010 it made its model “approximately half a notch more conservative at the Aaa level.” Moody’s said it “stands behind the integrity of its ratings, methodologies and processes, and the settlement contains no finding of any violation of law, nor any admission of liability”; the agreement was made “without any trial or final adjudication on the merits.”"
  duration: 13
```
