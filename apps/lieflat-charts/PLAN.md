# Lieflat Charts — PLAN

## Goal
Paste CSV/JSON or pick a sample → choose Glance or Lupi Basics → see one interactive in-browser chart, with a Mono / Porcelain color toggle. Offline, no API keys.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, textarea, card, tabs, badge only)
- Charts: bundled `chart.js` for Glance; handwritten SVG for Lupi Basics (patterns adapted from lieflat-charts, self-contained)

## Tasks
1. Pick a sample (or paste CSV/JSON) → see parsed rows and inferred label/value columns.
2. Choose Glance → see a bold ranked bar with a hero number and hover tooltips.
3. Choose Lupi Basics → see a hairline editorial bar with countable ticks and hover notes.
4. Toggle Mono ↔ Porcelain; the same chart recolors with no network call.
5. README documents the local-only happy path (`bun install && bun run dev`).

## Decisions & risks
- Self-contained: adapt Glance / Lupi visual grammar locally; do not require the lieflat-charts skill at runtime.
- Bundle Chart.js so Glance works offline (the source templates load it from a CDN).
- One color preset only (Porcelain / 青瓷蓝) plus Mono, as specified.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
