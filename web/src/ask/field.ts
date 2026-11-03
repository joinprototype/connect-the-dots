// The dot-field world under Ask: the two calls the stage makes, drawn by the site's one field
// (web/src/lib/dotfield.ts, built for Read). The stage's canvas only holds the spot: the field takes its
// place in the page, under the stage's own ink.
import { DotField, project, zoomScale, type Mark as FieldMark, type View as FieldView } from '../lib/dotfield';

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

const fields = new WeakMap<HTMLCanvasElement, { field: DotField; marks: Mark[] }>();

function fieldOf(canvas: HTMLCanvasElement): { field: DotField; marks: Mark[] } {
  let made = fields.get(canvas);
  if (!made) {
    const field = new DotField(canvas.parentElement!);
    canvas.style.display = 'none';
    // the field goes where the canvas was, so that what the stage draws on top stays on top
    for (const el of canvas.parentElement!.querySelectorAll('.dotfield-marks, .dotfield-dots')) canvas.after(el);
    made = { field, marks: [] };
    fields.set(canvas, made);
  }
  return made;
}

const viewOf = (v: View): FieldView => {
  const [x, y] = project(v.lon, v.lat);
  return { x, y, scale: zoomScale(v.zoom) };
};

const marksOf = (marks: Mark[]): FieldMark[] =>
  marks.map((m, i) => {
    const [x, y] = project(m.lon, m.lat);
    const label = m.name ? (m.strong ? 'strong' : 'plain') : undefined;
    return { id: `${i}`, name: m.name ?? '', x, y, ink: m.ink, r: m.strong ? 7 : 5, label, rank: m.strong ? 2 : 1 };
  });

function show(canvas: HTMLCanvasElement, view: View, marks: Mark[], ms: number): void {
  const made = fieldOf(canvas);
  made.marks = marks;
  const scene = { key: JSON.stringify([view, marks]), world: 'earth', view: viewOf(view), marks: marksOf(marks), places: 12 };
  made.field.show(scene, ms);
}

/** Draws the field at `view`, with `marks` on it. */
export function drawField(canvas: HTMLCanvasElement, view: View, marks: Mark[]): void {
  show(canvas, view, marks, 0);
}

/** One eased move of the field to `to`, over `ms`, keeping its marks. */
export function moveField(canvas: HTMLCanvasElement, to: View, ms: number): void {
  show(canvas, to, fields.get(canvas)?.marks ?? [], ms);
}
