---
uid: 01M6DTEFRD3YS76D4W4BCF997Q
id: the-max
type: chapter
title: The MAX
subtitle: How Boeing and the FAA put the 737 MAX into service, and what two crashes exposed
summary: "A decision about engines led Boeing to add flight-control software to the 737 MAX. Two crashes killed 346 people. Investigators traced the software, the training pilots received and the decision to keep flying after Lion Air. Boeing admitted fraud, and families fought to be heard in the criminal case."
---

A replacement engine changed how the Boeing 737 MAX flew. Boeing added software to correct it, and the FAA approved the plane. When Lion Air 610 crashed, U.S. regulators warned crews how to respond if the controls moved on their own and kept the MAX flying while Boeing worked on a fix. Four months later Ethiopian Airlines 302 crashed before the fix was ready.

```scene
- shot: the-answer
  view: graph
  focus: reed-oconnor
  time: "2022-10-21"
  reveal: [reed-oconnor, boeing, lion-air-flight-610, ethiopian-airlines-flight-302, us-department-of-justice, united-states-v-boeing]
  reveal_claims: [boeing#c3, boeing#c5, reed-oconnor#c1]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "Boeing, through Boeing Employee-1 and Boeing Employee-2, knowingly, and with intent to defraud, conspired to defraud the FAA AEG.", caption: "Boeing’s January 2021 admission. The AEG is the FAA office that sets pilot-training requirements."}
  narration: "**How did a system designed to get the MAX through an airworthiness test help kill 346 people?** Judge Reed O’Connor had to decide whether the families of 189 people killed on Lion Air 610 and 157 on Ethiopian Airlines 302 qualified as crime victims. He found that Boeing’s fraud deprived both crews of training that would have let them recover from repeated commands pushing the nose down. The choices that put that system in their planes began with a call about engines."
  duration: 13

- shot: a-fix-for-the-engines
  view: graph
  focus: maneuvering-characteristics-augmentation-system
  time: "2011-08"
  reveal: [boeing, boeing-737-max, maneuvering-characteristics-augmentation-system]
  reveal_claims: [boeing#c2, boeing#c3]
  overlay: {kind: quote, source: house-ti-737-max-final-report-2020, quote: "I don’t think we will re-engine the 737.", caption: "James Albaugh, Boeing’s commercial-airplanes chief, to employees, 14 January 2011, quoted in the House Democratic staff report; in August he publicly promoted the re-engined 737"}
  narration: "**Boeing picks a bigger engine.** In January 2011, Boeing’s commercial-airplanes chief James Albaugh saw little business case for re-engining the 737. That spring, the New York Times reported, American Airlines chief Gerard Arpey warned Boeing’s Jim McNerney that Airbus was about to win a major order. House investigators traced Boeing’s reversal to that call. Updating the 737 let Boeing offer a rival jet sooner and at lower development cost. Albaugh was publicly promising lower operating costs by August. The larger engines and their placement made the nose pitch up in a tight, high-speed turn used to test airworthiness. Boeing built software to push the nose down by moving the horizontal stabilizer. It called the system MCAS, short for Maneuvering Characteristics Augmentation System."
  duration: 13

- shot: what-training-was-worth
  view: graph
  focus: boeing-deferred-prosecution-agreement-2021
  time: "2013/2015-06"
  reveal: [boeing, faa, maneuvering-characteristics-augmentation-system, mark-forkner, boeing-deferred-prosecution-agreement-2021]
  reveal_claims: [boeing#c3, mark-forkner#c1]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "if we lose Level B [it] will be thrown squarely on my shoulders.", caption: "Boeing Employee-1, an internal email of December 2014, quoted in the facts Boeing admitted in 2021"}
  narration: "**A simulator could cost millions.** Boeing admitted it sought Level B to cut airlines’ costs. Pilots could do it on a computer in hours. Level D required a full-flight simulator. In 2013, House staff found, Boeing chose to describe MCAS as an addition to an existing trim system to limit the impact on certification and training. Under its deal with Southwest, simulator training could cost Boeing at least $1 million per jet. The chief technical pilot imagined taking the blame in a private email in December 2014. “Who cost Boeing tens of millions of dollars!” In June 2015, he and other Boeing staff told the FAA’s training office that MCAS could activate only in a high-speed turn. Boeing’s test pilots were about to give the company a reason to widen that range."
  duration: 13

- shot: shocker-alert
  view: graph
  focus: boeing-deferred-prosecution-agreement-2021
  time: "2016-03-30/2016-11-15"
  reveal: [boeing, faa, mark-forkner, maneuvering-characteristics-augmentation-system, boeing-deferred-prosecution-agreement-2021]
  reveal_claims: [boeing#c3, boeing#c5, mark-forkner#c1]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "so I basically lied to the regulators (unknowingly)", caption: "Boeing’s chief technical pilot, “Boeing Employee-1,” in a chat of 15 November 2016, quoted in the agreed facts"}
  narration: "**Boeing widens MCAS.** To meet stall-handling requirements, Boeing approved low-speed activation on 30 March 2016 and raised maximum stabilizer movement from 0.6 to 2.5 degrees. Hours later, House staff found, chief technical pilot Mark Forkner asked the FAA to remove MCAS from Boeing’s flight crew manual, saying it “only operates WAY outside of the normal operating envelope”. The FAA agreed. House staff identified Forkner as the pilot who wrote in November that MCAS seemed to activate at low speed, as a simulator engineer suspected. His colleague replied, “it wasn’t a lie, no one told us that was the case”. Boeing’s corporate admission says it later concealed the expansion from the training office through two employees identified by number, to protect Level B. Other Boeing staff disclosed the change to FAA airworthiness officials."
  duration: 13

- shot: what-the-faa-approved
  view: graph
  focus: delegation-of-737-max-certification-tasks
  time: "2017-01/2017-07-05"
  reveal: [delegation-of-737-max-certification-tasks, faa, boeing, boeing-737-max, maneuvering-characteristics-augmentation-system]
  reveal_claims: [delegation-of-737-max-certification-tasks#c1, delegation-of-737-max-certification-tasks#c2, boeing#c3]
  overlay: {kind: stat, value: "79 of 91", label: "Certification plans the FAA had delegated to Boeing by November 2016, by the Democratic staff’s count", source: house-ti-737-max-final-report-2020, quote: "by November 2016, four months prior to FAA certification of the 737 MAX, the FAA had delegated 79 of 91 certification plans to Boeing, nearly 90 percent of its certification related tasks."}
  narration: "**The FAA signs off.** House staff counted 28 of 87 certification plans delegated to Boeing in 2013 and 79 of 91 by November 2016. In a Boeing survey, 39 percent of employees doing delegated work who replied reported perceiving undue pressure. In January 2017 Boeing renewed its request that the FAA’s training office delete MCAS from its own report, and the office agreed based on Boeing’s misleading description, Boeing later admitted. On 8 March the FAA certified the aircraft with MCAS taking its cue from one of two sensors that measure the angle of the oncoming air. The MAX entered passenger service in May. Around 5 July the training office published the separate report carrying its Level B determination. The report, airline manuals and training materials all left out MCAS."
  duration: 13

- shot: jakarta
  view: map
  camera: {center: [106.8456, -6.2088], zoom: 8.6, pitch: 0, duration: 6}
  places: [jakarta]
  time: "2018-10-28/2018-10-29"
  reveal: [lion-air-flight-610, lion-air, knkt, jakarta]
  reveal_claims: [lion-air-flight-610#c1, lion-air-flight-610#c5]
  overlay: {kind: stat, value: "189", label: "People on board Lion Air flight 610, by Indonesia’s investigators", source: knkt-pk-lqp-final-report-2019, quote: "The number of persons onboard the aircraft was 189 consisted of two pilots, six flight attendants, and 181 passengers including one engineer."}
  narration: "**Eleven minutes from Jakarta.** On 28 October, an off-duty pilot riding in the jump seat helped a Lion Air crew regain control by advising them to cut power to the stabilizer trim. After landing, the captain reported conflicting speed and altitude readings but omitted the shaking control column, the cutout and the trouble controlling the jet. Indonesia’s investigators found that the duty pilot treated it as routine, sought no details and never followed up with safety staff. The next crew took off on 29 October without that warning. A faulty sensor triggered more than 20 nose-down commands, by House staff’s count. About 11 minutes after takeoff, Lion Air 610 hit the Java Sea, killing all 189 aboard. A rescue diver died trying to recover the dead."
  duration: 13

- shot: between-the-crashes
  view: graph
  focus: ethiopian-airlines-flight-302
  time: "2018-11/2018-12"
  reveal: [lion-air-flight-610, faa, boeing, maneuvering-characteristics-augmentation-system]
  reveal_claims: [boeing#c5, lion-air-flight-610#c5]
  overlay: {kind: stat, value: "15 additional fatal crashes, over 2,900 deaths", label: "The FAA’s lifetime forecast with the emergency directive in place and MCAS still unfixed, as reported by House staff", source: house-ti-737-max-final-report-2020, quote: "In December 2018, the FAA conducted a risk assessment based on its Transport Aircraft Risk Assessment Methodology (TARAM) and estimated that without a fix to MCAS, during the lifetime of the 737 MAX fleet, there could potentially be 15 additional fatal crashes resulting in over 2,900 deaths."}
  narration: "**The FAA warns crews and keeps the MAX flying.** After Lion Air, Boeing’s bulletin and the FAA’s emergency directive told crews how to stop unwanted tail movement. Both omitted MCAS. FAA chief Stephen Dickson later said the FAA dropped the name to focus crews on recognizing runaway trim. Boeing admitted an employee misled the training office by saying both sides had discussed and agreed to the earlier deletion while concealing that Boeing had withheld the wider range. In December, House staff reported, the FAA forecast about 15 additional fatal crashes and over 2,900 deaths over the fleet’s lifetime even with the directive in place if MCAS stayed unfixed, roughly one crash every two years. The FAA kept the MAX flying while it worked with Boeing on a fix expected by July 2019."
  duration: 13

- shot: addis-ababa
  view: map
  camera: {center: [38.7578, 9.0054], zoom: 9.6, pitch: 0, duration: 6}
  places: [addis-ababa]
  time: "2019-03-10"
  reveal: [ethiopian-airlines-flight-302, paul-njoroge, addis-ababa]
  reveal_claims: [ethiopian-airlines-flight-302#c3, ethiopian-airlines-flight-302#c6]
  overlay: {kind: quote, source: eaib-et-avj-final-report-2022, quote: "OK keep with me", caption: "The captain of Ethiopian Airlines 302 after the first officer tried the trim by hand, 10 March 2019"}
  narration: "**The captain asks to turn back.** With the fix still pending, Paul Njoroge tracked his family from Toronto to Addis Ababa and went to bed expecting to check in the next day. His wife Carolyne, children Ryan, 6, Kelli, 4, and Rubi, 9 months, and mother-in-law Ann boarded Ethiopian Airlines 302 for Nairobi. Ethiopian investigators found that the crew cut power to the stabilizer trim after MCAS activated. Hand trimming failed, and the captain asked to return. Two brief electric trim inputs showed the switches were back to normal. At 05:43:21 MCAS pushed the nose down again. Six minutes after takeoff the jet hit a field, killing all 157 aboard. Njoroge later told Congress, “I miss their laughter, their playfulness, their touch.”"
  duration: 13

- shot: grounding
  view: graph
  focus: faa
  time: "2019-03-13"
  reveal: [faa, daniel-elwell, boeing-737-max, lion-air-flight-610, ethiopian-airlines-flight-302, house-transportation-committee]
  reveal_claims: [daniel-elwell#c1, lion-air-flight-610#c3, ethiopian-airlines-flight-302#c2]
  overlay: {kind: quote, source: house-hearing-2019-05-15-faa-737-max, quote: "That decision was based upon crash site findings and satellite data that together indicated some similarities between the Ethiopian and Indonesian accidents", caption: "Daniel Elwell, acting FAA administrator, explaining the 13 March grounding to Congress"}
  narration: "**The FAA grounds the MAX.** Three days after the second crash, the FAA issued its grounding order. Acting FAA chief Daniel Elwell told Congress that the agency initially found no pattern in U.S. flight data that called for grounding. On 13 March, he said, findings from the Ethiopian wreckage and newly refined Ethiopian satellite tracking together suggested the crashes could share a cause, prompting the emergency order. That March, as regulators grounded the MAX worldwide, House leaders Peter DeFazio and Rick Larsen opened an inquiry into how the FAA had approved it. Families came to Congress to press for a say in when it could fly again."
  duration: 13

- shot: samya
  view: graph
  focus: samya-stumo
  time: "2019-05-15"
  reveal: [samya-stumo, nadia-milleron, michael-stumo, ethiopian-airlines-flight-302, daniel-elwell]
  reveal_claims: [nadia-milleron#c1, michael-stumo#c1, ethiopian-airlines-flight-302#c5, daniel-elwell#c1]
  overlay: {kind: quote, source: house-hearing-2019-05-15-faa-737-max, quote: "Words cannot capture the grief we still feel and that will fill our lives forever.", caption: "Nadia Milleron and Michael Stumo, parents of Samya Stumo, statement to Congress, May 2019"}
  narration: "**Samya’s parents ask Congress to keep it grounded.** Nadia Milleron and Michael Stumo rushed to Ethiopia to bring home their daughter Samya, 24, who was travelling to set up ThinkWell health-care offices. They went home without her body after learning it could not be recovered. In May they told Congress that families had been excluded and demanded to be “included at all levels from here on out”. They feared the drive for profit had displaced Boeing’s safety culture and urged Congress to keep the MAX grounded until independent investigations were complete so other families would be spared a preventable crash. At the hearing, Elwell defended delegation as a way to use industry expertise under FAA oversight and acknowledged that MCAS appeared safety critical. Indonesia’s inquiry tested the assumptions behind that approval."
  duration: 13

- shot: indonesias-report
  view: graph
  focus: knkt-lion-air-610-final-report-2019
  time: "2019-10-25/2019-10-30"
  reveal: [knkt, knkt-lion-air-610-final-report-2019, lion-air-flight-610, lion-air, dennis-muilenburg, house-hearing-with-boeing-ceo-2019]
  reveal_claims: [knkt#c1, lion-air-flight-610#c5, lion-air#c1, house-hearing-with-boeing-ceo-2019#c1, dennis-muilenburg#c1]
  overlay: {kind: quote, source: knkt-pk-lqp-final-report-2019, quote: "During the design and certification of the Boeing 737-8 (MAX), assumptions were made about flight crew response to malfunctions which, even though consistent with current industry guidelines, turned out to be incorrect.", caption: "Indonesia’s KNKT, final report on Lion Air 610, contributing factor 1"}
  narration: "**What the pilots were expected to do.** Indonesia’s investigators listed nine factors in order of events, without ranking them. Faulty assumptions about pilot response and an incomplete review of cockpit warnings made reliance on a single sensor seem acceptable. The replacement sensor’s miscalibration went undetected, the alert for conflicting sensor readings failed, and missing log entries and MCAS guidance left the crew unprepared. The investigators found that competing warnings, repeated MCAS commands, radio calls and shortcomings in crew performance overwhelmed the response. Five days later Boeing CEO Dennis Muilenburg told Congress that extending a system with about 200 million safe flight hours had seemed sound. He would choose differently now and would have grounded the MAX after Lion Air. He said he had never offered his resignation. “I feel responsible to see this through.”"
  duration: 13

- shot: the-house-inquiry
  view: graph
  focus: house-737-max-final-report-2020
  time: "2020-09-16/2020-12"
  reveal: [house-transportation-committee, house-737-max-final-report-2020, peter-defazio, sam-graves, faa, boeing, aircraft-certification-safety-and-accountability-act-2020, faa-737-max-return-to-service-summary-2020]
  reveal_claims: [house-transportation-committee#c1, peter-defazio#c1, sam-graves#c1, us-congress#c43, faa#c1]
  overlay: {kind: quote, source: house-ti-737-max-final-report-2020, quote: "Boeing failed in its design and development of the MAX, and the FAA failed in its oversight of Boeing and its certification of the aircraft.", caption: "House Transportation Committee, report by the majority’s Democratic staff, 16 September 2020"}
  narration: "**Congress changes who gets to sign off.** House Democratic staff found Boeing disclosed MCAS to regulators while downplaying it, and the FAA failed to oversee certification. Boeing concealed the expanded range from the training office. Muilenburg told Congress Boeing aimed to give pilots the materials they needed to fly. House staff found Boeing withheld a simulator test in which its pilot took more than ten seconds to react and failed to recover, against FAA guidance that assumed four seconds. Republican committee leaders called it partisan and urged Congress to heed experts. In November the FAA cleared the MAX to fly with checks against both sensors. In December Congress required the FAA to validate human-factors assumptions before delegating compliance findings or safety-assessment reviews for critical design features, exempting routine tasks. From 2022, new design delegates needed FAA approval."
  duration: 13

- shot: the-agreement
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 10.4, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2021-01-07"
  reveal: [boeing, us-department-of-justice, united-states-v-boeing, boeing-deferred-prosecution-agreement-2021, dave-calhoun, fort-worth]
  reveal_claims: [boeing#c5, boeing#c4, dave-calhoun#c2]
  overlay: {kind: stat, value: "$2,513,600,000", label: "Total Boeing agreed to pay: $243.6 million penalty, $1.77 billion to airlines, $500 million to the crash victims’ heirs", source: boeing-dpa-2021, quote: "Amount to be paid by the Company pursuant to this Agreement is $2,513,600,000"}
  narration: "**Calhoun signs for Boeing.** Soon after the MAX was cleared to fly, prosecutors charged Boeing with conspiracy to defraud the United States and deferred prosecution for three years. CEO Dave Calhoun signed Boeing’s admission that its conduct through two employees established the charged conspiracy beyond a reasonable doubt. He told employees the deal acknowledged “how we fell short of our values and expectations.” Boeing estimated its gross gain from avoiding simulator training at $243.6 million, the starting point for the fine range. It agreed to pay that amount as a penalty, $1.77 billion for airlines with credit for earlier payments, and $500 million for victims’ heirs. Prosecutors said Boeing initially frustrated the inquiry and cooperated late. They declined to require a monitor, citing in part senior management’s lack of involvement. Families asked the court to set the deal aside."
  duration: 13

- shot: without-boeings-fraud
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2021-12/2022-10-21"
  reveal: [reed-oconnor, united-states-v-boeing, us-district-court-northern-texas, mark-forkner, nadia-milleron, michael-stumo, paul-njoroge]
  reveal_claims: [reed-oconnor#c1, mark-forkner#c1, mark-forkner#c2, united-states-v-boeing#c6]
  overlay: {kind: quote, source: us-v-boeing-2022-10-21-causation-order, quote: "On the evidence produced, the Court finds that without Boeing’s fraud the crashes would not have occurred.", caption: "Judge Reed O’Connor, 21 October 2022, deciding whether the families count as crime victims"}
  narration: "**The families challenge the deal.** In December 2021 families moved to set it aside. Prosecutors had told them there was no criminal investigation, a mistake they blamed on an internal miscommunication. In March 2022 a jury acquitted Mark Forkner on four wire fraud counts. His lawyers said Boeing’s engineers had kept him in the dark and Boeing and FAA officials made him a scapegoat. Prosecutors argued that Lion Air’s faulty sensor and maintenance broke the causal chain, and separately that the first crash broke the chain for Ethiopian 302 because it exposed MCAS’s wider range. In October O’Connor recognized the families as crime victims, finding that truthful disclosure would have led to Level D simulator training and MCAS materials and that both crews, properly trained, would have recovered."
  duration: 13

- shot: ethiopias-report
  view: graph
  focus: eaib-et302-final-report-2022
  time: "2022-12-23/2023-01"
  reveal: [eaib, eaib-et302-final-report-2022, ntsb, ethiopian-airlines-flight-302]
  reveal_claims: [eaib#c1, ntsb#c2, ethiopian-airlines-flight-302#c3, ethiopian-airlines-flight-302#c4]
  overlay: {kind: quote, source: eaib-et-avj-final-report-2022, quote: "Repetitive and uncommanded airplane-nose-down inputs from the MCAS due to erroneous AOA input, and its unrecoverable activation system which made the airplane dive with the rate of -33,000 ft/min close to the ground was the most probable cause of the accident.", caption: "Ethiopia’s final report, 23 December 2022, probable cause"}
  narration: "**What could the crew have done?** Ethiopia’s December report found repeated MCAS commands on bad sensor data most likely caused the crash and traced the bad reading to a production-related electrical fault. Its investigators found the FAA’s procedures inadequate and unverified and Boeing’s 3 December 2018 reply inadequate on safety-critical questions. Boeing had cited its role in the Lion Air investigation in declining to answer two questions. U.S. investigators’ May comments on Ethiopia’s draft, published in December, said Boeing advised cutting trim power when unwanted movement came with cockpit warnings from the bad sensor reading. They proposed that inadequate manual electric trim and thrust management be included in the probable cause. In January the NTSB reiterated the U.S. team’s finding that a foreign object, likely a bird, struck the sensor."
  duration: 13

- shot: the-right-to-confer
  view: graph
  focus: united-states-v-boeing
  time: "2023-02/2023-12"
  reveal: [reed-oconnor, united-states-v-boeing, us-department-of-justice, us-court-of-appeals-fifth-circuit]
  reveal_claims: [reed-oconnor#c1, united-states-v-boeing#c6]
  overlay: {kind: quote, source: in-re-ryan-5th-cir-2026-revised-opinion, quote: "The court also held it lacked authority to review or modify the terms of a DPA.", caption: "The Fifth Circuit recounting O’Connor’s February 2023 ruling on the deferred prosecution agreement"}
  narration: "**The families had a right to be consulted.** Back in court in February, O’Connor held that prosecutors violated the Crime Victims’ Rights Act when they negotiated the deal without consulting families they had mistakenly believed did not qualify as crime victims. He attributed the violation to legal error and ruled that he lacked authority to grant the families’ requested remedies. They petitioned the Fifth Circuit, which found the challenge premature. The agreement stood, and Boeing still had to carry out its promise to prevent fraud."
  duration: 13

- shot: breach-and-plea
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2024-01-05/2024-12-05"
  reveal: [united-states-v-boeing, boeing, us-department-of-justice, reed-oconnor, alaska-airlines-flight-1282, dave-calhoun, faa-section-103-expert-panel-report-2024]
  reveal_claims: [united-states-v-boeing#c2, united-states-v-boeing#c3, alaska-airlines-flight-1282#c3, alaska-airlines-flight-1282#c4, faa#c2]
  overlay: {kind: quote, source: us-v-boeing-2024-12-05-order-rejecting-plea, quote: "requires the parties to consider race when hiring the independent monitor. Additionally, the plea agreement marginalizes the Court in the selection and monitoring of the independent monitor.", caption: "Judge Reed O’Connor, rejecting the plea agreement, 5 December 2024: his description of its terms"}
  narration: "**The deal breaks down.** In January 2024 a door plug blew out on Alaska Airlines 1282. Seven passengers and a flight attendant struck by the cockpit door reported minor injuries. An expert panel reported a split between Boeing’s management and staff over safety culture in February. In May prosecutors found Boeing had failed to put an effective program in place to prevent and detect fraud. In June Calhoun apologized to the crash families and said Boeing’s culture was improving. The proposed July plea said executives prioritized moving aircraft through factories over reducing out-of-sequence work. Boeing would plead guilty, accept three years’ probation and a monitor, and invest at least $455 million in compliance, quality and safety. Families objected. In December O’Connor rejected the plea, citing the use of race in monitor selection and limits on his role."
  duration: 13

- shot: a-different-deal
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2025-05-29/2025-07-02"
  reveal: [boeing, reed-oconnor, us-district-court-northern-texas, us-department-of-justice, united-states-v-boeing, paul-njoroge, alaska-airlines-flight-1282]
  reveal_claims: [boeing#c5, boeing#c6, united-states-v-boeing#c4, alaska-airlines-flight-1282#c3]
  overlay: {kind: quote, source: us-v-boeing-2025-07-02-doj-reply, quote: "The longer this case goes on, the longer our suffering will be remembering the loss of a loved one.", caption: "A relative supporting dismissal, quoted by the Justice Department in its 2 July 2025 filing"}
  narration: "**Prosecutors offer a different deal.** After the failed plea, Boeing reaffirmed its admission and agreed to a $487.2 million penalty, with credit for half already paid, $444.5 million for the 346 victims’ estates and at least $455 million for safety and compliance. Boeing would choose its own consultant. Paul Njoroge joined the families who opposed dismissal. They pointed to the program Boeing adopted after the Alaska blowout, arguing it was already in place when prosecutors had insisted on an independent monitor. In a July filing, prosecutors cited legal and factual risks to conviction and the chance that years of litigation would yield no further restitution. They quoted a relative who wanted Boeing punished and wanted to “open a new page without having to continue trauma” with every court update."
  duration: 13

- shot: the-dismissal
  view: graph
  focus: reed-oconnor
  time: "2025-11-06"
  reveal: [boeing, reed-oconnor, us-district-court-northern-texas, us-department-of-justice, united-states-v-boeing]
  reveal_claims: [boeing#c5, united-states-v-boeing#c4]
  overlay: {kind: quote, source: us-v-boeing-2025-11-06-dismissal-order, quote: "The Court acknowledges that it does not have the authority to deny leave because it disagrees with the Government that dismissing the criminal information in this case is in the public interest.", caption: "Judge Reed O’Connor, granting the dismissal, 6 November 2025"}
  narration: "**O’Connor dismisses the case.** O’Connor called prosecutors’ claim of litigation risk “unserious” because Boeing signed an admission covering every element of the conspiracy charge. He said Forkner’s acquittal was a poor guide because the pilot had faced different charges and defended himself as a scapegoat for wider failures at Boeing. O’Connor agreed with the families that letting Boeing choose its own consultant fell short of the accountability needed to protect the flying public. He granted dismissal because disagreement with prosecutors over the public interest gave him no authority to refuse it. The families returned to the appeals court."
  duration: 13

- shot: the-last-word
  view: map
  camera: {center: [-90.0715, 29.9511], zoom: 10.6, pitch: 0, duration: 6}
  places: [new-orleans]
  time: "2026-03-31/2026-06-18"
  reveal: [us-court-of-appeals-fifth-circuit, united-states-v-boeing, nadia-milleron, michael-stumo, paul-njoroge, new-orleans]
  reveal_claims: [united-states-v-boeing#c5, united-states-v-boeing#c6]
  overlay: {kind: quote, source: in-re-ryan-5th-cir-2026-revised-opinion, quote: "We cannot entertain this argument, however, because we lack jurisdiction under the CVRA to substantively review a district court’s decision to grant a motion dismissing a criminal prosecution.", caption: "U.S. Court of Appeals for the Fifth Circuit, on the families’ argument that the dismissal was against the public interest, revised opinion of 22 May 2026"}
  narration: "**What the families got from the courts.** The Fifth Circuit held the challenge to the 2021 deal moot, found that the 2025 talks respected victims’ rights and ruled it lacked jurisdiction to review the merits of dismissal. Its mandate issued in June. A decision to keep simulator training off the schedule left both crews without training for what one bad sensor could do. For purposes of the Crime Victims’ Rights Act, O’Connor found that with truthful disclosure the FAA would have required simulator training and included MCAS in the materials, and properly trained crews would have survived. That finding gave the families a right to be consulted. Boeing’s signed admission stood when the prosecution ended without a trial of the company."
  duration: 13
```

The [Alaska Airlines 1282](/e/alaska-airlines-flight-1282/) investigation follows the door plug back to the factory, where workers opened it for rivet repairs without the required record. [User Fees](/c/user-fees/) follows another regulator’s relationship with an industry it oversees.
