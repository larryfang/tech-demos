# Handraw Style Lab

Single-user web lab **inspired by** [handraw-style](https://github.com/yang0/handraw-style) ([bookmark](https://x.com/grgerwcwetwet/status/2116142822315487370)): pick a visual style, a layout, and a colour palette, add a topic, and copy assembled **Chinese + English** image prompts.

This is an **original fixture-first demo**. It is **not** a fork, vendor, or redistribution of yang0/handraw-style. That repo uses a non-standard license — do not copy its markdown, images, or prompt text into this folder. The catalog here is a small original set modeled only on the *idea* of numbered styles / layouts / palettes.

## Run

```bash
bun install
bun run dev
```

Open http://localhost:3000. You should see a **Fixture** badge, searchable galleries (36 styles, 15 layouts, 10 palettes), and bilingual prompts for **雨天窗台上的橘猫**. No API key is required.

```bash
bun test
bun run build
```

## Happy path

1. Keep the sample topic (or type your own).
2. Search the gallery and select one style, one layout, and one palette.
3. Read the assembled Chinese and English prompts side by side; use **Copy**.
4. Press **Surprise me** — five contrasting style families reuse the same topic, layout, and palette.
5. Optional **Generate image** only appears when `OPENAI_API_KEY` is set.

## Fixture vs live

| Mode | When | What happens |
| --- | --- | --- |
| **Fixture** | No `OPENAI_API_KEY` | Prompt assembly only. Badge stays **Fixture**. |
| **Live** | `OPENAI_API_KEY` is set | Header shows **Live ready**. **Generate image** calls an OpenAI-compatible `POST /v1/images/generations`. |

Missing key or a failed call leaves the prompts in place and shows the error. The browser never sees the key.

### Enable live mode

1. Put an image-capable key in `.env.local` (gitignored):

   ```bash
   OPENAI_API_KEY=your_key_here
   # optional
   # OPENAI_BASE_URL=https://api.openai.com/v1
   # OPENAI_IMAGE_MODEL=dall-e-3
   ```

2. Restart `bun run dev`.

## This lab vs the library

| | This demo | Real [handraw-style](https://github.com/yang0/handraw-style) |
| --- | --- | --- |
| Styles | 36 original bilingual cards | 365 numbered visual styles + reference sheets |
| Layouts | 15 original compositions | 170 layout types |
| Palettes | 10 original swatch sets | 36 curated colours |
| Output | Assembled ZH / EN prompts + copy | Skill that writes prompts (and more editorial modes) |
| Images | Optional, env-gated | Reference sheets + generation workflows |

## Stack

Next.js (App Router) · Bun · shadcn/ui · original bilingual fixtures + optional OpenAI-compatible image gen

See `PLAN.md` for scope.
