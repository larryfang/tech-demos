import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { activeChannelTask } from "@/engine/selectors"
import { useRoom } from "@/engine/use-room"
import { ChannelPanel } from "@/features/channel/ChannelPanel"
import { QueuePanel } from "@/features/queues/QueuePanel"
import { RosterPanel } from "@/features/roster/RosterPanel"

export default function App() {
  const { state, dispatch } = useRoom()
  const [liveConfigured, setLiveConfigured] = useState(false)
  const activeTask = activeChannelTask(state)
  const elapsedSec = activeTask
    ? Math.max(0, Math.round((state.now - activeTask.createdAt) / 1000))
    : 0

  useEffect(() => {
    void fetch("/api/status")
      .then((response) => response.json())
      .then((data: { configured?: boolean }) => {
        setLiveConfigured(Boolean(data.configured))
      })
      .catch(() => setLiveConfigured(false))
  }, [])

  return (
    <div className="min-h-svh bg-background">
      <div className="mx-auto flex max-w-[88rem] flex-col gap-6 px-4 py-6 lg:px-6">
        <header className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                Team Room
              </h1>
              <Badge variant="outline">
                {liveConfigured ? "live model ready" : "mock workers"}
              </Badge>
              {activeTask?.status === "running" ? (
                <Badge variant="secondary" data-testid="scenario-elapsed">
                  {elapsedSec}s
                </Badge>
              ) : null}
            </div>
            <p className="max-w-2xl text-sm text-muted-foreground">
              One owner, explicit delegation, per-agent FIFO queues. Inspired by
              OpenBot — written here as an offline browser demo.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              data-testid="run-sample"
              onClick={() => dispatch({ type: "RUN_SCENARIO", now: Date.now() })}
            >
              Run sample scenario
            </Button>
            <Button
              variant="outline"
              data-testid="reset"
              onClick={() => dispatch({ type: "RESET", now: Date.now() })}
            >
              Reset
            </Button>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)_minmax(18rem,22rem)]">
          <RosterPanel state={state} dispatch={dispatch} />
          <ChannelPanel
            state={state}
            dispatch={dispatch}
            liveConfigured={liveConfigured}
          />
          <QueuePanel state={state} dispatch={dispatch} />
        </div>
      </div>
    </div>
  )
}
