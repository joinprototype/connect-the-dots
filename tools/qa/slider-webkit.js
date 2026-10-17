// Safari stress: emulate WebKit's limit (history.replaceState throws after 100 calls in 10 s),
// then drag every range input fast. The explorer must survive and write the URL rarely.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const calls = [];
const native = history.replaceState.bind(history);
history.replaceState = function (...args) {
  const now = performance.now();
  calls.push(now);
  if (calls.filter((t) => now - t < 10000).length > 100) {
    throw new DOMException('Attempt to use history.replaceState() more than 100 times per 10 seconds', 'SecurityError');
  }
  return native(...args);
};
const set = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const ranges = [...document.querySelectorAll('input[type=range]')];
let steps = 0;
for (const r of ranges) {
  const min = Number(r.min || 0), max = Number(r.max || 100);
  for (let k = 0; k < 6; k++) {
    for (let i = 0; i <= 60; i++) { set(r, min + ((max - min) * i) / 60); steps++; await sleep(4); }
    for (let i = 60; i >= 0; i -= 2) { set(r, min + ((max - min) * i) / 60); steps++; await sleep(2); }
  }
}
await sleep(1200);
const root = document.getElementById('explorer-root');
return { ranges: ranges.length, steps, replaceStateCalls: calls.length, rootChildren: root?.children.length ?? null, blank: !root || root.innerText.trim().length < 20 };
