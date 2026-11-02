# MessageMedia Console — PLAN

## Goal
One user sends an SMS through the Sinch MessageMedia (Sinch Engage) Messages API, watches that message's status and delivery reports, reads inbound replies, and compares the API with the Sinch Build SMS API — all from one page.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, label, switch, tabs, table)
- Integration: MessageMedia REST API at `https://api.messagemedia.com` (APAC) or `https://eu.app.api.sinch.com` (EU), called from Next.js route handlers with Basic or HMAC-SHA256 auth via `fetch` + `node:crypto`

## Tasks
1. Open the console → header shows **Live** when `MESSAGEMEDIA_API_KEY` + `MESSAGEMEDIA_API_SECRET` are set, otherwise **Credentials required** naming the missing vars.
2. Compose number + text → see E.164 validation, GSM-7/UCS-2 segment count, and the exact `POST /v1/messages` body plus auth header shape (labelled "preview, not sent").
3. Send → `POST /v1/messages` returns a `message_id`; the message appears in the sent list. Without credentials, Send is refused server-side with a clear "credentials required" error.
4. Refresh a sent message → `GET /v1/messages/{id}` updates its status; **Check delivery reports** pulls `GET /v1/delivery_reports`, attaches them to messages, and confirms them via `POST /v1/delivery_reports/confirmed`.
5. **Check replies** → `GET /v1/replies` lists inbound replies (from, text, received time, original message) and confirms them via `POST /v1/replies/confirmed`.
6. Comparison panel → side-by-side MessageMedia vs Sinch Build SMS: auth model, endpoints, payload shape, status/inbound model.

## Decisions & risks
- The official `messagemedia-messages-sdk` (last published 2022) depends on the deprecated `request` package, so a thin typed `fetch` client covers the six endpoints used. HMAC signing follows the spec exactly: `Date`, `Content-MD5` (body only) and request line, HMAC-SHA256, base64.
- Secrets stay server-side; the browser only learns whether credentials exist, which auth mode is active, and the base URL.
- No mocked API output. Without credentials every API panel shows "credentials required"; only the local preview, validation, and the static comparison render data.
- Pull model (check + confirm) instead of webhooks: a local dev server has no public `callback_url`.
- Sent-message list lives in server memory for the session; nothing is persisted.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
