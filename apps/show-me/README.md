# show-me

Paste a messy topic, notes, or thread → get the smallest clear visual instead of a wall of text. Inspired by [HumanLayer's show-me skill](https://github.com/humanlayer/skills/tree/main/plugins/show-me).

A deterministic local generator picks the view (no API keys, works offline):

- **Mermaid flow / sequence diagram** when the text has arrows, `A -> B: message` lines, numbered steps, or sequence words
- **Call / file tree** when indentation reads as a hierarchy
- **One focused HTML card** otherwise — copyable and downloadable as standalone HTML

Auto mode picks for you; Tree / Mermaid / Card tabs override it.

## Run

```sh
bun install
bun run dev
```

Then open http://localhost:5173 and click one of the example buttons.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · mermaid (rendered client-side)
