import { seedState } from "@/engine/seed"
import type { RoomState } from "@/engine/types"

export const STORAGE_KEY = "openbot-team-room:v1"

function isRoomState(value: unknown): value is RoomState {
  if (!value || typeof value !== "object") return false
  const record = value as Partial<RoomState>
  return (
    typeof record.now === "number" &&
    typeof record.nextId === "number" &&
    Array.isArray(record.agents) &&
    Array.isArray(record.items) &&
    Array.isArray(record.messages) &&
    Array.isArray(record.channelTasks)
  )
}

export function rebaseState(state: RoomState, now: number): RoomState {
  const delta = now - state.now
  if (delta === 0) return state
  return {
    ...state,
    now,
    items: state.items.map((item) => ({
      ...item,
      startedAt: item.startedAt != null ? item.startedAt + delta : undefined,
      heldAt: item.heldAt != null ? item.heldAt + delta : undefined,
    })),
    messages: state.messages.map((message) => ({
      ...message,
      createdAt: message.createdAt + delta,
    })),
    channelTasks: state.channelTasks.map((task) => ({
      ...task,
      createdAt: task.createdAt + delta,
    })),
  }
}

export function loadState(now = Date.now()): RoomState | null {
  if (typeof localStorage === "undefined") return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    return isRoomState(parsed) ? rebaseState(parsed, now) : null
  } catch {
    return null
  }
}

export function saveState(state: RoomState): void {
  if (typeof localStorage === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function initialState(now = Date.now()): RoomState {
  return loadState() ?? seedState(now)
}

export function clearState(): void {
  if (typeof localStorage === "undefined") return
  localStorage.removeItem(STORAGE_KEY)
}
