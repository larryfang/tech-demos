# Email Validate Gate

Signup form gated by the real [Mailgun Validate API](https://documentation.mailgun.com/docs/inboxready/mailgun-validate/): live result/risk verdicts, disposable & role detection, and did-you-mean suggestions — plus a CSV batch mode with a results table and CSV export.

## Run

```bash
bun install
MAILGUN_API_KEY=your-private-api-key bun run dev
```

Open http://localhost:3000.

## Environment

| Variable | Required | Notes |
| --- | --- | --- |
| `MAILGUN_API_KEY` | For Mailgun verdicts | Private API key; used server-side only (Basic auth `api:<key>` against `/v4/address/validate`). |
| `MAILGUN_API_BASE` | No | Defaults to `https://api.mailgun.net`; set `https://api.eu.mailgun.net` for EU accounts. |

Without `MAILGUN_API_KEY` the app still runs: local syntax and MX-record pre-checks work (clearly labeled as local), and the Mailgun panel/columns show an explicit "credentials required" state. No API responses are ever mocked.

## How it works

- `POST /api/validate` runs local checks (RFC-ish syntax, DNS MX lookup, popular-domain typo suggestion) and, when credentialed, calls Mailgun `GET /v4/address/validate` (one retry on 429).
- The signup gate unlocks only when Mailgun returns `result=deliverable`, `risk != high`, and `is_disposable_address=false`.
- Batch mode parses a CSV (header `email`/`email_address`, max 100 rows), validates rows through the same route with concurrency 4, and exports results as CSV. `public/sample.csv` is included for demos.
