---
uid: 01M53TK2R6Z8ZBD8WY9ZYYG3M9
id: nasa
type: org
name: NASA
aliases: [National Aeronautics and Space Administration]
summary: "US civilian space agency, created in 1958."
when: "1958-10-01/.."
claims:
  - id: c1
    rel: contracted
    to: spacex
    when: 2006-08-18
    title: Commercial Orbital Transportation Services (COTS) demonstration
    amount: 278000000
    currency: USD
    note: "A funded Space Act Agreement with milestone payments rather than a conventional procurement contract."
    src:
      - {s: nasa-cots-saa-spacex-2006, quote: "Total funding required from NASA for demonstration of capabilities A-C is $278M"}
      - {s: register-2006-08-18-cots, quote: "If all goes according to plan, SpaceX would earn $278m from NASA, while Rocketplane Kistler would pull in close to $207m."}
  - id: c2
    rel: contracted
    to: blue-origin
    when: 2023-05-19
    title: Artemis V human landing system
    amount: 3400000000
    currency: USD
    src: [{s: nasa-hls-blue-origin-2023, quote: "The total award value of the firm-fixed price contract is $3.4 billion."}]
  - id: c3
    rel: part_of
    to: us-government
    when: "1958-10-01/.."
    src: [{s: nasa-sputnik-origins, at: "Birth of NASA", quote: "As a direct outgrowth of this crisis in the winter of 1957-1958, the administration worked with congressional leaders to draft legislation creating a permanent federal agency dedicated to exploring space."}]
  - id: c4
    rel: contracted
    to: douglas-aircraft-company
    when: "1961-12"
    title: "S-IVB rocket stage"
    note: "The S-IVB was the upper stage of the Saturn IB and Saturn V. Its propellant tank domes and bulkheads were made at the Douglas plant in Santa Monica."
    src:
      - {s: nasa-sp-4206-stages-to-saturn, at: "ch. 6, p. 160", quote: "The space agency seemed somewhat sensitive about the S-IVB contract, because there had been no bidders' conference or active competition by other firms. NASA awarded the contract to Douglas for reasons of cost and schedules"}
---

The National Aeronautics and Space Administration was created by the National Aeronautics and Space Act, which [[dwight-d-eisenhower]] signed on 29 July 1958, as a direct outgrowth of the [[sputnik-1]] crisis.

[[wernher-von-braun]] directed its [[marshall-space-flight-center]]. NASA later funded commercial partners, including [[spacex]] (2006) and [[blue-origin]] (2023).
