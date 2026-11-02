# Sinch Numbers Storefront — PLAN

## Goal
Browse real virtual phone numbers available to rent from the Sinch Numbers API — filtered by country, type (local/mobile/toll-free), and capability (SMS/voice) — and walk a selected number through a rent-and-configure flow.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, select, input, label, dialog, alert, skeleton)
- Integration: official `@sinch/sdk-core` — `availableRegions.list`, `availableNumber.list`, `availableNumber.rent` — driven by `SINCH_PROJECT_ID` / `SINCH_KEY_ID` / `SINCH_KEY_SECRET`

## Tasks
1. Open the storefront with no credentials → a clear "credentials required" banner explains exactly which env vars to set; filter controls are still visible and usable.
2. With credentials set, the country dropdown is populated from the live `availableRegions` endpoint for the chosen number type.
3. Pick country + type + capabilities and Search → a grid of real available numbers with monthly price, setup price, capabilities, and paymentIntervalMonths.
4. Click "Rent & configure" on a number → dialog to set display name, SMS service plan ID, and voice app ID, with an explicit "this bills your account" warning; Confirm issues the real `:rent` call and shows the API result (success or error) verbatim.
5. README + `.env.example` document the three env vars and the no-credentials behavior.

## Decisions & risks
- No credentials exist in this build environment, so the recorded demo shows the real request path ending in the credentials-required state; nothing is mocked or faked.
- Next.js API routes own the Sinch client; `SINCH_*` secrets never reach the browser.
- Renting bills the account, so the rent flow requires a typed confirmation and is never triggered by the demo recording.
- `bunfig.toml` with `minimumReleaseAge = 259200` created before `bun install`.
