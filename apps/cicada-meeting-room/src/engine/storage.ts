import type { MeetingState } from "./engine"
import { seedState } from "./engine"

export const STORAGE_KEY = "cicada-meeting-room:v1"

type Stored = Pick<
  MeetingState,
  "clockMs" | "injected" | "utteranceIndex"
>

export function loadState(): MeetingState {
  if (typeof localStorage === "undefined") return seedState()
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return seedState()
    const parsed = JSON.parse(raw) as Partial<Stored>
    const seed = seedState()
    return {
      ...seed,
      clockMs: typeof parsed.clockMs === "number" ? parsed.clockMs : 0,
      utteranceIndex:
        typeof parsed.utteranceIndex === "number" ? parsed.utteranceIndex : 0,
      injected: Array.isArray(parsed.injected) ? parsed.injected : [],
    }
  } catch {
    return seedState()
  }
}

export function saveState(state: MeetingState): void {
  if (typeof localStorage === "undefined") return
  const stored: Stored = {
    clockMs: state.clockMs,
    injected: state.injected,
    utteranceIndex: state.utteranceIndex,
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
}

export function clearState(): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
