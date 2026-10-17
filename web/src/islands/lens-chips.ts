import { loadGraph } from '../lib/data';
import { dispatchLens, currentLens } from '../lib/events';
import { currentUrl, replaceUrl } from '../lib/history';

const parseLayers = (s: string | null | undefined): string[] => (s ?? '').split(/[\s,]+/).filter(Boolean);

/**
 * <ctd-lens-chips focus="<id>">: one chip per lens. Clicking a chip dispatches `ctd:lens` {lens}
 * on document and hides li.claim items whose data-layers miss the lens's layers ("all" shows all).
 * Uses server-rendered button[data-lens] chips when present; otherwise builds them from graph.json.
 */
export class CtdLensChips extends HTMLElement {
  private layersOf = new Map<string, string[] | null>();
  private ready = false;
  private onLens = (e: Event) => this.apply((e as CustomEvent<{ lens: string }>).detail?.lens ?? 'all');

  async connectedCallback(): Promise<void> {
    document.addEventListener('ctd:lens', this.onLens);
    if (this.ready) return;
    this.ready = true;
    this.classList.add('ctd-lens-chips');

    let chips = [...this.querySelectorAll<HTMLButtonElement>('button[data-lens]')];
    const needGraph = !chips.length || chips.some((b) => !b.hasAttribute('data-layers') && b.dataset.lens !== 'all');
    let graphLenses: { id: string; label: string; layers: string[] }[] = [];
    if (needGraph) {
      try {
        graphLenses = (await loadGraph()).lenses;
      } catch {
        graphLenses = [];
      }
    }
    if (!chips.length) {
      const wrap = document.createElement('div');
      wrap.className = 'lens-chips ctd-chips-fallback';
      wrap.setAttribute('role', 'group');
      wrap.setAttribute('aria-label', 'Lens');
      this.append(wrap);
      chips = graphLenses.map((l) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.lens = l.id;
        b.dataset.layers = l.layers.join(' ');
        b.textContent = l.label;
        wrap.append(b);
        return b;
      });
    }
    const claims = [...document.querySelectorAll<HTMLElement>('li.claim[data-layers]')];
    for (const b of chips) {
      const id = b.dataset.lens!;
      const fromGraph = graphLenses.find((l) => l.id === id)?.layers;
      const layers = id === 'all' ? null : b.hasAttribute('data-layers') ? parseLayers(b.dataset.layers) : (fromGraph ?? null);
      this.layersOf.set(id, layers);
      b.classList.add('ctd-chip');
      b.type = 'button';
      if (layers?.length) b.style.setProperty('--chip', `var(--layer-${layers[0]})`);
      const count = layers ? claims.filter((li) => parseLayers(li.dataset.layers).some((l) => layers.includes(l))).length : claims.length;
      if (claims.length && !b.querySelector('.ctd-chip-count')) {
        const c = document.createElement('span');
        c.className = 'ctd-chip-count';
        c.textContent = String(count);
        b.append(c);
      }
      if (claims.length && count === 0) b.dataset.empty = '';
      b.addEventListener('click', () => {
        this.apply(id);
        dispatchLens(id);
      });
    }
    const fromUrl = new URLSearchParams(location.search).get('lens');
    const initial = fromUrl && this.layersOf.has(fromUrl) ? fromUrl : currentLens() ?? 'all';
    this.apply(initial);
    if (initial !== 'all') dispatchLens(initial);
  }

  disconnectedCallback(): void {
    document.removeEventListener('ctd:lens', this.onLens);
  }

  private apply(lens: string): void {
    if (!this.layersOf.has(lens)) lens = 'all';
    for (const b of this.querySelectorAll<HTMLButtonElement>('button[data-lens]')) {
      b.setAttribute('aria-pressed', String(b.dataset.lens === lens));
    }
    const layers = this.layersOf.get(lens) ?? null;
    for (const li of document.querySelectorAll<HTMLElement>('li.claim[data-layers]')) {
      li.hidden = !!layers && !parseLayers(li.dataset.layers).some((l) => layers.includes(l));
    }
    // Hide groups whose claims are all filtered out.
    for (const group of document.querySelectorAll<HTMLElement>('.claim-group')) {
      const items = group.querySelectorAll('li.claim');
      if (items.length) group.hidden = [...items].every((li) => (li as HTMLElement).hidden);
    }
    const url = currentUrl();
    if (lens === 'all') url.searchParams.delete('lens');
    else url.searchParams.set('lens', lens);
    replaceUrl(url);
  }
}
