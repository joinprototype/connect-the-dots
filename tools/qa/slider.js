// Drag every range input on the page back and forth quickly, press play, and report.
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const set = (el, v) => {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
};
const ranges = [...document.querySelectorAll('input[type=range]')];
const report = { ranges: ranges.length, steps: 0 };
for (const r of ranges) {
  const min = Number(r.min || 0), max = Number(r.max || 100);
  for (let k = 0; k < 3; k++) {
    for (let i = 0; i <= 40; i++) { set(r, min + ((max - min) * i) / 40); report.steps++; await sleep(15); }
    for (let i = 40; i >= 0; i -= 3) { set(r, min + ((max - min) * i) / 40); report.steps++; await sleep(5); }
  }
}
const play = [...document.querySelectorAll('button')].find((b) => /play/i.test(b.getAttribute('aria-label') || b.textContent || ''));
if (play) { play.click(); await sleep(3000); play.click(); report.played = true; }
report.rootChildren = document.getElementById('explorer-root')?.children.length ?? null;
return report;
