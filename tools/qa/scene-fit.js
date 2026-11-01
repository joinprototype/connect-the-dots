// Action for cdp.mjs: plays a story's scenes and reports how many of each graph scene's entries stay on
// screen, clear of the quote card and the pills. A sweep cannot see this: the graph is drawn on a canvas.
//   node tools/qa/cdp.mjs <story url> tools/qa/scene-fit.js --size=390x844 --wait=2500
// A line with "FOCUS OUT", or fewer entries seen than named, is a scene the reader cannot read.
const shots = JSON.parse(document.querySelector('script.ctd-shots').textContent);
const g = document.querySelector('.story-graph');
const stageEl = document.querySelector('.story-stage');
const dots = [...document.querySelectorAll('.story-dots button')];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const out = [];
for (let i = 0; i < shots.length; i++) {
  dots[i].click();
  await sleep(2600);
  if (stageEl.dataset.view !== 'graph') continue;
  const r = g.__renderer;
  const stage = g.getBoundingClientRect();
  const hud = document.querySelector('.story-hud').getBoundingClientRect();
  const card = [...document.querySelectorAll('.story-overlay .story-card')].pop()?.getBoundingClientRect();
  const controls = document.querySelector('.story-controls').getBoundingClientRect();
  const top = Math.max(stage.top, innerWidth < 861 ? hud.bottom : stage.top);
  const bottom = Math.min(stage.bottom, innerWidth < 861 ? (card?.top ?? controls.top) : stage.bottom);
  const ids = [...new Set([shots[i].focus, ...(shots[i].reveal ?? [])].filter(Boolean))];
  const seen = ids.filter((id) => {
    const d = r.getNodeDisplayData(id);
    if (!d || d.hidden) return false;
    const p = r.framedGraphToViewport(d);
    const x = p.x + stage.left, y = p.y + stage.top;
    return x >= stage.left && x <= stage.right && y >= top && y <= bottom;
  });
  out.push(`${shots[i].shot}: ${seen.length}/${ids.length}${!shots[i].focus || seen.includes(shots[i].focus) ? '' : ' FOCUS OUT'} ratio ${r.getCamera().getState().ratio.toFixed(2)} room ${Math.round(bottom - top)}`);
}
return out;
