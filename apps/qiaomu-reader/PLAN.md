# Qiaomu Reader — PLAN

## Goal
Paste a YouTube URL or pick a bundled bilingual fixture and study it as a readable transcript: highlighted current line, click-to-seek, Ask AI on a selection, and Obsidian-ready notes.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), Bun runtime
- UI: shadcn/ui (badge, button, card, input, textarea, label, slider, scroll-area)
- Transcripts: original shipped fixtures (zero-key default); optional OpenAI-compatible `/v1/chat/completions` when `OPENAI_API_KEY` is set

## Tasks
1. Open the lab with no key → see a Fixture badge and two sample bilingual talks; pick one → placeholder player + EN/ZH transcript.
2. Play or scrub → the current line highlights and stays in view; click a timestamp → jump to that line.
3. Paste a YouTube URL → embed the video; known ids reuse a fixture, unknown ids get a deterministic stub transcript so the lab still works offline.
4. Select transcript text → Ask AI; no key (or API failure) returns a stubbed answer; optional live when a key is set.
5. Notes panel builds Obsidian-ready Markdown (filename + body) the user can copy or download.
6. README documents fixture vs live and that this is inspired by Qiaomu Clipper, not a redistribution.

## Decisions & risks
- Original fixture-first web lab only. Do not vend, fork, or copy the Qiaomu Clipper extension source.
- Fixture mode is the default so screenshots/videos work with zero credentials and no YouTube network.
- Next.js API routes hold the key; the browser never sees `OPENAI_API_KEY`.
- Live Ask AI is opt-in even when a key exists.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
