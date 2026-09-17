# Video Shotcraft — PLAN

## Goal
Browse a curated Shotcraft-style shot library, open a recipe-detail panel with motion preview + params, and walk a short **Ink Press** storyboard for a **Mailgun Inspect** launch promo (broken inbox QA → Inspect in Salesforce → 100+ client previews → ship) — all offline fixtures.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (badge, button, card, input, tabs)
- Data: seeded recipe cards + CSS motion previews + Inspect / Agent Tools product frames (no Remotion, no keys)

## Tasks
1. Open the gallery → see search/filter recipe cards and looping motion previews, with **Mailgun Inspect** featured.
2. Click a shot → recipe params, energy, duration, pitfalls, and a live CSS preview update.
3. Walk the **Ink Press** strip: broken inbox QA → Inspect LWC in Salesforce → multi-client previews → ship with confidence.
4. Open the CapCut-style workbench strip → see shot / caption / SFX tracks for the same promo (fixture only).
5. README documents this gallery vs what the real Shotcraft skill would add later.

## Decisions & risks
- Primary fixture is **Mailgun Inspect** (1 Sep 2026, AgentExchange LWC). **Sinch Agent Tools** is one optional secondary card.
- CSS keyframe previews stand in for Remotion mp4s so the repo stays small and offline.
- Product UI frames are labeled **Fixture** — plausible placeholders, not captured product screenshots.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, no render farm.
