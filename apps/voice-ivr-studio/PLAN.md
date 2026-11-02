# Voice IVR Studio — PLAN

## Goal
Visually compose a Sinch SVAML call flow (say → menu / collect digits / connect / hangup), watch the generated SVAML JSON live, and place a real Sinch Voice API callout with that flow when `SINCH_APPLICATION_KEY`/`SINCH_APPLICATION_SECRET` are set.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, select, label, textarea, separator)
- Integration: Sinch Voice REST API `POST /calling/v1/callouts` (`customCallout`, Basic Auth) via a Next.js API route; region base URL from `SINCH_VOICE_REGION`

## Tasks
1. Add/edit/reorder/remove "Say" steps and pick exactly one terminal action (IVR menu with DTMF options, collect digits, connect to PSTN, or hangup) → the flow list reflects it.
2. Every edit instantly regenerates valid SVAML JSON in a live preview panel (copyable), fully offline.
3. With no credentials, the header shows a "Credentials required" state, the callout button is disabled, and the UI lists exactly which env vars to set.
4. With `SINCH_APPLICATION_KEY` + `SINCH_APPLICATION_SECRET` set, enter destination + CLI and place a real callout → the UI shows the real `callId` returned by Sinch (errors surfaced verbatim).
5. README documents env vars, SVAML mapping, and the PIE-callback limitation.

## Decisions & risks
- SVAML allows many instructions but exactly ONE action per response — the builder enforces this (say steps = instructions, one terminal step = action).
- The builder composes the ACE SVAML (what runs when the callee answers); ICE is a fixed `connectPstn` to the destination generated at callout time.
- `runMenu` results fire a PIE webhook that needs a public URL — out of scope for a single-user local MVP; noted in UI/README. The menu still plays and collects digits on a real call.
- Credentials live only in API routes; `/api/status` exposes booleans, never values. No credentials in this environment → demo shows the offline builder + credentials-required state; no fake API responses.
- `bunfig.toml` with `minimumReleaseAge = 259200` created before `bun install`.
