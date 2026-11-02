---
uid: 01M6DVVA9R886FPQAX5Z27H7W5
id: institute-for-the-works-of-religion
type: org
name: "Institute for the Works of Religion"
in_sentence: "the Institute for the Works of Religion"
aliases: ["IOR", "Vatican Bank", "Istituto per le Opere di Religione", "Institute for Religious Works"]
summary: "The Vatican's bank, known as the IOR; its founding is dated 1942 (TIME) or 1887 (Financial Times)."
claims:
  - id: c1
    rel: owns_stake
    to: banco-ambrosiano
    when: "1982"
    percent: 1.589
    as_of: "1982"
    note: "TIME, 1982. Italian financial sources suggested the holding could be as high as 10 per cent; Vatican officials said that was exaggerated."
    src:
      - {s: time-1982-09-13-great-vatican-bank-mystery, at: "page 4 of 8", quote: "the I.O.R. eventually became Banco Ambrosiano's fourth-largest stockholder, acquiring over the years at least 794,390 shares, or 1.589% of the bank's stock."}
  - id: c2
    rel: settled_with
    to: banco-ambrosiano
    when: "1984-05-25"
    case: "Banco Ambrosiano creditors, 1984"
    title: "payment \"in recognition of its moral involvement\"; legal responsibility denied"
    amount: 244000000
    currency: "USD"
    note: "Reports differ: TIME, from the 161-page agreement, and the Financial Times say $244 million; the Christian Science Monitor, the Associated Press, the Los Angeles Times and an Italian press report on the Vatican's papers say $250 million. TIME says the Vatican negotiated a clause that the payment was made solely for moral reasons; the Los Angeles Times says the Vatican called it a goodwill settlement and denied any moral or legal blame. The Italian press report (no named publisher or date) says Secretary of State Casaroli decided that the Holy See would pay as moral compensation, endorsed by John Paul II at Castel Gandolfo in August 1983, while Marcinkus and the cardinals' economic commission pressed to resist, and that the IOR sold its Banco di Roma per la Svizzera holdings and the rest came from the staff pension fund. TIME instead reports a sale of the Vianini stake and borrowing from London banks."
    src:
      - {s: time-1984-05-21-a-moral-duty, quote: "Last week, after nearly two years of intense negotiation, Ambrosiano’s creditors quietly circulated a 161-page agreement that called for the Vatican to pay them $244 million in recognition of its “moral involvement” in the bank failure."}
      - {s: csmonitor-1984-05-22-news-in-brief, quote: "The Vatican bank has signed a tentative accord calling for the institution to pay $250 million to the creditors of Italy's largest private bank"}
      - {s: nbc-ap-2007-06-06-gods-banker-acquittals, quote: "While denying any wrongdoing, the Vatican bank agreed to pay US$250 million to Ambrosiano's creditors."}
      - {s: martini-ior-casaroli-papers-press-report, quote: "L’accordo venne firmato il 25 maggio 1984 a Ginevra."}
      - {s: seattle-times-2006-02-22-marcinkus-dies, quote: "The Vatican, a major shareholder in Banco Ambrosiano, paid $250 million to the failed institution's creditors in what it called a goodwill settlement. It denied any moral or legal blame."}
      - {s: time-1984-05-21-a-moral-duty, quote: "To raise funds for the settlement, which is due by June 30, the church recently sold its controlling interest in Vianini, one of Italy’s largest construction companies, for an estimated $35 million."}
      - {s: time-1984-05-21-a-moral-duty, quote: "In arriving at a settlement with Ambrosiano’s 120 bank creditors, the Vatican negotiated a clause stating that the payment was being made solely because of moral considerations."}
      - {s: ft-2010-09-21-dinmore-popes-top-banker, quote: "In 1984 the Vatican denied all wrongdoing but IOR paid $244m to creditors of the collapsed bank in exchange for the dropping of further claims against the Vatican."}
      - {s: martini-ior-casaroli-papers-press-report, quote: "decise che la Santa Sede avrebbe versato, a titolo di indennizzo morale, senza riconoscere alcuna responsabilità, una somma di 250 milioni di dollari"}
      - {s: martini-ior-casaroli-papers-press-report, quote: "Marcinkus e i presuli della commissione economica cardinalizia premevano affinché il Vaticano facesse muro"}
      - {s: martini-ior-casaroli-papers-press-report, quote: "L’accordo sull’indennizzo di 250 milioni di dollari fu avallato anche da Giovanni Paolo II in una riunione segreta che si tenne a Castel Gandolfo nell’agosto 1983"}
      - {s: martini-ior-casaroli-papers-press-report, quote: "Per far fronte a quella somma lo Ior dovette vendere le partecipazioni del Banco di Roma per la Svizzera."}
      - {s: martini-ior-casaroli-papers-press-report, quote: "Il resto venne ricavato dal fondo pensione dei dipendenti."}
      - {s: seattle-times-2006-02-22-marcinkus-dies, quote: "Archbishop Marcinkus always denied any involvement in the bank's failure and said the Catholic Church should not have made the payment."}
      - {s: time-1984-05-21-a-moral-duty, quote: "According to one church official, the settlement will mean that the Vatican’s accountability in the matter “will finally be completely resolved.”"}
  - id: c3
    rel: located_in
    to: vatican-city
    note: "MONEYVAL (2021) calls the IOR the one entity in the Holy See and Vatican City State authorised to carry out financial activities. TIME (1982): founded in 1942."
    src:
      - {s: moneyval-2021-holy-see, quote: "most of the customers of the one entity - the Institute for the Works of Religion - that has been authorised to carry out financial activities are non-resident"}
      - {s: time-1982-09-13-great-vatican-bank-mystery, at: "page 1 of 8", quote: "Founded in 1942 to invest and increase the funds given to the Holy See for religious works, the I.O.R. is much like any other international commercial bank."}
  - id: c4
    rel: funded
    to: rizzoli-editore
    when: "1977"
    role: "capital increase of 1977"
    note: "A finding of the parliamentary commission on P2 (1984), not of a court. English summary: the 1977 capital increase of Rizzoli Editore, the publisher that owned the Corriere della Sera, was funded with money from the IOR drawn from its accounts at several banks; the report says the new shares stood in the name of Andrea Rizzoli but had already been endorsed over to the IOR, and that Gelli and Ortolani directed the operation."
    src:
      - {s: p2-commission-report-1984-text, quote: "con fondi provenienti dall'Istituto Opere di Religione che utilizza a tal fine disponibilità esistenti a suo nome presso diverse banche"}
  - id: c5
    rel: distinct_from
    to: holy-see
    note: "A separate institution, but MONEYVAL (2012) says the IOR and the Administration of the Patrimony of the Holy See are \"ultimately controlled by the HS/VCS\", the Holy See and Vatican City State. The Financial Times says it is overseen by five cardinals and has no shareholders."
    src:
      - {s: moneyval-2012-holy-see, quote: "Both financial institutions are ultimately controlled by the HS/VCS."}
      - {s: ft-2010-09-21-dinmore-popes-top-banker, quote: "It is overseen by five key cardinals, has no shareholders and its profits are used for charitable purposes."}
      - {s: ft-2010-09-21-dinmore-popes-top-banker, quote: "Originally founded in 1887 and housed within a medieval bastion within the Vatican"}
---

The Institute for the Works of Religion (in Italian, Istituto per le Opere di Religione) is the bank of the Vatican. It is a separate institution from the [[holy-see]], but MONEYVAL says it is ultimately controlled by the Holy See and Vatican City State. TIME says [[paul-marcinkus]] was put in charge in 1969; the London Review of Books dates his presidency from 1971. In 1984 it agreed to pay the creditors of [[banco-ambrosiano]] about $244 to $250 million while the Vatican denied legal responsibility. MONEYVAL's 2021 report describes it as the one entity authorised to carry out financial activities in the Holy See and Vatican City State.
