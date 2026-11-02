// A stop or a step of a route is never a sealed entry, or an event or work about one (ADR-0027). `ctd check`
// and the atlas are meant to guarantee it. This checks what a build actually ships: the written record's
// links, the atlas shards every open-data route walks, and the landmark table between them.
// Usage: ctd build --out <dir>, then node tools/qa/sealed-routes.mjs <dir>
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeSlim, decodeWays, indexGraph } from '../../web/src/lib/data.ts';
import { findPaths } from '../../web/src/lib/paths.ts';

const dir = process.argv[2];
if (!dir) {
  console.error('usage: node tools/qa/sealed-routes.mjs <built dir>');
  process.exit(2);
}
const read = (name) => JSON.parse(readFileSync(join(dir, 'data', name), 'utf8'));
const bad = [];

// the sealed entries, from their own files
const files = execFileSync('grep', ['-rlE', '^sealed: true', 'content/entities'], { encoding: 'utf8' }).trim().split('\n');
const front = files.map((f) => readFileSync(f, 'utf8'));
const hand = new Map();
for (const text of front) {
  const id = /^id: (.+)$/m.exec(text)?.[1].trim();
  const q = /wikidata: "?(Q\d+)/.exec(text)?.[1];
  if (id) hand.set(id, q ?? null);
}

const schema = read('schema.json');
const idx = indexGraph({ ...schema, ...decodeSlim(schema, read('graph-slim.json')), sources: {} });

// what is about them: events and works linked to one, as `ctd check` counts them
const about = new Set(hand.keys());
for (const e of idx.edges.values()) {
  for (const [x, y] of [[e.from, e.to], [e.to, e.from]]) {
    if (hand.has(y) && ['event', 'work'].includes(idx.nodes.get(x)?.type)) about.add(x);
  }
}

// the written record: no link a route may use touches them, so no path can
for (const e of idx.edges.values()) {
  if (e.traversable && (about.has(e.from) || about.has(e.to))) bad.push(`link ${e.id} opens a route through ${about.has(e.from) ? e.from : e.to}`);
}
const ways = indexGraph({ ...schema, ...decodeWays(schema, read('ways.json')), sources: {} });
for (const e of ways.edges.values()) {
  if (about.has(e.from) || about.has(e.to)) bad.push(`ways.json keeps ${e.id}, through ${about.has(e.from) ? e.from : e.to}`);
}
const ids = [...idx.nodes.keys()].sort();
let walked = 0;
for (const id of about) {
  for (let i = 0; i < 40; i++) {
    const other = ids[(i * 83 + 7) % ids.length];
    for (const p of findPaths(idx, id, other).concat(findPaths(idx, other, id))) bad.push(`path ${p.nodes.join(' > ')} ends on ${id}`);
    walked++;
  }
}
for (let i = 0; i < 300; i++) {
  const [a, b] = [ids[(i * 37 + 11) % ids.length], ids[(i * 101 + 53) % ids.length]];
  for (const p of findPaths(idx, a, b)) {
    const hit = p.nodes.find((n) => about.has(n));
    if (hit) bad.push(`path ${p.nodes.join(' > ')} passes through ${hit}`);
    walked++;
  }
}

// open data: a sealed entry keeps a bare dot, and nothing leads to it or stands on it
const shut = new Set([...hand.values()].filter(Boolean).map((q) => Number(q.slice(1))));
const named = (n) => n != null && (shut.has(n[0]) || about.has(n[4]));
let entries = 0;
for (const file of readdirSync(join(dir, 'data', 'a'))) {
  const shard = read(join('a', file));
  for (const [q, e] of Object.entries(shard)) {
    entries++;
    const sealed = shut.has(Number(q.slice(1)));
    if (sealed && (e.r || e.g?.length || e.d || e.i)) bad.push(`atlas ${q} (${e.n}) keeps open data`);
    if (e.r && shut.has(e.r[0])) bad.push(`atlas ${q} (${e.n}) steps onto sealed Q${e.r[0]}`);
    for (const [, names] of e.g ?? []) for (const n of names) if (named(n)) bad.push(`atlas ${q} (${e.n}) lists ${n[1]}`);
    const page = e.u?.split('/')[2];
    if (page && about.has(page) && !hand.has(page)) bad.push(`atlas ${q} (${e.n}) keeps an entry about a sealed one`);
  }
}
const table = read('routes.json');
for (const q of table.l) if (shut.has(q)) bad.push(`landmark Q${q} is sealed`);
for (const [key, [x, y]] of Object.entries(table.b)) if (shut.has(x) || shut.has(y)) bad.push(`crossing ${key} stands on a sealed entry`);

console.log(`${hand.size} sealed, ${about.size} with what is about them, ${walked} paths, ${entries} atlas entries, ${bad.length} problems`);
for (const line of bad.slice(0, 30)) console.log(` ${line}`);
process.exit(bad.length ? 1 : 0);
