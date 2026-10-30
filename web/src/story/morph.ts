// The map and the graph show the same world: when the story moves between them, each dot flies from one
// view to the other. An entry flies to itself, or to whatever sits at its place, so a pin on the map
// fans out into the entries based there and they gather back into it. A dot aims at where its target
// is now, so it lands true while the camera moves.
import { el } from '../lib/dom';

export interface Point {
  x: number;
  y: number;
}

/** A view that can say where its entries are, in the stage's pixels (both views fill the stage). */
export interface Placed {
  shown(): string[];
  where(id: string): Point | null;
}

export type Spots = Map<string, Point>;

export interface Flight {
  stop(): void;
}

const SECONDS = 1.1;
/** The last part of the flight: the dot fades into the one it lands on. */
const FADE_FROM = 0.85;

/** Where a view's entries are right now. */
export function spots(view: Placed): Spots {
  const out: Spots = new Map();
  for (const id of view.shown()) {
    const p = view.where(id);
    if (p) out.set(id, p);
  }
  return out;
}

/**
 * Flies what `from` has in common with `to`: the same entry, or one at the same place (`place` names an
 * entry's spot). With nothing in common, nothing flies and the views just crossfade.
 */
export function fly(layer: HTMLElement, from: Spots, to: Placed, place: (id: string) => string | undefined, focus?: string): Flight | undefined {
  const sources = [...from];
  const dots = to.shown().flatMap((id) => {
    const spot = place(id);
    return sources
      .filter(([other]) => other === id || (spot !== undefined && place(other) === spot))
      .map(([, start]) => {
        const dot = el('span', id === focus ? 'story-morph-dot is-focus' : 'story-morph-dot');
        layer.append(dot);
        return { id, start, dot, last: start };
      });
  });
  if (!dots.length) return undefined;
  const begin = performance.now();
  let frame = 0;
  const stop = () => {
    cancelAnimationFrame(frame);
    for (const d of dots) d.dot.remove();
  };
  // by the clock, not by a tween: a busy map must not hold a dot on screen
  const tick = (now: number) => {
    const t = Math.min(1, Math.max(0, now - begin) / (SECONDS * 1000));
    const p = t < 0.5 ? 2 * t * t : 1 - (2 - 2 * t) ** 2 / 2;
    for (const d of dots) {
      d.last = to.where(d.id) ?? d.last;
      const x = d.start.x + (d.last.x - d.start.x) * p;
      const y = d.start.y + (d.last.y - d.start.y) * p;
      d.dot.style.transform = `translate(${x}px, ${y}px)`;
      d.dot.style.opacity = String(Math.min(1, (1 - p) / (1 - FADE_FROM)));
    }
    if (t < 1) frame = requestAnimationFrame(tick);
    else stop();
  };
  tick(begin);
  return { stop };
}
