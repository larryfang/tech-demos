# Sinch Fax Dropbox

Drag and drop a PDF, send it as a **real fax** via the [Sinch Fax API](https://developers.sinch.com/docs/fax/), track transmission status (`QUEUED → IN_PROGRESS → COMPLETED/FAILURE`), and browse received faxes with inline PDF preview.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

The integration is driven entirely by environment variables (project-scoped Sinch access key from [Dashboard → Access Keys](https://dashboard.sinch.com/settings/access-keys)):

| Variable | Required | Purpose |
| --- | --- | --- |
| `SINCH_PROJECT_ID` | yes | Sinch project id |
| `SINCH_KEY_ID` | yes | Access key id (OAuth2 client id) |
| `SINCH_KEY_SECRET` | yes | Access key secret |
| `SINCH_FAX_FROM` | no | Sender fax number provisioned on the project |
| `SINCH_FAX_API_BASE` | no | Override API base (default `https://fax.api.sinch.com/v3`) |

Without credentials the app runs in a clearly labeled **credentials required** state: PDF upload, preview, and local queueing still work; nothing is faxed and nothing is faked. With credentials, sends go to the real API — use Sinch's test number `+19898989898` to emulate delivery without charges.

## How it works

- `lib/sinch.ts` — OAuth2 client-credentials token (cached) against `auth.sinch.com`, then REST calls to `fax.api.sinch.com/v3/projects/{id}`: multipart fax send, status fetch, inbound list, PDF download.
- API routes under `app/api/` proxy the browser to Sinch so secrets stay server-side.
- The outbox polls `GET /faxes/{id}` every 3 s until the fax reaches a terminal status.
