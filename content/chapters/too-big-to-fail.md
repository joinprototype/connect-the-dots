---
uid: 01M6FCHYMJGTS8YTSP6ZHVCWY8
id: too-big-to-fail
type: chapter
title: Does Google Have to Break Up?
subtitle: "One search case, from the default setting to the judgment and the appeals"
summary: "When a court finds unlawful monopoly maintenance, must it divide the company? Follow United States v. Google from the 2020 complaint through the 2024 liability finding, the rival remedy proposals, the 2025 judgment and the pending appeals of 2026."
---

Standard Oil lost control of its subsidiaries in 1911. Google was ordered to change contracts and open specified data and services to rivals, under a six-year judgment, while keeping Chrome and Android. Judge Amit Mehta rejected a breakup in the search case; both sides appealed his answer.

```scene
- shot: the-breakup-question
  view: graph
  focus: standard-oil-v-united-states
  time: "1911-05-15"
  reveal: ["standard-oil-v-united-states", "standard-oil-new-jersey", "us-supreme-court"]
  reveal_claims: ["standard-oil-v-united-states#c7", "standard-oil-v-united-states#c4"]
  overlay: {kind: quote, source: govinfo-standard-oil-221-us-1, quote: "to so dissolve the combination as to neutralize the force of the unlawful power.", caption: "Supreme Court, Standard Oil opinion, 15 May 1911, syllabus"}
  narration: "**The breakup question.** When a court finds unlawful monopoly maintenance, must it break the company up? In 1911 Chief Justice Edward White upheld Standard Oil’s dissolution: its New Jersey parent had to surrender control of its subsidiaries, while shareholders could receive their shares. Judge Amit Mehta found that Google unlawfully maintained monopolies but ultimately kept Chrome and Android together with Google, ordering changes to contracts and access for rivals under a six-year judgment. Both sides have appealed; the road to that contested answer begins with the government’s complaint."
  duration: 13

- shot: the-default
  view: graph
  focus: us-v-google-search-case
  time: "2020-10-20"
  reveal: ["us-v-google-search-case", "google", "us-department-of-justice"]
  reveal_claims: ["us-v-google-search-case#c2", "us-v-google-search-case#c4"]
  overlay: {kind: quote, source: us-v-google-complaint-2020-10-20, quote: "Even where users can change the default, they rarely do.", caption: "DOJ and 11 states, complaint ¶ 3, 20 October 2020"}
  narration: "**The setting most people leave alone.** On 20 October 2020, Justice Department lawyers and 11 states sued Google over how its search engine reached users. They alleged that Google paid distributors billions each year for default placement, denying rivals the queries and scale they needed to compete: a user could change the setting, but usually did not. The lawyers asked for structural relief if needed to cure the harm, leaving a breakup available rather than demanding one particular sale. Before anyone could decide what to dismantle, they had to prove that these contracts harmed competition."
  duration: 13

- shot: what-survives
  view: map
  focus: us-v-google-search-case
  time: "2023-08-04"
  camera: {center: [-77.0369, 38.9072], zoom: 9.8, pitch: 0, duration: 6}
  places: [washington-dc]
  reveal: ["us-v-google-search-case", "google", "us-district-court-dc"]
  reveal_claims: ["us-v-google-search-case#c5"]
  overlay: {kind: quote, source: us-v-google-sj-opinion-2023-08-04, quote: "There remain genuine disputes of material fact that warrant a trial.", caption: "Judge Amit Mehta, summary-judgment opinion, 4 August 2023"}
  narration: "**Google narrows the trial.** Google asked Mehta to dispose of the claims before trial, challenging whether its conduct harmed competition; at this stage it did not contest the proposed markets or monopoly power. On 4 August 2023, he ruled for Google on the states’ claim that it weakened specialized search providers, because they had not demonstrated the required anticompetitive effect. He refused to dispose of the exclusive-dealing claims: disputed facts required witnesses and a trial. The case moving forward was narrower than the one the governments had brought."
  duration: 13

- shot: the-finding
  view: graph
  focus: google
  time: "2024-08-05"
  reveal: ["us-v-google-search-case", "google", "us-district-court-dc"]
  reveal_claims: ["us-v-google-search-case#c6"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "Google is a monopolist, and it has acted as one to maintain its monopoly.", caption: "Mehta’s 5 August 2024 finding, quoted in his 2 September 2025 remedy opinion"}
  narration: "**The contracts lose.** After trial, Mehta found on 5 August 2024 that Google unlawfully maintained monopolies in general search services and general search text advertising; he did not find monopoly power in the broader search advertising market. He found the distribution agreements foreclosed rivals, denied them scale and discouraged investment, rejecting Google’s claimed competitive justifications. He also credited Google’s engineers and innovation with producing the highest-quality search engine: the finding concerned how Google maintained its position through exclusive agreements. Google’s appeal of that finding remains pending; the next decision was what relief the proven conduct justified."
  duration: 13

- shot: sell-chrome
  view: graph
  focus: us-department-of-justice
  time: "2024-11-20"
  reveal: ["us-v-google-search-case", "us-department-of-justice", "google"]
  reveal_claims: ["us-v-google-search-case#c7"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "They seek an immediate forced divesture of Google’s web browser Chrome.", caption: "Mehta describing the plaintiffs’ remedy demand, 2 September 2025, Part II.A"}
  narration: "**The government asks for a sale.** With liability established, the plaintiffs filed their initial proposed judgment on 20 November 2024. Their demand, carried into the remedy trial, was to force Google to sell Chrome and provide for a possible Android sale if the initial remedies failed or Google evaded them. They also sought to stop Google’s search-related payments to distributors, arguing that relief must deny Google the fruits of its unlawful agreements and restore competition. A finding about contracts had become a proposed separation of products; Google would offer a much narrower answer."
  duration: 13

- shot: change-the-contracts
  view: graph
  focus: google
  time: "2024-12-20"
  reveal: ["us-v-google-search-case", "google", "apple"]
  reveal_claims: ["us-v-google-search-case#c8"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "Google says the court can do little more than enter a prohibitory injunction that bars it from entering or maintaining any unlawful exclusive distribution agreement for the term of the judgment.", caption: "Mehta describing Google’s position, 2 September 2025, Part II.B"}
  narration: "**Google offers different contracts.** Google submitted its initial proposed judgment on 20 December 2024, then refined its proposal before the remedy trial. It argued that the court could do little beyond prohibiting unlawful exclusive distribution agreements; its proposal allowed browser developers to choose different search defaults across modes and platforms and promote alternatives. Google also argued that broader relief required proof that rivals would have displaced it without the illegal contracts. Mehta would reject that strict test, but both sides still had to show what their proposed changes would do in practice."
  duration: 13

- shot: the-ai-witness
  view: graph
  focus: openai
  time: "2025-05-09"
  reveal: ["us-v-google-search-case", "openai", "google"]
  reveal_claims: ["us-v-google-search-case#c9"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "serving 80 percent is a lot more tractable.", caption: "OpenAI’s Nick Turley on building its own search index, quoted by Mehta from the April–May 2025 remedy hearing"}
  narration: "**A rival builds around the obstacle.** At the remedy hearing, which ended on 9 May 2025, OpenAI’s Nick Turley described seeking Google’s search results to ground ChatGPT’s answers; Google had declined. Quality problems with outside providers had pushed OpenAI to build its own search index, initially aiming to serve 80% of its traffic because that was more tractable. Turley’s testimony put a concrete choice before Mehta: whether rivals must build everything themselves or receive access to some of what Google had accumulated. Meanwhile, a company Google paid for distribution faced a different calculation."
  duration: 13

- shot: apples-choice
  view: graph
  focus: apple
  time: "2025-05-09"
  reveal: ["us-v-google-search-case", "apple", "google"]
  reveal_claims: ["us-v-google-search-case#c10"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "Google does an amazing job.", caption: "Apple’s Eddy Cue, quoted in the remedy opinion from the April–May 2025 hearing"}
  narration: "**Apple weighs the money.** In that same hearing, Apple’s services chief Eddy Cue acknowledged that Google’s payments discouraged Apple from building its own search engine: it was a significant amount of money. Yet he said Apple was still unlikely to enter because Google did an amazing job. Mehta treated the payments as a disincentive to entry; Cue’s praise also explained why eliminating them would not guarantee a new search engine. With the testimony complete, the judge had to distinguish a remedy that could restore competition from a sale whose benefits the evidence did not establish."
  duration: 13

- shot: chrome-stays
  view: map
  focus: google
  time: "2025-09-02"
  camera: {center: [-77.0369, 38.9072], zoom: 10.8, pitch: 0, duration: 6}
  places: [washington-dc]
  reveal: ["us-v-google-search-case", "google", "us-district-court-dc"]
  reveal_claims: ["us-v-google-search-case#c11"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "After two complete trials, this court cannot find that Google’s market dominance is sufficiently attributable to its illegal conduct to justify divestiture.", caption: "Mehta, remedy opinion, 2 September 2025, Chrome divestiture"}
  narration: "**Mehta refuses the breakup.** On 2 September 2025, Mehta rejected selling Chrome and a contingent Android sale. He found the connection between the illegal conduct and Google’s dominance insufficient to justify divestiture: the Chrome default mattered to liability, but ownership of Chrome itself was a different question. He also cited Chrome manager Parisa Tabriz’s warning that a sale could leave a product diminished in quality and security. That decision kept Google’s businesses together; it did not resolve what Google could pay other companies to put its products in front of users."
  duration: 13

- shot: mozilla-and-the-payments
  view: graph
  focus: google
  time: "2025-09-02"
  reveal: ["us-v-google-search-case", "google", "apple"]
  reveal_claims: ["us-v-google-search-case#c12"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "put Firefox out of business.", caption: "Mozilla CFO Eric Muhlheim’s warning about losing Google payments, quoted by Mehta in the remedy opinion"}
  narration: "**The cost of cutting off the money.** Mehta next rejected a broad ban on distribution payments, while prohibiting exclusivity. Mozilla’s finance chief Eric Muhlheim had warned that losing Google’s revenue could force cuts, drive users away and ultimately put Firefox out of business. Mehta cited the harm a ban could do to distributors, related markets and consumers, and let Google keep paying for placement. He also warned that Google could outbid rivals, keeping distributors and blunting the remedies. He was prepared to revisit a payment ban if the remedies did not substantially restore competition."
  duration: 13

- shot: open-some-of-the-engine
  view: graph
  focus: google
  time: "2025-09-02"
  reveal: ["us-v-google-search-case", "google", "openai"]
  reveal_claims: ["us-v-google-search-case#c13"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "Google will have to make available to Qualified Competitors certain search index and user-interaction data.", caption: "Mehta, remedy opinion, 2 September 2025, introduction"}
  narration: "**Share some of what scale built.** Having rejected a sale and a payment ban, Mehta ordered Google to make certain search index and user-interaction data available to qualified competitors. He reasoned that the illegal agreements had widened Google’s data advantage; access could deny Google some fruits of the violation and help rivals improve. He also ordered Google to offer search results and search text ads for rivals to use in their own products, including qualifying AI products. These obligations needed privacy safeguards, licenses and supervision; the next task was to turn the opinion into an enforceable judgment."
  duration: 13

- shot: the-judgment
  view: graph
  focus: us-v-google-search-case
  time: "2025-12-05"
  reveal: ["us-v-google-search-case", "google", "us-district-court-dc"]
  reveal_claims: ["us-v-google-search-case#c14", "us-v-google-search-case#c15"]
  overlay: {kind: quote, source: us-v-google-final-judgment-2025-12-05, quote: "this Final Judgment will expire six (6) years from the Effective Date.", caption: "Final judgment, 5 December 2025, § VIII; subject to extension or early termination"}
  narration: "**Six years of rules.** On 5 December 2025, Mehta entered a judgment lasting six years from effectiveness, with a five-person Technical Committee. Google could still pay for placement, but could not require preloading Google Search to license Google Play, or tie payments for one browser default to Google defaults at other access points or devices. Paid distribution and permitted default agreements faced one-year limits; browsers could promote rival search and AI products. Qualified competitors would receive specified data at marginal cost with privacy and security safeguards, and five-year licenses for Google’s search results and search text ads. Google would challenge the liability finding and the sharing orders."
  duration: 13

- shot: googles-appeal
  view: graph
  focus: google
  time: "2026-01-16"
  reveal: ["google-search-appeal-2026", "google", "us-v-google-search-case"]
  reveal_claims: ["google-search-appeal-2026#c1"]
  overlay: {kind: quote, source: google-blog-2026-01-16-why-were-appealing, quote: "These mandates would risk Americans’ privacy and discourage competitors from building their own products", caption: "Lee-Anne Mulholland, Google’s regulatory affairs vice president, 16 January 2026"}
  narration: "**Google asks for a pause.** On 16 January 2026, Google filed its appeal and asked to pause the data-sharing and syndication requirements. Regulatory affairs vice president Lee-Anne Mulholland said the liability ruling ignored that people used Google by choice, discounted Apple’s and Mozilla’s testimony about quality and failed to account for rapid innovation and competition. She argued that compelled sharing threatened privacy and would discourage rivals from building their own products. The government had won liability, but Google disputed both that finding and the remedy’s consequences."
  duration: 13

- shot: both-sides-appeal
  view: graph
  focus: google-search-appeal-2026
  time: "2026-02-03"
  reveal: ["google-search-appeal-2026", "us-department-of-justice", "google"]
  reveal_claims: ["google-search-appeal-2026#c2", "us-v-google-search-case#c14"]
  overlay: {kind: quote, source: us-v-google-order-2026-05-07, quote: "Plaintiffs then filed notices of cross-appeal on February 3, 2026.", caption: "Mehta, order of 7 May 2026, recounting the appeals"}
  narration: "**The government appeals too.** On 3 February 2026, the plaintiffs filed their own notices of appeal, leaving the judgment contested from both directions. That day the final judgment became effective: filing an appeal had not itself suspended its commands. With Google asking to pause the sharing obligations and the plaintiffs opposing a pause, Mehta had to decide whether the threatened disclosure was close enough to require immediate protection."
  duration: 13

- shot: a-pause-denied-for-now
  view: map
  focus: us-district-court-dc
  time: "2026-05-07"
  camera: {center: [-77.0369, 38.9072], zoom: 11.8, pitch: 0, duration: 6}
  places: [washington-dc]
  reveal: ["google-search-appeal-2026", "us-district-court-dc", "google"]
  reveal_claims: ["google-search-appeal-2026#c3", "google-search-appeal-2026#c5"]
  overlay: {kind: quote, source: us-v-google-order-2026-05-07, quote: "The court’s decision today starts and ends with irreparable harm.", caption: "Mehta, partial-stay order, 7 May 2026"}
  narration: "**Too soon for a stay.** On 7 May 2026, Mehta denied Google’s partial-stay motion without prejudice because its claimed harm was not imminent: data-sharing safeguards and licenses were still being worked out. Google argued that once confidential information escaped, the damage could not be undone; Mehta held that the actual recipients, protections and permitted uses mattered. He required the plaintiffs to give Google and the court 45 days’ notice before any qualified competitor could begin access, so Google could renew its request. Preparation could continue while the appeal did."
  duration: 13

- shot: making-the-order-work
  view: graph
  focus: google-search-appeal-2026
  time: "2026-09-17"
  reveal: ["google-search-appeal-2026", "us-department-of-justice", "google"]
  reveal_claims: ["google-search-appeal-2026#c6"]
  overlay: {kind: quote, source: us-v-google-status-report-2026-09-17, quote: "Google has also continued its preparatory work to comply with the data-sharing and syndication requirements in Sections IV–VI of the Final Judgment.", caption: "Plaintiffs’ second compliance status report, 17 September 2026, Part IV.B"}
  narration: "**The work after the order.** By 17 September 2026, the plaintiffs were reporting the practical work of enforcement, drawing in part on Google counsel’s information. Their report said the Technical Committee had needed a security plan before it could acquire systems for handling Google’s data; proposed syndication license terms had gone to Google on 31 August. They also reported Google’s continuing preparation for sharing and syndication. An order to open access had become work over safeguards and terms, while the plaintiffs were still challenging whether the judge had left too much of Google’s distribution advantage intact."
  duration: 13

- shot: the-answer-on-appeal
  view: graph
  focus: google-search-appeal-2026
  time: "2026-10-21"
  reveal: ["google-search-appeal-2026", "us-v-google-search-case", "google", "us-department-of-justice"]
  reveal_claims: ["google-search-appeal-2026#c7", "us-v-google-search-case#c11", "us-v-google-search-case#c14"]
  overlay: {kind: quote, source: us-v-google-remedies-opinion-2025-09-02, quote: "Google will not be required to divest Chrome; nor will the court include a contingent divestiture of the Android operating system in the final judgment.", caption: "Mehta’s answer, 2 September 2025; the judgment is contested on appeal"}
  narration: "**The answer, still contested.** On 21 October 2026, the plaintiffs argued on cross-appeal that Mehta erred by rejecting a payment ban without first deciding whether effective relief required it. Both appeals remain pending: for now, his answer is “Google will not be required to divest Chrome”, with contract restrictions, specified sharing and six years of supervision instead."
  duration: 13

```

Continental Illinois’s rescue, FTC v. Meta, Epic’s app-store suits, the meatpacking inquiry, the insulin case and Texas’s ownership suit are other stories. So are Live Nation and Ticketmaster, DOJ v. Visa, Google’s separate ad-tech case, DOJ’s smartphone suit against Apple, JetBlue’s bid for Spirit, American and JetBlue’s Northeast Alliance, and RealPage.
