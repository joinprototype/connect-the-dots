// Headless Chrome for the QA tools: one per run, never left behind. It is killed when the run ends, is
// interrupted (Ctrl+C, a kill, a closed terminal) or crashes, and each run first stops headless Chromes that
// earlier runs left behind: only ours (a QA profile folder) and only those over an hour old.
import { execFileSync, spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
/** Profile folders of QA runs, past and present. */
const OURS = /--user-data-dir=\S*ctd-(chrome|qa|sweep)-/;

function reapStale() {
  let ps = '';
  try {
    ps = execFileSync('ps', ['-Ao', 'pid=,etime=,args='], { encoding: 'utf8' });
  } catch {
    return;
  }
  for (const line of ps.split('\n')) {
    const m = /^\s*(\d+)\s+(\S+)\s+(.*)$/.exec(line);
    if (!m || !m[3].includes('--headless') || !OURS.test(m[3])) continue;
    // etime is [[dd-]hh:]mm:ss
    const secs = m[2].split(/[-:]/).map(Number).reverse().reduce((s, v, i) => s + v * [1, 60, 3600, 86400][i], 0);
    if (secs > 3600) {
      try {
        process.kill(Number(m[1]), 'SIGKILL');
      } catch {
        /* already gone */
      }
    }
  }
}

/**
 * Starts headless Chrome and connects to its page over the DevTools protocol. Returns `{ ws, send, done }`:
 * `send(method, params)` resolves with the reply, `done(code)` kills Chrome and exits. Null when Chrome
 * does not start (it is killed then too).
 */
export async function launch() {
  reapStale();
  const port = 9300 + Math.floor(Math.random() * 600);
  const chrome = spawn(CHROME, [
    '--headless=new', '--mute-audio', `--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ctd-chrome-'))}`,
    '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
    '--window-size=1440,900', '--hide-scrollbars', 'about:blank',
  ], { stdio: 'ignore' });
  const kill = () => {
    try {
      chrome.kill('SIGKILL');
    } catch {
      /* already gone */
    }
  };
  const done = (code) => {
    kill();
    process.exit(code);
  };
  process.on('exit', kill);
  for (const sig of ['SIGINT', 'SIGTERM', 'SIGHUP']) process.on(sig, () => done(130));
  process.on('uncaughtException', (err) => {
    console.error(err);
    done(1);
  });

  let target;
  for (let i = 0; i < 50 && !target; i++) {
    try {
      target = (await (await fetch(`http://127.0.0.1:${port}/json/list`)).json()).find((t) => t.type === 'page');
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }
  if (!target) {
    kill();
    return null;
  }
  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((r) => ws.addEventListener('open', r, { once: true }));
  let nextId = 1;
  const pending = new Map();
  ws.addEventListener('message', (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  });
  const send = (method, params = {}) =>
    new Promise((r) => {
      const id = nextId++;
      pending.set(id, r);
      ws.send(JSON.stringify({ id, method, params }));
    });
  return { ws, send, done };
}
