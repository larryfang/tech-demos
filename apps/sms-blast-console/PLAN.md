# SMS Blast Console — PLAN

## Goal
Compose an SMS campaign (name, from, body, recipient list), send it as one real Sinch SMS batch via the official JS SDK, and watch per-recipient delivery receipts update live in a dashboard — with a clear "credentials required" state when Sinch env vars are absent.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, label, table)
- Integration: official `@sinch/sdk-core` — `sms.batches.send` to send, `sms.deliveryReports.get` polled for live receipts
- Credentials via env: `SINCH_PROJECT_ID` + `SINCH_KEY_ID` + `SINCH_KEY_SECRET` (unified) or `SINCH_SERVICE_PLAN_ID` + `SINCH_API_TOKEN` (service plan), plus `SINCH_SMS_REGION` and `SINCH_FROM_NUMBER`

## Tasks
1. Open the console → header badge shows Live (creds detected) or Credentials required (which env vars are missing).
2. Fill campaign name, from number, message, recipients (one per line) → client-side count + segment estimate update as you type.
3. Send with creds → real batch submitted to Sinch, campaign appears in dashboard with batch ID and per-recipient rows.
4. Dashboard polls delivery receipts every few seconds → recipient statuses move Queued → Dispatched → Delivered/Failed without reload.
5. Send without creds → request is refused with an honest 503 listing missing env vars; nothing fake is shown.
6. README documents env vars, region, and `bun install && bun run dev`.

## Decisions & risks
- Delivery receipts are **polled** (`deliveryReports.get`, full type) instead of webhooks — the demo runs on localhost with no public callback URL.
- Campaign state lives in server memory (single-user MVP, no persistence).
- API routes hold credentials; the browser never sees Sinch secrets.
- No credentials exist in this build environment, so the demo shows the credentials-required path; the send path is real code, exercised only when env vars are set.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
