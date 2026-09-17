# Hypit Studio

Single-user fixture studio inspired by [Hypit](https://github.com/hypit-ai/hypit) — an open-source agent harness that clones a viral TikTok / Reel / Short into an editable video workflow (footage, captions, B-roll, effects), then spins variants.

This demo shows the **structured leftover**: invariants vs variables vs word-anchored events, a variant swap panel, and a read-only SVML-ish preview. It does **not** run Hypit’s Chromium render farm or any paid generation API.

Bookmark: [LufzzLiz on Hypit’s reverse workflow](https://x.com/LufzzLiz/status/2099652325887652016). How-to: [Codex + Hypit walkthrough](https://x.com/Pluvio9yte/status/2100070815874285734).

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173. You should see a **Fixture** badge, two sample clones (**GOAT Debate**, **Daily Creatine**), and the ranking workflow selected. Swap a B-roll / caption / effect option, click an `@word` event, then open **SVML preview**.

## Fixture studio vs real Hypit

| | This demo | Real [Hypit](https://hypit.ai) |
| --- | --- | --- |
| Input | Two seeded clones (ranking + podcast) | Reference video, template, or a description |
| Structure | Invariants / variables / event anchors in the UI | Agent reverse-engineers the same kinds of slots into a project |
| Variants | Click alternate fixture B-roll, caption, effect packs | Re-run the workflow with new faces, SKUs, languages |
| Preview | CSS storyboard + read-only SVML-ish text | SVML source compiled by headless Chromium |
| Models | None. Zero keys. | Optional Seedance / GPT Image / WhisperX / BYOK |
| Cost | $0 | Code-rendered $0; hosted shorts billed by the service you choose |

No `API_KEY` is read. If you later wire Hypit locally, keep this studio as the offline map of the composition.

## Sample clones

| Clone | What stays | What you swap |
| --- | --- | --- |
| **GOAT Debate** | Talking-head right, hook → board → sting, 9:16 karaoke | Comedy-sports / banana-cat / founder B-roll; caption style; board effect |
| **Daily Creatine** | Split-screen, speaker karaoke, product-handoff cut | Lifestyle / gym / skincare B-roll; caption style; handoff effect |

Event anchors fire on words (`hair gel`, `hat trick`, `Creatine`, `your arms`), not timestamps. Rewrite the line and the same slots still attach to those words.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui

See `PLAN.md` for scope.
