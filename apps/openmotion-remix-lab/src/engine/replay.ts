import type { ReferenceClip } from "../fixtures/types"

export type ReplayKind =
  | "boot"
  | "analyse"
  | "layout"
  | "transition"
  | "brand"
  | "notes"
  | "ready"

export type ReplayStep = {
  id: string
  kind: ReplayKind
  message: string
  shotIndex?: number
  shotCount?: number
}

export const REPLAY_STEP_MS = 420

export function buildReplayScript(clip: ReferenceClip): ReplayStep[] {
  const shotCount = clip.shots.length
  const steps: ReplayStep[] = [
    {
      id: "boot",
      kind: "boot",
      message: `Loading reference “${clip.title}”…`,
    },
  ]

  clip.shots.forEach((shot, index) => {
    steps.push({
      id: `analyse-${shot.id}`,
      kind: "analyse",
      shotIndex: index,
      shotCount,
      message: `Analysing shot ${index + 1}/${shotCount} — ${shot.label}`,
    })
    steps.push({
      id: `layout-${shot.id}`,
      kind: "layout",
      shotIndex: index,
      shotCount,
      message: `Mapped ${shot.layout} layout (${(shot.durationMs / 1000).toFixed(1)}s)`,
    })
    steps.push({
      id: `transition-${shot.id}`,
      kind: "transition",
      shotIndex: index,
      shotCount,
      message:
        shot.transitionIn === "cut"
          ? "Transition: cut (no overlap)"
          : `Transition: ${shot.transitionIn} ${shot.transitionMs}ms`,
    })
  })

  steps.push({ id: "brand", kind: "brand", message: "Applying brand kit tokens" })
  steps.push({ id: "notes", kind: "notes", message: "Writing Motion.md design notes" })
  steps.push({ id: "ready", kind: "ready", message: "Remix ready" })
  return steps
}

export type ReplayProgress = {
  index: number
  current: ReplayStep
  completed: ReplayStep[]
  revealedShots: number
  ready: boolean
}

export function replayProgress(steps: ReplayStep[], elapsedMs: number): ReplayProgress {
  if (steps.length === 0) {
    throw new Error("Replay script is empty")
  }
  const maxIndex = steps.length - 1
  const index = Math.min(maxIndex, Math.max(0, Math.floor(elapsedMs / REPLAY_STEP_MS)))
  const current = steps[index]
  const completed = steps.slice(0, index)
  const seen = [...completed, current]
  let revealedShots = 0
  for (const step of seen) {
    if (step.kind === "brand" || step.kind === "notes" || step.kind === "ready") {
      revealedShots = steps.reduce(
        (max, item) => Math.max(max, (item.shotIndex ?? -1) + 1),
        0,
      )
      break
    }
    if (typeof step.shotIndex === "number") {
      revealedShots = Math.max(revealedShots, step.shotIndex + 1)
    }
  }
  return {
    index,
    current,
    completed,
    revealedShots,
    ready: index >= maxIndex,
  }
}

export function replayDurationMs(steps: ReplayStep[]): number {
  return Math.max(0, (steps.length - 1) * REPLAY_STEP_MS)
}
