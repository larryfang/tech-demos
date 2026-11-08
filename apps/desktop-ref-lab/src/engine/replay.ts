import { APPS, appById } from "@/fixtures"
import { diffTrees } from "./diff"
import {
  actionNotSupported,
  fail,
  invalidArgs,
  okAction,
  okSnapshot,
  staleRef,
} from "./envelope"
import { parseRef } from "./refs"
import { findByElementId, rewriteRefs, setNodeText } from "./tree"
import type {
  ActCommand,
  Envelope,
  FixtureApp,
  HistoryEntry,
  ReplaySession,
  SnapshotEnvelope,
} from "./types"

let historySeq = 1

function stamp(envelope: Envelope, label: string, at = Date.now()): HistoryEntry {
  const id = historySeq++
  return {
    id,
    at,
    command: envelope.command,
    ok: envelope.ok,
    label,
    envelope,
  }
}

function snapshotEnvelope(app: FixtureApp, snapshotId: string, tree = app.snapshots[snapshotId]?.tree): SnapshotEnvelope | undefined {
  const data = app.snapshots[snapshotId]
  if (!data) return undefined
  return okSnapshot({
    ...data,
    snapshot_id: snapshotId,
    tree: tree ?? data.tree,
  })
}

function mintSnapshot(session: ReplaySession, app: FixtureApp, tree: SnapshotEnvelope["data"]["tree"]): SnapshotEnvelope {
  const snapshotId = `${app.initialSnapshotId}g${session.generation + 1}`
  return okSnapshot({
    app: app.name,
    snapshot_id: snapshotId,
    ref_count: 0,
    complete: true,
    window: session.snapshot.data.window,
    tree: rewriteRefs(tree, snapshotId),
  })
}

function supports(command: ActCommand, actions: string[] | undefined): boolean {
  if (command === "click") return (actions ?? []).includes("Click")
  return (actions ?? []).some((action) => action === "Type" || action === "SetValue")
}

export function listReplayApps(): FixtureApp[] {
  return APPS
}

export function startSession(appId: string): ReplaySession {
  const app = appById(appId) ?? APPS[0]
  if (!app) throw new Error("no fixture apps")
  const snapshot = snapshotEnvelope(app, app.initialSnapshotId)
  if (!snapshot) throw new Error(`missing initial snapshot for ${app.id}`)
  const envelope = snapshot
  return {
    appId: app.id,
    snapshot: envelope,
    generation: 0,
    history: [stamp(envelope, `snapshot ${app.name}`)],
    lastResult: envelope,
  }
}

export function resnapshot(session: ReplaySession): ReplaySession {
  const app = appById(session.appId)
  if (!app) return session
  const next = mintSnapshot(session, app, session.snapshot.data.tree)
  const diff = diffTrees(session.snapshot.data.tree, next.data.tree)
  return {
    ...session,
    previous: session.snapshot,
    snapshot: next,
    generation: session.generation + 1,
    lastDiff: diff,
    lastResult: next,
    history: [...session.history, stamp(next, "snapshot (re)")],
  }
}

function failSession(session: ReplaySession, envelope: Envelope, label: string): ReplaySession {
  return {
    ...session,
    lastResult: envelope,
    history: [...session.history, stamp(envelope, label)],
  }
}

export function act(
  session: ReplaySession,
  command: ActCommand,
  ref: string,
  text = "",
): ReplaySession {
  const app = appById(session.appId)
  if (!app) return session
  const parsed = parseRef(ref)
  if (!parsed.ok) {
    const message =
      parsed.reason === "bare"
        ? `Invalid ref_id '${ref}': expected @<snapshot_id>:e<N>`
        : `Invalid ref_id '${ref}'`
    const suggestion =
      parsed.reason === "bare"
        ? "Use the snapshot-qualified ref that snapshot prints, for example @sc0:e7. A bare @eN ref is not accepted."
        : undefined
    const envelope = invalidArgs(command, message, suggestion)
    return failSession(session, envelope, `${command} ${ref} → INVALID_ARGS`)
  }

  const currentId = session.snapshot.data.snapshot_id
  if (parsed.snapshotId !== currentId) {
    const envelope = staleRef(
      command,
      ref,
      `snapshot '${parsed.snapshotId}' is not the current snapshot '${currentId}'`,
    )
    return failSession(session, envelope, `${command} ${ref} → STALE_REF`)
  }

  const node = findByElementId(session.snapshot.data.tree, parsed.elementId)
  if (!node) {
    const envelope = staleRef(command, ref, `element '${parsed.elementId}' is not in the current tree`)
    return failSession(session, envelope, `${command} ${ref} → STALE_REF`)
  }

  if (!supports(command, node.available_actions)) {
    const envelope = actionNotSupported(command, ref, node.role)
    return failSession(session, envelope, `${command} ${ref} → ACTION_NOT_SUPPORTED`)
  }

  const transition = app.transitions.find((item) => {
    if (item.from !== currentId) return false
    if (item.action !== command) return false
    if (item.elementId !== parsed.elementId) return false
    return true
  })

  if (transition?.error) {
    const envelope = fail(command, transition.error)
    return failSession(session, envelope, `${command} ${ref} → ${transition.error.code}`)
  }

  const actionEnvelope = okAction(command, ref)
  let nextSnap: SnapshotEnvelope
  if (transition?.to && app.snapshots[transition.to]) {
    let tree = app.snapshots[transition.to].tree
    if (command === "type" && text) {
      tree = setNodeText(tree, parsed.elementId, text)
      const titleId = "eNoteTitle"
      if (parsed.elementId === "eEditor") tree = setNodeText(tree, titleId, text || "Untitled")
    }
    nextSnap = okSnapshot({ ...app.snapshots[transition.to], tree })
  } else {
    nextSnap = mintSnapshot(session, app, session.snapshot.data.tree)
  }

  const diff = diffTrees(session.snapshot.data.tree, nextSnap.data.tree)
  const afterAction = stamp(actionEnvelope, `${command} ${ref}`)
  const afterSnap = stamp(nextSnap, "snapshot (re)")
  return {
    ...session,
    previous: session.snapshot,
    previousRef: ref,
    snapshot: nextSnap,
    generation: session.generation + 1,
    lastDiff: diff,
    lastResult: nextSnap,
    history: [...session.history, afterAction, afterSnap],
  }
}

export function demonstrateStaleRef(session: ReplaySession): ReplaySession {
  const app = appById(session.appId)
  if (!app) return session
  const elementId = app.staleRef.elementId
  const node = findByElementId(session.snapshot.data.tree, elementId)
  if (!node?.ref_id) {
    const envelope = staleRef(app.staleRef.action, `@missing:${elementId}`, "demo target is not on this snapshot")
    return failSession(session, envelope, `stale-ref demo → STALE_REF`)
  }
  const oldRef = node.ref_id
  const afterClick = act(session, app.staleRef.action, oldRef)
  return act(afterClick, app.staleRef.action, oldRef)
}

export function resetSession(appId: string): ReplaySession {
  historySeq = 1
  return startSession(appId)
}
