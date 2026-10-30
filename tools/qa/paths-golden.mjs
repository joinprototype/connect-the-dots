// The route finder exists twice: Rust for stories and the home page, TypeScript in the explorer.
// This checks they agree on the real graph: same routes, same costs, for a spread of pairs.
// Usage: ctd build --out <dir>, then node tools/qa/paths-golden.mjs <dir> [--pairs=60]
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { decodeSlim, indexGraph } from '../../web/src/lib/data.ts';
import { findPaths } from '../../web/src/lib/paths.ts';

const dir = process.argv.slice(2).find((a) => !a.startsWith('--'));
if (!dir) {
  console.error('usage: node tools/qa/paths-golden.mjs <built dir> [--pairs=60]');
  process.exit(2);
}
const wanted = Number((process.argv.find((a) => a.startsWith('--pairs=')) || '--pairs=60').split('=')[1]);
const read = (name) => JSON.parse(readFileSync(join(dir, 'data', name), 'utf8'));
const schema = read('schema.json');
const idx = indexGraph({ ...schema, ...decodeSlim(schema, read('graph-slim.json')), sources: {} });
const m = schema.methodology;
const ids = [...idx.nodes.keys()].sort();

// a spread of pairs across the sorted ids, the same on every run
const pairs = [];
for (let i = 0; i < wanted; i++) {
  const a = ids[(i * 37 + 11) % ids.length];
  const b = ids[(i * 101 + 53) % ids.length];
  if (a !== b) pairs.push([a, b]);
}

const close = (x, y) => Math.abs(x - y) < 1e-6;
let routes = 0;
const bad = [];
for (const [a, b] of pairs) {
  const args = ['run', '-q', '--', 'path', a, b, '--json', `--k=${m.k_paths ?? 5}`, `--max-hops=${m.max_hops ?? 10}`];
  const rust = JSON.parse(execFileSync('cargo', args, { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }));
  const ts = findPaths(idx, a, b).map((p) => ({ nodes: p.nodes, cost: p.cost }));
  routes += rust.length;
  const same = rust.length === ts.length && rust.every((r, i) => r.nodes.join('>') === ts[i].nodes.join('>') && close(r.cost, ts[i].cost));
  if (!same) bad.push({ a, b, rust, ts });
}
console.log(`${pairs.length} pairs, ${routes} routes, ${bad.length} pairs differ`);
for (const { a, b, rust, ts } of bad.slice(0, 8)) {
  console.log(`\n${a} → ${b}`);
  console.log(' rust', rust.slice(0, 3).map((r) => `${r.cost.toFixed(4)} ${r.nodes.length - 1} hops ${r.nodes.join(' > ')}`).join('\n      '));
  console.log(' ts  ', ts.slice(0, 3).map((r) => `${r.cost.toFixed(4)} ${r.nodes.length - 1} hops ${r.nodes.join(' > ')}`).join('\n      '));
}
process.exit(bad.length ? 1 : 0);
