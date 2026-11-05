---
uid: 01M6C2F695RX8P4ETQ4EF51ZTA
id: the-airfield-and-the-think-tank
type: chapter
title: The Airfield and the Think Tank
subtitle: How a plant in Santa Monica sent planes around the world, and how a project born inside it drew a satellite, a network and a fight over the Pentagon's own history
summary: Pilots took Douglas biplanes around the world. Arnold kept wartime researchers at work. Baran designed a network he chose not to build, and Ellsberg carried a secret history out of his safe. Their decisions reached far beyond Santa Monica.
---

Santa Monica is a beach town on the western edge of Los Angeles. For about fifty years an aircraft plant stood at its airfield, and a research group born inside that plant is still in town.

Pilots left it to attempt a flight around the world. Engineers drew up a satellite and a network that could survive an attack. An analyst took a secret history out of his safe. Their work carried this small stretch of coast into arguments over how to fight wars, how to stop them and who should know what governments had done.

```scene
- shot: one-airfield
  view: map
  camera: {center: [-118.47, 34.02], zoom: 11.2, pitch: 30, duration: 6}
  places: [santa-monica-airport]
  time: "1923"
  reveal: [santa-monica-airport, santa-monica, douglas-aircraft-company, donald-douglas]
  reveal_claims: [santa-monica-airport#c1, donald-douglas#c1, douglas-aircraft-company#c1]
  overlay: {kind: quote, source: smgov-airport-history, quote: "April 15, 1923 - The Army Air Corps dedicates Clover Field, named after World War I pilot Lt. Greayer \"Grubby\" Clover, who grew up nearby and was killed in action.", caption: "City of Santa Monica, airport history"}
  narration: "**One airfield.** Donald Douglas began building aircraft at Santa Monica's future airport in 1922, with other work in an abandoned movie studio on Wilshire Boulevard. In Roger Bilstein's history, he chose the West Coast for its geography and investors; his first offices were behind a barber shop, and employees' wives helped stitch fabric onto aircraft frames. On 15 April 1923 the Army dedicated Clover Field, naming it for Greayer Clover, a local pilot killed in the First World War. Douglas now had a factory beside the field from which his planes would leave for the world."
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
  narration: "**Four planes.** In 1923 Major General Mason Patrick took charge of planning a flight no one had completed: around the world by air. The U.S. Army Air Service ordered four biplanes from Douglas, and flight commander Frederick Martin and the other pilots each chose a mechanic to fly with them; they would have no radios or advanced navigation aids. The crews left Clover Field in March 1924 for the official start at Seattle. U.S. refusal to recognize the Soviet Union barred Siberia, adding 6,875 miles to their route through Alaska, Japan and southeast Asia."
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
  narration: "**Around the world.** Trying to catch the other crews at Dutch Harbor, Frederick Martin and his mechanic Alva Harvey left in doubtful weather and lost their way in fog. Their plane hit an Alaskan mountainside; both escaped with minor injuries, and Lowell Smith took command of the flight. Crowds welcomed the three remaining planes in Paris on Bastille Day, but Leigh Wade's Boston lost oil pressure over the North Atlantic and was damaged beyond repair while being hoisted aboard a Navy ship. Only Chicago and New Orleans of the original four reached Seattle on 28 September 1924: the Smithsonian counts 175 days for the journey that opened a way toward worldwide air transport."
  duration: 13

- shot: the-plane-that-paid
  view: map
  camera: {center: [-118.45, 34.02], zoom: 10.6, pitch: 30, duration: 6}
  places: [santa-monica-airport]
  time: "1935-12-17"
  reveal: [douglas-dc-3, douglas-aircraft-company, santa-monica-airport]
  reveal_claims: [douglas-aircraft-company#c3, douglas-aircraft-company#c1]
  overlay: {kind: stat, value: "95 percent", label: "Share of U.S. commercial airline traffic flown on DC-3s by 1938", source: nasm-douglas-dc-3, quote: "By 1938, 95 percent of all U.S. commercial airline traffic was on DC-3s."}
  narration: "**The plane that paid.** American Airlines president C. R. Smith sought a bigger, more comfortable sleeper. Bilstein recounts a two-hour call in 1934: Smith persuaded Donald Douglas to build it, promising a $4 million order his airline lacked cash or credit to pay. Bilstein says Smith then secured a $4.5 million Reconstruction Finance Corporation loan: government money helped the DC-3 take wing. The sleeper first flew on 17 December 1935. Smith later said, “It was the first airplane in the world that could make money just by hauling passengers”. Passenger revenue could cover operations; buying the planes had required federal financing. In the coming war, the City counts up to 44,000 Douglas workers, working three shifts, seven days a week."
  duration: 13

- shot: a-project-inside-the-plant
  view: graph
  lens: all
  focus: project-rand
  time: "1946"
  reveal: [project-rand, douglas-aircraft-company, henry-h-arnold, donald-douglas, frank-collbohm, santa-monica]
  reveal_claims: [henry-h-arnold#c1, project-rand#c1, project-rand#c2, frank-collbohm#c2]
  overlay: {kind: stat, value: "$640", label: "What Project RAND spent in its first month", source: rand-cp-537-ware-2008, quote: "Project RAND commenced operations in December 1945, expending a total of $640 in its first month of operation."}
  narration: "**A project inside the plant.** As the war ended, General Henry Arnold warned the secretary of war that the military had not secured the continued teamwork of scientists, industry and universities: planning had to precede research by years. On 1 October 1945 he met Donald Douglas and others at Hamilton Field to set up Project RAND for long-range planning. It spent $640 that December; a March 1946 contract put Frank Collbohm in charge in a separate part of the Douglas plant. RAND's histories differ over who first proposed it and whether its beginning belongs to 1945 or 1946, but the contract gave wartime researchers a place to keep working."
  duration: 14

- shot: three-weeks
  view: map
  camera: {globe: true, center: [-118.45, 25], zoom: 1.8, duration: 6}
  places: [santa-monica]
  time: "1946-05-02"
  reveal: [world-circling-spaceship-report, project-rand, santa-monica]
  reveal_claims: [project-rand#c4, henry-h-arnold#c1]
  overlay: {kind: quote, source: rand-sm-11827-report, quote: "The achievement of a satellite craft by the United States would inflame the imagination of mankind, and would probably produce repercussions in the world comparable to the explosion of the atomic bomb.", caption: "Preliminary Design of an Experimental World-Circling Spaceship, 2 May 1946, p. 2"}
  narration: "**Three weeks.** Major General Curtis LeMay asked the new project for a satellite study and gave it three weeks. The engineers at Douglas delivered their first report on 2 May 1946: an experimental world-circling spaceship, costing about $150 million and taking about five years to build and launch. They described scientific measurements and military value, then made their case for its impact: a U.S. satellite “would inflame the imagination of mankind”, with repercussions comparable to the atomic bomb. They had put an orbiting craft into an engineering proposal, eleven years before anyone launched one."
  duration: 14

- shot: on-its-own
  view: graph
  focus: rand-corporation
  time: "1948"
  reveal: [rand-corporation, project-rand, douglas-aircraft-company, ford-foundation, frank-collbohm]
  reveal_claims: [project-rand#c3, frank-collbohm#c1, ford-foundation#c1]
  overlay: {kind: quote, source: rand-cp-537-ware-2008, quote: "Among others was the reluctance of other companies to share their corporate secrets and plans with Douglas—a potential competitor.", caption: "Willis Ware, RAND and the Information Evolution, 2008, p. 8"}
  narration: "**On its own.** Frank Collbohm directed a research project inside an aircraft maker. Willis Ware's history attributes its separation partly to other companies' reluctance to share secrets with Douglas, a potential competitor. RAND moved from the plant to downtown Santa Monica in 1947; in February 1948 the Air Force approved its separation from Douglas. Collbohm signed the incorporation papers and became the independent nonprofit's first president. With $1 million secured through a Ford Foundation loan and guarantee, the researchers could now work outside any manufacturer's corporate walls."
  duration: 14

- shot: a-game-for-two
  view: graph
  focus: prisoners-dilemma
  time: "1950"
  reveal: [prisoners-dilemma, merrill-flood, melvin-dresher, rand-corporation]
  reveal_claims: [merrill-flood#c2, melvin-dresher#c2, merrill-flood#c1, melvin-dresher#c1]
  overlay: {kind: quote, source: sep-prisoners-dilemma, quote: "The “dilemma” faced by the prisoners here is that, whatever the other does, each is better off confessing than remaining silent.", caption: "Stanford Encyclopedia of Philosophy, Prisoner's Dilemma"}
  narration: "**A game for two.** At RAND in early 1950, Merrill Flood and Melvin Dresher persuaded two colleagues to play the same game a hundred times. As the Stanford Encyclopedia of Philosophy explains, they were testing whether players unable to make binding agreements would learn to settle on choices neither could improve alone. Each could gain by betraying the other, although cooperation would leave both better off. Albert Tucker later turned the payoffs into prison sentences to explain the problem to Stanford psychologists, giving the experiment the story now known as the prisoner's dilemma."
  duration: 13

- shot: eleven-years-later
  view: map
  camera: {globe: true, center: [62, 48], zoom: 1.7, duration: 7}
  places: [kazakhstan]
  borders: [soviet-union]
  time: "1957-10-04"
  reveal: [sputnik-1, world-circling-spaceship-report, soviet-government, kazakhstan, nasa, darpa]
  reveal_claims: [soviet-government#c1, sputnik-1#c1, sputnik-1#c2, sputnik-1#c3]
  overlay: {kind: quote, source: nasa-sputnik-origins, quote: "While President Eisenhower and other leaders of his administration also congratulated the Soviets and tried to downplay the importance of the accomplishment, they misjudged the public reaction to the event.", caption: "Roger D. Launius, NASA, Sputnik and the Origins of the Space Age"}
  narration: "**Eleven years later.** President Dwight Eisenhower congratulated the Soviets and played down their achievement after Sputnik 1 became the first satellite on 4 October 1957, launched from the desert in Kazakhstan. The American reaction outran that reassurance: NASA's history describes a public alarm his administration had misjudged. On 4 February 1958 he asked science adviser James Killian for a plan for a new space organization. The shock of the Soviet launch helped bring NASA and ARPA into being, expanding the government's machinery for research beyond the military services."
  duration: 13

- shot: strike-second
  view: graph
  focus: albert-wohlstetter
  time: "1958"
  reveal: [albert-wohlstetter, delicate-balance-of-terror, rand-corporation, cold-war]
  reveal_claims: [albert-wohlstetter#c1, albert-wohlstetter#c2]
  overlay: {kind: quote, source: rand-p-1472-wohlstetter-1958, quote: "To deter an attack means being able to strike back in spite of it. It means, in other words, a capability to strike second.", caption: "Albert Wohlstetter, The Delicate Balance of Terror, RAND, 1958"}
  narration: "**Strike second.** In 1958, after Sputnik, Albert Wohlstetter challenged the reassurance that two nuclear powers would automatically keep each other from attacking. One outmoded bomb from an obsolete bomber, he warned, could destroy a great many modern jets and missiles before they left the ground. He urged policymakers to judge forces by what could survive: “To deter an attack means being able to strike back in spite of it.” For the RAND analyst, buying more weapons would not settle the question; leaders also had to protect the means to give an order after the first attack."
  duration: 13

- shot: no-center
  view: graph
  focus: paul-baran
  time: "1964"
  reveal: [paul-baran, on-distributed-communications, packet-switching, rand-corporation]
  reveal_claims: [paul-baran#c1, paul-baran#c3, paul-baran#c2]
  overlay: {kind: quote, source: cbi-oh-182-baran-1990, quote: "If we could wait until after attack rather than having to respond too quickly under pressure then the world would be a more stable place.", caption: "Paul Baran, oral history, Charles Babbage Institute, 1990, p. 13"}
  narration: "**No center.** After joining RAND in 1959, Paul Baran worked on a network that would let leaders wait through an attack and still communicate. In his 1990 oral history, he explained why: “If we could wait until after attack rather than having to respond too quickly under pressure then the world would be a more stable place.” He later recalled that they emphasized orders to fire missiles while playing down the network's use in cooling a war or arranging surrender, a subject Congress had forbidden defense researchers to study. By 1964 his design dispensed with a vulnerable center: neighboring nodes would carry the orders even after parts of the network were destroyed."
  duration: 13

- shot: in-blocks
  view: graph
  focus: packet-switching
  time: "1964"
  reveal: [packet-switching, paul-baran, on-distributed-communications]
  reveal_claims: [paul-baran#c2, paul-baran#c3]
  overlay: {kind: quote, source: wired-2001-03-baran-brand, quote: "You could chop up the network and within half a second of real-world time it would be routing traffic again.", caption: "Paul Baran to Stewart Brand, Wired, 2001"}
  narration: "**In blocks.** Baran's design cut each message into blocks of perhaps 1,024 bits, letting each find its own way through the network. He found that roughly three times the minimum number of links could keep surviving nodes connected; in his later recollection, a damaged network could route traffic again within half a second. Telephone engineers demanded proof, he recalled, so he ran simulations and designed the switching hardware on paper to show it need not be prohibitively expensive. He called the pieces message blocks; Donald Davies independently devised a similar system in Britain and supplied the name that stuck: packets."
  duration: 13

- shot: no-thanks
  view: graph
  focus: paul-baran
  time: "1966"
  reveal: [paul-baran, on-distributed-communications, rand-corporation]
  reveal_claims: [paul-baran#c3]
  overlay: {kind: quote, source: cbi-oh-182-baran-1990, quote: "First, it can't possibly work, and if it did, damned if we are going to allow creation of a competitor to ourselves.", caption: "An AT&T official, as Paul Baran recalled it in 1990, p. 20"}
  narration: "**No, thanks.** Baran recalled the Air Force offering AT&T the money to build his network and the company refusing: its officials said it could not work and would compete with their own system. By 1966 the Pentagon was assigning the job to the Defense Communications Agency, which Baran judged unable to handle digital technology. He recalled agreeing with a Pentagon official to stop the funding: a botched attempt, he feared, would give detractors proof that the idea was impossible and make another try difficult. “That was a hard decision”, he said in 1990; the network he had spent years designing was never built."
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
  narration: "**Two letters.** At 22:30 on 29 October 1969, UCLA programmer Charley Kline tried to log in to a computer at the Stanford Research Institute, where Bill Duvall was at the other end. Leonard Kleinrock supervised the experiment a few miles from RAND: ARPA had paid for this different network so researchers could share computers. Kline transmitted the first two letters of login, and the system crashed. About an hour later the full login worked, turning a proposal for shared machines into a connection people could use."
  duration: 13

- shot: what-the-builders-say
  view: graph
  focus: arpanet
  time: "1969"
  reveal: [arpanet, packet-switching, larry-roberts, leonard-kleinrock, rand-corporation]
  reveal_claims: [packet-switching#c1, larry-roberts#c1]
  overlay: {kind: quote, source: isoc-1997-brief-history-of-the-internet, quote: "It was from the RAND study that the false rumor started claiming that the ARPANET was somehow related to building a network resistant to nuclear war.", caption: "Barry Leiner, Vinton Cerf, Leonard Kleinrock, Larry Roberts and others, A Brief History of the Internet"}
  narration: "**What the builders say.** Larry Roberts went to ARPA in late 1966 to develop a network for sharing computers, and presented his plan in 1967. In the history he later wrote with fellow builders, Britain's Roger Scantlebury told him at that conference about the British work and Baran's RAND studies; research at MIT, RAND and Britain's National Physical Laboratory had proceeded in parallel, each unaware of the others. They call the familiar story that ARPANET was built to survive nuclear war a false rumor arising from RAND's separate study. Roberts's team adopted the British word packet and raised the planned line speed from 2.4 to 50 kilobits per second as it moved toward construction."
  duration: 13

- shot: what-baran-says
  view: graph
  focus: paul-baran
  time: "1969"
  reveal: [paul-baran, arpanet, larry-roberts, packet-switching]
  reveal_claims: [paul-baran#c2, larry-roberts#c1]
  overlay: {kind: quote, source: wired-2001-03-baran-brand, quote: "But the origin of packet switching itself is very much Cold War.", caption: "Paul Baran to Stewart Brand, Wired, 2001"}
  narration: "**What Baran says.** Asked in 1990 about Roberts's visits, Baran cited his calendar: noon on 28 February 1967, before the conference where, the builders later wrote, Scantlebury told Roberts about RAND. He said Roberts had seen the reports; his calendar notation gives no meeting subject. In that oral history, Baran recalled telling an earlier gathering: “I didn't do the ARPANET. That was Larry Roberts.” In his 2001 Wired interview, he insisted on documentation: “I don't believe anything unless I can find it in writing, in contemporaneous documentation.” He agreed that ARPANET was not built for nuclear war, while insisting packet switching's origins were in the Cold War."
  duration: 16

- shot: the-safe
  view: map
  camera: {center: [-118.49, 34.01], zoom: 11.6, pitch: 30, duration: 6}
  places: [santa-monica]
  time: "1969-10-01"
  reveal: [daniel-ellsberg, pentagon-papers, rand-corporation, copying-of-the-pentagon-papers, anthony-russo]
  reveal_claims: [us-government#c8, daniel-ellsberg#c1, copying-of-the-pentagon-papers#c3, copying-of-the-pentagon-papers#c1, copying-of-the-pentagon-papers#c2, copying-of-the-pentagon-papers#c6]
  overlay: {kind: stat, value: "7,000 pages", label: "The Pentagon Papers, in 48 boxes at the National Archives", source: nara-pentagon-papers, quote: "There are 48 boxes and approximately 7,000 declassified pages."}
  narration: "**The safe.** By Daniel Ellsberg's later account, as Mai Elliott reports, on 1 October 1969 he took the 1964–1965 volumes of the Pentagon's Vietnam history from his RAND office safe. Defense Secretary Robert McNamara had commissioned the secret study in 1967, and RAND held two sets; Ellsberg and Anthony Russo began copying, and Ellsberg worked alone until 5:30 the next morning. In a 1973 interview, Ellsberg said he sought a change in Vietnam policy. Successive presidents, he argued, had treated postponing admission of failure as success; people outside the executive branch needed to read the history to learn a different lesson: “So the papers had to leave my safe.”"
  duration: 14

- shot: the-court
  view: graph
  focus: new-york-times-co-v-united-states
  time: "1971-06-30"
  reveal: [new-york-times-co-v-united-states, the-new-york-times, us-supreme-court, us-government, copying-of-the-pentagon-papers]
  reveal_claims: [copying-of-the-pentagon-papers#c4, copying-of-the-pentagon-papers#c5, new-york-times-co-v-united-states#c1, new-york-times-co-v-united-states#c2, new-york-times-co-v-united-states#c3]
  overlay: {kind: quote, source: scotus-403-us-713-nyt-v-us, quote: "Any system of prior restraints of expression comes to this Court bearing a heavy presumption against its constitutional validity.", caption: "U.S. Supreme Court, New York Times Co. v. United States, 30 June 1971"}
  narration: "**The court.** After The New York Times began publishing on 13 June 1971, President Richard Nixon decided to ask the courts to stop it; the Federal Judicial Center describes his belief that stopping publication was necessary to protect classified information. His government's lawyers argued that disclosure could harm negotiations, allies and prisoners of war. Justice Hugo Black called the restraint “a flagrant, indefensible, and continuing violation of the First Amendment.” On 30 June the Supreme Court ruled 6 to 3 that the government had failed to meet its burden, and the newspapers could resume publication."
  duration: 12

- shot: the-case-ends
  view: graph
  focus: daniel-ellsberg
  time: "1973-05-11"
  reveal: [daniel-ellsberg, anthony-russo, us-district-court-central-california]
  reveal_claims: [daniel-ellsberg#c2, daniel-ellsberg#c3, daniel-ellsberg#c4, anthony-russo#c2, anthony-russo#c3]
  overlay: {kind: quote, source: fjc-pentagon-papers-federal-courts-2019, quote: "The bizarre events have incurably infected the prosecution of this case.", caption: "Judge William Matthew Byrne, 11 May 1973, as printed by the Federal Judicial Center"}
  narration: "**The case ends.** Judge William Matthew Byrne was presiding in Los Angeles over the prosecution of Ellsberg and Russo when officials disclosed that a special unit reporting to the White House had broken into Ellsberg's psychiatrist's office in search of his records. Ellsberg had been charged first and Russo added later; both now faced a trial compromised by the government's conduct. Byrne said he preferred to let a jury resolve the charges, but that conduct had made a fair resolution impossible. On 11 May 1973 he dismissed every charge and barred a retrial, ending the prosecution without a finding of guilt."
  duration: 15

- shot: leaving
  view: map
  camera: {center: [-118.45, 34.02], zoom: 11, pitch: 30, duration: 6}
  places: [santa-monica-airport, santa-monica]
  time: "1975"
  reveal: [douglas-aircraft-company, santa-monica-airport, rand-corporation]
  reveal_claims: [douglas-aircraft-company#c1, rand-corporation#c1]
  overlay: {kind: stat, value: "10,724", label: "Aircraft built at the airport plant, by the City's count", source: smgov-airport-history, quote: "Ultimately, after 50 years at the Airport, Douglas closes down its Santa Monica operation, having manufactured a total of 10,724 aircraft at the Airport plant."}
  narration: "**Leaving.** Bilstein recounts that, after lenders refused further credit, Donald Douglas went to New York with his son seeking money, but Laurance Rockefeller cancelled their meeting when he realized the younger Douglas was accompanying him. The company merged with McDonnell in 1967, and the elder Douglas lost control of the firm bearing his name. Jet manufacturing had already moved to Long Beach after Santa Monica declined a longer runway; in 1975 Douglas left the airport to consolidate its operations there. The plant came down in 1977, after 10,724 aircraft by the City's count; RAND stayed in Santa Monica as the factory site passed to other uses."
  duration: 12

- shot: last-call
  view: map
  camera: {center: [-118.46, 34.03], zoom: 10.8, fit: true, duration: 6}
  places: [santa-monica-airport, santa-monica, ucla]
  time: "2026"
  reveal: [santa-monica-airport, santa-monica, rand-corporation, ucla]
  reveal_claims: [santa-monica-airport#c1, rand-corporation#c1]
  overlay: {kind: quote, source: smgov-2025-09-26-closure-reaffirmed, quote: "The City of Santa Monica reaffirmed its unwavering commitment to permanently close the Santa Monica Airport at midnight on December 31, 2028, as required under a 2017 Federal Consent Decree with the Federal Aviation Administration (FAA).", caption: "City of Santa Monica, 26 September 2025"}
  narration: "**Last call.** In September 2025, city manager Oliver Chi faced residents' concerns about proposed JSX flights as Santa Monica prepared to turn its airport into a park. The Airport Commission recommended delaying approval for further study. Chi said the 2017 consent decree required the City to allow qualifying aviation uses until closure: “To reach closure, the City must comply with the Consent Decree”. If approved, the proposed lease would end in November 2028, before the airfield that sent off the four biplanes is due to close at midnight on 31 December 2028. Chi's stated route to a park required keeping the airport open through its remaining years, with noise limits and operating hours still in force."
  explore: true
  duration: 13
```

The people here are on the map of links too: start from [[santa-monica]] or from [[rand-corporation]], or read how the same years looked from the other side in [Thirteen Days](/c/thirteen-days/).
