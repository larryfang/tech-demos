export const AGENT_STATUSES = ["idle", "working", "paused", "blocked"] as const
export type AgentStatus = (typeof AGENT_STATUSES)[number]

export const ITEM_STATUSES = ["queued", "running", "done", "cancelled"] as const
export type ItemStatus = (typeof ITEM_STATUSES)[number]

export const CHANNEL_TASK_STATUSES = [
  "open",
  "running",
  "stopped",
  "done",
  "archived",
] as const
export type ChannelTaskStatus = (typeof CHANNEL_TASK_STATUSES)[number]

export const MESSAGE_KINDS = [
  "post",
  "handoff",
  "direct",
  "result",
  "system",
] as const
export type MessageKind = (typeof MESSAGE_KINDS)[number]

export interface Agent {
  id: string
  name: string
  role: string
  instructions: string
  status: AgentStatus
}

export interface QueueItem {
  id: string
  agentId: string
  title: string
  body: string
  status: ItemStatus
  progress: number
  firedBeats: number[]
  channelTaskId?: string
  waitingOnItemId?: string
  scriptId?: string
  startedAt?: number
  heldAt?: number
  heldMs: number
}

export interface Message {
  id: string
  kind: MessageKind
  text: string
  fromId: string
  toId?: string
  channelTaskId?: string
  createdAt: number
}

export interface ChannelTask {
  id: string
  title: string
  body: string
  ownerId: string
  status: ChannelTaskStatus
  createdAt: number
  scriptId?: string
}

export interface RoomState {
  now: number
  agents: Agent[]
  items: QueueItem[]
  messages: Message[]
  channelTasks: ChannelTask[]
  nextId: number
  liveAgentId: string | null
}

export type Action =
  | { type: "TICK"; now: number }
  | {
      type: "ENQUEUE"
      agentId: string
      title: string
      body?: string
      channelTaskId?: string
      scriptId?: string
    }
  | { type: "PAUSE_AGENT"; agentId: string }
  | { type: "RESUME_AGENT"; agentId: string }
  | { type: "CANCEL_ITEM"; itemId: string }
  | {
      type: "POST_CHANNEL_TASK"
      title: string
      body: string
      ownerId: string
      scriptId?: string
    }
  | { type: "REASSIGN_OWNER"; taskId: string; ownerId: string }
  | { type: "STOP_TASK"; taskId: string }
  | { type: "ARCHIVE_TASK"; taskId: string }
  | { type: "DIRECT_MESSAGE"; fromId: string; toId: string; text: string }
  | {
      type: "UPDATE_AGENT"
      agentId: string
      patch: Partial<Pick<Agent, "name" | "role" | "instructions">>
    }
  | { type: "RESET"; now?: number }
  | { type: "LOAD"; state: RoomState }
  | { type: "RUN_SCENARIO"; now?: number }
  | { type: "SET_LIVE_AGENT"; agentId: string | null }
  | { type: "LIVE_RESULT"; agentId: string; text: string }

export interface ScriptBeat {
  at: number
  kind: "handoff" | "direct" | "result" | "close"
  toAgentId?: string
  title?: string
  text: string
  delegateScriptId?: string
}

export interface WorkScript {
  id: string
  durationMs: number
  beats: ScriptBeat[]
}
