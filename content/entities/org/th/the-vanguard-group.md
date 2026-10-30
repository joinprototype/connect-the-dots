---
uid: 01M53TK2R60X2CY57F744MZZ89
id: the-vanguard-group
type: org
name: The Vanguard Group
aliases: [Vanguard, "The Vanguard Group, Inc."]
summary: "American investment-management company, incorporated by John C. Bogle in September 1974; it began operations in May 1975."
when: "1974-09-24/.."
place: malvern-pennsylvania
claims:
  - id: c1
    rel: holds_for_clients
    to: tesla
    when: "../2026-01-12"
    percent: 6.9
    shares: 229805491
    as_of: 2025-09-15
    note: "Percentage from Tesla's proxy table; the share count comes from Vanguard's Schedule 13G filed in February 2024. On 27 March 2026 The Vanguard Group reported 0 Tesla shares (Schedule 13G/A No. 4) after an internal realignment on 12 January 2026. Vanguard Capital Management now reports the funds' holding: 5.61% as of 31 March 2026."
    src: [{s: tesla-proxy-2025, at: "Ownership of Securities, as of September 15, 2025", quote: "The foregoing information is based solely on Schedule 13G of The Vanguard Group filed on February 13, 2024"}, {s: vanguard-13ga-4-2026-03-27-tesla, at: "Comment for Type of Reporting Person", quote: "On January 12, 2026, The Vanguard Group, Inc. went through an internal realignment."}]
  - id: c2
    rel: holds_for_clients
    to: microsoft
    when: "../2026-01-12"
    percent: 8.95
    shares: 664882153
    as_of: 2025-09-30
    note: "Percentage from Microsoft's proxy table; the share count comes from Vanguard's Schedule 13G/A filed in February 2024. On 27 March 2026 The Vanguard Group reported 0 Microsoft shares (Schedule 13G/A No. 10) after an internal realignment on 12 January 2026. Vanguard Capital Management now reports the funds' holding: 7.48% as of 31 March 2026."
    src: [{s: msft-proxy-2025, at: "Principal Shareholders, as of 09/30/2025", quote: "All information about The Vanguard Group, Inc. is based on a Schedule 13G/A filed with the SEC on February 13, 2024."}, {s: vanguard-13ga-10-2026-03-27-microsoft, at: "Comment for Type of Reporting Person", quote: "On January 12, 2026, The Vanguard Group, Inc. went through an internal realignment."}]
  - id: c3
    rel: holds_for_clients
    to: amazon
    when: "../2026-01-12"
    percent: 7.2
    shares: 771052550
    as_of: 2026-02-24
    note: "Percentage from Amazon's proxy table; the share count is as of December 31, 2023. Amazon notes that Vanguard later reported a realignment that removed some subsidiaries' holdings from its beneficial ownership. On 26 March 2026 The Vanguard Group reported 0 Amazon shares (Schedule 13G/A No. 8) after an internal realignment on 12 January 2026. Vanguard Capital Management now reports the funds' holding: 6.77% as of 31 March 2026."
    src: [{s: amazon-proxy-2026, at: "Security ownership table, as of February 24, 2026", quote: "Based on information provided in a Schedule 13G filed February 13, 2024."}, {s: vanguard-13ga-8-2026-03-26-amazon, at: "Comment for Type of Reporting Person", quote: "On January 12, 2026, The Vanguard Group, Inc. went through an internal realignment."}]
  - id: c4
    rel: distinct_from
    to: project-vanguard
    note: "A name match is not identity: an investment company founded in 1974–75 and a US satellite program of 1955–1959."
    src:
      - {s: vanguard-our-history, at: "1975"}
      - {s: nasa-goddard-vanguard, quote: "Project Vanguard, initiated in 1955, aimed to launch the first American satellite into Earth orbit as part of the International Geophysical Year (July 1957 to December 1958)."}
  - id: c5
    rel: holds_for_clients
    to: blackrock
    when: "../2026-01-12"
    percent: 8.31
    as_of: "2025-03-28"
    shares: 12890008
    note: "Percentage from BlackRock's 2025 proxy table; the share count comes from Vanguard's Schedule 13G/A filed in February 2024. Under a letter agreement, any BlackRock shares Vanguard owns above 10% are voted in proportion to the other shares. Vanguard's own filing of March 2026 reports 0 shares after an internal realignment on 12 January 2026; its subsidiary Vanguard Capital Management reported 6.87% in April 2026. The two figures are not added together."
    src:
      - {s: blackrock-proxy-2025, at: "Ownership of BlackRock Common Stock (table as of March 28, 2025), footnote 3", quote: "Based on the Schedule 13G/A of The Vanguard Group, Inc. (“Vanguard”) filed on February 13, 2024. Vanguard reported it held 0 shares with sole voting power, 180,193 shares with shared voting power, 12,258,524 shares with sole dispositive power"}
      - {s: vanguard-13ga-7-2026-03-26-blackrock, at: "Comment", quote: "On January 12, 2026, The Vanguard Group, Inc. went through an internal realignment."}
  - id: c6
    rel: owns_stake
    to: vanguard-capital-management
    when: "2025/.."
    percent: 100
    as_of: "2026-04-28"
    note: "Established in 2025; it manages the portfolios of some Vanguard funds under an intercompany agreement with The Vanguard Group."
    src:
      - {s: vanguard-index-funds-485bpos-2026-04-28, at: "Statement of Additional Information, Management of the Funds: Vanguard", quote: "Vanguard also provides investment advisory services to certain Vanguard funds through VCM and/or VPM, each a wholly owned subsidiary of Vanguard established in 2025."}
  - id: c7
    rel: headquartered_in
    to: malvern-pennsylvania
    src: [{s: vanguard-13ga-2026-09-03-liberty-media, at: "Item 2(a) and (b)", quote: "Name of person filing: The Vanguard Group (b) Address or principal business office or, if none, residence: 100 Vanguard Blvd.,, Malvern, PA, 19355"}]
  - id: c8
    rel: founded
    to: vanguard-500-index-fund
    when: "1976"
    note: "Launched as First Index Investment Trust."
    src:
      - {s: vanguard-our-history, at: "1976: “Vanguard democratizes indexing”", quote: "Vanguard democratizes mutual fund indexing with its First Index Investment Trust (now Vanguard 500 Index Fund) offering lower costs and broad diversification to individual investors for the first time."}
  - id: c9
    rel: settled_with
    to: sec
    when: "2025-01-17"
    case: "In the Matter of The Vanguard Group, Inc."
    title: "misleading statements about potential tax consequences for investors in its target retirement funds; without admitting or denying the findings"
    amount: 106410000
    currency: USD
    note: "In June 2026 the SEC said $146.41 million had been collected from Vanguard, after a court rejected a class settlement that was to count toward the total."
    src:
      - {s: sec-2025-01-17-vanguard, quote: "and a $13.5 million civil penalty, for a total amount of $106.41 million to be distributed to affected investors through a Fair Fund."}
      - {s: sec-33-11359-vanguard, quote: "These proceedings arise out of misleading statements by Vanguard concerning potential tax consequences to investors in the Vanguard Investor Target Retirement Funds"}
      - {s: sec-33-11359-vanguard, at: "Section II", quote: "without admitting or denying the findings herein"}
      - {s: sec-34-105804-vanguard-fair-fund, quote: "Because the court in the class action rejected the settlement, Vanguard was required to pay the additional $40 million to the Fair Fund."}
      - {s: sec-34-105804-vanguard-fair-fund, quote: "The Fair Fund includes the $146,410,000.00 collected from the Respondent."}
---

The Vanguard Group was founded by [[john-c-bogle]]: incorporated in September 1974, it began operations in May 1975 and is owned by its funds, which are owned by their investors. Its index funds hold large stakes in [[tesla]], [[microsoft]] and [[amazon]] on behalf of clients.

It is not connected to [[project-vanguard]], the US satellite program of the 1950s. The shared name is a coincidence.
