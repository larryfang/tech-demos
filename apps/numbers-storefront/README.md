# Sinch Numbers Storefront

Browse real virtual phone numbers available to rent from the [Sinch Numbers API](https://developers.sinch.com/docs/numbers/) — filtered by country, type (local / mobile / toll-free), and capability (SMS / voice) — and walk a selected number through a rent-and-configure flow.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials

The app talks to the real Sinch Numbers API through the official [`@sinch/sdk-core`](https://github.com/sinch/sinch-sdk-javascript) SDK. It needs project-scoped credentials from the Sinch Dashboard (Settings → Access Keys):

```bash
SINCH_PROJECT_ID=...
SINCH_KEY_ID=...
SINCH_KEY_SECRET=...
```

Put them in `.env.local` (see `.env.example`) and restart the dev server. Credentials stay on the server — the browser only ever talks to the app's own API routes.

Without credentials the app runs in a clearly labeled **Credentials required** state: every search hits the real request path and surfaces the real 503 error. Nothing is mocked.

## What it does

- `GET /api/regions` → `availableRegions.list` — populates the country dropdown with regions that actually offer the selected number type.
- `GET /api/numbers/search` → `availableNumber.list` — real availability search with region, type, capabilities, and an optional digit-pattern filter; shows monthly/setup price and documentation requirements per number.
- `POST /api/numbers/rent` → `availableNumber.rent` — the rent-and-configure flow: optional SMS service plan ID and Voice (RTC) app ID. **Renting bills your Sinch account**, so the UI requires typing `RENT` before the request is sent.
