// Move the explorer's first range input step by step, timing each move, to find hangs.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const set = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const r = document.querySelector('input[type=range]');
if (!r) return { error: 'no range input' };
const min = Number(r.min || 0), max = Number(r.max || 100);
const out = { min, max, steps: [] };
for (const f of [1, 0.9, 0.7, 0.5, 0.3, 0.1, 0]) {
  const t0 = performance.now();
  set(r, min + (max - min) * f);
  await sleep(50);
  out.steps.push({ f, ms: Math.round(performance.now() - t0), label: document.querySelector('[class*=time] , [class*=Time]')?.textContent?.slice(0, 40) });
}
return out;
