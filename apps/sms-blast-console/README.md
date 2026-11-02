# SMS Blast Console

Compose an SMS campaign, send it as **one real Sinch SMS batch** via the official
[`@sinch/sdk-core`](https://github.com/sinch/sinch-sdk-javascript) SDK, and watch
per-recipient delivery receipts update live in a dashboard.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000.

## Credentials (env vars)

The server reads Sinch credentials from the environment — the browser never sees them.
Either credential set works:

| Mode | Env vars | Notes |
| --- | --- | --- |
| Unified (OAuth) | `SINCH_PROJECT_ID`, `SINCH_KEY_ID`, `SINCH_KEY_SECRET` | US/EU SMS regions only |
| Service plan | `SINCH_SERVICE_PLAN_ID`, `SINCH_API_TOKEN` | all SMS regions |

Optional:

- `SINCH_SMS_REGION` — `us` (default), `eu`, `br`, `ca`, `au`
- `SINCH_FROM_NUMBER` — default sender used when the From field is left blank

Without credentials the console runs in a **credentials-required** state: the UI,
validation, and segment estimation all work, but sending returns an honest 503
listing the missing env vars. Nothing is mocked.

## How it works

- `POST /api/campaigns` → `sinch.sms.batches.sendTextMessage` with
  `delivery_report: "full"` submits the batch.
- The dashboard polls `GET /api/campaigns?refresh=1` every 4 s, which calls
  `sinch.sms.deliveryReports.get({ type: "full" })` for unsettled batches and maps
  each recipient to its simplified status (Queued → Dispatched → Delivered/Failed).
- Receipts are polled rather than delivered by webhook because the demo runs on
  localhost with no public callback URL.
- Campaign state is held in server memory (single-user MVP).
