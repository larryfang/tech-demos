# Webhook Signal Tap — PLAN

## Goal
A single-user local receiver/debugger for Sinch webhooks: it verifies real Sinch callback signatures (Conversation API HMAC + Verification/Voice application-signed requests), categorizes and pretty-prints each event on a timeline, and can replay any captured event to a local handler — with a clearly-labeled simulator (sample payloads from Sinch docs) so the happy path runs fully locally.

## Stack
- `bunx create-next-app` (Next.js App Router, TypeScript, Tailwind v4) on Bun — same as sibling apps
- shadcn/ui, default theme, only rendered components
- No external services: receivers are Next route handlers; events kept in-memory (single-user dev tool)
- Signature logic in `lib/signing.ts`, tested with `bun test` against the official vectors in Sinch docs

## Tasks
1. Click a sample event (SMS delivery receipt, inbound message, verification result, voice ICE/DICE) → a genuinely signed HTTP POST hits the local receiver and appears on the timeline marked **Simulated sample**.
2. Every received event shows a signature verdict — `verified` / `failed` / `unsigned` — computed with the real Sinch schemes:
   - Conversation API: `Base64(HMAC-SHA256(secret, rawBody + "." + nonce + "." + timestamp))` vs `x-sinch-webhook-signature`
   - Verification/Voice: `Authorization: Application <key>:<Base64(HMAC-SHA256(b64decode(secret), verb\nContent-MD5\ncontent-type\nx-timestamp:<ts>\npath))>`
3. Send a tampered sample (wrong secret) → timeline shows a red `failed` verdict, proving verification is real.
4. Each event is categorized (delivery receipt / inbound message / verification / voice / other) and its raw JSON pretty-printed in an expandable view.
5. Replay any captured event to a user-supplied local handler URL (raw body + original signature headers forwarded) and show the handler's response status.
6. `bun test` passes signature unit tests built from the two official worked examples in Sinch docs.
7. README documents pointing real Sinch webhooks at the receiver via a tunnel (e.g. `cloudflared`/`ngrok`) and configuring secrets via env vars.

## Decisions & risks
- In-memory event store (globalThis) — refresh-safe during one dev session, by design for a single-user MVP.
- Demo secrets default from env (`CONVERSATION_WEBHOOK_SECRET`, `SINCH_APPLICATION_KEY/SECRET`) so the simulator and real traffic use the same verification path.
- Simulated events are labeled in the UI and tagged via an unsigned extra header; they are never presented as live traffic.
- Voice/Verification signing canonicalizes the request path — receiver must use its own route path, which the simulator also signs against.
