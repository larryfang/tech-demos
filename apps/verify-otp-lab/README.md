# Verify OTP Lab

Walk a phone number through a **real Sinch Verification** flow — SMS PIN or
flashcall — in a step-by-step UI: **initiate → challenge → report → verified**.
Every payload shown in the API inspector is the verbatim request/response from
the Sinch Verification API (via the official JS SDK, `@sinch/sdk-core`).
There is no mock mode: without credentials the server answers with a real
`503 credentials_required` response and the UI shows a clear amber
"credentials required" state.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

The Verification API authenticates with an **Application key/secret** pair
(from a Verification app in the [Sinch dashboard](https://dashboard.sinch.com/)
— not project-level OAuth2 credentials):

```bash
export SINCH_APPLICATION_KEY="..."
export SINCH_APPLICATION_SECRET="..."
bun run dev
```

| State | Behavior |
| --- | --- |
| Credentials set | Start/Report/Status buttons drive live `startSms` / `startFlashCall`, `reportSmsById` / `reportFlashCallById`, and `verificationStatus.getById` calls. |
| Credentials missing | Amber banner names the missing env vars; API routes return a real `503 credentials_required` JSON response, rendered verbatim in the inspector. |

## Flow

1. **Initiate** — choose SMS PIN or Flashcall, enter an E.164 number →
   `POST /verification/v1/verifications` returns a verification ID.
2. **Challenge** — Sinch texts a PIN (SMS) or places a missed call (flashcall).
3. **Report** — enter the PIN or the incoming call's full caller ID (CLI) →
   `PUT /verification/v1/verifications/id/{id}`.
4. **Verified** — `GET /verification/v1/verifications/id/{id}` confirms
   `SUCCESSFUL`.

Credentials stay server-side in Next.js route handlers; the browser never sees
the key or secret.
