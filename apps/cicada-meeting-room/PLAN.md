# Cicada Meeting Room — PLAN

## Goal
One-page browser “live meeting room”: a bilingual EN/ZH transcript scrolls on a meeting clock, structured notes fill as the timeline advances, and hold-to-speak injects a translated line — all from fixtures, no API key.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, badge, card, slider, scroll-area)
- Engine: small clock/timeline module over `fixtures/` (transcript + notes unlock)
- Optional: Vite `/api/translate` if `OPENAI_API_KEY` is set; fixture path is the default

## Tasks
1. Click **Run sample meeting** → ~75s Harbor Books opening-sync plays; bilingual lines scroll with speaker labels and timestamps.
2. Play / Pause / Scrub the meeting clock → transcript and notes stay in sync with the playhead.
3. Notes panel unlocks in order as time advances: Summary → Topics → Conclusions → To-dos → Glossary (not all at once).
4. Press-and-hold **Speak** → fixture utterance is translated EN↔ZH and injected into the room transcript.
5. State persists in localStorage; **Reset** restores the seed. Works fully offline.

## Decisions & risks
- Inspired-by Cicada only. Original fixtures and UI; no code, assets, or copy from https://github.com/wquguru/cicada.
- Fixture-first: no mic, no Zoom/Feishu bot, no live STT. Optional translate route never required.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- Engine is pure functions so `bun test` can cover advance, unlock order, play/pause/scrub, and hold-to-speak inject.
- No auth, no multi-user, single page.
