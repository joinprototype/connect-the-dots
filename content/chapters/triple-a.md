---
uid: 01M6DGJY5XC45P9KKKTKB0M28B
id: triple-a
type: chapter
title: Triple-A
subtitle: How Moody’s and S&P rated the mortgage securities behind the 2008 collapse, and who paid them
summary: Before 2008 two rating firms gave the top grade to tens of thousands of mortgage securities, and the banks that sold them paid the fees. Here is what a House committee, a Senate subcommittee and the Financial Crisis Inquiry Commission found, what the firms acknowledged in two settlements with the Justice Department, and what the firms and their critics said, in their own words.
---

Triple-A is the safest grade a rating firm gives. Before 2008, Moody’s and Standard & Poor’s gave it to tens of thousands of securities built from home loans. Most were later cut, and the Senate report says some failed outright.

Inside the firms, employees had warned about the risks and the pressure to keep customers. At a House hearing in October 2008, executives had to answer for both the grades and those warnings. Years later, both firms paid to settle government claims while disputing what those settlements established.

```scene
- shot: who-pays
  view: graph
  focus: issuer-pays-model
  time: "1970"
  reveal: [issuer-pays-model, moodys, standard-and-poors]
  reveal_claims: [moodys#c2, standard-and-poors#c2]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "there was not enough analytical talent following the fixed income markets", caption: "Fitch chief Stephen Joynt explaining his view of why issuers began paying, House hearing, 22 October 2008"}
  narration: "**Who pays.** Facing the House in October 2008, Fitch chief Stephen Joynt gave his personal view of why issuers began paying: after Penn Central, the bond market needed more analysts, and issuer fees could support the people and money needed. Frank Partnoy writes, as quoted by the Senate report, that investors lost interest in buying ratings after the agencies missed the collapse in bond values beginning in 1929; the business stagnated for decades. The Senate report dates the switch to issuer payment to 1970. The seller now paid the person judging its bonds; by the SEC’s 2011 count, agencies using that model accounted for 99% of outstanding ratings."
  duration: 13

- shot: a-name-in-the-rulebook
  view: graph
  focus: nrsro
  time: "1975"
  reveal: [nrsro, sec, moodys, standard-and-poors]
  reveal_claims: [sec#c2, moodys#c1, standard-and-poors#c1]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "But the watershed event in federal regulation occurred in 1975, when the Securities and Exchange Commission modified its minimum capital requirements for broker-dealers to base them on credit ratings", caption: "The Financial Crisis Inquiry Report, 2011"}
  narration: "**A name in the rulebook.** In 1975, SEC regulators chose to tie broker-dealers’ required capital to grades from a “nationally recognized statistical rating organization.” That meant Moody’s, S&P and Fitch. Bank regulation had used ratings since 1931; money market and pension fund rules also made grades determine what investors could hold. Former Moody’s managing director Eric Kolchinsky later called this authority a “blank check.” Congress defined the term and gave the SEC limited oversight in 2006, but barred it from regulating “the substance of the credit ratings or the procedures and methodologies.” Officials had made private judgments part of public rules while leaving the firms to choose how to reach them."
  duration: 13

- shot: how-a-pool-gets-its-grade
  view: graph
  focus: mortgage-backed-security
  time: "2006"
  reveal: [mortgage-backed-security, subprime-lending, moodys, standard-and-poors]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "One key task for both the arrangers and the credit rating agencies was to calculate the amount of “subordination” required to ensure that the higher tranches in a pool were protected from loss and could be given AAA or other investment grade ratings.", caption: "Senate staff report, 2011"}
  narration: "**How a pool gets its grade.** In 2006, Moody’s lead analyst on Citigroup’s CMLTI 2006-NC2 deal compared its New Century loans with an earlier Citigroup pool. The analyst recommended the same loss protection because the pools were similar, the commission reports. Moody’s model simulated losses to determine how large the junior slices needed to be: those slices would absorb losses before the senior ones. The deal was then adjusted for riskier loans, including interest-only mortgages. From 2004 through the first half of 2007, Moody’s and S&P gave AAA to a majority of U.S. mortgage securities and CDOs, sometimes as much as 95% of a deal, the Senate report found. Those grades opened the pools to buyers barred from holding low-rated securities."
  duration: 13

- shot: the-fee
  view: graph
  focus: moodys
  time: "2006"
  reveal: [moodys, standard-and-poors, mortgage-backed-security]
  overlay: {kind: stat, value: "$208,000", label: "Moody’s estimated fee for rating one Citigroup mortgage deal, 2006 (S&P received $135,000)", source: fcic-2011-final-report, quote: "For its efforts, Moody’s was paid an estimated $208,000."}
  narration: "**The fee.** For rating CMLTI 2006-NC2, Moody’s collected an estimated $208,000 and S&P $135,000, the commission found. Citigroup paid the firms judging the securities it was selling. Across these securities, Moody’s yearly rating revenue rose from over $61 million in 2002 to over $260 million in 2006, the Senate report counts. Less than a year after the Citigroup deal’s issuance, three slices were downgraded: the fees had been paid, but the grades did not last."
  duration: 13

- shot: a-race
  view: graph
  focus: issuer-pays-model
  time: "2007-09"
  reveal: [issuer-pays-model, moodys, standard-and-poors, raymond-mcdaniel]
  reveal_claims: [raymond-mcdaniel#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "What happened in 2004 and 2005 with respect to subordinated tranches is that our competition, Fitch and S&P, went nuts. Everything was investment grade. It didn’t really matter. We tried to alert the market. We said we’re not rating it.", caption: "Raymond McDaniel, Moody’s chief executive, to Moody’s managers, September 2007, as read out at the House hearing"}
  narration: "**A race.** At a September 2007 meeting, Raymond McDaniel told Moody’s managers that Fitch and S&P “went nuts” in 2004–05, making everything investment grade; he said Moody’s had refused business and tried to alert the market. Before the House, he explained that Moody’s demanded more protection, so might not rate a deal. John Yarmuth challenged that explanation. Former managing director Gary Witt described banks’ threats to take their business elsewhere: “that’s routine.” An issuer could shop for a better grade, and agencies collected only on deals they rated. The Senate report called it a “race to the bottom”: refusing a grade could mean losing the fee to a rival."
  duration: 13

- shot: structured-by-cows
  view: graph
  focus: standard-and-poors
  time: "2007-04"
  reveal: [standard-and-poors, deven-sharma, house-oversight-committee]
  reveal_claims: [deven-sharma#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "it could be structured by cows, and we would rate it.", caption: "An S&P employee’s message, April 2007, as read out by Chairman Waxman at the House hearing, 22 October 2008"}
  narration: "**Structured by cows.** In April 2007, an S&P official wrote in an instant-message exchange about a deal: “By the way, that deal is ridiculous.” The colleague answered that the model missed half the risk. The first official said: “We should not be rating it.” The reply was “We rate every deal.” The colleague added that cows could have structured it and the firm would still rate it. John Yarmuth read the exchange as a business willing to rate the deal despite its employees’ warnings. According to the SEC’s answer to the House committee, S&P went on to rate the deal."
  duration: 13

- shot: the-house-exchange
  view: graph
  focus: standard-and-poors
  time: "2007-04"
  reveal: [standard-and-poors, deven-sharma, house-oversight-committee]
  reveal_claims: [deven-sharma#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "this is exactly what we want our analysts to do is to challenge and raise questions when they don't feel comfortable.", caption: "Deven Sharma defending the analysts’ exchange, House hearing, 22 October 2008"}
  narration: "**The House exchange.** Confronted with those messages in October 2008, S&P president Deven Sharma defended the analysts: they were challenging the bankers’ models, asking for more risks to be included before rating. He also said SEC examiners “did not find any misconduct”. Henry Waxman answered that “it's hard to find any misconduct if there is no standard for misconduct.” The Senate report later described that examination as raising conflicts of interest that influenced ratings. Sharma presented the exchange as analysts doing their job; Waxman pressed the question of who could hold them to it. The committee kept the record open for S&P to supply more facts."
  duration: 13

- shot: two-answers
  view: graph
  focus: moodys
  time: "2007-09"
  reveal: [moodys, house-oversight-committee, henry-waxman]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "Combined these errors make us look either incompetent at credit analysis or like we sold our soul to the devil for revenue or a little bit of both.", caption: "A Moody’s manager the day after a September 2007 town hall, as read out by Chairman Waxman, 22 October 2008"}
  narration: "**Two answers.** After McDaniel’s September 2007 town hall, a Moody’s manager answered his request for feedback. Staff had heard “people lied” and “an unprecedented sequence of events in the mortgage markets.” In the feedback Waxman read aloud, the manager said staff seemed never to have questioned the information and should have modelled the worst case. The manager asked why a borrower would accept a floating-rate loan they could not repay, or a responsible lender offer it. McDaniel told the House the manager meant how events could look. His own reference to lies meant media reports about mortgage origination, he said, not Moody’s employees. A private response to the chief executive had become a question he had to answer under oath."
  duration: 13

- shot: what-became-of-them
  view: graph
  focus: july-2007-mass-downgrades
  time: "2007-07-10"
  reveal: [july-2007-mass-downgrades, moodys, standard-and-poors, financial-crisis-of-2008]
  reveal_claims: [july-2007-mass-downgrades#c1, july-2007-mass-downgrades#c2, july-2007-mass-downgrades#c3]
  overlay: {kind: stat, value: "83%", label: "Of the mortgage securities Moody’s rated triple-A in 2006, later downgraded, by the Financial Crisis Inquiry Commission’s count", source: fcic-2011-final-report, quote: "The results were disastrous: 83% of the mortgage securities rated triple-A that year ultimately were downgraded."}
  narration: "**What became of them.** By February 2007, S&P’s surveillance head was reporting a senior analyst’s warning that mortgage ratings would not hold through the year. On 10 July, S&P put 612 classes on watch and Moody’s downgraded 399 subprime securities, beginning what the Senate report calls the first mass downgrades in U.S. history. The commission counted 83% of Moody’s 2006 triple-A mortgage securities eventually downgraded, 73% to junk. For the broader 2006–07 subprime set, analysts cited by the Senate found over 90% cut from triple-A to junk by 2010. These were rating cuts, not default counts; some securities also failed outright. The Senate found that downgrades forced sales and left investors holding securities whose value was collapsing."
  duration: 13

- shot: washington-october-2008
  view: map
  camera: {center: [-77.0369, 38.9072], zoom: 11.6, pitch: 30, duration: 6}
  places: [washington-dc]
  time: "2008-10-22"
  reveal: [credit-rating-agencies-hearing-2008-10-22, house-oversight-committee, henry-waxman, jerome-fons, washington-dc]
  reveal_claims: [henry-waxman#c1, jerome-fons#c1]
  overlay: {kind: stat, value: "$3 billion to $6 billion", label: "Combined yearly revenue of Moody’s, S&P and Fitch, 2002 to 2007, as Chairman Waxman put it", source: house-oversight-2008-10-22-hearing, quote: "That chart will show the total revenues for the three firms, double from $3 billion in 2002 to over $6 billion in 2007."}
  narration: "**Washington, October 2008.** On 22 October, five weeks after Lehman Brothers failed, Henry Waxman swore in the heads of Fitch, Moody’s and S&P. He called them to answer for collapsed grades while combined yearly revenue doubled from $3 billion in 2002 to over $6 billion in 2007. Waxman said the chiefs would plead that almost nobody had foreseen events, but their documents told a different story. When Representative Souder called the evidence “incredible gross incompetence”, rival rater Sean Egan disagreed. In his opinion, public-company managers’ job was to increase revenue and profitability; one could probably conclude they had done everything possible to do that. The executives had to reconcile their public defences with their colleagues’ messages."
  duration: 13

- shot: moodys-in-public
  view: graph
  focus: raymond-mcdaniel
  time: "2008-10-22"
  reveal: [raymond-mcdaniel, moodys, credit-rating-agencies-hearing-2008-10-22]
  reveal_claims: [raymond-mcdaniel#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "On the one hand, we need to win the business and maintain market share or we cease to be relevant. On the other hand, our reputation depends on maintaining ratings quality.", caption: "Words the House read as McDaniel’s to his board, October 2007; Moody’s statement of facts gives them to one managing director"}
  narration: "**Moody’s, in public.** Under oath on 22 October 2008, McDaniel said Moody’s had not anticipated how far or how fast mortgage quality would deteriorate. Carolyn Maloney read from a confidential board paper: win business or cease to be relevant; preserve ratings quality or lose the firm’s reputation. He answered that the two statements were “not inconsistent”: standards could conflict with market share, and that conflict had to be controlled. Moody’s later acknowledged the same dilemma in its statement of facts, crediting the words to a managing director discussing corporate bonds in October 2007. Managers had been handed both targets. The boardroom problem of keeping customers and keeping standards had followed the chief executive into the hearing."
  duration: 13

- shot: sp-in-public
  view: graph
  focus: deven-sharma
  time: "2008-10-22"
  reveal: [deven-sharma, standard-and-poors, credit-rating-agencies-hearing-2008-10-22]
  reveal_claims: [deven-sharma#c1]
  overlay: {kind: quote, source: house-oversight-2008-10-22-hearing, quote: "While we performed analysis in good faith, events have shown that the historical data we used in our analysis significantly underestimated the severity of what subsequently occurred.", caption: "Deven Sharma, S&P president, to the House Oversight Committee, 22 October 2008"}
  narration: "**S&P, in public.** Deven Sharma asked the House to judge S&P by its figures: its stress tests reached back 75 years, but the historical data had underestimated the losses. Of U.S. structured securities rated from 2005 through the third quarter of 2007, he said, 1.7% had defaulted and about a third had been downgraded. Waxman had cited cuts to more than two-thirds of investment-grade ratings, a different measure. Sharma defended independence by pointing to roughly seven upgrades per downgrade on U.S. mortgage ratings in 1994–2006, and defended issuer fees because they let S&P publish grades free. The Senate report faulted issuer selection and payment for encouraging agencies to compete for business through better grades."
  duration: 13

- shot: the-senate-report
  view: map
  camera: {center: [-77.0369, 38.9072], zoom: 13.4, pitch: 45, duration: 6}
  places: [washington-dc]
  time: "2010-04-23"
  reveal: [senate-hearing-credit-rating-agencies-2010-04-23, levin-coburn-report, senate-permanent-subcommittee-on-investigations, carl-levin, tom-coburn, washington-dc]
  reveal_claims: [carl-levin#c1, tom-coburn#c1]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "Inaccurate AAA credit ratings introduced risk into the U.S. financial system and constituted a key cause of the financial crisis.", caption: "Senate Permanent Subcommittee on Investigations staff report, 13 April 2011"}
  narration: "**The Senate report.** At the April 2010 hearing, Carl Levin compared issuer payment to a litigant paying the judge’s salary. With Tom Coburn, he led an inquiry that subpoenaed hundreds of thousands of Moody’s and S&P documents. Its 2011 staff report found that by 2006 the firms knew their mortgage-security and CDO ratings were inaccurate, yet failed to re-test existing grades. They knew of fraud, lax lending and unsustainable house-price rises but failed to reflect those risks adequately. The report also blamed deficient model data, thin staffing, investment rules requiring high grades and SEC rules limiting competition to three recognized firms. Levin’s inquiry named the payment conflict one significant cause of bad ratings, and those ratings a key cause of the crisis."
  duration: 13

- shot: new-york-june-2010
  view: map
  camera: {center: [-74.006, 40.7128], zoom: 11.4, pitch: 30, duration: 6}
  places: [new-york-city]
  time: "2010-06-02"
  reveal: [fcic-hearing-on-credit-ratings-2010-06-02, berkshire-hathaway, moodys, new-york-city]
  reveal_claims: [berkshire-hathaway#c1, berkshire-hathaway#c2]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "After share repurchases by Moody’s Corporation, Berkshire Hathaway’s holdings of outstanding shares increased to over 20% by 2008.", caption: "The Financial Crisis Inquiry Report, 2011"}
  narration: "**New York, June 2010.** At the New School on 2 June, Warren Buffett explained why Berkshire Hathaway had bought into Moody’s. He had not inspected its management: “I’d never been at Moody’s, I don’t know where they are located.” What drew him, he said, was a “natural duopoly” with “incredible” pricing power. Berkshire held 15% when Moody’s went public in 2000; Moody’s share repurchases helped take that stake above 20% by 2008. The investor had chosen a business whose customers had little room to bargain. As Berkshire’s chairman, he also had to buy what that business sold."
  duration: 13

- shot: both-sides-of-the-table
  view: graph
  focus: warren-buffett
  time: "2010-06-02"
  reveal: [warren-buffett, berkshire-hathaway, moodys, fcic-hearing-on-credit-ratings-2010-06-02]
  reveal_claims: [warren-buffett#c3]
  overlay: {kind: quote, source: fcic-2010-06-02-hearing-transcript, quote: "It makes for a wonderful economic model for the business but, as a practical matter, I have no negotiating power.", caption: "Warren Buffett to the Financial Crisis Inquiry Commission, 2 June 2010"}
  narration: "**Both sides of the table.** Buffett told the commission that as Berkshire’s chairman he hated issuer payment: he needed both a Moody’s and an S&P rating and had no negotiating power. If he threatened to take his business elsewhere, “essentially there is no” alternative down the street. Changing who paid, he warned, “gets very tricky”. Asked about the housing bubble, he said the agencies had made the wrong call, as virtually everybody had. Phil Angelides challenged him: others had seen the bubble. Buffett had explained both his investment and his customer’s bill through the same lack of alternatives; the commission still had to decide why the grades failed."
  duration: 13

- shot: only-an-opinion
  view: graph
  focus: levin-coburn-report
  time: "2010"
  reveal: [levin-coburn-report, standard-and-poors, moodys, jerome-fons]
  overlay: {kind: quote, source: psi-2011-04-13-levin-coburn-report, quote: "The CRAs have successfully won dismissal of investor lawsuits, claiming that they are in the financial publishing business and their opinions are protected under the First Amendment.", caption: "Senate staff report, 2011"}
  narration: "**Only an opinion.** Jerome Fons told the House what Moody’s did when a customer tried to fire it: if it had enough information, it kept rating. The customer could stop paying, but “we could still offer our opinion and express our first amendment right.” S&P likewise described its grades as opinions rather than facts or recommendations to buy, hold or sell. According to the Senate report, agencies had won dismissal of investor suits using that publishing defence. Fons’s former employer could claim the right to keep speaking after losing a customer; investors faced that same defence when they sought redress. The later settlements would turn on what the firms promised about independence and methods."
  duration: 13

- shot: what-the-law-changed
  view: graph
  focus: dodd-frank-act
  time: "2010-07-21"
  reveal: [dodd-frank-act, sec, nrsro]
  reveal_claims: [sec#c2]
  overlay: {kind: quote, source: public-law-111-203-dodd-frank, quote: "it shall be sufficient, for purposes of pleading any required state of mind in relation to such action, that the complaint state with particularity facts giving rise to a strong inference that the credit rating agency knowingly or recklessly failed", caption: "Dodd-Frank Act, section 933"}
  narration: "**What the law changed.** In October 2008, Jerome Fons urged lawmakers to stop relying on ratings in regulations. Dodd-Frank, signed in July 2010, struck ratings references from federal statutes and ordered agencies to remove them from rules. Congress required annual SEC examinations and subjected rating-agency statements to enforcement like accounting firms’. Investors suing could plead particular facts strongly suggesting a knowing or reckless failure to investigate or verify the information a rating method relied on. Lawmakers also ordered a study of issuer and subscriber payment and directed the SEC, as it deemed necessary, to establish a system preventing issuers from choosing their structured-finance raters. Congress had assigned the duties; regulators now had to carry them out."
  duration: 13

- shot: why-they-did-it
  view: graph
  focus: fcic
  time: "2011-01"
  reveal: [fcic, keith-hennessey, douglas-holtz-eakin, bill-thomas, peter-wallison, financial-crisis-inquiry-report]
  reveal_claims: [keith-hennessey#c1, douglas-holtz-eakin#c1, bill-thomas#c1, peter-wallison#c1]
  overlay: {kind: quote, source: fcic-2011-final-report, quote: "While bad information created by credit rating agencies was an essential cause of the crisis, it is less clear why they did this.", caption: "Keith Hennessey, Douglas Holtz-Eakin and Bill Thomas, dissenting, 2011"}
  narration: "**Why they did it.** When the commission delivered its report in January 2011, Keith Hennessey, Douglas Holtz-Eakin and Bill Thomas chose to dissent. The majority said the agencies put market share and profit above ratings quality and integrity. The three accepted bad ratings as an essential cause of the crisis but questioned the explanation: bad models, pressure to win business and government-created limits on competition were hypotheses the three proposed. Peter Wallison dissented separately, calling criticism of analysts for missing future losses “sheer hindsight.” The Senate report also identified limited competition. The commissioners agreed neither on what the firms could have foreseen nor on why they failed; their split left different explanations for lawmakers to act on."
  duration: 13

- shot: what-sp-acknowledged
  view: graph
  focus: standard-and-poors
  time: "2007-02"
  reveal: [standard-and-poors, mortgage-backed-security, july-2007-mass-downgrades]
  overlay: {kind: stat, value: "11 deals", label: "Put on watch by S&P in February 2007, against the roughly 30 its surveillance staff recommended, per the agreed statement of facts", source: doj-2015-02-03-sp-statement-of-facts, quote: "a committee that included members of S&P’s RMBS New Issue group was convened on February 12 2007, and that committee decided to place only 18 RMBS tranches from 11 RMBS transactions on CreditWatch negative."}
  narration: "**What S&P acknowledged.** In November 2006, S&P’s surveillance head circulated a spreadsheet: over half its 2006 subprime deals had severely delinquent loans amounting to at least 25% of the lowest slice’s loss protection. In February 2007, her staff recommended watching subordinate slices of about 30 deals; a committee including new-deal raters chose 18 slices in 11. She wrote she was “fine with where we are”; colleagues said she complained executives blocked downgrades for fear of hurting business. S&P’s settlement also acknowledged a separate, earlier episode: during CDO Evaluator updates in 2004–05, its CDO chief described matrix testing as “in part based upon business decisions, considerations.” That matrix was not adopted. Until 10 July 2007, S&P kept issuing and confirming grades on CDOs substantially backed by subprime mortgage securities."
  duration: 13

- shot: sp-settles
  view: graph
  focus: sp-settlement-2015
  time: "2015-02-03"
  reveal: [sp-settlement-2015, standard-and-poors, us-department-of-justice]
  reveal_claims: [standard-and-poors#c3, standard-and-poors#c4]
  overlay: {kind: stat, value: "$1.375 billion", label: "S&P’s payment to the Justice Department and 19 states and D.C., 3 February 2015", source: doj-2015-02-03-sp-settlement, quote: "Half of the $1.375 billion payment – or $687.5 million – constitutes a penalty to be paid to the federal government and is the largest penalty of its type ever paid by a ratings agency."}
  narration: "**S&P settles.** On 3 February 2015, Eric Holder announced that S&P and McGraw Hill Financial would pay $1.375 billion to resolve the Justice Department’s 2013 suit and suits by 19 states and D.C. The suits alleged false promises of objective, independent ratings; the department said S&P admitted facts showing business concerns biased them. S&P withdrew its claim that the suit retaliated for its 2011 U.S. downgrade, acknowledging the evidence did not support it. The company said the settlement made no findings of legal violations and served shareholders; all parties settled “to avoid the delay, uncertainty, inconvenience, and expense of further litigation.” Holder said executives had ignored analysts’ warnings. Payment ended those suits; the agreed facts preserved the warnings the firm had received."
  duration: 13

- shot: moodys-settles
  view: graph
  focus: moodys-settlement-2017
  time: "2017-01-13"
  reveal: [moodys-settlement-2017, moodys, us-department-of-justice]
  reveal_claims: [moodys#c3]
  overlay: {kind: stat, value: "$863,791,823", label: "Moody’s payment to the Justice Department and 21 states and D.C., 13 January 2017", source: doj-2017-01-13-moodys-settlement-agreement, quote: "Moody’s shall pay a total amount of $863,791,823.00 to resolve pending and potential legal claims as set forth herein"}
  narration: "**Moody’s settles.** In January 2017, Justice Department official Bill Baer announced the bargain with Moody’s: a penalty, acknowledged facts and commitments to improve its practices. Moody’s said the agreement “removes significant legacy legal risk” and avoided the costs and uncertainty of continued investigations and litigation, serving the company and its shareholders. It agreed to pay $863,791,823 to resolve three pending state suits and potential Justice Department claims, with 21 states and D.C. participating; $437.5 million was a federal civil penalty. The firm said there was no finding of a legal violation or admission of liability. Its chief executive would have to certify compliance with the agreed reforms for at least five years."
  duration: 13

- shot: the-statement-of-facts
  view: graph
  focus: moodys-settlement-2017
  time: "2017-01-13"
  reveal: [moodys-settlement-2017, moodys, us-department-of-justice]
  reveal_claims: [moodys#c3]
  overlay: {kind: quote, source: doj-2017-01-13-moodys-statement-of-facts, quote: "has become a serious business issue for synthetics.", caption: "Moody’s standards committee minutes, 15 April 2004, acknowledged in its 2017 statement of facts"}
  narration: "**The statement of facts.** On 15 April 2004, Moody’s standards committee authorized a looser Aaa target for static synthetic CDOs pending research. Its minutes called the published target extraordinarily conservative against historical corporate defaults and other rating targets. The committee cited precise loss simulations and judged an ad hoc change justified by that conservatism, also “a serious business issue for synthetics.” It ordered no formal announcement. Moody’s acknowledged that using the looser geomean target gave some CDO slices Aaa ratings despite failing its published targets. Many arrangers and issuers knew; Moody’s did not announce the change to the market. Its 2010 announcement of a more conservative model omitted the earlier change. Moody’s said it “stands behind the integrity of its ratings, methodologies and processes”; the settlement admitted no liability and followed no trial or final adjudication."
  duration: 13
```
