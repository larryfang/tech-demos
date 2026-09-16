# Huashu Report — PLAN

## Goal
Pick one of six institutional report prototypes, enter a topic, and walk outline → conclusion-titled chart stubs → a polished markdown/HTML preview. Offline stubs by default; no API key.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, card, input, textarea, badge, tabs, label)
- Charts: in-browser SVG port of huashu-report’s eight `chart.py` modes (no Python at runtime)

## Tasks
1. Pick a prototype (academic / consulting deck / survey / research / paper / popular-science) and a topic → see a one-sitting pipeline start.
2. Outline step → see that prototype’s chapter skeleton filled for the topic.
3. Chart-stub step → see four of eight modes with conclusion-style titles (neutral Exhibit titles for research).
4. Preview step → toggle HTML (institutional layout) and Markdown of the same report, including inline SVG charts, source lines, and N.
5. README documents `bun install && bun run dev` with no keys required.

## Decisions & risks
- Adapt spirit of [huashu-report](https://github.com/alchaincyf/huashu-report) locally: six prototypes, eight SVG chart modes, conclusion titles. Do not run the Python SVG/PDF pipeline in v1.
- Deterministic stub generator is the happy path. Optional LLM via env is a later add; missing key must still produce the stub report.
- `bunfig.toml` with `minimumReleaseAge = 259200` is created before `bun install`.
- No auth, no persistence, single page.
