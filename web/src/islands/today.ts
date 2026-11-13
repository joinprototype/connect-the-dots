// Today's puzzle on the home page (theme/templates/home.html): its two names, read from data/play.json, and
// whether this reader has solved it already (kept in their browser by the puzzle page). Without a script, or
// on a day with no puzzle, the link keeps its plain words.
import { puzzleDay } from '../lib/dates';

interface PlayFile {
  first: string;
  days: string[][];
  names?: Record<string, string>;
}

const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const steps = (n: number) => `${WORDS[n] ?? n} ${n === 1 ? 'step' : 'steps'}`;

export async function startToday(): Promise<void> {
  const box = document.querySelector<HTMLElement>('.home-play');
  if (!box) return;
  try {
    const file = (await (await fetch('/data/play.json')).json()) as PlayFile;
    const day = Math.max(0, puzzleDay(file.first));
    const way = file.days[day];
    if (!way?.length || !file.names) return;
    const [a, b] = [way[0], way[way.length - 1]];
    const ends = box.querySelector('.home-play-ends');
    const line = box.querySelector('.home-play-line');
    if (!ends || !line) return;
    ends.textContent = `From ${file.names[a] ?? a} to ${file.names[b] ?? b}`;
    let done: { stops: string[]; links: string[] } | null = null;
    try {
      done = JSON.parse(localStorage.getItem(`ctd-play-${day}`) ?? 'null');
    } catch {
      /* a private window keeps nothing */
    }
    line.textContent =
      done && done.stops?.[done.stops.length - 1] === b
        ? `Solved today in ${steps(done.links.length)}. A new one tomorrow.`
        : `It can be done in ${steps(way.length - 1)}.`;
  } catch {
    /* the link still opens the puzzle */
  }
}
