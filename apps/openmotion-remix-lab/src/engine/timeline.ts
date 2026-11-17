import type { Shot, TransitionKind } from "../fixtures/types"

export type LaidShot = {
  shotId: string
  startMs: number
  endMs: number
  durationMs: number
  overlapMs: number
}

export function overlapMs(
  previousDurationMs: number,
  transitionIn: TransitionKind,
  transitionMs: number,
  currentDurationMs: number,
): number {
  if (transitionIn === "cut" || transitionMs <= 0) return 0
  return Math.min(transitionMs, previousDurationMs / 2, currentDurationMs / 2)
}

export function layoutTimeline(shots: Shot[]): LaidShot[] {
  const laid: LaidShot[] = []
  let cursor = 0
  for (let i = 0; i < shots.length; i += 1) {
    const shot = shots[i]
    const overlap =
      i === 0
        ? 0
        : overlapMs(
            shots[i - 1].durationMs,
            shot.transitionIn,
            shot.transitionMs,
            shot.durationMs,
          )
    const startMs = Math.max(0, cursor - overlap)
    const endMs = startMs + shot.durationMs
    laid.push({
      shotId: shot.id,
      startMs,
      endMs,
      durationMs: shot.durationMs,
      overlapMs: overlap,
    })
    cursor = endMs
  }
  return laid
}

export function totalDurationMs(laid: LaidShot[]): number {
  return laid.at(-1)?.endMs ?? 0
}

export function durationSum(shots: Shot[]): number {
  return shots.reduce((sum, shot) => sum + shot.durationMs, 0)
}
