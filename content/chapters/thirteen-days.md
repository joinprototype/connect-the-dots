---
uid: 01M53TK2R9Z3R2GJX66K74MJ35
id: thirteen-days
type: chapter
title: Thirteen Days, Two Stories
subtitle: The Cuban Missile Crisis as Washington and Moscow told it, and the threads that run from it to scripture and to SpaceX
summary: In October 1962 two governments told two different stories about the same crisis. Their own records still agree on how it ended.
---

In October 1962 the United States and the Soviet Union came closer to nuclear war than at any other moment of the Cold War. Each government explained the crisis to its own public in its own way. This chapter follows both accounts side by side, then what the records of both sides confirm, and then some of the less obvious lines that lead out of those thirteen days.

Every line drawn below is a sourced link. Lines marked "according to" are one side's account, not established fact.

```scene
- shot: open
  view: map
  camera: {globe: true, center: [-40, 35], zoom: 1.6, duration: 6}
  places: [cuba, washington-dc, moscow, turkey]
  time: "1962-10-16"
  reveal: [cuban-missile-crisis]
  narration: "16 October 1962. In Washington, President Kennedy is briefed on Soviet missile sites under construction in Cuba. For the next thirteen days Washington, Moscow, Havana and, less visibly, Turkey are at the center of the world."
  duration: 8

- shot: us-story
  view: map
  camera: {center: [-79, 26], zoom: 4.2, pitch: 30, duration: 4}
  perspective: us-government
  places: [cuba, washington-dc]
  routes: [[moscow, cuba]]
  reveal: [cuban-missile-crisis, operation-anadyr, john-f-kennedy]
  reveal_claims: [cuban-missile-crisis#c1]
  overlay: {kind: quote, source: jfk-address-1962-10-22, quote: "Within the past week, unmistakable evidence has established the fact that a series of offensive missile sites is now in preparation on that imprisoned island.", caption: "John F. Kennedy, television address, 22 October 1962"}
  narration: "**The US story.** On 22 October Kennedy told the nation that offensive missile sites were being built in Cuba. According to the US government, the crisis was caused by this secret Soviet deployment, which Moscow had code-named Operation Anadyr."
  duration: 10

- shot: soviet-story
  view: map
  camera: {center: [36, 44], zoom: 3.6, pitch: 30, duration: 4}
  perspective: soviet-government
  places: [turkey, moscow]
  routes: [[turkey, moscow]]
  reveal: [jupiter-deployment-turkey, jupiter-missile, nikita-khrushchev]
  reveal_claims: [cuban-missile-crisis#c2]
  overlay: {kind: quote, source: frus-1961-63-v06-d66, quote: "Your missiles are located in Turkey. You are disturbed over Cuba. You say that this disturbs you because it is 90 miles by sea from the coast of the United States of America. But Turkey adjoins us; our sentries patrol back and forth and see each other.", caption: "Nikita Khrushchev to John F. Kennedy, 27 October 1962"}
  narration: "**The Soviet story.** On 27 October Khrushchev answered with a different map: US Jupiter missiles already stood in Turkey, on the Soviet border. According to the Soviet government, that deployment was the real cause of the crisis."
  duration: 10
```

The two accounts disagree about the cause. A third voice spoke to both sides at once.

```scene
- shot: popes-appeal
  view: graph
  focus: pope-john-xxiii
  time: "1962-10-25"
  reveal: [pope-john-xxiii, catholic-church, john-f-kennedy, cuban-missile-crisis]
  reveal_claims: [pope-john-xxiii#c1, pope-john-xxiii#c2, john-f-kennedy#c2]
  overlay: {kind: source, source: vatican-message-1962-10-25, caption: "Pope John XXIII, radio message for peace, 25 October 1962"}
  narration: "On 25 October Pope John XXIII made a radio appeal for peace to the leaders of both blocs. He headed the Catholic Church, of which Kennedy was a member; the Holy See later recalled the appeal as a plea made with humanity \"on the brink of an atomic world war\"."
  duration: 9

- shot: what-both-confirm
  view: graph
  focus: jupiter-withdrawal-1963
  time: "1963-04"
  reveal: [cuban-missile-crisis, jupiter-withdrawal-1963, jupiter-missile, turkey]
  reveal_claims: [cuban-missile-crisis#c3]
  overlay: {kind: quote, source: dobrynin-cable-1962-10-27, quote: "“I think that in order to withdraw these bases from Turkey,” R. Kennedy said, “we need 4-5 months.”", caption: "Soviet record: Ambassador Dobrynin's cable to Moscow, 27 October 1962"}
  narration: "**What both sides confirm.** Robert Kennedy's memo and Ambassador Dobrynin's cable, written for rival governments, both record that the missiles in Turkey were part of the settlement. The Jupiters came out in April 1963, so this link carries sources from both perspectives."
  explore: true
  duration: 10

- shot: the-hotline
  view: map
  camera: {center: [-20, 52], zoom: 1.8, duration: 5}
  time: "1963-06-20"
  places: [washington-dc, moscow]
  routes: [[washington-dc, moscow]]
  reveal: [moscow-washington-hotline]
  reveal_claims: [cuban-missile-crisis#c4, moscow-washington-hotline#c1]
  overlay: {kind: quote, source: state-hotline-mou-1963, quote: "The Cuban missile crisis of October 1962 compellingly underscored the importance of prompt, direct communication between heads of state.", caption: "US Department of State"}
  narration: "During the crisis the two leaders struggled to read each other's intentions. In June 1963 their governments agreed on a direct link between Washington and Moscow, the hotline, which began as a teletype circuit rather than a telephone."
  duration: 9

- shot: pacem-in-terris
  view: timeline
  lens: history
  time: "1963-04-11"
  reveal: [pacem-in-terris, jupiter-withdrawal-1963, moscow-washington-hotline]
  reveal_claims: [pope-john-xxiii#c3]
  narration: "Spring 1963 closes the story. The Jupiters leave Turkey in April; on 11 April the Pope issues the encyclical *Pacem in Terris*, addressed to \"all men of good will\"; the hotline agreement follows in June."
  duration: 8
```

The crisis did not stay in 1962. The same weapons, people and institutions connect to stories that seem to have nothing to do with it.

```scene
- shot: the-long-tail
  view: graph
  lens: all
  focus: elon-musk
  reveal: [jupiter-missile, wernher-von-braun, marshall-space-flight-center, nasa, spacex, elon-musk]
  reveal_claims: [wernher-von-braun#c1, wernher-von-braun#c2, wernher-von-braun#c3, nasa#c1, elon-musk#c1]
  narration: "**The long tail.** The Jupiter was developed under Wernher von Braun, who in 1960 moved to NASA as first director of the Marshall Space Flight Center. In 2006 NASA funded a young company, SpaceX, founded by Elon Musk in 2002. Each line is a sourced link, not a judgment."
  explore: true
  duration: 10

- shot: closing-threads
  view: graph
  lens: all
  focus: catholic-church
  reveal: [johannes-gutenberg, gutenberg-bible, bible, christianity, catholic-church, pope-john-xxiii, cuban-missile-crisis]
  reveal_claims: [johannes-gutenberg#c1, gutenberg-bible#c1, bible#c1, catholic-church#c1, pope-john-xxiii#c1, pope-john-xxiii#c2]
  narration: "One more thread. Around 1455 Johannes Gutenberg printed the Latin Bible in Mainz, the scripture of Christianity, whose largest church was led in 1962 by the Pope who appealed for peace. A connection is not evidence of influence, but every step of it can be checked."
  explore: true
  duration: 10
```

Explore further: open any shot in the explorer, switch the perspective between the US and Soviet governments, and compare which claims each side makes.
