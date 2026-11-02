# MessageMedia SMS Console

Single-user console for the [Sinch MessageMedia (Sinch Engage) Messages API](https://messagemedia.github.io/documentation/): send an SMS, follow its status and delivery reports, read inbound replies, and compare the API with the Sinch Build SMS API.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

Every MessageMedia call happens in a Next.js route handler; the browser never sees the secret.

| Variable | Required | Notes |
| --- | --- | --- |
| `MESSAGEMEDIA_API_KEY` | yes | API key from the MessageMedia / Sinch Engage hub |
| `MESSAGEMEDIA_API_SECRET` | yes | Matching secret |
| `MESSAGEMEDIA_AUTH_MODE` | no | `basic` (default) or `hmac`. Must match the key type you created. |
| `MESSAGEMEDIA_BASE_URL` | no | `https://api.messagemedia.com` (APAC, default) or `https://eu.app.api.sinch.com` (EU) |
| `MESSAGEMEDIA_SOURCE_NUMBER` | no | Sender: `+E.164`, short-code digits, or an approved alphanumeric ID |

Put them in `.env.local` (gitignored, see `.env.example`) and restart `bun run dev`.

**Without credentials** the header shows **Credentials required**. Send, status refresh, delivery reports and replies are disabled in the UI and refused by the server with `503 credentials_required`. What still runs: E.164 validation, the GSM-7/UCS-2 segment counter, the server-built request preview (secret-derived values stay as placeholders), and the MessageMedia vs Sinch Build comparison. No API responses are mocked.

## What it calls

| UI action | MessageMedia endpoint |
| --- | --- |
| Send SMS | `POST /v1/messages` (`format: SMS`, `delivery_report: true`) |
| Refresh status | `GET /v1/messages/{message_id}` |
| Check delivery reports | `GET /v1/delivery_reports`, then `POST /v1/delivery_reports/confirmed` |
| Check replies | `GET /v1/replies`, then `POST /v1/replies/confirmed` |

Delivery reports and replies use the pull model (check, then confirm) because a local dev server has no public `callback_url` for webhooks. "Auto-check every 10s" polls both.

### Auth

- **Basic:** `Authorization: Basic base64(key:secret)`.
- **HMAC:** sign `Date: …\nContent-MD5: <md5 hex of body>\nPOST /v1/messages HTTP/1.1` with HMAC-SHA256 using the secret, base64 it, and send `Authorization: hmac username="<key>", algorithm="hmac-sha256", headers="Date Content-MD5 request-line", signature="…"`. `Content-MD5` is omitted for requests without a body. See `lib/messagemedia.ts`.

The official `messagemedia-messages-sdk` package was last published in 2022 and depends on the deprecated `request` library, so the app uses a small typed `fetch` client instead.

## Tests

```bash
bun test
```

Covers config/secret handling, Basic and HMAC header construction, the send payload, the request preview, E.164 validation and SMS segment counting.

See `PLAN.md` for scope.
