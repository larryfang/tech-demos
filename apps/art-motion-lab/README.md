# Art Motion Lab

Single-user web lab **inspired by** [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) ([bookmark](https://x.com/AlchainHust/status/2107500970100011337)): type a short narration, pick an art style and a narration structure, then play a parametric painting in the browser with timed captions.

This is an **original fixture-first demo**. It is **not** a fork, vendor, or redistribution of the huashu-art-motion skill pack. Do not copy that skill’s scene source into this folder.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge, the **Lantern river** sample, six art styles, and four narration structures. Press **Play** — Monet water lilies move and captions land on the canvas. No API key is required.

```bash
bun test
bun run build
```

## Happy path

1. Keep **Lantern river** (or paste 1–2 lines of your own).
2. Pick a style: cave painting, Monet, ukiyo-e, 8-bit, Bauhaus, or Starry Night.
3. Pick a structure: Storytime, Kinetic type, Whiteboard, or Vox.
4. Press **Compose beats**, then **Play**. Timed captions are painted onto the frame.
5. Drag **Speed** and **Intensity** while it plays.
6. **Export WebM** records the canvas with `MediaRecorder` (no keys).

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | No `OPENAI_API_KEY`, or Compose without “Use live model for beats” | Deterministic beats from the narration + structure. Badge stays **Fixture**. |
| **Live** | `OPENAI_API_KEY` is set **and** you check “Use live model for beats” | Server calls an OpenAI-compatible `POST /v1/chat/completions`. |

If the key is missing or the call fails, the lab falls back to the fixture stub and shows the error.

### Enable live mode

1. Put a chat-capable key in `.env.local` (gitignored):

   ```bash
   OPENAI_API_KEY=your_key_here
   # optional
   # OPENAI_BASE_URL=https://api.openai.com/v1
   # OPENAI_BEATS_MODEL=gpt-4o-mini
   ```

2. Restart `bun run dev`. The header shows **Live ready**. Check **Use live model for beats** only when you intend to spend tokens.

## This lab vs the skill

| | This demo | Real [huashu-art-motion](https://github.com/alchaincyf/huashu-art-motion) |
| --- | --- | --- |
| Styles | 6 original canvas starters | 35 style recipe cards + scene scripts |
| Structures | 4 narration cuts (storytime, kinetic, whiteboard, Vox) | 9 explainer grammars + JSON clip specs |
| Render | In-browser canvas + CSS-free parametric motion | Playwright / ffmpeg / uv pipeline |
| Export | WebM via `MediaRecorder`, no keys | Frame-accurate MP4 / alpha / landscape-portrait |
| LLM | Optional beats only | Agent skill that writes and renders scenes |

## Stack

Next.js (App Router) · Bun · shadcn/ui · original canvas styles + optional OpenAI-compatible beat compose

See `PLAN.md` for scope.
