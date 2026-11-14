---
uid: 01M6DK033TNADG5G01KZSJ990C
id: us-v-google-search-case
type: event
name: "United States v. Google (search)"
aliases: ["U.S. v. Google"]
summary: "Antitrust case filed on 20 October 2020 by the Justice Department and states over Google's search distribution agreements."
when: "2020-10-20/.."
claims:
  - id: c1
    rel: involved
    to: google
    role: "defendant; the court held in 2024 that it violated Section 2 of the Sherman Act; Google appealed on 16 January 2026 and the plaintiffs cross-appealed on 3 February"
    note: "In 2023 the court ruled for Google on state plaintiffs' claims that it weakened rival vertical search providers."
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Introduction", quote: "Last year, this court ruled that Defendant Google LLC had violated Section 2 of the Sherman Act: “Google is a monopolist, and it has acted as one to maintain its monopoly.”"}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Introduction", quote: "The court found that, for more than a decade, Google had entered into distribution agreements with browser developers, original equipment manufacturers, and wireless carriers to be the out-of-the box, default general search engine"}
      - {s: us-v-google-sj-opinion-2023-08-04, at: "Conclusion", quote: "the court grants judgment in favor of Google insofar as those claims rely on Google’s alleged weakening of SVPs"}
      - {s: us-v-google-order-2026-05-07, at: "Order", quote: "Google filed a notice of appeal to the D.C. Circuit on January 16, 2026."}
      - {s: us-v-google-order-2026-05-07, at: "Order", quote: "Plaintiffs then filed notices of cross-appeal on February 3, 2026."}
  - id: c2
    rel: involved
    to: us-department-of-justice
    role: "plaintiff with 11 states, which filed the complaint on 20 October 2020"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part I", quote: "This case began on October 20, 2020, when the U.S. Department of Justice and 11 states (“U.S. Plaintiffs”) filed an antitrust complaint against Google"}
  - id: c3
    rel: involved
    to: us-district-court-dc
    role: "the court that heard the case and entered the final judgment of 5 December 2025"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Introduction", quote: "Last year, this court ruled that Defendant Google LLC had violated Section 2 of the Sherman Act: “Google is a monopolist, and it has acted as one to maintain its monopoly.”"}
      - {s: us-v-google-order-2026-05-07, at: "Order", quote: "The Final Judgment (1) prohibits Google from entering into exclusive distribution agreements for its search and search-related products"}
  - id: c4
    rel: involved
    to: google
    role: "20 October 2020; defendant; DOJ alleged that paid defaults denied rival search engines distribution and sought structural relief as needed"
    according_to: [us-department-of-justice]
    src:
      - {s: us-v-google-complaint-2020-10-20, at: "Complaint ¶¶ 3–6 and prayer for relief", quote: "Even where users can change the default, they rarely do."}
      - {s: us-v-google-complaint-2020-10-20, at: "Prayer for relief, b", quote: "Enter structural relief as needed to cure any anticompetitive harm;"}
  - id: c5
    rel: involved
    to: google
    role: "4 August 2023; won summary judgment on claims about weakening specialized vertical providers; exclusive-dealing claims went to trial"
    src:
      - {s: us-v-google-sj-opinion-2023-08-04, at: "Introduction", quote: "There remain genuine disputes of material fact that warrant a trial."}
      - {s: us-v-google-sj-opinion-2023-08-04, at: "Introduction", quote: "the court grants judgment in favor of Google insofar as those claims rely on Google’s alleged weakening of SVPs."}
  - id: c6
    rel: involved
    to: google
    role: "5 August 2024; the court found unlawful monopoly maintenance in general search services and general search text advertising, but not monopoly power in the broader search advertising market; Google appealed in 2026"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part I.A.3, recalling the liability decision", quote: "the court issued its liability findings on August 5, 2024."}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part I.A.3", quote: "The court determined that Google had monopoly power in the general search services and general search text advertising markets but not the search advertising market."}
  - id: c7
    rel: involved
    to: us-department-of-justice
    role: "20 November 2024–7 March 2025; plaintiff with states; filed an initial proposed judgment and sought a Chrome sale and contingent Android sale in its remedy proposal"
    according_to: [us-department-of-justice]
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part I.B and II.A", quote: "Plaintiffs filed their initial proposed final judgment on November 20, 2024."}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part II.A", quote: "They seek an immediate forced divesture of Google’s web browser Chrome."}
  - id: c8
    rel: involved
    to: google
    role: "20 December 2024–7 March 2025; proposed a narrower injunction against exclusive distribution agreements, with different defaults across browser modes and platforms"
    according_to: [google]
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part I.B", quote: "Google submitted its initial proposed final judgment on December 20, 2024."}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Part II.B", quote: "Google says the court can do little more than enter a prohibitory injunction that bars it from entering or maintaining any unlawful exclusive distribution agreement for the term of the judgment."}
  - id: c9
    rel: involved
    to: openai
    role: "22 April 2025–9 May 2025; Nick Turley testified about building a search index after difficulties with outside providers; Google had declined a grounding partnership"
    according_to: [openai]
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Findings of fact ¶ 52", quote: "OpenAI previously sought out a partnership with Google for grounding, but Google declined."}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Conclusions of law, search-index sharing", quote: "serving 80 percent is a lot more tractable.", by: openai}
  - id: c10
    rel: involved
    to: apple
    role: "22 April 2025–9 May 2025; Eddy Cue acknowledged the disincentive from Google’s payments to build search, while saying Apple was still unlikely to enter because of Google’s quality"
    according_to: [apple]
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Conclusions of law, II.A.1", quote: "It’s a significant amount of money.", by: apple}
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Conclusions of law, II.A.1", quote: "Google does an amazing job.", by: apple}
  - id: c11
    rel: involved
    to: google
    role: "2 September 2025; the court rejected Chrome divestiture and contingent Android divestiture, finding the necessary connection between illegal conduct and market dominance insufficient for divestiture"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Conclusions of law, Chrome divestiture", quote: "After two complete trials, this court cannot find that Google’s market dominance is sufficiently attributable to its illegal conduct to justify divestiture."}
  - id: c12
    rel: involved
    to: google
    role: "2 September 2025; the court allowed nonexclusive distribution payments, citing risks to partners, related markets and consumers from a broad ban"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Introduction", quote: "Google will not be barred from making payments or offering other consideration to distribution partners for preloading or placement of Google Search, Chrome, or its GenAI products."}
  - id: c13
    rel: involved
    to: google
    role: "2 September 2025; ordered to share certain search index and user-interaction data and offer search and search text ad syndication to qualified competitors"
    src:
      - {s: us-v-google-remedies-opinion-2025-09-02, at: "Introduction", quote: "Google will have to make available to Qualified Competitors certain search index and user-interaction data."}
      - {s: us-v-google-final-judgment-2025-12-05, at: "§ IV.B", quote: "at marginal cost, to Qualified Competitors the following User-side Data on a non-discriminatory basis while safeguarding personal privacy and security:"}
  - id: c14
    rel: involved
    to: us-district-court-dc
    role: "5 December 2025; entered a judgment with a six-year term from its effective date and a five-person Technical Committee"
    src:
      - {s: us-v-google-final-judgment-2025-12-05, at: "§ VIII", quote: "this Final Judgment will expire six (6) years from the Effective Date."}
      - {s: us-v-google-final-judgment-2025-12-05, at: "§ VII.A.1", quote: "a five-person Technical Committee"}
  - id: c15
    rel: involved
    to: google
    role: "5 December 2025; paid distribution and permitted default agreements subject to one-year limits under the final judgment"
    src:
      - {s: us-v-google-final-judgment-2025-12-05, at: "§ III.K", quote: "terminates no more than one year after the date it is entered."}
      - {s: us-v-google-final-judgment-2025-12-05, at: "§ III.L", quote: "Any agreement containing a default condition permitted by this provision must expire after one year"}
---
