---
uid: 01M6DKJKKCKKGXSW0K4R51YCRV
id: jack-ruby
type: person
name: "Jack Ruby"
summary: "Dallas man who shot Lee Harvey Oswald on 24 November 1963. He was found guilty of murder in March 1964; the Texas Court of Criminal Appeals reversed the conviction in October 1966."
same_as: {wikidata: Q192519}
when: "1911/1967"
claims:
  - id: c1
    rel: appears_in
    to: warren-commission-report
    role: "Subject"
    src:
      - {s: nara-warren-report-ch1, at: "Narrative of Events", quote: "The man who killed Oswald was Jack Ruby."}
  - id: c2
    rel: appears_in
    to: hsca-final-report
    role: "Subject"
    note: "The committee also found that Ruby was not a member of organized crime, but had many contacts with underworld figures."
    according_to: [house-select-committee-on-assassinations]
    src:
      - {s: nara-hsca-report-part1c, at: "Ruby", quote: "believed that Ruby's shooting of Oswald was not a spontaneous act, in that it involved at least some premeditation.", by: house-select-committee-on-assassinations}
      - {s: nara-hsca-report-part1c, at: "Ruby", quote: "Ruby was not a \"member\" of organized crime in Dallas or elsewhere, although it showed that he had a significant number of associations and direct and indirect contacts with underworld figures", by: house-select-committee-on-assassinations}
  - id: c3
    rel: convicted_by
    to: criminal-district-court-no-3-dallas-county
    when: "1964-03-14"
    case: "Rubenstein v. State"
    title: "murder of Lee Harvey Oswald; sentenced to death"
    src:
      - {s: nara-warren-report-ch1, at: "Narrative of Events", quote: "Ruby was found guilty on March 14, 1964, and sentenced to death."}
  - id: c4
    rel: overturned_by
    to: texas-court-of-criminal-appeals
    when: "1966-10-05"
    case: "Rubenstein v. State"
    title: "conviction reversed; retrial ordered outside Dallas County"
    src:
      - {s: texas-1966-rubenstein-v-state, at: "Opinion", quote: "the judgment is reversed, and the cause is remanded with directions that the venue be changed to some county other than Dallas."}
---
