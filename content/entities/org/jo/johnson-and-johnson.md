---
uid: 01M6DK8E5DC65VQ1FZFG3XFWEZ
id: johnson-and-johnson
type: org
name: "Johnson & Johnson"
aliases: ["J&J", "Johnson and Johnson"]
summary: "U.S. health-care company; its consumer business was separated as Kenvue in 2023."
claims:
  - id: c1
    rel: owns_stake
    to: kenvue
    when: "2023-08-23"
    percent: 9.5
    as_of: "2023-08-23"
    src:
      - {s: jnj-kenvue-2023, quote: "Following completion of the exchange offer, Johnson & Johnson retains approximately 9.5% of the outstanding shares of Kenvue common stock."}
  - id: c2
    rel: headquartered_in
    to: new-jersey
    src:
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "Defendants are both incorporated and headquartered in New Jersey."}
  - id: c3
    rel: disputes_finding
    to: health-canada-talc-ovarian-cancer-finding-2021
    according_to: [johnson-and-johnson]
    src:
      - {s: jnj-facts-about-talc, quote: "The weight of the science does not support any claim that our talc products cause cancer.", by: johnson-and-johnson}
  - id: c4
    rel: overturned_by
    to: missouri-court-of-appeals-eastern-district
    when: "2020-06-23"
    case: "Ingham v. Johnson & Johnson"
    title: "judgment reversed in part for lack of personal jurisdiction over 17 plaintiffs; punitive damages against J&J set at $715,909,091"
    src:
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "The judgment against J&J is reversed in part as to all seventeen Non-Resident Plaintiffs for lack of personal jurisdiction."}
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "We further enter judgment for $900 million in punitive damages against JJCI and $715,909,091 in punitive damages against J&J."}
---
