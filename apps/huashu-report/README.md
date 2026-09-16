# Huashu Report

Pick an institutional report prototype, enter a topic, and walk a local pipeline: **outline → chart stubs with conclusion-style titles → HTML / Markdown preview**.

Inspired by [huashu-report](https://github.com/alchaincyf/huashu-report) (six prototypes, eight SVG chart modes, titles that state the finding). This demo ports that spirit to an in-browser MVP. It does **not** run the Python PDF/SVG pipeline.

No API key. Content is a deterministic stub so the happy path works offline.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173, click **Agents**, then **Continue** through outline → chart stubs → preview. Toggle **HTML** / **Markdown**.

## Prototypes

| Prototype | Reader |
| --- | --- |
| Academic | Cite the numbers |
| Consulting deck | Take it into a meeting (16:9, one conclusion per page) |
| Survey | Understand a population (questionnaire item under each chart) |
| Research note | Look up a number (Exhibit titles stay neutral) |
| Paper (arXiv) | Peer review; contributions listed |
| Popular science | No background, then act (three-act + method in the margin) |

## Chart modes

Horizontal bars · 100% stacked row · paired columns (negatives go below zero) · end-labeled line · big-number anchor · diverging stacked bars · slope · quadrant with labels in place.

## Optional LLM

`VITE_OPENAI_API_KEY` is ignored in v1. If the variable is set, the UI notes that the stub path still wins so a missing or failing model cannot break the demo.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · inline SVG (port of `chart.py`)
