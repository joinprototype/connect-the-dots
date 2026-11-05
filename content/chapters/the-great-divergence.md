---
uid: 01M6MG61CW7773PAPNYRZH1GEK
id: the-great-divergence
type: chapter
title: How Europe Pulled Ahead
subtitle: Around the year 1000 China was at least as rich as England. By 1913 the United Kingdom was far ahead, and a few European powers held vast empires. Historians still argue why.
summary: Income per head, plague, printing, voyages, silver, coal and steam, and the Opium War with China. Here is the road between 1000 and 1914, and the reasons historians give for it, each in the words of the one who holds it.
---

Around the year 1000 China was at least as rich as England. By 1913 the United Kingdom's income per head was about eight times China's, and a handful of powers, most of them European, held much of the globe. "Europe was in the dark" is a popular picture of the centuries before 1000. This story starts there, and then follows the numbers.

The figures are estimates, and the story says whose. The reasons are argued, and the story does not pick one: Pomeranz, Allen, Mokyr, Acemoglu, Johnson and Robinson, Landes, Diamond, Parthasarathi and Williams each get their say, with their critics where a source gives one. Where a source could not be read in full, the last scene says so.

```scene
- shot: the-question
  view: map
  camera: {globe: true, center: [60, 38], zoom: 2.0, duration: 6}
  places: [london, beijing]
  time: "1913"
  reveal: [great-divergence, maddison-project-database-2020, london, beijing]
  reveal_claims: [great-divergence#c1, great-divergence#c2]
  overlay: {kind: stat, value: "$8,212 against $985", label: "Income per head in 1913, United Kingdom and China, in 2011 U.S. dollars (Maddison Project 2020)", source: maddison-project-2020-data-extract, quote: "GBR United Kingdom 1913 8212 45649"}
  narration: "**The question.** Around the year 1000 China was at least as rich as England. By 1913 the United Kingdom's income per head was more than eight times China's. The Maddison Project's 2020 estimates, in 2011 U.S. dollars: $1,151 for the United Kingdom series (which is England's before 1700) and $1,225 for China in 1000; $8,212 and $985 in 1913; India $1,073 in 1913, with no figure before 1600. They are reconstructions from thin records. Two teams find China's income fell by about a third in the 18th century, so the gap opened from both sides. Why, and when, is still argued."
  duration: 13

- shot: a-borrowed-darkness
  view: graph
  focus: dark-ages-label
  time: "1350"
  reveal: [dark-ages-label, petrarch, middle-ages-label]
  reveal_claims: [petrarch#c1, petrarch#c2, dark-ages-label#c1]
  overlay: {kind: quote, source: medievalists-2023-why-dark-ages, quote: "Since then, historians have developed a much more positive view of the medieval period and its achievements, and the label “Dark Ages” has fallen out of favour in academic writing.", caption: "Medievalists.net"}
  narration: "**A borrowed darkness.** “Europe was in the dark” is an old judgement, not a finding. The poet Petrarch, a 14th-century admirer of Rome and Greece, found his own age wanting and hoped a better one would follow. The centuries between the ancients and Petrarch's own followers came to be called the Middle Ages, and by the 19th century “Dark Ages” meant much the same. Historians have mostly dropped the phrase. Some English historians keep it for the 5th and 6th centuries in Britain, mostly because that time left few written sources."
  duration: 13

- shot: what-the-letters-show
  view: graph
  focus: dark-ages-label
  time: "0800"
  reveal: [dark-ages-label, middle-ages-label]
  overlay: {kind: quote, source: charlemagne-letter-to-baugulf, quote: "what pious devotion dictated faithfully to the mind, the tongue, uneducated on account of the neglect of study, was not able to express in the letter without error", caption: "Charlemagne to Abbot Baugulf of Fulda, c. 780–800"}
  narration: "**What the early record shows.** Between about 780 and 800 King Charlemagne wrote to Abbot Baugulf of Fulda that letters from monasteries held “correct thoughts and uncouth expressions”, because the writers' tongues were uneducated through neglect of study. By his own account learning had slipped, and he ordered the bishoprics and monasteries to teach those able to learn. One letter cannot stand for a continent, but it shows a ruler who thought schooling worth repairing."
  duration: 13

- shot: around-the-year-1000
  view: map
  camera: {globe: true, center: [60, 35], zoom: 2.2, duration: 6}
  time: "1000"
  reveal: [great-divergence, maddison-project-database-2020, china-europe-and-the-great-divergence-2018]
  reveal_claims: [great-divergence#c1, great-divergence#c17]
  overlay: {kind: quote, source: broadberry-guan-li-2017-abstract, quote: "China led the world in living standards during the Northern Song dynasty, but had fallen behind Italy by 1300.", caption: "Broadberry, Guan and Li, working paper, 2017"}
  narration: "**Around the year 1000.** A team that counted China's income back to the Song dynasty found it near the top of the world, and the Maddison Project uses their series for China to 1661. Its figures for 1000 are China $1,225, England $1,151, Iraq $1,307 and Egypt $956. The file names no source for England's figure; Iraq's and Egypt's come from Pamuk and Shatzmiller. It has no income figure for India or Italy that early."
  duration: 13

- shot: the-plague
  view: map
  camera: {globe: true, center: [8, 47], zoom: 3.2, duration: 6}
  places: [kingdom-of-england]
  time: "1348"
  reveal: [black-death, kingdom-of-england, persecution-of-jews-in-the-black-death, clement-vi]
  reveal_claims: [black-death#c3, black-death#c4, persecution-of-jews-in-the-black-death#c2, persecution-of-jews-in-the-black-death#c3]
  overlay: {kind: quote, source: boccaccio-decameron-payne-translation, quote: "it is believed for certain that upward of an hundred thousand human beings perished within the walls of the city of Florence", caption: "Giovanni Boccaccio, The Decameron, John Payne’s translation"}
  narration: "**The plague.** In 1348 the plague reached Florence. Boccaccio wrote that between March and July it was “believed for certain” that upward of 100,000 people died inside the city: his belief, not a count. In England, Gregory Clark's series shows money wages up 101 per cent by 1350, which fits the usual estimate of a 25 to 40 per cent loss of people. In the Rhine lands and Switzerland, Jews were arrested, tortured and burned on a false charge of poisoning wells. Pope Clement VI wrote that the charge “cannot be true”."
  duration: 13

- shot: scarce-hands
  view: graph
  focus: ordinance-of-labourers-1349
  time: "1349-06-18"
  reveal: [edward-iii-of-england, ordinance-of-labourers-1349, black-death, kingdom-of-england]
  reveal_claims: [black-death#c2, edward-iii-of-england#c1, edward-iii-of-england#c2]
  overlay: {kind: quote, source: fordham-ordinance-of-labourers-1349, quote: "many seeing the necessity of masters, and great scarcity of servants, will not serve unless they may receive excessive wages", caption: "Ordinance of Labourers, 18 June 1349"}
  narration: "**Scarce hands.** Around 1300, Clark finds, English farm workers had the lowest real wages in the country's recorded history. After the plague workers were scarce. On 18 June 1349 King Edward III, with his council, ordered that no one take more than the wages paid in the twentieth year of his reign; a Statute of Labourers followed in 1351. Clark thinks that statute may have pushed reported wages down about 14 per cent in 1352, though “the effect was clearly modest” and side payments could have made up the gap. By the 1760s real day wages stood about 70 per cent above the trough of around 1300."
  duration: 13

- shot: the-press
  view: graph
  focus: printing-press
  time: "1500"
  reveal: [johannes-gutenberg, printing-press, gutenberg-bible, mainz, martin-luther, ninety-five-theses, spread-of-luthers-writings]
  reveal_claims: [johannes-gutenberg#c3, ninety-five-theses#c2, martin-luther#c2, spread-of-luthers-writings#c1]
  overlay: {kind: stat, value: "60% faster", label: "Growth, 1500 to 1600, of European cities with a printing press in the 1400s against otherwise similar cities (Dittmar, 2011)", source: dittmar-2011-printing-press-abstract, quote: "Between 1500 and 1600, European cities where printing presses were established in the 1400s grew 60% faster than otherwise similar cities."}
  narration: "**The press.** Johannes Gutenberg's press in Mainz printed its Bible about 1455, and Luther's writings reached Nuremberg, Basel and Leipzig within three years of 1517. Jeremiah Dittmar found that cities with presses in the 1400s grew faster in the 1500s than similar cities. Whether that explains Europe's rise is argued. Mokyr says earlier breakthroughs, the printing press among them, “did not trigger anything resembling sustained technological progress”. Pomeranz argues that China's richest regions kept pace with Europe's until the end of the 1700s."
  duration: 13

- shot: the-sea-road
  view: map
  camera: {globe: true, center: [10, 22], zoom: 2.0, duration: 6}
  places: [lisbon, india]
  time: "1498"
  reveal: [voyage-of-vasco-da-gama, vasco-da-gama, bombardment-of-calicut-1502, manuel-i-of-portugal, lisbon, india]
  reveal_claims: [voyage-of-vasco-da-gama#c1, voyage-of-vasco-da-gama#c2, vasco-da-gama#c1, bombardment-of-calicut-1502#c1]
  overlay: {kind: quote, source: gama-first-voyage-journal-lumen, quote: "informing him that an ambassador had arrived from the King of Portugal with letters", caption: "Journal of the first voyage of Vasco da Gama, translation"}
  narration: "**The sea road.** On 8 July 1497 four ships left Portugal under Vasco da Gama, put in command by King Manuel. On 20 May 1498 they reached Calicut, in India. The anonymous journal records that Gama sent word to the local king that “an ambassador had arrived from the King of Portugal with letters”. The same textbook editor says the route moved Europe's trade to the Atlantic coast, and that in 1502 Gama “bombarded Calicut (virtually destroying the port)”. How much such voyages mattered to Europe's income is argued below."
  duration: 13

- shot: landfall
  view: map
  camera: {globe: true, center: [-72, 22], zoom: 4.2, duration: 6}
  places: [hispaniola]
  time: "1492-10-12"
  reveal: [voyage-of-columbus-1492, christopher-columbus, columbus-journal-1492, great-dying-of-the-americas, hispaniola, transatlantic-slave-trade]
  reveal_claims: [voyage-of-columbus-1492#c1, great-dying-of-the-americas#c1]
  overlay: {kind: quote, source: columbus-journal-1492-fordham, quote: "It appears to me, that the people are ingenious, and would be good servants", caption: "Christopher Columbus, journal, 12 October 1492"}
  narration: "**Landfall.** On 12 October 1492 Columbus wrote of the people he met on an island the journal calls Guanahani: “It appears to me, that the people are ingenious, and would be good servants.” He meant to carry six of them home to the Spanish king and queen, “that they may learn our language”, and next day he “strove to learn if they had any gold.” Within decades the Native population of the Americas collapsed. Estimates of the loss run from 40 to 95 per cent. On Hispaniola, Ostler writes, only twenty to thirty thousand adult Taíno remained, against at least several hundred thousand before. The Great Dying story follows the causes."
  duration: 13

- shot: silver
  view: map
  camera: {globe: true, center: [-30, 5], zoom: 1.9, duration: 6}
  places: [potosi, spain]
  time: "1550"
  reveal: [discovery-of-potosi-silver, potosi, american-silver-imports, price-revolution, spain, potosi-mita, ransom-of-atahualpa]
  reveal_claims: [discovery-of-potosi-silver#c1, discovery-of-potosi-silver#c3, potosi-mita#c2, american-silver-imports#c1, price-revolution#c1]
  overlay: {kind: quote, source: cieza-travels-markham-1864, quote: "From the year 1548 to 1551 the royal fifths were valued at more than three millions of ducats, which is more than the Spaniards got from Atahualpa", caption: "Pedro de Cieza de León, Travels, Markham’s translation, 1864"}
  narration: "**Silver.** Silver mining began in earnest at Cerro Rico above Potosí in the mid-1540s. Pedro de Cieza wrote that from 1548 to 1551 the Crown's fifth came to over three million ducats, “more than the Spaniards got from Atahualpa”. A reference entry says the mita, a forced labour draft, mobilised over 11,000 Indians a year for Potosí. Earl Hamilton sought to show the silver was “chiefly, if not entirely” responsible for the Price Revolution, John Munro writes. Pomeranz and Acemoglu, Johnson and Robinson each put the Americas in their accounts, for different reasons."
  duration: 13

- shot: a-company-with-an-army
  view: graph
  focus: east-india-company
  time: "1765"
  reveal: [grant-of-the-charter-1600, east-india-company, battle-of-plassey, grant-of-the-diwani-1765, london, bengal]
  reveal_claims: [grant-of-the-charter-1600#c1, east-india-company#c1, grant-of-the-diwani-1765#c1]
  overlay: {kind: stat, value: "Almost 57%", label: "Share of world manufacturing output made by China and India together in 1750, in Bairoch’s estimates via Simmons, as retold by Clingingsmith and Williamson", source: clingingsmith-williamson-2004-india-deindustrialization, quote: "In 1750, China and India combined to account for almost 57 percent of world manufacturing output, while India itself accounted for almost a quarter."}
  narration: "**A company with an army.** In 1600 London merchants were incorporated as “the Governor and Company of Merchants of London trading into the East Indies”. At Plassey in 1757 its troops fought, in A. C. Lyall's words, “not as auxiliaries, but as principals”, and a grant of 1765 gave it Bengal's revenue. Clingingsmith and Williamson, retelling Bairoch, put China and India at almost 57 per cent of world manufacturing in 1750. They name the decline of the Mughals, “the huge net transfer from India to Britain before 1815”, and after 1810 the fall in world cloth prices from British factories. Allen says Britain's success in trade “owed much to mercantilism and imperialism”."
  duration: 13

- shot: the-society
  view: graph
  focus: royal-society
  time: "1662"
  reveal: [royal-society, charters-of-the-royal-society-1662, london, kingdom-of-england]
  reveal_claims: [charters-of-the-royal-society-1662#c1, charters-of-the-royal-society-1662#c2, royal-society#c1]
  overlay: {kind: quote, source: moxham-2019-natural-knowledge-inc, quote: "It gave royal recognition to the enterprise of ‘promoting natural knowledge’ (in the phrase of the revised Charter of 1663).", caption: "Noah Moxham, University of Kent, 2019"}
  narration: "**The Society.** Regular attendees at Christopher Wren's astronomy lectures at Gresham College proposed, in November 1660, “a college for the promoting of physico-mathematical experimental learning”. King Charles II chartered the Royal Society in 1662 and revised the charter in 1663. Noah Moxham notes it “enjoyed no monopoly and few responsibilities”. How much such science mattered is disputed: Mokyr puts useful knowledge at the centre of Europe's growth, while Allen holds that the industrial revolution “was primarily an engineering challenge rather than a scientific challenge”."
  duration: 13

- shot: water-in-the-mines
  view: graph
  focus: newcomen-engine
  time: "1712"
  reveal: [newcomen-engine, coal-and-colonies, dear-labour-cheap-energy, kenneth-pomeranz, robert-c-allen]
  reveal_claims: [coal-and-colonies#c2, dear-labour-cheap-energy#c2]
  overlay: {kind: quote, source: allen-2010-british-industrial-revolution-keynes-lecture, quote: "The reason it was profitable to develop the Newcomen engine in Britain was because there were coal mines to be drained.", caption: "Robert Allen, Keynes Lecture, British Academy, 2009"}
  narration: "**Water in the mines.** In 1712 Newcomen's engine began pumping water out of coal mines. Allen: “The reason it was profitable to develop the Newcomen engine in Britain was because there were coal mines to be drained.” Pomeranz adds that it “lost over 99% of its power in conversion” and still paid, because it stood at the pit-head where coal was cheapest. By Allen's figures the fuel burned fell from 44 pounds of coal per horsepower-hour in 1727 to 3 pounds in 1847."
  duration: 13

- shot: the-condenser
  view: graph
  focus: watt-separate-condenser
  time: "1769"
  reveal: [james-watt, watt-patent-1769, watt-separate-condenser, newcomen-engine]
  reveal_claims: [james-watt#c1, watt-separate-condenser#c1, newcomen-engine#c1]
  overlay: {kind: quote, source: watt-patent-1769-specification, quote: "method of lessening the consumption of steam, and consequently fuel, in fire engines consists of the following principles", caption: "James Watt, specification of patent no. 913, 1769"}
  narration: "**The condenser.** On 25 April 1769 James Watt, “Merchant” of Glasgow, signed the description of his method of “lessening the consumption of steam, and consequently fuel”. The cylinder, he wrote, must be kept as hot as the steam that enters it, and the steam condensed in vessels apart from it. Allen counts Watt among the engineers who cut the engine's coal use. The Warwick feature says the pumping engines “later inspired the Watt steam engine, and eventually, the railways”."
  duration: 13

- shot: two-answers-on-coal
  view: graph
  focus: great-divergence
  time: "1800"
  reveal: [great-divergence, coal-and-colonies, dear-labour-cheap-energy, kenneth-pomeranz, robert-c-allen, transatlantic-slave-trade]
  reveal_claims: [great-divergence#c4, great-divergence#c5, transatlantic-slave-trade#c1]
  overlay: {kind: quote, source: warwick-cage-pomeranz-why-the-west, quote: "A ton of coal saves you roughly two tons of firewood.", caption: "Kenneth Pomeranz, in a Warwick CAGE feature"}
  narration: "**Two answers on coal.** Kenneth Pomeranz and Robert Allen both start from cheap British coal. For Pomeranz, coal and American land eased the limit crowded regions hit: an acre of cotton is not an acre of grain. The Warwick feature adds that the cotton grew on land “acquired” from Native Americans and was worked by enslaved people, mostly trafficked from Africa, and that whether other colonial goods were needed is “an active area of contention”. For Allen, high British wages and cheap energy made it pay to invent machines that saved labour. They differ on why coal mattered: land, or wages."
  duration: 13

- shot: culture-and-institutions
  view: graph
  focus: great-divergence
  time: "1700"
  reveal: [great-divergence, europes-culture-of-growth, atlantic-trade-and-institutions, culture-and-enterprise, joel-mokyr, daron-acemoglu, simon-johnson, james-a-robinson, david-landes]
  reveal_claims: [great-divergence#c6, great-divergence#c7, great-divergence#c8]
  overlay: {kind: quote, source: acemoglu-johnson-robinson-2005-rise-of-europe-abstract, quote: "helped merchants obtain changes in institutions to protect property rights", caption: "Acemoglu, Johnson and Robinson, American Economic Review, 2005"}
  narration: "**Culture and institutions.** Joel Mokyr looks to early modern Europe, “between the first voyage to America by Columbus and the publication of the Principia Mathematica by Newton”, for the roots of growth: a culture friendly to useful knowledge. Daron Acemoglu, Simon Johnson and James Robinson say Atlantic trade “and the associated colonialism” strengthened merchants where kings were already checked. David Landes holds that “culture makes all the difference”; an admiring reviewer calls his framework “unabashedly Eurocentric”. Mokyr says he aims to write such history “without sounding ‘triumphalist’”."
  duration: 13

- shot: land-germs-and-states
  view: graph
  focus: environmental-differences
  time: "1500"
  reveal: [jared-diamond, guns-germs-and-steel, environmental-differences, state-policy-and-competition, prasannan-parthasarathi, why-europe-grew-rich-and-asia-did-not]
  reveal_claims: [great-divergence#c9, great-divergence#c10, jared-diamond#c1]
  overlay: {kind: quote, source: acemoglu-johnson-robinson-2002-reversal-of-fortune-abstract, quote: "This reversal weighs against a view that links economic development to geographic factors.", caption: "Acemoglu, Johnson and Robinson, Quarterly Journal of Economics, 2002"}
  narration: "**Land, germs and states.** Jared Diamond began with a question from Yali, a New Guinean politician: why had Europeans so much cargo and his people so little? The Rachel Carson Center summarises his answer, “environmental differences are decisive”, as an account of how Europe won the Americas; it does not say he applies it to Europe and China. Acemoglu, Johnson and Robinson read the record the other way: among lands Europe colonised, those richest in 1500 are now relatively poor, which they say weighs against geography as the cause. Parthasarathi finds Europe and Asia “more alike than different” in the 17th and 18th centuries, and points to state policy."
  duration: 13

- shot: when
  view: graph
  focus: the-great-divergence-book
  time: "1750"
  reveal: [stephen-broadberry, kenneth-pomeranz, the-great-divergence-book, china-europe-and-the-great-divergence-2018, great-divergence]
  reveal_claims: [stephen-broadberry#c1, stephen-broadberry#c2]
  overlay: {kind: quote, source: warwick-cage-pomeranz-why-the-west, quote: "I date the great divergence to 1700, but that’s because I focus on the Yangtze Delta", caption: "Stephen Broadberry, in a May 2026 interview quoted by CAGE, Warwick"}
  narration: "**When?** Pomeranz dates the divergence late: towards the end of the 18th century, perhaps as late as 1800. Stephen Broadberry, who builds income estimates, dates it earlier. Two independent teams find China's income fell by about a third in the 18th century. With Hanhui Guan and David Li he finds China behind Italy by 1300 and, by 1750, a gap “too large to be bridged by regional variation within China”. Broadberry agrees with Pomeranz that China's dynamic regions must be looked at separately; what he disputes is the date."
  duration: 13

- shot: what-the-emperor-said
  view: map
  camera: {globe: true, center: [114, 31], zoom: 4.2, duration: 6}
  places: [guangzhou, beijing]
  time: "1793"
  reveal: [british-embassy-to-china-1793, qianlong-emperor, qing-government, guangzhou, beijing]
  reveal_claims: [british-embassy-to-china-1793#c2, british-embassy-to-china-1793#c3]
  overlay: {kind: quote, source: qianlong-1793-letter-to-george-iii, quote: "Our Celestial Empire possesses all things in prolific abundance and lacks no product within its own borders.", caption: "Qianlong Emperor to King George III, 1793"}
  narration: "**What the emperor said.** In 1793 King George III sent an embassy to the Qianlong Emperor to ask for trade privileges. Qianlong refused a resident British envoy as “contrary to all usage of my dynasty”, and wrote that China “possesses all things in prolific abundance”. He allowed foreign firms at Canton because “tea, silk and porcelain” were “absolute necessities to European nations”. The edict refused terms; how far it shows Chinese attitudes, and whether it explains what followed, these sources do not say."
  duration: 13

- shot: the-drug
  view: graph
  focus: east-india-company
  time: "1839"
  reveal: [east-india-company, opium-monopoly-in-bengal, bengal, seizure-of-opium-at-canton-1839, lin-zexu, guangzhou]
  reveal_claims: [east-india-company#c2, opium-monopoly-in-bengal#c1, seizure-of-opium-at-canton-1839#c1, lin-zexu#c1]
  overlay: {kind: quote, source: lin-zexu-1839-letter-to-queen-victoria, quote: "We have heard that in your own country opium is prohibited with the utmost strictness and severity", caption: "Lin Zexu to Queen Victoria, 1839"}
  narration: "**The drug.** In the Commons in 1840, speakers tied the opium trade to British India. One named “the opium monopoly enjoyed by the East-India Company”, another said the trade was “directly encouraged first by the East India Company”, and a letter from Sir George Robinson, read there, proposed “to prohibit the growth of the poppy, and the manufacture of opium in British India”. The debate itself called the trade contraband: China had banned it. Commissioner Lin Zexu wrote to Queen Victoria that in her own country opium was “prohibited with the utmost strictness and severity”. In 1839 he took 20,283 chests and had them destroyed."
  duration: 13

- shot: nanjing
  view: map
  camera: {globe: true, center: [114.2, 22.8], zoom: 6.0, duration: 6}
  places: [guangzhou]
  time: "1842-08-29"
  reveal: [first-opium-war, treaty-of-nanking-1842, qing-government, british-government, commons-debate-on-the-china-war-1840, guangzhou]
  reveal_claims: [first-opium-war#c1, first-opium-war#c2, treaty-of-nanking-1842#c1, commons-debate-on-the-china-war-1840#c1]
  overlay: {kind: stat, value: "$21 million", label: "What the Emperor of China agreed to pay Britain in 1842: opium, merchants’ debts and the cost of the expedition", source: treaty-of-nanking-1842-text, quote: "the Total amount of Twenty-one Millions of Dollars, described in the three preceding Articles"}
  narration: "**Nanjing, 1842.** Britain answered the seizure with an expedition, and the war of 1839 to 1842 followed; the treaty says Britain was “obliged to send out an Expedition”. It also calls the surrendered opium a ransom for British subjects “imprisoned and threatened with death”: Britain's account. China was to open Canton, Amoy, Foochow, Ningpo and Shanghai, cede Hong Kong “in perpetuity”, and pay $21 million ($6 million for the opium, $3 million for Hong merchants' debts, $12 million for the expedition). In April 1840 the Commons had rejected, 271 to 262, a motion censuring the ministers' China policy. The treaty text does not mention the opium trade itself."
  duration: 13

- shot: by-1914
  view: map
  camera: {globe: true, center: [45, 22], zoom: 1.6, duration: 6}
  places: [india, london]
  time: "1914"
  reveal: [great-divergence, india, london, beijing]
  reveal_claims: [great-divergence#c1]
  overlay: {kind: stat, value: "65.0 of 133.9", label: "Million square kilometres held as colonies by six great powers in 1914, of the world total, in Lenin’s table from Hübner", source: lenin-1916-imperialism-chapter-6, quote: "After 1876 colonial possessions increased to enormous dimensions, by more than fifty per cent, from 40,000,000 to 65,000,000 square kilometres for the six biggest powers"}
  narration: "**By 1914.** In Lenin's table, drawn from Hübner's statistics, six powers (Britain, Russia, France, Germany, the United States and Japan) held colonies of 65.0 million square kilometres in 1914, up from 40.4 million in 1876, out of 133.9 million for the world. Dividing his columns, Britain and its colonies together make up about a quarter. Lenin counts the United States and Japan among the six, so this is not Europe's share alone. The Maddison Project puts income per head in 1913 at $8,212 in the United Kingdom, $1,073 in India and $985 in China. Eric Williams argued that slavery helped build British industry; this story read only a magazine essay on him. Whether the land gave the income, or the income the land, this story's sources do not settle."
  duration: 13

- shot: no-settled-answer
  view: graph
  focus: great-divergence
  time: "1913"
  reveal: [great-divergence, coal-and-colonies, dear-labour-cheap-energy, europes-culture-of-growth, atlantic-trade-and-institutions, culture-and-enterprise, environmental-differences, state-policy-and-competition, slavery-and-british-industry, eric-williams]
  reveal_claims: [great-divergence#c4, great-divergence#c5, great-divergence#c6, great-divergence#c7, great-divergence#c8, great-divergence#c9, great-divergence#c10, great-divergence#c18]
  overlay: {kind: quote, source: mokyr-2017-culture-and-economics, quote: "But a consensus on why this happened seems remote.", caption: "Joel Mokyr, A Culture of Growth, 2017"}
  narration: "**No settled answer.** Eight accounts, each with its holder, and a consensus that Mokyr calls “remote”. The numbers are as unsettled as the reasons: early incomes are reconstructions, and the date runs from about 1300 to 1800 depending on whose counts and which China. Not read in full: Landes (a review), Diamond (a profile), Pomeranz and Broadberry (an interview feature), Bairoch (a retelling), Williams (an essay about him), Columbus (extracts), the Royal Society charter (its site refused the request), and only the abstracts of Acemoglu, Johnson and Robinson, Allen 2011, Parthasarathi, Dittmar and Broadberry, Guan and Li."
  duration: 13
```
