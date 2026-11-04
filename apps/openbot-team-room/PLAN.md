# OpenBot Team Room — PLAN

## Goal
A one-page browser team room that recreates OpenBot’s owner/delegation and per-agent FIFO queues so you can watch a scripted four-agent run play out offline in about 30–60 seconds.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui minimalist (button, card, badge, input, textarea, label, select, progress)
- Engine: small reducer/state machine in `src/engine` (tickable; no real timers in tests)
- Optional live model: Vite `/api/complete` + `/api/status` when `OPENAI_API_KEY` is set; mock workers otherwise

## Tasks
1. Open the room → see Planner, Coder, Reviewer, Researcher with editable name/role/instructions and idle/working/paused/blocked status.
2. Enqueue on an agent → FIFO order is visible; pause/resume the agent; cancel a queued item; the running item shows progress.
3. Post a shared-channel task with one owner → owner script splits it, handoff messages appear, subtasks land on other queues, results return, owner closes the task. Stop / Reassign / Archive work.
4. Direct agent-to-agent messages show in the same channel timeline.
5. Click **Run sample scenario** → a seeded fixture run (~30–60s) plays without any key.
6. With `OPENAI_API_KEY`, one agent can call `/api/complete`; without it the room still works.
7. Reload keeps state (localStorage); **Reset** restores the seed roster. Engine unit tests cover FIFO, pause/resume, cancel, delegation/handback, reassign, stop.

## Decisions & risks
- Inspired by [OpenBot](https://github.com/nightly-labs/openbot) only. PolyForm Noncommercial — copy no code, assets, or text. Own fixtures and copy.
- Mock workers are the happy path so the screenshot/video need no credentials. Live model is opt-in and isolated to one route.
- Engine is a pure `reduce(state, action)` plus `TICK { now }` so tests never wait on wall clocks.
- Owner scripts are sequential: each handoff blocks the owner item until the delegate hands back.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- Out of scope: real CLI/agent processes, multi-user, auth, desktop packaging, on-disk workspaces.
