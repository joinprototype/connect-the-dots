// Frame-rate meter and the numbers shown in the stats overlay (toggle with "s").

/** Frames per second over a sliding one-second window, from requestAnimationFrame. */
export class FpsMeter {
  private times: number[] = [];
  private raf = 0;
  private running = false;
  /** Deck redraws counted by onAfterRender over the same window. */
  private draws: number[] = [];

  start(): void {
    if (this.running) return;
    this.running = true;
    const tick = (now: number) => {
      if (!this.running) return;
      this.times.push(now);
      this.trim(now);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop(): void {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  draw(): void {
    this.draws.push(performance.now());
  }

  private trim(now: number): void {
    while (this.times.length && now - this.times[0] > 1000) this.times.shift();
    while (this.draws.length && now - this.draws[0] > 1000) this.draws.shift();
  }

  /** Browser frames in the last second. */
  get fps(): number {
    this.trim(performance.now());
    return this.times.length;
  }

  /** deck.gl redraws in the last second (0 while nothing moves). */
  get drawsPerSecond(): number {
    this.trim(performance.now());
    return this.draws.length;
  }
}

/** Running average and maximum, e.g. of tile parse times. */
export class Meter {
  count = 0;
  total = 0;
  max = 0;
  add(v: number): void {
    this.count++;
    this.total += v;
    if (v > this.max) this.max = v;
  }
  get avg(): number {
    return this.count ? this.total / this.count : 0;
  }
}

export interface TileCounts {
  cached: number;
  loaded: number;
  visible: number;
  loading: number;
  cacheBytes: number;
  nodes: number;
  edges: number;
  labels: number;
  zoomLevel: number;
}

/** performance.memory is Chrome-only (and coarse unless --enable-precise-memory-info). */
export function heapBytes(): number | null {
  const mem = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
  return mem && Number.isFinite(mem.usedJSHeapSize) ? mem.usedJSHeapSize : null;
}

export const MB = 1024 * 1024;

export const fmtInt = (n: number): string => Math.round(n).toLocaleString('en-US');
export const fmtMB = (b: number | null): string => (b == null ? 'n/a' : `${(b / MB).toFixed(1)} MB`);
