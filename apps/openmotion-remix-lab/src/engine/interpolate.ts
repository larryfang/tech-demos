import type { MotionKeyframe, TransitionKind } from "../fixtures/types"

export type Transform = {
  opacity: number
  x: number
  y: number
  scale: number
  rotate: number
}

export type LayerVisual = Transform & {
  clipPath: string
  extraX: number
  extraScale: number
  transform: string
}

const DEFAULT_TRANSFORM: Transform = {
  opacity: 1,
  x: 0,
  y: 0,
  scale: 1,
  rotate: 0,
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

function fill(kf: MotionKeyframe, fallback: Transform): Transform {
  return {
    opacity: kf.opacity ?? fallback.opacity,
    x: kf.x ?? fallback.x,
    y: kf.y ?? fallback.y,
    scale: kf.scale ?? fallback.scale,
    rotate: kf.rotate ?? fallback.rotate,
  }
}

export function interpolateKeyframes(
  keyframes: MotionKeyframe[],
  progress: number,
): Transform {
  if (keyframes.length === 0) return { ...DEFAULT_TRANSFORM }
  const sorted = [...keyframes].sort((a, b) => a.at - b.at)
  const t = Math.min(1, Math.max(0, progress))
  if (t <= sorted[0].at) return fill(sorted[0], DEFAULT_TRANSFORM)
  const last = sorted[sorted.length - 1]
  if (t >= last.at) return fill(last, DEFAULT_TRANSFORM)

  let i = 0
  while (i < sorted.length - 1 && sorted[i + 1].at < t) i += 1
  const a = sorted[i]
  const b = sorted[i + 1]
  const span = b.at - a.at || 1
  const local = (t - a.at) / span
  const from = fill(a, DEFAULT_TRANSFORM)
  const to = fill(b, from)
  return {
    opacity: lerp(from.opacity, to.opacity, local),
    x: lerp(from.x, to.x, local),
    y: lerp(from.y, to.y, local),
    scale: lerp(from.scale, to.scale, local),
    rotate: lerp(from.rotate, to.rotate, local),
  }
}

export function transitionBlend(
  transitionIn: TransitionKind,
  overlapMs: number,
  localMs: number,
): { opacityMul: number; extraX: number; extraScale: number; clipPath: string } {
  if (transitionIn === "cut" || overlapMs <= 0) {
    return { opacityMul: 1, extraX: 0, extraScale: 1, clipPath: "none" }
  }
  const t = Math.min(1, Math.max(0, localMs / overlapMs))
  if (transitionIn === "fade") {
    return { opacityMul: t, extraX: 0, extraScale: 1, clipPath: "none" }
  }
  if (transitionIn === "wipe") {
    return {
      opacityMul: 1,
      extraX: 0,
      extraScale: 1,
      clipPath: `inset(0 ${((1 - t) * 100).toFixed(2)}% 0 0)`,
    }
  }
  if (transitionIn === "slide") {
    return { opacityMul: 1, extraX: (1 - t) * 40, extraScale: 1, clipPath: "none" }
  }
  return { opacityMul: 1, extraX: 0, extraScale: 1 + 0.14 * (1 - t), clipPath: "none" }
}

export function visualForLayer(
  keyframes: MotionKeyframe[],
  progress: number,
  transitionIn: TransitionKind,
  overlapMs: number,
  localMs: number,
): LayerVisual {
  const kf = interpolateKeyframes(keyframes, progress)
  const blend = transitionBlend(transitionIn, overlapMs, localMs)
  const opacity = kf.opacity * blend.opacityMul
  const extraX = blend.extraX
  const extraScale = blend.extraScale
  const transform = `translate(${kf.x + extraX}%, ${kf.y}%) scale(${kf.scale * extraScale}) rotate(${kf.rotate}deg)`
  return {
    ...kf,
    opacity,
    extraX,
    extraScale,
    clipPath: blend.clipPath,
    transform,
  }
}

export function layerStyleAttr(visual: LayerVisual, zIndex: number): string {
  const clip = visual.clipPath === "none" ? "" : `clip-path:${visual.clipPath};`
  return `position:absolute;inset:0;opacity:${visual.opacity.toFixed(4)};transform:${visual.transform};${clip}z-index:${zIndex}`
}
