import type {
  BrandKit,
  BrandPalette,
  EditMap,
  LayoutKind,
  MotionKeyframe,
  ReferenceClip,
  SceneEdit,
  Shot,
  TextSlot,
  TransitionKind,
} from "../fixtures/types"
import { applySlots, sceneMarkup } from "./html"
import { layerStyleAttr, visualForLayer, type LayerVisual } from "./interpolate"
import { renderMotionMd } from "./motionMd"
import { layoutTimeline, totalDurationMs } from "./timeline"
import { mergePalette } from "./tokens"

export type HtmlScene = {
  id: string
  shotId: string
  index: number
  label: string
  layout: LayoutKind
  startMs: number
  endMs: number
  durationMs: number
  overlapMs: number
  transitionIn: TransitionKind
  transitionMs: number
  keyframes: MotionKeyframe[]
  tokens: BrandPalette
  slots: Array<TextSlot & { applied: string }>
  html: string
}

export type Remix = {
  clipId: string
  kitId: string
  title: string
  kitName: string
  aspect: "16:9" | "9:16"
  width: number
  height: number
  scenes: HtmlScene[]
  totalDurationMs: number
  motionMd: string
}

export type ActiveLayer = {
  scene: HtmlScene
  localMs: number
  progress: number
  visual: LayerVisual
}

export type FrameAtTime = {
  timeMs: number
  layers: ActiveLayer[]
}

const MIN_DURATION_MS = 400
const MAX_DURATION_MS = 8000

export function clampDuration(ms: number): number {
  return Math.min(MAX_DURATION_MS, Math.max(MIN_DURATION_MS, Math.round(ms)))
}

export function applyShotEdits(clip: ReferenceClip, edits: EditMap): ReferenceClip {
  return {
    ...clip,
    shots: clip.shots.map((shot) => applyOne(shot, edits[shot.id])),
  }
}

function applyOne(shot: Shot, edit?: SceneEdit): Shot {
  if (!edit) return shot
  return {
    ...shot,
    durationMs:
      typeof edit.durationMs === "number" ? clampDuration(edit.durationMs) : shot.durationMs,
    transitionIn: edit.transitionIn ?? shot.transitionIn,
    transitionMs: edit.transitionMs ?? shot.transitionMs,
    textSlots: shot.textSlots.map((slot) => ({
      ...slot,
      text: edit.text?.[slot.id] ?? slot.text,
    })),
  }
}

export function buildRemix(clip: ReferenceClip, kit: BrandKit, edits: EditMap = {}): Remix {
  const edited = applyShotEdits(clip, edits)
  const laid = layoutTimeline(edited.shots)
  const scenes = edited.shots.map((shot, index) => {
    const span = laid[index]
    const tokens = mergePalette(kit, edits[shot.id]?.colors)
    const slots = applySlots(shot, kit)
    return {
      id: shot.id,
      shotId: shot.id,
      index,
      label: shot.label,
      layout: shot.layout,
      startMs: span.startMs,
      endMs: span.endMs,
      durationMs: span.durationMs,
      overlapMs: span.overlapMs,
      transitionIn: shot.transitionIn,
      transitionMs: shot.transitionMs,
      keyframes: shot.keyframes,
      tokens,
      slots,
      html: sceneMarkup(shot, kit, tokens, slots),
    } satisfies HtmlScene
  })
  return {
    clipId: clip.id,
    kitId: kit.id,
    title: clip.title,
    kitName: kit.name,
    aspect: clip.aspect,
    width: clip.width,
    height: clip.height,
    scenes,
    totalDurationMs: totalDurationMs(laid),
    motionMd: renderMotionMd(edited, kit, scenes),
  }
}

export function frameAtTime(remix: Remix, timeMs: number): FrameAtTime {
  const total = remix.totalDurationMs
  const t = Math.min(Math.max(0, timeMs), Math.max(0, total))
  const atEnd = total > 0 && t >= total
  const layers: ActiveLayer[] = []
  for (const scene of remix.scenes) {
    const inclusiveEnd = atEnd && scene.endMs === total
    if (t < scene.startMs || (t >= scene.endMs && !inclusiveEnd)) continue
    const localMs = Math.min(scene.durationMs, Math.max(0, t - scene.startMs))
    const progress = scene.durationMs === 0 ? 1 : localMs / scene.durationMs
    layers.push({
      scene,
      localMs,
      progress,
      visual: visualForLayer(
        scene.keyframes,
        progress,
        scene.transitionIn,
        scene.overlapMs,
        localMs,
      ),
    })
  }
  return { timeMs: t, layers }
}

export function stageInnerHtml(remix: Remix, timeMs: number): string {
  const frame = frameAtTime(remix, timeMs)
  return frame.layers
    .map((layer, index) => {
      const style = layerStyleAttr(layer.visual, index + 1)
      return `<div class="om-layer" data-scene="${layer.scene.id}" style="${style}">${layer.scene.html}</div>`
    })
    .join("")
}

export function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms))
  const minutes = Math.floor(total / 60000)
  const seconds = Math.floor((total % 60000) / 1000)
  const tenths = Math.floor((total % 1000) / 100)
  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}.${tenths}`
}
