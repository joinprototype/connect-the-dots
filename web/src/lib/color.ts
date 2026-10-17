// Color helpers. WebGL renderers need concrete colors, so CSS tokens are resolved at runtime.

export type RGB = [number, number, number];

export function parseHex(hex: string): RGB | null {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})([0-9a-f]{2})?$/i.exec(hex.trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function toHex([r, g, b]: RGB): string {
  const c = (v: number) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0');
  return `#${c(r)}${c(g)}${c(b)}`;
}

let probe: CanvasRenderingContext2D | null | undefined;

/** Any CSS color (hex, rgb(), oklch(), named…) -> RGB, by painting one pixel. */
export function cssColorToRgb(value: string, fallback: RGB = [128, 128, 128]): RGB {
  const hex = parseHex(value);
  if (hex) return hex;
  if (probe === undefined) {
    const c = document.createElement('canvas');
    c.width = c.height = 1;
    probe = c.getContext('2d', { willReadFrequently: true });
  }
  if (!probe || !value) return fallback;
  probe.clearRect(0, 0, 1, 1);
  probe.fillStyle = '#000';
  probe.fillStyle = value;
  probe.fillRect(0, 0, 1, 1);
  const d = probe.getImageData(0, 0, 1, 1).data;
  return d[3] === 0 ? fallback : [d[0], d[1], d[2]];
}

/** Read a CSS custom property (e.g. "--ink") as a concrete color. */
export function tokenRgb(name: string, fallback: RGB, el: Element = document.documentElement): RGB {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  return v ? cssColorToRgb(v, fallback) : fallback;
}

export function tokenString(name: string, fallback: string, el: Element = document.documentElement): string {
  return getComputedStyle(el).getPropertyValue(name).trim() || fallback;
}

export function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
}

export function rgbOf(color: string): RGB {
  return parseHex(color) ?? cssColorToRgb(color);
}

/**
 * Sigma blends with premultiplied alpha (gl.ONE, gl.ONE_MINUS_SRC_ALPHA), so translucent colors
 * must be premultiplied to fade properly on any background.
 */
export function glColor(rgb: RGB, alpha = 1): string {
  const a = Math.max(0, Math.min(1, alpha));
  if (a >= 1) return toHex(rgb);
  return `rgba(${Math.round(rgb[0] * a)},${Math.round(rgb[1] * a)},${Math.round(rgb[2] * a)},${a.toFixed(3)})`;
}

export function cssRgba(rgb: RGB, alpha = 1): string {
  return `rgba(${Math.round(rgb[0])},${Math.round(rgb[1])},${Math.round(rgb[2])},${alpha})`;
}

/**
 * Alpha of a faded name drawn once on a canvas (sigma's labels, the Earth's names): an entry that had ended, or
 * is outside the picked era. The ink at this alpha still reads at 4.5:1 or more on the page surface, about 5.2:1
 * in light mode and 7:1 in dark.
 */
export const FADED_TEXT_ALPHA = 0.65;

/** Relative luminance, 0..1. */
export function luminance([r, g, b]: RGB): number {
  const f = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
