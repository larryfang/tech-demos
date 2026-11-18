# Team Room

A one-page browser room for a four-agent team: Planner, Coder, Reviewer, Researcher. Each agent has a FIFO queue. A shared channel has one owner. The owner’s scripted run breaks work into slices, hands them off, waits for results, and closes the task.

Inspired by [OpenBot](https://github.com/nightly-labs/openbot) (PolyForm Noncommercial). This demo is written from scratch with our own fixtures. It copies no code, assets, or text from that repository.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173. Click **Run sample scenario**. In about 30–60 seconds you should see:

1. You post “Ship the v0.3 launch checklist” with Mira Chen (Planner) as owner.
2. Mira hands research to Sol, coding to Jonah, review to Ada.
3. Jonah sends Ada a direct note about rollback.
4. Results return to Mira, who closes the task.

No API key is required. State is stored in `localStorage`. **Reset** restores the seed roster.

## Optional live model

Copy `.env.example` to `.env` and set `OPENAI_API_KEY`. Restart `bun run dev`. `/api/status` flips to configured and one agent can call `/api/complete`. The scripted room still works if the key is missing or the request fails.

## Tests

```sh
bun test
```

Engine-only: FIFO order, pause/resume, cancel, delegation/handback, reassign, stop.

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · a tickable reducer in `src/engine`
