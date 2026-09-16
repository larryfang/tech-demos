export type CloneId = "ranking-goat" | "podcast-creatine"
export type SlotKind = "broll" | "caption" | "effect"
export type InvariantKind = "shot" | "pacing" | "layout" | "karaoke" | "format"

export interface Invariant {
  id: string
  kind: InvariantKind
  label: string
  detail: string
}

export interface VariantOption {
  id: string
  label: string
  summary: string
  insert: string
}

export interface VariableSlot {
  id: string
  kind: SlotKind
  label: string
  options: VariantOption[]
}

export interface EventAnchor {
  id: string
  word: string
  line: string
  speaker?: string
  beat: string
  slots: SlotKind[]
}

export interface SampleClone {
  id: CloneId
  title: string
  format: "ranking" | "podcast"
  duration: string
  aspect: "9:16"
  source: string
  hook: string
  script: string[]
  invariants: Invariant[]
  variables: VariableSlot[]
  anchors: EventAnchor[]
}

export type VariantPicks = Record<string, string>

export interface ResolvedSlot {
  id: string
  kind: SlotKind
  label: string
  option: VariantOption
}

export interface ResolvedAnchor {
  id: string
  word: string
  line: string
  speaker?: string
  beat: string
  broll?: VariantOption
  caption?: VariantOption
  effect?: VariantOption
}

export interface ComposedClone {
  clone: SampleClone
  slots: ResolvedSlot[]
  anchors: ResolvedAnchor[]
}
