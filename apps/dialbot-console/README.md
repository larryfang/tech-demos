# Dialbot Console

Single-user console inspired by [mattyp’s Dialbot + Bland voice walkthrough](https://x.com/mattyp/status/2098155792327381294) (“Giving Grok Bot a Phone”). Compose an outbound call (number, task/prompt, optional voice) and read a transcript with cost.

**Dry-run is the default.** The happy path works with zero Bland credentials and never places a paid call.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Dry-run** badge, two seeded calls, and a prefilled Harbor Kitchen reservation. Click **Send dry-run** to get a mock transcript and a cost estimate at Bland’s public ~$0.09/min rate.

## Dry-run vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Dry-run** | No `BLAND_API_KEY`, or Send without “Place live Bland call” | Local mock transcript + estimated cost. Badge stays **Dry-run**. |
| **Live** | `BLAND_API_KEY` is set **and** you check “Place live Bland call” | Server calls Bland `POST /v1/calls` (documented send-call), then polls `GET /v1/calls/:id` for transcript, status, and price. |

If the key is missing or Bland returns an error, the console falls back to a dry-run record and shows the error. No live call is placed when the key is absent.

### Enable live mode

1. Create an API key in the [Bland dashboard](https://app.bland.ai).
2. Put it in `.env.local` (gitignored):

   ```bash
   BLAND_API_KEY=your_key_here
   ```

3. Restart `bun run dev`. The header shows **Live ready**. Check **Place live Bland call** only when you intend to spend minutes.

## Stack

Next.js (App Router) · Bun · shadcn/ui · [Bland AI](https://docs.bland.ai) `POST /v1/calls`

See `PLAN.md` for scope.
