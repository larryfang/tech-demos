# ASC Ops

Single-user ops console for the [App Store Connect CLI](https://github.com/rorkai/App-Store-Connect-CLI) (`asc`). Pick an app and inspect TestFlight builds, tester feedback, and App Store submission status.

**Fixture mode is the default.** The happy path works with zero Apple credentials.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge, three seeded apps (Harbor Notes, Drift Radio, Lenskit Camera), and realistic builds / feedback / submission rows.

## Flip to live mode

Live mode calls `asc` when it is on your `PATH` (or `ASC_BIN`), then falls back to the documented App Store Connect REST API. If the key is missing or the call fails, the console returns to fixtures and shows the error.

### Option A — environment

1. Create an App Store Connect API key and download the `.p8` file ([Apple docs](https://developer.apple.com/documentation/appstoreconnectapi/creating-api-keys-for-app-store-connect-api)).
2. Install the CLI if you want the real `asc` path:

   ```bash
   curl -fsSL https://asccli.sh/install | bash
   # or: brew install asc
   ```

3. Export the same variables the CLI documents:

   ```bash
   export ASC_KEY_TYPE=team
   export ASC_KEY_ID=ABC123DEFG
   export ASC_ISSUER_ID=12345678-abcd-1234-abcd-123456789012
   export ASC_PRIVATE_KEY_PATH="$HOME/.asc/AuthKey_ABC123DEFG.p8"
   ```

4. Restart `bun run dev`. The badge should switch to **Live**.

You can also put those values in `.env.local` (gitignored).

### Option B — local settings in the UI

Open **Configure live key**, paste Key ID, Issuer ID, and a `.p8` path or PEM, then **Try live**. PEM is sent only to the local API route for that request and is not written to disk.

## Stack

Next.js (App Router) · Bun · shadcn/ui · App Store Connect CLI / ASC API

See `PLAN.md` for scope.
