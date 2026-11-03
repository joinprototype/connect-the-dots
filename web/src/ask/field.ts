// A stand-in for the dot-field world (web/src/lib/dotfield.ts, built for Read): the same two calls, and a
// blank canvas of the right size. Ask draws the world through these alone, so the real one drops in here.

/** Where the field looks: the centre, and a web map's zoom (the world is 512 * 2^zoom pixels wide). */
export interface View {
  lon: number;
  lat: number;
  zoom: number;
}

/** A dot on the field in its kind's ink; a name is drawn beside it, and a strong one larger. */
export interface Mark {
  lon: number;
  lat: number;
  ink: string;
  name?: string;
  strong?: boolean;
}

/** Draws the field at `view`, with `marks` on it. */
export function drawField(canvas: HTMLCanvasElement, view: View, marks: Mark[]): void {
  void view;
  void marks;
  const r = canvas.getBoundingClientRect();
  const d = Math.min(2, devicePixelRatio || 1);
  canvas.width = Math.round(r.width * d);
  canvas.height = Math.round(r.height * d);
  canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height);
}

/** One eased move of the field to `to`, over `ms`. */
export function moveField(canvas: HTMLCanvasElement, to: View, ms: number): void {
  void canvas;
  void to;
  void ms;
}
