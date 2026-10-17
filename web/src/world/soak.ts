// Soak mode (?soak=1[&soakSec=300]): an automatic camera loops zooming in and out while panning
// across the world. Every 5 s it logs one "[soak] {...}" line; at the end window.__soakResult holds
// min/max/avg of each metric and the heap growth from the first to the last minute.

export interface SoakMetrics {
  heap: number | null;
  tiles: number;
  tilesVisible: number;
  cacheMB: number;
  nodesDrawn: number;
  edgesDrawn: number;
}

export interface SoakSample extends SoakMetrics {
  t: number;
  fps: number;
}

export interface SoakOptions {
  seconds: number;
  /** Zoom that fits the world, and the deepest zoom to visit. */
  fitZoom: number;
  deepZoom: number;
  /** Centre of the path and its half-width, in common units. */
  center: [number, number];
  span: number;
  setView(target: [number, number], zoom: number): void;
  metrics(): SoakMetrics;
  onDone?(result: SoakResult): void;
}

interface Summary {
  min: number;
  max: number;
  avg: number;
}

export interface SoakResult {
  seconds: number;
  samples: SoakSample[];
  fps: Summary;
  heapMB: Summary | null;
  tiles: Summary;
  cacheMB: Summary;
  nodesDrawn: Summary;
  edgesDrawn: Summary;
  /** Average heap over the first and the last minute, and the growth between them. */
  heapGrowth: { firstMinuteMB: number; lastMinuteMB: number; deltaMB: number; pct: number } | null;
  /** (max - min) / avg of the heap after the first minute (warm-up). */
  heapVariationAfterWarmup: number | null;
  /** Average heap per minute: shows the plateau once the tile cache is full. */
  heapByMinuteMB: number[];
}

const summary = (values: number[]): Summary => ({
  min: values.length ? Math.min(...values) : 0,
  max: values.length ? Math.max(...values) : 0,
  avg: values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0,
});

const round = (v: number, d = 2) => Math.round(v * 10 ** d) / 10 ** d;
const roundSummary = (s: Summary, d = 2): Summary => ({ min: round(s.min, d), max: round(s.max, d), avg: round(s.avg, d) });

export function runSoak(opts: SoakOptions): { stop(): void } {
  const t0 = performance.now();
  const samples: SoakSample[] = [];
  let frames = 0;
  let lastSampleAt = t0;
  let raf = 0;
  let stopped = false;
  const ZOOM_PERIOD = 48;
  const TAU = Math.PI * 2;

  const sample = (now: number) => {
    const dt = (now - lastSampleAt) / 1000;
    const m = opts.metrics();
    const s: SoakSample = {
      t: round((now - t0) / 1000, 1),
      fps: round(dt > 0 ? frames / dt : 0, 1),
      ...m,
      heap: m.heap == null ? null : round(m.heap / (1024 * 1024), 2),
      cacheMB: round(m.cacheMB, 2),
    };
    samples.push(s);
    console.log(`[soak] ${JSON.stringify(s)}`);
    frames = 0;
    lastSampleAt = now;
  };

  const finish = () => {
    stopped = true;
    cancelAnimationFrame(raf);
    const heaps = samples.map((s) => s.heap).filter((h): h is number => h != null);
    const T = samples.length ? samples[samples.length - 1].t : 0;
    const first = samples.filter((s) => s.t <= 60 && s.heap != null).map((s) => s.heap!);
    const last = samples.filter((s) => s.t >= T - 60 && s.heap != null).map((s) => s.heap!);
    const warm = samples.filter((s) => s.t > 60 && s.heap != null).map((s) => s.heap!);
    const avg = (a: number[]) => a.reduce((x, y) => x + y, 0) / Math.max(1, a.length);
    const result: SoakResult = {
      seconds: opts.seconds,
      samples,
      fps: roundSummary(summary(samples.map((s) => s.fps)), 1),
      heapMB: heaps.length ? roundSummary(summary(heaps)) : null,
      tiles: roundSummary(summary(samples.map((s) => s.tiles)), 1),
      cacheMB: roundSummary(summary(samples.map((s) => s.cacheMB))),
      nodesDrawn: roundSummary(summary(samples.map((s) => s.nodesDrawn)), 0),
      edgesDrawn: roundSummary(summary(samples.map((s) => s.edgesDrawn)), 0),
      heapGrowth:
        first.length && last.length
          ? {
              firstMinuteMB: round(avg(first)),
              lastMinuteMB: round(avg(last)),
              deltaMB: round(avg(last) - avg(first)),
              pct: round(((avg(last) - avg(first)) / avg(first)) * 100, 1),
            }
          : null,
      heapVariationAfterWarmup: warm.length > 1 ? round((Math.max(...warm) - Math.min(...warm)) / avg(warm), 3) : null,
      heapByMinuteMB: Array.from({ length: Math.ceil(T / 60) }, (_, m) =>
        round(avg(samples.filter((s) => s.t > m * 60 && s.t <= (m + 1) * 60 && s.heap != null).map((s) => s.heap!))),
      ),
    };
    (window as Window & { __soakResult?: SoakResult }).__soakResult = result;
    console.log(`[soak] done ${JSON.stringify({ ...result, samples: samples.length })}`);
    opts.onDone?.(result);
  };

  const step = (now: number) => {
    if (stopped) return;
    frames++;
    const t = (now - t0) / 1000;
    const zoom = opts.fitZoom + (opts.deepZoom - opts.fitZoom) * (0.5 - 0.5 * Math.cos((TAU * t) / ZOOM_PERIOD));
    const target: [number, number] = [
      opts.center[0] + opts.span * Math.sin((TAU * t) / 97),
      opts.center[1] + opts.span * Math.sin((TAU * t) / 71 + 0.9),
    ];
    opts.setView(target, zoom);
    if (now - lastSampleAt >= 5000) sample(now);
    if (t >= opts.seconds) {
      sample(now);
      finish();
      return;
    }
    raf = requestAnimationFrame(step);
  };
  console.log(`[soak] start ${JSON.stringify({ seconds: opts.seconds, fitZoom: round(opts.fitZoom), deepZoom: round(opts.deepZoom) })}`);
  raf = requestAnimationFrame(step);
  return {
    stop() {
      if (!stopped) finish();
    },
  };
}
