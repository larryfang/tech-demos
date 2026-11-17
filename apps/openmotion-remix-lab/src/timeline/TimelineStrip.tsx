import { useRef, type PointerEvent as ReactPointerEvent } from "react"
import { cn } from "@/lib/utils"
import type { HtmlScene, Remix } from "@/engine"

const MIN_MS = 400
const TRACK_COLORS = ["#e0b33a", "#5b8def", "#e06b55", "#3dcc8a", "#c77dff"]

type TimelineStripProps = {
  remix: Remix
  scenes: HtmlScene[]
  timeMs: number
  selectedId: string | null
  onSelect: (id: string) => void
  onResize: (id: string, durationMs: number) => void
  onScrub: (ms: number) => void
}

export function TimelineStrip({
  remix,
  scenes,
  timeMs,
  selectedId,
  onSelect,
  onResize,
  onScrub,
}: TimelineStripProps) {
  const trackRef = useRef<HTMLDivElement>(null)
  const total = Math.max(1, remix.totalDurationMs)
  const playhead = (timeMs / total) * 100

  const startDrag = (scene: HtmlScene, event: ReactPointerEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()
    const track = trackRef.current
    if (!track) return
    const startX = event.clientX
    const startDuration = scene.durationMs
    const width = track.getBoundingClientRect().width

    const move = (ev: globalThis.PointerEvent) => {
      const delta = ev.clientX - startX
      const next = startDuration + (delta / width) * total
      onResize(scene.id, Math.max(MIN_MS, next))
    }
    const up = () => {
      window.removeEventListener("pointermove", move)
      window.removeEventListener("pointerup", up)
    }
    window.addEventListener("pointermove", move)
    window.addEventListener("pointerup", up)
  }

  return (
    <div className="flex flex-col gap-2 border-t px-4 py-3">
      <div className="flex items-center justify-between text-[11px] uppercase tracking-wider text-muted-foreground">
        <span>Timeline</span>
        <span className="font-mono normal-case tracking-normal">
          {scenes.length} scenes · {(remix.totalDurationMs / 1000).toFixed(2)}s
        </span>
      </div>
      <div
        ref={trackRef}
        data-timeline
        className="relative h-16 cursor-ew-resize rounded-lg bg-muted/40 ring-1 ring-foreground/10"
        onPointerDown={(event) => {
          if ((event.target as HTMLElement).closest("[data-resize]")) return
          const rect = event.currentTarget.getBoundingClientRect()
          const ratio = (event.clientX - rect.left) / rect.width
          onScrub(ratio * total)
        }}
      >
        {scenes.map((scene) => {
          const left = (scene.startMs / total) * 100
          const width = (scene.durationMs / total) * 100
          const selected = scene.id === selectedId
          return (
            <div
              key={scene.id}
              data-scene-block={scene.id}
              className={cn(
                "absolute overflow-hidden rounded-md ring-1 ring-black/30",
                selected ? "ring-2 ring-white" : "",
              )}
              style={{
                left: `${left}%`,
                width: `${Math.max(width, 2)}%`,
                top: scene.index % 2 === 0 ? 6 : 22,
                bottom: scene.index % 2 === 0 ? 22 : 6,
                background: TRACK_COLORS[scene.index % TRACK_COLORS.length],
                color: "#111111",
              }}
              onClick={(event) => {
                event.stopPropagation()
                onSelect(scene.id)
              }}
            >
              <div className="flex h-full items-center justify-between gap-1 px-2 text-[11px] font-medium">
                <span className="truncate">{scene.label}</span>
                <span className="font-mono opacity-80">{(scene.durationMs / 1000).toFixed(1)}s</span>
              </div>
              <button
                type="button"
                data-resize
                aria-label={`Resize ${scene.label}`}
                className="absolute inset-y-0 right-0 w-2 cursor-ew-resize bg-black/25"
                onPointerDown={(event) => startDrag(scene, event)}
              />
            </div>
          )
        })}
        <div
          data-playhead
          className="pointer-events-none absolute top-0 bottom-0 w-px bg-primary"
          style={{ left: `${playhead}%` }}
        >
          <div className="absolute -top-1 left-1/2 size-2 -translate-x-1/2 rounded-full bg-primary" />
        </div>
      </div>
    </div>
  )
}
