# AGENTS.md — tech-demos monorepo rules

This repository is a **sticky playground** for small tech demos. It persists across agent runs; treat existing apps and tracking data as durable state, not scratch space.

## Layout & scope

- **One app per pick**, always under `apps/<slug>/` (the slug comes from `tracking/seen-bookmarks.json`).
- Cloud agents may only touch files under `apps/<slug>/` for the pick they are building, **plus** the `tracking/` directory. Do not modify other apps or unrelated repo files.
- Each app must be **self-contained**: `bun install && bun run dev` from `apps/<slug>/` must be enough to run it.

## Runtime & workflow

- **Bun** is the runtime and package manager for all apps.
- Before writing any code, follow the planning skill at `skills/project-planning/` and write the resulting plan to `apps/<slug>/PLAN.md`.
- Keep demos single-user MVPs: no auth, no multi-tenancy, no production hardening.

## Pull requests & validation

- Open **one PR per pick**.
- The PR must attach **BOTH** of the following, showing the running app's happy path:
  - at least **one screenshot**, and
  - at least **one short video**.
- A PR without both a screenshot and a video is incomplete.
- Update `tracking/seen-bookmarks.json` in the same PR (move the pick from `proposed` toward `built`, keeping the proposed history).

## Hard rules

- **Never create a new GitHub repository.** All work stays inside this monorepo.
- Real integrations only — mocked demo output is not acceptable when the pick's library can run locally.

## Deployment (Cloudflare)

- Deployment target is **one Cloudflare Pages project**, routed **path-per-app** (e.g. `/<slug>/`), not one project per app.
- Required secrets: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID`.
