// Headless-Chrome QA harness: open a page, run an action script, collect every JS error.
// Usage: node tools/qa/cdp.mjs <url> [actions.js] [--wait=ms] [--shot=file.png] [--scheme=light|dark] [--size=390x844]
// Prints JSON: { url, errors: [...], logs: [...], result } and exits non-zero if errors were seen.
import { readFileSync, writeFileSync } from 'node:fs';
import { launch } from './chrome.mjs';

const args = process.argv.slice(2);
const url = args.find((a) => !a.startsWith('--') && !a.endsWith('.js'));
const actionFile = args.find((a) => a.endsWith('.js'));
const wait = Number((args.find((a) => a.startsWith('--wait=')) || '--wait=4000').split('=')[1]);
const shot = (args.find((a) => a.startsWith('--shot=')) || '').split('=')[1];
// --scheme=light|dark emulates prefers-color-scheme (headless Chrome otherwise follows the OS).
const scheme = (args.find((a) => a.startsWith('--scheme=')) || '').split('=')[1];
// --size=390x844 emulates a phone viewport.
const size = (args.find((a) => a.startsWith('--size=')) || '').split('=')[1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await launch();
if (!cdp) {
  console.log(JSON.stringify({ url, errors: ['chrome did not start'] }));
  process.exit(3);
}
const { ws, send, done } = cdp;
setTimeout(() => { console.log(JSON.stringify({ url, errors: ['harness timeout'] })); done(3); }, 120000);

const errors = [];
const logs = [];
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Runtime.exceptionThrown') {
    const d = msg.params.exceptionDetails;
    errors.push(`exception: ${d.exception?.description || d.text} @ ${d.url || ''}:${d.lineNumber}`);
  } else if (msg.method === 'Runtime.consoleAPICalled') {
    const text = msg.params.args.map((a) => a.value ?? a.description ?? '').join(' ');
    if (msg.params.type === 'error') errors.push(`console.error: ${text}`);
    else logs.push(`${msg.params.type}: ${text}`.slice(0, 300));
  } else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') {
    errors.push(`log: ${msg.params.entry.text} ${msg.params.entry.url || ''}`);
  }
});

await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
if (scheme) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
if (size) {
  const [width, height] = size.split('x').map(Number);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
}
await send('Page.navigate', { url });
await sleep(wait);
let result = null;
if (actionFile) {
  const code = readFileSync(actionFile, 'utf8');
  const res = await send('Runtime.evaluate', { expression: `(async () => { ${code} })()`, awaitPromise: true, returnByValue: true });
  result = res.result?.result?.value ?? res.result?.exceptionDetails?.exception?.description ?? null;
  await sleep(1500);
}
if (shot) {
  const img = await send('Page.captureScreenshot', { format: 'png' });
  if (img.result?.data) writeFileSync(shot, Buffer.from(img.result.data, 'base64'));
  else errors.push(`screenshot failed: ${JSON.stringify(img.error ?? img)}`);
}
console.log(JSON.stringify({ url, errors, logs: logs.slice(-15), result }, null, 1));
done(errors.length ? 1 : 0);
