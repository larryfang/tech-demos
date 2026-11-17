import { useMemo } from "react"
import { Pause, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { formatClock, frameAtTime, type HtmlScene, type Remix } from "@/engine"
import { SceneLayer } from "./SceneLayer"

type PreviewPlayerProps = {
  remix: Remix
  scenes: HtmlScene[]
  timeMs: number
  playing: boolean
  onTogglePlay: () => void
  onScrub: (ms: number) => void
}

export function PreviewPlayer({
  remix,
  scenes,
  timeMs,
  playing,
  onTogglePlay,
  onScrub,
}: PreviewPlayerProps) {
  const visible = useMemo(() => {
    const clipped: Remix = { ...remix, scenes, totalDurationMs: remix.totalDurationMs }
    return frameAtTime(clipped, timeMs)
  }, [remix, scenes, timeMs])

  const aspect = remix.aspect === "9:16" ? "9 / 16" : "16 / 9"

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-3">
      <div className="flex min-h-0 flex-1 items-center justify-center rounded-xl bg-black/40 p-4 ring-1 ring-foreground/10">
        <div
          data-preview-stage
          className="relative overflow-hidden rounded-lg shadow-2xl"
          style={{
            aspectRatio: aspect,
            width: remix.aspect === "9:16" ? "min(100%, 280px)" : "min(100%, 720px)",
            maxHeight: "100%",
            background: "#000",
          }}
        >
          {visible.layers.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-white/50">
              Waiting for the replay agent…
            </div>
          ) : (
            visible.layers.map((layer) => (
              <SceneLayer
                key={layer.scene.id}
                scene={layer.scene}
                localMs={layer.localMs}
                visual={layer.visual}
              />
            ))
          )}
        </div>
      </div>
      <div className="flex items-center gap-3 px-1">
        <Button
          type="button"
          variant="outline"
          size="icon"
          aria-label={playing ? "Pause" : "Play"}
          data-play
          onClick={onTogglePlay}
        >
          {playing ? <Pause /> : <Play />}
        </Button>
        <span className="w-28 font-mono text-xs tabular-nums text-muted-foreground">
          {formatClock(timeMs)} / {formatClock(remix.totalDurationMs)}
        </span>
        <Slider
          data-scrub
          min={0}
          max={Math.max(1, remix.totalDurationMs)}
          step={50}
          value={[timeMs]}
          onValueChange={(value) => {
            const next = Array.isArray(value) ? value[0] : value
            if (typeof next === "number") onScrub(next)
          }}
          aria-label="Playhead"
        />
      </div>
    </div>
  )
}
