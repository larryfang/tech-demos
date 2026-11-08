import { SAMPLE_TASK } from "@/fixtures/sample-scenario"
import { OWNER_SCRIPT_ID, SOLO_SCRIPT_ID, scriptById } from "@/fixtures/scripts"
import { seedState } from "@/engine/seed"
import {
  agentById,
  firstQueued,
  itemById,
  runningOf,
  taskById,
} from "@/engine/selectors"
import type {
  Action,
  Agent,
  ChannelTask,
  Message,
  QueueItem,
  RoomState,
  ScriptBeat,
} from "@/engine/types"

function allocate(state: RoomState): { state: RoomState; id: string } {
  return {
    state: { ...state, nextId: state.nextId + 1 },
    id: `n${state.nextId}`,
  }
}

function mapAgent(
  state: RoomState,
  agentId: string,
  fn: (agent: Agent) => Agent,
): RoomState {
  return {
    ...state,
    agents: state.agents.map((agent) => (agent.id === agentId ? fn(agent) : agent)),
  }
}

function mapItem(
  state: RoomState,
  itemId: string,
  fn: (item: QueueItem) => QueueItem,
): RoomState {
  return {
    ...state,
    items: state.items.map((item) => (item.id === itemId ? fn(item) : item)),
  }
}

function mapTask(
  state: RoomState,
  taskId: string,
  fn: (task: ChannelTask) => ChannelTask,
): RoomState {
  return {
    ...state,
    channelTasks: state.channelTasks.map((task) =>
      task.id === taskId ? fn(task) : task,
    ),
  }
}

function pushMessage(
  state: RoomState,
  input: Omit<Message, "id" | "createdAt">,
): RoomState {
  const { state: next, id } = allocate(state)
  const message: Message = {
    ...input,
    id,
    createdAt: next.now,
  }
  return { ...next, messages: [...next.messages, message] }
}

function pushItem(
  state: RoomState,
  input: Omit<QueueItem, "id" | "progress" | "firedBeats" | "heldMs" | "status"> & {
    status?: QueueItem["status"]
  },
): RoomState {
  const { state: next, id } = allocate(state)
  const item: QueueItem = {
    ...input,
    id,
    status: input.status ?? "queued",
    progress: 0,
    firedBeats: [],
    heldMs: 0,
  }
  return { ...next, items: [...next.items, item] }
}

function syncHold(item: QueueItem, now: number, held: boolean): QueueItem {
  if (held && item.heldAt == null) {
    return { ...item, heldAt: now }
  }
  if (!held && item.heldAt != null) {
    return {
      ...item,
      heldMs: item.heldMs + (now - item.heldAt),
      heldAt: undefined,
    }
  }
  return item
}

function itemHeld(state: RoomState, item: QueueItem): boolean {
  const agent = agentById(state, item.agentId)
  return agent?.status === "paused" || item.waitingOnItemId != null
}

function progressOf(item: QueueItem, now: number): number {
  if (item.status !== "running" || item.startedAt == null) return item.progress
  const heldMs =
    item.heldMs + (item.heldAt != null ? Math.max(0, now - item.heldAt) : 0)
  const elapsed = Math.max(0, now - item.startedAt - heldMs)
  const duration = scriptById(item.scriptId).durationMs
  return Math.min(1, elapsed / duration)
}

function refreshAgentStatus(state: RoomState, agentId: string): RoomState {
  const agent = agentById(state, agentId)
  if (!agent || agent.status === "paused") return state
  const running = runningOf(state, agentId)
  if (!running) {
    return mapAgent(state, agentId, (current) => ({ ...current, status: "idle" }))
  }
  if (running.waitingOnItemId) {
    return mapAgent(state, agentId, (current) => ({ ...current, status: "blocked" }))
  }
  return mapAgent(state, agentId, (current) => ({ ...current, status: "working" }))
}

function cancelItem(state: RoomState, itemId: string): RoomState {
  const item = itemById(state, itemId)
  if (!item || item.status === "done" || item.status === "cancelled") return state
  let next = mapItem(state, itemId, (current) => ({
    ...current,
    status: "cancelled",
    waitingOnItemId: undefined,
    heldAt: undefined,
  }))
  next = unblockWaiters(next, itemId)
  return refreshAgentStatus(next, item.agentId)
}

function unblockWaiters(state: RoomState, finishedId: string): RoomState {
  let next = state
  for (const item of state.items) {
    if (item.waitingOnItemId !== finishedId) continue
    next = mapItem(next, item.id, (current) =>
      syncHold(
        { ...current, waitingOnItemId: undefined },
        next.now,
        agentById(next, current.agentId)?.status === "paused",
      ),
    )
    next = refreshAgentStatus(next, item.agentId)
  }
  return next
}

function applyBeat(
  state: RoomState,
  item: QueueItem,
  beat: ScriptBeat,
): RoomState {
  if (beat.kind === "handoff") {
    const toAgentId = beat.toAgentId
    if (!toAgentId || toAgentId === item.agentId || !agentById(state, toAgentId)) {
      return state
    }
    let next = pushItem(state, {
      agentId: toAgentId,
      title: beat.title ?? beat.text,
      body: beat.text,
      channelTaskId: item.channelTaskId,
      scriptId: beat.delegateScriptId ?? SOLO_SCRIPT_ID,
    })
    const delegate = next.items[next.items.length - 1]
    if (!delegate) return next
    next = mapItem(next, item.id, (current) =>
      syncHold(
        { ...current, waitingOnItemId: delegate.id },
        next.now,
        true,
      ),
    )
    next = refreshAgentStatus(next, item.agentId)
    return pushMessage(next, {
      kind: "handoff",
      text: beat.text,
      fromId: item.agentId,
      toId: toAgentId,
      channelTaskId: item.channelTaskId,
    })
  }

  if (beat.kind === "direct" && beat.toAgentId) {
    return pushMessage(state, {
      kind: "direct",
      text: beat.text,
      fromId: item.agentId,
      toId: beat.toAgentId,
      channelTaskId: item.channelTaskId,
    })
  }

  if (beat.kind === "result") {
    return pushMessage(state, {
      kind: "result",
      text: beat.text,
      fromId: item.agentId,
      toId: item.channelTaskId
        ? taskById(state, item.channelTaskId)?.ownerId
        : undefined,
      channelTaskId: item.channelTaskId,
    })
  }

  if (beat.kind === "close" && item.channelTaskId) {
    const task = taskById(state, item.channelTaskId)
    if (!task || task.status === "stopped" || task.status === "archived") {
      return state
    }
    let next = mapTask(state, item.channelTaskId, (current) => ({
      ...current,
      status: "done",
    }))
    return pushMessage(next, {
      kind: "system",
      text: beat.text,
      fromId: item.agentId,
      channelTaskId: item.channelTaskId,
    })
  }

  return state
}

function startQueued(state: RoomState, agentId: string): RoomState {
  const agent = agentById(state, agentId)
  if (!agent || agent.status === "paused") return state
  if (runningOf(state, agentId)) return state
  const queued = firstQueued(state, agentId)
  if (!queued) return state
  let next = mapItem(state, queued.id, (item) => ({
    ...item,
    status: "running" as const,
    startedAt: state.now,
    heldMs: 0,
    heldAt: undefined,
  }))
  return refreshAgentStatus(next, agentId)
}

function advanceItem(state: RoomState, item: QueueItem): RoomState {
  if (item.status !== "running") return state
  const held = itemHeld(state, item)
  let current = syncHold(item, state.now, held)
  let next = mapItem(state, item.id, () => current)
  const progress = progressOf(current, state.now)
  next = mapItem(next, item.id, (value) => ({ ...value, progress }))
  current = itemById(next, item.id) ?? current

  if (!held) {
    const script = scriptById(current.scriptId)
    for (const [index, beat] of script.beats.entries()) {
      if (current.firedBeats.includes(index) || progress < beat.at) continue
      next = mapItem(next, current.id, (value) => ({
        ...value,
        firedBeats: [...value.firedBeats, index],
      }))
      current = itemById(next, current.id) ?? current
      next = applyBeat(next, current, beat)
      current = itemById(next, current.id) ?? current
      if (current.waitingOnItemId) break
    }
  }

  if (
    progress >= 1 &&
    !held &&
    !current.waitingOnItemId &&
    current.status === "running"
  ) {
    next = mapItem(next, current.id, (value) => ({
      ...value,
      status: "done",
      progress: 1,
      heldAt: undefined,
    }))
    next = unblockWaiters(next, current.id)
    next = refreshAgentStatus(next, current.agentId)
  }

  return next
}

function tickPass(state: RoomState): RoomState {
  let next = state
  for (const agent of state.agents) {
    next = startQueued(next, agent.id)
  }
  for (const item of [...next.items]) {
    if (item.status === "running") {
      const latest = itemById(next, item.id)
      if (latest) next = advanceItem(next, latest)
    }
  }
  for (const agent of state.agents) {
    next = startQueued(next, agent.id)
  }
  return next
}

function tick(state: RoomState, now: number): RoomState {
  let next: RoomState = { ...state, now }
  for (let pass = 0; pass < 4; pass += 1) {
    next = tickPass(next)
  }
  return next
}

function enqueue(
  state: RoomState,
  action: Extract<Action, { type: "ENQUEUE" }>,
): RoomState {
  if (!agentById(state, action.agentId)) return state
  return pushItem(state, {
    agentId: action.agentId,
    title: action.title,
    body: action.body ?? "",
    channelTaskId: action.channelTaskId,
    scriptId: action.scriptId ?? SOLO_SCRIPT_ID,
  })
}

function postChannelTask(
  state: RoomState,
  action: Extract<Action, { type: "POST_CHANNEL_TASK" }>,
): RoomState {
  if (!agentById(state, action.ownerId)) return state
  const { state: allocated, id } = allocate(state)
  const scriptId = action.scriptId ?? OWNER_SCRIPT_ID
  const task: ChannelTask = {
    id,
    title: action.title,
    body: action.body,
    ownerId: action.ownerId,
    status: "running",
    createdAt: allocated.now,
    scriptId,
  }
  let next: RoomState = {
    ...allocated,
    channelTasks: [...allocated.channelTasks, task],
  }
  next = pushMessage(next, {
    kind: "post",
    text: action.title,
    fromId: "user",
    toId: action.ownerId,
    channelTaskId: id,
  })
  return pushItem(next, {
    agentId: action.ownerId,
    title: action.title,
    body: action.body,
    channelTaskId: id,
    scriptId,
  })
}

function reassignOwner(
  state: RoomState,
  action: Extract<Action, { type: "REASSIGN_OWNER" }>,
): RoomState {
  const task = taskById(state, action.taskId)
  if (!task || task.status === "archived" || task.status === "done") return state
  if (!agentById(state, action.ownerId)) return state
  let next = mapTask(state, action.taskId, (current) => ({
    ...current,
    ownerId: action.ownerId,
    status: current.status === "stopped" ? "stopped" : "running",
  }))
  for (const item of [...next.items]) {
    if (item.channelTaskId === action.taskId) {
      next = cancelItem(next, item.id)
    }
  }
  next = pushMessage(next, {
    kind: "system",
    text: `Owner reassigned to ${agentById(next, action.ownerId)?.name ?? action.ownerId}.`,
    fromId: "user",
    channelTaskId: action.taskId,
  })
  if (taskById(next, action.taskId)?.status === "stopped") return next
  return pushItem(next, {
    agentId: action.ownerId,
    title: task.title,
    body: task.body,
    channelTaskId: action.taskId,
    scriptId: task.scriptId ?? OWNER_SCRIPT_ID,
  })
}

function stopTask(state: RoomState, taskId: string): RoomState {
  const task = taskById(state, taskId)
  if (!task || task.status === "archived" || task.status === "done") return state
  let next = mapTask(state, taskId, (current) => ({
    ...current,
    status: "stopped",
  }))
  for (const item of [...next.items]) {
    if (item.channelTaskId === taskId) {
      next = cancelItem(next, item.id)
    }
  }
  return pushMessage(next, {
    kind: "system",
    text: "Channel task stopped. Queued and running slices were cancelled.",
    fromId: "user",
    channelTaskId: taskId,
  })
}

function archiveTask(state: RoomState, taskId: string): RoomState {
  const task = taskById(state, taskId)
  if (!task || (task.status !== "stopped" && task.status !== "done")) return state
  return mapTask(state, taskId, (current) => ({ ...current, status: "archived" }))
}

export function reduce(state: RoomState, action: Action): RoomState {
  switch (action.type) {
    case "TICK":
      return tick(state, action.now)
    case "ENQUEUE":
      return enqueue(state, action)
    case "PAUSE_AGENT": {
      let next = mapAgent(state, action.agentId, (agent) => ({
        ...agent,
        status: "paused",
      }))
      const running = runningOf(next, action.agentId)
      if (running) {
        next = mapItem(next, running.id, (item) => syncHold(item, next.now, true))
      }
      return next
    }
    case "RESUME_AGENT": {
      const agent = agentById(state, action.agentId)
      if (!agent) return state
      let next = mapAgent(state, action.agentId, (current) => ({
        ...current,
        status: "idle",
      }))
      const running = runningOf(next, action.agentId)
      if (running) {
        next = mapItem(next, running.id, (item) =>
          syncHold(item, next.now, item.waitingOnItemId != null),
        )
      }
      return refreshAgentStatus(next, action.agentId)
    }
    case "CANCEL_ITEM":
      return cancelItem(state, action.itemId)
    case "POST_CHANNEL_TASK":
      return postChannelTask(state, action)
    case "REASSIGN_OWNER":
      return reassignOwner(state, action)
    case "STOP_TASK":
      return stopTask(state, action.taskId)
    case "ARCHIVE_TASK":
      return archiveTask(state, action.taskId)
    case "DIRECT_MESSAGE":
      return pushMessage(state, {
        kind: "direct",
        text: action.text,
        fromId: action.fromId,
        toId: action.toId,
      })
    case "UPDATE_AGENT":
      return mapAgent(state, action.agentId, (agent) => ({
        ...agent,
        ...action.patch,
      }))
    case "RESET":
      return seedState(action.now ?? state.now)
    case "LOAD":
      return action.state
    case "RUN_SCENARIO": {
      const seeded = seedState(action.now ?? state.now)
      return postChannelTask(seeded, {
        type: "POST_CHANNEL_TASK",
        ...SAMPLE_TASK,
      })
    }
    case "SET_LIVE_AGENT":
      return { ...state, liveAgentId: action.agentId }
    case "LIVE_RESULT":
      return pushMessage(state, {
        kind: "result",
        text: action.text,
        fromId: action.agentId,
      })
    default:
      return state
  }
}

export function dispatchAll(state: RoomState, actions: Action[]): RoomState {
  return actions.reduce(reduce, state)
}
