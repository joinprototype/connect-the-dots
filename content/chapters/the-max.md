---
uid: 01M6DTEFRD3YS76D4W4BCF997Q
id: the-max
type: chapter
title: The MAX
subtitle: Two Boeing 737 MAX crashes, 346 deaths, and what courts and investigators found, with each side's answer
summary: "On 29 October 2018 and 10 March 2019, two Boeing 737 MAX planes crashed minutes after takeoff. The story follows the people aboard, the flight software and what it was for, the FAA's delegation of work to Boeing, the 2021 agreement in which Boeing admitted defrauding the FAA's training group, the 2024 door plug, a rejected plea and a dismissal, in the documents themselves."
---

On 29 October 2018 and 10 March 2019, two Boeing 737 MAX planes crashed minutes after takeoff. 346 people died. The story follows what courts and investigators found, and what Boeing, the FAA and the families said in reply.

It rests on the documents themselves: an agreement Boeing signed, court orders, accident reports and hearing records. Where they disagree, each side gets its say, and the story does not pick. The House report was written by the committee’s Democratic staff; Republican leaders of the committee rejected it as partisan, and the FAA and Boeing replied. Ethiopia’s and the U.S. investigators disagree about why one sensor failed and about the crew’s part. Gaps in what was read: the transcript of the September 2025 hearing where families spoke; the words of any Lion Air family beyond one unnamed relative and a group of families whose lawyer sought more compensation; what became of Boeing’s then chief executive after 2019. The same question, how far a regulator leans on the industry it oversees, runs through [[user-fees]].

```scene
- shot: the-answer
  view: graph
  focus: boeing
  time: "2025-11-06"
  reveal: [boeing, lion-air-flight-610, ethiopian-airlines-flight-302, us-department-of-justice, united-states-v-boeing]
  reveal_claims: [boeing#c4, boeing#c5, boeing#c6]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "Boeing, through Boeing Employee-1 and Boeing Employee-2, knowingly, and with intent to defraud, conspired to defraud the FAA AEG.", caption: "Statement of Facts in Boeing’s January 2021 agreement with the Justice Department, which Boeing agreed is true; the AEG is the FAA group that sets pilot-training levels"}
  narration: "**The answer first.** 346 people died on two Boeing 737 MAX flights: 189 in Indonesia in October 2018, 157 in Ethiopia in March 2019. In January 2021 Boeing admitted that its employees acted “knowingly, and with intent to defraud” the FAA’s training group, and agreed to pay $2,513,600,000: a $243.6 million penalty, $1.77 billion for airlines (less what it had already paid them) and $500 million for the victims’ heirs. A judge later called the 2021 agreement “a confession from Boeing.” In 2025 Boeing again admitted the facts “constitute a violation of law.” Boeing was never tried: a judge rejected a plea deal in December 2024 and dismissed the case in November 2025. A Boeing pilot tried separately was acquitted."
  duration: 13

- shot: jakarta
  view: map
  camera: {center: [106.8456, -6.2088], zoom: 8.6, pitch: 0, duration: 6}
  places: [jakarta]
  time: "2018-10-29"
  reveal: [lion-air-flight-610, lion-air, knkt, jakarta]
  reveal_claims: [lion-air-flight-610#c1]
  overlay: {kind: stat, value: "189", label: "People on board Lion Air flight 610, by Indonesia’s investigators", source: knkt-pk-lqp-final-report-2019, quote: "The number of persons onboard the aircraft was 189 consisted of two pilots, six flight attendants, and 181 passengers including one engineer."}
  narration: "**Jakarta, 29 October 2018.** Lion Air flight 610 left for Pangkal Pinang with 189 people on board. About 11 minutes after takeoff, by Indonesia’s report, it was over: the plane was in the Java Sea and no one survived. The committee’s Democratic staff counts more than 20 nose-down commands from MCAS while the pilots fought it. The day before, on the same plane, a third pilot riding in the jump seat had told the crew how to cut power to the trim; that was not written in the log. A rescue diver died in the recovery."
  duration: 13

- shot: addis-ababa
  view: map
  camera: {center: [38.7578, 9.0054], zoom: 9.6, pitch: 0, duration: 6}
  places: [addis-ababa]
  time: "2019-03-10"
  reveal: [ethiopian-airlines-flight-302, paul-njoroge, addis-ababa]
  reveal_claims: [ethiopian-airlines-flight-302#c6]
  overlay: {kind: quote, source: house-ti-737-max-final-report-2020, quote: "I have nightmares about how they must have clung to their mother, crying, seeing the fright in her eyes as they sat there helplessly. And there was nothing I could do to save them", caption: "Paul Njoroge, to the House committee, as quoted in its 2020 report"}
  narration: "**Addis Ababa, 10 March 2019.** Paul Njoroge had followed his family’s flight from Toronto and gone to bed once they reached Addis Ababa. His wife Carolyne, their children Ryan, 6, Kelli, 4, and Rubi, 9 months, and her mother Ann boarded flight 302 to Nairobi. Six minutes after takeoff it crashed in a field, 28 nautical miles from the airport by Ethiopia’s report. All 157 people on board died."
  duration: 13

- shot: samya
  view: graph
  focus: samya-stumo
  time: "2019-05-15"
  reveal: [samya-stumo, nadia-milleron, michael-stumo, ethiopian-airlines-flight-302]
  reveal_claims: [nadia-milleron#c1, michael-stumo#c1, ethiopian-airlines-flight-302#c5]
  overlay: {kind: quote, source: house-hearing-2019-05-15-faa-737-max, quote: "Words cannot capture the grief we still feel and that will fill our lives forever.", caption: "Nadia Milleron and Michael Stumo, parents of Samya Stumo, statement to Congress, May 2019"}
  narration: "**Samya.** Samya Stumo was 24, on her way to help set up health-care offices for ThinkWell in countries that needed them. Her parents rushed to Ethiopia to recover her body and learned that what little remained of anyone on the plane could not be recovered. Their May 2019 statement to Congress said: “Families of the victims have not been included in the process, we need to be included at all levels from here on out.” It also said “the Boeing culture of engineering safety may have been destroyed in favor of a Boeing management culture of profit extraction.” That is their view."
  duration: 13

- shot: between-the-crashes
  view: graph
  focus: ethiopian-airlines-flight-302
  time: "2018-11/2019-03-10"
  reveal: [lion-air-flight-610, ethiopian-airlines-flight-302, faa, boeing, dennis-muilenburg]
  reveal_claims: [house-hearing-with-boeing-ceo-2019#c1]
  overlay: {kind: stat, value: "15 crashes, 2,900 deaths", label: "The FAA’s December 2018 estimate with no MCAS fix, per Democratic committee staff", source: house-ti-737-max-final-report-2020, quote: "In December 2018, the FAA conducted a risk assessment based on its Transport Aircraft Risk Assessment Methodology (TARAM) and estimated that without a fix to MCAS, during the lifetime of the 737 MAX fleet, there could potentially be 15 additional fatal crashes resulting in over 2,900 deaths."}
  narration: "**Between the crashes.** Less than five months separate them. The Democratic staff report says that after Lion Air a Boeing bulletin and an FAA emergency directive did not name MCAS, and the FAA drafted, then deleted, a mention. It says the FAA kept the plane flying despite its own estimate of 15 more crashes and 2,900 deaths. The FAA told the committee it “would never accept a risk of additional accidents without taking immediate action.” The agreed facts say that after Lion Air a Boeing employee had Boeing give the FAA group “a false and misleading presentation.” Muilenburg, 2019: “we would have grounded it right after the first accident.”"
  duration: 13

- shot: a-fix-for-the-engines
  view: graph
  focus: maneuvering-characteristics-augmentation-system
  time: "2010/2016"
  reveal: [maneuvering-characteristics-augmentation-system, boeing-737-max, boeing]
  reveal_claims: [boeing#c3, united-states-v-boeing#c7]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "In operation, MCAS would automatically cause the airplane’s nose to pitch down by adjusting the 737 MAX’s horizontal stabilizer", caption: "Statement of Facts in Boeing’s 2021 agreement with the Justice Department, which Boeing agreed is true"}
  narration: "**A fix for the engines.** The committee’s Democratic staff says Boeing faced “tremendous financial pressure” to match Airbus’s new A320neo. The MAX got larger engines, placed differently from the older 737’s, and in one test maneuver, a high-speed wind-up turn, its nose pitched up. The agreed facts say Boeing’s fix was MCAS. The staff found it took readings from a single angle-of-attack sensor, and that Boeing expected pilots, “largely unaware that the system existed,” to cope with any malfunction."
  duration: 13

- shot: what-training-was-worth
  view: graph
  focus: boeing-deferred-prosecution-agreement-2021
  time: "2014/2016"
  reveal: [boeing-deferred-prosecution-agreement-2021, boeing, faa]
  reveal_claims: [boeing#c7]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "Boeing’s stated objectives in designing the 737 MAX included securing the FAA AEG’s determination to require no greater than “Level B” differences training in the 737 MAX FSB Report.", caption: "Statement of Facts in Boeing’s 2021 agreement, which Boeing agreed is true"}
  narration: "**What training was worth.** The FAA’s Aircraft Evaluation Group decides how much training pilots need to move from the older 737 to the MAX. “Level B” could be done on a tablet in hours; “Level D” meant a full-flight simulator, so the MAX would cost airlines more. In December 2014, the agreed facts say, Employee-1 wrote that losing Level B would be “thrown squarely on my shoulders,” the man “Who cost Boeing tens of millions of dollars!” Boeing admitted it “derived a pecuniary gross gain of $243,600,000.” The Democratic staff add a Southwest contract: a discount of at least $1 million per plane if simulator training was required."
  duration: 13

- shot: wider-than-told
  view: graph
  focus: boeing-deferred-prosecution-agreement-2021
  time: "2015-06/2017-07"
  reveal: [boeing-deferred-prosecution-agreement-2021, boeing, faa, maneuvering-characteristics-augmentation-system]
  reveal_claims: [boeing#c5]
  overlay: {kind: stat, value: "Mach 0.6–0.8 to 0.2–0.8", label: "How far MCAS’s working range was widened, in the agreed facts", source: boeing-dpa-2021, quote: "the change expanded the speed range within which MCAS could activate from approximately Mach 0.6-0.8 to approximately Mach 0.2-0.8—that is, from only high-speed flight to nearly the entire speed range for the 737 MAX"}
  narration: "**Wider than told.** In June 2015 Boeing told the FAA group that MCAS worked only in a high-speed turn. In March 2016, the Democratic staff reports, Boeing redesigned it for low speeds, and it could now move the stabilizer 2.5 degrees instead of 0.6. The agreement says Boeing told the FAA staff who decide airworthiness but not the training group, and “intentionally withheld and concealed” the change from that group. After the plane entered service, “Pilots flying the 737 MAX for Boeing’s airline customers were not provided any information about MCAS in their airplane manuals and pilot-training materials.”"
  duration: 13

- shot: shocker-alert
  view: graph
  focus: boeing-deferred-prosecution-agreement-2021
  time: "2016-11-15"
  reveal: [boeing, faa, boeing-deferred-prosecution-agreement-2021]
  reveal_claims: [boeing#c5]
  overlay: {kind: quote, source: boeing-dpa-2021, quote: "so I basically lied to the regulators (unknowingly)", caption: "Boeing’s chief technical pilot, “Boeing Employee-1,” in a chat of 15 November 2016, quoted in the agreed facts"}
  narration: "**“Shocker alert.”** On 15 November 2016 the chief technical pilot saw MCAS running at low speed in a simulator. A colleague answered in the chat: “it wasn’t a lie, no one told us that was the case.” The agreement says neither corrected the FAA group. Employee-1 proposed deleting MCAS from the FAA’s pilot-training report on 22 November and again on 17 January, and wrote “Flight Controls: Delete MCAS.” It was published on 5 July 2017 without MCAS. The agreement says Boeing’s deceit ran “through at least in and around December 2018.”"
  duration: 13

- shot: what-the-faa-approved
  view: graph
  focus: delegation-of-737-max-certification-tasks
  time: "2013/2017-03-08"
  reveal: [delegation-of-737-max-certification-tasks, faa, boeing, daniel-elwell]
  reveal_claims: [delegation-of-737-max-certification-tasks#c1, delegation-of-737-max-certification-tasks#c2, daniel-elwell#c1]
  overlay: {kind: stat, value: "79 of 91", label: "Certification plans the FAA had delegated to Boeing by November 2016, by the Democratic staff’s count", source: house-ti-737-max-final-report-2020, quote: "by November 2016, four months prior to FAA certification of the 737 MAX, the FAA had delegated 79 of 91 certification plans to Boeing, nearly 90 percent of its certification related tasks."}
  narration: "**What the FAA approved.** The FAA granted the MAX its amended type certificate on 8 March 2017. The staff report says that in March 2016, hours after Boeing approved the MCAS redesign, Boeing asked and the FAA approved removing MCAS from the pilots’ manual, and the FAA officials who agreed “remained unaware” of the redesign until after Lion Air. It cites a 2016 Boeing survey: 39 percent of authorized representatives responding perceived “undue pressure.” Elwell, FAA acting head, 2019: “We don’t have a program of self-certification.” With robust oversight, “it is a good system.” Asked if MCAS was safety critical: “it seems to me that, yes, it is.” Asked if pilots did not know it was installed until after Lion Air: “Yes, sir.”"
  duration: 13

- shot: indonesias-report
  view: graph
  focus: knkt-lion-air-610-final-report-2019
  time: "2019-10-25"
  reveal: [knkt, knkt-lion-air-610-final-report-2019, lion-air-flight-610, lion-air, boeing]
  reveal_claims: [knkt#c1, lion-air-flight-610#c5, lion-air#c1]
  overlay: {kind: quote, source: knkt-pk-lqp-final-report-2019, quote: "During the design and certification of the Boeing 737-8 (MAX), assumptions were made about flight crew response to malfunctions which, even though consistent with current industry guidelines, turned out to be incorrect.", caption: "Indonesia’s KNKT, final report on Lion Air 610, contributing factor 1"}
  narration: "**Indonesia’s report.** On 25 October 2019 KNKT published nine contributing factors, in time order, not ranked. Boeing’s: wrong assumptions about crew response, reliance on a single sensor, “absence of guidance on MCAS” in manuals and training, and an AOA DISAGREE alert not correctly enabled. Maintenance: a replacement sensor mis-calibrated in an earlier repair and missed (the House report says the repairer, Xtra Aerospace of Florida, lost its FAA certificate in 2019), and missing flight-log entries. Last: “multiple alerts, repetitive MCAS activations, and distractions” that the crew could not manage, from “the difficulty of the situation” and their own performance."
  duration: 13

- shot: ethiopias-report
  view: graph
  focus: eaib-et302-final-report-2022
  time: "2022-12-23"
  reveal: [eaib, eaib-et302-final-report-2022, ntsb, ethiopian-airlines-flight-302]
  reveal_claims: [eaib#c1, ntsb#c2, ethiopian-airlines-flight-302#c3, ethiopian-airlines-flight-302#c4]
  overlay: {kind: quote, source: eaib-et-avj-final-report-2022, quote: "Repetitive and uncommanded airplane-nose-down inputs from the MCAS due to erroneous AOA input, and its unrecoverable activation system which made the airplane dive with the rate of -33,000 ft/min close to the ground was the most probable cause of the accident.", caption: "Ethiopia’s final report, 23 December 2022, probable cause"}
  narration: "**Ethiopia’s report, and two disputes.** Ethiopia names MCAS as most probable cause and says Boeing did not answer the airline’s “safety critical questions” after Lion Air. The U.S. NTSB, which took part, concurs on MCAS but disputes two things. The sensor: Ethiopia says a production electrical fault; the NTSB says the vane was struck by a foreign object, most likely a bird. The crew: the NTSB proposed adding “the flight crew’s inadequate use of manual electric trim and management of thrust,” and says Boeing did answer, on 3 December 2018. Ethiopia’s report calls the emergency directive’s procedures “inadequate and unverified.”"
  duration: 13

- shot: the-house-inquiry
  view: graph
  focus: house-737-max-final-report-2020
  time: "2020-09-16"
  reveal: [house-transportation-committee, house-737-max-final-report-2020, peter-defazio, sam-graves, faa, boeing]
  reveal_claims: [house-transportation-committee#c1, peter-defazio#c1, sam-graves#c1]
  overlay: {kind: quote, source: house-ti-737-max-final-report-2020, quote: "Boeing failed in its design and development of the MAX, and the FAA failed in its oversight of Boeing and its certification of the aircraft.", caption: "House Transportation Committee, report by the majority’s Democratic staff, 16 September 2020"}
  narration: "**The House inquiry.** After 18 months and about 600,000 pages of records, Democratic staff reported on 16 September 2020. Even so, it says “Boeing did not hide MCAS from regulators” while it downplayed it. The committee’s Republican leaders, Sam Graves and Garret Graves: “These recommendations—not a partisan investigative report—should serve as the basis for Congressional action.” The FAA said it would work with lawmakers “to implement improvements identified in its report.” Boeing: “We have learned many hard lessons as a company from the accidents of Lion Air Flight 610 and Ethiopian Airlines Flight 302, and from the mistakes we have made.”"
  duration: 13

- shot: i-am-responsible
  view: map
  camera: {center: [-77.0369, 38.9072], zoom: 11, pitch: 0, duration: 6}
  places: [washington-dc]
  time: "2019-10-30"
  reveal: [house-hearing-with-boeing-ceo-2019, dennis-muilenburg, peter-defazio, washington-dc]
  reveal_claims: [house-hearing-with-boeing-ceo-2019#c1, dennis-muilenburg#c1]
  overlay: {kind: quote, source: house-hearing-2019-10-30-boeing-ceo, quote: "my company and I are responsible. We are responsible for our airplanes. And we know there are things we need to improve. We own that. We are going to fix it,", caption: "Dennis Muilenburg, Boeing’s chief executive, answering Chairman DeFazio at the House Transportation Committee, 30 October 2019"}
  narration: "**“I am responsible.”** With relatives of the dead in the room, Muilenburg said “we are deeply, deeply sorry.” Asked who bore principal responsibility: “my company and I are responsible.” Asked why MCAS had one sensor from day one: “if back then we knew everything that we know now, we would have made a different decision”; the design extended a speed-trim system with “about 200 million safe flight hours.” Asked whether he had offered to resign: “I have not. I am responsible. These two accidents happened on my watch.” DeFazio had raised his $15 million bonus."
  duration: 13

- shot: what-congress-changed
  view: graph
  focus: aircraft-certification-safety-and-accountability-act-2020
  time: "2020-12"
  reveal: [aircraft-certification-safety-and-accountability-act-2020, us-congress, faa, faa-section-103-expert-panel-report-2024, faa-737-max-return-to-service-summary-2020]
  reveal_claims: [us-congress#c43, faa#c2, faa#c1]
  overlay: {kind: quote, source: pl-116-260-division-v-aircraft-certification-act, quote: "until the Administrator has reviewed and validated any underlying assumptions related to human factors.", caption: "Aircraft Certification, Safety, and Accountability Act, Sec. 106: no delegated findings on a critical system design feature of a transport airplane until then, routine tasks aside"}
  narration: "**What Congress changed.** The FAA grounded the MAX in the U.S. on 13 March 2019 and published its review for returning it to service on 18 November 2020. In December 2020 Congress passed a certification law. It bars delegating findings on a critical system until the FAA has validated the human-factors assumptions behind it, and, from 2022, requires the FAA to approve each person a company picks for delegated design work. The FAA’s panel under the law reported in 2024 “a disconnect between Boeing’s senior management and other members of the organization on safety culture.”"
  duration: 13

- shot: the-agreement
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 10.4, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2021-01-07"
  reveal: [boeing, us-department-of-justice, united-states-v-boeing, boeing-deferred-prosecution-agreement-2021, dave-calhoun, fort-worth]
  reveal_claims: [boeing#c5, boeing#c4, dave-calhoun#c2]
  overlay: {kind: stat, value: "$2,513,600,000", label: "Total Boeing agreed to pay: $243.6 million penalty, $1.77 billion to airlines, $500 million to the crash victims’ heirs", source: boeing-dpa-2021, quote: "Amount to be paid by the Company pursuant to this Agreement is $2,513,600,000"}
  narration: "**7 January 2021.** The Justice Department charged Boeing with one count of conspiracy to defraud the U.S. and deferred prosecution for three years. Boeing agreed the facts “establish beyond a reasonable doubt the charge.” The department skipped an outside monitor, citing “two of the Company’s 737 MAX Flight Technical Pilots” and misconduct not “facilitated by senior management.” It also found Boeing’s cooperation “delayed,” its response “frustrated” the inquiry, and noted a 1989 conviction. Boeing’s release: “based on the conduct of two former Boeing employees.” In 2025 the judge wrote that the case “targets the corporate culture” and the Government “agrees with that theme.”"
  duration: 13

- shot: the-pilot
  view: graph
  focus: mark-forkner
  time: "2022-03-23"
  reveal: [mark-forkner, boeing, us-district-court-northern-texas]
  reveal_claims: [mark-forkner#c1, mark-forkner#c2]
  overlay: {kind: quote, source: us-v-boeing-2025-11-06-dismissal-order, quote: "The technical pilot’s central defense was that he was a scapegoat for the broader and systematic failure of Boeing’s corporate culture which led to the crashes.", caption: "Judge Reed O’Connor, 6 November 2025, note on the pilot’s trial"}
  narration: "**The pilot.** The agreement does not name its two employees. The House report says Boeing documents’ “Former 737 Chief Technical Pilot” is Mark Forkner, who left in 2018; AP reports prosecutors used a message in which “he said he unknowingly misled regulators.” He was tried alone, and the agreement binds Boeing, not him. A Fort Worth jury took under two hours to find him not guilty on four counts of wire fraud; two of six had been dropped. Prosecutors said he misled the FAA about training. His lawyers said Boeing engineers never told him of the software changes."
  duration: 13

- shot: without-boeings-fraud
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2022-10-21"
  reveal: [reed-oconnor, united-states-v-boeing, us-district-court-northern-texas, nadia-milleron, michael-stumo, paul-njoroge]
  reveal_claims: [reed-oconnor#c1]
  overlay: {kind: quote, source: us-v-boeing-2022-10-21-causation-order, quote: "On the evidence produced, the Court finds that without Boeing’s fraud the crashes would not have occurred.", caption: "Judge Reed O’Connor, 21 October 2022, deciding whether the families count as crime victims"}
  narration: "**“Without Boeing’s fraud.”** In February 2020 the Justice Department told families the FBI was not investigating the crash; it later called that “a regrettable and inadvertent internal miscommunication.” The families said the 2021 deal broke their rights. On 21 October 2022 Judge O’Connor ruled they could assert a crime victim’s rights, on the evidence and not as a verdict. The government argued the Lion Air sensor and maintenance broke the chain of cause. He answered that “events often have multiple causes.” In 2023 he found “legal error,” not bad faith, in the department’s failure to confer, and no power to review the deal’s terms."
  duration: 13

- shot: the-door-plug
  view: map
  camera: {center: [-122.6765, 45.5231], zoom: 9.4, pitch: 0, duration: 6}
  places: [portland-oregon]
  time: "2024-01-05"
  reveal: [alaska-airlines-flight-1282, ntsb, ntsb-alaska-1282-report-2025, faa, dave-calhoun, portland-oregon]
  reveal_claims: [alaska-airlines-flight-1282#c1, alaska-airlines-flight-1282#c2, alaska-airlines-flight-1282#c3]
  overlay: {kind: quote, source: ntsb-2025-air-25-04-alaska-1282-report, quote: "the in-flight separation of the left MED plug due to Boeing’s failure to provide adequate training, guidance, and oversight necessary to ensure that manufacturing personnel could consistently and correctly comply with its parts removal process", caption: "NTSB, probable cause of Alaska Airlines flight 1282, adopted 24 June 2025"}
  narration: "**5 January 2024.** After takeoff from Portland, a door plug separated from an Alaska Airlines Boeing 737-9. No one died; seven passengers and one flight attendant reported minor injuries. The NTSB says the plug was opened at Boeing’s Renton factory on 18 September 2023 without the required paperwork, and names the FAA’s ineffective surveillance as contributing. In June 2024 Boeing’s chief executive Dave Calhoun told the Senate: “I want to personally apologize, on behalf of everyone at Boeing,” to the families of the 2018 and 2019 victims, and “Our culture is far from perfect, but we are taking action and making progress.”"
  duration: 13

- shot: breach-and-plea
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2024-05-14/2024-12-05"
  reveal: [united-states-v-boeing, boeing, us-department-of-justice, reed-oconnor]
  reveal_claims: [united-states-v-boeing#c2, united-states-v-boeing#c3]
  overlay: {kind: quote, source: us-v-boeing-2024-12-05-order-rejecting-plea, quote: "requires the parties to consider race when hiring the independent monitor. Additionally, the plea agreement marginalizes the Court in the selection and monitoring of the independent monitor.", caption: "Judge Reed O’Connor, rejecting the plea agreement, 5 December 2024: his description of its terms"}
  narration: "**Breach, plea, rejection.** On 14 May 2024 the Justice Department said Boeing breached the 2021 agreement by “failing to design, implement, and enforce a compliance and ethics program.” Its letter names no flight; its later facts cite lapses in removal records and say “Boeing senior executives prioritized the movement of aircraft” over quality. The families say the department acted after the door plug. The July plea: guilt, three years’ probation, $455 million for safety, a monitor. The families objected. The judge rejected it, saying Boeing “hints” it had defences, but “the Government’s attempt to ensure compliance has failed,” and Boeing left breach to the Government’s “sole discretion.”"
  duration: 13

- shot: a-different-deal
  view: map
  camera: {center: [-97.3308, 32.7555], zoom: 12.2, pitch: 0, duration: 6}
  places: [fort-worth]
  time: "2025-05-29/2025-11-06"
  reveal: [boeing, us-district-court-northern-texas, us-department-of-justice, united-states-v-boeing]
  reveal_claims: [boeing#c5, boeing#c6]
  overlay: {kind: quote, source: us-v-boeing-2025-11-06-dismissal-order, quote: "The Court acknowledges that it does not have the authority to deny leave because it disagrees with the Government that dismissing the criminal information in this case is in the public interest.", caption: "Judge Reed O’Connor, granting the dismissal, 6 November 2025"}
  narration: "**A different deal.** On 29 May 2025 the department and Boeing signed a non-prosecution agreement: a $487.2 million penalty with credit for $243.6 million paid, $444.5 million split equally among the 346 victims’ estates, at least $455 million for safety, and a consultant Boeing picks instead of a monitor. The department said it “secures meaningful accountability.” The judge wrote the deal “does not even pretend to address the need for a truly independent compliance monitor,” called the trial-risk claim “unserious” and said it “fails to secure the necessary accountability to ensure the safety of the flying public.” He dismissed the case on 6 November, saying he lacked the power to refuse."
  duration: 13

- shot: the-last-word
  view: map
  camera: {center: [-90.0715, 29.9511], zoom: 10.6, pitch: 0, duration: 6}
  places: [new-orleans]
  time: "2026-03-31/2026-06-18"
  reveal: [us-court-of-appeals-fifth-circuit, united-states-v-boeing, nadia-milleron, michael-stumo, paul-njoroge, new-orleans]
  reveal_claims: [united-states-v-boeing#c5, united-states-v-boeing#c6]
  overlay: {kind: quote, source: in-re-ryan-5th-cir-2026-revised-opinion, quote: "We cannot entertain this argument, however, because we lack jurisdiction under the CVRA to substantively review a district court’s decision to grant a motion dismissing a criminal prosecution.", caption: "U.S. Court of Appeals for the Fifth Circuit, on the families’ argument that the dismissal was against the public interest, revised opinion of 22 May 2026"}
  narration: "**The last word, so far.** The Fifth Circuit denied the families’ petitions on 31 March 2026 (revised 22 May; mandate 18 June). The challenge to the 2021 deal was moot; the department did not violate their rights in the 2025 talks; the dismissal it could not review. The families were not of one mind. The department counted families of 29 victims objecting; counsel for 66 families did not oppose but asked that Boeing pay more to certain Lion Air families; Boeing counted over 110. One relative, quoted by the department: “It is hard for me to let go of this case, I want Boeing Company to get the punishment that is appropriate for this case, but I also want the best for me and my children.”"
  duration: 13
```
