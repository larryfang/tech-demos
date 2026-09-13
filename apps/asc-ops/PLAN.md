# asc-ops — PLAN

## Goal
Pick an App Store Connect app and see its TestFlight builds, tester feedback, and submission status in one sitting — fixture data by default, live `asc`/ASC API when a key is configured.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, tabs, select, input, textarea)
- Integration: spawn [App Store Connect CLI](https://github.com/rorkai/App-Store-Connect-CLI) (`asc apps list`, `asc builds list`, `asc testflight feedback list`, `asc versions list`) when env/local key is set; otherwise seeded fixtures

## Tasks
1. Open the console with no Apple key → see a Fixture badge and a seeded app list.
2. Pick an app → see TestFlight builds, tester feedback snippets, and submission status.
3. Switch apps → the three panels update to that app's fixture (or live) data.
4. Configure an ASC key (env or local settings) → badge flips to Live and data comes from `asc` / ASC API; any failure falls back to fixtures with a note.
5. README documents fixture vs live (`ASC_KEY_ID` / issuer / `.p8` path).

## Decisions & risks
- Fixture-first so PR screenshots and videos work with zero Apple credentials.
- Next.js API routes spawn `asc` (or call the documented ASC REST API if the CLI is missing) rather than a Vite-only SPA, matching the crawl4ai-md sidecar pattern.
- Local settings never persist the `.p8` body to git; `.asc/` and `.env.local` stay gitignored.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
