import { useEffect, useId, useMemo, useRef, useState, type ReactNode } from 'react';
import { sentence, sourceView } from '../lib/claims';
import { claimNotes, statusWords, tierLabel } from '../lib/plain';
import { nameOf, type GraphIndex } from '../lib/data';
import { formatYear, MONTHS_AFTER } from '../lib/dates';
import { fuzzySearch, splitRanges, type FuzzyHit } from '../lib/fuzzy';
import { candidates } from '../lib/search';
import type { GEdge, SearchEntry } from '../lib/types';

// ------------------------------------------------------------------ autocomplete

export function EntityPicker(props: {
  idx: GraphIndex;
  label: string;
  value: string | null;
  placeholder?: string;
  onPick: (id: string | null) => void;
  compact?: boolean;
  /** The big start-screen field. */
  big?: boolean;
  hideLabel?: boolean;
}): ReactNode {
  const { idx, value, onPick } = props;
  const id = useId();
  const [text, setText] = useState('');
  const [editing, setEditing] = useState(false);
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hits, setHits] = useState<FuzzyHit<SearchEntry>[]>([]);
  useEffect(() => {
    if (!editing || !text.trim()) {
      setHits([]);
      return;
    }
    let live = true;
    // names and aliases come from search; only entries on the map can be picked
    void candidates(text)
      .catch(() => [])
      .then((list) => live && setHits(fuzzySearch(list.filter((e) => idx.nodes.has(e.id) && e.type in idx.data.types), text, 7)));
    return () => {
      live = false;
    };
  }, [idx, text, editing]);
  const shown = editing ? text : value ? nameOf(idx, value) : '';
  const open = editing && text.trim().length > 0;

  const pick = (nodeId: string) => {
    onPick(nodeId);
    setEditing(false);
    setText('');
    inputRef.current?.blur();
  };

  return (
    <div className={`ctdx-picker${props.compact ? ' is-compact' : ''}${props.big ? ' is-big' : ''}`}>
      <label htmlFor={`${id}-in`} className={props.hideLabel ? 'sr-only' : undefined}>
        {props.label}
      </label>
      <div className="ctdx-picker-field">
        {value && !editing ? <span className="ctdx-type-dot" style={typeDot(idx, idx.nodes.get(value))} aria-hidden="true" /> : null}
        <input
          id={`${id}-in`}
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-autocomplete="list"
          aria-activedescendant={open && hits[active] ? `${id}-o${active}` : undefined}
          autoComplete="off"
          spellCheck={false}
          placeholder={props.placeholder ?? 'Type a name…'}
          value={shown}
          onFocus={() => {
            setEditing(true);
            setText('');
            setActive(0);
          }}
          onBlur={() => setEditing(false)}
          onChange={(e) => {
            setText(e.target.value);
            setActive(0);
          }}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
              e.preventDefault();
              if (!hits.length) return;
              setActive((a) => (a + (e.key === 'ArrowDown' ? 1 : -1) + hits.length) % hits.length);
            } else if (e.key === 'Enter') {
              e.preventDefault();
              if (hits[active]) pick(hits[active].item.id);
            } else if (e.key === 'Escape') {
              setEditing(false);
              inputRef.current?.blur();
            }
          }}
        />
        {value && !editing ? (
          <button type="button" className="ctdx-clear" aria-label={`Clear ${props.label}`} onClick={() => onPick(null)}>
            ×
          </button>
        ) : null}
      </div>
      {open ? (
        <ul className="ctdx-options" id={`${id}-list`} role="listbox">
          {hits.length === 0 ? <li className="ctdx-option-empty">No matches</li> : null}
          {hits.map((h, i) => (
            <li
              key={h.item.id}
              id={`${id}-o${i}`}
              role="option"
              aria-selected={i === active}
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => pick(h.item.id)}
              onPointerEnter={() => setActive(i)}
            >
              <span className="ctdx-type-dot" style={typeDot(idx, h.item)} aria-hidden="true" />
              <span className="ctdx-option-name">
                {(h.isAlias ? [{ text: h.item.name, hit: false }] : splitRanges(h.text, h.ranges)).map((p, j) =>
                  p.hit ? <mark key={j}>{p.text}</mark> : <span key={j}>{p.text}</span>,
                )}
              </span>
              <span className="ctdx-option-meta">{h.isAlias ? `“${h.text}”` : (idx.data.types[h.item.type]?.label ?? h.item.type)}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

export function typeDot(idx: GraphIndex, n: { type: string } | undefined): React.CSSProperties {
  const layer = n ? idx.data.types[n.type]?.layer : undefined;
  return { ['--dot' as string]: layer ? `var(--layer-${layer})` : 'var(--night-muted)' };
}

// ------------------------------------------------------------------ claims

export function Badges({ idx, e, compact }: { idx: GraphIndex; e: GEdge; compact?: boolean }): ReactNode {
  const words = statusWords(e);
  const passive = e.passive && !compact;
  // nothing to show: no empty line under the sentence
  if (!e.when && e.according_to.length === 0 && words.length === 0 && !passive) return null;
  return (
    <span className="ctdx-badges">
      {e.when ? <span className="ctdx-badge is-when">{e.when.label}</span> : null}
      {e.according_to.map((a) => (
        <span key={a} className="ctdx-badge is-attrib" title="One side's account">
          {nameOf(idx, a)}'s account
        </span>
      ))}
      {words.map((w) => (
        <span key={w} className={`ctdx-badge${w === 'Both sides agree' ? ' is-confirmed' : ' is-draft'}`}>
          {w}
        </span>
      ))}
      {passive ? <span className="ctdx-badge is-passive">Held for clients</span> : null}
    </span>
  );
}

export function Sentence(props: {
  idx: GraphIndex;
  e: GEdge;
  readFrom?: string;
  onEntity?: (id: string) => void;
}): ReactNode {
  const s = sentence(props.idx, props.e, props.readFrom);
  const ent = (id: string, name: string) =>
    props.onEntity ? (
      <button type="button" className="ctdx-ent" onClick={() => props.onEntity!(id)}>
        {name}
      </button>
    ) : (
      <strong>{name}</strong>
    );
  return (
    <span className="ctdx-sentence">
      {ent(s.subjectId, s.subject)}
      {s.apposition ? ', ' : ' '}
      <span className="ctdx-phrase">{s.phrase}</span> {ent(s.objectId, s.object)}
      {s.detail ? <span className="ctdx-detail"> ({s.detail})</span> : null}
    </span>
  );
}

/** The proof of a link: each source, how strong it is in plain words, the quoted passage highlighted. */
export function Sources({ idx, e }: { idx: GraphIndex; e: GEdge }): ReactNode {
  if (!e.sources.length) return null;
  return (
    <div className="ctdx-proof">
      <p className="ctdx-proof-h">Proof</p>
      <ol className="ctdx-sources">
        {e.sources.map((ref, i) => {
          const s = sourceView(idx, ref.id, ref.at, ref.quote);
          const strength = tierLabel(idx.data, s.tier);
          return (
            <li key={`${ref.id}-${i}`}>
              {s.url ? (
                <a href={s.url} target="_blank" rel="external noopener noreferrer">
                  {s.title}
                </a>
              ) : (
                <span>{s.title}</span>
              )}
              <span className="ctdx-src-meta">
                {[s.publisher, s.published, s.at].filter(Boolean).join(' · ')}
                {strength ? <span className="ctdx-badge is-tier">{strength}</span> : null}
                {s.archive ? (
                  <a className="ctdx-archive" href={s.archive} target="_blank" rel="external noopener noreferrer">
                    archived copy
                  </a>
                ) : null}
              </span>
              {s.quote ? (
                <span className="ctdx-quote-wrap">
                  <q className="ctdx-quote">{s.quote}</q>
                </span>
              ) : null}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export function ClaimCard(props: {
  idx: GraphIndex;
  e: GEdge;
  readFrom?: string;
  onEntity?: (id: string) => void;
  index?: number;
}): ReactNode {
  const { idx, e } = props;
  return (
    <article className={`ctdx-claim${e.according_to.length ? ' is-attributed' : ''}${e.status === 'draft' ? ' is-draft' : ''}`}>
      {props.index != null ? <span className="ctdx-hop-n">{props.index}</span> : null}
      <p>
        <Sentence idx={idx} e={e} readFrom={props.readFrom} onEntity={props.onEntity} />
      </p>
      <Badges idx={idx} e={e} />
      {claimNotes(e).map((text) => (
        <p key={text} className="ctdx-claim-note">
          {text}
        </p>
      ))}
      <Sources idx={idx} e={e} />
    </article>
  );
}

// ------------------------------------------------------------------ time slider

const CURVE = 2.2;

export function TimeSlider(props: {
  range: [number, number];
  t: number | null;
  onChange: (t: number | null) => void;
}): ReactNode {
  const [min, max] = props.range;
  const span = Math.max(1, max - min);
  // Recent centuries get more room: position s in [0, 1] -> year.
  const toYear = (s: number) => max - span * Math.pow(1 - s, CURVE);
  const toPos = (y: number) => 1 - Math.pow(Math.max(0, Math.min(1, (max - y) / span)), 1 / CURVE);
  const [playing, setPlaying] = useState(false);
  const raf = useRef(0);
  const onChange = useRef(props.onChange);
  onChange.current = props.onChange;
  // Input events can fire far more often than frames: keep the thumb where the pointer is (draft) and
  // hand the parent at most one new time per animation frame.
  const [draft, setDraft] = useState<number | null>(null);
  const pendingT = useRef<number | null | undefined>(undefined);
  const frame = useRef(0);
  const flush = () => {
    frame.current = 0;
    const value = pendingT.current;
    pendingT.current = undefined;
    if (value !== undefined) onChange.current(value);
    setDraft(null);
  };
  const emitSoon = (value: number | null) => {
    pendingT.current = value;
    if (!frame.current) frame.current = requestAnimationFrame(flush);
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  useEffect(() => {
    if (!playing) return;
    let last = performance.now();
    const from = props.t == null ? 0 : toPos(props.t);
    let pos = from >= 0.999 ? 0 : from;
    let lastYear = NaN;
    const step = (now: number) => {
      pos = Math.min(1, pos + (now - last) / 14000);
      last = now;
      const y = Math.round(toYear(pos) * 4) / 4;
      if (y !== lastYear) {
        lastYear = y;
        onChange.current(y);
      }
      if (pos >= 1) return setPlaying(false);
      raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing]);

  const ticks = useMemo(() => {
    const cands = [-3000, -2000, -1000, -500, 1, 500, 1000, 1500, 1800, 1900, 1950, 2000];
    const kept: number[] = [];
    let last = 0;
    for (const y of cands) {
      const p = toPos(y);
      if (y <= min || y >= max || p - last < 0.22 || p > 0.8) continue;
      kept.push(y);
      last = p;
    }
    return kept;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [min, max, span]);

  const pos = draft != null ? draft : props.t == null ? 1 : toPos(props.t);
  const shownT = draft != null ? toYear(draft) : props.t;
  const label = shownT == null ? 'All time' : formatYear(shownT, max - min < 300 || shownT > MONTHS_AFTER);
  return (
    <div className="ctdx-time">
      <div className="ctdx-time-head">
        <button
          type="button"
          className="ctdx-play"
          aria-label={playing ? 'Pause' : 'Play through time'}
          aria-pressed={playing}
          onClick={() => setPlaying((p) => !p)}
        >
          {playing ? (
            <svg viewBox="0 0 16 16" aria-hidden="true"><rect x="3" y="2.5" width="3.4" height="11" rx="1" /><rect x="9.6" y="2.5" width="3.4" height="11" rx="1" /></svg>
          ) : (
            <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M4 2.6v10.8a.6.6 0 0 0 .9.5l8.6-5.4a.6.6 0 0 0 0-1L4.9 2.1a.6.6 0 0 0-.9.5z" /></svg>
          )}
        </button>
        <output className="ctdx-time-label" aria-live="polite">
          {label}
        </output>
        {props.t != null ? (
          <button type="button" className="ctdx-link" onClick={() => { setPlaying(false); props.onChange(null); }}>
            All time
          </button>
        ) : null}
      </div>
      <input
        type="range"
        min={0}
        max={1000}
        step={1}
        value={Math.round(pos * 1000)}
        aria-label="Time"
        aria-valuetext={label}
        onChange={(e) => {
          setPlaying(false);
          const s = Number(e.target.value) / 1000;
          setDraft(s);
          emitSoon(s >= 0.9995 && props.t == null ? null : Math.round(toYear(s) * 100) / 100);
        }}
        style={{ ['--pos' as string]: `${pos * 100}%` }}
      />
      <div className="ctdx-ticks" aria-hidden="true">
        <span style={{ left: '0%' }}>{formatYear(min)}</span>
        {ticks.map((y) => (
          <span key={y} className="is-minor" style={{ left: `${toPos(y) * 100}%` }}>
            {formatYear(y)}
          </span>
        ))}
        <span style={{ left: '100%' }}>{formatYear(max)}</span>
      </div>
      <p className="ctdx-hint ctdx-time-hint">
        {props.t == null ? (
          'Drag to see the map as of a date.'
        ) : (
          <>
            As of {label}: what had ended is <span className="ctdx-past-chip">faded</span>, what had not begun is hidden. Undated
            entries always show.
          </>
        )}
      </p>
    </div>
  );
}
