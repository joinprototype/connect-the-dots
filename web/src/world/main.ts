// world.js: the open-world map on /w/ (<div id="world-root" data-src="/world/">).
// Query: ?view=earth (the Earth instead of the map of links), ?focus=<entity id>, ?src=/world-synth/
// (same-origin world), ?soak=1&soakSec=300, ?stats=0|1, ?labels=0.
import './world.css';
import { mountWorld, resolveWorldSrc } from './viewer';

const root = document.getElementById('world-root');
if (root) {
  const q = new URLSearchParams(location.search);
  const soakSec = Number(q.get('soakSec'));
  const ready = mountWorld(root, {
    src: resolveWorldSrc(q.get('src') ?? root.dataset.src, resolveWorldSrc(root.dataset.src)),
    soak: q.get('soak') === '1' ? { seconds: Number.isFinite(soakSec) && soakSec > 0 ? soakSec : 300 } : null,
    stats: q.has('stats') ? q.get('stats') !== '0' : null,
    labels: q.get('labels') !== '0',
    radiusFactor: Number(q.get('rs')) > 0 ? Number(q.get('rs')) : 1,
    focus: q.get('focus'),
    view: q.get('view') === 'earth' ? 'earth' : 'links',
  });
  // For tests and soak runs (headless Chrome reads it over CDP). A failed world shows its own message.
  void ready.then(
    (world) => ((window as Window & { __ctdWorld?: unknown }).__ctdWorld = world),
    () => undefined,
  );
} else {
  console.warn('connect-the-dot world: #world-root not found');
}
