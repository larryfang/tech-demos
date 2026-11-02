# Sinch Fax Dropbox — PLAN

## Goal
Drag a PDF onto the page and send it as a real fax via the Sinch Fax API, then watch its transmission status and browse received faxes with preview — all in one sitting, no auth.

## Stack
- `bunx create-next-app` (App Router, TypeScript, Tailwind 4), Bun runtime
- shadcn/ui (button, card, badge, input, tabs only)
- Sinch Fax API v3 via plain `fetch` (OAuth2 client-credentials at `auth.sinch.com`, fax endpoints at `fax.api.sinch.com/v3/projects/{id}`) — Node SDK fax support is preview-only, so direct REST is the prebuilt-official path

## Tasks
1. Drop or pick a PDF → see it previewed inline before anything is sent.
2. Enter a destination number, hit Send → fax is submitted to Sinch (multipart upload) and appears in the outbox as QUEUED.
3. Outbox rows poll `GET /faxes/{id}` → status advances QUEUED → IN_PROGRESS → COMPLETED/FAILURE with error detail.
4. Received tab lists `direction=INBOUND` faxes → click one to preview the fax PDF (proxied `GET /faxes/{id}/file.pdf`).
5. Without `SINCH_*` env vars, the app runs in a clearly-labeled "credentials required" state: upload/preview/queueing UI works, send is blocked with an honest explanation, nothing is faked.

## Decisions & risks
- Credentials via env: `SINCH_PROJECT_ID`, `SINCH_KEY_ID`, `SINCH_KEY_SECRET`, optional `SINCH_FAX_FROM`. `/api/health` reports configured/not; server-side only.
- Sinch test number `+19898989898` emulates a real fax without charges — default recipient hint for demos.
- Status via polling, not webhooks: a local demo has no public callback URL.
- Risk: no credentials in the build environment → demo shows the offline happy path (upload, preview, queue block) and the real send path is exercised only by code review + the credentials-required API responses.
