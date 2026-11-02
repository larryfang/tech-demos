# Mailgun Deliverability Desk

Send real email through the [Mailgun](https://documentation.mailgun.com/docs/mailgun/) API
(Mailgun is a Sinch company) and watch opens, clicks, bounces and complaints stream into a
live dashboard pulled from Mailgun's analytics logs API.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

The app talks to the real Mailgun API — nothing is mocked. Without credentials it starts in a
"credentials required" state. To activate it:

```bash
export MAILGUN_API_KEY=key-...        # Mailgun private API key
export MAILGUN_DOMAIN=mg.example.com  # verified sending domain (or sandbox domain)
# optional:
export MAILGUN_API_BASE_URL=https://api.eu.mailgun.net   # EU region accounts
export MAILGUN_FROM="Desk <postmaster@mg.example.com>"   # sender address
bun run dev
```

Sandbox domains only deliver to recipients pre-authorized in the Mailgun dashboard.

## What it does

- **Status** — `GET /v4/domains/{domain}` verifies the key + domain on load.
- **Send** — `POST /v3/{domain}/messages` via the official `mailgun.js` SDK, with
  `o:tracking-opens` / `o:tracking-clicks` enabled and a tracked link in the HTML body.
- **Events** — polls `POST /v1/analytics/logs` (the current events API; v3 events is
  deprecated) every 5 s for the last 24 h, with per-type counters.
- **Suppressions** — real bounce / complaint / unsubscribe lists from
  `/v3/{domain}/bounces|complaints|unsubscribes`.
