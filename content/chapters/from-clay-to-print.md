---
uid: 01M6AK0SEKFHA422RGADYN7DT0
id: from-clay-to-print
type: chapter
title: From Clay to Print
subtitle: How writing went from counting bread and beer, through the alphabet and the Bible's first translations, to a press in Mainz
summary: Scribes kept accounts in Uruk. About 4,700 years later Gutenberg printed the Bible in Mainz, after generations of writers, translators and printers changed how words could travel.
---

Writing did not begin with poems or scripture. The earliest known writing kept accounts. This story follows one line from those accounts to a printed Bible about 4,700 years later, by way of an alphabet, the oldest surviving copies, two translations and a press.

There were other beginnings. Chinese and Maya writers developed their own scripts; writing in Asia is not thought to come from Sumer. Paper and movable type came first from Asia, with type used in China and Korea centuries before Gutenberg. The route through these places follows moments in the history of writing; a connection alone does not establish influence.

```scene
- shot: open
  view: map
  camera: {globe: true, center: [27, 36], zoom: 2.5, duration: 6}
  places: [uruk, mainz]
  routes: [[uruk, mainz]]
  time: "-3199~"
  reveal: [invention-of-writing, gutenberg-bible]
  narration: "**Two dots.** Around 3200 BCE, scribes in Uruk drew signs on clay to keep track of food. Around 1455, Johannes Gutenberg printed a Bible in Mainz. Some 4,700 years separate the people counting bread and beer from the printer multiplying pages of scripture. Between them lie decisions about what to record, whose language to use and which books to preserve—or burn."
  duration: 9

- shot: bread-and-beer
  view: map
  camera: {center: [45.6, 31.3], zoom: 5.2, pitch: 30, duration: 4}
  places: [uruk]
  borders: [sumer]
  time: "-3199~"
  reveal: [rise-of-cities-in-mesopotamia, invention-of-writing, uruk]
  reveal_claims: [rise-of-cities-in-mesopotamia#c1, invention-of-writing#c2]
  narration: "**Bread and beer.** Around 3200 BCE in Uruk, in today's Iraq, scribes drew signs on clay to keep accounts. The Metropolitan Museum of Art links their work to the temple estates' need to record revenues and distributions. The British Museum describes scribes keeping track of bread and beer rations. Their marks let a ration leave a record after the bread was eaten and the beer was gone."
  duration: 11

- shot: letters
  view: map
  camera: {center: [33.5, 29], zoom: 4.6, duration: 5}
  places: [serabit-el-khadim]
  borders: [egypt-middle-kingdom]
  time: "-1799~"
  reveal: [invention-of-the-alphabet, serabit-el-khadim, invention-of-writing]
  reveal_claims: [invention-of-writing#c1, invention-of-the-alphabet#c2]
  overlay: {kind: quote, source: met-2014-12-22-alphabet-origins-sinai, quote: "Acrophony is the use of a word to name or represent the letter with which it begins", caption: "Metropolitan Museum of Art, The Origins of the Alphabet, 2014"}
  narration: "**Letters.** In Alan Gardiner's reading, the makers of a new script at Serabit el-Khadim, an Egyptian turquoise mine in Sinai, drew on Egyptian pictures but used the sounds of their own Semitic language. An ox's head supplied the first sound of the word for ox; a house supplied the first sound of the word for house. Dates proposed for the inscriptions run from the nineteenth century BCE to after 1500 BCE, and their place at the alphabet's beginning remains disputed. Those pictures became letters that later writers could borrow."
  duration: 12

- shot: questions-on-bone
  view: map
  camera: {center: [114.3, 36.1], zoom: 5.6, pitch: 30, duration: 5}
  places: [yinxu]
  time: "-1199~"
  reveal: [oracle-bones, discovery-of-the-oracle-bones, tracing-of-the-oracle-bones-to-yinxu, yinxu, shang-dynasty]
  reveal_claims: [discovery-of-the-oracle-bones#c1, discovery-of-the-oracle-bones#c2, tracing-of-the-oracle-bones-to-yinxu#c1, yinxu#c1, shang-dynasty#c1]
  overlay: {kind: quote, source: lindahall-wang-yirong, quote: "He sought the original location of the bones from the pharmacist, who, feeling his livelihood threatened, refused to reveal his sources.", caption: "Linda Hall Library, Wang Yirong"}
  narration: "**Questions on bone.** In 1899 Wang Yirong, a director of the Imperial Academy, bought unground “dragon bones” from a pharmacist and recognized signs like early Chinese characters. When he asked where they came from, the pharmacist refused; the Linda Hall Library says he feared for his livelihood. Wang kept collecting and trying to read them. Only after 1909 were they traced to Yinxu, the late Shang capital, where diviners had heated bones and read cracks beside written questions. Hundreds of thousands have since been excavated. This was a separate writing tradition, with no known borrowing from Sumer: bones sold as medicine had reopened its early history."
  duration: 14

- shot: by-sea
  view: map
  camera: {center: [26, 35], zoom: 3.7, duration: 5}
  places: [serabit-el-khadim, byblos]
  routes: [[serabit-el-khadim, byblos]]
  borders: [phoenicia]
  time: "-0999~"
  reveal: [phoenician-alphabet, byblos, hebrew-alphabet, latin-alphabet]
  reveal_claims: [invention-of-the-alphabet#c3, phoenician-alphabet#c1, phoenician-alphabet#c2, phoenician-alphabet#c3]
  overlay: {kind: quote, source: britannica-phoenician-alphabet, quote: "The earliest Phoenician inscription that has survived is the Ahiram epitaph at Byblos in Phoenicia, dating from the 11th century bce and written in the North Semitic alphabet.", caption: "Encyclopaedia Britannica, Phoenician alphabet"}
  narration: "**By sea.** At Byblos in the eleventh century BCE, someone cut an epitaph for Ahiram—the oldest surviving Phoenician inscription. The epitaph kept a person's name alive in letters that others could reuse. Phoenician traders carried the script across the Mediterranean, leaving inscriptions as far west as Spain; Greeks adopted and adapted it. Early Hebrew writing varies little from the same family of alphabets. A script used to mark a death at Byblos became part of the ancestry of the letters Gutenberg would set in Mainz."
  duration: 13

- shot: the-traditions-account
  view: graph
  lens: all
  focus: moses
  perspective: judaism
  reveal: [moses, torah, judaism]
  reveal_claims: [moses#c9, torah#c1, moses#c10]
  overlay: {kind: quote, source: jps-tanakh-1917, quote: "And Moses wrote this law, and delivered it unto the priests the sons of Levi, that bore the ark of the covenant of the LORD, and unto all the elders of Israel.", caption: "Deuteronomy 31:9, Jewish Publication Society translation, 1917"}
  narration: "**The tradition's account.** In Deuteronomy, Moses faces his own death and the people's departure without him. He writes the law and hands it to the priests and elders, ordering a public reading every seven years. He orders the reading so the people and their children will learn to fear God and obey the law. Jewish tradition identifies him as the writer of the Torah, the Bible's first five books, after receiving God's revelation on Mount Sinai. In the text, writing and repeated reading carry the law beyond the life of its giver."
  duration: 13

- shot: the-scholars-account
  view: graph
  focus: composition-of-the-torah
  perspective: christine-hayes
  reveal: [composition-of-the-torah, christine-hayes, torah]
  reveal_claims: [composition-of-the-torah#c1, composition-of-the-torah#c2]
  overlay: {kind: quote, source: hayes-2006-yale-rlst145-lecture-5, quote: "the Torah is really the result of five centuries of religious and literary activity.", caption: "Christine Hayes, Yale University, lecture, 2006"}
  narration: "**The scholars' account.** After the exile in Babylon, priestly editors gathered older writings, added bridges and conclusions, and joined them into the Torah, in Christine Hayes's outline of modern source criticism. She reads their purpose in the finished work: they “wanted them to be read as a unity”. The documents span roughly the tenth to the sixth century BCE in that model; scholars still dispute their identities and dates. Where Jewish tradition sees Moses writing the law, these critics see generations of writers and a final act of assembly. In that reading, the editors left different voices inside one book."
  duration: 13

- shot: seventy-two-days
  view: map
  camera: {center: [29.9, 31.2], zoom: 4.6, duration: 5}
  places: [alexandria]
  borders: [ptolemaic-kingdom]
  time: "-0249~"
  reveal: [translation-of-the-septuagint, letter-of-aristeas, alexandria]
  reveal_claims: [translation-of-the-septuagint#c1, translation-of-the-septuagint#c4]
  overlay: {kind: stat, value: "72 days", label: "How long 72 elders took to put the law into Greek, according to the Letter of Aristeas", source: charles-1913-letter-of-aristeas, quote: "it so chanced that the work of translation was completed in seventy-two days, just as if this had been arranged of set purpose."}
  narration: "**Into Greek.** In the Letter of Aristeas, King Ptolemy II's librarian faces a gap in the royal collection: the Jewish law is missing, and it needs translating. The king sends to Jerusalem for six elders from each tribe; his letter gives the purpose, “that these books may be added to the other royal books in my library.” Demetrius houses the translators beside the sea at Pharos, where they compare their work and agree on the wording. Seventy-two days later, he reads it to the Jewish community. In the tale, the elders leave the community a law it can hear in Greek: the Septuagint."
  duration: 12

- shot: what-the-language-shows
  view: map
  camera: {center: [29.9, 31.2], zoom: 5.2, duration: 3}
  places: [alexandria]
  borders: [ptolemaic-kingdom]
  time: "-0249~"
  reveal: [translation-of-the-septuagint, septuagint, alexandria]
  reveal_claims: [translation-of-the-septuagint#c2, septuagint#c1]
  overlay: {kind: quote, source: britannica-septuagint, quote: "Analysis of the language has established that the Torah, or Pentateuch (the first five books of the Old Testament), was translated near the middle of the 3rd century bce and that the rest of the Old Testament was translated in the 2nd century bce.", caption: "Encyclopaedia Britannica, Septuagint"}
  narration: "**What the language shows.** The translators working in Egypt put Hebrew scripture into the language spoken around them. Britannica suggests they were serving the local Jewish community, where Greek was common; it calls the Letter of Aristeas unreliable. The Greek itself places the Torah's translation near the middle of the third century BCE and the rest of the Old Testament in the second. Differences of style and usage separate the earlier books from the later ones. These translators left a Greek Bible that Christians would use—and that Jerome would first turn to for his Latin."
  duration: 12

- shot: signs-that-sound
  view: map
  camera: {center: [30.4, 31.4], zoom: 5.6, duration: 4}
  places: [rosetta]
  time: "-0195"
  reveal: [rosetta-stone, discovery-of-the-rosetta-stone, decipherment-of-hieroglyphs, jean-francois-champollion, lettre-a-m-dacier, rosetta]
  reveal_claims: [rosetta-stone#c1, discovery-of-the-rosetta-stone#c1, decipherment-of-hieroglyphs#c1, decipherment-of-hieroglyphs#c2]
  overlay: {kind: quote, source: bm-gac-rosetta-stone, quote: "Thomas Young, an English physicist, was the first to show that some of the hieroglyphs on the Rosetta Stone wrote the sounds of a royal name, that of Ptolemy.", caption: "British Museum, The Rosetta Stone"}
  narration: "**Signs that sound.** In 1822 Champollion examined how hieroglyphs spelled Greek and Roman rulers' names, initially framing this as an exception. But his letter also concludes that the same sound signs occur in texts from long before Greek rule in Egypt. Thomas Young had first shown, the British Museum says, that signs spelled Ptolemy's name. Their key was a decree Egyptian priests had cut in hieroglyphs, demotic and Greek in 196 BCE. Napoleon's soldiers found the stone in 1799 while digging foundations near Rosetta; it has been in the British Museum since 1802. The readable Greek gave them a way into the other signs, reopening words that had been unread for some 1,400 years."
  duration: 14

- shot: the-oldest-copies
  view: map
  camera: {center: [35.46, 31.74], zoom: 5.6, pitch: 30, duration: 5}
  places: [qumran]
  time: "-0099~"
  reveal: [dead-sea-scrolls, qumran, torah]
  reveal_claims: [dead-sea-scrolls#c1, dead-sea-scrolls#c2]
  overlay: {kind: stat, value: "Over 1,000 years", label: "How much older the scrolls are than the biblical manuscripts known before them", source: iaa-dss-introduction, quote: "This similarity is quite remarkable, considering that the Qumran Scrolls are over a thousand years older than previously identified biblical manuscripts."}
  narration: "**The oldest copies.** A scribe added words to a Psalms scroll later found near Qumran. The Israel Antiquities Authority points to such additions and deletions as evidence that some copyists felt free to change the texts they copied. Other biblical scrolls closely resemble the Hebrew text used today. Dating from the third century BCE to the first century CE, the scrolls preserve every book of the Hebrew Bible except Esther. Those copyists left both continuity and variation: manuscripts more than a thousand years older than the biblical copies previously known."
  duration: 13

- shot: the-library
  view: map
  camera: {center: [29.9, 31.2], zoom: 5.2, duration: 4}
  places: [alexandria]
  time: "-0047"
  reveal: [library-of-alexandria, alexandrian-war, fire-at-alexandria-48-bce, julius-caesar, tale-of-the-caliph-and-the-library, alexandria]
  reveal_claims: [library-of-alexandria#c1, alexandrian-war#c1, fire-at-alexandria-48-bce#c1, fire-at-alexandria-48-bce#c2, tale-of-the-caliph-and-the-library#c1]
  overlay: {kind: quote, source: gellius-attic-nights-loeb, quote: "By no means all of the Alexandrian Library was destroyed at that time", caption: "Editor's note to Aulus Gellius, Attic Nights, Loeb Classical Library"}
  narration: "**The library.** In Alexandria in 48 BCE, Caesar faced an enemy trying to cut off his fleet. Plutarch says he used fire to repel them; it spread from the dockyards and destroyed the great library. Gellius instead describes nearly 700,000 books gathered under the Ptolemies burning accidentally at auxiliary soldiers' hands, without an order. The Loeb editor says not all the library was destroyed. Centuries later, a tale blamed Caliph Umar for ordering it burned after the conquest of 641. Bernard Lewis calls that story a myth, first recorded about 1203. Following Paul Casanova, Lewis suggests its Muslim authors supplied a justification for Saladin's later dispersal of the Fatimid library in Cairo."
  duration: 15

- shot: into-latin
  view: map
  camera: {center: [24, 40], zoom: 3.3, duration: 5}
  places: [bethlehem]
  borders: [roman-empire]
  time: "0386"
  reveal: [jerome, vulgate, bethlehem, septuagint]
  reveal_claims: [jerome#c1, vulgate#c1, septuagint#c2, jerome#c3]
  overlay: {kind: quote, source: jerome-letter-57-nicene-fathers, quote: "what great additions and omissions the Septuagint has made", caption: "Jerome, Letter 57 to Pammachius, 395, section 11"}
  narration: "**Into Latin.** In 382 Pope Damasus asked Jerome to make one acceptable Latin Bible from the competing translations. Settled in Bethlehem by 386, Jerome began with Greek but turned to Hebrew. In a letter of 395 he challenged the Greek's accuracy: “what great additions and omissions the Septuagint has made”. He also defended its place in churches, citing its age and the apostles' use—but only where it agreed with Hebrew. By the end of 405 he had translated the entire Old Testament from Hebrew. His work underlies the Vulgate; the Library of Congress says Gutenberg printed a revised Latin Bible based largely on Jerome's translation."
  duration: 13

- shot: paper
  view: map
  camera: {center: [30, 38], zoom: 2.9, duration: 6}
  places: [samarkand, baghdad, xativa]
  routes: [[samarkand, baghdad], [baghdad, xativa]]
  time: "0751"
  reveal: [paper, cai-lun, hou-hanshu, papermaking-reaches-samarkand, papermaking-reaches-baghdad, papermaking-reaches-spain, samarkand, baghdad, xativa]
  reveal_claims: [cai-lun#c1, cai-lun#c2, paper#c1, paper#c2, paper#c3, paper#c4]
  overlay: {kind: quote, source: carter-1925-hou-hanshu-cai-lun, quote: "Then Ts’ai Lun thought of using tree bark, hemp, rags and fish nets.", caption: "Hou Hanshu, fifth century, in Thomas Carter's translation"}
  narration: "**Paper.** The Hou Hanshu says the court official Cai Lun reported a way to make paper from bark, hemp, rags and fish nets in 105 CE; it gives the practical problem as expensive silk and heavy bamboo. Whether he invented paper or became its patron is uncertain, Carter cautions. An Arabic story he relays credits Chinese prisoners with teaching papermaking at Samarkand in 751. Carter dates a Baghdad factory to 793–794 and praise of Spain's paper to 1150. A material made from discarded fibres had travelled west to supply writers and, eventually, printers."
  duration: 15

- shot: type-before-gutenberg
  view: map
  camera: {center: [120, 37], zoom: 3.6, duration: 6}
  places: [cheongju]
  time: "1377"
  reveal: [bi-sheng, bi-shengs-clay-type, shen-kuo, dream-pool-essays, movable-type, jikji, printing-of-the-jikji, cheongju]
  reveal_claims: [bi-shengs-clay-type#c1, shen-kuo#c1, printing-of-the-jikji#c1, printing-of-the-jikji#c2, jikji#c2, bi-shengs-clay-type#c3]
  overlay: {kind: quote, source: carter-1925-dream-pool-essays, quote: "As a rule he kept two forms going.", caption: "Shen Kuo on Bi Sheng, Dream Pool Essays, in Carter's translation"}
  narration: "**Type before Gutenberg.** Shen Kuo writes that in 1041–1049 Bi Sheng, a commoner in China, cut characters in clay, baked them and set them in an iron frame. He explains Bi Sheng's choice: wood absorbed moisture and made an uneven printing surface. Shen describes him keeping two forms working, setting one while printing the other: for two or three copies the method was “neither convenient nor quick”; its advantage came with hundreds or thousands. Carter says it was never greatly used, and in 1925, before the West knew the Jikji, found no clear link to Gutenberg and kept an open mind. At a temple in Cheongju, Korea, printers used cast metal type for that Buddhist book in 1377—78 years before Gutenberg's Bible."
  duration: 15

- shot: into-type
  view: map
  camera: {center: [8.27, 50], zoom: 4.8, pitch: 30, duration: 5}
  places: [mainz]
  borders: [holy-roman-empire]
  time: "1455"
  reveal: [johannes-gutenberg, gutenberg-bible, printing-press, mainz, vulgate]
  reveal_claims: [johannes-gutenberg#c3, printing-press#c1, gutenberg-bible#c2, johannes-gutenberg#c4, johannes-gutenberg#c5]
  overlay: {kind: stat, value: "48", label: "Gutenberg Bibles known to survive, by Cornell's count", source: cornell-exhibit-gutenberg-bible, quote: "It is thought that Gutenberg printed 165 copies on paper and thirty-five copies on parchment. Of this total, only forty-eight Gutenberg Bibles are known to have survived."}
  narration: "**Into type.** Around 1455 in Mainz, Gutenberg printed a revised Latin Bible based largely on Jerome's translation, the Library of Congress says, using movable metal type. He used Gothic letters resembling the handwriting of his region and divided each page into two columns. How many Bibles came off the press is uncertain: Cornell's library estimates 165 on paper and 35 on parchment, about 200 altogether; the Library of Congress gives at least 120 on paper and perhaps 40 on vellum. Cornell counts 48 surviving copies. Gutenberg had made an entire Bible repeatable in type, and printers elsewhere would multiply books by the millions."
  duration: 12

- shot: first-elsewhere
  view: graph
  focus: movable-type
  time: "1455"
  reveal: [movable-type, jikji, gutenberg-bible, printing-press, latin-alphabet, bi-shengs-clay-type, bi-sheng, shen-kuo]
  reveal_claims: [jikji#c1, gutenberg-bible#c3, latin-alphabet#c1, bi-shengs-clay-type#c2]
  overlay: {kind: quote, source: bnf-jikji-treasure-of-printing, quote: "Jikji is the oldest known book in the world printed with movable metal type.", caption: "Bibliothèque nationale de France, Jikji, a treasure of world printing"}
  narration: "**First elsewhere.** Shen Kuo writes that when Bi Sheng died, the type passed to his own followers and was kept as a prized possession. Gutenberg's workshop came centuries later: movable type and paper began in China, and the oldest surviving book printed with movable metal type, the Jikji, came from Korea. His typesetters did have one practical advantage. In Robert Lechêne's reading, Europe's small alphabet of abstract signs simplified making and using type in series. Earlier printers had already shown that separate characters could make books; in Europe, a limited alphabet helped that method spread."
  duration: 13

- shot: and-after
  view: map
  camera: {center: [12.65, 51.87], zoom: 4.6, duration: 4}
  places: [mainz, wittenberg]
  time: "1534"
  reveal: [luther-bible, wittenberg, bible, martin-luther]
  reveal_claims: [luther-bible#c1, martin-luther#c7]
  overlay: {kind: quote, source: smith-1911-life-and-letters-of-martin-luther, quote: "I try to speak as men do in the market-place.", caption: "Luther on translation, quoted by Preserved Smith, 1911"}
  narration: "**And after.** Luther explained his choice of words in remarks quoted by Preserved Smith: “I try to speak as men do in the market-place.” Cornell says Luther sought to put the Bible in ordinary Christians' hands. In 1534 Hans Lufft printed the complete translation at Wittenberg; Cornell says he is reported to have sold over 100,000 copies in forty years. By then, printing had already transformed the scale of copying: more than ten million books had been produced within fifty years of Gutenberg's page. The press carried a translator's choices into readers' homes."
  duration: 12

- shot: a-script-read-again
  view: graph
  focus: decipherment-of-maya-script
  time: "1562"
  reveal: [maya-script, burning-of-maya-books-1562, diego-de-landa, relation-of-the-things-of-yucatan, decipherment-of-maya-script, yuri-knorozov, tatiana-proskouriakoff, knorozovs-papers-published-in-the-us, proskouriakoffs-study-of-the-piedras-negras-stelae]
  reveal_claims: [burning-of-maya-books-1562#c2, diego-de-landa#c1, relation-of-the-things-of-yucatan#c1, decipherment-of-maya-script#c1, decipherment-of-maya-script#c2]
  overlay: {kind: quote, source: pbs-nova-cracking-the-maya-code-timeline, quote: "Landa orchestrated the burning in 1562 of hundreds if not thousands of Maya bark-paper books, which he deemed heretical.", caption: "NOVA, Cracking the Maya Code, PBS"}
  narration: "**A script read again.** In Yucatán in 1562, Diego de Landa orchestrated the burning of hundreds if not thousands of Maya bark-paper books he deemed heretical, NOVA says. Spanish conquerors forced conversion to Christianity and speaking and writing in Spanish; knowledge of the script was lost. Yet Landa's 1566 manuscript preserved clues to the writing he attacked. In 1952 Yuri Knorozov reasoned, NOVA says, that its 800-plus signs were too many for an alphabet but too few for one sign per word: the script combined words and sounds. Tatiana Proskouriakoff later showed that inscriptions recorded kings' lives. NOVA reports over 90 percent of glyphs readable. The burned books were gone; surviving signs could speak again."
  duration: 14

- shot: one-line
  view: map
  camera: {center: [27, 39], zoom: 3.7, fit: true, duration: 6}
  places: [uruk, serabit-el-khadim, byblos, alexandria, bethlehem, mainz]
  routes: [[uruk, serabit-el-khadim], [serabit-el-khadim, byblos], [byblos, alexandria], [alexandria, bethlehem], [bethlehem, mainz]]
  time: "1534"
  reveal: [invention-of-writing, invention-of-the-alphabet, phoenician-alphabet, latin-alphabet, printing-press, gutenberg-bible, bible, jerome, vulgate, martin-luther, luther-bible]
  reveal_claims: [invention-of-writing#c1, invention-of-the-alphabet#c1, latin-alphabet#c1, printing-press#c1, gutenberg-bible#c1, jerome#c3, martin-luther#c7]
  narration: "**One line.** A scribe recorded rations in Uruk; Jerome chose Hebrew words for his Latin Bible; Gutenberg set a revised Latin Bible in metal; Luther argued for the language heard in the marketplace. Their work made words last, change languages and reach new readers. Paper and movable type had their own earlier histories in Asia. By 1534, Hans Lufft in Wittenberg could multiply a German Bible, carrying a translator's decisions far beyond his desk."
  explore: true
  duration: 11
```

The same road, link by link, is in the route story [from the rise of cities in Mesopotamia to the Bible](/p/rise-of-cities-in-mesopotamia--bible/).
