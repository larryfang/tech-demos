# PromptLens Lab

Single-user web lab **inspired by** [PromptLens](https://github.com/binghe1980/PromptLens) ([bookmark](https://x.com/binghe/status/2095952693500297537)): pick a picture and get editable Chinese, English, and JSON image-gen prompts plus negatives.

This is an **original fixture-first demo**. It is **not** a fork, vendor, or redistribution of the proprietary PromptLens Chrome/Edge extension. Do not copy that extension’s source into this folder.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge and four local samples (portrait, product, UI, landscape). Click **影棚人像 / Studio portrait** — the scene tag and prompt panes fill from a deterministic stub. No API key is required.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | No `OPENAI_API_KEY`, or Analyze without “Use live vision” | Deterministic reverse-prompt from the fixture id, or from a filename/scene heuristic for uploads. Badge stays **Fixture**. |
| **Live** | `OPENAI_API_KEY` is set **and** you check “Use live vision” | Server calls an OpenAI-compatible `POST /v1/chat/completions` vision model (`image_url`). |

If the key is missing or the vision call fails, the lab falls back to the fixture stub and shows the error. Uploaded or pasted images still get a stub scene + prompts with zero credentials.

### Enable live mode

1. Put a vision-capable key in `.env.local` (gitignored):

   ```bash
   OPENAI_API_KEY=your_key_here
   # optional
   # OPENAI_BASE_URL=https://api.openai.com/v1
   # OPENAI_VISION_MODEL=gpt-4o-mini
   ```

2. Restart `bun run dev`. The header shows **Live ready**. Check **Use live vision** only when you intend to spend tokens.

## Stack

Next.js (App Router) · Bun · shadcn/ui · original fixture catalog + optional OpenAI-compatible vision

See `PLAN.md` for scope.
