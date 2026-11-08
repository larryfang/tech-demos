import type { AxNode, DiffKind, DisplayNode, FieldChange, NodeDiff, TreeDiff } from "./types"
import { childPath, identityOf, stripChildren } from "./tree"

type Flat = {
  identity: string
  path: string
  node: AxNode
}

function flatten(node: AxNode, path = "/"): Flat[] {
  const identity = identityOf(node, path)
  const self: Flat = { identity, path, node }
  const kids = node.children ?? []
  const nested = kids.flatMap((child, index) => flatten(child, childPath(path, child, index, kids)))
  return [self, ...nested]
}

function sameList(a?: string[], b?: string[]): boolean {
  const left = a ?? []
  const right = b ?? []
  if (left.length !== right.length) return false
  return left.every((value, index) => value === right[index])
}

function fieldChanges(before: AxNode, after: AxNode): FieldChange[] {
  const changes: FieldChange[] = []
  if (before.role !== after.role) changes.push("role")
  if ((before.name ?? "") !== (after.name ?? "")) changes.push("name")
  if ((before.value ?? "") !== (after.value ?? "")) changes.push("value")
  if (!sameList(before.states, after.states)) changes.push("states")
  if (!sameList(before.available_actions, after.available_actions)) changes.push("actions")
  return changes
}

export function diffTrees(before: AxNode | undefined, after: AxNode): TreeDiff {
  const afterFlat = flatten(after)
  const beforeFlat = before ? flatten(before) : []
  const beforeById = new Map(beforeFlat.map((item) => [item.identity, item]))
  const afterById = new Map(afterFlat.map((item) => [item.identity, item]))

  const added: NodeDiff[] = []
  const removed: NodeDiff[] = []
  const changed: NodeDiff[] = []
  const byIdentity: Record<string, NodeDiff> = {}

  for (const item of afterFlat) {
    const prev = beforeById.get(item.identity)
    if (!prev) {
      const diff: NodeDiff = {
        identity: item.identity,
        kind: "added",
        path: item.path,
        after: stripChildren(item.node),
      }
      added.push(diff)
      byIdentity[item.identity] = diff
      continue
    }
    const changes = fieldChanges(prev.node, item.node)
    if (changes.length > 0) {
      const diff: NodeDiff = {
        identity: item.identity,
        kind: "changed",
        path: item.path,
        before: stripChildren(prev.node),
        after: stripChildren(item.node),
        changes,
      }
      changed.push(diff)
      byIdentity[item.identity] = diff
    } else {
      byIdentity[item.identity] = {
        identity: item.identity,
        kind: "unchanged",
        path: item.path,
        before: stripChildren(prev.node),
        after: stripChildren(item.node),
      }
    }
  }

  for (const item of beforeFlat) {
    if (afterById.has(item.identity)) continue
    const diff: NodeDiff = {
      identity: item.identity,
      kind: "removed",
      path: item.path,
      before: stripChildren(item.node),
    }
    removed.push(diff)
    byIdentity[item.identity] = diff
  }

  return { added, removed, changed, byIdentity }
}

function displayKind(identity: string, diff?: TreeDiff): DiffKind {
  return diff?.byIdentity[identity]?.kind ?? "unchanged"
}

function toDisplay(node: AxNode, path: string, kind: DiffKind, diff?: TreeDiff): DisplayNode {
  const identity = identityOf(node, path)
  const record = diff?.byIdentity[identity]
  const display: DisplayNode = {
    identity,
    kind,
    role: node.role,
    children: [],
  }
  if (node.name !== undefined) display.name = node.name
  if (node.value !== undefined) display.value = node.value
  if (node.ref_id !== undefined) display.ref_id = node.ref_id
  if (node.available_actions !== undefined) display.available_actions = node.available_actions
  if (node.states !== undefined) display.states = node.states
  if (record?.changes) display.changes = record.changes
  return display
}

export function displayTree(before: AxNode | undefined, after: AxNode, diff?: TreeDiff): DisplayNode {
  function merge(prev: AxNode | undefined, next: AxNode, path: string): DisplayNode {
    const identity = identityOf(next, path)
    const node = toDisplay(next, path, displayKind(identity, diff), diff)
    const prevKids = prev?.children ?? []
    const nextKids = next.children ?? []
    const usedPrev = new Set<number>()
    const children: DisplayNode[] = []

    nextKids.forEach((child, index) => {
      const childP = childPath(path, child, index, nextKids)
      const childId = identityOf(child, childP)
      const prevIndex = prevKids.findIndex((candidate, candidateIndex) => {
        if (usedPrev.has(candidateIndex)) return false
        return identityOf(candidate, childPath(path, candidate, candidateIndex, prevKids)) === childId
      })
      const prevChild = prevIndex >= 0 ? prevKids[prevIndex] : undefined
      if (prevIndex >= 0) usedPrev.add(prevIndex)
      children.push(merge(prevChild, child, childP))
    })

    prevKids.forEach((child, index) => {
      if (usedPrev.has(index)) return
      const childP = childPath(path, child, index, prevKids)
      const childId = identityOf(child, childP)
      if (displayKind(childId, diff) !== "removed") return
      const ghost = toDisplay(child, childP, "removed", diff)
      const grandKids = child.children ?? []
      ghost.children = grandKids.map((grandchild, gIndex) => {
        const gPath = childPath(childP, grandchild, gIndex, grandKids)
        return toDisplay(
          grandchild,
          gPath,
          displayKind(identityOf(grandchild, gPath), diff),
          diff,
        )
      })
      const insertAt = Math.min(index, children.length)
      children.splice(insertAt, 0, ghost)
    })

    node.children = children
    return node
  }

  return merge(before, after, "/")
}

export function diffSummary(diff: TreeDiff): string {
  const parts: string[] = []
  if (diff.added.length) parts.push(`+${diff.added.length}`)
  if (diff.removed.length) parts.push(`−${diff.removed.length}`)
  if (diff.changed.length) parts.push(`~${diff.changed.length}`)
  return parts.length ? parts.join(" ") : "no changes"
}
