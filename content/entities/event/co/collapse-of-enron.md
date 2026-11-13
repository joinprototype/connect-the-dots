---
uid: 01M6DK2EZTMVCEB1Q6Z4NJ9GBG
id: collapse-of-enron
type: event
name: "Collapse of Enron"
summary: "Enron’s accounting troubles became public in 2001 and the company filed for bankruptcy that year."
when: "2001"
claims:
  - id: c1
    rel: involved
    to: enron
    src:
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "Enron filed for bankruptcy less than a month later."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "That release disclosed a $1.01 billion charge to earnings."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "The following day, the SEC notified Enron by letter that it had opened an investigation in August and requested certain information and documents."}
  - id: c2
    rel: involved
    to: arthur-andersen
    role: "auditor"
    src:
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "As Enron Corporation’s financial difficulties became public in 2001, petitioner Arthur Andersen LLP, Enron’s auditor, instructed its employees to destroy documents pursuant to its document retention policy."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "It is, of course, not wrongful for a manager to instruct his employees to comply with a valid document retention policy under ordinary circumstances."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "Odom urged everyone to comply with the firm’s document retention policy."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "These, and other smaller meetings, were followed by substantial destruction of paper and electronic documents."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "Also on November 8, the SEC served Enron and petitioner with subpoenas for records."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court", quote: "Per Dave–No more shredding"}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, note 4 (the firm's own policy)", quote: "the related information should not be destroyed"}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, note 4 (Andersen policy)", quote: "no related information will be destroyed."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, factual background", quote: "Her notes from that meeting reflect that “some SEC investigation” is “highly probable.”"}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, factual background", quote: "On October 12, Temple entered the Enron matter into her computer, designating the “Type of Potential Claim” as “Professional Practice–Government/Regulatory Inv[estigation].”"}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, note 5", quote: "suggested deleting some language that might suggest we have concluded the release is misleading."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, note 6: John Riley’s warning, citing government brief", quote: "this wouldn’t be the best time in the world for you guys to be shredding a bunch of stuff."}
  - id: c3
    rel: involved
    to: david-duncan
    role: "Andersen audit partner warned by Sherron Watkins in August 2001"
    src:
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, factual background", quote: "Petitioner’s “engagement team” for Enron was headed by David Duncan."}
      - {s: scotus-544us696-arthur-andersen, at: "Opinion of the Court, factual background", quote: "She likewise informed Duncan and Michael Odom, one of petitioner’s partners who had supervisory responsibility over Duncan, of the looming problems."}
      - {s: enron-2002-02-01-powers-report, at: "Section VII.C, Watkins’s letter", quote: "I am incredibly nervous that we will implode in a wave of accounting scandals."}
      - {s: house-2002-02-14-watkins-testimony, at: "Watkins’s testimony", quote: "I was not comfortable confronting either Mr. Skilling or Mr. Fastow with my concerns. To do so I believed would have been a job terminating move."}
  - id: c4
    rel: appears_in
    to: powers-report
    role: "Enron board committee’s investigation of related-party transactions"
    src:
      - {s: enron-2002-02-01-powers-report, at: "Summary, Outside Professional Advisors", quote: "The evidence available to us suggests that Andersen did not fulfill its professional responsibilities in connection with its audits of Enron’s financial statements"}
      - {s: enron-2002-02-01-powers-report, at: "Introduction", quote: "have had only limited access to certain workpapers of Arthur Andersen LLP"}
---
