# Webhook Signal Tap

A local receiver & debugger for **Sinch webhooks**: it captures callbacks (SMS delivery
receipts, inbound messages, verification events, voice events), **verifies their
signatures using Sinch's documented signing schemes**, categorizes and pretty-prints each
event on a timeline, and can replay any captured event to a local handler.

A clearly-labeled **event simulator** (sample payloads from Sinch docs) makes the happy
path run fully locally — simulated events are genuinely signed and delivered over real
HTTP to the same receivers, so they exercise the exact verification path live traffic
would.

## Run

```bash
bun install
bun run dev
# open http://localhost:3000
```

Tests (signature verification against the official worked examples in Sinch docs):

```bash
bun test
```

## Receiver endpoints

| Endpoint | Scheme | Sinch products |
| --- | --- | --- |
| `POST /api/hooks/conversation` | HMAC-SHA256 over `rawBody.nonce.timestamp`, `x-sinch-webhook-signature*` headers | Conversation API (SMS/WhatsApp/RCS delivery receipts, inbound messages, contact events) |
| `POST /api/hooks/application` | Application-signed request: `Authorization: Application <key>:<Base64(HMAC-SHA256(b64decode(secret), StringToSign))>` with `StringToSign = verb \n Content-MD5 \n content-type \n x-timestamp:<ts> \n path` | Verification API & Voice API callbacks |

Verification verdicts shown per event:

- **verified** — signature recomputed from the raw body matches
- **failed** — signature mismatch (wrong secret or tampered payload)
- **unsigned** — no signature headers present

Signature references:

- [Conversation API callbacks — HMAC validation](https://developers.sinch.com/docs/conversation/callbacks/)
- [Verification/Voice callback request signing](https://developers.sinch.com/docs/verification/api-reference/authentication/callback-signed-request/)

## Pointing real Sinch webhooks at it

The receivers must be publicly reachable, so run a tunnel:

```bash
# Cloudflare
cloudflared tunnel --url http://localhost:3000
# or ngrok
ngrok http 3000
```

Then configure in Sinch:

1. **Conversation API** — [dashboard](https://dashboard.sinch.com/convapi/apps) → your app →
   add a webhook with target `https://<tunnel-host>/api/hooks/conversation`, triggers such
   as `MESSAGE_INBOUND` / `MESSAGE_DELIVERY`, and a **secret**. Export the same secret here:

   ```bash
   CONVERSATION_WEBHOOK_SECRET=<your webhook secret> bun run dev
   ```

2. **Verification / Voice** — [dashboard](https://dashboard.sinch.com/verification/apps) →
   your app → set the callback URL to `https://<tunnel-host>/api/hooks/application`, and
   export the app credentials (secret stays base64-encoded, exactly as the dashboard shows it):

   ```bash
   SINCH_APPLICATION_KEY=<key> SINCH_APPLICATION_SECRET=<base64 secret> bun run dev
   ```

Without these env vars the app uses demo defaults (shown in the UI), which is what the
simulator signs with.

> Note: the application-signed scheme canonicalizes the **request path**. The receiver
> verifies against `/api/hooks/application`, so the tunnel must forward the path
> unchanged (both `cloudflared` and `ngrok` do).

## Simulator

The left panel sends sample payloads **taken from Sinch documentation** — an SMS delivery
receipt, an inbound SMS, verification request/result events, and voice ICE/DICE events.
Each is signed with the configured secrets and POSTed to the local receiver. Events from
the simulator are always badged **SIMULATED SAMPLE** in the timeline (real traffic shows
**EXTERNAL**). **Tamper mode** signs with a wrong secret to demonstrate that verification
genuinely rejects bad signatures.

## Replay

Expand any captured event, enter a local handler URL (e.g. `http://localhost:4000/webhook`),
and replay: the original raw body plus original signature headers are forwarded, so your
handler can run its own signature verification against the same bytes.
