# Art Motion Lab — PLAN

## Goal
Type a short narration, pick an art style and a narration structure, then play a parametric in-browser painting that moves with timed captions — live-tweakable, exportable as WebM, fixture-first.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, textarea, label, slider)
- Motion: original canvas renderers (6 styles) + `MediaRecorder` WebM
- Beats: deterministic fixtures; optional OpenAI-compatible `/v1/chat/completions` when `OPENAI_API_KEY` is set

## Tasks
1. Open the lab with no key → see a Fixture badge, a sample line, six art styles, and four narration structures.
2. Press Play → the canvas painting animates and timed captions appear on the frame.
3. Drag speed / intensity → motion updates live without a restart.
4. Export WebM → download a clip of the current play (no API key).
5. Compose beats: fixture stub by default; optional live LLM with graceful fallback.
6. README documents fixture vs live and that this is inspired by huashu-art-motion, not a redistribution.

## Decisions & risks
- Original fixture-first web lab only. Do not vend, fork, or copy the huashu-art-motion skill source.
- Six starters: cave painting, Monet, ukiyo-e, 8-bit, Bauhaus, Starry Night. Four structures: storytime, kinetic type, whiteboard, Vox.
- Captions are painted onto the canvas so they land in the WebM.
- Next.js API routes hold the key; the browser never sees `OPENAI_API_KEY`.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
