---
uid: 01M6C2F695RX8P4ETQ4EF51ZTA
id: the-airfield-and-the-think-tank
type: chapter
title: The Airfield and the Think Tank
subtitle: How a plant in Santa Monica sent planes around the world, and how a project born inside it drew a satellite, a network and a fight over the Pentagon's own history
summary: Four biplanes left a California airfield in 1924. A research project grew up in the same plant. Here is what came out of one beach town, with who says what along the way.
---

Santa Monica is a beach town on the western edge of Los Angeles. For about fifty years an aircraft plant stood at its airfield, and a research group born inside that plant is still in town.

This is a story about a place, not about cause. RAND did not launch Sputnik, and Paul Baran did not build the ARPANET. Where the sources disagree, the story says who says what. A connection is not evidence of influence.

```scene
- shot: one-airfield
  view: map
  camera: {center: [-118.47, 34.02], zoom: 11.2, pitch: 30, duration: 6}
  places: [santa-monica-airport]
  time: "1923"
  reveal: [santa-monica-airport, santa-monica, douglas-aircraft-company, donald-douglas]
  reveal_claims: [santa-monica-airport#c1, donald-douglas#c1]
  overlay: {kind: quote, source: smgov-airport-history, quote: "April 15, 1923 - The Army Air Corps dedicates Clover Field, named after World War I pilot Lt. Greayer \"Grubby\" Clover, who grew up nearby and was killed in action.", caption: "City of Santa Monica, airport history"}
  narration: "**One airfield.** In 1923 the Army dedicated Clover Field, on the edge of a California beach town, and named it for a local pilot killed in the First World War. Donald Douglas was already building aircraft on the site."
  duration: 11

- shot: four-planes
  view: map
  camera: {globe: true, center: [160, 38], zoom: 1.05, duration: 7}
  places: [seattle, dutch-harbor, japan, india]
  routes: [[seattle, dutch-harbor], [dutch-harbor, japan], [japan, india]]
  borders: [soviet-union]
  time: "1924"
  reveal: [douglas-world-cruiser, first-flight-around-the-world, douglas-aircraft-company, seattle, dutch-harbor, japan, india]
  reveal_claims: [us-government#c7, douglas-aircraft-company#c2, first-flight-around-the-world#c3, first-flight-around-the-world#c4, first-flight-around-the-world#c5, first-flight-around-the-world#c6, first-flight-around-the-world#c7]
  overlay: {kind: quote, source: nasm-douglas-world-cruiser-chicago, quote: "Because the United States did not recognize the Soviet Union at this time, flying over Siberia was prohibited, necessitating a southeast Asian route that added 11,000 km (6,875 mi) to the journey.", caption: "Smithsonian National Air and Space Museum"}
  narration: "**Four planes.** The U.S. Army Air Service ordered four biplanes from Douglas for something no one had done: a flight around the world. They left Clover Field in March 1924 for the official start at Seattle, then crossed the Pacific by way of Alaska and Japan."
  duration: 14

- shot: around-the-world
  view: map
  camera: {globe: true, center: [-25, 45], zoom: 1.5, duration: 7}
  places: [india, paris, london, pictou, seattle]
  routes: [[india, paris], [paris, london], [london, pictou], [pictou, seattle]]
  time: "1924-09-28"
  reveal: [first-flight-around-the-world, douglas-world-cruiser, paris, london, pictou, seattle]
  reveal_claims: [first-flight-around-the-world#c1, first-flight-around-the-world#c8, first-flight-around-the-world#c9, first-flight-around-the-world#c10]
  overlay: {kind: stat, value: "175 days", label: "From Seattle back to Seattle, by the Smithsonian's count", source: nasm-douglas-world-cruiser-chicago, quote: "Only the New Orleans and the Chicago completed the arduous 44,085 km (27,553 mi) flight. It took 175 days, with a flying time of 371 hours 11 minutes."}
  narration: "**Around the world.** One plane hit a mountainside in Alaska, and its crew escaped with minor injuries. Crowds met the others in Paris on Bastille Day. One more came down in the North Atlantic. Two of the first four finished at Seattle on 28 September."
  duration: 13

- shot: the-plane-that-paid
  view: map
  camera: {center: [-118.45, 34.02], zoom: 10.6, pitch: 30, duration: 6}
  places: [santa-monica-airport]
  time: "1935-12-17"
  reveal: [douglas-dc-3, douglas-aircraft-company, santa-monica-airport]
  reveal_claims: [douglas-aircraft-company#c3, douglas-aircraft-company#c1]
  overlay: {kind: stat, value: "95 percent", label: "Share of U.S. commercial airline traffic flown on DC-3s by 1938", source: nasm-douglas-dc-3, quote: "By 1938, 95 percent of all U.S. commercial airline traffic was on DC-3s."}
  narration: "**The plane that paid.** On 17 December 1935 the first of a new line flew from Clover Field. The DC-3 became the first airliner to fly profitably without government subsidy. In the war that followed, the City says, Douglas employed up to 44,000 workers."
  duration: 13

- shot: a-project-inside-the-plant
  view: graph
  lens: all
  focus: project-rand
  time: "1946"
  reveal: [project-rand, douglas-aircraft-company, henry-h-arnold, donald-douglas, frank-collbohm, santa-monica]
  reveal_claims: [henry-h-arnold#c1, project-rand#c1, project-rand#c2, frank-collbohm#c2]
  overlay: {kind: stat, value: "$640", label: "What Project RAND spent in its first month", source: rand-cp-537-ware-2008, quote: "Project RAND commenced operations in December 1945, expending a total of $640 in its first month of operation."}
  narration: "**A project inside the plant.** As the war ended, General Henry Arnold, Donald Douglas and others set up Project RAND, for long-range planning, in a separate part of the Douglas plant. RAND's own histories differ on who had the idea, and on whether it began in 1945 or 1946."
  duration: 14

- shot: three-weeks
  view: map
  camera: {globe: true, center: [-118.45, 25], zoom: 1.8, duration: 6}
  places: [santa-monica]
  time: "1946-05-02"
  reveal: [world-circling-spaceship-report, project-rand, santa-monica]
  reveal_claims: [project-rand#c4]
  overlay: {kind: quote, source: rand-sm-11827-report, quote: "The achievement of a satellite craft by the United States would inflame the imagination of mankind, and would probably produce repercussions in the world comparable to the explosion of the atomic bomb.", caption: "Preliminary Design of an Experimental World-Circling Spaceship, 2 May 1946, p. 2"}
  narration: "**Three weeks.** The project's first job was to design a “world-circling spaceship,” with a three-week deadline. The report of 2 May 1946 put the cost at about $150 million and the time at about five years, and it said what a satellite would do."
  duration: 14

- shot: on-its-own
  view: graph
  focus: rand-corporation
  time: "1948"
  reveal: [rand-corporation, project-rand, douglas-aircraft-company, ford-foundation, frank-collbohm]
  reveal_claims: [project-rand#c3, frank-collbohm#c1, ford-foundation#c1]
  overlay: {kind: quote, source: rand-cp-537-ware-2008, quote: "Among others was the reluctance of other companies to share their corporate secrets and plans with Douglas—a potential competitor.", caption: "Willis Ware, RAND and the Information Evolution, 2008, p. 8"}
  narration: "**On its own.** Other companies were reluctant to share their plans with a rival's project. RAND moved from the plant to offices downtown in 1947 and became an independent nonprofit in 1948, with Frank Collbohm as president and $1 million secured through the Ford Foundation."
  duration: 14

- shot: a-game-for-two
  view: graph
  focus: prisoners-dilemma
  time: "1950"
  reveal: [prisoners-dilemma, merrill-flood, melvin-dresher, rand-corporation]
  reveal_claims: [merrill-flood#c2, melvin-dresher#c2, merrill-flood#c1, melvin-dresher#c1]
  overlay: {kind: quote, source: sep-prisoners-dilemma, quote: "The “dilemma” faced by the prisoners here is that, whatever the other does, each is better off confessing than remaining silent.", caption: "Stanford Encyclopedia of Philosophy, Prisoner's Dilemma"}
  narration: "**A game for two.** In early 1950 two RAND mathematicians, Merrill Flood and Melvin Dresher, had two colleagues play a game a hundred times in a row. Albert Tucker later told it as a story of two prisoners. It is now known as the prisoner's dilemma."
  duration: 13

- shot: eleven-years-later
  view: map
  camera: {globe: true, center: [62, 48], zoom: 1.7, duration: 7}
  places: [kazakhstan]
  borders: [soviet-union]
  time: "1957-10-04"
  reveal: [sputnik-1, world-circling-spaceship-report, soviet-government, kazakhstan, nasa, darpa]
  reveal_claims: [soviet-government#c1, sputnik-1#c1, sputnik-1#c2, sputnik-1#c3]
  overlay: {kind: quote, source: state-milestone-sputnik, quote: "In this way, the launch of Sputnik fueled both the space race and the arms race, in addition to increasing Cold War tensions", caption: "U.S. Department of State, Office of the Historian"}
  narration: "**Eleven years later.** The first satellite was not American. On 4 October 1957 the Soviet Union launched Sputnik 1 from the desert in Kazakhstan, and the shock in the United States led to NASA and to ARPA. Nothing here shows that the 1946 report led to any of it."
  duration: 13

- shot: strike-second
  view: graph
  focus: albert-wohlstetter
  time: "1958"
  reveal: [albert-wohlstetter, delicate-balance-of-terror, rand-corporation, cold-war]
  reveal_claims: [albert-wohlstetter#c1, albert-wohlstetter#c2]
  overlay: {kind: quote, source: rand-p-1472-wohlstetter-1958, quote: "To deter an attack means being able to strike back in spite of it. It means, in other words, a capability to strike second.", caption: "Albert Wohlstetter, The Delicate Balance of Terror, RAND, 1958"}
  narration: "**Strike second.** In 1958 Albert Wohlstetter of RAND wrote that nuclear deterrence was not automatic. One old bomb, he said, might destroy a great many modern jets and missiles on the ground. What counted was what would be left after a surprise attack."
  duration: 13

- shot: no-center
  view: graph
  focus: paul-baran
  time: "1964"
  reveal: [paul-baran, on-distributed-communications, packet-switching, rand-corporation]
  reveal_claims: [paul-baran#c1, paul-baran#c3, paul-baran#c2]
  overlay: {kind: quote, source: cbi-oh-182-baran-1990, quote: "If we could wait until after attack rather than having to respond too quickly under pressure then the world would be a more stable place.", caption: "Paul Baran, oral history, Charles Babbage Institute, 1990, p. 13"}
  narration: "**No center.** Paul Baran joined RAND in 1959. To answer an attack, or to stop a war, he reasoned, leaders would need a network that survived it. A network with a center dies with its center, so his had none: only nodes, each tied to its neighbors."
  duration: 13

- shot: in-blocks
  view: graph
  focus: packet-switching
  time: "1964"
  reveal: [packet-switching, paul-baran, on-distributed-communications]
  reveal_claims: [paul-baran#c2, paul-baran#c3]
  overlay: {kind: quote, source: wired-2001-03-baran-brand, quote: "You could chop up the network and within half a second of real-world time it would be routing traffic again.", caption: "Paul Baran to Stewart Brand, Wired, 2001"}
  narration: "**In blocks.** Every message would be cut into blocks of perhaps 1,024 bits, each finding its own way across about three times the links strictly needed. Baran called them message blocks. Donald Davies in Britain, working independently, gave them their name: packets."
  duration: 13

- shot: no-thanks
  view: graph
  focus: paul-baran
  time: "1966"
  reveal: [paul-baran, on-distributed-communications, rand-corporation]
  overlay: {kind: quote, source: cbi-oh-182-baran-1990, quote: "First, it can't possibly work, and if it did, damned if we are going to allow creation of a competitor to ourselves.", caption: "An AT&T official, as Paul Baran recalled it in 1990, p. 20"}
  narration: "**No, thanks.** In Baran's telling, the Air Force offered AT&T the money and AT&T refused. By 1966 the job was to go to the Defense Communications Agency. Baran expected it to fail, and says he stopped the plan himself. It was never built."
  duration: 12

- shot: two-letters
  view: map
  camera: {center: [-120.6, 36.6], zoom: 5.2, pitch: 20, duration: 6}
  places: [santa-monica, ucla, menlo-park]
  routes: [[ucla, menlo-park]]
  time: "1969-10-29"
  reveal: [first-arpanet-message, arpanet, ucla, stanford-research-institute, leonard-kleinrock, darpa]
  reveal_claims: [first-arpanet-message#c1, first-arpanet-message#c2, first-arpanet-message#c3, first-arpanet-message#c4, sputnik-1#c2, larry-roberts#c1]
  overlay: {kind: quote, source: kleinrock-first-words, quote: "They succeeded in transmitting the \"l\" and the \"o\" and then the system crashed!", caption: "Leonard Kleinrock, UCLA"}
  narration: "**Two letters.** ARPA paid for a different network, to let researchers share computers. At 22:30 on 29 October 1969, at UCLA, a few miles from RAND, a student tried to log in to a computer at the Stanford Research Institute. The full login worked about an hour later."
  duration: 13

- shot: what-the-builders-say
  view: graph
  focus: arpanet
  time: "1969"
  reveal: [arpanet, packet-switching, larry-roberts, leonard-kleinrock, rand-corporation]
  reveal_claims: [packet-switching#c1, larry-roberts#c1]
  overlay: {kind: quote, source: isoc-1997-brief-history-of-the-internet, quote: "It was from the RAND study that the false rumor started claiming that the ARPANET was somehow related to building a network resistant to nuclear war.", caption: "Barry Leiner, Vinton Cerf, Leonard Kleinrock, Larry Roberts and others, A Brief History of the Internet"}
  narration: "**What the builders say.** It is often said that the ARPANET was built to survive a nuclear war. Its builders call that a false rumor. In their history, the work at MIT, at RAND and at Britain's National Physical Laboratory ran in parallel, each unaware of the others."
  duration: 13

- shot: what-baran-says
  view: graph
  focus: paul-baran
  time: "1969"
  reveal: [paul-baran, arpanet, larry-roberts, packet-switching]
  reveal_claims: [paul-baran#c2, larry-roberts#c1]
  overlay: {kind: quote, source: wired-2001-03-baran-brand, quote: "But the origin of packet switching itself is very much Cold War.", caption: "Paul Baran to Stewart Brand, Wired, 2001"}
  narration: "**What Baran says.** Baran agreed: “I didn't do the ARPANET. That was Larry Roberts.” But he said Roberts had seen the RAND reports, and his calendar notes Roberts at noon on 28 February 1967, months before the conference where the builders' history has him told of it. What they discussed is not recorded."
  duration: 16

- shot: the-safe
  view: map
  camera: {center: [-118.49, 34.01], zoom: 11.6, pitch: 30, duration: 6}
  places: [santa-monica]
  time: "1969-10-01"
  reveal: [daniel-ellsberg, pentagon-papers, rand-corporation, copying-of-the-pentagon-papers, anthony-russo]
  reveal_claims: [us-government#c8, daniel-ellsberg#c1, copying-of-the-pentagon-papers#c3, copying-of-the-pentagon-papers#c1, copying-of-the-pentagon-papers#c2]
  overlay: {kind: stat, value: "7,000 pages", label: "The Pentagon Papers, in 48 boxes at the National Archives", source: nara-pentagon-papers, quote: "There are 48 boxes and approximately 7,000 declassified pages."}
  narration: "**The safe.** In 1967 Defense Secretary Robert McNamara ordered a secret history of the United States in Vietnam. RAND held two sets. On 1 October 1969, RAND's history says, its analyst Daniel Ellsberg took volumes from his office safe and, with Anthony Russo's help, began to copy them."
  duration: 14

- shot: the-court
  view: graph
  focus: new-york-times-co-v-united-states
  time: "1971-06-30"
  reveal: [new-york-times-co-v-united-states, the-new-york-times, us-supreme-court, us-government, copying-of-the-pentagon-papers]
  reveal_claims: [copying-of-the-pentagon-papers#c4, copying-of-the-pentagon-papers#c5, new-york-times-co-v-united-states#c1, new-york-times-co-v-united-states#c2, new-york-times-co-v-united-states#c3]
  overlay: {kind: quote, source: scotus-403-us-713-nyt-v-us, quote: "Any system of prior restraints of expression comes to this Court bearing a heavy presumption against its constitutional validity.", caption: "U.S. Supreme Court, New York Times Co. v. United States, 30 June 1971"}
  narration: "**The court.** The New York Times began publishing on 13 June 1971, and the government asked the courts to stop it. On 30 June the Supreme Court ruled 6 to 3 that the government had not met its burden. The papers were free to go on publishing."
  duration: 12

- shot: the-case-ends
  view: graph
  focus: daniel-ellsberg
  time: "1973-05-11"
  reveal: [daniel-ellsberg, anthony-russo, us-district-court-central-california]
  reveal_claims: [daniel-ellsberg#c2, daniel-ellsberg#c3, daniel-ellsberg#c4, anthony-russo#c2, anthony-russo#c3]
  overlay: {kind: quote, source: fjc-pentagon-papers-federal-courts-2019, quote: "The bizarre events have incurably infected the prosecution of this case.", caption: "Judge William Matthew Byrne, 11 May 1973, as printed by the Federal Judicial Center"}
  narration: "**The case ends.** Ellsberg, then Russo, were charged in Los Angeles. A charge is an accusation, not a finding of guilt. During the trial it came out that a special unit, reporting to the White House, had broken into his psychiatrist's office. On 11 May 1973 the judge dismissed all charges."
  duration: 15

- shot: leaving
  view: map
  camera: {center: [-118.45, 34.02], zoom: 11, pitch: 30, duration: 6}
  places: [santa-monica-airport, santa-monica]
  time: "1975"
  reveal: [douglas-aircraft-company, santa-monica-airport, rand-corporation]
  reveal_claims: [douglas-aircraft-company#c1, rand-corporation#c1]
  overlay: {kind: stat, value: "10,724", label: "Aircraft built at the airport plant, by the City's count", source: smgov-airport-history, quote: "Ultimately, after 50 years at the Airport, Douglas closes down its Santa Monica operation, having manufactured a total of 10,724 aircraft at the Airport plant."}
  narration: "**Leaving.** Jet work had already gone to Long Beach, after the City declined to lengthen the runway. Douglas merged with McDonnell in 1967 and left the airport in 1975. Its plant came down in 1977. RAND stayed in Santa Monica."
  duration: 12

- shot: last-call
  view: map
  camera: {center: [-118.46, 34.03], zoom: 10.8, fit: true, duration: 6}
  places: [santa-monica-airport, santa-monica, ucla]
  time: "2026"
  reveal: [santa-monica-airport, santa-monica, rand-corporation, ucla]
  reveal_claims: [santa-monica-airport#c1, rand-corporation#c1]
  overlay: {kind: quote, source: smgov-2025-09-26-closure-reaffirmed, quote: "The City of Santa Monica reaffirmed its unwavering commitment to permanently close the Santa Monica Airport at midnight on December 31, 2028, as required under a 2017 Federal Consent Decree with the Federal Aviation Administration (FAA).", caption: "City of Santa Monica, 26 September 2025"}
  narration: "**Last call.** The field that saw four biplanes off is due to close at midnight on 31 December 2028, and the City is planning a park. What came out of this town went many separate ways. Every step here shows its proof, and a connection is not evidence of influence."
  explore: true
  duration: 13
```

The people here are on the map of links too: start from [[santa-monica]] or from [[rand-corporation]], or read how the same years looked from the other side in [Thirteen Days](/c/thirteen-days/).
