export const CONTRACT_VERSION = "2.6" as const

export type Delivery =
  | "not_delivered"
  | "delivered_unverified"
  | "delivered_verified"
  | "delivery_uncertain"
  | "unknown"

export type Retry = "safe" | "unsafe" | "unknown"

export type Disposition = {
  delivery: Delivery
  retry: Retry
}

export type AxNode = {
  role: string
  name?: string
  value?: string
  ref_id?: string
  available_actions?: string[]
  states?: string[]
  children?: AxNode[]
}

export type SnapshotData = {
  app: string
  snapshot_id: string
  ref_count: number
  complete: boolean
  window?: { id: string; title: string }
  tree: AxNode
}

export type ActionData = {
  action: string
  ref_id: string
  disposition: Disposition
}

export type Recovery = {
  strategy: string
  retryable: boolean
  requires_fresh_snapshot: boolean
}

export type ErrorObject = {
  code: string
  message: string
  suggestion?: string
  recovery?: Recovery
  disposition: Disposition
}

export type OkEnvelope<C extends string, D> = {
  version: typeof CONTRACT_VERSION
  ok: true
  command: C
  data: D
}

export type ErrEnvelope<C extends string = string> = {
  version: typeof CONTRACT_VERSION
  ok: false
  command: C
  error: ErrorObject
}

export type Envelope<C extends string = string, D = unknown> =
  | OkEnvelope<C, D>
  | ErrEnvelope<C>

export type SnapshotEnvelope = OkEnvelope<"snapshot", SnapshotData>
export type ClickEnvelope = OkEnvelope<"click", ActionData>
export type TypeEnvelope = OkEnvelope<"type", ActionData>

export type CommandName = "snapshot" | "click" | "type" | "list-apps"

export type HistoryEntry = {
  id: number
  at: number
  command: string
  ok: boolean
  label: string
  envelope: Envelope
}

export type DiffKind = "added" | "removed" | "changed" | "unchanged"

export type FieldChange = "role" | "name" | "value" | "states" | "actions"

export type NodeDiff = {
  identity: string
  kind: DiffKind
  path: string
  before?: AxNode
  after?: AxNode
  changes?: FieldChange[]
}

export type TreeDiff = {
  added: NodeDiff[]
  removed: NodeDiff[]
  changed: NodeDiff[]
  byIdentity: Record<string, NodeDiff>
}

export type DisplayNode = {
  identity: string
  kind: DiffKind
  role: string
  name?: string
  value?: string
  ref_id?: string
  available_actions?: string[]
  states?: string[]
  children: DisplayNode[]
  changes?: FieldChange[]
}

export type ActCommand = "click" | "type"

export type Transition = {
  from: string
  action: ActCommand
  elementId: string
  to?: string
  error?: ErrorObject
}

export type FixtureApp = {
  id: string
  name: string
  description: string
  hint: string
  staleRef: { action: ActCommand; elementId: string }
  initialSnapshotId: string
  snapshots: Record<string, SnapshotData>
  transitions: Transition[]
}

export type ReplaySession = {
  appId: string
  snapshot: SnapshotEnvelope
  previous?: SnapshotEnvelope
  previousRef?: string
  generation: number
  history: HistoryEntry[]
  lastDiff?: TreeDiff
  lastResult: Envelope
}
