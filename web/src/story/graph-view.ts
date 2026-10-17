// Lazy chunk: sigma on a paper theme for graph shots. Entities and claims reveal cumulatively.
import { gsap } from 'gsap';
import Graph from 'graphology';
import forceAtlas2 from 'graphology-layout-forceatlas2';
import Sigma from 'sigma';
import type { EdgeDisplayData, NodeDisplayData } from 'sigma/types';
import { edgesForRef, sentence } from '../lib/claims';
import { FADED_TEXT_ALPHA, glColor, mix, tokenRgb, tokenString, type RGB } from '../lib/color';
import type { GraphIndex } from '../lib/data';
import { timeState } from '../lib/dates';
import { edgeTime } from '../lib/filters';
import { measureText } from '../lib/labels';
import { capPixelRatio, drawPlacedLabels, makeHoverDrawer } from '../lib/sigma-draw';
import type { GEdge, Shot } from '../lib/types';

export interface GraphView {
  /** Show shot i; returns how many of the revealed entities and claims were already over at the shot's time. */
  apply(i: number, reduced: boolean): { past: number };
  resize(): void;
  destroy(): void;
}

interface Step {
  nodes: Set<string>;
  edges: Set<string>;
}

function hash01(s: string, salt = 0): number {
  let h = 0x811c9dc5 ^ salt;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return ((h >>> 0) % 100000) / 100000;
}

export function createGraphView(container: HTMLElement, idx: GraphIndex, shots: Shot[]): GraphView {
  const paper = tokenRgb('--paper', [237, 241, 239], container);
  const ink = tokenRgb('--ink', [29, 29, 31], container);
  const accent = tokenRgb('--accent', [0, 102, 204], container);
  // Calm graph: gray dots and lines; the accent marks the focus and what this shot adds.
  const nodeGray = tokenRgb('--graph-node', [142, 142, 147], container);
  const edgeGray = tokenRgb('--graph-edge', [199, 199, 204], container);
  const theme = { ink, ground: paper, muted: tokenRgb('--muted', [104, 120, 134], container), font: tokenString('--font-ui', 'system-ui, sans-serif', container) };

  // What each shot adds; the union is laid out once so positions stay put while the story grows.
  const own: Step[] = shots.map((s) => {
    const edges = new Set<string>();
    const nodes = new Set<string>([...(s.reveal ?? []), ...(s.focus ? [s.focus] : [])].filter((id) => idx.nodes.has(id)));
    for (const ref of s.reveal_claims ?? []) {
      for (const e of edgesForRef(idx, ref)) {
        edges.add(e.id);
        nodes.add(e.from);
        nodes.add(e.to);
      }
    }
    return { nodes, edges };
  });
  const cumulative: Step[] = [];
  own.forEach((step, i) => {
    const prev = cumulative[i - 1] ?? { nodes: new Set<string>(), edges: new Set<string>() };
    cumulative.push({ nodes: new Set([...prev.nodes, ...step.nodes]), edges: new Set([...prev.edges, ...step.edges]) });
  });
  const all = cumulative[cumulative.length - 1] ?? { nodes: new Set<string>(), edges: new Set<string>() };

  const graph = new Graph({ multi: true, type: 'directed' });
  const maxDeg = Math.max(1, ...[...all.nodes].map((id) => idx.nodes.get(id)?.degree ?? 1));
  for (const id of [...all.nodes].sort()) {
    const n = idx.nodes.get(id)!;
    const a = hash01(id) * Math.PI * 2;
    graph.addNode(id, {
      x: Math.cos(a) * 10,
      y: Math.sin(a) * 10,
      size: 7 + 7 * Math.sqrt((n.degree || 1) / maxDeg),
      rgb: nodeGray,
      label: n.name,
      subLabel: idx.data.types[n.type]?.label ?? n.type,
    });
  }
  for (const id of [...all.edges].sort()) {
    const e = idx.edges.get(id)!;
    if (e.from === e.to) continue;
    // The arrow runs from the claim's owner, so it reads "founded", or "mother of" for a family role.
    const s = sentence(idx, e);
    graph.addDirectedEdgeWithKey(id, e.from, e.to, {
      size: 2.4,
      rgb: edgeGray,
      label: s.phrase,
      claim: e,
    });
  }
  if (graph.order > 2) {
    forceAtlas2.assign(graph, {
      iterations: 400,
      settings: { ...forceAtlas2.inferSettings(graph), gravity: 2, scalingRatio: 30, strongGravityMode: true, slowDown: 2 },
    });
  } else {
    graph.forEachNode((id, _a) => {
      const i = [...all.nodes].sort().indexOf(id);
      graph.mergeNodeAttributes(id, { x: i * 20, y: 0 });
    });
  }

  let step = -1;
  let shot: Shot | undefined;
  const appear = new Map<string, number>(); // reveal progress 0..1 per node/edge id
  const tweens: gsap.core.Tween[] = [];

  const visibleNodes = () => cumulative[step]?.nodes ?? new Set<string>();
  const visibleEdges = () => cumulative[step]?.edges ?? new Set<string>();

  const renderer = new Sigma(graph, container, {
    allowInvalidContainer: true,
    renderEdgeLabels: true,
    defaultEdgeType: 'arrow',
    labelFont: theme.font,
    labelSize: 15,
    labelWeight: '600',
    // Labels are placed after each render so they never overlap (sigma's label grid does not measure text).
    renderLabels: false,
    edgeLabelFont: theme.font,
    edgeLabelSize: 13,
    edgeLabelWeight: '500',
    edgeLabelColor: { color: `rgb(${theme.muted.join(',')})` },
    stagePadding: 70,
    zIndex: true,
    enableCameraZooming: false,
    enableCameraPanning: false,
    defaultDrawNodeHover: makeHoverDrawer(theme),
    nodeReducer: (node, data): Partial<NodeDisplayData> => {
      const res = { ...data } as Partial<NodeDisplayData> & Record<string, unknown>;
      if (!visibleNodes().has(node)) return { ...res, hidden: true };
      const isNew = own[step]?.nodes.has(node);
      // The chapter shows the world as of the shot's time: not yet begun = hidden, over = faded. What the
      // shot itself reveals is its subject, so its time never hides or fades it.
      const time = isNew ? 'current' : timeState(idx.nodes.get(node)?.when, shot?.t);
      if (time === 'future') return { ...res, hidden: true };
      const p = appear.get(node) ?? 1;
      const isFocus = shot?.focus === node;
      const base = data.rgb as RGB;
      res.size = (data.size as number) * (isFocus ? 1.35 : 1) * (0.2 + 0.8 * p);
      res.color = glColor(isFocus ? accent : time === 'past' ? mix(base, paper, 0.55) : isNew ? mix(base, ink, 0.35) : base);
      res.highlighted = isFocus;
      res.forceLabel = true;
      res.zIndex = isFocus ? 3 : isNew ? 2 : 1;
      res.labelAlpha = time === 'past' && !isFocus ? p * FADED_TEXT_ALPHA : p;
      return res;
    },
    edgeReducer: (edge, data): Partial<EdgeDisplayData> => {
      const res = { ...data } as Partial<EdgeDisplayData> & Record<string, unknown>;
      if (!visibleEdges().has(edge)) return { ...res, hidden: true };
      const e = data.claim as GEdge;
      const isNew = own[step]?.edges.has(edge);
      const time = isNew ? 'current' : edgeTime(idx, e, shot?.t ?? null);
      if (time === 'future') return { ...res, hidden: true };
      const p = appear.get(edge) ?? 1;
      const persp = shot?.perspective;
      let alpha = e.according_to.length ? 0.55 : 0.9;
      let color = data.rgb as RGB;
      if (persp && e.according_to.length && !e.according_to.includes(persp)) alpha = 0.18;
      if (persp && e.according_to.includes(persp)) alpha = 1;
      if (isNew) {
        alpha = Math.max(alpha, 0.95);
        color = accent;
        res.size = 3.2;
      } else color = mix(color, ink, 0.2);
      if (time === 'past') alpha *= 0.4;
      res.color = glColor(color, alpha * p);
      // only this shot's own links are named, and only a few: more piled up around a hub (the narration
      // and the quote card say the details)
      if (!isNew || (own[step]?.edges.size ?? 0) > 3 || p < 0.6 || alpha < 0.3) res.label = '';
      return res;
    },
  });

  capPixelRatio(renderer);
  // The focus first, then what this shot reveals, then the rest (the reducer's zIndex), bigger dots first.
  /** What sits over the stage, in its pixels: the time pills, the quote card, the player's controls. */
  function covers(): { x0: number; y0: number; x1: number; y1: number }[] {
    const host = container.getBoundingClientRect();
    const story = container.closest('ctd-story');
    return [...(story?.querySelectorAll<HTMLElement>('.story-hud, .story-overlay .story-card, .story-controls') ?? [])]
      .filter((el) => el.offsetWidth && el.offsetHeight)
      .map((el) => {
        const r = el.getBoundingClientRect();
        return { x0: r.left - host.left, y0: r.top - host.top, x1: r.right - host.left, y1: r.bottom - host.top };
      })
      .filter((b) => b.x1 > 0 && b.y1 > 0 && b.x0 < host.width && b.y0 < host.height);
  }
  // Whole labels only, never under the pills or cards: the reader cannot pan a story's graph.
  renderer.on('afterRender', () =>
    drawPlacedLabels(renderer, theme, { px: 15, weight: 600, priority: (_n, d) => (d.zIndex ?? 0) * 1e6 + d.size, inside: true, avoid: covers() }),
  );
  // For tests (headless checks read the camera and node positions).
  (container as HTMLElement & { __renderer?: unknown }).__renderer = renderer;

  /**
   * Frame the revealed entries: about 13% padding on every side of the pane, room for the labels that
   * run to the right of the dots, and none of them under the overlay card (bottom right).
   */
  function fit(reduced: boolean): void {
    renderer.refresh();
    const pts: { d: NodeDisplayData; label: string }[] = [];
    // frame what this shot is about (its reveals and focus), not everything shown so far
    const mine = own[step]?.nodes.size ? own[step].nodes : visibleNodes();
    for (const id of mine) {
      const d = renderer.getNodeDisplayData(id);
      if (d && !d.hidden) pts.push({ d, label: d.label ?? '' });
    }
    if (!pts.length) return;
    const { width: W, height: H } = renderer.getDimensions();
    if (!W || !H) return;
    // Screen scale of framed-graph units at ratio 1 (sigma flips y, so keep the signs).
    const cam1 = { cameraState: { x: 0.5, y: 0.5, ratio: 1, angle: 0 } };
    const o = renderer.framedGraphToViewport({ x: 0.5, y: 0.5 }, cam1);
    const sx = (renderer.framedGraphToViewport({ x: 0.6, y: 0.5 }, cam1).x - o.x) / 0.1;
    const sy = (renderer.framedGraphToViewport({ x: 0.5, y: 0.6 }, cam1).y - o.y) / 0.1;
    const xs = pts.map((p) => p.d.x);
    const ys = pts.map((p) => p.d.y);
    const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
    // Dots and labels keep their pixel size while zooming, so they are margins, not part of the box.
    const font = theme.font;
    const labelW = Math.max(0, ...pts.map((p) => (p.label ? measureText(p.label, 15, font, 600) : 0)));
    const dot = Math.max(...pts.map((p) => renderer.scaleSize(p.d.size))) + 4;
    let left = W * 0.13 + dot;
    // labels may also sit left of, above or below their dots (drawPlacedLabels), so the long ones need
    // not all fit on the right: on a phone that left no room for the graph at all
    let right = W * 0.13 + dot + Math.min(labelW, W * 0.22);
    let top = H * 0.13 + dot;
    let bottom = H * 0.13 + dot;
    // the time pills and the controls take bands at the top (and, on phones, the bottom) of the stage
    for (const b of covers()) {
      if (b.y1 <= H / 2) top = Math.max(top, b.y1 + dot + 6);
      else if (b.x1 - b.x0 > W * 0.6 && b.y0 >= H / 2) bottom = Math.max(bottom, H - b.y0 + dot + 6);
    }
    // Keep the overlay card's corner free: give up whichever band (bottom or right) costs less room.
    const cards = shot?.overlay ? container.parentElement?.querySelectorAll<HTMLElement>('.story-overlay .story-card') : undefined;
    const card = cards && cards.length ? cards[cards.length - 1] : null;
    if (card && card.offsetHeight && card.offsetWidth) {
      // Measured from where the card sits in the pane (on phones it stands above the controls), by layout
      // offsets, which its entrance animation does not move.
      const box = card.offsetParent as HTMLElement | null;
      const cw = W - ((box?.offsetLeft ?? 0) + card.offsetLeft) + 12;
      const ch = H - ((box?.offsetTop ?? 0) + card.offsetTop) + 12;
      if (ch * W <= cw * H) bottom = Math.max(bottom, ch + dot);
      else right = Math.max(right, cw + dot);
    }
    const availW = Math.max(40, W - left - right);
    const availH = Math.max(40, H - top - bottom);
    const boxW = Math.abs((x1 - x0) * sx);
    const boxH = Math.abs((y1 - y0) * sy);
    const ratio = Math.max(0.3, Math.min(3, Math.max(boxW / availW, boxH / availH, 0.3)));
    // Put the box centre at the centre of the free area.
    const ax = left + availW / 2;
    const ay = top + availH / 2;
    const state = {
      x: (x0 + x1) / 2 - ((ax - W / 2) * ratio) / sx,
      y: (y0 + y1) / 2 - ((ay - H / 2) * ratio) / sy,
      ratio,
    };
    moveCamera(state, reduced ? 0 : 0.9);
  }

  /**
   * The reader scrolls the page, so the graph ignores wheel and drag (sigma's camera flags are off).
   * Those flags also block programmatic moves in sigma 3, so switch them on only while we set a state.
   */
  let camTween: gsap.core.Tween | null = null;
  function moveCamera(target: { x: number; y: number; ratio: number }, seconds: number): void {
    const camera = renderer.getCamera();
    const set = (state: { x: number; y: number; ratio: number }) => {
      camera.enabledPanning = camera.enabledZooming = true;
      camera.setState(state);
      camera.enabledPanning = camera.enabledZooming = false;
    };
    camTween?.kill();
    camTween = null;
    if (seconds <= 0) {
      set(target);
      return;
    }
    const from = camera.getState();
    const p = { t: 0 };
    camTween = gsap.to(p, {
      t: 1,
      duration: seconds,
      ease: 'power2.inOut',
      onUpdate: () =>
        set({
          x: from.x + (target.x - from.x) * p.t,
          y: from.y + (target.y - from.y) * p.t,
          ratio: from.ratio * Math.pow(target.ratio / from.ratio, p.t),
        }),
    });
  }

  const ro = new ResizeObserver(() => {
    if (container.offsetWidth && container.offsetHeight) renderer.refresh();
  });
  ro.observe(container);

  return {
    apply(i, reduced) {
      const prevNodes = visibleNodes();
      const prevEdges = visibleEdges();
      step = Math.max(0, Math.min(i, shots.length - 1));
      shot = shots[step];
      for (const t of tweens.splice(0)) t.kill();
      appear.clear();
      if (!reduced) {
        const fresh = [...visibleNodes()].filter((n) => !prevNodes.has(n));
        const freshEdges = [...visibleEdges()].filter((e) => !prevEdges.has(e));
        const items = [...fresh.map((id) => ({ id, delay: 0.15 })), ...freshEdges.map((id) => ({ id, delay: 0.55 }))];
        for (const { id, delay } of items) {
          const st = { p: 0 };
          appear.set(id, 0);
          tweens.push(
            gsap.to(st, {
              p: 1,
              duration: 0.9,
              delay,
              ease: 'power2.out',
              onUpdate: () => {
                appear.set(id, st.p);
                renderer.refresh();
              },
            }),
          );
        }
      }
      renderer.refresh();
      fit(reduced);
      const t = shot?.t;
      let past = 0;
      if (t != null) {
        for (const n of visibleNodes()) if (timeState(idx.nodes.get(n)?.when, t) === 'past') past++;
        for (const id of visibleEdges()) {
          const e = idx.edges.get(id);
          if (e && edgeTime(idx, e, t) === 'past') past++;
        }
      }
      return { past };
    },
    resize() {
      renderer.refresh();
    },
    destroy() {
      for (const t of tweens.splice(0)) t.kill();
      camTween?.kill();
      ro.disconnect();
      renderer.kill();
    },
  };
}
