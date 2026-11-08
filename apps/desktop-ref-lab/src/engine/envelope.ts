import { CONTRACT_VERSION, type ActionData, type Envelope, type ErrEnvelope, type ErrorObject, type SnapshotData, type SnapshotEnvelope } from "./types"
import { countRefs } from "./tree"

const NOT_DELIVERED = { delivery: "not_delivered", retry: "safe" } as const

export function okSnapshot(data: SnapshotData): SnapshotEnvelope {
  return {
    version: CONTRACT_VERSION,
    ok: true,
    command: "snapshot",
    data: { ...data, ref_count: countRefs(data.tree), complete: true },
  }
}

export function okAction(command: "click" | "type", refId: string): Envelope<typeof command, ActionData> {
  return {
    version: CONTRACT_VERSION,
    ok: true,
    command,
    data: {
      action: command,
      ref_id: refId,
      disposition: { delivery: "delivered_unverified", retry: "unsafe" },
    },
  }
}

export function fail(
  command: string,
  error: Omit<ErrorObject, "disposition"> & { disposition?: ErrorObject["disposition"] },
): ErrEnvelope {
  return {
    version: CONTRACT_VERSION,
    ok: false,
    command,
    error: {
      ...error,
      disposition: error.disposition ?? NOT_DELIVERED,
    },
  }
}

export function invalidArgs(command: string, message: string, suggestion?: string): ErrEnvelope {
  return fail(command, { code: "INVALID_ARGS", message, suggestion })
}

export function staleRef(command: string, ref: string, why: string): ErrEnvelope {
  return fail(command, {
    code: "STALE_REF",
    message: `Ref '${ref}' is stale: ${why}`,
    suggestion: "Take a fresh snapshot and use a ref from that snapshot.",
    recovery: {
      strategy: "refresh_snapshot_then_retry_original",
      retryable: true,
      requires_fresh_snapshot: true,
    },
  })
}

export function actionNotSupported(command: string, ref: string, role: string): ErrEnvelope {
  return fail(command, {
    code: "ACTION_NOT_SUPPORTED",
    message: `'${command}' is not available on ${role} ${ref}.`,
  })
}

export function isSnapshotEnvelope(value: unknown): value is SnapshotEnvelope {
  if (!value || typeof value !== "object") return false
  const env = value as Envelope
  if (!env.ok || env.command !== "snapshot") return false
  const data = env.data as SnapshotData | undefined
  return Boolean(data && typeof data.snapshot_id === "string" && data.tree && typeof data.tree.role === "string")
}
