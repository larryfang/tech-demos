# Handraw Style Lab — PLAN

## Goal
Pick one original style, layout, and palette plus a topic, then read assembled Chinese and English image prompts (copyable) — with a “Surprise me” five-style contrast pass. Offline fixtures; optional image gen only when an env var is set.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, label, tabs)
- Data: original bilingual fixture catalog (~36 styles, 15 layouts, 10 palettes)
- Optional live: OpenAI-compatible `POST /v1/images/generations` when `OPENAI_API_KEY` is set

## Tasks
1. Open the lab with no key → see a **Fixture** badge and searchable galleries for styles, layouts, and palettes.
2. Select one of each + type a topic → bilingual prompts appear side by side with copy buttons.
3. Search/filter a gallery → cards shrink to matches; selection still drives the assembled prompt.
4. Press **Surprise me** → five contrasting styles reuse the same topic/layout/palette and show five prompt pairs.
5. Optional **Generate image** only when `OPENAI_API_KEY` is set; missing key or API failure stays fixture-only with a clear note.
6. README documents this original catalog vs the inspired-by handraw-style library (no copied assets or text).

## Decisions & risks
- Inspired-by only. Original IDs, names, descriptions, and prompt fragments — do not copy yang0/handraw-style markdown, images, or license text.
- Fixture mode is the default so screenshots and videos work with zero credentials.
- Next.js API routes hold the key; the browser never sees `OPENAI_API_KEY`.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
