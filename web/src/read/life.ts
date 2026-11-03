// life.js: one page for every entry's generated story (ADR-0026). The host rewrites /e/<id>/story/ here,
// and this puts the story from its pack into the page, then starts Read's reader on it (ADR-0031).
import { loadJson, packOf } from '../lib/data';

interface Life {
  title: string;
  main: string;
}

const id = decodeURIComponent(location.pathname.split('/')[2] ?? '');
const main = document.getElementById('main');

function missing(page: HTMLElement) {
  const p = document.createElement('p');
  const a = document.createElement('a');
  a.href = `/e/${encodeURIComponent(id)}/`;
  a.textContent = 'its page';
  p.append('This entry has no story yet. See ', a, '.');
  page.replaceChildren(p);
}

if (main) {
  loadJson<Record<string, Life>>(`/data/life/${packOf(id)}.json`).then(
    (pack) => {
      const life = pack[id];
      if (!life) return missing(main);
      document.title = life.title;
      main.innerHTML = life.main;
      void import('../read/reader');
    },
    () => missing(main),
  );
}
