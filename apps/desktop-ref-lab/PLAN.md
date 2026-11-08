# Desktop Ref Lab — PLAN

## Goal
A local web console that makes agent-desktop’s snapshot → act on a ref → re-snapshot loop visible: pick a target app, inspect its accessibility tree, click or type a ref, then see a tree diff and the JSON envelope (including STALE_REF).

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, badge, card, input, scroll-area)
- Engine: typed snapshot/command envelopes + tree diff + fixture replay (bun test)
- Live (optional): Vite `/api/live/*` shells out to `agent-desktop` if installed; never required

## Tasks
1. Load a fixture app → see its accessibility tree with role, name, and clickable refs.
2. Select a ref → click or type → auto re-snapshot with added/removed/changed nodes highlighted.
3. Side panel shows the raw JSON envelope, errors (STALE_REF, INVALID_ARGS, PERM_DENIED), and a command history timeline.
4. Replay a scripted STALE_REF (act, then reuse a previous snapshot’s ref) without any OS permissions.
5. Toggle Live: if `agent-desktop` is installed, list real apps and proxy snapshot/click/type; if not, stay in replay with a clear status.

## Decisions & risks
- Inspired by [vercel-labs/agent-desktop](https://github.com/vercel-labs/agent-desktop) (Apache-2.0). Original fixtures and UI; credit in README. Envelope shape follows contract `2.6`.
- Replay is the default and the happy path. Live mode is a thin CLI adapter and must never be required.
- Stretch (out of scope): an LLM agent loop that plans clicks from the tree.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no multi-user, no deployment.
