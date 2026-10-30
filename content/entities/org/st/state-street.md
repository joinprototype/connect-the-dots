---
uid: 01M66XNV46FPATA6KEHHD7895H
id: state-street
type: org
name: "State Street Corporation"
aliases: ["State Street", "State Street Corp"]
summary: "American financial holding company in Boston, organized in 1969; the parent of State Street Bank and Trust and of the asset manager State Street Investment Management."
when: "1969/.."
place: boston
same_as: {sec_cik: 93751}
claims:
  - id: c1
    rel: holds_for_clients
    to: tesla
    shares: 117456756
    as_of: "2026-06-30"
    note: "Counts the shares reported for State Street Corporation and the units named in its 13F report. It reports sole voting authority over 14,197,652 of them, and no percent."
    src:
      - {s: state-street-13fa-2026-06-30, at: "Information table, TESLA INC (CUSIP 88160R101), shares", quote: "117456756"}
      - {s: state-street-10k-2025, at: "Item 1, General", quote: "State Street Bank operates as a specialized bank, referred to as a trust or custody bank, that services and manages assets on behalf of its institutional clients."}
  - id: c2
    rel: holds_for_clients
    to: microsoft
    shares: 315653206
    as_of: "2026-06-30"
    note: "Counts the shares reported for State Street Corporation and the units named in its 13F report. It reports sole voting authority over 38,135,141 of them, and no percent."
    src:
      - {s: state-street-13fa-2026-06-30, at: "Information table, MICROSOFT CORP (CUSIP 594918104), shares", quote: "315653206"}
      - {s: state-street-10k-2025, at: "Item 1, General", quote: "State Street Bank operates as a specialized bank, referred to as a trust or custody bank, that services and manages assets on behalf of its institutional clients."}
  - id: c3
    rel: holds_for_clients
    to: amazon
    shares: 397186958
    as_of: "2026-06-30"
    note: "Counts the shares reported for State Street Corporation and the units named in its 13F report. It reports sole voting authority over 50,180,477 of them, and no percent."
    src:
      - {s: state-street-13fa-2026-06-30, at: "Information table, AMAZON COM INC (CUSIP 023135106), shares", quote: "397186958"}
      - {s: state-street-10k-2025, at: "Item 1, General", quote: "State Street Bank operates as a specialized bank, referred to as a trust or custody bank, that services and manages assets on behalf of its institutional clients."}
  - id: c4
    rel: holds_for_clients
    to: blackrock
    shares: 6414683
    as_of: "2026-06-30"
    note: "Counts the shares reported for State Street Corporation and the units named in its 13F report. It reports sole voting authority over 680,356 of them, and no percent."
    src:
      - {s: state-street-13fa-2026-06-30, at: "Information table, BLACKROCK INC (CUSIP 09290D101), shares", quote: "6414683"}
      - {s: state-street-10k-2025, at: "Item 1, General", quote: "State Street Bank operates as a specialized bank, referred to as a trust or custody bank, that services and manages assets on behalf of its institutional clients."}
  - id: c5
    rel: headquartered_in
    to: boston
    src: [{s: state-street-10k-2025, at: "Item 1, General", quote: "Our corporate headquarters is located at One Congress Street, Boston, Massachusetts 02114"}]
  - id: c6
    rel: charged_by
    to: us-department-of-justice
    when: "2017-01-17"
    case: "United States v. State Street Corporation, No. 1:17-cr-10008"
    title: "one count of conspiracy to commit wire fraud and securities fraud"
    src:
      - {s: doj-2017-01-17-state-street-dpa, at: "Paragraph 1", quote: "will file the attached one-count criminal Information in the United States District Court for the District of Massachusetts charging the Company with conspiracy to commit wire fraud and securities fraud, in violation of 18 U.S.C. Section 371."}
      - {s: doj-state-street-case-page, at: "Docket Number", quote: "1:17-cr-10008-IT-1"}
  - id: c7
    rel: settled_with
    to: us-department-of-justice
    when: "2017-01-17"
    case: "United States v. State Street Corporation, No. 1:17-cr-10008"
    title: "deferred prosecution agreement, over secret commissions charged to transition management clients"
    amount: 32300000
    currency: USD
    note: "The company agreed that the Information's allegations and the statement of facts are true and accurate. The term ran three years from the later of the filing or a monitor's retention. No record of how the charge ended is cited here."
    src:
      - {s: doj-2017-01-18-state-street, quote: "has entered into a deferred prosecution agreement and agreed to pay a $32.3 million criminal penalty to resolve the government’s criminal investigation into a scheme to defraud at least six of the bank’s clients through secret commissions applied to billions of dollars of securities trades."}
      - {s: doj-2017-01-17-state-street-dpa, at: "Paragraph 2", quote: "that the allegations described in the Information and the facts described in the attached Statement of Facts are true and accurate."}
      - {s: state-street-8k-2017-01-18, at: "Item 1.01", quote: "a copy of such agreement (which was entered into on January 17, 2017)"}
  - id: c8
    rel: charged_by
    to: us-department-of-justice
    when: "2021-05-13"
    case: "United States v. State Street Corporation, No. 21cr10153"
    title: "one count of conspiracy to commit wire fraud"
    src:
      - {s: doj-2021-05-13-state-street-information, at: "Caption", quote: "Criminal No. 21cr10153 Violation: Count One: Conspiracy to Commit Wire Fraud (18 U.S.C. § 1349)"}
      - {s: doj-2021-05-13-state-street, quote: "State Street entered into a deferred prosecution agreement in connection with a criminal information charging the company with one count of conspiracy to commit wire fraud."}
  - id: c9
    rel: settled_with
    to: us-department-of-justice
    when: "2021-05-13"
    case: "United States v. State Street Corporation, No. 21cr10153"
    title: "deferred prosecution agreement, over secret markups on expenses charged to custody clients"
    amount: 115000000
    currency: USD
    note: "The Justice Department reports the company's admissions in its release. The agreement also required a compliance monitor for two years. No record of how the charge ended is cited here."
    src:
      - {s: doj-2021-05-13-state-street, quote: "entered into a deferred prosecution agreement and agreed to pay a $115 million criminal penalty to resolve charges that it engaged in a scheme to defraud a number of the bank’s clients by secretly overcharging for expenses related to the bank’s custody of client assets."}
      - {s: doj-2021-05-13-state-street, quote: "According to State Street’s admissions, between 1998 and 2015, bank executives conspired to add secret markups to “out-of-pocket” (OOP) expenses charged to the bank’s clients"}
---

State Street Corporation is the parent of [[state-street-bank-and-trust]] and of the asset manager [[state-street-investment-management]]. With [[blackrock]] and [[the-vanguard-group]] it is one of the "Big Three" index-fund managers. Through its funds it holds shares in [[tesla]], [[microsoft]] and [[amazon]] for its clients; it does not own those shares for itself.
