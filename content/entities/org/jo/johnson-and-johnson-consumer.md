---
uid: 01M6DKJ0GG3R4019JQ1PQDEYAS
id: johnson-and-johnson-consumer
type: org
name: "Johnson & Johnson Consumer Inc."
aliases: ["JJCI", "Old Consumer"]
summary: "J&J subsidiary that made and sold Johnson's Baby Powder; the court records call it JJCI or \"Old Consumer\"."
claims:
  - id: c1
    rel: part_of
    to: johnson-and-johnson
    src:
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "J&J is JJCI’s parent company."}
  - id: c2
    rel: produced
    to: johnsons-baby-powder
    src:
      - {s: ca3-2023-01-30-in-re-ltl-management, quote: "So since 1979 only Old Consumer and its predecessors, and not J&J, have directly sold Johnson’s Baby Powder."}
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "JJCI manufactures and sells products containing talcum powder (“talc”), a mineral used in cosmetics, across the United States."}
  - id: c3
    rel: disputes_finding
    to: fda-2019-baby-powder-asbestos-test
    when: "2019-12-03"
    according_to: [johnson-and-johnson-consumer]
    src:
      - {s: jnj-2019-12-03-no-asbestos-in-johnsons-baby-powder, quote: "Additionally, the Company’s investigation revealed that the testing protocol at AMA deviated from standard practice and that AMA did not execute a full asbestos confirmation as required by their lab’s test method.", by: johnson-and-johnson-consumer}
      - {s: jnj-2019-12-03-no-asbestos-in-johnsons-baby-powder, quote: "Our talc is safe and asbestos free, and these 150-plus tests, and the tests we routinely do to ensure the quality and safety of our talc-based products, are consistent with the results from renowned independent research labs over the past 40 years.", by: johnson-and-johnson-consumer}
  - id: c4
    rel: overturned_by
    to: missouri-court-of-appeals-eastern-district
    when: "2020-06-23"
    case: "Ingham v. Johnson & Johnson"
    title: "judgment reversed in part for lack of personal jurisdiction over two plaintiffs; punitive damages against JJCI set at $900 million"
    src:
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "The judgment against JJCI is reversed in part on the claims of the two Non-Resident Plaintiffs"}
      - {s: mo-app-2020-06-23-ingham-v-johnson-johnson, quote: "We further enter judgment for $900 million in punitive damages against JJCI and $715,909,091 in punitive damages against J&J."}
---
