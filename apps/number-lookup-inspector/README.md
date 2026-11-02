# Number Lookup Inspector

Enter a phone number (or upload a CSV batch) and get a clean inspection report:

- **Offline parsing** (always available): validity, country, E.164 / international /
  national formats and heuristic number type via `libphonenumber-js`. Clearly
  labeled as offline — no API involved.
- **Live Sinch data** (requires credentials): carrier, line type, MCC/MNC, porting
  status and date, SIM-swap detection and VoIP probability from the
  [Sinch Number Lookup API v2](https://developers.sinch.com/docs/number-lookup/),
  plus a risk summary derived from the returned fields.
- **CSV batch**: upload a CSV (first column, one number per line, max 50); each row
  is parsed offline and looked up with one real API request per number (the API has
  no batch endpoint). A sample file is at `public/sample-numbers.csv`.

## Run

```bash
bun install
bun run dev
```

## Credentials

Live lookups authenticate with OAuth2 client credentials
(`https://auth.sinch.com/oauth2/token`) using project-scoped access keys from the
Sinch dashboard (Settings → Access Keys):

```bash
export SINCH_PROJECT_ID="..."
export SINCH_KEY_ID="..."
export SINCH_KEY_SECRET="..."
```

Secrets are only read server-side (Next.js route handlers). Without them the UI
shows an explicit "Sinch credentials required" state — real API output is never
faked.
