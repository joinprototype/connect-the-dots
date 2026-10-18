// Lazy chunk for the explorer's world mode (/x/?view=world). Styles come from the world bundle's own
// world.css (ensureWorldCss), so the /w/ entry keeps a single stylesheet named world.css.
import { loadStylesheet } from '../lib/dom';
export { mountWorld, resolveWorldSrc } from './viewer';
export type { WorldHandle, WorldOptions } from './viewer';

/** Load world.css once: the built file in production, the source module in dev. */
export async function ensureWorldCss(): Promise<void> {
  if (import.meta.env.DEV) {
    await import('./world.css');
    return;
  }
  const href = `${import.meta.env.BASE_URL}world.css`;
  if (document.querySelector(`link[rel="stylesheet"][href="${href}"]`)) return;
  await loadStylesheet(href);
}
