# Omni Switchboard

Compose one message, pick target channels (SMS, WhatsApp, RCS, Messenger), order the
fallback chain, and send it through the real [Sinch Conversation API](https://developers.sinch.com/docs/conversation/)
using the official [`@sinch/sdk-core`](https://github.com/sinch/sinch-sdk-javascript) JS SDK.
The channel priority / fallback chain and the exact request body are visualized live.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

The server reads these environment variables (from the [Sinch dashboard](https://dashboard.sinch.com/convapi/overview)):

| Variable           | Required | Notes                                   |
| ------------------ | -------- | --------------------------------------- |
| `SINCH_PROJECT_ID` | yes      | Project ID                              |
| `SINCH_KEY_ID`     | yes      | Access key ID (OAuth2)                  |
| `SINCH_KEY_SECRET` | yes      | Access key secret (OAuth2)              |
| `SINCH_APP_ID`     | yes      | Conversation API app with channels set up |
| `SINCH_REGION`     | no       | `us` (default), `eu`, or `br` — must match the app's region |

Without credentials the UI shows a "credentials required" banner; channel toggles,
fallback-chain visualization, and the request preview still work, and the send button
surfaces the server's real 503 response. With credentials, sends go to
`POST /v1/projects/{project}/messages:send` with `channel_priority_order`, and the app
polls `GET /messages/{id}` for the message record. `DELIVERED`/`READ` receipts arrive via
webhooks, which need a public callback URL and are out of scope for this single-user demo.
