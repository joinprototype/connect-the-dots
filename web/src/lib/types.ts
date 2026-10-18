// Types for the build output contract (docs/data-contract.md, v0).

/** Decimal years, astronomical numbering (0 = 1 BCE). `end: null` = open or ongoing. */
export interface CtdDate {
  start: number;
  end: number | null;
  label: string;
  /** Only the end is known ("until 1 Dec 2009"): it holds at any time before then, and `start` is
   *  where its end falls, for ordering. */
  open_start?: boolean;
}

export interface LayerDef {
  label: string;
  color: string;
}

export interface TypeDef {
  label: string;
  plural: string;
  layer: string;
  color: string;
}

export interface RelationDef {
  label: string;
  inverse: string;
  layers: string[];
  traversable: boolean;
  passive: boolean;
  sensitive: boolean;
  /** Family ties. A `role` qualifier ("mother") describes the claim's owner (`from`), not its target. */
  kinship: boolean;
  /** An interpretation: every claim names whose account it is (`according_to`), and routes never use it. */
  attributed: boolean;
  /** The same body under a new name (`became`): answers about the later form include the earlier one. */
  identity: boolean;
}

export interface LensDef {
  id: string;
  label: string;
  view: string;
  layers: string[];
}

export interface Methodology {
  version?: string;
  beta: number;
  lambda: number;
  delta_undated: number;
  k_paths: number;
  reuse_penalty: number;
  max_hops: number;
  collapse_passive?: boolean;
  hub_threshold?: number;
  evidence: Record<string, number>;
  default_weight: number;
  weights: Record<string, number>;
}

export interface GNode {
  id: string;
  type: string;
  name: string;
  summary?: string | null;
  aliases?: string[];
  when: CtdDate | null;
  /** [lon, lat] */
  coords: [number, number] | null;
  place: string | null;
  url: string;
  degree: number;
}

export interface SourceRef {
  id: string;
  at?: string | null;
  quote?: string | null;
  /** Whose words the quote is, when not the source's own voice (a speaker quoted in a report). */
  by?: string;
}

export type ClaimStatus = 'published' | 'draft' | 'disputed' | 'deprecated';

export interface GEdge {
  id: string;
  from: string;
  to: string;
  rel: string;
  /** The relation label. Read from the target's side, use relations[rel].inverse. */
  label: string;
  /** The qualifiers as text, e.g. "co-founder, 6%, as of 30 Jun 2026"; a `role` comes first. Omitted when there are none. */
  detail?: string;
  layers: string[];
  when: CtdDate | null;
  /** [] = presented as documented fact. */
  according_to: string[];
  sources: SourceRef[];
  /** Strongest source tier (a key of `tiers`); null only for a claim without sources. */
  tier: string | null;
  voices: string[];
  cross_confirmed: boolean;
  status: ClaimStatus | string;
  passive: boolean;
  traversable: boolean;
  /** The claim's qualifiers as written (`role`, `title`, `percent`, `as_of`, ...); `detail` is their text. */
  qualifiers: Record<string, unknown>;
  /** The author's note on the claim. */
  note?: string;
  /** Why a claim is disputed or deprecated. */
  reason?: string;
  /** The explorer has loaded this link's words and proof (qualifiers, note, sources): see loadDetails.
   *  A story's own links always carry them. */
  full?: boolean;
}

export interface Perspective {
  id: string;
  name: string;
  claims: number;
}

export interface SourceDef {
  title: string;
  publisher: string | null;
  /** Display name of the publisher entity (engine extra). */
  publisher_name?: string | null;
  /** Display text for `published` (engine extra). */
  published_label?: string | null;
  url: string | null;
  tier: string;
  voice?: string | null;
  published?: string | null;
  archive_url?: string | null;
}

export interface TierDef {
  label: string;
  description: string | null;
  /** Sources of this tier are refused by `ctd check`. */
  rejected: boolean;
}

/** The route stories the build generated, at /p/<a>--<b>/ ("a--b", directional). An entry's life story
 *  is in its detail file (`story`). */
export interface StoryIndex {
  paths: string[];
}

/** One group of a question: links pointing at the subject (`in`) or owned by it (`out`). */
export interface QuestionGroup {
  label: string;
  in: string[];
  out: string[];
  /** Said when no link answers the group; null: the group is left out. */
  empty: string | null;
}

/** A question from content/schema/questions.yaml, in Ask-picker order. */
export interface QuestionDef {
  id: string;
  /** The sentence: {x} is the subject; a route question has {a} and {b}. */
  ask: string;
  /** The words before the first blank: the picker's label. */
  label: string;
  /** Answered by routes (/x/?from=&to=), with no pages of its own. */
  route: boolean;
  subjects: string[];
  shows: string;
  not: string;
  groups: QuestionGroup[];
  min: number;
}

export interface GraphData {
  meta: { engine: string; built: string; commit: string | null; methodology: string };
  /** Source tiers (content/schema/source-tiers.yaml): readers see labels, never codes. */
  tiers: Record<string, TierDef>;
  stories: StoryIndex;
  questions: QuestionDef[];
  layers: Record<string, LayerDef>;
  types: Record<string, TypeDef>;
  relations: Record<string, RelationDef>;
  lenses: LensDef[];
  methodology: Methodology;
  nodes: GNode[];
  edges: GEdge[];
  perspectives: Perspective[];
  sources: Record<string, SourceDef>;
}

/** One entry of search.json: an entity (url /e/<id>/), a chapter (type "chapter", url /c/<id>/)
 *  or a question page (type "question", id "<q>/<entity id>", url /q/<q>/<entity id>/). */
export interface SearchEntry {
  id: string;
  name: string;
  aliases?: string[];
  type: string;
  summary?: string | null;
  /** Entity entries: the entry's dates as a label, or null. */
  when?: string | null;
  url: string;
  /** Entity entries: the questions with a page about this entry. */
  q?: string[];
  /** Best-connected first, across all search files. */
  rank: number;
}

export interface ShotCamera {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
  globe?: boolean;
  /** seconds */
  duration?: number;
}

export interface ShotOverlay {
  kind: 'source' | 'quote' | 'image';
  source?: string;
  quote?: string;
  image?: string;
  caption?: string;
}

export interface Shot {
  shot: string;
  view?: 'map' | 'graph' | 'timeline';
  camera?: ShotCamera;
  focus?: string;
  lens?: string;
  perspective?: string;
  time?: string;
  t?: number | null;
  /** Display text for `t`, e.g. "Oct 1962". */
  time_label?: string | null;
  reveal?: string[];
  reveal_claims?: string[];
  places?: string[];
  routes?: [string, string][];
  overlay?: ShotOverlay | null;
  narration?: string;
  narration_html?: string;
  duration?: number;
  explore?: boolean;
}
