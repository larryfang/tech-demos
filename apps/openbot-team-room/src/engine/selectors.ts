import type { Agent, ChannelTask, QueueItem, RoomState } from "@/engine/types"

export function agentById(state: RoomState, id: string): Agent | undefined {
  return state.agents.find((agent) => agent.id === id)
}

export function itemById(state: RoomState, id: string): QueueItem | undefined {
  return state.items.find((item) => item.id === id)
}

export function taskById(state: RoomState, id: string): ChannelTask | undefined {
  return state.channelTasks.find((task) => task.id === id)
}

export function queueOf(state: RoomState, agentId: string): QueueItem[] {
  return state.items.filter((item) => item.agentId === agentId)
}

export function activeQueueOf(state: RoomState, agentId: string): QueueItem[] {
  return queueOf(state, agentId).filter(
    (item) => item.status === "queued" || item.status === "running",
  )
}

export function runningOf(state: RoomState, agentId: string): QueueItem | undefined {
  return state.items.find(
    (item) => item.agentId === agentId && item.status === "running",
  )
}

export function firstQueued(state: RoomState, agentId: string): QueueItem | undefined {
  return state.items.find(
    (item) => item.agentId === agentId && item.status === "queued",
  )
}

export function activeChannelTask(state: RoomState): ChannelTask | undefined {
  return [...state.channelTasks]
    .reverse()
    .find((task) => task.status === "running" || task.status === "open")
    ?? [...state.channelTasks].reverse().find((task) => task.status !== "archived")
}

export function itemsForTask(state: RoomState, taskId: string): QueueItem[] {
  return state.items.filter((item) => item.channelTaskId === taskId)
}
