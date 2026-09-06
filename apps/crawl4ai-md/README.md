# crawl4ai-md

Single-user MVP: paste a URL → crawl it with [Crawl4AI](https://github.com/unclecode/crawl4ai) → get clean, LLM-ready Markdown with copy/download.

## Stack

- Next.js (App Router) + Bun + shadcn/ui
- Crawl4AI (Python) as a local venv sidecar in `py/`; the `POST /api/crawl` route shells to `py/crawl.py` and returns `{ markdown }`.

## Run

```bash
# one-time: install the Crawl4AI sidecar (Python 3.10+ required)
bun run setup:py

bun install
bun run dev
```

Open http://localhost:3000, paste a public URL, click **Crawl**.

See `PLAN.md` for scope and decisions.
