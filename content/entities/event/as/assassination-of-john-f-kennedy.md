---
uid: 01M6DKJKK3YF886JMGHRGCK47T
id: assassination-of-john-f-kennedy
type: event
name: "Assassination of John F. Kennedy"
in_sentence: "the assassination of John F. Kennedy"
aliases: ["Kennedy assassination", "Dallas, 22 November 1963"]
summary: "The shooting of President Kennedy in Dealey Plaza, Dallas, on 22 November 1963."
same_as: {wikidata: Q193484}
when: "1963-11-22"
place: dallas
claims:
  - id: c1
    rel: located_in
    to: dealey-plaza
    src:
      - {s: nara-warren-report-ch1, at: "Narrative of Events", quote: "Dealey Plaza--an open, landscaped area marking the western end of downtown Dallas stretched out to the President's left."}
  - id: c2
    rel: involved
    to: john-f-kennedy
    role: "The President who was shot"
    src:
      - {s: nara-warren-report-ch1, at: "Narrative of Events", quote: "President Kennedy was pronounced dead."}
  - id: c3
    rel: involved
    to: lee-harvey-oswald
    role: "Found by the Warren Commission and the House committee to have fired the shots"
    according_to: [warren-commission, house-select-committee-on-assassinations]
    src:
      - {s: nara-warren-report-ch1, at: "Conclusions", quote: "The shots which killed President Kennedy and wounded Governor Connally were fired by Lee Harvey Oswald.", by: warren-commission}
      - {s: nara-hsca-report-summary, at: "Findings", quote: "The third shot he fired killed the President.", by: house-select-committee-on-assassinations}
  - id: c4
    rel: led_to
    to: warren-commission
    src:
      - {s: nara-warren-report-foreword, at: "The Commission’s Function", quote: "created this Commission to investigate the assassination on November 22, 1963"}
  - id: c5
    rel: led_to
    to: killing-of-lee-harvey-oswald
    src:
      - {s: nara-warren-report-foreword, at: "The Commission’s Function", quote: "to evaluate all the facts and circumstances surrounding the assassination and the subsequent killing of the alleged assassin"}
  - id: c6
    rel: led_to
    to: jfk-records-collection-act
    src:
      - {s: nara-jfk-collection-background, at: "The Act", quote: "Almost 30 years later, hoping to allay lingering doubts about the circumstances surrounding that event, Congress enacted the President John F. Kennedy Assassination Records Collection Act."}
---
