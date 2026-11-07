# Cicada Meeting Room

One-page browser “live meeting room”: a bilingual EN/ZH transcript scrolls on a meeting clock, structured notes fill as the timeline advances, and hold-to-speak injects a translated line. Everything runs offline from `src/fixtures/`.

Inspired by [Cicada / 知了](https://github.com/wquguru/cicada) (Apache-2.0). This demo is original code and original fixtures — not a port of that native Swift app.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173, then click **Run sample meeting**. Play / Pause / Scrub the clock, watch notes unlock (Summary → Topics → Conclusions → To-dos → Glossary), and press-and-hold **Hold to speak** to inject a fixture EN↔ZH line.

```sh
bun test
```

Engine-only tests: timeline advance, notes unlock order, play/pause/scrub, hold-to-speak inject.

**Reset** restores the seed. Clock and injected lines persist in `localStorage`.

## Optional live translate

No API key is required. If `OPENAI_API_KEY` is set in the environment when you start `bun run dev`, `POST /api/translate` can translate a custom line. The hold-to-speak control still uses the fixture path by default.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · fixture timeline engine
