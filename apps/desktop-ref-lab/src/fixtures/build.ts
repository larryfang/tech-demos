import { countRefs } from "@/engine/tree"
import type { AxNode, SnapshotData } from "@/engine/types"

export type Draft = {
  role: string
  name?: string
  value?: string
  eid?: string
  actions?: string[]
  states?: string[]
  children?: Draft[]
}

export function bake(draft: Draft, snapshotId: string): AxNode {
  const node: AxNode = { role: draft.role }
  if (draft.name !== undefined) node.name = draft.name
  if (draft.value !== undefined) node.value = draft.value
  if (draft.states?.length) node.states = draft.states
  if (draft.actions?.length) node.available_actions = draft.actions
  if (draft.eid) node.ref_id = `@${snapshotId}:${draft.eid}`
  if (draft.children?.length) {
    node.children = draft.children.map((child) => bake(child, snapshotId))
  }
  return node
}

export function snap(
  app: string,
  snapshotId: string,
  windowId: string,
  title: string,
  draft: Draft,
): SnapshotData {
  const tree = bake(draft, snapshotId)
  return {
    app,
    snapshot_id: snapshotId,
    complete: true,
    ref_count: countRefs(tree),
    window: { id: windowId, title },
    tree,
  }
}

export const click = ["Click"]
export const typeActions = ["Type", "SetValue", "Click"]
export const toggle = ["Click", "Toggle"]
