# Qiaomu Reader

Single-user web lab **inspired by** [Qiaomu Clipper / 乔木剪藏](https://github.com/joeseesun/qiaomu-clipper) ([bookmark](https://x.com/vista8/status/2106555535122452972)): turn a subtitled video into a readable bilingual page — player beside transcript, click-to-seek, Ask AI on a selection, Obsidian-ready notes.

This is an **original fixture-first demo**. It is **not** a Chrome extension, and it is **not** a fork, vendor, or redistribution of the Qiaomu Clipper source. Do not copy that extension into this folder.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge and two sample talks. Click **Harbor tasting** — a placeholder player and a bilingual EN/ZH transcript appear. No API key is required.

```bash
bun test
```

## Happy path

1. Pick **Harbor tasting** or **Video as a book**, or paste `https://youtu.be/smpHarbor01`.
2. Press **Play** or drag the scrubber — the current line highlights and stays in view.
3. Click a timestamp to jump.
4. Select a sentence → **Ask AI** (stubbed without a key).
5. **Pin current line**, type a free note, then **Copy Markdown** or **Download Markdown**.

Unknown YouTube URLs still embed the video and show a deterministic stub transcript. This lab does not scrape YouTube captions.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | No `OPENAI_API_KEY`, or Ask AI without “Use live model” | Deterministic study note from the selected text. Badge stays **Fixture**. |
| **Live** | `OPENAI_API_KEY` is set **and** you check “Use live model” | Server calls an OpenAI-compatible `POST /v1/chat/completions`. |

If the key is missing or the call fails, the lab falls back to the stub and shows the error.

### Enable live mode

1. Put a chat-capable key in `.env.local` (gitignored):

   ```bash
   OPENAI_API_KEY=your_key_here
   # optional
   # OPENAI_BASE_URL=https://api.openai.com/v1
   # OPENAI_ASK_MODEL=gpt-4o-mini
   ```

2. Restart `bun run dev`. The header shows **Live ready**. Check **Use live model** only when you intend to spend tokens.

## Stack

Next.js (App Router) · Bun · shadcn/ui · original bilingual fixtures + optional OpenAI-compatible Ask AI

See `PLAN.md` for scope.
