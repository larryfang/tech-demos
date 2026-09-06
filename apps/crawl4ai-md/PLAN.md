# crawl4ai-md — PLAN

## Goal
Single-user MVP: paste a public URL, crawl it with Crawl4AI, and get clean LLM-ready Markdown with one-click copy and download.

## Stack
- Scaffold: `bunx create-next-app` (App Router, TypeScript, Tailwind), run with Bun
- UI: shadcn/ui, minimalist (input, button, card, textarea only)
- Crawler: [Crawl4AI](https://github.com/unclecode/crawl4ai) (Python) in a local venv sidecar at `apps/crawl4ai-md/py/`
- Glue: one Next.js API route (`POST /api/crawl`) that spawns `py/venv/bin/python py/crawl.py <url>` and returns `{ markdown }`

## Tasks
1. Paste a URL and click Crawl → real Crawl4AI crawl runs, no mocks.
2. Clean fit-for-LLM Markdown renders in a scrollable panel.
3. Copy button puts the Markdown on the clipboard.
4. Download button saves the Markdown as a `.md` file.
5. Errors (bad URL, crawl failure) surface as a readable message, not a crash.

## Decisions & risks
- Crawl4AI is Python-only, so the cleanest local integration is a thin subprocess sidecar: `py/crawl.py` uses `AsyncWebCrawler` and prints `result.markdown` to stdout; the API route just shells to it. No extra server process to manage.
- `bunfig.toml` with `[install] minimumReleaseAge = 259200` is created before `bun install`.
- venv + Playwright browser downloads are heavy; `bun run setup:py` documents the one-time step and `py/` internals stay untracked.
- Single-user local demo: no auth, no rate limiting, no job queue.
