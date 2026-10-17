// CustomEvents between scripts, dispatched on document (docs/data-contract.md).

export interface CtdEvents {
  'ctd:lens': { lens: string };
  'ctd:time': { t: number | null };
  'ctd:focus': { id: string | null };
}

export function emit<K extends keyof CtdEvents>(type: K, detail: CtdEvents[K]): void {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

/**
 * Ask the page to show an entry in place (site search on the explorer and world pages). The event is
 * cancelable: a listener that shows the id calls preventDefault(). False means nobody did (a chapter,
 * or an entry this page cannot show), so the caller should go to the entry's page instead.
 */
export function requestFocus(id: string): boolean {
  return !document.dispatchEvent(new CustomEvent('ctd:focus', { detail: { id }, cancelable: true }));
}

/** Dispatch ctd:lens and remember it, so islands that load later start with the same lens. */
export function dispatchLens(lens: string): void {
  document.documentElement.dataset.ctdLens = lens;
  emit('ctd:lens', { lens });
}

export function currentLens(): string | undefined {
  return document.documentElement.dataset.ctdLens;
}
