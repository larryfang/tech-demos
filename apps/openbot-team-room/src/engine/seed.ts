import { SEED_AGENTS } from "@/fixtures/agents"
import type { RoomState } from "@/engine/types"

export function seedState(now = 0): RoomState {
  return {
    now,
    nextId: 1,
    liveAgentId: null,
    agents: SEED_AGENTS.map((agent) => ({ ...agent, status: "idle" })),
    items: [],
    messages: [],
    channelTasks: [],
  }
}
