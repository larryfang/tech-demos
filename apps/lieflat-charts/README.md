# Lieflat Charts

Paste CSV or JSON — get one interactive chart in [Glance](https://github.com/larashero3-dotcom/lieflat-charts) or Lupi Basics style. Inspired by the Lieflat Charts skill; this demo is self-contained and works offline.

- **Glance**: bold ranked bars, a lead number, hover tooltips (bundled Chart.js)
- **Lupi Basics**: hairline grid, countable ticks, hover notes (handwritten SVG)
- **Mono / Porcelain**: charcoal paper, or celadon-blue (青瓷蓝)

No API keys. Sample datasets are one click away.

## Run

```sh
bun install
bun run dev
```

Then open http://localhost:5173, click **Plan MRR**, and switch Glance / Lupi Basics or Mono / Porcelain.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · Chart.js (bundled, not CDN)
