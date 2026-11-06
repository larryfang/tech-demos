import { useEffect, useMemo, useRef, useState } from "react"
import { Pause, Play, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import {
  formatClock,
  injectHoldToSpeak,
  lockedNotes,
  pause,
  peekUtterance,
  play,
  runSample,
  scrub,
  seedState,
  tick,
  unlockedNotes,
  visibleLines,
  type MeetingState,
} from "@/engine/engine"
import { clearState, loadState, saveState } from "@/engine/storage"
import { HoldToSpeak } from "@/features/hold-to-speak/HoldToSpeak"
import { NotesPanel } from "@/features/notes/NotesPanel"
import { TranscriptPanel } from "@/features/transcript/TranscriptPanel"
import { HARBOR_BOOKS } from "@/fixtures/harbor-books"

const fixture = HARBOR_BOOKS

export default function App() {
  const [state, setState] = useState<MeetingState>(() => {
    const loaded = loadState()
    return scrub(loaded, loaded.clockMs, fixture.durationMs)
  })
  const stateRef = useRef(state)
  stateRef.current = state

  useEffect(() => {
    saveState(state)
  }, [state])

  useEffect(() => {
    if (!state.playing) return
    let last = performance.now()
    const id = window.setInterval(() => {
      const now = performance.now()
      const dt = now - last
      last = now
      setState((current) => {
        const next = tick(current, dt, fixture.durationMs)
        stateRef.current = next
        return next
      })
    }, 50)
    return () => window.clearInterval(id)
  }, [state.playing])

  const lines = useMemo(
    () => visibleLines(state.clockMs, fixture, state.injected),
    [state.clockMs, state.injected],
  )
  const unlocked = useMemo(
    () => unlockedNotes(state.clockMs, fixture),
    [state.clockMs],
  )
  const locked = useMemo(
    () => lockedNotes(state.clockMs, fixture),
    [state.clockMs],
  )

  const nextUtterance = peekUtterance(state, fixture)

  const onInject = () => {
    const utterance = peekUtterance(stateRef.current, fixture)
    setState((prev) => {
      const result = injectHoldToSpeak(prev, fixture)
      stateRef.current = result.state
      return result.state
    })
    return utterance
  }

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="font-heading text-lg font-medium tracking-tight">
              {fixture.title}
              <span className="ml-2 text-muted-foreground">{fixture.titleZh}</span>
            </h1>
            <Badge variant={state.playing ? "default" : "secondary"}>
              {state.playing ? (
                <span className="flex items-center gap-1.5">
                  <span className="live-dot size-1.5 rounded-full bg-lime-400" />
                  LIVE
                </span>
              ) : (
                "PAUSED"
              )}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{fixture.subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            data-run-sample
            onClick={() => setState(runSample())}
          >
            Run sample meeting
          </Button>
          <Button
            type="button"
            variant="outline"
            data-reset
            onClick={() => {
              clearState()
              setState(seedState())
            }}
          >
            <RotateCcw />
            Reset
          </Button>
        </div>
      </header>

      <main className="grid min-h-0 flex-1 gap-3 overflow-hidden p-3 lg:grid-cols-2">
        <TranscriptPanel fixture={fixture} lines={lines} />
        <NotesPanel unlocked={unlocked} locked={locked} />
      </main>

      <footer className="border-t px-4 py-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label={state.playing ? "Pause" : "Play"}
              data-play-pause
              onClick={() =>
                setState((current) =>
                  current.playing
                    ? pause(current)
                    : play(current, fixture.durationMs),
                )
              }
            >
              {state.playing ? <Pause /> : <Play />}
            </Button>
            <span className="w-24 font-mono text-sm tabular-nums text-muted-foreground">
              {formatClock(state.clockMs)} / {formatClock(fixture.durationMs)}
            </span>
            <Slider
              data-scrub
              min={0}
              max={fixture.durationMs}
              step={250}
              value={[state.clockMs]}
              onValueChange={(value) => {
                const next = Array.isArray(value) ? value[0] : value
                if (typeof next === "number") {
                  setState((current) => scrub(current, next, fixture.durationMs))
                }
              }}
              aria-label="Meeting clock"
            />
          </div>
          <HoldToSpeak
            nextUtterance={nextUtterance}
            onHoldStart={() => setState((current) => pause(current))}
            onInject={onInject}
          />
        </div>
      </footer>
    </div>
  )
}
