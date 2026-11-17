import { useCallback, useEffect, useMemo, useState } from "react"
import { Film, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  buildRemix,
  buildReplayScript,
  replayProgress,
  type ReplayProgress,
} from "@/engine"
import { BRAND_KITS, CLIPS } from "@/fixtures"
import type { EditMap, SceneEdit } from "@/fixtures/types"
import { MotionNotes } from "@/inspector/MotionNotes"
import { Picker } from "@/inspector/Picker"
import { SceneInspector } from "@/inspector/SceneInspector"
import { PreviewPlayer } from "@/player/PreviewPlayer"
import { useRafClock } from "@/player/useRafClock"
import { TimelineStrip } from "@/timeline/TimelineStrip"

type RenderStatus = {
  ffmpeg: boolean
  chrome: boolean
  live: boolean
  message: string
}

function mergeEdit(prev: EditMap, id: string, patch: SceneEdit): EditMap {
  const current = prev[id] ?? {}
  return {
    ...prev,
    [id]: {
      ...current,
      ...patch,
      text: { ...current.text, ...patch.text },
      colors: { ...current.colors, ...patch.colors },
    },
  }
}

export default function App() {
  const [clipId, setClipId] = useState(CLIPS[0].id)
  const [kitId, setKitId] = useState(BRAND_KITS[0].id)
  const [edits, setEdits] = useState<EditMap>({})
  const [selectedId, setSelectedId] = useState<string | null>(CLIPS[0].shots[0]?.id ?? null)
  const [timeMs, setTimeMs] = useState(0)
  const [playing, setPlaying] = useState(false)
  const [replayMs, setReplayMs] = useState(0)
  const [skipReplay, setSkipReplay] = useState(false)
  const [status, setStatus] = useState<RenderStatus | null>(null)
  const [renderMsg, setRenderMsg] = useState<string | null>(null)
  const [renderUrl, setRenderUrl] = useState<string | null>(null)
  const [rendering, setRendering] = useState(false)

  const clip = CLIPS.find((item) => item.id === clipId) ?? CLIPS[0]
  const kit = BRAND_KITS.find((item) => item.id === kitId) ?? BRAND_KITS[0]
  const remix = useMemo(() => buildRemix(clip, kit, edits), [clip, kit, edits])
  const script = useMemo(() => buildReplayScript(clip), [clip])

  const replay: ReplayProgress = skipReplay
    ? {
        index: script.length - 1,
        current: script[script.length - 1],
        completed: script.slice(0, -1),
        revealedShots: remix.scenes.length,
        ready: true,
      }
    : replayProgress(script, replayMs)

  const visibleScenes = remix.scenes.filter((scene) => scene.index < replay.revealedShots)
  const selected = remix.scenes.find((scene) => scene.id === selectedId) ?? null

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((json: RenderStatus) => setStatus(json))
      .catch(() =>
        setStatus({
          ffmpeg: false,
          chrome: false,
          live: false,
          message: "Could not reach the local render API.",
        }),
      )
  }, [])

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return
      }
      if (event.code === "Space") {
        event.preventDefault()
        setPlaying((value) => !value)
      }
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [])

  useRafClock(playing, remix.totalDurationMs, (delta) => {
    setTimeMs((current) => {
      const next = current + delta
      if (next >= remix.totalDurationMs) {
        setPlaying(false)
        return remix.totalDurationMs
      }
      return next
    })
  })

  useRafClock(!skipReplay && !replay.ready, 1, (delta) => {
    setReplayMs((current) => current + delta)
  })

  const changeClip = (id: string) => {
    setClipId(id)
    setEdits({})
    setTimeMs(0)
    setPlaying(false)
    setReplayMs(0)
    setSkipReplay(false)
    setRenderUrl(null)
    setRenderMsg(null)
    const next = CLIPS.find((item) => item.id === id)
    setSelectedId(next?.shots[0]?.id ?? null)
  }

  const changeKit = (id: string) => {
    setKitId(id)
    setReplayMs(0)
    setSkipReplay(false)
    setRenderUrl(null)
  }

  const onEdit = (id: string, patch: SceneEdit) => {
    setSkipReplay(true)
    setEdits((prev) => mergeEdit(prev, id, patch))
  }

  const onResize = (id: string, durationMs: number) => {
    setSkipReplay(true)
    setEdits((prev) => mergeEdit(prev, id, { durationMs }))
  }

  const reset = () => {
    setEdits({})
    setTimeMs(0)
    setPlaying(false)
    setReplayMs(0)
    setSkipReplay(false)
    setRenderUrl(null)
    setRenderMsg(null)
    setSelectedId(clip.shots[0]?.id ?? null)
  }

  const render = useCallback(async () => {
    setRendering(true)
    setRenderMsg(null)
    try {
      const res = await fetch("/api/render", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clipId, kitId, edits }),
      })
      const json = (await res.json()) as { ok?: boolean; message?: string; url?: string }
      if (!json.ok) {
        setRenderUrl(null)
        setRenderMsg(json.message ?? "Render failed.")
        return
      }
      setRenderUrl(json.url ?? null)
      setRenderMsg(json.message ?? "Wrote MP4 to out/.")
    } catch {
      setRenderMsg("Render request failed. Is `bun run dev` serving /api/render?")
    } finally {
      setRendering(false)
    }
  }, [clipId, kitId, edits])

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <Film className="size-4" />
            <h1 className="font-heading text-lg font-medium tracking-tight">Remix Lab</h1>
            <Badge variant={replay.ready ? "secondary" : "default"}>
              {replay.ready ? "READY" : "REPLAY"}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            {clip.title} × {kit.name} — fixture replay, no API keys
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" variant="outline" data-reset onClick={reset}>
            <RotateCcw />
            Reset
          </Button>
          <Button type="button" data-render onClick={render} disabled={rendering}>
            {rendering ? "Rendering…" : "Render MP4"}
          </Button>
        </div>
      </header>

      <div className="grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)_300px]">
        <aside className="min-h-0 border-r">
          <ScrollArea className="h-full">
            <div className="p-3">
              <Picker
                clips={CLIPS}
                kits={BRAND_KITS}
                clipId={clipId}
                kitId={kitId}
                onClip={changeClip}
                onKit={changeKit}
                replay={replay}
                live={Boolean(status?.live)}
              />
            </div>
          </ScrollArea>
        </aside>

        <main className="flex min-h-0 flex-col p-3">
          <PreviewPlayer
            remix={remix}
            scenes={visibleScenes}
            timeMs={timeMs}
            playing={playing}
            onTogglePlay={() => setPlaying((value) => !value)}
            onScrub={(ms) => {
              setPlaying(false)
              setTimeMs(ms)
            }}
          />
          {renderMsg ? (
            <p className="mt-2 text-sm text-foreground" data-render-msg>
              {renderMsg}{" "}
              {renderUrl ? (
                <a className="underline" href={renderUrl} target="_blank" rel="noreferrer">
                  Open MP4
                </a>
              ) : null}
            </p>
          ) : null}
          {status && (!status.ffmpeg || !status.chrome) ? (
            <p className="mt-1 text-xs text-muted-foreground">{status.message}</p>
          ) : null}
        </main>

        <aside className="flex min-h-0 flex-col gap-3 border-l p-3">
          <SceneInspector scene={selected} onChange={onEdit} />
          <MotionNotes markdown={remix.motionMd} />
        </aside>
      </div>

      <TimelineStrip
        remix={remix}
        scenes={visibleScenes.length ? visibleScenes : remix.scenes}
        timeMs={timeMs}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onResize={onResize}
        onScrub={(ms) => {
          setPlaying(false)
          setTimeMs(ms)
        }}
      />
    </div>
  )
}
