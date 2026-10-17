import { useMemo, type ReactNode } from 'react';
import { detailOf, kinshipRole, sentence, sentenceText } from '../lib/claims';
import { nameOf, type GraphIndex } from '../lib/data';
import { formatYear } from '../lib/dates';
import { edgeTime, META_LABEL, nodeTime, passiveModel, type Vis } from '../lib/filters';
import type { PathResult } from '../lib/paths';
import { entityStoryUrl, routeStoryUrl, routeSummary } from '../lib/plain';
import type { GEdge } from '../lib/types';
import { Badges, ClaimCard, Sentence, typeDot } from './ui';

const NOTICE = 'A connection is not evidence of wrongdoing.';

// ------------------------------------------------------------------ an entry

export function NodeDetails(props: {
  idx: GraphIndex;
  id: string;
  /** Time filter (decimal year) or null. */
  t?: number | null;
  edgeVis: (e: GEdge) => Vis;
  onEntity: (id: string) => void;
  onEdge: (id: string) => void;
  onConnectFrom: (id: string) => void;
}): ReactNode {
  const { idx, id } = props;
  const n = idx.nodes.get(id)!;
  const type = idx.data.types[n.type];
  const groups = useMemo(() => {
    const byRel = new Map<string, { e: GEdge; vis: Vis }[]>();
    for (const e of idx.incident.get(id) ?? []) {
      const key = e.from === id ? e.label || e.rel : idx.data.relations[e.rel]?.inverse ?? e.rel;
      byRel.set(key, [...(byRel.get(key) ?? []), { e, vis: props.edgeVis(e) }]);
    }
    return [...byRel.entries()].sort((a, b) => a[0].localeCompare(b[0]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx, id, props.edgeVis]);
  const hidden = groups.reduce((s, [, list]) => s + list.filter((x) => x.vis === 'hide').length, 0);
  const past = groups.reduce((s, [, list]) => s + list.filter((x) => x.vis === 'past').length, 0);
  const t = props.t ?? null;
  const asOf = t != null ? formatYear(t, t > 1800) : '';
  const own = nodeTime(idx, id, t);
  const story = entityStoryUrl(idx.data, id);
  return (
    <div className="ctdx-details">
      <p className="ctdx-kind" style={typeDot(idx, n)}>
        {type?.label ?? n.type}
        {n.when ? <span className="ctdx-when"> · {n.when.label}</span> : null}
        {own === 'past' ? <span className="ctdx-badge is-past">over by {asOf}</span> : null}
        {own === 'future' ? <span className="ctdx-badge is-future">not yet in {asOf}</span> : null}
      </p>
      <h2>{n.name}</h2>
      {n.summary ? <p className="ctdx-summary">{n.summary}</p> : null}
      {n.aliases?.length ? <p className="ctdx-aliases">Also known as {n.aliases.join(', ')}</p> : null}
      <div className="ctdx-actions">
        {story ? (
          <a className="ctdx-btn is-primary" href={story}>
            Play the story
          </a>
        ) : null}
        <a className={`ctdx-btn${story ? '' : ' is-primary'}`} href={n.url}>
          Open page
        </a>
        <button type="button" className="ctdx-btn is-ghost" onClick={() => props.onConnectFrom(id)}>
          Find a route from here
        </button>
      </div>
      <h3 className="ctdx-section-h">
        Links <span className="ctdx-count">{(idx.incident.get(id) ?? []).length}</span>
      </h3>
      {hidden ? <p className="ctdx-note">{hidden} not shown in this view.</p> : null}
      {past ? <p className="ctdx-note">{past} had ended by {asOf}, so they are faded.</p> : null}
      {groups.map(([rel, list]) => (
        <section key={rel} className="ctdx-group">
          <h4>{rel}</h4>
          <ul>
            {list.map(({ e, vis }) => {
              const other = e.from === id ? e.to : e.from;
              // A kinship role describes the claim's owner: "Mother of Bill Gates" on her own panel,
              // "Mary Maxwell Gates · mother" on his.
              const role = kinshipRole(idx, e);
              const ownRole = e.from === id ? role : null;
              const detail = [ownRole ? null : role, detailOf(idx, e)].filter(Boolean).join(', ');
              return (
                <li key={e.id} className={`is-${vis}`}>
                  <button type="button" className="ctdx-row" onClick={() => props.onEdge(e.id)}>
                    {ownRole ? <span className="ctdx-detail">{ownRole.charAt(0).toUpperCase() + ownRole.slice(1)} of </span> : null}
                    <span className="ctdx-row-name">{nameOf(idx, other)}</span>
                    {detail ? <span className="ctdx-detail"> · {detail}</span> : null}
                  </button>
                  <Badges idx={idx} e={e} compact />
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}

// ------------------------------------------------------------------ a link

export function EdgeDetails(props: { idx: GraphIndex; id: string; t?: number | null; onEntity: (id: string) => void; onEdge: (id: string) => void }): ReactNode {
  const { idx } = props;
  const e = idx.edges.get(props.id);
  if (!e) return null;
  const t = props.t ?? null;
  const time = edgeTime(idx, e, t);
  const asOf = t != null ? formatYear(t, t > 1800) : '';
  const rel = idx.data.relations[e.rel];
  const siblings = (idx.incident.get(e.from) ?? []).filter(
    (x) => x.id !== e.id && ((x.from === e.from && x.to === e.to) || (x.from === e.to && x.to === e.from)),
  );
  // A family role reads the same from both sides ("Mary Maxwell Gates, mother of Bill Gates").
  const otherWay = sentenceText(sentence(idx, e, e.to));
  return (
    <div className="ctdx-details">
      <p className="ctdx-kind">Link · {rel?.label ?? e.label}</p>
      <ClaimCard idx={idx} e={e} onEntity={props.onEntity} />
      {time === 'past' ? <p className="ctdx-note is-past">As of {asOf} this had ended, so it is drawn faded.</p> : null}
      {time === 'future' ? <p className="ctdx-note">As of {asOf} this had not begun, so the map hides it.</p> : null}
      {otherWay !== sentenceText(sentence(idx, e)) ? (
        <p className="ctdx-note">
          The other way round: <em>{otherWay}</em>.
        </p>
      ) : null}
      {siblings.length ? (
        <>
          <h3 className="ctdx-section-h">Also between them</h3>
          <ul className="ctdx-plain">
            {siblings.map((x) => (
              <li key={x.id}>
                <button type="button" className="ctdx-row" onClick={() => props.onEdge(x.id)}>
                  {sentenceText(sentence(idx, x))}
                </button>
              </li>
            ))}
          </ul>
        </>
      ) : null}
    </div>
  );
}

// ------------------------------------------------------------------ index funds

export function MetaDetails(props: { idx: GraphIndex; expanded: boolean; onExpand: (v: boolean) => void; onEntity: (id: string) => void }): ReactNode {
  const { idx } = props;
  const pm = useMemo(() => passiveModel(idx), [idx]);
  return (
    <div className="ctdx-details">
      <p className="ctdx-kind">Grouped</p>
      <h2>{META_LABEL}</h2>
      <p className="ctdx-summary">
        Shares an asset manager holds on behalf of its clients, usually through index funds. They are grouped because
        holding shares for clients is not the same as owning or controlling a company.
      </p>
      <div className="ctdx-actions">
        <button type="button" className="ctdx-btn" onClick={() => props.onExpand(!props.expanded)}>
          {props.expanded ? 'Group them again' : 'Show each fund manager'}
        </button>
      </div>
      <h3 className="ctdx-section-h">
        Held for clients <span className="ctdx-count">{pm.edges.length}</span>
      </h3>
      <ul className="ctdx-plain">
        {pm.edges.map((e) => (
          <li key={e.id}>
            <Sentence idx={idx} e={e} onEntity={props.onEntity} />
            {e.when ? <span className="ctdx-badge is-when">{e.when.label}</span> : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ------------------------------------------------------------------ routes

export function PathList(props: { idx: GraphIndex; paths: PathResult[]; active: number; onPick: (i: number) => void }): ReactNode {
  const { idx, paths } = props;
  return (
    <ol className="ctdx-paths">
      {paths.map((p, i) => (
        <li key={p.nodes.join('>') + i}>
          <button type="button" aria-pressed={i === props.active} onClick={() => props.onPick(i)}>
            <span className="ctdx-path-rank">{i + 1}</span>
            <span className="ctdx-path-chain">
              {p.nodes.map((n, j) => (
                <span key={n + j}>
                  {j > 0 ? <span className="ctdx-path-sep" aria-hidden="true" /> : null}
                  {nameOf(idx, n)}
                </span>
              ))}
            </span>
            <span className="ctdx-path-meta">
              {routeSummary(idx.data, p)}
              {p.flags.map((f) => (
                <span key={f} className="ctdx-flag">
                  {f}
                </span>
              ))}
            </span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function PathExplanation(props: {
  idx: GraphIndex;
  path: PathResult;
  index: number;
  total: number;
  onEntity: (id: string) => void;
}): ReactNode {
  const { idx, path } = props;
  const story = routeStoryUrl(idx.data, path.nodes[0], path.nodes[path.nodes.length - 1]);
  return (
    <div className="ctdx-details">
      <p className="ctdx-kind">
        Route {props.index + 1} of {props.total}
      </p>
      <h2 className="ctdx-path-title">
        {nameOf(idx, path.nodes[0])} <span aria-hidden="true">→</span>
        <span className="sr-only"> to </span> {nameOf(idx, path.nodes[path.nodes.length - 1])}
      </h2>
      <p className="ctdx-summary">{routeSummary(idx.data, path)}.</p>
      {story ? (
        <div className="ctdx-actions">
          <a className="ctdx-btn is-primary" href={story}>
            Play this route
          </a>
        </div>
      ) : null}
      {path.flags.length ? (
        <p className="ctdx-flags">
          {path.flags.map((f) => (
            <span key={f} className="ctdx-flag">
              {f}
            </span>
          ))}
        </p>
      ) : null}
      <ol className="ctdx-hops">
        {/* each step reads in its own direction ("Elon Musk invested in Tesla"); the step order carries
            the route, so inverse labels ("investors") never have to work as verbs */}
        {path.hops.map((h, i) => (
          <li key={h.edge.id + i}>
            <ClaimCard idx={idx} e={h.edge} onEntity={props.onEntity} index={i + 1} />
          </li>
        ))}
      </ol>
      <div className="ctdx-notice">
        <strong>{NOTICE}</strong>
        <details className="ctdx-how">
          <summary>How routes are ranked</summary>
          <p>
            Shorter routes through well-backed links come first. Links that rest on weaker sources, and steps through
            very connected hubs, count as longer, so the most specific routes rise to the top. The exact rule is public:
            content/methodology/paths.yaml.
          </p>
        </details>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ two accounts side by side

export function NarrativeDiff(props: {
  idx: GraphIndex;
  a: string;
  b: string;
  setA: (id: string) => void;
  setB: (id: string) => void;
  onEdge: (id: string) => void;
}): ReactNode {
  const { idx, a, b } = props;
  const persp = idx.data.perspectives;
  const lists = useMemo(() => {
    const edges = [...idx.edges.values()];
    const onlyA = edges.filter((e) => e.according_to.includes(a) && !e.according_to.includes(b));
    const onlyB = edges.filter((e) => e.according_to.includes(b) && !e.according_to.includes(a));
    // Only links that both chosen sides' own records back; never a stand-in list when there are none.
    const both = edges.filter((e) => e.cross_confirmed && e.voices.includes(a) && e.voices.includes(b));
    return { onlyA, onlyB, confirmed: both };
  }, [idx, a, b]);
  if (persp.length < 1) return <p className="ctdx-note">Nothing here is told by one side only yet, so there is nothing to compare.</p>;

  const select = (value: string, set: (v: string) => void, label: string) => (
    <label className="ctdx-field">
      <span>{label}</span>
      <select value={value} onChange={(e) => set(e.target.value)}>
        {persp.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>
    </label>
  );
  const list = (edges: GEdge[], empty: string) =>
    edges.length ? (
      <ul className="ctdx-plain ctdx-diff-list">
        {edges.map((e) => (
          <li key={e.id}>
            <button type="button" className="ctdx-row" onClick={() => props.onEdge(e.id)}>
              {sentenceText(sentence(idx, e))}
            </button>
            <Badges idx={idx} e={e} compact />
          </li>
        ))}
      </ul>
    ) : (
      <p className="ctdx-note">{empty}</p>
    );

  return (
    <div className="ctdx-details ctdx-diff">
      <p className="ctdx-kind">Compare accounts</p>
      <h2>Two accounts, one record</h2>
      <div className="ctdx-diff-pick">
        {select(a, props.setA, 'One side')}
        {select(b, props.setB, 'The other side')}
      </div>
      <h3 className="ctdx-section-h">
        Only in {nameOf(idx, a)}'s account <span className="ctdx-count">{lists.onlyA.length}</span>
      </h3>
      {list(lists.onlyA, 'Nothing that only this side says.')}
      <h3 className="ctdx-section-h">
        Only in {nameOf(idx, b)}'s account <span className="ctdx-count">{lists.onlyB.length}</span>
      </h3>
      {list(lists.onlyB, 'Nothing that only this side says.')}
      <h3 className="ctdx-section-h">
        Both sides agree <span className="ctdx-count">{lists.confirmed.length}</span>
      </h3>
      {list(lists.confirmed, 'No link is backed by both sides’ own records yet.')}
    </div>
  );
}

// ------------------------------------------------------------------ before anything is picked

export function Intro({ idx }: { idx: GraphIndex }): ReactNode {
  const d = idx.data;
  return (
    <div className="ctdx-details ctdx-intro">
      <h2>See how things connect</h2>
      <p className="ctdx-summary">
        Start from a person, place or event, then click a dot to open its links. Or put two names in “Find a route” to
        see how they are connected, step by step, with the proof for each link.
      </p>
      <p className="ctdx-note">
        {d.nodes.length} entries and {d.edges.length} links so far.
      </p>
    </div>
  );
}
