// What the box understands: web/src/lib/box.ts against a small made-up list, plus, with --dist=<built site>,
// the real search files. `node tools/qa/box-check.mjs [--dist=dist]`. Exit 1 on a failure. No browser.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { registerHooks } from 'node:module';
import { join } from 'node:path';

// the web code imports without file endings, as a bundler reads it
registerHooks({ resolve: (spec, ctx, next) => next(/^\.\.?\/[^.]+$/.test(spec) ? `${spec}.ts` : spec, ctx) });
const { findNames, lookupOf, suggest, understand, worthReading } = await import('../../web/src/lib/box.ts');
const { fuzzySearch } = await import('../../web/src/lib/fuzzy.ts');
const { words } = await import('../../web/src/lib/search.ts');

let rank = 0;
const entry = (id, name, type, more = {}) => ({ id, name, type, aliases: [], summary: `About ${name}`, url: /^Q\d/.test(id) ? `/a/?q=${id}` : `/e/${id}/`, rank: rank++, ...more });
const list = [
  entry('bill-gates', 'Bill Gates', 'person', { aliases: ['William Henry Gates III'] }),
  entry('ibm', 'IBM', 'org', { q: ['behind'], aliases: ['International Business Machines'] }),
  entry('meta-platforms', 'Meta Platforms', 'org', { q: ['behind'], aliases: ['Facebook'] }),
  entry('the-vanguard-group', 'The Vanguard Group', 'org'),
  entry('dissolution', 'Dissolution of the Soviet Union', 'event', { q: ['why', 'benefited'] }),
  entry('gutenberg-bible', 'Gutenberg Bible', 'work'),
  entry('spacex', 'SpaceX', 'org', { q: ['behind'] }),
  entry('jeffrey-epstein', 'Jeffrey Epstein', 'person', { sealed: true }),
  entry('o-brien', "Conan O'Brien", 'person'),
  entry('mercury', 'Mercury (planet)', 'place'),
  entry('Q1', 'Criminal', 'work'),
  entry('Q2', 'Douglas Adams', 'person'),
  entry('Q3', 'Paris', 'place'),
  entry('Q4', 'Israelis', 'concept'),
  entry('Q5', 'Spa', 'place'),
  entry('why/dissolution', 'Why did the dissolution of the Soviet Union happen?', 'question', { url: '/q/why/dissolution/', aliases: [] }),
  entry('the-crash', 'The Crash of 2008', 'chapter', { url: '/c/the-crash/' }),
  entry('1915', '1915', 'chapter', { url: '/c/1915/' }),
];
const lookup = lookupOf(list);
const read = (text) => understand(text, lookup, 2026);
const url = (text) => read(text).url;
const kind = (text) => read(text).kind;
const rows = (text) => suggest(text, lookup, read(text));

// one name
assert.equal(url('Bill Gates'), '/e/bill-gates/');
assert.equal(url('bill gates'), '/e/bill-gates/');
assert.equal(url('Who is Bill Gates?'), '/e/bill-gates/');
assert.equal(url('Gates'), '/e/bill-gates/', 'a last name');
assert.equal(url('William Henry Gates III'), '/e/bill-gates/', 'an alias');
assert.equal(url('Vanguard Group'), '/e/the-vanguard-group/', 'a name without its "the"');
assert.equal(url('Mercury'), '/e/mercury/', 'a name without its brackets');
assert.equal(url("conan o'brien"), '/e/o-brien/');
assert.equal(url('Douglas Adams'), '/a/?q=Q2', 'an atlas entry');
assert.equal(url('paris'), '/a/?q=Q3', 'one open-data word, alone');
assert.equal(url('The Crash of 2008'), '/c/the-crash/', 'a story');

// two names
for (const text of ['Bill Gates and IBM', 'from Bill Gates to IBM', 'how are Bill Gates and IBM connected?', 'How is Bill Gates connected to IBM?', 'Bill Gates, IBM', 'between Bill Gates and IBM', 'Bill Gates vs IBM', 'Gates & IBM']) {
  assert.equal(url(text), '/r/?a=bill-gates&b=ibm', text);
}
assert.equal(url('Bill Gates and Douglas Adams'), '/r/?a=bill-gates&b=Q2');
assert.equal(url('Bill Gates and Jeffrey Epstein'), '/r/?a=bill-gates&b=jeffrey-epstein', 'a person can ask about a sealed entry');
assert.equal(kind('IBM and IBM'), 'name', 'one name twice is one name');
assert.equal(url('How is the Gutenberg Bible connected to SpaceX?'), '/r/?a=gutenberg-bible&b=spacex');

// a year
assert.equal(url('1914'), '/w/?t=1914');
assert.equal(url('What happened in 1962?'), '/w/?t=1962');
assert.equal(url('in 476'), '/w/?t=476');
assert.equal(url('450 BCE'), '/w/?t=-449');
assert.equal(url('1915'), '/w/?t=1915', 'a year, though a story has that title');
assert.equal(kind('2999'), 'unknown', 'not yet');
assert.equal(kind('12'), 'unknown');

// a question
assert.equal(url('Who is behind IBM?'), '/q/behind/ibm/');
assert.equal(url("who's behind Facebook"), '/q/behind/meta-platforms/');
assert.equal(url('Who owns IBM?'), '/q/behind/ibm/');
assert.equal(url('Why did the dissolution of the Soviet Union happen?'), '/q/why/dissolution/');
assert.equal(url('why did the Dissolution of the Soviet Union happen'), '/q/why/dissolution/');
assert.equal(url('Who benefited from the dissolution of the Soviet Union?'), '/q/benefited/dissolution/');
assert.equal(read('Who is behind IBM?').ask, 'Who is behind IBM?');
assert.deepEqual(read('Who is behind Bill Gates?'), { kind: 'unknown', found: [list[0]] }, 'no page: the plain reply, and the name');
assert.equal(kind('Why is the sky blue?'), 'unknown');

// nothing it understands, and an empty box
assert.deepEqual(read('asdf qwer'), { kind: 'unknown', found: [] });
assert.deepEqual(read('Is Bill Gates a criminal?'), { kind: 'unknown', found: [list[0]] }, 'an everyday word is no open-data title, and the name alone does not answer');
assert.deepEqual(read(''), { kind: 'empty', url: '/c/' });
assert.deepEqual(read('   ?  '), { kind: 'empty', url: '/c/' });

// nothing typed comes back: a reading holds entries, numbers and fixed words
const typed = 'Zzyzx Qwerty is a fraud';
assert.ok(!JSON.stringify(read(typed)).includes('Zzyzx'));
assert.ok(!JSON.stringify(suggest(typed, lookup)).includes('Zzyzx'));

// an open-data concept is a name alone, never one end of a pair (ADR-0016)
assert.equal(url('Israelis'), '/a/?q=Q4');
assert.deepEqual(read('Israelis and IBM'), { kind: 'unknown', found: [list[1]] });
assert.ok(!rows('Bill Gates and Isr').rows.some((r) => r.url.includes('Q4')));

// where the dots go
assert.deepEqual(findNames('How is Bill Gates and  IBM', lookup).map((f) => [f.entry.id, f.at, f.end]), [['bill-gates', 7, 17], ['ibm', 23, 26]]);
assert.deepEqual(findNames('the criminal', lookup), [], 'lower case');
assert.deepEqual(findNames('the Criminal', lookup).map((f) => f.entry.id), ['Q1'], 'with a capital');

// suggestions
assert.deepEqual(rows('Bill Gates and IBM').rows.map((r) => r.label), ['Bill Gates and IBM']);
assert.ok(rows('Bill Gates and IB').firm);
assert.equal(rows('Bill Gates and IB').rows[0].url, '/r/?a=bill-gates&b=ibm');
assert.equal(rows('how is the Gutenberg Bible connected to Spa').rows[0].label, 'Gutenberg Bible and SpaceX');
assert.equal(rows('Who is behind Met').rows[0].url, '/q/behind/meta-platforms/');
assert.equal(rows('1914').rows[0].label, '1914 on the Map');
assert.deepEqual(rows('1915').rows.map((r) => r.url), ['/w/?t=1915', '/c/1915/'], 'and the story, second');
assert.deepEqual(rows('Bill Gates and Spa').rows.map((r) => r.url), ['/r/?a=bill-gates&b=spacex', '/r/?a=bill-gates&b=Q5'], 'a name written by hand before an open-data title that the text happens to match');
assert.equal(rows('450 BCE').rows[0].label, '450 BCE on the Map');
assert.equal(rows('Bill Ga').rows[0].url, '/e/bill-gates/');
assert.ok(!rows('Is Bill Gates a criminal').firm, 'Enter does not guess at a sentence it cannot read');
// a sealed entry is found, and no row offers a pair through it (ADR-0027)
assert.deepEqual(rows('Jeffrey Epstein').rows[0].url, '/e/jeffrey-epstein/');
assert.deepEqual(rows('Bill Gates and Jeffrey Epstein').rows, []);
assert.ok(!rows('Bill Gates and Jeff').rows.some((r) => r.url.includes('epstein')));
assert.deepEqual(rows('Jeffrey Epstein and IB').rows.filter((r) => r.url.startsWith('/r/')), []);

// search reads no file for a word that cannot be a name
assert.ok(!worthReading('the') && !worthReading('how is') && !worthReading('to spacex'));
assert.ok(worthReading('spacex') && worthReading('bank of') && worthReading('bill gates'));

// the question ids are the schema's
const schema = readFileSync(new URL('../../content/schema/questions.yaml', import.meta.url), 'utf8');
for (const q of ['behind', 'why', 'benefited']) assert.ok(schema.includes(`id: ${q}`), q);

// the real search files, as `candidates` reads them
const dist = process.argv.find((a) => a.startsWith('--dist='))?.slice(7);
if (dist) {
  const { files } = JSON.parse(readFileSync(join(dist, 'data/search/index.json'), 'utf8'));
  const open = new Map();
  const file = (n) => {
    if (!open.has(n)) open.set(n, JSON.parse(readFileSync(join(dist, `data/search/${n}.json`), 'utf8')));
    return open.get(n);
  };
  const candidates = (text) => {
    const w = words(text);
    const keys = [...new Set([...w, ...w.slice(1).map((x, i) => `${w[i]} ${x}`)])].filter(worthReading);
    const found = new Map();
    for (const key of keys) {
      const first = Math.max(0, files.findLastIndex((f) => f <= key));
      for (const n of first + 1 < files.length && files[first + 1].startsWith(key) ? [first, first + 1] : [first]) {
        const f = file(n);
        for (const [word, at] of f.words ?? []) if (word.startsWith(key)) for (const j of at) found.set(f.entries[j].rank, f.entries[j]);
      }
    }
    return [...found.values()].sort((a, b) => a.rank - b.rank);
  };
  const real = (text) => understand(text, lookupOf(candidates(text)), 2026);
  assert.equal(real('Bill Gates and IBM').url, '/r/?a=bill-gates&b=ibm');
  assert.equal(real('How is the Gutenberg Bible connected to SpaceX?').url, '/r/?a=gutenberg-bible&b=spacex');
  assert.equal(real('Bill Gates and Jeffrey Epstein').url, '/r/?a=bill-gates&b=jeffrey-epstein');
  assert.equal(real('Who is behind Meta Platforms?').url, '/q/behind/meta-platforms/');
  assert.equal(real('Who is behind Facebook?').url, '/q/behind/meta-platforms/');
  assert.equal(real('Why did the dissolution of the Soviet Union happen?').url, '/q/why/dissolution-of-the-soviet-union/');
  assert.equal(real('1914').url, '/w/?t=1914');
  assert.equal(real('Douglas Adams').url, '/a/?q=Q42');
  assert.equal(real('Bank of America').kind, 'name');
  assert.equal(real('asdfgh qwerty').kind, 'unknown');
  // no heritage word reads as a name, so none makes a pair or a route (ADR-0016)
  for (const text of ['Is Bill Gates Jewish?', 'Jews and banks', 'Arabs and Bill Gates', 'black people and IBM', 'White people and Bill Gates', 'Israelis and Bill Gates']) {
    assert.ok(real(text).kind !== 'pair', text);
  }
  assert.ok(fuzzySearch(candidates('spacex'), 'spacex', 1).length);
}
console.log('box-check: ok');
