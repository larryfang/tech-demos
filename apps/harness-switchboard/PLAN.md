# Harness Switchboard — PLAN

## Goal
Dispatch one coding task to 2–3 agent harnesses and watch UHP-style streams run side by side, then compare time, cost, tokens, and files — fixture replay by default, optional live `HARNESSROUTER_URL`.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, checkbox, label, textarea, table, scroll-area)
- Integration: recorded UHP SSE fixtures (Codex, Claude Code, Hermes × 2 sample tasks); optional proxy to a self-hosted HarnessRouter `POST /v1/responses`

## Tasks
1. Open the switchboard with no URL → see a Fixture badge, two sample tasks, and three harnesses.
2. Pick a sample (or type a task), select 2–3 harnesses, Dispatch → each lane streams steps with status and a Cancel button.
3. At least one fixture ends in a structured-failure state; cancel mid-stream marks that lane cancelled.
4. After lanes finish → results table (time, cost, tokens, files), file diff viewer, Pick winner.
5. Set `HARNESSROUTER_URL` and opt into live → lanes hit the self-hosted instance; missing URL or API failure falls back with a clear message.
6. README documents fixture vs live and that this is inspired by HarnessRouter, not a fork.

## Decisions & risks
- Fixture-first: real Codex / Claude Code / Hermes need a self-hosted HarnessRouter; screenshots/videos must work with zero credentials.
- Original demo only. Do not vend or copy HarnessRouter source; fixtures follow UHP `2026-10-19` event types.
- Next.js API routes hold `HARNESSROUTER_URL`; the browser never sees it.
- Live dispatch is opt-in even when a URL exists.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
