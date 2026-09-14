# Dialbot Console — PLAN

## Goal
Compose an outbound Bland voice call (number + task + optional voice) and read back a transcript with cost — dry-run/mock by default, live `POST /v1/calls` only when `BLAND_API_KEY` is set.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, select, label)
- Integration: Bland AI `POST /v1/calls` + `GET /v1/calls/:id` when a key is present; otherwise seeded fixtures + local dry-run transcript

## Tasks
1. Open the console with no Bland key → see a Dry-run badge and a seeded call history.
2. Fill to-number + task (optional voice) and Send → get a mock transcript and cost estimate, still badged Dry-run.
3. Click a recent call → detail panel shows transcript, status, and cost.
4. Set `BLAND_API_KEY` and opt into live → badge flips to Live, send hits Bland, poll until complete; missing key or API failure falls back with a clear message (no paid call).
5. README documents dry-run vs live (`BLAND_API_KEY`).

## Decisions & risks
- Dry-run is the default send path so screenshots/videos work with zero credentials and no paid minutes.
- Next.js API routes hold the key and call Bland; the browser never sees `BLAND_API_KEY`.
- Live send is opt-in even when a key exists, so validation never places a real call by accident.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
