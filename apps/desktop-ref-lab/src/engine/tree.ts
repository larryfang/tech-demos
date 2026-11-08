import type { AxNode } from "./types"
import { elementIdOf, makeRef } from "./refs"

export function countRefs(node: AxNode): number {
  let count = node.ref_id ? 1 : 0
  for (const child of node.children ?? []) count += countRefs(child)
  return count
}

export function stripChildren(node: AxNode): AxNode {
  const copy: AxNode = { role: node.role }
  if (node.name !== undefined) copy.name = node.name
  if (node.value !== undefined) copy.value = node.value
  if (node.ref_id !== undefined) copy.ref_id = node.ref_id
  if (node.available_actions !== undefined) copy.available_actions = node.available_actions
  if (node.states !== undefined) copy.states = node.states
  return copy
}

export function rewriteRefs(node: AxNode, snapshotId: string): AxNode {
  const next: AxNode = { role: node.role }
  if (node.name !== undefined) next.name = node.name
  if (node.value !== undefined) next.value = node.value
  if (node.available_actions !== undefined) next.available_actions = node.available_actions
  if (node.states !== undefined) next.states = node.states
  if (node.ref_id) {
    const elementId = elementIdOf(node.ref_id)
    next.ref_id = elementId ? makeRef(snapshotId, elementId) : node.ref_id
  }
  if (node.children?.length) {
    next.children = node.children.map((child) => rewriteRefs(child, snapshotId))
  }
  return next
}

export function findByElementId(node: AxNode, elementId: string): AxNode | undefined {
  if (node.ref_id && elementIdOf(node.ref_id) === elementId) return node
  for (const child of node.children ?? []) {
    const found = findByElementId(child, elementId)
    if (found) return found
  }
  return undefined
}

export function findByRef(node: AxNode, refId: string): AxNode | undefined {
  if (node.ref_id === refId) return node
  for (const child of node.children ?? []) {
    const found = findByRef(child, refId)
    if (found) return found
  }
  return undefined
}

export function identityOf(node: AxNode, path: string): string {
  if (node.ref_id) {
    const elementId = elementIdOf(node.ref_id)
    if (elementId) return elementId
  }
  return path
}

export function childPath(parentPath: string, child: AxNode, index: number, siblings: AxNode[] = []): string {
  const label = child.name ? `${child.role}:${child.name}` : child.role
  const dupes = siblings.filter((sibling) => {
    const siblingLabel = sibling.name ? `${sibling.role}:${sibling.name}` : sibling.role
    return siblingLabel === label
  })
  const suffix = dupes.length > 1 ? `#${index}` : ""
  return `${parentPath}/${label}${suffix}`
}

export function setNodeText(node: AxNode, elementId: string, text: string): AxNode {
  const match = node.ref_id && elementIdOf(node.ref_id) === elementId
  const next: AxNode = { ...node }
  if (match) {
    next.name = text
    next.value = text
  }
  if (node.children?.length) {
    next.children = node.children.map((child) => setNodeText(child, elementId, text))
  }
  return next
}
