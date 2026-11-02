# Mailgun Deliverability Desk — PLAN

## Goal
One user composes and sends a real email through the Mailgun API (with open/click tracking on), then watches delivery outcomes — accepted, delivered, opened, clicked, bounced, complained — stream into a live events dashboard pulled from Mailgun's analytics logs API.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind v4)
- Runtime/PM: Bun
- UI: shadcn/ui (button, card, input, textarea, badge, table, tabs only)
- Key library: `mailgun.js` (official SDK) for sending; `POST /v1/analytics/logs` REST for events (v3 events API is deprecated)

## Tasks
1. Open the app → see connection status: live domain check when `MAILGUN_API_KEY`/`MAILGUN_DOMAIN` are set, or a clear "credentials required" banner with setup instructions when not.
2. Fill out from/to/subject/body → click Send → real `POST /v3/{domain}/messages` via mailgun.js with `o:tracking` enabled → see the queued message ID returned by Mailgun.
3. See a live events feed (auto-polling `POST /v1/analytics/logs`) with per-event type badges: accepted, delivered, opened, clicked, failed, complained, unsubscribed.
4. See deliverability counters summarizing the fetched events (delivered / opened / clicked / bounced / complained).
5. Switch to a Suppressions tab → see the domain's real bounce, complaint, and unsubscribe lists from `/v3/{domain}/bounces|complaints|unsubscribes`.

## Decisions & risks
- No credentials exist in this environment, so the happy-path demo shows the full UI in "credentials required" mode; all API code paths are real and env-driven (`MAILGUN_API_KEY`, `MAILGUN_DOMAIN`, optional `MAILGUN_API_BASE_URL` for EU, `MAILGUN_FROM`).
- API key stays server-side: all Mailgun calls go through Next.js route handlers, never the browser.
- Events use the current `/v1/analytics/logs` endpoint (raw fetch) because mailgun.js still targets the deprecated v3 events API.
- Polling (5s) instead of webhooks — no public URL in a local single-user demo.
- Sandbox domains only deliver to pre-authorized recipients; noted in the UI helper text.
