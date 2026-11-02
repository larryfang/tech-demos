# Email Validate Gate — PLAN

## Goal
A signup form that gates account creation on real-time Mailgun Validate results (risk, disposable/role flags, did-you-mean), plus a CSV batch mode that validates a list and shows a results table.

## Stack
- `bunx create-next-app` (Next.js App Router, TypeScript, Tailwind), Bun runtime
- shadcn/ui (default theme; only rendered components)
- Mailgun Validate API `GET /v4/address/validate`, key from `MAILGUN_API_KEY` env var, proxied through a Next API route so the key never reaches the browser

## Tasks
1. Type an email in the signup form → see live local pre-checks (syntax + MX lookup), clearly labeled as local, before any Mailgun call.
2. With `MAILGUN_API_KEY` set, the form shows real Mailgun results: result/risk badges, disposable & role flags, did-you-mean suggestion (click to apply) — and the "Create account" button unlocks only for deliverable, low-risk addresses.
3. Without credentials, the Mailgun panel shows an explicit "credentials required" state (never fake data); local pre-checks still run.
4. Upload/paste a CSV in batch mode → each row validated (Mailgun when credentialed, local pre-checks otherwise, labeled) → sortable results table with summary counts and CSV export.

## Decisions & risks
- Batch mode loops the single-validation endpoint (small concurrency) instead of Mailgun's async bulk-job API — simpler for an MVP, still a real integration; fine for demo-sized lists.
- MX lookup runs server-side via DNS; it's a real network check but independent of Mailgun — the UI labels it "local pre-check".
- No credentials exist in this environment, so the recorded demo shows local pre-checks + the credentials-required state; the Mailgun path is fully implemented and env-driven.
- `bunfig.toml` with `minimumReleaseAge = 259200` created before any install.
