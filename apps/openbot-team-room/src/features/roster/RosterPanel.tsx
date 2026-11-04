import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { agentById } from "@/engine/selectors"
import type { Action, AgentStatus, RoomState } from "@/engine/types"

const STATUS_VARIANT: Record<
  AgentStatus,
  "outline" | "default" | "secondary" | "destructive"
> = {
  idle: "outline",
  working: "default",
  paused: "secondary",
  blocked: "destructive",
}

export function RosterPanel({
  state,
  dispatch,
}: {
  state: RoomState
  dispatch: (action: Action) => void
}) {
  return (
    <section className="flex flex-col gap-3" data-testid="roster">
      <div>
        <h2 className="text-sm font-medium">Roster</h2>
        <p className="text-xs text-muted-foreground">
          Four fixtures. Edit name, role, or instructions.
        </p>
      </div>
      {state.agents.map((agent) => (
        <Card key={agent.id} size="sm" data-testid={`agent-${agent.id}`}>
          <CardHeader className="flex flex-row items-start justify-between gap-2">
            <div>
              <CardTitle>{agent.name}</CardTitle>
              <p className="text-xs text-muted-foreground">{agent.role}</p>
            </div>
            <Badge
              variant={STATUS_VARIANT[agent.status]}
              data-testid={`agent-status-${agent.id}`}
            >
              {agent.status}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label htmlFor={`${agent.id}-name`}>Name</Label>
                <Input
                  id={`${agent.id}-name`}
                  value={agent.name}
                  onChange={(event) =>
                    dispatch({
                      type: "UPDATE_AGENT",
                      agentId: agent.id,
                      patch: { name: event.target.value },
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`${agent.id}-role`}>Role</Label>
                <Input
                  id={`${agent.id}-role`}
                  value={agent.role}
                  onChange={(event) =>
                    dispatch({
                      type: "UPDATE_AGENT",
                      agentId: agent.id,
                      patch: { role: event.target.value },
                    })
                  }
                />
              </div>
            </div>
            <div className="space-y-1">
              <Label htmlFor={`${agent.id}-instructions`}>Instructions</Label>
              <Textarea
                id={`${agent.id}-instructions`}
                value={agent.instructions}
                rows={3}
                onChange={(event) =>
                  dispatch({
                    type: "UPDATE_AGENT",
                    agentId: agent.id,
                    patch: { instructions: event.target.value },
                  })
                }
              />
            </div>
            <div className="flex gap-2">
              {agent.status === "paused" ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    dispatch({ type: "RESUME_AGENT", agentId: agent.id })
                  }
                >
                  Resume
                </Button>
              ) : (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    dispatch({ type: "PAUSE_AGENT", agentId: agent.id })
                  }
                >
                  Pause
                </Button>
              )}
              {agentById(state, agent.id)?.status === "blocked" ? (
                <p className="self-center text-xs text-muted-foreground">
                  Waiting on a handback
                </p>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </section>
  )
}
