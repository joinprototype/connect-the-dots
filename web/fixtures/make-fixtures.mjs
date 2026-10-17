// Generates the dev fixture site in web/fixtures/: data/graph.json, data/search.json and HTML pages
// that mimic `ctd build` output (theme/templates). Run with `npm run fixtures`.
//
// The data mixes three small worlds: tech and capital, Abrahamic religions, and the Cuban Missile
// Crisis told from two perspectives. Holding percentages are illustrative (as in docs/content-model.md).
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));

// ---------------------------------------------------------------------------------- schema (copy)
// Neutral like content/schema/layers.yaml: layers are told apart by labels, never by hue alone.
const NEUTRAL = '#8e8e93';
const layers = {
  people: { label: 'People', color: NEUTRAL },
  power: { label: 'Power', color: NEUTRAL },
  money: { label: 'Money', color: NEUTRAL },
  tech: { label: 'Science & Tech', color: NEUTRAL },
  history: { label: 'History', color: NEUTRAL },
  ideas: { label: 'Ideas & Religion', color: NEUTRAL },
  places: { label: 'Places', color: NEUTRAL },
};
const typeDefs = {
  person: ['Person', 'People', 'people'],
  org: ['Organization', 'Organizations', 'power'],
  place: ['Place', 'Places', 'places'],
  event: ['Event', 'Events', 'history'],
  work: ['Work', 'Works', 'ideas'],
  artifact: ['Artifact', 'Artifacts', 'tech'],
  concept: ['Concept', 'Concepts', 'ideas'],
  tradition: ['Tradition', 'Traditions', 'ideas'],
  group: ['Group', 'Groups', 'people'],
};
const types = Object.fromEntries(
  Object.entries(typeDefs).map(([id, [label, plural, layer]]) => [id, { label, plural, layer, color: layers[layer].color }]),
);
const rel = (label, inverse, ls, extra = {}) => ({ label, inverse, layers: ls, traversable: true, passive: false, sensitive: false, ...extra });
const relations = {
  founded: rel('founded', 'founded by', ['people', 'power']),
  ceo_of: rel('CEO of', 'CEO', ['power', 'money']),
  chair_of: rel('chair of', 'chaired by', ['power']),
  head_of: rel('head of', 'headed by', ['power']),
  signatory_of: rel('signed', 'signed by', ['people', 'money']),
  invested_in: rel('invested in', 'investors', ['money']),
  holds_for_clients: rel('holds shares for clients in', 'shares held for clients by', ['money'], { passive: true }),
  contracted: rel('awarded a contract to', 'contracts from', ['money', 'tech']),
  deployed: rel('deployed', 'deployed by', ['power', 'tech']),
  involved: rel('involved', 'involved in', ['history']),
  caused_by: rel('caused by', 'caused', ['history']),
  led_to: rel('led to', 'followed from', ['history']),
  scripture_of: rel('scripture of', 'scriptures', ['ideas']),
  prophet_in: rel('regarded as a prophet in', 'prophets', ['ideas']),
  patriarch_of: rel('patriarch of', 'patriarch', ['ideas', 'people']),
  appears_in: rel('appears in', 'features', ['ideas']),
  authored: rel('authored', 'author', ['ideas']),
  influenced: rel('influenced', 'influenced by', ['ideas']),
  born_in: rel('born in', 'birthplace of', ['places'], { traversable: false }),
  located_in: rel('located in', 'location of', ['places'], { traversable: false }),
  headquartered_in: rel('headquartered in', 'headquarters of', ['places'], { traversable: false }),
};
const lenses = [
  { id: 'all', label: 'Everything', view: 'graph', layers: ['people', 'power', 'money', 'tech', 'history', 'ideas', 'places'] },
  { id: 'history', label: 'History', view: 'timeline', layers: ['history', 'power'] },
  { id: 'relations', label: 'Relations', view: 'graph', layers: ['people', 'power'] },
  { id: 'money', label: 'Money', view: 'graph', layers: ['money'] },
  { id: 'ideas', label: 'Ideas & Religion', view: 'graph', layers: ['ideas'] },
  { id: 'tech', label: 'Science & Tech', view: 'graph', layers: ['tech'] },
  { id: 'places', label: 'Places', view: 'map', layers: ['places'] },
];
const methodology = {
  version: '0.1', beta: 1.0, lambda: 1.0, delta_undated: 0.0, k_paths: 5, reuse_penalty: 3.0, max_hops: 10,
  collapse_passive: true, hub_threshold: 500, evidence: { T1: 1.0, T2: 0.8, T3: 0.4, draft_factor: 0.5 }, default_weight: 2.0,
  weights: {
    founded: 1.0, relative_of: 1.0, identified_with: 1.0, ceo_of: 1.5, chair_of: 1.5, head_of: 1.5, worked_at: 1.5, enacted: 1.5,
    intervened_in: 1.5, developed: 1.5, launched: 1.5, produced: 1.5, leads: 1.5, caused_by: 1.5, led_to: 1.5, central_figure_of: 1.5,
    scripture_of: 1.5, edition_of: 1.5, authored: 1.5, invested_in: 2.0, owns_stake: 2.0, acquired: 2.0, contracted: 2.0, involved: 2.0,
    prophet_in: 2.0, patriarch_of: 2.0, branch_of: 2.0, adopted: 2.0, member_of: 2.5, signatory_of: 2.5, part_of: 2.5, appears_in: 2.5,
    influenced: 2.5, holds_for_clients: 3.0,
  },
};

// ---------------------------------------------------------------------------------- dates (EDTF subset)
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const leap = (y) => (y % 4 === 0 && y % 100 !== 0) || y % 400 === 0;
function point(s) {
  const neg = s.startsWith('-');
  const [y, m, d] = (neg ? s.slice(1) : s).split('-').map(Number);
  const year = neg ? -y : y;
  if (d) {
    const days = [31, leap(year) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    const doy = days.slice(0, m - 1).reduce((a, b) => a + b, 0) + d - 1;
    const len = leap(year) ? 366 : 365;
    return { start: year + doy / len, next: year + (doy + 1) / len, kind: 'day' };
  }
  if (m) return { start: year + (m - 1) / 12, next: year + m / 12, kind: 'month' };
  return { start: year, next: year + 1, kind: 'year' };
}
/** EDTF -> contract date. A point day gets end = start; month and year points end at the next unit. */
function date(edtf, label) {
  if (!edtf) return null;
  const [a, b] = edtf.split('/');
  const pa = point(a);
  if (b === undefined) return { start: pa.start, end: pa.kind === 'day' ? pa.start : pa.next, label };
  if (b === '..') return { start: pa.start, end: null, label };
  return { start: pa.start, end: point(b).next, label };
}

// ---------------------------------------------------------------------------------- entities
const E = (id, type, name, o = {}) => ({ id, type, name, summary: o.summary ?? null, aliases: o.aliases ?? [], when: o.when ? date(...o.when) : null, coords: o.coords ?? null, place: o.place ?? null });
const entities = [
  // tech and capital
  E('elon-musk', 'person', 'Elon Musk', { summary: 'Entrepreneur; CEO of Tesla and SpaceX.', aliases: ['Elon Reeve Musk'], when: ['1971-06-28/..', 'b. 28 Jun 1971'], place: 'pretoria' }),
  E('spacex', 'org', 'SpaceX', { summary: 'Rocket and spacecraft maker founded in 2002.', aliases: ['Space Exploration Technologies Corp.'], when: ['2002/..', '2002–'] }),
  E('tesla', 'org', 'Tesla', { summary: 'Electric vehicle and energy company.', aliases: ['Tesla, Inc.', 'Tesla Motors'], when: ['2003/..', '2003–'] }),
  E('bill-gates', 'person', 'Bill Gates', { summary: 'Co-founder of Microsoft; philanthropist.', aliases: ['William Henry Gates III'], when: ['1955-10-28/..', 'b. 28 Oct 1955'] }),
  E('microsoft', 'org', 'Microsoft', { summary: 'Software company founded in 1975.', aliases: ['Microsoft Corporation'], when: ['1975/..', '1975–'] }),
  E('blackrock', 'org', 'BlackRock', { summary: 'Asset manager; holds shares for clients, largely through index funds.', aliases: ['BlackRock, Inc.'], when: ['1988/..', '1988–'] }),
  E('vanguard', 'org', 'Vanguard', { summary: 'Asset manager known for index funds.', aliases: ['The Vanguard Group'], when: ['1975/..', '1975–'] }),
  E('giving-pledge', 'org', 'The Giving Pledge', { summary: 'A public commitment by wealthy people to give away most of their wealth.', when: ['2010/..', '2010–'] }),
  E('pretoria', 'place', 'Pretoria', { summary: 'Administrative capital of South Africa.', coords: [28.1881, -25.7461] }),
  // Abrahamic religions
  E('abraham', 'person', 'Abraham', { summary: 'Patriarch in the Hebrew Bible, the New Testament and the Quran.', aliases: ['Ibrahim', 'Avraham', 'Abram'] }),
  E('moses', 'person', 'Moses', { summary: 'Prophet and lawgiver in Jewish, Christian and Islamic scripture.', aliases: ['Musa', 'Moshe'] }),
  E('judaism', 'tradition', 'Judaism', { summary: 'Religion of the Jewish people, rooted in the Hebrew Bible.' }),
  E('christianity', 'tradition', 'Christianity', { summary: 'Religion centred on the life and teachings of Jesus.', when: ['0030/..', 'c. 30 CE–'] }),
  E('islam', 'tradition', 'Islam', { summary: 'Religion centred on the Quran and the prophet Muhammad.', when: ['0610/..', '610–'] }),
  E('torah', 'work', 'Torah', { summary: 'The first five books of the Hebrew Bible.', aliases: ['Pentateuch', 'Five Books of Moses'], when: ['-0449/..', 'c. 450 BCE'] }),
  E('quran', 'work', 'Quran', { summary: 'The central religious text of Islam.', aliases: ["Qur'an", 'Koran'], when: ['0609/..', 'c. 609–632'] }),
  // Cuban Missile Crisis
  E('cuban-missile-crisis', 'event', 'Cuban Missile Crisis', { summary: 'Thirteen-day nuclear standoff between the United States and the Soviet Union.', aliases: ['October Crisis', 'Caribbean Crisis'], when: ['1962-10-16/1962-10-28', '16–28 Oct 1962'], place: 'cuba' }),
  E('john-f-kennedy', 'person', 'John F. Kennedy', { summary: '35th President of the United States.', aliases: ['JFK'], when: ['1917-05-29/1963-11-22', '1917–1963'], place: 'washington-dc' }),
  E('nikita-khrushchev', 'person', 'Nikita Khrushchev', { summary: 'First Secretary of the Soviet Communist Party, 1953–1964.', aliases: ['Nikita Khrushchyov'], when: ['1894-04-15/1971-09-11', '1894–1971'], place: 'moscow' }),
  E('soviet-missiles-in-cuba', 'artifact', 'Soviet missiles in Cuba', { summary: 'Medium-range ballistic missiles deployed to Cuba in 1962 (Operation Anadyr).', aliases: ['Operation Anadyr'], when: ['1962-09/1962-11', 'Sep–Nov 1962'], place: 'cuba' }),
  E('jupiter-missiles-in-turkey', 'artifact', 'Jupiter missiles in Turkey', { summary: 'US medium-range ballistic missiles based near İzmir, 1961–1963.', when: ['1961/1963-04', '1961–Apr 1963'], place: 'izmir' }),
  E('jupiter-withdrawal-1963', 'event', 'Withdrawal of the Jupiter missiles', { summary: 'Removal of the US Jupiter missiles from Turkey in April 1963.', when: ['1963-04', 'Apr 1963'], place: 'izmir' }),
  E('us-government', 'org', 'United States government', { summary: 'Federal government of the United States.', aliases: ['US government', 'Washington'], when: ['1789/..', '1789–'], place: 'washington-dc' }),
  E('soviet-government', 'org', 'Government of the Soviet Union', { summary: 'Government of the USSR, 1922–1991.', aliases: ['Soviet government', 'Moscow'], when: ['1922-12-30/1991-12-26', '1922–1991'], place: 'moscow' }),
  E('cuba', 'place', 'Cuba', { summary: 'Island country in the Caribbean.', coords: [-79.5, 21.8] }),
  E('washington-dc', 'place', 'Washington, D.C.', { summary: 'Capital of the United States.', aliases: ['Washington'], coords: [-77.0369, 38.9072] }),
  E('moscow', 'place', 'Moscow', { summary: 'Capital of Russia and of the Soviet Union.', coords: [37.6173, 55.7558] }),
  E('izmir', 'place', 'İzmir', { summary: 'City on the Aegean coast of Turkey.', aliases: ['Izmir', 'Smyrna'], coords: [27.1428, 38.4237] }),
];
const byId = new Map(entities.map((e) => [e.id, e]));
for (const e of entities) if (!e.coords && e.place) e.coords = byId.get(e.place)?.coords ?? null;

// ---------------------------------------------------------------------------------- sources
const S = (id, title, publisher, url, tier, voice, published) => [id, { title, publisher, url, tier, voice, published, archive_url: null }];
const sources = Object.fromEntries([
  S('britannica-elon-musk', 'Elon Musk', 'encyclopaedia-britannica', 'https://www.britannica.com/money/Elon-Musk', 'T2', 'encyclopaedia-britannica', '2026'),
  S('tesla-10k-2025', 'Tesla, Inc. annual report (Form 10-K), fiscal year 2025', 'tesla', 'https://ir.tesla.com/', 'T1', 'tesla', '2026'),
  S('giving-pledge-pledgers', 'The Giving Pledge: pledgers', 'giving-pledge', 'https://givingpledge.org/', 'T1', 'giving-pledge', '2026'),
  S('britannica-bill-gates', 'Bill Gates', 'encyclopaedia-britannica', 'https://www.britannica.com/money/Bill-Gates', 'T2', 'encyclopaedia-britannica', '2026'),
  S('blackrock-13f-2026q2', 'BlackRock, Inc. Form 13F-HR, quarter ended 30 June 2026', 'blackrock', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0001364742&type=13F-HR', 'T1', 'blackrock', '2026-08'),
  S('vanguard-13f-2026q2', 'The Vanguard Group Form 13F-HR, quarter ended 30 June 2026', 'vanguard', 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000102909&type=13F-HR', 'T1', 'vanguard', '2026-08'),
  S('nasa-crs-2008', 'NASA awards Space Station Commercial Resupply Services contracts', 'us-government', 'https://www.nasa.gov/', 'T1', 'us-government', '2008-12-23'),
  S('jps-tanakh-1917', 'The Holy Scriptures according to the Masoretic Text (JPS 1917)', 'jewish-publication-society', 'https://www.sefaria.org/texts/Tanakh', 'T1', 'judaism', '1917'),
  S('quran-pickthall-1930', 'The Meaning of the Glorious Koran (Pickthall)', 'marmaduke-pickthall', 'https://quran.com/', 'T1', 'islam', '1930'),
  S('kjv-1611', 'The Holy Bible, King James Version', 'church-of-england', 'https://www.kingjamesbibleonline.org/', 'T1', 'christianity', '1611'),
  S('britannica-torah', 'Torah', 'encyclopaedia-britannica', 'https://www.britannica.com/topic/Torah', 'T2', 'encyclopaedia-britannica', '2026'),
  S('britannica-quran', 'Qurʾān', 'encyclopaedia-britannica', 'https://www.britannica.com/topic/Quran', 'T2', 'encyclopaedia-britannica', '2026'),
  S('britannica-christianity', 'Christianity', 'encyclopaedia-britannica', 'https://www.britannica.com/topic/Christianity', 'T2', 'encyclopaedia-britannica', '2026'),
  S('jfk-address-1962-10-22', 'Address on the Soviet arms buildup in Cuba', 'us-government', 'https://www.jfklibrary.org/learn/about-jfk/historic-speeches/address-during-the-cuban-missile-crisis', 'T1', 'us-government', '1962-10-22'),
  S('khrushchev-letter-1962-10-27', 'Message from Chairman Khrushchev to President Kennedy', 'soviet-government', 'https://history.state.gov/historicaldocuments/frus1961-63v06', 'T1', 'soviet-government', '1962-10-27'),
  S('frus-1961-63-v11', 'Foreign Relations of the United States, 1961–1963, Volume XI: Cuban Missile Crisis and Aftermath', 'us-government', 'https://history.state.gov/historicaldocuments/frus1961-63v11', 'T1', 'us-government', '1996'),
  S('dobrynin-cable-1962-10-27', 'Dobrynin to the Soviet Foreign Ministry on his meeting with Robert Kennedy', 'soviet-government', 'https://digitalarchive.wilsoncenter.org/', 'T1', 'soviet-government', '1962-10-27'),
  S('britannica-cuban-missile-crisis', 'Cuban missile crisis', 'encyclopaedia-britannica', 'https://www.britannica.com/event/Cuban-missile-crisis', 'T2', 'encyclopaedia-britannica', '2026'),
]);

// ---------------------------------------------------------------------------------- claims
const QUOTES = {
  jfk: 'Within the past week, unmistakable evidence has established the fact that a series of offensive missile sites is now in preparation on that imprisoned island.',
  khrushchev: 'You are disturbed over Cuba. You say that this disturbs you because it is 90 miles by sea from the coast of the United States of America. But Turkey adjoins us.',
  gen17: 'for the father of a multitude of nations have I made thee.',
  q367: 'Abraham was not a Jew, nor yet a Christian; but he was an upright man who had surrendered (to Allah), and he was not of the idolaters.',
  rom416: 'the faith of Abraham; who is the father of us all',
  deut3410: 'And there hath not arisen a prophet since in Israel like unto Moses, whom the LORD knew face to face',
  q1951: 'And make mention in the Scripture of Moses. Lo! he was chosen, and he was a messenger (of Allah), a prophet.',
};
const src = (id, at = null, quote = null) => ({ id, at, quote });
// [owner, claim id, rel, to (string or array), options]
const claimDefs = [
  ['elon-musk', 'c1', 'founded', 'spacex', { when: ['2002', '2002'], src: [src('britannica-elon-musk')] }],
  ['elon-musk', 'c2', 'ceo_of', 'tesla', { when: ['2008-10/..', 'Oct 2008–'], src: [src('tesla-10k-2025', 'Part III')] }],
  ['elon-musk', 'c3', 'invested_in', 'tesla', { when: ['2004', '2004'], detail: 'led the Series A round', src: [src('britannica-elon-musk')] }],
  ['elon-musk', 'c4', 'born_in', 'pretoria', { src: [src('britannica-elon-musk')] }],
  ['elon-musk', 'c5', 'ceo_of', 'spacex', { when: ['2002/..', '2002–'], src: [src('britannica-elon-musk')] }],
  ['elon-musk', 'c6', 'signatory_of', 'giving-pledge', { when: ['2012', '2012'], src: [src('giving-pledge-pledgers')] }],
  ['bill-gates', 'c1', 'founded', 'microsoft', { when: ['1975', '1975'], detail: 'co-founder', q: { role: 'co-founder' }, src: [src('britannica-bill-gates')] }],
  ['bill-gates', 'c2', 'ceo_of', 'microsoft', { when: ['1975/2000-01', '1975–Jan 2000'], src: [src('britannica-bill-gates')] }],
  ['bill-gates', 'c3', 'founded', 'giving-pledge', { when: ['2010', '2010'], detail: 'co-founder', q: { role: 'co-founder' }, src: [src('britannica-bill-gates')] }],
  ['bill-gates', 'c4', 'chair_of', 'microsoft', { when: ['1981/2014-02', '1981–Feb 2014'], status: 'draft', src: [src('britannica-bill-gates')] }],
  ['blackrock', 'c1', 'holds_for_clients', 'tesla', { when: ['2026-06-30', 'as of 30 Jun 2026'], detail: '5.8%, as of 30 Jun 2026', q: { percent: 5.8, as_of: '2026-06-30' }, src: [src('blackrock-13f-2026q2')] }],
  ['blackrock', 'c2', 'holds_for_clients', 'microsoft', { when: ['2026-06-30', 'as of 30 Jun 2026'], detail: '7.2%, as of 30 Jun 2026', q: { percent: 7.2, as_of: '2026-06-30' }, src: [src('blackrock-13f-2026q2')] }],
  ['vanguard', 'c1', 'holds_for_clients', 'tesla', { when: ['2026-06-30', 'as of 30 Jun 2026'], detail: '7.1%, as of 30 Jun 2026', q: { percent: 7.1, as_of: '2026-06-30' }, src: [src('vanguard-13f-2026q2')] }],
  ['vanguard', 'c2', 'holds_for_clients', 'microsoft', { when: ['2026-06-30', 'as of 30 Jun 2026'], detail: '8.9%, as of 30 Jun 2026', q: { percent: 8.9, as_of: '2026-06-30' }, src: [src('vanguard-13f-2026q2')] }],
  ['us-government', 'c1', 'contracted', 'spacex', { when: ['2008-12-23', '23 Dec 2008'], detail: 'Commercial Resupply Services, $1.6 billion', q: { amount: 1.6e9, currency: 'USD', title: 'Commercial Resupply Services' }, src: [src('nasa-crs-2008')] }],
  ['us-government', 'c2', 'deployed', 'jupiter-missiles-in-turkey', { when: ['1961/1963-04', '1961–Apr 1963'], src: [src('frus-1961-63-v11')] }],
  ['us-government', 'c3', 'headquartered_in', 'washington-dc', { src: [src('britannica-cuban-missile-crisis')] }],
  ['soviet-government', 'c1', 'deployed', 'soviet-missiles-in-cuba', { when: ['1962-09/1962-11', 'Sep–Nov 1962'], src: [src('britannica-cuban-missile-crisis')] }],
  ['soviet-government', 'c2', 'headquartered_in', 'moscow', { src: [src('britannica-cuban-missile-crisis')] }],
  ['john-f-kennedy', 'c1', 'head_of', 'us-government', { when: ['1961-01-20/1963-11-22', '1961–1963'], detail: 'President', q: { title: 'President' }, src: [src('britannica-cuban-missile-crisis')] }],
  ['nikita-khrushchev', 'c1', 'head_of', 'soviet-government', { when: ['1958-03-27/1964-10-14', '1958–1964'], detail: 'Premier', q: { title: 'Premier' }, src: [src('britannica-cuban-missile-crisis')] }],
  ['cuban-missile-crisis', 'c1', 'caused_by', 'soviet-missiles-in-cuba', { according_to: ['us-government'], src: [src('jfk-address-1962-10-22', 'para 1', QUOTES.jfk)] }],
  ['cuban-missile-crisis', 'c2', 'caused_by', 'jupiter-missiles-in-turkey', { according_to: ['soviet-government'], src: [src('khrushchev-letter-1962-10-27', null, QUOTES.khrushchev)] }],
  ['cuban-missile-crisis', 'c3', 'led_to', 'jupiter-withdrawal-1963', { src: [src('frus-1961-63-v11'), src('dobrynin-cable-1962-10-27')] }],
  ['cuban-missile-crisis', 'c4', 'involved', ['john-f-kennedy', 'nikita-khrushchev'], { src: [src('britannica-cuban-missile-crisis')] }],
  ['cuban-missile-crisis', 'c5', 'located_in', 'cuba', { src: [src('britannica-cuban-missile-crisis')] }],
  ['soviet-missiles-in-cuba', 'c1', 'located_in', 'cuba', { src: [src('jfk-address-1962-10-22')] }],
  ['jupiter-missiles-in-turkey', 'c1', 'located_in', 'izmir', { src: [src('frus-1961-63-v11')] }],
  ['abraham', 'c1', 'patriarch_of', 'judaism', { according_to: ['judaism'], src: [src('jps-tanakh-1917', 'Genesis 17:5', QUOTES.gen17)] }],
  ['abraham', 'c2', 'patriarch_of', 'islam', { according_to: ['islam'], src: [src('quran-pickthall-1930', '3:67', QUOTES.q367)] }],
  ['abraham', 'c3', 'patriarch_of', 'christianity', { according_to: ['christianity'], src: [src('kjv-1611', 'Romans 4:16', QUOTES.rom416)] }],
  ['abraham', 'c4', 'appears_in', 'torah', { src: [src('jps-tanakh-1917', 'Genesis 11:26–25:10')] }],
  ['abraham', 'c5', 'appears_in', 'quran', { src: [src('quran-pickthall-1930', '2:124–141')] }],
  ['moses', 'c1', 'prophet_in', 'judaism', { according_to: ['judaism'], src: [src('jps-tanakh-1917', 'Deuteronomy 34:10', QUOTES.deut3410)] }],
  ['moses', 'c2', 'prophet_in', 'islam', { according_to: ['islam'], src: [src('quran-pickthall-1930', '19:51', QUOTES.q1951)] }],
  ['moses', 'c3', 'authored', 'torah', { according_to: ['judaism'], src: [src('britannica-torah', 'Authorship')] }],
  ['moses', 'c4', 'appears_in', 'torah', { src: [src('jps-tanakh-1917', 'Exodus 2–Deuteronomy 34')] }],
  ['moses', 'c5', 'appears_in', 'quran', { src: [src('quran-pickthall-1930', '20:9–98')] }],
  ['torah', 'c1', 'scripture_of', 'judaism', { src: [src('britannica-torah')] }],
  ['quran', 'c1', 'scripture_of', 'islam', { src: [src('britannica-quran')] }],
  ['judaism', 'c1', 'influenced', 'christianity', { src: [src('britannica-christianity')] }],
];

const perspectiveIds = new Set(claimDefs.flatMap(([, , , , o]) => o.according_to ?? []));
const tierRank = { T1: 1, T2: 2, T3: 3 };
const edges = [];
for (const [owner, cid, relId, to, o] of claimDefs) {
  const targets = Array.isArray(to) ? to : [to];
  const r = relations[relId];
  targets.forEach((target, i) => {
    const voices = [...new Set(o.src.map((s) => sources[s.id].voice))].sort();
    const tier = o.src.map((s) => sources[s.id].tier).sort((a, b) => tierRank[a] - tierRank[b])[0];
    edges.push({
      id: targets.length > 1 ? `${owner}#${cid}/${i + 1}` : `${owner}#${cid}`,
      from: owner,
      to: target,
      rel: relId,
      label: r.label,
      ...(o.detail ? { detail: o.detail } : {}),
      layers: r.layers,
      when: o.when ? date(...o.when) : null,
      according_to: o.according_to ?? [],
      sources: o.src,
      tier,
      voices,
      cross_confirmed: voices.filter((v) => perspectiveIds.has(v)).length >= 2,
      status: o.status ?? 'published',
      passive: r.passive,
      traversable: r.traversable,
      qualifiers: o.q ?? {},
    });
  });
}
for (const e of edges) for (const id of [e.from, e.to]) if (!byId.has(id)) throw new Error(`unknown entity ${id} in ${e.id}`);
const degree = new Map();
for (const e of edges) for (const id of new Set([e.from, e.to])) degree.set(id, (degree.get(id) ?? 0) + 1);

const nodes = entities.map((e) => ({ ...e, url: `/e/${e.id}/`, degree: degree.get(e.id) ?? 0 }));
const perspectives = [...perspectiveIds].sort().map((id) => ({ id, name: byId.get(id)?.name ?? id, claims: edges.filter((e) => e.according_to.includes(id)).length }));
const nameOf = (id) => byId.get(id)?.name ?? id.replace(/-/g, ' ').replace(/^./, (c) => c.toUpperCase());
for (const s of Object.values(sources)) {
  s.publisher_name = nameOf(s.publisher);
}

const graph = {
  meta: { engine: '0.1.0-fixture', built: '2026-10-16T12:00:00Z', commit: 'fixture', methodology: 'fixture-a964686f' },
  layers, types, relations, lenses, methodology, nodes, edges, perspectives, sources,
};
const search = nodes.map((n) => ({ id: n.id, name: n.name, aliases: n.aliases, type: n.type, summary: n.summary, url: n.url }));

// ---------------------------------------------------------------------------------- chapter
const t = (edtf) => date(edtf, '').start;
const shots = [
  {
    shot: 'open', view: 'map', camera: { center: [-79, 24], zoom: 2.6, globe: true, duration: 4 }, places: ['cuba', 'washington-dc'],
    focus: 'cuban-missile-crisis', time: '1962-10-16', t: t('1962-10-16'), time_label: '16 Oct 1962',
    narration: 'October 1962. Photographs from a U-2 flight over [[cuba]] show missile sites under construction, about 90 miles from Florida.',
  },
  {
    shot: 'two-doorsteps', view: 'map', camera: { center: [-25, 40], zoom: 1.35, globe: true, duration: 5 }, places: ['moscow', 'cuba', 'washington-dc', 'izmir'],
    routes: [['moscow', 'cuba'], ['washington-dc', 'izmir']], time: '1962-10', t: t('1962-10'), time_label: 'Oct 1962',
    narration: 'Two sets of missiles sit on two doorsteps: Soviet missiles in [[cuba]], and American Jupiter missiles near [[izmir]] in Turkey.',
  },
  {
    shot: 'us-story', view: 'graph', focus: 'cuban-missile-crisis', perspective: 'us-government', lens: 'history',
    reveal: ['cuban-missile-crisis', 'us-government', 'john-f-kennedy'], reveal_claims: ['cuban-missile-crisis#c1', 'john-f-kennedy#c1'],
    overlay: { kind: 'source', source: 'jfk-address-1962-10-22' }, time: '1962-10-22', t: t('1962-10-22'), time_label: '22 Oct 1962',
    narration: "In Washington's telling, the crisis was caused by the Soviet missiles in Cuba. [[john-f-kennedy|President Kennedy]] says so on television.",
  },
  {
    shot: 'soviet-story', view: 'graph', focus: 'cuban-missile-crisis', perspective: 'soviet-government', lens: 'history',
    reveal: ['soviet-government', 'nikita-khrushchev'], reveal_claims: ['cuban-missile-crisis#c2', 'nikita-khrushchev#c1'],
    overlay: { kind: 'source', source: 'khrushchev-letter-1962-10-27' }, time: '1962-10-27', t: t('1962-10-27'), time_label: '27 Oct 1962',
    narration: "In Moscow's telling, the cause was the American missiles in Turkey. [[nikita-khrushchev|Khrushchev]] puts it plainly in a letter.",
  },
  {
    shot: 'what-both-confirm', view: 'graph', focus: 'jupiter-withdrawal-1963', lens: 'history',
    reveal_claims: ['cuban-missile-crisis#c3', 'cuban-missile-crisis#c4'],
    overlay: { kind: 'source', source: 'frus-1961-63-v11', caption: 'US and Soviet records agree on this outcome.' },
    time: '1963-04', t: t('1963-04'), time_label: 'Apr 1963', duration: 8, explore: true,
    narration: 'What both sides confirm: the crisis ended with the Soviet missiles leaving Cuba, and the Jupiters left Turkey by April 1963.',
  },
];
const md = (s) =>
  s.replace(/\[\[([a-z0-9-]+)(?:\|([^\]]+))?\]\]/g, (_, id, label) => `<a href="/e/${id}/">${esc(label ?? nameOf(id))}</a>`);
for (const s of shots) s.narration_html = `<p>${md(s.narration)}</p>\n`;

// ---------------------------------------------------------------------------------- HTML
function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
const layerStyle = `<style>:root{ ${Object.entries(layers).map(([id, l]) => `--layer-${id}: ${l.color};`).join('')} }</style>`;
function page({ title, bodyClass, main, head = '', scripts = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(title)}</title>
<link rel="stylesheet" href="/static/site.css">
${layerStyle}
<link rel="stylesheet" href="/assets/islands.css">
${head}
</head>
<body class="${bodyClass}">
<a class="skip-link" href="#main">Skip to content</a>
<header class="site-header">
  <a class="brand" href="/" aria-label="connect the dot, home">
    <svg class="brand-mark" viewBox="0 0 30 20" aria-hidden="true"><path d="M4 15 L13 5 L25 12"/><circle cx="4" cy="15" r="2.7"/><circle cx="13" cy="5" r="2.7"/><circle cx="25" cy="12" r="2.7"/></svg>
    <span>connect the dot</span>
  </a>
  <nav class="site-nav" aria-label="Main">
    <a href="/x/">Explore</a>
    <a href="/c/">Stories</a>
  </nav>
  <ctd-search class="site-search">
    <form action="/x/" role="search">
      <input type="search" name="focus" placeholder="Search people, places, events" aria-label="Search" autocomplete="off">
    </form>
  </ctd-search>
</header>
<main id="main">
${main}
</main>
<footer class="site-footer">
  <p class="footer-principle">A connection is not evidence of wrongdoing. Every line cites its sources, and every interpretation says whose it is.</p>
  <p class="footer-build">Dev fixture site (web/fixtures), engine ${graph.meta.engine}.</p>
</footer>
<script type="module" src="/assets/islands.js"></script>
${scripts}
</body>
</html>
`;
}

function entityPage(n) {
  const type = types[n.type];
  const inc = edges.filter((e) => e.from === n.id || e.to === n.id);
  const groups = new Map();
  for (const e of inc) {
    const out = e.from === n.id;
    const key = out ? e.label : relations[e.rel].inverse;
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const srcIds = [...new Set(inc.flatMap((e) => e.sources.map((s) => s.id)))];
  const refOf = (id) => srcIds.indexOf(id) + 1;
  const claimLi = (e) => {
    const other = e.from === n.id ? e.to : e.from;
    const c = layers[e.layers[0]]?.color ?? '#666';
    const badges = [
      ...e.according_to.map((a) => `<a class="badge attrib" href="/e/${a}/">According to ${esc(nameOf(a))}</a>`),
      e.cross_confirmed ? '<span class="badge confirmed" title="Sources from opposing perspectives agree">Confirmed across perspectives</span>' : '',
      e.passive ? '<span class="badge passive">Passive holding</span>' : '',
      e.status === 'draft' ? '<span class="badge draft" title="Not yet verified against its source">Needs verification</span>' : '',
      `<span class="badge tier tier-${e.tier}" title="Best source tier">${e.tier}</span>`,
    ].filter(Boolean);
    return `        <li class="claim status-${e.status}" data-layers="${e.layers.join(' ')}" data-edge="${esc(e.id)}" style="--c: ${c}">
          <a class="claim-target" href="/e/${other}/" style="--t: ${types[byId.get(other).type].color}">${esc(nameOf(other))}</a>
          ${e.when ? `<span class="claim-when">${esc(e.when.label)}</span>` : ''}
          ${e.detail ? `<span class="claim-detail">${esc(e.detail)}</span>` : ''}
          <span class="badges">${badges.join(' ')}</span>
          <span class="refs">${e.sources.map((s) => `<a href="#src-${refOf(s.id)}" aria-label="Source ${refOf(s.id)}">${refOf(s.id)}</a>`).join('')}</span>
        </li>`;
  };
  const groupHtml = [...groups.entries()]
    .map(([label, list]) => {
      const ls = [...new Set(list.flatMap((e) => e.layers))];
      const c = layers[list[0].layers[0]]?.color ?? '#666';
      return `    <section class="claim-group" data-layers="${ls.join(' ')}" style="--c: ${c}">
      <h3>${esc(label)}</h3>
      <ul class="claims">
${list.map(claimLi).join('\n')}
      </ul>
    </section>`;
    })
    .join('\n');
  const dated = inc.filter((e) => e.when).sort((a, b) => a.when.start - b.when.start);
  const timeline = [
    ...(n.when ? [{ start: n.when.start, html: `<li class="tl-item own" data-layers="" style="--c: ${type.color}"><span class="tl-when">${esc(n.when.label)}</span><span class="tl-text">${esc(n.name)}</span></li>` }] : []),
    ...dated.map((e) => {
      const text = `${esc(nameOf(e.from))} ${esc(e.label)} ${esc(nameOf(e.to))}${e.detail ? ` (${esc(e.detail)})` : ''}`;
      return { start: e.when.start, html: `<li class="tl-item status-${e.status}" data-layers="${e.layers.join(' ')}" style="--c: ${layers[e.layers[0]].color}"><span class="tl-when">${esc(e.when.label)}</span><span class="tl-text">${text}</span></li>` };
    }),
  ]
    .sort((a, b) => a.start - b.start)
    .map((x) => '      ' + x.html)
    .join('\n');
  const facts = [
    n.when ? `<div><dt>Dates</dt><dd>${esc(n.when.label)}</dd></div>` : '',
    n.place ? `<div><dt>Place</dt><dd><a href="/e/${n.place}/">${esc(nameOf(n.place))}</a></dd></div>` : '',
    n.aliases.length ? `<div><dt>Also</dt><dd>${esc(n.aliases.join(', '))}</dd></div>` : '',
  ].join('\n        ');
  const sourceList = srcIds
    .map((id, i) => {
      const s = sources[id];
      return `      <li id="src-${i + 1}">
        <span class="src-title"><a href="${esc(s.url)}" rel="external">${esc(s.title)}</a></span>, <a href="/e/${s.publisher}/">${esc(s.publisher_name)}</a>, ${esc(s.published)}.
        <span class="badge tier tier-${s.tier}">${s.tier}</span>
      </li>`;
    })
    .join('\n');
  const chips = lenses.map((l) => `<button type="button" data-lens="${l.id}" aria-pressed="${l.id === 'all'}">${esc(l.label)}</button>`).join('');
  const main = `
<article class="entity" style="--c: ${type.color}">
  <header class="entity-head">
    <div class="entity-title">
      <p class="entity-kind"><span class="kind-dot" aria-hidden="true"></span>${esc(type.label)}</p>
      <h1>${esc(n.name)}</h1>
      ${n.summary ? `<p class="entity-summary">${esc(n.summary)}</p>` : ''}
      <dl class="facts">
        ${facts}
      </dl>
    </div>
    <p class="entity-explore"><a class="button" href="/x/?focus=${n.id}">Explore connections</a></p>
  </header>

  <ctd-lens-chips focus="${n.id}">
    <div class="lens-chips" role="group" aria-label="Lens">
      ${chips}
    </div>
  </ctd-lens-chips>

  <section id="overview" class="tab-panel" aria-label="Overview">
    <h2 class="connections-h">Connections <span class="count">${inc.length}</span></h2>
${groupHtml}
  </section>

  <section id="timeline" class="tab-panel" aria-label="Timeline">
    <h2>Timeline</h2>
    <ol class="timeline">
${timeline}
    </ol>
  </section>

  <section id="history" class="tab-panel" aria-label="History">
    <h2>History</h2>
    <p class="empty">Fixture page: no recorded changes.</p>
  </section>

  <section class="sources" aria-labelledby="sources-h">
    <h2 id="sources-h">Sources</h2>
    <ol class="source-list">
${sourceList}
    </ol>
  </section>
</article>`;
  return page({ title: `${n.name}: connect the dot`, bodyClass: 'entity-page', main });
}

function chapterPage() {
  const steps = shots
    .map(
      (s) => `      <section class="step" data-shot="${s.shot}">
        <div class="step-card">
          ${s.time_label ? `<p class="step-time">${esc(s.time_label)}</p>` : ''}
          ${s.narration_html.trim()}
          ${s.explore ? `<p class="step-explore"><a class="button" href="/x/?focus=${s.focus}">Explore from here</a></p>` : ''}
        </div>
      </section>`,
    )
    .join('\n');
  const json = JSON.stringify(shots).replace(/<\//g, '<\\/');
  const main = `
<article class="chapter">
  <header class="chapter-head">
    <h1>Thirteen days, two stories</h1>
    <p class="chapter-subtitle">October 1962, as told by Washington and by Moscow, and what both of their records confirm.</p>
    <p class="chapter-byline">${shots.length} scenes. Scroll to play, or press Watch.</p>
  </header>
  <div class="prose chapter-intro"><p>Two governments told two different stories about why the world came close to nuclear war. Each line below cites its source, and each interpretation says whose it is.</p></div>
  <ctd-story chapter="thirteen-days-two-stories">
    <script type="application/json" class="ctd-shots">${json}</script>
    <div class="story-stage" aria-hidden="true"></div>
    <div class="story-steps">
${steps}
    </div>
  </ctd-story>
  <div class="prose chapter-outro"><p>Explore the crisis yourself, switch perspectives, and see which claims each side makes.</p></div>
</article>`;
  return page({
    title: 'Thirteen days, two stories: connect the dot',
    bodyClass: 'chapter-page',
    main,
    head: '<link rel="stylesheet" href="/assets/story.css">',
    scripts: '<script type="module" src="/assets/story.js"></script>',
  });
}

const explorerPage = page({
  title: 'Explorer: connect the dot',
  bodyClass: 'explorer-page',
  main: `<div id="explorer-root"><noscript><p class="empty">The explorer needs JavaScript. Every connection is also listed on each entry's page.</p></noscript></div>`,
  head: '<link rel="stylesheet" href="/assets/explorer.css">',
  scripts: '<script type="module" src="/assets/explorer.js"></script>',
});

const routes = [
  ['bill-gates', 'elon-musk'],
  ['moses', 'islam'],
  ['elon-musk', 'nikita-khrushchev'],
  ['abraham', 'christianity'],
];
const home = page({
  title: 'connect the dot',
  bodyClass: 'home',
  main: `
<section class="hero">
  <h1 class="hero-question">How is <a href="/e/bill-gates/">Bill Gates</a> connected to <a href="/e/elon-musk/">Elon Musk</a>?</h1>
  <p class="hero-lede">Dev fixture site. Follow sourced links between people, companies, faiths, events and places.</p>
  <p class="hero-actions"><a class="button primary" href="/x/?from=bill-gates&amp;to=elon-musk">Find the connection</a> <a class="button" href="/c/thirteen-days-two-stories/">Read “Thirteen days, two stories”</a></p>
</section>
<section class="home-section routes">
  <h2>Questions to start with</h2>
  <ul class="route-list">
${routes.map(([a, b]) => `    <li><a href="/x/?from=${a}&amp;to=${b}"><span class="stop" style="--c: ${types[byId.get(a).type].color}">${esc(nameOf(a))}</span><span class="route-line" aria-hidden="true"></span><span class="stop" style="--c: ${types[byId.get(b).type].color}">${esc(nameOf(b))}</span></a></li>`).join('\n')}
  </ul>
</section>
<section class="home-section">
  <h2>Everything on the map</h2>
  <div class="index-columns">
${Object.entries(types)
  .map(([tid, td]) => {
    const list = nodes.filter((n) => n.type === tid);
    if (!list.length) return '';
    return `    <section class="index-group" style="--c: ${td.color}"><h3>${esc(td.plural)}</h3><ul>${list.map((n) => `<li><a href="${n.url}">${esc(n.name)}</a></li>`).join('')}</ul></section>`;
  })
  .join('\n')}
  </div>
</section>`,
});

const chaptersPage = page({
  title: 'Stories: connect the dot',
  bodyClass: 'page',
  main: `
<section class="page-head"><h1>Stories</h1><p class="page-lede">Guided tours through the map.</p></section>
<div class="story-index"><article class="story-teaser"><h2><a href="/c/thirteen-days-two-stories/">Thirteen days, two stories</a></h2><p class="story-sub">October 1962, as told by Washington and by Moscow.</p><p class="story-meta">${shots.length} scenes</p></article></div>`,
});

const notFound = page({ title: 'Not found: connect the dot', bodyClass: 'page', main: '<section class="page-head"><h1>Not found</h1><p class="page-lede">This fixture page does not exist.</p></section>' });

// ---------------------------------------------------------------------------------- write
const write = (rel, content) => {
  const file = join(root, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, content);
};
for (const dir of ['data', 'e', 'x', 'c']) rmSync(join(root, dir), { recursive: true, force: true });
write('data/graph.json', JSON.stringify(graph, null, 1) + '\n');
write('data/search.json', JSON.stringify(search) + '\n');
for (const n of nodes) write(`e/${n.id}/index.html`, entityPage(n));
write('x/index.html', explorerPage);
write('c/index.html', chaptersPage);
write('c/thirteen-days-two-stories/index.html', chapterPage());
write('index.html', home);
write('404.html', notFound);
console.log(`fixtures: ${nodes.length} nodes, ${edges.length} edges, ${perspectives.length} perspectives, ${Object.keys(sources).length} sources, ${shots.length} shots`);
