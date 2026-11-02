# Number Lookup Inspector — PLAN

## Goal
Enter a phone number (or upload a CSV batch) and get a clean inspection report: offline E.164 parsing/formatting plus real carrier, line type, porting, SIM-swap and VoIP risk data from the Sinch Number Lookup API.

## Stack
- `bunx create-next-app` (Next.js App Router, TypeScript, Tailwind v4), Bun runtime
- shadcn/ui (default theme, only rendered components)
- `libphonenumber-js` for offline parsing/validation (clearly labeled "offline")
- Sinch Number Lookup API v2 (`POST lookup.api.sinch.com/v2/projects/{id}/lookups`) via OAuth2
  client-credentials (`auth.sinch.com/oauth2/token`), driven by `SINCH_PROJECT_ID`,
  `SINCH_KEY_ID`, `SINCH_KEY_SECRET` env vars — secrets stay in server API routes

## Tasks
1. Type a number → instantly see offline parse card: validity, country, E.164 / international / national formats, number type.
2. Click "Inspect" → server calls real Sinch lookup (`LineType`, `SimSwap`, `VoIPDetection`) → carrier, line type, MCC/MNC, ported + porting date, SIM-swap, VoIP probability rendered as a report with a derived risk summary.
3. No credentials configured → UI shows an explicit "Sinch credentials required" state (status from `/api/status`); offline parsing keeps working and is labeled as such.
4. Upload a CSV of numbers → batch table with per-row offline parse and (when credentials exist) real lookups via parallel single-number requests (no batch endpoint exists).

## Decisions & risks
- Never fabricate API output: without credentials the Sinch panel shows a locked/required state, never sample data.
- Risk summary is derived only from real returned fields (simSwap.swapped + swapPeriod, voIPDetection.probability); labeled as derived.
- `features` must be explicit in the request or only LineType comes back; per-feature `error` objects are surfaced per row.
- VoIPDetection is alpha; a per-feature error is expected on some accounts and rendered, not hidden.
- Batch = client-side CSV parse + concurrency-limited parallel calls (API has no batch endpoint; 429 risk).
