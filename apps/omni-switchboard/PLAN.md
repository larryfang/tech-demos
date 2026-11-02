# Omni Switchboard — PLAN

## Goal
Compose one message, pick target channels (SMS, WhatsApp, RCS, Messenger), order the fallback chain, and send it through the real Sinch Conversation API — visualizing the channel priority chain and the resulting message status.

## Stack
- `bunx create-next-app` scaffold (Next.js App Router, TypeScript, Tailwind), Bun runtime
- shadcn/ui (only rendered components)
- `@sinch/sdk-core` — official Sinch JS SDK (Conversation API), server-side in API routes
- Credentials from env: `SINCH_PROJECT_ID`, `SINCH_KEY_ID`, `SINCH_KEY_SECRET`, `SINCH_APP_ID`, `SINCH_REGION`

## Tasks
1. Open the app → see live credential status (which `SINCH_*` env vars are present) and a clear "credentials required" state when they're missing.
2. Type a message + recipient identities → toggle channels on/off and reorder them → see the priority/fallback chain visualized instantly (works fully offline).
3. Press Send → the server calls `POST /messages:send` with `channel_priority_order` via the official SDK → see the real API response (message id or real error).
4. After a send → poll `GET /messages/{id}` → see the dispatched channel and message record as a status timeline.

## Decisions & risks
- No `SINCH_*` credentials exist in this environment: the integration is fully implemented and env-driven, the UI shows a "credentials required" banner, and the send path surfaces the real API error — no fake responses.
- Delivery receipts (`DELIVERED`/`READ`) arrive via webhooks, which need a public URL; the demo polls the message record instead and says so in the UI.
- Channels limited to SMS, WhatsApp, RCS, Messenger per the pick; each needs its identity (phone number or Messenger PSID).
