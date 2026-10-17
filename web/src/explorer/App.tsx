import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { loadGraphIndex, type GraphIndex } from '../lib/data';
import { dataYearRange, entryYearRange, formatYear } from '../lib/dates';
import { emit } from '../lib/events';
import { edgeTime, edgeVis, lensLayers, META_ID, META_LABEL, type Filters } from '../lib/filters';
import { findPaths } from '../lib/paths';
import type { GEdge, GNode } from '../lib/types';
import type { WorldHandle } from '../world/embed';
import { ExplorerEngine, type Selection } from './engine';
import { guard, useThrottledValue } from './guard';
import { EdgeDetails, Intro, MetaDetails, NarrativeDiff, NodeDetails, PathExplanation, PathList } from './panels';
import { EntityPicker, TimeSlider } from './ui';
import { readUrl, writeUrl } from './url';

/** Never a hairball: at most this many entities are drawn, and at most this many are kept open. */
const NODE_BUDGET = 60;
const MAX_OPEN = 6;

export function App(): ReactNode {
  const [idx, setIdx] = useState<GraphIndex | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    loadGraphIndex().then(setIdx, (e: unknown) => setError(String(e)));
  }, []);
  if (error) {
    return (
      <div className="ctdx ctdx-state">
        <p>The map could not be loaded.</p>
        <p className="ctdx-note">{error}</p>
      </div>
    );
  }
  if (!idx) {
    return (
      <div className="ctdx ctdx-state" aria-busy="true">
        <span className="ctdx-loader" aria-hidden="true" />
        <p>Loading…</p>
      </div>
    );
  }
  return <Explorer idx={idx} />;
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

/** A few good starting points: the most connected entry of each kind first. */
function suggestionsOf(idx: GraphIndex, count = 6): GNode[] {
  const byDegree = [...idx.data.nodes].sort((a, b) => b.degree - a.degree || a.name.localeCompare(b.name));
  const out: GNode[] = [];
  const seenTypes = new Set<string>();
  for (const n of byDegree) {
    if (out.length >= count) break;
    if (seenTypes.has(n.type) || !n.degree) continue;
    seenTypes.add(n.type);
    out.push(n);
  }
  for (const n of byDegree) if (out.length < count && !out.includes(n) && n.degree) out.push(n);
  return out;
}

function Explorer({ idx }: { idx: GraphIndex }): ReactNode {
  const initial = useMemo(() => readUrl(idx), [idx]);
  const [focus, setFocus] = useState<string | null>(initial.focus);
  /** Entries whose links are open, oldest first (the focus is the last one). */
  const [open, setOpen] = useState<string[]>(initial.focus ? [initial.focus] : []);
  const [edgeSel, setEdgeSel] = useState<string | null>(null);
  const [lens, setLens] = useState(initial.lens);
  const [p, setP] = useState(initial.p);
  const [t, setT] = useState<number | null>(initial.t);
  const [from, setFrom] = useState<string | null>(initial.from);
  const [to, setTo] = useState<string | null>(initial.to);
  const [includePassive, setIncludePassive] = useState(false);
  const [expandPassive, setExpandPassive] = useState(false);
  const [pathsOn, setPathsOn] = useState(!!(initial.from && initial.to));
  const [showPath, setShowPath] = useState(!!(initial.from && initial.to));
  const [activePath, setActivePath] = useState(0);
  const [tab, setTab] = useState<'details' | 'diff'>('details');
  const [view, setView] = useState<'graph' | 'world'>(initial.view);
  const [worldState, setWorldState] = useState<'loading' | 'ready' | 'failed'>('loading');
  const [moreOpen, setMoreOpen] = useState(() => initial.p !== 'all' || initial.t != null);
  const persp = idx.data.perspectives;
  const [diffA, setDiffA] = useState(persp.find((x) => x.id === initial.p)?.id ?? persp[0]?.id ?? '');
  const [diffB, setDiffB] = useState(() => rivalOf(idx, diffA));

  const stageRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);
  const worldHandle = useRef<WorldHandle | null>(null);
  /** Entity last picked in the world view: selecting it must not move the world camera. */
  const pickedInWorld = useRef<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ExplorerEngine | null>(null);
  const allYears = useMemo(() => dataYearRange(idx.data) ?? [1900, new Date().getFullYear()], [idx]);
  // With an entry in focus the slider spans its own years and its links', not all of history.
  const range = useMemo(
    () => (focus && focus !== META_ID && entryYearRange(idx.nodes.get(focus)?.when, idx.incident.get(focus) ?? [])) || allYears,
    [idx, focus, allYears],
  );
  // A time outside the new range moves to its nearest edge (only when the range changes).
  useEffect(() => {
    if (t != null && (t < range[0] || t > range[1])) setT(Math.min(range[1], Math.max(range[0], t)));
  }, [range]);
  const suggestions = useMemo(() => suggestionsOf(idx), [idx]);

  const filters: Filters = useMemo(() => ({ lens, perspective: p, t }), [lens, p, t]);
  const layers = useMemo(() => lensLayers(idx, lens), [idx, lens]);
  const visOf = useCallback((e: GEdge) => edgeVis(idx, e, filters, layers), [idx, filters, layers]);
  // The map follows the slider every frame; the route search, the URL and the ctd:time event follow a
  // throttled copy of t, so scrubbing never re-runs them dozens of times per second.
  const tSettled = useThrottledValue(t, 250);
  const pathFilters: Filters = useMemo(() => ({ lens, perspective: p, t: tSettled }), [lens, p, tSettled]);

  const paths = useMemo(() => {
    if (!pathsOn || !from || !to) return null;
    // As of t a route may use current and past links (visible), never future ones (hidden).
    const found = findPaths(idx, from, to, {
      includePassive,
      allowEdge: (e) => edgeVis(idx, e, pathFilters, layers) !== 'hide',
      timeFilterActive: tSettled != null,
    });
    if (tSettled != null) {
      for (const path of found) if (path.hops.some((h) => edgeTime(idx, h.edge, tSettled) === 'past')) path.flags.push('includes links that had ended');
    }
    return found;
  }, [idx, pathsOn, from, to, includePassive, pathFilters, layers, tSettled]);
  const path = paths && paths.length ? paths[Math.min(activePath, paths.length - 1)] : null;
  const pathActive = showPath && !!path;

  // What is drawn: the routes, plus the open entries and their links (most recent first), up to the budget.
  const scope = useMemo(() => {
    const set = new Set<string>();
    if (pathsOn && paths) for (const route of paths) for (const n of route.nodes) set.add(n);
    const recent = [...open].reverse();
    for (const id of recent) set.add(id);
    for (const id of recent) {
      const next = (idx.incident.get(id) ?? [])
        .filter((e) => visOf(e) !== 'hide')
        .map((e) => (e.from === id ? e.to : e.from))
        .filter((n) => !set.has(n))
        .sort((a, b) => (idx.nodes.get(b)?.degree ?? 0) - (idx.nodes.get(a)?.degree ?? 0) || (a < b ? -1 : 1));
      for (const n of next) {
        if (set.size >= NODE_BUDGET) break;
        set.add(n);
      }
    }
    return set;
  }, [idx, open, pathsOn, paths, visOf]);
  const starting = scope.size === 0;

  const selection: Selection = edgeSel ? { kind: 'edge', id: edgeSel } : focus ? { kind: 'node', id: focus } : null;

  const selectNode = useCallback((id: string | null) => {
    setFocus(id);
    setEdgeSel(null);
    setShowPath(false);
    setTab('details');
    // Picking an entry opens its links; clearing the search goes back to the start.
    if (!id) setOpen([]);
    else if (id !== META_ID) setOpen((prev) => [...prev.filter((x) => x !== id), id].slice(-MAX_OPEN));
  }, []);
  const selectEdge = useCallback((id: string) => {
    setEdgeSel(id);
    setShowPath(false);
    setTab('details');
  }, []);

  // Engine lifecycle (the engine owns per-node state; React only passes the view).
  useEffect(() => {
    const engine = new ExplorerEngine(stageRef.current!, idx, {
      filters,
      scope,
      expandPassive,
      selection,
      path: pathActive ? path : null,
    });
    engineRef.current = engine;
    const off = engine.onSelect((s) => {
      if (!s) {
        setEdgeSel(null);
        setShowPath(false);
        return;
      }
      if (s.kind === 'node') selectNode(s.id);
      else selectEdge(s.id);
    });
    document.documentElement.dataset.ctdExplorer = '';
    requestAnimationFrame(() => guard('fit', () => (initial.from && initial.to ? undefined : engine.fitVisible())));
    return () => {
      off();
      engine.destroy();
      engineRef.current = null;
      delete document.documentElement.dataset.ctdExplorer;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  useEffect(() => {
    guard('setView', () => engineRef.current?.setView({ filters, scope, expandPassive, selection, path: pathActive ? path : null }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, scope, expandPassive, selection?.kind, selection?.id, pathActive, path]);

  // When more entries open, bring them into view.
  const lastOpen = useRef(open.join('|'));
  useEffect(() => {
    const key = open.join('|');
    if (key === lastOpen.current) return;
    lastOpen.current = key;
    if (!pathActive) guard('fitVisible', () => engineRef.current?.fitVisible());
  }, [open, pathActive]);

  const lastFocus = useRef(initial.focus);
  useEffect(() => {
    lastFocus.current = focus;
    const world = worldHandle.current;
    if (world) {
      if (!focus || focus === META_ID) world.select(null);
      else if (focus === pickedInWorld.current) world.select(focus);
      else void world.focusEntity(focus, false).then(() => world.select(focus));
    }
    pickedInWorld.current = null;
  }, [focus]);

  // World mode (?view=world): the whole-map tile viewer, loaded on demand (deck.gl is a separate chunk).
  const selectNodeRef = useRef(selectNode);
  selectNodeRef.current = selectNode;
  const focusRef = useRef(focus);
  focusRef.current = focus;
  useEffect(() => {
    if (view !== 'world') return;
    let handle: WorldHandle | null = null;
    let cancelled = false;
    setWorldState('loading');
    import('../world/embed')
      .then(async (m) => {
        await m.ensureWorldCss();
        if (cancelled || !worldRef.current) return;
        handle = await m.mountWorld(worldRef.current, {
          src: m.resolveWorldSrc(document.getElementById('explorer-root')?.dataset.world, '/world/'),
          embedded: true,
          stats: false,
          // the map fits below the explorer's own controls (view switch and status line)
          insetTop: () => {
            const top = worldRef.current?.getBoundingClientRect().top ?? 0;
            let bottom = 0;
            for (const n of document.querySelectorAll('.ctdx-views, .ctdx-hud')) bottom = Math.max(bottom, n.getBoundingClientRect().bottom - top);
            return bottom ? bottom + 10 : 0;
          },
          // A world that fails later (no WebGL 2) says so the same way as one that never loaded.
          onFail: () => setWorldState('failed'),
          onPick: (entity) => {
            if (!entity || !idx.nodes.has(entity.id)) return;
            pickedInWorld.current = entity.id;
            selectNodeRef.current(entity.id);
          },
        });
        if (cancelled) {
          handle.destroy();
          return;
        }
        worldHandle.current = handle;
        setWorldState('ready');
        const f = focusRef.current;
        if (f && f !== META_ID) void handle.focusEntity(f, false).then(() => handle?.select(f));
      })
      .catch((err: unknown) => {
        console.warn('explorer: world view unavailable', err);
        setWorldState('failed');
      });
    return () => {
      cancelled = true;
      handle?.destroy();
      worldHandle.current = null;
    };
  }, [view, idx]);

  useEffect(() => {
    if (pathActive && path) guard('fitPath', () => engineRef.current?.fitPath(path));
  }, [pathActive, path]);

  // URL + events between scripts.
  useEffect(() => {
    writeUrl({ focus: focus === META_ID ? null : focus, lens, p, t: tSettled, from, to, view });
  }, [focus, lens, p, tSettled, from, to, view]);
  useEffect(() => emit('ctd:lens', { lens }), [lens]);
  useEffect(() => emit('ctd:time', { t: tSettled }), [tSettled]);
  useEffect(() => {
    if (focus !== META_ID) emit('ctd:focus', { id: focus });
  }, [focus]);
  useEffect(() => {
    const onFocus = (e: Event) => {
      const id = (e as CustomEvent<{ id: string | null }>).detail?.id;
      if (!id || !idx.nodes.has(id)) return;
      e.preventDefault(); // shown here: site search stays on this page
      if (id !== lastFocus.current) selectNode(id);
    };
    document.addEventListener('ctd:focus', onFocus);
    return () => document.removeEventListener('ctd:focus', onFocus);
  }, [idx, selectNode]);

  // Fill the viewport under the site header.
  useEffect(() => {
    const el = rootRef.current!;
    const fit = () => el.style.setProperty('--ctdx-top', `${Math.max(0, el.getBoundingClientRect().top + window.scrollY)}px`);
    fit();
    window.addEventListener('resize', fit);
    return () => window.removeEventListener('resize', fit);
  }, []);

  const connect = (a = from, b = to) => {
    if (!a || !b || a === b) return;
    setPathsOn(true);
    setShowPath(true);
    setActivePath(0);
    setTab('details');
  };

  const lensDef = idx.lenses.get(lens);
  const moreOn = [p !== 'all', t != null, expandPassive, includePassive].filter(Boolean).length;
  const worldFailed = view === 'world' && worldState === 'failed';

  let detail: ReactNode;
  if (pathActive && path) {
    detail = <PathExplanation idx={idx} path={path} index={Math.min(activePath, paths!.length - 1)} total={paths!.length} onEntity={selectNode} />;
  } else if (edgeSel) {
    detail = <EdgeDetails idx={idx} id={edgeSel} t={t} onEntity={selectNode} onEdge={selectEdge} />;
  } else if (focus === META_ID) {
    detail = <MetaDetails idx={idx} expanded={expandPassive} onExpand={setExpandPassive} onEntity={selectNode} />;
  } else if (focus && idx.nodes.has(focus)) {
    detail = (
      <NodeDetails
        idx={idx}
        id={focus}
        t={t}
        edgeVis={visOf}
        onEntity={selectNode}
        onEdge={selectEdge}
        onConnectFrom={(id) => {
          setFrom(id);
          setPathsOn(false);
        }}
      />
    );
  } else detail = <Intro idx={idx} />;

  return (
    <div className={`ctdx${starting && view === 'graph' ? ' is-starting' : ''}`} ref={rootRef}>
      <aside className="ctdx-panel ctdx-left" aria-label="Controls">
        <section className="ctdx-block">
          <EntityPicker idx={idx} label="Search" value={focus === META_ID ? null : focus} placeholder="Person, place or event" onPick={selectNode} />
        </section>

        <section className="ctdx-block">
          <h2 className="ctdx-block-h">Show</h2>
          <div className="ctdx-chips" role="group" aria-label="Show">
            {idx.data.lenses.map((l) => (
              <button key={l.id} type="button" className="ctdx-chip" aria-pressed={lens === l.id} onClick={() => setLens(l.id)}>
                {l.label}
              </button>
            ))}
          </div>
        </section>

        <section className="ctdx-block ctdx-connect">
          <h2 className="ctdx-block-h">Find a route</h2>
          <EntityPicker idx={idx} label="From" value={from} compact placeholder="A name" onPick={(id) => { setFrom(id); setPathsOn(false); }} />
          <button
            type="button"
            className="ctdx-swap"
            aria-label="Swap From and To"
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
          >
            ⇅
          </button>
          <EntityPicker
            idx={idx}
            label="To"
            value={to}
            compact
            placeholder="Another name"
            onPick={(id) => {
              setTo(id);
              setPathsOn(false);
              if (id && from && id !== from) connect(from, id);
            }}
          />
          <button type="button" className="ctdx-btn is-primary" disabled={!from || !to || from === to} onClick={() => connect()}>
            Show routes
          </button>
          {paths ? (
            paths.length ? (
              <PathList
                idx={idx}
                paths={paths}
                active={showPath ? activePath : -1}
                onPick={(i) => {
                  setActivePath(i);
                  setShowPath(true);
                  setTab('details');
                }}
              />
            ) : (
              <p className="ctdx-note">
                No route found in this view. Try “{idx.data.lenses[0]?.label ?? 'Everything'}”, all time
                {includePassive ? '' : ', or routes through index funds under More'}.
              </p>
            )
          ) : null}
        </section>

        <details className="ctdx-block ctdx-more" open={moreOpen} onToggle={(e) => setMoreOpen((e.currentTarget as HTMLDetailsElement).open)}>
          <summary>
            More{moreOn ? <span className="ctdx-count"> · {moreOn} on</span> : null}
          </summary>
          <div className="ctdx-more-body">
            <h2 className="ctdx-block-h">Accounts</h2>
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
            <p className="ctdx-hint">
              {p === 'all'
                ? 'Links that are one side’s account are drawn lighter than documented facts.'
                : p === 'facts'
                  ? 'Showing only links presented as documented fact.'
                  : 'Documented facts plus this side’s account; the other sides are drawn lighter.'}
            </p>

            <h2 className="ctdx-block-h ctdx-more-h">Time</h2>
            <TimeSlider range={range as [number, number]} t={t} onChange={setT} />

            <h2 className="ctdx-block-h ctdx-more-h">Index funds</h2>
            <label className="ctdx-toggle">
              <input type="checkbox" checked={!expandPassive} onChange={(e) => setExpandPassive(!e.target.checked)} />
              <span>Group shares held for clients into “{META_LABEL}”</span>
            </label>
            <label className="ctdx-toggle">
              <input type="checkbox" checked={includePassive} onChange={(e) => setIncludePassive(e.target.checked)} />
              <span>Let routes go through index funds</span>
            </label>
          </div>
        </details>
      </aside>

      {/* The page already has its <main>: the canvas is a labelled region inside it. */}
      <section className={`ctdx-canvas${view === 'world' ? ' is-world' : ''}`} aria-label={view === 'world' ? 'World map' : 'Map of links'}>
        <div className="ctdx-stage" ref={stageRef} hidden={view === 'world'} />
        {view === 'world' ? <div className="ctdx-world" ref={worldRef} /> : null}
        {worldFailed ? (
          <div className="ctdx-world-failed" role="status">
            <p>The world map could not be loaded.</p>
            <button type="button" className="ctdx-btn" onClick={() => setView('graph')}>
              Show links
            </button>
          </div>
        ) : null}
        {view === 'graph' && starting ? (
          <div className="ctdx-start">
            <div className="ctdx-start-card">
              <h2>Start from a person, place or event</h2>
              <EntityPicker idx={idx} label="Start from" hideLabel big value={null} placeholder="Search names, places, events" onPick={selectNode} />
              <div className="ctdx-suggest" role="group" aria-label="Suggestions">
                {suggestions.map((n) => (
                  <button key={n.id} type="button" className="ctdx-suggestion" onClick={() => selectNode(n.id)}>
                    {n.name}
                  </button>
                ))}
              </div>
              <p className="ctdx-start-or">Or put two names in “Find a route” to see how they connect.</p>
            </div>
          </div>
        ) : null}
        <div className="ctdx-views" role="group" aria-label="View">
          <button type="button" aria-pressed={view === 'graph'} onClick={() => setView('graph')}>
            Links
          </button>
          <button type="button" aria-pressed={view === 'world'} onClick={() => setView('world')}>
            World map
          </button>
        </div>
        {starting && view === 'graph' ? null : (
          <div className="ctdx-hud">
            {view === 'world' ? (
              <span className="ctdx-hud-world">{worldState === 'failed' ? 'World map unavailable' : 'The whole map. “Show”, time and accounts apply to Links.'}</span>
            ) : (
              <>
                <span className="ctdx-hud-lens">{lensDef?.label ?? 'Everything'}</span>
                {t != null ? <span className="ctdx-hud-time">as of {formatYear(t, t > 1800)}</span> : null}
                {p !== 'all' ? <span className="ctdx-hud-p">{p === 'facts' ? 'Documented facts only' : `${persp.find((x) => x.id === p)?.name ?? p}'s account`}</span> : null}
                {scope.size >= NODE_BUDGET ? <span className="ctdx-hud-budget">Showing the {NODE_BUDGET} closest</span> : null}
              </>
            )}
          </div>
        )}
        {worldFailed ? null : (
          <div className="ctdx-zoom" role="group" aria-label="Zoom">
            <button type="button" aria-label="Zoom in" onClick={() => (view === 'world' ? worldHandle.current?.zoomBy(1) : engineRef.current?.zoom(1.5))}>+</button>
            <button type="button" aria-label="Zoom out" onClick={() => (view === 'world' ? worldHandle.current?.zoomBy(-1) : engineRef.current?.zoom(1 / 1.5))}>−</button>
            <button type="button" aria-label="Show everything drawn" onClick={() => (view === 'world' ? worldHandle.current?.resetView() : engineRef.current?.fitVisible())}>⌂</button>
          </div>
        )}
        {(starting && view === 'graph') || worldFailed ? null : (
          <ul className="ctdx-legend" aria-label="Key">
            <li>Entry</li>
            <li className="is-accent">{view === 'graph' ? 'Selected or route' : 'Selected'}</li>
            {view === 'graph' ? <li className="is-line">Link</li> : null}
            {view === 'graph' ? <li className="is-faint">One side’s account, or being verified</li> : null}
            {view === 'graph' && t != null ? <li className="is-past">Faded: over by {formatYear(t, t > 1800)}</li> : null}
          </ul>
        )}
        <p className="ctdx-footer-notice">A connection is not evidence of wrongdoing.</p>
      </section>

      <aside className="ctdx-panel ctdx-right" aria-label="Details">
        <div className="ctdx-tabs" role="tablist">
          <button type="button" role="tab" aria-selected={tab === 'details'} onClick={() => setTab('details')}>
            {pathActive ? 'Route' : 'Details'}
          </button>
          <button type="button" role="tab" aria-selected={tab === 'diff'} onClick={() => setTab('diff')}>
            Compare accounts
          </button>
        </div>
        <div className="ctdx-right-body" role="tabpanel">
          {tab === 'details' ? (
            detail
          ) : (
            <NarrativeDiff idx={idx} a={diffA} b={diffB} setA={setDiffA} setB={setDiffB} onEdge={selectEdge} />
          )}
        </div>
      </aside>
    </div>
  );
}
