import { describe, expect, test } from "bun:test"
import { CODER_ID, PLANNER_ID, RESEARCHER_ID, REVIEWER_ID } from "../fixtures/agents"
import { LAUNCH_OWNER_SCRIPT_ID, SOLO_SCRIPT_ID } from "../fixtures/scripts"
import { reduce } from "./reduce"
import { seedState } from "./seed"
import { activeQueueOf, agentById, runningOf } from "./selectors"

function run(actions: Parameters<typeof reduce>[1][], start = seedState(0)) {
  return actions.reduce(reduce, start)
}

function advance(state: ReturnType<typeof seedState>, now: number) {
  return reduce(state, { type: "TICK", now })
}

describe("FIFO ordering", () => {
  test("starts the first queued item and keeps later items waiting", () => {
    let state = run([
      { type: "ENQUEUE", agentId: CODER_ID, title: "one", scriptId: SOLO_SCRIPT_ID },
      { type: "ENQUEUE", agentId: CODER_ID, title: "two", scriptId: SOLO_SCRIPT_ID },
      { type: "ENQUEUE", agentId: CODER_ID, title: "three", scriptId: SOLO_SCRIPT_ID },
    ])
    state = advance(state, 0)

    const queue = activeQueueOf(state, CODER_ID)
    expect(queue.map((item) => item.title)).toEqual(["one", "two", "three"])
    expect(queue[0]?.status).toBe("running")
    expect(queue[1]?.status).toBe("queued")
    expect(queue[2]?.status).toBe("queued")
    expect(agentById(state, CODER_ID)?.status).toBe("working")
  })

  test("starts the next queued item after the running one finishes", () => {
    let state = run([
      { type: "ENQUEUE", agentId: CODER_ID, title: "one" },
      { type: "ENQUEUE", agentId: CODER_ID, title: "two" },
    ])
    state = advance(state, 0)
    state = advance(state, 6_000)

    const one = state.items.find((item) => item.title === "one")
    const two = state.items.find((item) => item.title === "two")
    expect(one?.status).toBe("done")
    expect(two?.status).toBe("running")
    expect(agentById(state, CODER_ID)?.status).toBe("working")
  })
})

describe("pause and resume", () => {
  test("freezes running progress while paused and continues after resume", () => {
    let state = run([{ type: "ENQUEUE", agentId: CODER_ID, title: "solo" }])
    state = advance(state, 0)
    state = advance(state, 2_000)
    const mid = runningOf(state, CODER_ID)?.progress ?? 0
    expect(mid).toBeCloseTo(2_000 / 6_000, 5)

    state = reduce(state, { type: "PAUSE_AGENT", agentId: CODER_ID })
    state = advance(state, 10_000)
    expect(runningOf(state, CODER_ID)?.progress).toBeCloseTo(mid, 5)
    expect(agentById(state, CODER_ID)?.status).toBe("paused")

    state = reduce(state, { type: "RESUME_AGENT", agentId: CODER_ID })
    state = advance(state, 10_000)
    expect(runningOf(state, CODER_ID)?.progress).toBeCloseTo(mid, 5)
    expect(agentById(state, CODER_ID)?.status).toBe("working")

    state = advance(state, 13_000)
    expect(runningOf(state, CODER_ID)?.progress).toBeCloseTo(5_000 / 6_000, 5)
  })

  test("does not start a queued item while the agent is paused", () => {
    let state = run([
      { type: "PAUSE_AGENT", agentId: REVIEWER_ID },
      { type: "ENQUEUE", agentId: REVIEWER_ID, title: "wait" },
    ])
    state = advance(state, 1_000)
    expect(state.items[0]?.status).toBe("queued")
    expect(agentById(state, REVIEWER_ID)?.status).toBe("paused")

    state = reduce(state, { type: "RESUME_AGENT", agentId: REVIEWER_ID })
    state = advance(state, 1_000)
    expect(state.items[0]?.status).toBe("running")
  })
})

describe("cancel", () => {
  test("cancels a queued item without starting it", () => {
    let state = run([
      { type: "ENQUEUE", agentId: CODER_ID, title: "keep" },
      { type: "ENQUEUE", agentId: CODER_ID, title: "drop" },
    ])
    state = advance(state, 0)
    const drop = state.items.find((item) => item.title === "drop")
    state = reduce(state, { type: "CANCEL_ITEM", itemId: drop?.id ?? "" })
    expect(state.items.find((item) => item.title === "drop")?.status).toBe("cancelled")
    expect(runningOf(state, CODER_ID)?.title).toBe("keep")
  })

  test("cancels a running item and lets the next queued item start", () => {
    let state = run([
      { type: "ENQUEUE", agentId: CODER_ID, title: "keep" },
      { type: "ENQUEUE", agentId: CODER_ID, title: "next" },
    ])
    state = advance(state, 0)
    const keep = state.items.find((item) => item.title === "keep")
    state = reduce(state, { type: "CANCEL_ITEM", itemId: keep?.id ?? "" })
    state = advance(state, 0)
    expect(state.items.find((item) => item.title === "keep")?.status).toBe("cancelled")
    expect(runningOf(state, CODER_ID)?.title).toBe("next")
  })
})

describe("delegation and handback", () => {
  test("owner hands off, blocks, then unblocks when the delegate reports back", () => {
    let state = run([
      {
        type: "POST_CHANNEL_TASK",
        title: "Ship the v0.3 launch checklist",
        body: "checklist",
        ownerId: PLANNER_ID,
        scriptId: LAUNCH_OWNER_SCRIPT_ID,
      },
    ])
    state = advance(state, 0)
    state = advance(state, 1_800)

    expect(agentById(state, PLANNER_ID)?.status).toBe("blocked")
    const research = activeQueueOf(state, RESEARCHER_ID)[0]
    expect(research?.title).toBe("Scan launch risks")
    expect(research?.status).toBe("running")
    expect(state.messages.some((message) => message.kind === "handoff")).toBe(true)

    state = advance(state, 9_800)
    expect(state.items.find((item) => item.id === research?.id)?.status).toBe("done")
    expect(state.messages.some((message) => message.kind === "result")).toBe(true)
    expect(agentById(state, PLANNER_ID)?.status).toBe("working")
    expect(runningOf(state, PLANNER_ID)?.waitingOnItemId).toBeUndefined()
  })

  test("owner closes the channel task after the last handback", () => {
    let state = run([
      {
        type: "POST_CHANNEL_TASK",
        title: "Ship the v0.3 launch checklist",
        body: "checklist",
        ownerId: PLANNER_ID,
        scriptId: LAUNCH_OWNER_SCRIPT_ID,
      },
    ])
    // 12s owner work + 8s research + 10s code + 8s review = 38s
    for (let now = 0; now <= 38_000; now += 200) {
      state = advance(state, now)
    }

    expect(state.channelTasks[0]?.status).toBe("done")
    expect(state.messages.some((message) => message.kind === "close" || message.text.includes("closed"))).toBe(true)
    expect(agentById(state, PLANNER_ID)?.status).toBe("idle")
    expect(state.messages.some((message) => message.kind === "direct" && message.toId === REVIEWER_ID)).toBe(true)
  })
})

describe("reassign", () => {
  test("moves ownership and starts a fresh owner slice on the new agent", () => {
    let state = run([
      {
        type: "POST_CHANNEL_TASK",
        title: "Ship it",
        body: "go",
        ownerId: PLANNER_ID,
        scriptId: LAUNCH_OWNER_SCRIPT_ID,
      },
    ])
    state = advance(state, 0)
    const taskId = state.channelTasks[0]?.id ?? ""
    const oldOwnerItem = runningOf(state, PLANNER_ID)

    state = reduce(state, { type: "REASSIGN_OWNER", taskId, ownerId: CODER_ID })
    state = advance(state, 0)

    expect(state.channelTasks[0]?.ownerId).toBe(CODER_ID)
    expect(state.items.find((item) => item.id === oldOwnerItem?.id)?.status).toBe("cancelled")
    expect(runningOf(state, CODER_ID)?.channelTaskId).toBe(taskId)
    expect(agentById(state, CODER_ID)?.status).toBe("working")
    expect(state.messages.some((message) => message.text.includes("reassigned"))).toBe(true)
  })
})

describe("stop", () => {
  test("stops the channel task and cancels related queue items", () => {
    let state = run([
      {
        type: "POST_CHANNEL_TASK",
        title: "Ship it",
        body: "go",
        ownerId: PLANNER_ID,
        scriptId: LAUNCH_OWNER_SCRIPT_ID,
      },
    ])
    state = advance(state, 0)
    state = advance(state, 1_800)
    const taskId = state.channelTasks[0]?.id ?? ""

    state = reduce(state, { type: "STOP_TASK", taskId })
    expect(state.channelTasks[0]?.status).toBe("stopped")
    expect(
      state.items
        .filter((item) => item.channelTaskId === taskId)
        .every((item) => item.status === "cancelled"),
    ).toBe(true)
    expect(agentById(state, PLANNER_ID)?.status).toBe("idle")
    expect(agentById(state, RESEARCHER_ID)?.status).toBe("idle")
  })
})
