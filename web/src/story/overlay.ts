// Overlay cards: proof cards with a highlighter over the quote, pull quotes, images.
import { gsap } from 'gsap';
import { edgesForRef, sourceView } from '../lib/claims';
import { nameOf, type GraphIndex } from '../lib/data';
import { el } from '../lib/dom';
import { tierLabel } from '../lib/plain';
import type { Shot } from '../lib/types';

/** The quote to show: the overlay's own, else one from a source of a claim this shot reveals. */
function findQuote(idx: GraphIndex, shot: Shot, sourceId?: string): string | null {
  if (shot.overlay?.quote) return shot.overlay.quote;
  for (const ref of shot.reveal_claims ?? []) {
    for (const e of edgesForRef(idx, ref)) {
      const s = e.sources.find((x) => (!sourceId || x.id === sourceId) && x.quote);
      if (s?.quote) return s.quote;
    }
  }
  return null;
}

export class Overlay {
  private current: HTMLElement | null = null;
  private key = '';

  constructor(
    private layer: HTMLElement,
    private idx: GraphIndex,
  ) {}

  show(shot: Shot, reduced: boolean): void {
    const o = shot.overlay;
    const key = o ? JSON.stringify([shot.shot, o]) : '';
    if (key === this.key) return;
    this.key = key;
    this.hide(reduced);
    if (!o) return;
    const card = this.build(shot);
    if (!card) return;
    this.layer.append(card);
    this.current = card;
    const mark = card.querySelector<HTMLElement>('.story-hl');
    if (reduced) {
      gsap.set(card, { autoAlpha: 1 });
      if (mark) mark.style.backgroundSize = '100% 100%';
      return;
    }
    gsap.fromTo(card, { autoAlpha: 0, y: 16 }, { autoAlpha: 1, y: 0, duration: 0.5, ease: 'power2.out' });
    if (mark) gsap.fromTo(mark, { backgroundSize: '0% 100%' }, { backgroundSize: '100% 100%', duration: 1.3, delay: 0.7, ease: 'power2.inOut' });
  }

  hide(reduced: boolean): void {
    const old = this.current;
    this.current = null;
    if (!old) return;
    if (reduced) old.remove();
    else gsap.to(old, { autoAlpha: 0, y: -8, duration: 0.3, ease: 'power2.in', onComplete: () => old.remove() });
  }

  private build(shot: Shot): HTMLElement | null {
    const o = shot.overlay!;
    const idx = this.idx;
    const persp = shot.perspective ? nameOf(idx, shot.perspective) : '';
    if (o.kind === 'image' && o.image) {
      const fig = el('figure', 'story-card is-image');
      const img = el('img');
      img.src = o.image;
      img.alt = o.caption ?? '';
      img.loading = 'lazy';
      fig.append(img);
      if (o.caption) fig.append(el('figcaption', 'story-card-caption', o.caption));
      return fig;
    }
    const quote = findQuote(idx, shot, o.source);
    if (o.kind === 'source' && o.source) {
      const s = sourceView(idx, o.source);
      const fig = el('figure', 'story-card is-source');
      const kicker = el('p', 'story-card-kicker');
      kicker.append(el('span', 'story-card-kind', 'Proof'));
      const strength = tierLabel(this.idx.data, s.tier);
      if (strength) kicker.append(el('span', 'story-tier', strength));
      fig.append(kicker);
      fig.append(el('p', 'story-card-title', s.title));
      const meta = [s.publisher, s.published].filter(Boolean).join(' · ');
      if (meta) fig.append(el('p', 'story-card-meta', meta));
      if (quote) {
        const bq = el('blockquote', 'story-card-quote');
        const p = el('p');
        p.append('“', el('mark', 'story-hl', quote), '”');
        bq.append(p);
        fig.append(bq);
      }
      const foot = el('div', 'story-card-foot');
      if (persp) foot.append(el('span', 'story-persp-badge', `${persp}'s account`));
      if (s.url) {
        const a = el('a', 'story-card-link', 'Read the source');
        a.href = s.url;
        a.target = '_blank';
        a.rel = 'external noopener noreferrer';
        foot.append(a);
      }
      if (foot.childNodes.length) fig.append(foot);
      if (o.caption) fig.append(el('figcaption', 'story-card-caption', o.caption));
      return fig;
    }
    if (quote) {
      const fig = el('figure', 'story-card is-quote');
      const bq = el('blockquote', 'story-card-quote');
      const p = el('p');
      p.append(el('mark', 'story-hl', quote));
      bq.append(p);
      fig.append(bq);
      if (o.caption) fig.append(el('figcaption', 'story-card-caption', o.caption));
      if (persp) fig.append(el('span', 'story-persp-badge', `${persp}'s account`));
      return fig;
    }
    return null;
  }
}
