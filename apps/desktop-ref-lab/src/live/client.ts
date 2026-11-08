import { isSnapshotEnvelope } from "@/engine/envelope"
import type { Envelope, SnapshotEnvelope } from "@/engine/types"

export type LiveStatus = {
  available: boolean
  reason?: string
  message?: string
  version?: string
}

async function readJson(res: Response): Promise<unknown> {
  const text = await res.text()
  try {
    return JSON.parse(text) as unknown
  } catch {
    return { error: "invalid_json", text }
  }
}

export async function fetchLiveStatus(): Promise<LiveStatus> {
  try {
    const res = await fetch("/api/live/status")
    const body = (await readJson(res)) as LiveStatus
    if (typeof body?.available === "boolean") return body
    return { available: false, reason: "error", message: "Unexpected status payload" }
  } catch {
    return {
      available: false,
      reason: "error",
      message: "Could not reach the live adapter. Replay mode is still available.",
    }
  }
}

function nameOf(item: unknown): string | undefined {
  if (typeof item === "string" && item.trim()) return item.trim()
  if (!item || typeof item !== "object") return undefined
  const record = item as Record<string, unknown>
  if (typeof record.name === "string" && record.name.trim()) return record.name.trim()
  if (typeof record.app === "string" && record.app.trim()) return record.app.trim()
  if (typeof record.title === "string" && record.title.trim()) return record.title.trim()
  return undefined
}

export function namesFromListApps(envelope: unknown): string[] {
  if (!envelope || typeof envelope !== "object") return []
  const data = (envelope as { data?: unknown }).data
  const lists: unknown[] = []
  if (Array.isArray(data)) lists.push(data)
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>
    for (const key of ["apps", "applications", "items", "windows"]) {
      if (Array.isArray(record[key])) lists.push(record[key])
    }
  }
  const names = new Set<string>()
  for (const list of lists) {
    if (!Array.isArray(list)) continue
    for (const item of list) {
      const name = nameOf(item)
      if (name) names.add(name)
    }
  }
  return [...names]
}

export async function fetchLiveApps(): Promise<{ envelope: Envelope; names: string[] }> {
  const res = await fetch("/api/live/apps")
  const envelope = (await readJson(res)) as Envelope
  return { envelope, names: namesFromListApps(envelope) }
}

export async function liveSnapshot(app: string): Promise<Envelope> {
  const res = await fetch("/api/live/snapshot", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ app }),
  })
  return (await readJson(res)) as Envelope
}

export async function liveClick(ref: string): Promise<Envelope> {
  const res = await fetch("/api/live/click", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref }),
  })
  return (await readJson(res)) as Envelope
}

export async function liveType(ref: string, text: string): Promise<Envelope> {
  const res = await fetch("/api/live/type", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ref, text }),
  })
  return (await readJson(res)) as Envelope
}

export function snapshotFrom(envelope: Envelope): SnapshotEnvelope | undefined {
  return isSnapshotEnvelope(envelope) ? envelope : undefined
}
