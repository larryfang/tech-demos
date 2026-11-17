# Remix Lab

Single-user brand-remix playground. Pick a sample reference clip and a brand kit, edit the shot breakdown as HTML scenes on a timeline, preview it live, and render an MP4 locally. No accounts, no uploads, no API keys.

Inspired by [OpenMotion](https://github.com/nexu-io/openmotion) (Apache-2.0) — an open-source alternative to Claude Motion and CapCut that rebuilds a reference as HTML scenes and renders MP4. **This demo is original code, original fixtures, and original SVG logos.** No OpenMotion source or assets were copied.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173. Replay mode is the default: a scripted agent walks the fixture breakdown (`Analysing shot 1/4 — Hook`, and so on). Choose a clip on the left, a brand kit under it, play / pause / scrub the centre preview, select and resize scenes on the timeline, and edit copy, colour, duration and transition in the inspector. The Motion.md panel shows generated design notes for the current remix.

Optional fixture preview clips (owned, not stock footage) are tiny ffmpeg `color` + `testsrc` + `drawtext` videos:

```sh
bun run previews
```

## Render

Needs **ffmpeg** and **Chrome/Chromium** on the machine. If either is missing, the CLI and the in-app button print a clear message instead of crashing.

```sh
bun run render
bun run render -- --clip launch-teaser --kit volt --out out/demo.mp4
bun run render -- --status
```

From the UI, click **Render MP4** (Vite serves `POST /api/render` and files under `/out/`). Output lands in `out/`.

Headless capture uses Playwright against system Chrome (`CHROME_PATH` override supported), then ffmpeg encodes H.264.

## Test

```sh
bun test
```

Engine-only coverage: brand-token application, timeline maths, transition overlap, duration edits, replay-script ordering.

## Live mode (stub)

Replay fixtures need no network. Optional live mode is **documented and stubbed only** — there is no video analyser and no LLM call.

```sh
OPENMOTION_LIVE=1 bun run dev
```

A notice appears in the left rail. Do not expect real shot detection.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · Playwright + ffmpeg for render
