# Hypit Studio — PLAN

## Goal
Pick a seeded viral-clone (ranking or podcast), inspect its invariants / variables / word-anchored events, swap fixture B-roll · caption · effect options, and read the composed SVML-ish source — all offline, no keys.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (badge, button, card, tabs, label)
- Data: seeded fixtures inspired by Hypit’s ranking-football and podcast examples (no Chromium render farm, no paid gen APIs)

## Tasks
1. Open the studio → see a **Fixture** badge and two sample clones (GOAT ranking, Daily Creatine podcast).
2. Pick a clone → see locked invariants, replaceable variable slots, and word-anchored event list.
3. Swap alternate B-roll / caption / effect options → storyboard and SVML preview recompose.
4. Switch clones → the workflow, variants, and SVML update to that fixture.
5. README documents this fixture studio vs what real Hypit would add later.

## Decisions & risks
- Fixture-first so screenshots and videos work with zero keys and no headless Chromium.
- SVML preview is a read-only, simplified markup of the composed structure — not the Hypit runtime.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
