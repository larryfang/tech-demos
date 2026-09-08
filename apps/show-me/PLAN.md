# show-me — PLAN

## Goal
Paste a messy topic, notes, or thread → one click renders the smallest clear visual (flow/call tree, Mermaid diagram, or one focused HTML card), inspired by HumanLayer's show-me skill.

## Stack
- Scaffold: `bunx create-vite` (react-ts), Bun runtime
- UI: Tailwind v4 + shadcn/ui (button, textarea, card, tabs only)
- Key library: `mermaid` rendered client-side (real integration, no network)

## Tasks
1. Paste messy text into a textarea → click Generate → see a visual, never a wall of text.
2. Auto mode picks the smallest clear view: arrows/sequence words → Mermaid flow; indentation/hierarchy → tree; otherwise → focused HTML card.
3. Manual toggle among Tree / Mermaid / Card overrides auto pick.
4. Copy the visual's source (tree text / mermaid source) or download the HTML card.
5. One-click example inputs so the demo works instantly with no keys.

## Decisions & risks
- Deterministic local generator only (heuristics port the show-me skill's judgment: "pick the smallest view"). No LLM key required — happy path always works offline; keeps scope MVP-sized.
- Mermaid parse errors on weird generated input: mitigate by sanitizing node labels and falling back to the tree view.
- No persistence, no auth, single user, single page.
