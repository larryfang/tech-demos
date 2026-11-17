# OpenMotion Remix Lab — PLAN

## Goal
Pick a sample reference clip and a brand kit, edit the shot breakdown as HTML scenes on a timeline, preview it live, and render an MP4 locally — all single-user, no keys.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, badge, card, slider, label, input, textarea, scroll-area)
- Engine: pure TypeScript remix + timeline maths over `fixtures/`
- Render: Playwright (system Chrome) frame capture + ffmpeg → `out/`

## Tasks
1. Open the lab → pick a fixture clip and a brand kit; a scripted replay agent walks the shot breakdown (shot 1/N …) with no network.
2. Centre preview plays branded HTML scenes (CSS/WAAPI) with play / pause / scrub.
3. Timeline strip shows scene blocks; select and resize a shot → duration and later starts recompute.
4. Inspector edits the selected scene’s text, colours, duration and transition; Motion.md notes update live.
5. **Render** (`bun run render` or the in-app button) writes an MP4 under `out/`, or a clear message if ffmpeg / Chrome is missing.

## Decisions & risks
- Inspired-by [OpenMotion](https://github.com/nexu-io/openmotion) (Apache-2.0) only. Original fixtures, engine, UI, and SVG logos — no copied code or assets.
- Replay mode is the default. Optional live mode is an env-var stub with docs, not a real analyser.
- Sample “reference” clips are JSON shot breakdowns plus tiny ffmpeg `testsrc`/`color`+`drawtext` previews we generate ourselves — never third-party footage.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- Engine-only tests (12+): brand tokens, timeline maths, transition overlap, duration edits, replay order.
- No auth, no uploads, no cloud, single page.
