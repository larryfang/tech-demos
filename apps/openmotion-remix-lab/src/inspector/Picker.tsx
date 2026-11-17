import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import type { BrandKit, ReferenceClip } from "@/fixtures/types"
import type { ReplayProgress } from "@/engine"

type PickerProps = {
  clips: ReferenceClip[]
  kits: BrandKit[]
  clipId: string
  kitId: string
  onClip: (id: string) => void
  onKit: (id: string) => void
  replay: ReplayProgress
  live: boolean
}

export function Picker({
  clips,
  kits,
  clipId,
  kitId,
  onClip,
  onKit,
  replay,
  live,
}: PickerProps) {
  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <section className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Reference clip</p>
        <div className="flex flex-col gap-2">
          {clips.map((clip) => {
            const selected = clip.id === clipId
            return (
              <button
                key={clip.id}
                type="button"
                data-clip={clip.id}
                onClick={() => onClip(clip.id)}
                className={cn(
                  "rounded-xl p-2 text-left ring-1 ring-foreground/10 transition-colors",
                  selected ? "bg-muted" : "hover:bg-muted/50",
                )}
              >
                <div className="mb-2 overflow-hidden rounded-md bg-black">
                  {clip.preview ? (
                    <video
                      src={clip.preview}
                      muted
                      loop
                      playsInline
                      autoPlay
                      className="aspect-video w-full object-cover"
                    />
                  ) : (
                    <div className="aspect-video" />
                  )}
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium">{clip.title}</span>
                  <Badge variant="outline">{clip.aspect}</Badge>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{clip.logline}</p>
              </button>
            )
          })}
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Brand kit</p>
        {kits.map((kit) => {
          const selected = kit.id === kitId
          return (
            <button
              key={kit.id}
              type="button"
              data-kit={kit.id}
              onClick={() => onKit(kit.id)}
              className={cn(
                "flex items-start gap-3 rounded-xl p-2 text-left ring-1 ring-foreground/10",
                selected ? "bg-muted" : "hover:bg-muted/50",
              )}
            >
              <span
                className="mt-0.5 size-8 shrink-0 rounded-md"
                style={{ background: kit.palette.primary, color: kit.palette.background }}
                dangerouslySetInnerHTML={{ __html: kit.logoSvg }}
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium">{kit.name}</span>
                <span className="block text-xs text-muted-foreground">{kit.tagline}</span>
                <span className="mt-1 flex gap-1">
                  {Object.values(kit.palette)
                    .slice(0, 4)
                    .map((color) => (
                      <span
                        key={color}
                        className="size-3 rounded-full ring-1 ring-black/20"
                        style={{ background: color }}
                      />
                    ))}
                </span>
              </span>
            </button>
          )
        })}
      </section>

      <section className="flex min-h-0 flex-1 flex-col gap-2">
        <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Replay agent</p>
        <div
          data-replay-log
          className="min-h-28 flex-1 overflow-auto rounded-lg bg-muted/30 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground"
        >
          {replay.completed.map((step) => (
            <div key={step.id}>· {step.message}</div>
          ))}
          <div className="text-foreground">→ {replay.current.message}</div>
        </div>
        {live ? (
          <p className="rounded-lg bg-muted/40 p-2 text-xs text-muted-foreground ring-1 ring-foreground/10">
            Live mode is stubbed. This demo does not analyse video or call an LLM. Replay fixtures
            remain the working path — see the README.
          </p>
        ) : null}
      </section>
    </div>
  )
}
