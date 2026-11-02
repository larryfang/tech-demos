# Voice IVR Studio

Visually compose a [Sinch Voice API](https://developers.sinch.com/docs/voice/) SVAML call
flow — say steps, an IVR menu with DTMF options, digit collection, connect-to-number, or
hangup — preview the generated SVAML JSON live, and place a **real callout** through the
Sinch Voice REST API.

## Run

```bash
bun install
bun run dev
# open http://localhost:3000
```

The flow builder and SVAML preview work fully offline, no credentials needed.

## Live callouts (Sinch credentials)

Set these before `bun run dev` to enable the "Place call via Sinch" button:

| Env var | Required | Purpose |
|---|---|---|
| `SINCH_APPLICATION_KEY` | yes | Voice app key ([Sinch Dashboard](https://dashboard.sinch.com) → Voice app) |
| `SINCH_APPLICATION_SECRET` | yes | Voice app secret |
| `SINCH_VOICE_REGION` | no | `global` (default), `use1`, `euc1`, `apse1`, `apse2`, `sae1` |
| `SINCH_CLI` | no | Default caller-id number (E.164) prefilled in the UI |

Credentials live only in Next.js API routes; the browser only ever sees booleans from
`/api/status`. The callout is a real `POST {region base}/calling/v1/callouts` with
`method: customCallout` and Basic Auth — errors from Sinch are surfaced verbatim, never
mocked.

## How the flow maps to SVAML

SVAML allows many `instructions` but exactly **one** `action` per response. The builder
enforces that shape:

- each **Say step** → a `say` instruction (TTS, selected locale)
- the **terminal step** → the single action:
  - *IVR menu* / *Collect digits* → `runMenu` (with `options` / `maxDigits`)
  - *Connect to number* → `connectPstn`
  - *Hang up* → `hangup`

The generated document is used as the **ACE** SVAML (runs when the callee answers). The
**ICE** SVAML is generated at callout time as a `connectPstn` to the destination.

## Known limitation

`runMenu` results (pressed digits) are delivered via a **PIE webhook**, which requires a
publicly reachable callback URL configured on the Sinch app — out of scope for this
single-user local demo. On a real call the prompt still plays and digits are collected.
