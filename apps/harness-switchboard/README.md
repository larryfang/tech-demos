# Harness Switchboard

Single-user web lab **inspired by** [HarnessRouter](https://github.com/HarnessRouter/harnessrouter) ([bookmark](https://x.com/_avichawla/status/2113954302901256597)): enter one coding task, pick 2–3 agent harnesses, and watch Unified Harness Protocol streams run side by side.

This is an **original fixture-first demo**. It is **not** a fork, vendor, or redistribution of HarnessRouter.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge, two sample tasks, and Codex / Claude Code / Hermes. Press **Dispatch** — lanes stream recorded UHP events. No keys and no `HARNESSROUTER_URL` are required.

```bash
bun test
bun run build
```

## Happy path

1. Keep **Slugify helper** (or switch to **Soft-delete users**).
2. Leave all three harnesses selected.
3. Press **Dispatch**. Each lane shows reasoning, tool calls, and a Cancel button.
4. Wait for terminal statuses. Hermes on soft-delete ends in a structured `sandbox_denied` failure.
5. Compare time, cost, tokens, and files in the results table. Open a produced file in the diff viewer. **Pick winner**.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | No `HARNESSROUTER_URL`, or Dispatch without “Use live HarnessRouter” | Recorded UHP `2026-10-19` event streams replay with realistic delays. Badge stays **Fixture**. |
| **Live** | `HARNESSROUTER_URL` is set **and** you check “Use live HarnessRouter” | Server `POST`s `/v1/responses` (`stream: true`, `metadata.harness_id`) on that self-hosted instance. |

If the URL is missing or the live call fails, the lane falls back to its fixture and shows the error.

### Enable live mode

1. Point at a self-hosted HarnessRouter in `.env.local` (gitignored):

   ```bash
   HARNESSROUTER_URL=http://127.0.0.1:8080
   # optional, only if the instance requires a Bearer token
   # HARNESSROUTER_API_KEY=
   ```

2. Restart `bun run dev`. The header shows **Live ready**. Check **Use live HarnessRouter** only when you intend to hit that instance.

## This lab vs HarnessRouter

| | This demo | Real [HarnessRouter](https://github.com/HarnessRouter/harnessrouter) |
| --- | --- | --- |
| Harnesses | 3 recorded lanes (Codex, Claude Code, Hermes) | Codex, Claude Code, Hermes, PI, DSH, and more |
| Transport | Fixture SSE replay, optional live proxy | Self-hosted UHP API |
| Sessions / files | Compared in-page from fixture metadata | Real workspaces, cancel, traces |
| Auth | None | Your keys, your infrastructure |

## Stack

Next.js (App Router) · Bun · shadcn/ui · recorded UHP fixtures · optional HarnessRouter `POST /v1/responses`

See `PLAN.md` for scope.
