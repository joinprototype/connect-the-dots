// forward.js: the addresses of Explore (/x/) and Connect (/r/), folded into other pages (ADR-0031), go on
// to where the entries they name are now. Only ids are carried over, never words.
const p = new URLSearchParams(location.search);
const enc = encodeURIComponent;
const atlas = (id: string) => /^Q\d+$/.test(id);

function where(): string {
  if (location.pathname.startsWith('/r/')) {
    const [a, b] = [p.get('a'), p.get('b')];
    if (a && b) return `/ask/?a=${enc(a)}&b=${enc(b)}`;
    if (a) return atlas(a) ? `/a/?q=${enc(a)}` : `/ask/?a=${enc(a)}`;
    return '/ask/';
  }
  // /x/: from and to are a pair; focus (or from alone) is one thing, on its own page
  const [from, to, focus] = [p.get('from'), p.get('to'), p.get('focus')];
  if (from && to) return `/ask/?a=${enc(from)}&b=${enc(to)}`;
  const one = focus ?? from;
  if (one) return atlas(one) ? `/a/?q=${enc(one)}` : `/e/${enc(one)}/`;
  return '/c/';
}

location.replace(where());
