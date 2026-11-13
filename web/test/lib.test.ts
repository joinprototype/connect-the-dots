// Unit tests for the browser's pure logic. Node runs TypeScript itself: `npm --prefix web test`.
// Only modules with no value imports load here, since the sources import without file extensions.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatYearNumber, puzzleDay } from '../src/lib/dates.ts';
import { fuzzySearch } from '../src/lib/fuzzy.ts';
import { hash01 } from '../src/lib/hash.ts';

test('years read as people write them', () => {
  assert.equal(formatYearNumber(1962), '1962');
  assert.equal(formatYearNumber(30), '30 CE');
  assert.equal(formatYearNumber(0), '1 BCE');
  assert.equal(formatYearNumber(-449), '450 BCE');
});

test("the puzzle's day turns at the reader's own midnight", () => {
  assert.equal(puzzleDay('2026-11-01', new Date(2026, 10, 1, 0, 0)), 0);
  assert.equal(puzzleDay('2026-11-01', new Date(2026, 10, 1, 23, 59)), 0);
  assert.equal(puzzleDay('2026-11-01', new Date(2026, 10, 2, 0, 1)), 1);
  assert.equal(puzzleDay('2026-11-01', new Date(2026, 10, 12, 12, 0)), 11);
  // a clock change in between moves no day: 8 March and 1 November 2026 in the United States
  assert.equal(puzzleDay('2026-03-07', new Date(2026, 2, 9, 0, 30)), 2);
  assert.equal(puzzleDay('2026-10-31', new Date(2026, 10, 2, 23, 30)), 2);
  assert.equal(puzzleDay('2026-12-31', new Date(2027, 0, 1, 9, 0)), 1);
});

test('hash01 is steady, in [0, 1), and moved by its salt', () => {
  const a = hash01('bill-gates');
  assert.equal(a, hash01('bill-gates'));
  assert.ok(a >= 0 && a < 1);
  assert.notEqual(hash01('bill-gates', 1), a);
  for (const s of ['', 'a', 'x'.repeat(500), 'ünïcödé']) {
    const h = hash01(s);
    assert.ok(h >= 0 && h < 1, s);
  }
});

const PEOPLE = [
  { id: 'bill-gates', name: 'Bill Gates' },
  { id: 'us-government', name: 'Federal Government of the United States' },
  { id: 'jose-marti', name: 'José Martí' },
  { id: 'muslim-league', name: 'All-India Muslim League', aliases: ['Muslim League'] },
  { id: 'league-of-nations', name: 'League of Nations' },
];

test('a word beats scattered letters', () => {
  const hits = fuzzySearch(PEOPLE, 'gates');
  assert.deepEqual(
    hits.map((h) => h.item.id),
    ['bill-gates'],
  );
  assert.deepEqual(hits[0].ranges, [[5, 10]]);
});

test('accents and case do not matter, and highlights land on the original letters', () => {
  const [hit] = fuzzySearch(PEOPLE, 'JOSE MARTI');
  assert.equal(hit?.item.id, 'jose-marti');
  assert.equal(hit.text, 'José Martí');
  const lit = hit.ranges.map(([a, b]) => hit.text.slice(a, b)).join('');
  assert.equal(lit.replace(/\s/g, ''), 'JoséMartí');
});

test('an alias finds its entry, below a name that matches as well', () => {
  const hits = fuzzySearch(PEOPLE, 'league');
  const ids = hits.map((h) => h.item.id);
  assert.ok(ids.includes('muslim-league') && ids.includes('league-of-nations'));
  const ml = hits.find((h) => h.item.id === 'muslim-league')!;
  assert.equal(ml.isAlias, false, 'its own name also says League');
  assert.equal(fuzzySearch(PEOPLE, 'muslim league')[0].item.id, 'muslim-league');
});

test('nothing to look for finds nothing, and the limit holds', () => {
  assert.deepEqual(fuzzySearch(PEOPLE, ''), []);
  assert.deepEqual(fuzzySearch(PEOPLE, '   '), []);
  assert.equal(fuzzySearch(PEOPLE, 'e', 2).length <= 2, true);
});
