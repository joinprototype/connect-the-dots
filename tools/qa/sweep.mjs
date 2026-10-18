// Sweeps every page of a build in one headless Chrome: opens each page with its folds open and
// reports console errors and sideways scroll. Alias redirect pages are skipped.
// Usage: node tools/qa/sweep.mjs [--dist=.cache/serve] [--base=http://127.0.0.1:4321] [--scheme=dark] [--size=390x844] [--wait=500] [--only=/q/] [--a11y]
// --a11y also checks structure: one h1, a main landmark, named links and buttons, labelled fields, image alt text,
// and text contrast (WCAG 2.x: below 4.5:1 fails, below 3:1 from 24px or 18.66px bold) once animations have
// finished: each visible text (text nodes, ::before/::after strings, input values, ::placeholder) against the
// backgrounds and opacity of the boxes it sits in, composited down to the page. Text with a canvas, image, video,
// svg or background image behind it is counted as unverifiable, not failed; a one-colour gradient (the story
// highlighter) counts as that colour. Skipped: disabled controls, text inside svg, list markers. Text drawn on a
// canvas (graph and map names) is outside it. Run both schemes and both sizes: tokens and layouts differ.
// Prints one line per page with a problem, one indented line per low-contrast text (ratio, selector, text, text
// colour on background colour), then a summary; exits non-zero if any page had one.
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { launch } from './chrome.mjs';

const opt = (name, fallback) => (process.argv.find((a) => a.startsWith(`--${name}=`)) || `=${fallback}`).split('=').slice(1).join('=');
const dist = opt('dist', '.cache/serve'); // the dev server's build; pass --dist for a static one
const base = opt('base', 'http://127.0.0.1:4321');
const scheme = opt('scheme', '');
const size = opt('size', '');
const wait = Number(opt('wait', '500'));
const only = opt('only', '');
const a11y = process.argv.includes('--a11y');

// every page: dist/**/index.html, as a URL path, without alias redirects
const pages = [];
const walk = (dir) => {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) walk(p);
    else if (e.name === 'index.html' && !readFileSync(p, 'utf8').includes('http-equiv="refresh"')) {
      const rel = relative(dist, dir).split(sep).join('/');
      pages.push(rel ? `/${rel}/` : '/');
    }
  }
};
walk(dist);
pages.sort();
const todo = pages.filter((p) => p.startsWith(only));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const cdp = await launch();
if (!cdp) {
  console.log('chrome did not start');
  process.exit(3);
}
const { ws, send, done } = cdp;
let errors = [];
let loaded = null;
ws.addEventListener('message', (ev) => {
  const msg = JSON.parse(ev.data);
  if (msg.method === 'Page.loadEventFired' && loaded) loaded();
  else if (msg.method === 'Runtime.exceptionThrown') errors.push(msg.params.exceptionDetails.exception?.description || msg.params.exceptionDetails.text);
  else if (msg.method === 'Runtime.consoleAPICalled' && msg.params.type === 'error') errors.push(msg.params.args.map((a) => a.value ?? a.description ?? '').join(' '));
  else if (msg.method === 'Log.entryAdded' && msg.params.entry.level === 'error') errors.push(`${msg.params.entry.text} ${msg.params.entry.url || ''}`);
  // pages load what they show (ADR-0017): no page reads the whole graph
  else if (msg.method === 'Network.requestWillBeSent' && /\/data\/(graph|search)\.json(\?|$)/.test(msg.params.request.url)) errors.push(`requested ${msg.params.request.url}`);
});
await send('Runtime.enable');
await send('Log.enable');
await send('Page.enable');
await send('Network.enable');
if (scheme) await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
if (size) {
  const [width, height] = size.split('x').map(Number);
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile: true });
}

const PROBE = `(() => { document.querySelectorAll('details').forEach((d) => { d.open = true; });
  const w = document.documentElement.scrollWidth; return w > innerWidth ? w + '>' + innerWidth : ''; })()`;
// structural accessibility: what a screen reader needs to find its way (not a full audit)
const A11Y = `(() => {
  const out = [];
  const visible = (e) => !e.closest('[hidden], [aria-hidden="true"]') && getComputedStyle(e).display !== 'none';
  const name = (e) => (e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') && document.getElementById(e.getAttribute('aria-labelledby'))?.textContent || e.textContent || e.getAttribute('title') || e.querySelector('img[alt]')?.alt || '').trim();
  const h1 = document.querySelectorAll('h1').length;
  if (h1 !== 1) out.push(h1 + ' h1');
  if (!document.querySelector('main')) out.push('no main');
  const noname = [...document.querySelectorAll('a[href], button')].filter((e) => visible(e) && !name(e));
  if (noname.length) out.push(noname.length + ' unnamed link/button (' + noname[0].outerHTML.slice(0, 80) + ')');
  const fields = [...document.querySelectorAll('input:not([type=hidden]), select, textarea')].filter((e) => visible(e) && !(e.labels?.length || e.getAttribute('aria-label') || e.getAttribute('aria-labelledby') || e.closest('label')));
  if (fields.length) out.push(fields.length + ' unlabelled field (' + fields[0].outerHTML.slice(0, 80) + ')');
  const imgs = [...document.querySelectorAll('img')].filter((e) => !e.hasAttribute('alt'));
  if (imgs.length) out.push(imgs.length + ' img without alt');
  return out.join('; ');
})()`;
// Text contrast, run in the page as `(${contrast})()`: self-contained, no outside names.
function contrast() {
  for (const a of document.getAnimations()) try { a.finish(); } catch {} // settled colours, not a fade-in
  const styles = new Map();
  const css = (e) => styles.get(e) || styles.set(e, getComputedStyle(e)).get(e);
  const dot = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
  // a computed colour as [r, g, b, alpha], r g b 0-255
  const parse = (c) => {
    const n = (c.match(/-?[\d.]+(e-?\d+)?/g) || []).map(Number);
    if (c.startsWith('rgb')) return [n[0], n[1], n[2], n[3] ?? 1];
    if (c.startsWith('color(srgb ')) return [n[0] * 255, n[1] * 255, n[2] * 255, n[3] ?? 1];
    dot.clearRect(0, 0, 1, 1); dot.fillStyle = c; dot.fillRect(0, 0, 1, 1);
    const d = dot.getImageData(0, 0, 1, 1).data;
    return [d[0], d[1], d[2], d[3] / 255];
  };
  const pre = ([r, g, b, a]) => [r * a, g * a, b * a, a];
  const over = (top, under) => top.map((v, i) => v + under[i] * (1 - top[3])); // premultiplied
  const lum = (c) => c.slice(0, 3).reduce((s, v, i) => s + [0.2126, 0.7152, 0.0722][i] * ((v /= 255) <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4), 0);
  const ratio = (a, b) => (Math.max(lum(a), lum(b)) + 0.05) / (Math.min(lum(a), lum(b)) + 0.05);
  const hex = (c) => '#' + c.slice(0, 3).map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
  // what a box paints under its content: a colour, or null for an image (a one-colour gradient is that colour)
  const fill = (s) => {
    const bg = pre(parse(s.backgroundColor));
    if (s.backgroundImage === 'none') return bg;
    const one = /^linear-gradient\(((?:rgba?|color)\([^)]*\)), \1\)$/.exec(s.backgroundImage);
    return one ? over(pre(parse(one[1])), bg) : null;
  };
  // The text and background colours seen: the box's background and each ancestor's, every opacity applied to
  // its whole box, over white. A background paints only its own box, so one the text shows outside of (a name
  // set above its dot) is passed over. `top` is the outermost box whose background still shows. null: an image.
  const seen = (e, fg, own, shows) => {
    let t = pre(fg), b = [0, 0, 0, 0], top = e;
    const layers = own ? [[e, own]] : [];
    for (let x = e; x; x = x.parentElement) layers.push([x, css(x)]);
    for (const [x, s] of layers) {
      const f = s !== own && x.parentElement && x !== document.body && !meets(shows.get(x)[1], x.getBoundingClientRect()) ? [0, 0, 0, 0] : fill(s);
      if (b[3] < 0.999) { if (!f) return null; top = x; }
      if (f) { t = over(t, f); b = over(b, f); }
      t = t.map((v) => v * s.opacity); b = b.map((v) => v * s.opacity);
    }
    return { t: over(t, [255, 255, 255, 1]), b: over(b, [255, 255, 255, 1]), top };
  };
  const shown = (e) => e.checkVisibility({ opacityProperty: true, visibilityProperty: true });
  // Where a text shows, box by box from the inside out, as [entering the box, inside it]: a box that scrolls
  // brings it into its own view, one that clips cuts it. null: cut away, or off the page.
  const placed = (e, box) => {
    const at = new Map();
    for (let x = e; x; x = x.parentElement) {
      const s = css(x), q = x.getBoundingClientRect(), enter = box;
      if (/auto|scroll/.test(s.overflow) && !meets(box, q)) box = { left: q.left, top: q.top, right: q.right, bottom: q.bottom };
      at.set(x, [enter, box]);
      if (/hidden|clip/.test(s.overflowX)) box = { ...box, left: Math.max(box.left, q.left), right: Math.min(box.right, q.right) };
      if (/hidden|clip/.test(s.overflowY)) box = { ...box, top: Math.max(box.top, q.top), bottom: Math.min(box.bottom, q.bottom) };
    }
    return box.right - box.left < 2 || box.bottom - box.top < 2 || box.right + scrollX <= 0 || box.bottom + scrollY <= 0 ? null : at;
  };
  const meets = (a, b) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
  const name = (e) => e.localName + (e.id ? '#' + e.id : [...e.classList].slice(0, 2).map((c) => '.' + c).join(''));
  const where = (e) => { const p = []; for (let x = e; x && x !== document.body && p.length < 3; x = x.parentElement) { p.unshift(name(x)); if (x.id) break; } return p.join(' > '); };
  const skip = 'script, style, noscript, template, select, option, datalist, textarea, svg, :disabled, [aria-disabled="true"]';
  // what may sit behind a text: drawn media, and boxes with an image background
  const media = [...document.querySelectorAll('body *')]
    .filter((m) => (m.matches('canvas, img, video, iframe, object, embed, svg') ? !m.parentElement.closest('svg') : !fill(css(m))) && shown(m))
    .map((m) => [m, m.getBoundingClientRect()]);
  const fails = new Map();
  let unsure = 0, checked = 0;
  const test = (e, text, color, s, rects, at, own) => {
    const fg = parse(color);
    if (!rects.length || !fg[3]) return;
    const shows = placed(e, { left: Math.min(...rects.map((q) => q.left)), top: Math.min(...rects.map((q) => q.top)), right: Math.max(...rects.map((q) => q.right)), bottom: Math.max(...rects.map((q) => q.bottom)) });
    if (!shows) return;
    const c = seen(e, fg, own, shows);
    // media behind it: compared where both sit in the box they share (a shelf scrolls its covers and titles together)
    const near = (m) => { let x = e; while (!x.contains(m)) x = x.parentElement; return shows.get(x)[0]; };
    if (!c || media.some(([m, q]) => m !== e && c.top.contains(m) && !m.contains(e) && meets(near(m), q))) return unsure++;
    checked++;
    const size = parseFloat(s.fontSize), need = size >= 24 || (size >= 18.66 && s.fontWeight >= 700) ? 3 : 4.5;
    const k = ratio(c.t, c.b), key = at + hex(c.t) + hex(c.b);
    if (k >= need) return;
    if (fails.has(key)) fails.get(key).n++;
    else fails.set(key, { at, text: text.trim().replace(/\s+/g, ' ').slice(0, 40), fg: hex(c.t), bg: hex(c.b), ratio: Math.floor(k * 100) / 100, need, n: 1 });
  };
  const own = new Map();
  const walk = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
  for (let n; (n = walk.nextNode()); ) if (n.data.trim() && !n.parentElement.closest(skip)) (own.get(n.parentElement) || own.set(n.parentElement, []).get(n.parentElement)).push(n);
  const range = document.createRange();
  for (const [e, nodes] of own) {
    if (!shown(e)) continue;
    const rects = nodes.flatMap((n) => (range.selectNodeContents(n), [...range.getClientRects()])).filter((r) => r.width && r.height);
    test(e, nodes.map((n) => n.data).join(' '), css(e).webkitTextFillColor, css(e), rects, where(e));
  }
  for (const e of document.querySelectorAll('body *')) {
    if (e.closest(skip) || !shown(e)) continue;
    for (const p of ['::before', '::after']) {
      const s = getComputedStyle(e, p), text = /^"(.*?)"/.exec(s.content)?.[1];
      if (text?.trim() && s.display !== 'none' && s.visibility === 'visible') test(e, text, s.webkitTextFillColor, s, [e.getBoundingClientRect()], where(e) + p, s);
    }
  }
  for (const f of document.querySelectorAll('input, textarea, select')) {
    if (!shown(f) || f.closest(':disabled') || /^(hidden|checkbox|radio|range|color|file|image)$/.test(f.type)) continue;
    const value = f.localName === 'select' ? f.selectedOptions[0]?.text : f.value, s = value ? css(f) : getComputedStyle(f, '::placeholder');
    if (value || f.placeholder) test(f, value || f.placeholder, value ? s.webkitTextFillColor : s.color, s, [f.getBoundingClientRect()], where(f) + (value ? '' : '::placeholder'));
  }
  return { fails: [...fails.values()], unsure, checked };
}
let bad = 0;
let lowPages = 0, lowTexts = 0, unsure = 0, checked = 0;
for (const path of todo) {
  errors = [];
  const load = new Promise((r) => { loaded = r; setTimeout(r, 15000); });
  await send('Page.navigate', { url: base + path });
  await load;
  await sleep(wait);
  const overflow = (await send('Runtime.evaluate', { expression: PROBE, returnByValue: true })).result?.result?.value;
  const access = a11y ? (await send('Runtime.evaluate', { expression: A11Y, returnByValue: true })).result?.result?.value : '';
  const low = a11y ? (await send('Runtime.evaluate', { expression: `(${contrast})()`, returnByValue: true })).result : null;
  if (low?.exceptionDetails) errors.push(`contrast check: ${low.exceptionDetails.exception?.description}`);
  const fails = low?.result?.value?.fails ?? [];
  unsure += low?.result?.value?.unsure ?? 0;
  checked += low?.result?.value?.checked ?? 0;
  if (fails.length) { lowPages++; lowTexts += fails.length; }
  const problems = [access, fails.length && `${fails.length} low-contrast text`].filter(Boolean).join('; ');
  await sleep(100);
  if (errors.length || overflow || problems) {
    bad++;
    console.log(`${path}  ${overflow ? `sideways scroll ${overflow}  ` : ''}${problems ? `a11y: ${problems}  ` : ''}${errors.map((e) => String(e).split('\n')[0]).join(' | ')}`);
    for (const f of fails) console.log(`    ${f.ratio}:1 < ${f.need}  ${f.at}  "${f.text}"  ${f.fg} on ${f.bg}${f.n > 1 ? `  (${f.n}x)` : ''}`);
  }
}
console.log(`${todo.length} pages, ${bad} with problems (${scheme || 'default scheme'}, ${size || '1440x900'})`);
if (a11y) console.log(`contrast: ${checked} texts checked, ${lowTexts} low on ${lowPages} pages, ${unsure} unverifiable (canvas, image, svg or gradient behind)`);
done(bad ? 1 : 0);
