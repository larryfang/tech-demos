export type ParsedRef =
  | { ok: true; snapshotId: string; elementId: string; raw: string }
  | { ok: false; reason: "bare" | "invalid"; raw: string }

const QUALIFIED = /^@([^:]+):([A-Za-z0-9_]+)$/
const BARE = /^@([A-Za-z0-9_]+)$/

export function parseRef(raw: string): ParsedRef {
  const value = raw.trim()
  const qualified = QUALIFIED.exec(value)
  if (qualified) {
    return {
      ok: true,
      snapshotId: qualified[1] ?? "",
      elementId: qualified[2] ?? "",
      raw: value,
    }
  }
  if (BARE.test(value)) {
    return { ok: false, reason: "bare", raw: value }
  }
  return { ok: false, reason: "invalid", raw: value }
}

export function makeRef(snapshotId: string, elementId: string): string {
  return `@${snapshotId}:${elementId}`
}

export function elementIdOf(refId: string): string | undefined {
  const parsed = parseRef(refId)
  return parsed.ok ? parsed.elementId : undefined
}
