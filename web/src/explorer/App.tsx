import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadDetails, loadGraphIndex, loadJson, nameOf, type GraphIndex } from '../lib/data';
import { dataYearRange, entryYearRange, formatAsOf } from '../lib/dates';
import { emit } from '../lib/events';
import { edgeTime, edgeVis, lensLayers, META_LABEL, type Filters } from '../lib/filters';
import { findPaths } from '../lib/paths';
import { NOTICE } from '../lib/plain';
import type { GEdge, GNode } from '../lib/types';
import { guard, useThrottledValue } from './guard';
import { EdgeDetails, Intro, MetaDetails, NarrativeDiff, NodeDetails, PathExplanation, PathList } from './panels';
import { EntityPicker, TimeSlider } from './ui';
import { readUrl, writeUrl, type UrlState } from './url';
import { Walk, type WalkView } from './walk';

/** What an entry's dot is near and in, read once at the start. */
interface World {
  idx: GraphIndex;
  /** Where each entry sits on the Map. */
  spots: Map<string, [number, number]>;
  /** The written stories each entry is in: `[title, url]`, at most three. */
  stories: Record<string, [string, string][]>;
}

export function App(): ReactNode {
  const [ready, setReady] = useState<{ world: World; initial: UrlState } | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const load = async () => {
      const [idx, rows, stories] = await Promise.all([
        loadGraphIndex(),
        loadJson<number[]>('/data/spots.json'),
        loadJson<World['stories']>('/data/stories.json').catch(() => ({})),
      ]);
      const initial = await readUrl(idx);
      // The whole map has its own page now: this old address goes on working there.
      if (new URLSearchParams(location.search).get('view') === 'world') {
        location.replace(initial.focus ? `/w/?focus=${encodeURIComponent(initial.focus)}` : '/w/');
        return;
      }
      const first = initial.focus ?? initial.from;
      // its words arrive with the page, so nothing moves once it shows
      if (first) await loadDetails(idx, first);
      const spots = new Map(idx.data.nodes.map((n, i): [string, [number, number]] => [n.id, [rows[2 * i], rows[2 * i + 1]]]));
      setReady({ world: { idx, spots, stories }, initial });
    };
    load().catch((e: unknown) => setError(String(e)));
  }, []);
  if (error) {
    return (
      <div className="ctdx ctdx-state">
        <p>The map could not be loaded.</p>
        <p className="ctdx-note">{error}</p>
      </div>
    );
  }
  if (!ready) {
    return (
      <div className="ctdx ctdx-state" aria-busy="true">
        <span className="ctdx-loader" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }
  return <Explorer world={ready.world} initial={ready.initial} />;
}

/** The side whose accounts touch the most of the same entries: the likeliest other side. */
function rivalOf(idx: GraphIndex, a: string): string {
  const touched = (p: string) => {
    const set = new Set<string>();
    for (const e of idx.edges.values()) if (e.according_to.includes(p)) set.add(e.from).add(e.to);
    return set;
  };
  const mine = touched(a);
  let best = '';
  let bestScore = -1;
  for (const p of idx.data.perspectives) {
    if (p.id === a) continue;
    let score = 0;
    for (const n of touched(p.id)) if (mine.has(n)) score++;
    if (score > bestScore) [best, bestScore] = [p.id, score];
  }
  return best || a;
}

/** A few good starting points: the most connected entry of each kind first, none that no route may use. */
function suggestionsOf(idx: GraphIndex, count = 6): GNode[] {
  const open = idx.data.nodes.filter((n) => n.degree && idx.incident.get(n.id)?.some((e) => e.traversable));
  const byDegree = open.sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name));
  const out: GNode[] = [];
  const seenTypes = new Set<string>();
  for (const n of byDegree) {
    if (out.length >= count) break;
    if (seenTypes.has(n.type)) continue;
    seenTypes.add(n.type);
    out.push(n);
  }
  for (const n of byDegree) if (out.length < count && !out.includes(n)) out.push(n);
  return out;
}

function Explorer({ world, initial }: { world: World; initial: UrlState }): ReactNode {
  const { idx, spots, stories } = world;
  const [focus, setFocus] = useState<string | null>(initial.focus);
  /** The link whose proof is open. */
  const [edgeSel, setEdgeSel] = useState<string | null>(initial.link);
  const [lens, setLens] = useState(initial.lens);
  const [p, setP] = useState(initial.p);
  const [t, setT] = useState<number | null>(initial.t);
  const [from, setFrom] = useState<string | null>(initial.from);
  const [to, setTo] = useState<string | null>(initial.to);
  const [includePassive, setIncludePassive] = useState(false);
  const [expandPassive, setExpandPassive] = useState(false);
  const [activePath, setActivePath] = useState(0);
  /** The panel shows the entry or route, or for a moment the fund group or two accounts side by side. */
  const [panel, setPanel] = useState<'main' | 'group' | 'diff'>('main');
  const persp = idx.data.perspectives;
  const [diffA, setDiffA] = useState(persp.find((x) => x.id === initial.p)?.id ?? persp[0]?.id ?? '');
  const [diffB, setDiffB] = useState(() => rivalOf(idx, diffA));

  const stageRef = useRef<HTMLDivElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const noteRef = useRef<HTMLParagraphElement>(null);
  const walkRef = useRef<Walk | null>(null);
  const allYears = useMemo(() => dataYearRange(idx.data) ?? [1900, new Date().getFullYear()], [idx]);
  /** The entry on show: an address may name only a route's first end, or a link. */
  const place = focus ?? from ?? (edgeSel ? (idx.edges.get(edgeSel)?.from ?? null) : null);
  // With an entry on show the slider spans its own years and its links', not all of history.
  const range = useMemo(() => (place && entryYearRange(idx.nodes.get(place)?.when, idx.incident.get(place) ?? [])) || allYears, [idx, place, allYears]);
  // A time outside the new range moves to its nearest edge (only when the range changes).
  useEffect(() => {
    if (t != null && (t < range[0] || t > range[1])) setT(Math.min(range[1], Math.max(range[0], t)));
  }, [range]);
  const suggestions = useMemo(() => suggestionsOf(idx), [idx]);

  const filters: Filters = useMemo(() => ({ lens, perspective: p, t }), [lens, p, t]);
  const layers = useMemo(() => lensLayers(idx, lens), [idx, lens]);
  const visOf = useCallback((e: GEdge) => edgeVis(idx, e, filters, layers), [idx, filters, layers]);
  // The panel follows the slider every frame; the picture, the route search, the URL and the ctd:time event
  // follow a throttled copy of t, so scrubbing never re-runs them dozens of times per second.
  const tSettled = useThrottledValue(t, 250);
  const settled: Filters = useMemo(() => ({ lens, perspective: p, t: tSettled }), [lens, p, tSettled]);
  const settledVis = useCallback((e: GEdge) => edgeVis(idx, e, settled, layers), [idx, settled, layers]);

  const paths = useMemo(() => {
    if (!from || !to || from === to) return null;
    // As of t a route may use current and past links (visible), never future ones (hidden).
    const found = findPaths(idx, from, to, { includePassive, allowEdge: (e) => settledVis(e) !== 'hide', timeFilterActive: tSettled != null });
    if (tSettled != null) {
      for (const path of found) if (path.hops.some((h) => edgeTime(idx, h.edge, tSettled) === 'past')) path.flags.push('includes links that had ended');
    }
    return found;
  }, [idx, from, to, includePassive, settledVis, tSettled]);
  const path = paths?.length ? paths[Math.min(activePath, paths.length - 1)] : null;

  /** Move to an entry: the one thing a person does here. */
  const walkTo = useCallback((id: string) => {
    setFocus(id);
    setEdgeSel(null);
    setFrom(null);
    setTo(null);
    setPanel('main');
  }, []);
  const openProof = useCallback((id: string | null) => {
    setEdgeSel(id);
    setPanel('main');
  }, []);

  // Resting on a name gets its words ready, so the panel changes at once if it is clicked.
  const hover = useRef(0);
  const nearBy = useCallback(
    (id: string) => {
      clearTimeout(hover.current);
      hover.current = window.setTimeout(() => void loadDetails(idx, id), 120);
    },
    [idx],
  );

  const view: WalkView = useMemo(
    () => ({ focus: place, link: edgeSel, path, vis: settledVis, grouped: !expandPassive && (idx.data.methodology.collapse_passive ?? true), start: suggestions }),
    [place, edgeSel, path, settledVis, expandPassive, idx, suggestions],
  );

  // The picture's lifecycle: it keeps its own state, and React only says what to show.
  useEffect(() => {
    const walk = new Walk(stageRef.current!, noteRef.current!, idx, spots, { onEntry: walkTo, onLink: openProof, onGroup: () => setPanel('group'), onNear: nearBy });
    walkRef.current = walk;
    document.documentElement.dataset.ctdExplorer = '';
    return () => {
      walk.destroy();
      walkRef.current = null;
      delete document.documentElement.dataset.ctdExplorer;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);
  useEffect(() => guard('show', () => walkRef.current?.show(view)), [view]);

  // A new place starts at the top of the panel, with the reader's focus on its name.
  const firstPlace = useRef(true);
  useEffect(() => {
    if (firstPlace.current) {
      firstPlace.current = false;
      return;
    }
    const box = panelRef.current;
    box?.scrollTo(0, 0);
    box?.querySelector('h2')?.focus({ preventScroll: true });
  }, [place, from, to, activePath, edgeSel, panel]);
  useEffect(() => {
    if (place) document.title = `${nameOf(idx, place)}: Connect the Dots`;
  }, [idx, place]);

  // The address: a new place is a step Back can undo, a filter is not. The first write only tidies it.
  const firstWrite = useRef(true);
  useEffect(() => {
    writeUrl({ focus, link: edgeSel, lens, p, t: tSettled, from, to }, firstWrite.current);
    firstWrite.current = false;
  }, [focus, edgeSel, lens, p, tSettled, from, to]);
  useEffect(() => {
    const onPop = () => {
      void readUrl(idx).then((s) => {
        setFocus(s.focus);
        setEdgeSel(s.link);
        setLens(s.lens);
        setP(s.p);
        setT(s.t);
        setFrom(s.from);
        setTo(s.to);
        setPanel('main');
      });
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, [idx]);

  // Events between scripts.
  useEffect(() => emit('ctd:lens', { lens }), [lens]);
  useEffect(() => emit('ctd:time', { t: tSettled }), [tSettled]);
  const shown = useRef(place);
  useEffect(() => {
    shown.current = place;
    emit('ctd:focus', { id: place });
  }, [place]);
  useEffect(() => {
    const onFocus = (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail?.id;
      if (!id || !idx.nodes.has(id)) return;
      e.preventDefault(); // shown here: site search stays on this page
      if (id !== shown.current) walkTo(id);
    };
    document.addEventListener('ctd:focus', onFocus);
    return () => document.removeEventListener('ctd:focus', onFocus);
  }, [idx, walkTo]);

  // Fill the viewport under the site header, before the first paint.
  useLayoutEffect(() => {
    const el = rootRef.current!;
    const fit = () => el.style.setProperty('--ctdx-top', `${Math.max(0, el.getBoundingClientRect().top + window.scrollY)}px`);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const routeTo = (id: string | null) => {
    if (!id || !place || id === place) return;
    setFrom(place);
    setTo(id);
    setActivePath(0);
    setEdgeSel(null);
    setPanel('main');
  };

  const back = (label: string, onClick: () => void) => (
    <button type="button" className="ctdx-back" onClick={onClick}>
      <span aria-hidden="true">← </span>
      {label}
    </button>
  );
  const home = place ? nameOf(idx, place) : 'Back';

  let detail: ReactNode;
  if (panel === 'diff') {
    detail = (
      <>
        {back(home, () => setPanel('main'))}
        <NarrativeDiff idx={idx} a={diffA} b={diffB} setA={setDiffA} setB={setDiffB} onEdge={openProof} />
      </>
    );
  } else if (panel === 'group') {
    detail = (
      <>
        {back(home, () => setPanel('main'))}
        <MetaDetails idx={idx} expanded={expandPassive} onExpand={setExpandPassive} onEntity={walkTo} />
      </>
    );
  } else if (edgeSel && idx.edges.has(edgeSel)) {
    detail = (
      <>
        {back(path ? 'The route' : home, () => openProof(null))}
        <EdgeDetails idx={idx} id={edgeSel} t={t} onEntity={walkTo} onEdge={openProof} />
      </>
    );
  } else if (path) {
    detail = (
      <>
        <PathExplanation idx={idx} path={path} index={Math.min(activePath, paths!.length - 1)} total={paths!.length} onEntity={walkTo} />
        {paths!.length > 1 ? (
          <>
            <h3 className="ctdx-section-h">All the routes</h3>
            <PathList idx={idx} paths={paths!} active={activePath} onPick={setActivePath} />
          </>
        ) : null}
      </>
    );
  } else if (place && idx.nodes.has(place)) {
    detail = <NodeDetails idx={idx} id={place} t={t} edgeVis={visOf} stories={stories[place] ?? []} onEntity={walkTo} onEdge={openProof} onNear={nearBy} />;
  } else detail = <Intro idx={idx} names={suggestions} onEntity={walkTo} />;

  const lensLabel = lens === 'all' ? '' : (idx.lenses.get(lens)?.label ?? '');
  const accounts = p === 'all' ? '' : p === 'facts' ? 'Documented facts only' : `${persp.find((x) => x.id === p)?.name ?? p}'s account`;
  const filtersOn = [lensLabel, t != null ? `as of ${formatAsOf(t)}` : '', accounts].filter(Boolean).join(' · ');

  return (
    <div className="ctdx" ref={rootRef}>
      <section className="ctdx-panel" aria-label="Details" ref={panelRef}>
        {from && !to && place ? <EntityPicker idx={idx} label={`How is ${nameOf(idx, place)} connected to…`} placeholder="Another name" onPick={routeTo} /> : null}
        {paths && !paths.length ? (
          <p className="ctdx-note">
            No route found in this view. Try “{idx.data.lenses[0]?.label ?? 'Everything'}”, all time
            {includePassive ? '' : ', or routes through index funds under More'}.
          </p>
        ) : null}
        {detail}
      </section>

      {/* The page already has its <main>: the picture is a labelled region inside it. */}
      <section className="ctdx-canvas" aria-label="Map of links">
        {/* the panel's list says all the picture says, for anyone who cannot see it */}
        <div className="ctdx-stage" ref={stageRef} aria-hidden="true" />
        <details className="ctdx-more">
          <summary>{filtersOn || 'More'}</summary>
          <div className="ctdx-more-body">
            <h2 className="ctdx-block-h">Show</h2>
            <div className="ctdx-chips" role="group" aria-label="Show">
              {idx.data.lenses.map((l) => (
                <button key={l.id} type="button" className="ctdx-chip" aria-pressed={lens === l.id} onClick={() => setLens(l.id)}>
                  {l.label}
                </button>
              ))}
            </div>

            <h2 className="ctdx-block-h ctdx-more-h">Accounts</h2>
            <label className="ctdx-field">
              <span className="sr-only">Accounts</span>
              <select
                value={p}
                onChange={(e) => {
                  setP(e.target.value);
                  if (e.target.value !== 'all' && e.target.value !== 'facts') {
                    setDiffA(e.target.value);
                    setDiffB(rivalOf(idx, e.target.value));
                  }
                }}
              >
                <option value="all">Everything on record</option>
                <option value="facts">Documented facts only</option>
                {persp.length ? (
                  <optgroup label="One side's account">
                    {persp.map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.name}
                      </option>
                    ))}
                  </optgroup>
                ) : null}
              </select>
            </label>
            {persp.length ? (
              <button type="button" className="ctdx-link" onClick={() => setPanel('diff')}>
                Compare two accounts
              </button>
            ) : null}

            <h2 className="ctdx-block-h ctdx-more-h">Time</h2>
            <TimeSlider range={range as [number, number]} t={t} onChange={setT} />

            {place ? (
              <>
                <h2 className="ctdx-block-h ctdx-more-h">Find a route</h2>
                <EntityPicker idx={idx} label={`From ${nameOf(idx, place)} to`} placeholder="Another name" onPick={routeTo} />
                <label className="ctdx-toggle">
                  <input type="checkbox" checked={includePassive} onChange={(e) => setIncludePassive(e.target.checked)} />
                  <span>Let routes go through {META_LABEL.toLowerCase()}</span>
                </label>
              </>
            ) : null}
          </div>
        </details>
        <div className="ctdx-strip">
          <p className="ctdx-footer-notice">{NOTICE}</p>
          <p ref={noteRef} />
        </div>
      </section>
    </div>
  );
}
