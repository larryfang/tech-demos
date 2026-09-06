---
name: project-planning
description: Opinionated planning workflow for Bun + shadcn/ui single-user MVP demos in this monorepo. Follow before writing any code for an app under apps/<slug>/, and write the output to apps/<slug>/PLAN.md.
---

# Project planning — Bun/shadcn MVP demos

Follow this workflow **before writing any code** for a new app. The output is a short `PLAN.md` in the app folder.

## Workflow

1. **Clarify the single-user MVP.** State in one or two sentences what the demo does for one user in one sitting. Cut anything that isn't the core loop (no auth, no persistence unless it *is* the demo, no settings pages, no multi-tenant anything).

2. **Write outcome-oriented tasks.** List 3–7 tasks phrased as user-visible outcomes ("paste URL → see Markdown"), not implementation chores ("create utils folder"). Each task should be independently verifiable.

3. **Scaffold with official generators.** Prefer `bunx create-*` scaffolds (e.g. `bunx create-next-app`, `bunx create-vite`) over hand-rolled project structure. Don't fight the scaffold's conventions.

4. **Pin install safety first.** Before running `bun install`, create `bunfig.toml` in the app root with:

   ```toml
   [install]
   minimumReleaseAge = 259200
   ```

   This keeps freshly published (potentially compromised) package versions out of the demo.

5. **shadcn/ui, minimalist.** Use shadcn/ui for UI. Install only the components you actually render. Default theme, no custom design system, no icon packs beyond what shadcn pulls in.

6. **Prebuilt over bespoke.** Reach for an existing library, CLI, or official integration before writing custom logic. The demo's value is showing the *picked* technology working, not our glue code.

7. **Keep the plan short.** `PLAN.md` should fit on one screen: goal, stack, tasks, and any risks/decisions. If the plan is long, the MVP is too big.

## PLAN.md template

```markdown
# <App name> — PLAN

## Goal
<one-sentence single-user MVP>

## Stack
<scaffold, runtime, UI kit, key library>

## Tasks
1. <outcome>
2. <outcome>
...

## Decisions & risks
- <bullet>
```
