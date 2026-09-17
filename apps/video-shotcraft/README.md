# Video Shotcraft

Single-user fixture gallery inspired by [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) — an agent skill that turns product screenshots into cinematic Remotion promos (shot recipe cards, motion previews, the **Ink Press** template, a CapCut-style Motion Workbench).

This demo shows a **searchable recipe library** and a short Ink Press storyboard for a recent Sinch launch. It does **not** run the agent pipeline or a Remotion render farm.

Bookmark: [yanliudreamer on Video Shotcraft](https://x.com/yanliudreamer/status/2090248229648826426).

## Primary fixture: Mailgun Inspect

**Mailgun Inspect** (announced 1 Sep 2026) is email rendering/testing across 100+ clients and devices, shipped as a native Salesforce Agentforce Marketing (Marketing Cloud Next) Lightning Web Component on AgentExchange.

Press: [Sinch announces Mailgun Inspect for email testing on Salesforce’s AgentExchange](https://www.group.sinch.com/media/press-releases-and-news/2026/sinch-announces-mailgun-inspect-for-email-testing-on-salesforces-agentexchange/).

The happy path is a 10-beat Ink Press promo:

1. Brand open — **Mailgun Inspect**
2. Title card — inbox QA is still a *tab jungle*
3. Crane rise — fragmented Litmus / Outlook / Slack QA
4. Spotlight — Inspect LWC inside Agentforce Marketing
5. Deck deal — 100+ client tiles into a grid
6. Type and filter — Outlook / Gmail / Apple Mail
7. Row embed — clipped CTA, dark-mode invert, missing alt
8. List stack — counter lands on 100+
9. Typewriter — HTML/CSS analysis
10. Outro — *ship with confidence*

Every product screen is a labeled **Fixture** placeholder, not a captured Salesforce or Mailgun screenshot.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173. You should see a **Fixture** badge, the **Mailgun Inspect launch** Ink Press strip, a recipe gallery default-filtered to Inspect, and a CapCut-style workbench under the grid. Click a storyboard beat or a gallery card to load recipe params.

```sh
bun test
bun run build
```

## Gallery vs real Shotcraft

| | This demo | Real [video-shotcraft](https://github.com/Vincentwei1021/video-shotcraft) |
| --- | --- | --- |
| Library | 24 curated recipe cards with covers + params | 157 cards · 214 motion previews |
| Motion | Looping CSS keyframes on fixture frames | Tuned Remotion TSX + mp4 previews |
| Ink Press | 10-beat Mailgun Inspect storyboard | 36.2s / 1920×1080 / 30fps production template |
| Workbench | Fixture shot / caption / SFX tracks | Schema-driven editor + Remotion export |
| Product input | Seeded Inspect (+ optional Agent Tools card) | Agent swaps real product screenshots |
| Render | None. Zero keys. | `remotion render` / stills / JianYing export |

No `API_KEY` is read. If you later wire the real skill, keep this app as the offline map of the gallery.

## Secondary card

**Sinch Agent Tools** (GA 4 Aug 2026) appears as an optional library product — IDE + Skills/MCP, not the verified screenshot/video centerpiece. Filter the gallery to **Agent Tools** to see it.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui

See `PLAN.md` for scope.
