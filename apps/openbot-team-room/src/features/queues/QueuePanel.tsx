import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { queueOf } from "@/engine/selectors"
import type { Action, RoomState } from "@/engine/types"

export function QueuePanel({
  state,
  dispatch,
}: {
  state: RoomState
  dispatch: (action: Action) => void
}) {
  const [agentId, setAgentId] = useState(state.agents[0]?.id ?? "")
  const [title, setTitle] = useState("")

  const enqueue = () => {
    const trimmed = title.trim()
    if (!trimmed || !agentId) return
    dispatch({ type: "ENQUEUE", agentId, title: trimmed })
    setTitle("")
  }

  return (
    <section className="flex flex-col gap-3" data-testid="queues">
      <div>
        <h2 className="text-sm font-medium">Per-agent queues</h2>
        <p className="text-xs text-muted-foreground">
          FIFO. One running item each. Pause freezes progress.
        </p>
      </div>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Enqueue</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="enqueue-agent">Agent</Label>
            <select
              id="enqueue-agent"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={agentId}
              onChange={(event) => setAgentId(event.target.value)}
            >
              {state.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.role}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <Label htmlFor="enqueue-title">Task</Label>
            <Input
              id="enqueue-title"
              value={title}
              placeholder="Add a solo queue item"
              onChange={(event) => setTitle(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") enqueue()
              }}
            />
          </div>
          <Button size="sm" onClick={enqueue} data-testid="enqueue-submit">
            Enqueue
          </Button>
        </CardContent>
      </Card>

      {state.agents.map((agent) => {
        const items = queueOf(state, agent.id)
        const live = items.filter(
          (item) => item.status === "queued" || item.status === "running",
        )
        const recent = items.filter((item) => item.status === "done" || item.status === "cancelled").slice(-2)
        return (
          <Card key={agent.id} size="sm" data-testid={`queue-${agent.id}`}>
            <CardHeader className="flex flex-row items-center justify-between gap-2">
              <CardTitle>{agent.name}</CardTitle>
              <Badge variant="outline">{live.length} live</Badge>
            </CardHeader>
            <CardContent className="space-y-2">
              {live.length === 0 && recent.length === 0 ? (
                <p className="text-xs text-muted-foreground">Queue empty</p>
              ) : null}
              {live.map((item, index) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border px-2.5 py-2"
                  data-testid={`queue-item-${item.id}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">
                        #{index + 1} · {item.status}
                        {item.channelTaskId ? " · delegated" : ""}
                      </p>
                    </div>
                    <Button
                      size="xs"
                      variant="ghost"
                      onClick={() =>
                        dispatch({ type: "CANCEL_ITEM", itemId: item.id })
                      }
                    >
                      Cancel
                    </Button>
                  </div>
                  {item.status === "running" ? (
                    <div className="mt-2 space-y-1">
                      <Progress value={Math.round(item.progress * 100)} />
                      <p className="text-xs tabular-nums text-muted-foreground">
                        {Math.round(item.progress * 100)}%
                      </p>
                    </div>
                  ) : null}
                </div>
              ))}
              {recent.map((item) => (
                <p key={item.id} className="text-xs text-muted-foreground">
                  {item.status}: {item.title}
                </p>
              ))}
            </CardContent>
          </Card>
        )
      })}
    </section>
  )
}
