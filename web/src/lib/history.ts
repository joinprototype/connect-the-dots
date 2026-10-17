// URL updates that can never break the page.
//
// WebKit (Safari) throws a SecurityError after 100 history.pushState/replaceState calls within 10
// seconds; Chrome only throttles silently. Scrubbing the explorer's time slider wrote the URL on every
// input event, so Safari threw inside a React effect and the whole explorer unmounted. All URL syncing
// goes through replaceUrl(): coalesced to at most one write per 300 ms (trailing), and guarded.

const MIN_INTERVAL_MS = 300;

let pending: string | null = null;
let timer = 0;
let last = 0;

/** The URL as it will be once pending writes land: build updates from this, not location.href. */
export function currentUrl(): URL {
  return new URL(pending ?? location.href);
}

/** Replace the current URL (relative URLs resolve against currentUrl()). Coalesced and never throws. */
export function replaceUrl(url: string | URL): void {
  pending = new URL(String(url), pending ?? location.href).href;
  if (timer) return;
  timer = window.setTimeout(flushUrl, Math.max(0, last + MIN_INTERVAL_MS - Date.now()));
}

/** Write a pending URL now (e.g. before navigating away). */
export function flushUrl(): void {
  if (timer) clearTimeout(timer);
  timer = 0;
  const url = pending;
  pending = null;
  if (url == null) return;
  last = Date.now();
  try {
    if (url !== location.href) history.replaceState(history.state, '', url);
  } catch (err) {
    // Rate-limited or blocked: the URL is a convenience, never worth breaking the page for.
    console.warn('connect-the-dot: could not update the URL', err);
  }
}
