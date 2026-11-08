# Desktop Ref Lab

A local web console for the **snapshot → act on a ref → re-snapshot** loop used by [agent-desktop](https://github.com/vercel-labs/agent-desktop) (Apache-2.0). This demo is original code and original fixtures — not a fork of that CLI.

Each accessibility node can carry a snapshot-qualified ref (`@sc0:e7`). Click or type the ref, then the tree is snapshotted again. Added / removed / changed nodes are highlighted. Refs belong to one snapshot: reusing an old ref returns `STALE_REF`.

Replay mode is the default and needs no OS accessibility permissions. Live mode is optional.

## Run

```sh
bun install
bun run dev
```

Open http://localhost:5173. Pick **Calculator**, **Notes**, or **System Settings**. Select a ref in the tree, click or type, and watch the diff plus the JSON envelope.

```sh
bun test
```

Engine tests cover tree diff (identity across snapshot ids, added/removed/changed) and stale-ref handling (`STALE_REF`, `INVALID_ARGS` for a bare `@eN`, `PERM_DENIED` on the settings fixture).

## Replay (default)

Three recorded apps:

1. **Calculator** — click `7` `+` `5` `=` to change the display and add a History row; `C` removes it.
2. **Notes** — **New** adds a list item, **Type** fills the editor, **Delete** removes a note.
3. **System Settings** — switching panes replaces the content group; **Grant Accessibility** returns `PERM_DENIED`.

**STALE_REF demo** clicks a live ref, then retries that same string after the snapshot id has changed.

## Live (optional)

If `agent-desktop` is on `PATH`, **Live** lists real apps and proxies `snapshot` / `click` / `type` through a Vite middleware that shells out to the CLI. If it is not installed, the UI says so and stays in Replay. Live is never required.

```sh
npm install -g agent-desktop
agent-desktop permissions --guide   # macOS Accessibility grant
```

## Stack

Vite (react-ts) · Bun · Tailwind v4 · shadcn/ui · fixture replay engine · optional `agent-desktop` CLI adapter
