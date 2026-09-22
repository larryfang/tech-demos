# PromptLens Lab — PLAN

## Goal
Pick a shipped fixture (or upload/paste an image) and get an editable scene tag plus Chinese, English, and JSON image-gen prompts with negatives — fixture stub by default, optional live vision when a key is present.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, label, tabs)
- Reverse-prompt: original fixture catalog + deterministic stub; optional OpenAI-compatible `/v1/chat/completions` vision when `OPENAI_API_KEY` is set

## Tasks
1. Open the lab with no key → see a Fixture badge and four local sample images (portrait, product, UI, landscape).
2. Click a fixture → scene tag plus editable ZH / EN / JSON prompts and negatives appear, deterministic for that fixture id.
3. Upload or paste a non-fixture image → stub still returns a scene + prompts (filename/heuristic or mixed fallback).
4. Set `OPENAI_API_KEY` and opt into live → server calls a vision model; missing key or API failure falls back to the stub with a clear message.
5. README documents fixture vs live and that this is inspired by PromptLens, not a redistribution of it.

## Decisions & risks
- Original fixture-first web lab only. Do not vend, fork, or copy PromptLens extension source (proprietary / use-only).
- Fixture mode is the default so screenshots/videos work with zero credentials.
- Next.js API routes hold the key; the browser never sees `OPENAI_API_KEY`.
- Live analyze is opt-in even when a key exists.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
