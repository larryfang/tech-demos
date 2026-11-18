import { useEffect, useMemo, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { agentById, activeChannelTask } from "@/engine/selectors"
import type { Action, Message, MessageKind, RoomState } from "@/engine/types"

const KIND_LABEL: Record<MessageKind, string> = {
  post: "posted",
  handoff: "handoff",
  direct: "direct",
  result: "result",
  system: "system",
}

function actorName(state: RoomState, id: string | undefined): string {
  if (!id) return "room"
  if (id === "user") return "You"
  return agentById(state, id)?.name ?? id
}

function MessageRow({
  state,
  message,
}: {
  state: RoomState
  message: Message
}) {
  const from = actorName(state, message.fromId)
  const to = message.toId ? actorName(state, message.toId) : null
  return (
    <li
      className="border-b border-border/70 py-2 last:border-b-0"
      data-testid={`message-${message.kind}`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={message.kind === "handoff" ? "default" : "outline"}>
          {KIND_LABEL[message.kind]}
        </Badge>
        <p className="text-xs text-muted-foreground">
          {from}
          {to ? ` → ${to}` : ""}
        </p>
      </div>
      <p className="mt-1 text-sm">{message.text}</p>
    </li>
  )
}

export function ChannelPanel({
  state,
  dispatch,
  liveConfigured,
}: {
  state: RoomState
  dispatch: (action: Action) => void
  liveConfigured: boolean
}) {
  const task = activeChannelTask(state)
  const owner = task ? agentById(state, task.ownerId) : undefined
  const [title, setTitle] = useState("Ship the v0.3 launch checklist")
  const [body, setBody] = useState(
    "We need one checklist the team can run before flipping the launch flag.",
  )
  const [ownerId, setOwnerId] = useState(state.agents[0]?.id ?? "")
  const [reassignId, setReassignId] = useState(task?.ownerId ?? ownerId)
  const selectedOwner = reassignId || task?.ownerId || ownerId
  const [fromId, setFromId] = useState(state.agents[1]?.id ?? state.agents[0]?.id ?? "")
  const [toId, setToId] = useState(state.agents[2]?.id ?? state.agents[0]?.id ?? "")
  const [directText, setDirectText] = useState("")
  const [livePrompt, setLivePrompt] = useState("")
  const [liveBusy, setLiveBusy] = useState(false)
  const [liveError, setLiveError] = useState<string | null>(null)
  const timelineRef = useRef<HTMLOListElement>(null)

  const timeline = useMemo(() => {
    const messages = task
      ? state.messages.filter((message) => message.channelTaskId === task.id || !message.channelTaskId)
      : state.messages
    return [...messages].sort((a, b) => a.createdAt - b.createdAt)
  }, [state.messages, task])

  useEffect(() => {
    const node = timelineRef.current
    if (!node) return
    node.scrollTop = node.scrollHeight
  }, [timeline.length])

  const postTask = () => {
    const trimmed = title.trim()
    if (!trimmed || !ownerId) return
    dispatch({
      type: "POST_CHANNEL_TASK",
      title: trimmed,
      body: body.trim(),
      ownerId,
    })
  }

  const sendDirect = () => {
    const trimmed = directText.trim()
    if (!trimmed || !fromId || !toId || fromId === toId) return
    dispatch({ type: "DIRECT_MESSAGE", fromId, toId, text: trimmed })
    setDirectText("")
  }

  const askLive = async () => {
    const prompt = livePrompt.trim()
    const agent = agentById(state, state.liveAgentId ?? ownerId)
    if (!prompt || !agent) return
    setLiveBusy(true)
    setLiveError(null)
    try {
      const response = await fetch("/api/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt,
          agentName: agent.name,
          instructions: agent.instructions,
        }),
      })
      const data = (await response.json()) as { text?: string; error?: string }
      if (!response.ok || !data.text) {
        setLiveError(data.error ?? "Live model request failed.")
        return
      }
      dispatch({ type: "LIVE_RESULT", agentId: agent.id, text: data.text })
      setLivePrompt("")
    } catch (error) {
      setLiveError(error instanceof Error ? error.message : "Live model request failed.")
    } finally {
      setLiveBusy(false)
    }
  }

  return (
    <section className="flex min-h-0 flex-col gap-3" data-testid="channel">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-sm font-medium">Shared channel</h2>
          <p className="text-xs text-muted-foreground">
            One owner. Delegates return. Direct messages stay on this timeline.
          </p>
        </div>
        {task ? (
          <Badge variant={task.status === "running" ? "default" : "outline"}>
            {task.status}
          </Badge>
        ) : null}
      </div>

      <Card size="sm" data-testid="channel-task">
        <CardHeader>
          <CardTitle>{task?.title ?? "No channel task yet"}</CardTitle>
          {owner ? (
            <p className="text-xs text-muted-foreground">
              Owner: {owner.name} · {owner.role}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Post a task or run the sample scenario.
            </p>
          )}
        </CardHeader>
        {task ? (
          <CardContent className="flex flex-wrap items-end gap-2">
            <div className="space-y-1">
              <Label htmlFor="reassign-owner">Reassign owner</Label>
              <select
                id="reassign-owner"
                className="h-8 rounded-lg border border-input bg-background px-2.5 text-sm"
                value={selectedOwner}
                onChange={(event) => setReassignId(event.target.value)}
              >
                {state.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <Button
              size="sm"
              variant="outline"
              data-testid="reassign-owner"
              onClick={() =>
                dispatch({
                  type: "REASSIGN_OWNER",
                  taskId: task.id,
                  ownerId: selectedOwner,
                })
              }
            >
              Reassign
            </Button>
            <Button
              size="sm"
              variant="outline"
              data-testid="stop-task"
              onClick={() => dispatch({ type: "STOP_TASK", taskId: task.id })}
            >
              Stop
            </Button>
            <Button
              size="sm"
              variant="ghost"
              data-testid="archive-task"
              onClick={() => dispatch({ type: "ARCHIVE_TASK", taskId: task.id })}
            >
              Archive
            </Button>
          </CardContent>
        ) : null}
      </Card>

      <Card size="sm" className="min-h-72 flex-1">
        <CardHeader>
          <CardTitle>Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <ol
            ref={timelineRef}
            className="max-h-[28rem] overflow-y-auto pr-1"
            data-testid="channel-timeline"
          >
            {timeline.length === 0 ? (
              <li className="text-sm text-muted-foreground">
                Empty. Run the sample to watch handoffs land here.
              </li>
            ) : (
              timeline.map((message) => (
                <MessageRow key={message.id} state={state} message={message} />
              ))
            )}
          </ol>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Post a task</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="task-title">Title</Label>
            <Input
              id="task-title"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-body">Brief</Label>
            <Textarea
              id="task-body"
              rows={3}
              value={body}
              onChange={(event) => setBody(event.target.value)}
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="task-owner">Owner</Label>
            <select
              id="task-owner"
              className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
              value={ownerId}
              onChange={(event) => setOwnerId(event.target.value)}
            >
              {state.agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} · {agent.role}
                </option>
              ))}
            </select>
          </div>
          <Button size="sm" onClick={postTask} data-testid="post-task">
            Assign owner and post
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Direct message</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label htmlFor="dm-from">From</Label>
              <select
                id="dm-from"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={fromId}
                onChange={(event) => setFromId(event.target.value)}
              >
                {state.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="dm-to">To</Label>
              <select
                id="dm-to"
                className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                value={toId}
                onChange={(event) => setToId(event.target.value)}
              >
                {state.agents.map((agent) => (
                  <option key={agent.id} value={agent.id}>
                    {agent.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <Input
            value={directText}
            placeholder="Agent-to-agent note"
            onChange={(event) => setDirectText(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") sendDirect()
            }}
          />
          <Button size="sm" variant="outline" onClick={sendDirect} data-testid="send-direct">
            Send in channel
          </Button>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardTitle>Live model</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {liveConfigured ? (
            <>
              <p className="text-xs text-muted-foreground">
                Optional. One agent can call `/api/complete` when
                OPENAI_API_KEY is set. The room still runs on fixtures without it.
              </p>
              <div className="space-y-1">
                <Label htmlFor="live-agent">Speaker</Label>
                <select
                  id="live-agent"
                  className="h-8 w-full rounded-lg border border-input bg-background px-2.5 text-sm"
                  value={state.liveAgentId ?? ownerId}
                  onChange={(event) =>
                    dispatch({ type: "SET_LIVE_AGENT", agentId: event.target.value })
                  }
                >
                  {state.agents.map((agent) => (
                    <option key={agent.id} value={agent.id}>
                      {agent.name}
                    </option>
                  ))}
                </select>
              </div>
              <Textarea
                rows={3}
                value={livePrompt}
                placeholder="Ask the selected agent"
                onChange={(event) => setLivePrompt(event.target.value)}
              />
              <Button size="sm" disabled={liveBusy} onClick={() => void askLive()}>
                {liveBusy ? "Calling model…" : "Ask live"}
              </Button>
              {liveError ? (
                <p className="text-xs text-destructive">{liveError}</p>
              ) : null}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Mock workers are on. Set OPENAI_API_KEY and restart `bun run dev`
              to let one agent call a real model.
            </p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
