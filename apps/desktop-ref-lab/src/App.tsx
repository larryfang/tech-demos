import { useEffect, useMemo, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { TreeView } from "@/components/TreeView"
import { diffSummary, diffTrees, displayTree } from "@/engine/diff"
import { parseRef } from "@/engine/refs"
import { act, demonstrateStaleRef, resetSession, resnapshot, startSession } from "@/engine/replay"
import { findByElementId, findByRef } from "@/engine/tree"
import type { Envelope, HistoryEntry, ReplaySession } from "@/engine/types"
import { APPS, appById } from "@/fixtures"
import {
  fetchLiveApps,
  fetchLiveStatus,
  liveClick,
  liveSnapshot,
  liveType,
  snapshotFrom,
  type LiveStatus,
} from "@/live/client"
import { cn } from "@/lib/utils"

type Mode = "replay" | "live"

function errorCode(envelope: Envelope | undefined): string | undefined {
  if (!envelope || envelope.ok) return undefined
  return envelope.error.code
}

function selectedMeta(sessionTree: ReplaySession["snapshot"]["data"]["tree"] | undefined, ref?: string) {
  if (!sessionTree || !ref) return undefined
  return findByRef(sessionTree, ref)
}

export default function App() {
  const [appId, setAppId] = useState(APPS[0]?.id ?? "calculator")
  const [session, setSession] = useState<ReplaySession>(() => startSession(appId))
  const [mode, setMode] = useState<Mode>("replay")
  const [liveStatus, setLiveStatus] = useState<LiveStatus>({ available: false, reason: "unknown" })
  const [liveApps, setLiveApps] = useState<string[]>([])
  const [liveApp, setLiveApp] = useState<string>("")
  const [liveNotice, setLiveNotice] = useState<string>("")
  const [busy, setBusy] = useState(false)
  const [selectedRef, setSelectedRef] = useState<string | undefined>()
  const [previousRef, setPreviousRef] = useState<string | undefined>()
  const [typeText, setTypeText] = useState("Sprint retro")
  const [inspected, setInspected] = useState<Envelope | undefined>()
  const [liveHistory, setLiveHistory] = useState<HistoryEntry[]>([])
  const [liveSnapshotState, setLiveSnapshotState] = useState<ReplaySession["snapshot"] | undefined>()
  const [livePrevious, setLivePrevious] = useState<ReplaySession["snapshot"] | undefined>()
  const [liveDiff, setLiveDiff] = useState<ReplaySession["lastDiff"]>()
  const [liveLast, setLiveLast] = useState<Envelope | undefined>()

  useEffect(() => {
    let cancelled = false
    fetchLiveStatus().then((status) => {
      if (!cancelled) setLiveStatus(status)
    })
    return () => {
      cancelled = true
    }
  }, [])

  const fixture = appById(appId)
  const snapshot = mode === "replay" ? session.snapshot : liveSnapshotState
  const previous = mode === "replay" ? session.previous : livePrevious
  const diff = mode === "replay" ? session.lastDiff : liveDiff
  const lastResult = mode === "replay" ? session.lastResult : liveLast
  const history = mode === "replay" ? session.history : liveHistory
  const inspectedEnvelope = inspected ?? lastResult
  const tree = snapshot?.data.tree
  const display = useMemo(() => {
    if (!tree) return undefined
    return displayTree(previous?.data.tree, tree, diff)
  }, [tree, previous, diff])

  const selectedNode = selectedMeta(tree, selectedRef)
  const parsedSelected = selectedRef ? parseRef(selectedRef) : undefined
  const canClick = Boolean(selectedNode?.available_actions?.includes("Click"))
  const canType = Boolean(
    selectedNode?.available_actions?.some((action) => action === "Type" || action === "SetValue"),
  )

  function inspect(envelope: Envelope) {
    setInspected(envelope)
  }

  function applyReplay(next: ReplaySession, actedRef?: string) {
    setSession(next)
    setInspected(next.lastResult)
    if (actedRef) {
      setPreviousRef(actedRef)
      const parsed = parseRef(actedRef)
      if (parsed.ok) {
        const updated = findByElementId(next.snapshot.data.tree, parsed.elementId)?.ref_id
        setSelectedRef(updated)
      }
    }
  }

  function onPickApp(id: string) {
    setAppId(id)
    const next = resetSession(id)
    setSession(next)
    setSelectedRef(undefined)
    setPreviousRef(undefined)
    setInspected(next.lastResult)
    const sample = appById(id)
    if (sample?.id === "notes") setTypeText("Sprint retro")
    else setTypeText("hello")
  }

  async function switchMode(next: Mode) {
    if (next === "live") {
      const status = await fetchLiveStatus()
      setLiveStatus(status)
      if (!status.available) {
        setLiveNotice(status.message ?? "agent-desktop is not installed. Staying in Replay.")
        setMode("replay")
        return
      }
      setLiveNotice("")
      setMode("live")
      setBusy(true)
      try {
        const { envelope, names } = await fetchLiveApps()
        setLiveApps(names)
        setLiveLast(envelope)
        setLiveHistory([
          {
            id: Date.now(),
            at: Date.now(),
            command: "list-apps",
            ok: envelope.ok,
            label: names.length ? `list-apps (${names.length})` : "list-apps",
            envelope,
          },
        ])
        setInspected(envelope)
        if (names[0]) {
          setLiveApp(names[0])
          await snapshotLive(names[0], true)
        }
      } finally {
        setBusy(false)
      }
      return
    }
    setLiveNotice("")
    setMode("replay")
  }

  async function snapshotLive(app: string, replaceHistory = false) {
    setBusy(true)
    try {
      const envelope = await liveSnapshot(app)
      const snap = snapshotFrom(envelope)
      setLiveLast(envelope)
      setInspected(envelope)
      const entry: HistoryEntry = {
        id: Date.now(),
        at: Date.now(),
        command: "snapshot",
        ok: envelope.ok,
        label: `snapshot ${app}`,
        envelope,
      }
      setLiveHistory((current) => (replaceHistory ? [entry] : [...current, entry]))
      if (snap) {
        setLivePrevious(liveSnapshotState)
        setLiveSnapshotState(snap)
        setLiveDiff(
          liveSnapshotState
            ? diffTrees(liveSnapshotState.data.tree, snap.data.tree)
            : undefined,
        )
        const parsed = previousRef ? parseRef(previousRef) : undefined
        if (parsed?.ok) {
          const updated = findByElementId(snap.data.tree, parsed.elementId)?.ref_id
          if (updated) setSelectedRef(updated)
        }
      }
    } finally {
      setBusy(false)
    }
  }

  async function liveAct(command: "click" | "type", ref: string, text = "") {
    setBusy(true)
    try {
      const envelope = command === "click" ? await liveClick(ref) : await liveType(ref, text)
      setPreviousRef(ref)
      setLiveLast(envelope)
      setInspected(envelope)
      setLiveHistory((current) => [
        ...current,
        {
          id: Date.now(),
          at: Date.now(),
          command,
          ok: envelope.ok,
          label: envelope.ok ? `${command} ${ref}` : `${command} ${ref} → ${errorCode(envelope)}`,
          envelope,
        },
      ])
      if (envelope.ok && liveApp) {
        await snapshotLive(liveApp)
      }
    } finally {
      setBusy(false)
    }
  }

  function onClickRef() {
    if (!selectedRef) return
    if (mode === "replay") applyReplay(act(session, "click", selectedRef), selectedRef)
    else void liveAct("click", selectedRef)
  }

  function onTypeRef() {
    if (!selectedRef) return
    if (mode === "replay") applyReplay(act(session, "type", selectedRef, typeText), selectedRef)
    else void liveAct("type", selectedRef, typeText)
  }

  function onResnapshot() {
    if (mode === "replay") applyReplay(resnapshot(session))
    else if (liveApp) void snapshotLive(liveApp)
  }

  function onStaleDemo() {
    applyReplay(demonstrateStaleRef(session))
  }

  function onRetryPrevious() {
    if (!previousRef) return
    setSelectedRef(previousRef)
    if (mode === "replay") applyReplay(act(session, "click", previousRef), previousRef)
    else void liveAct("click", previousRef)
  }

  const code = errorCode(inspectedEnvelope)

  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background">
      <header className="flex shrink-0 flex-wrap items-center gap-3 border-b px-4 py-3">
        <div className="min-w-0">
          <p className="text-[11px] tracking-wide text-muted-foreground uppercase">Desktop Ref Lab</p>
          <h1 className="text-base font-medium">snapshot → act on a ref → re-snapshot</h1>
        </div>
        <div className="ml-auto flex flex-wrap items-center gap-2">
          <div className="flex rounded-lg border p-0.5">
            <Button
              size="sm"
              variant={mode === "replay" ? "default" : "ghost"}
              data-testid="mode-replay"
              onClick={() => void switchMode("replay")}
            >
              Replay
            </Button>
            <Button
              size="sm"
              variant={mode === "live" ? "default" : "ghost"}
              data-testid="mode-live"
              onClick={() => void switchMode("live")}
            >
              Live
            </Button>
          </div>
          {mode === "replay" ? (
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              value={appId}
              data-testid="app-select"
              onChange={(event) => onPickApp(event.target.value)}
            >
              {APPS.map((app) => (
                <option key={app.id} value={app.id}>
                  {app.name}
                </option>
              ))}
            </select>
          ) : (
            <select
              className="h-8 rounded-lg border border-input bg-background px-2 text-sm"
              value={liveApp}
              disabled={!liveApps.length}
              onChange={(event) => {
                setLiveApp(event.target.value)
                void snapshotLive(event.target.value)
              }}
            >
              {liveApps.length ? (
                liveApps.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))
              ) : (
                <option value="">No live apps</option>
              )}
            </select>
          )}
          <Badge variant={liveStatus.available ? "default" : "secondary"}>
            {liveStatus.available ? `CLI ${liveStatus.version ?? "ready"}` : "CLI not installed"}
          </Badge>
        </div>
      </header>

      {liveNotice ? (
        <div className="flex items-center gap-3 border-b bg-amber-500/10 px-4 py-2 text-sm text-amber-800 dark:text-amber-200">
          <span className="min-w-0 flex-1">{liveNotice}</span>
          <Button size="xs" variant="ghost" onClick={() => setLiveNotice("")}>
            Dismiss
          </Button>
        </div>
      ) : null}

      <p className="shrink-0 border-b px-4 py-2 text-sm text-muted-foreground">
        {mode === "replay"
          ? fixture?.hint
          : "Live shells out to agent-desktop. Refs still belong to the last snapshot; a STALE_REF means take another snapshot."}
      </p>

      <main className="grid min-h-0 flex-1 grid-cols-1 gap-0 overflow-hidden lg:grid-cols-[minmax(0,1.2fr)_minmax(20rem,0.8fr)]">
        <section className="flex min-h-0 flex-col overflow-hidden border-r">
          <div className="flex flex-wrap items-center gap-2 border-b px-4 py-2">
            <span className="text-sm font-medium">Accessibility tree</span>
            {snapshot ? (
              <Badge variant="outline" className="font-mono text-[11px]">
                {snapshot.data.snapshot_id} · {snapshot.data.ref_count} refs
              </Badge>
            ) : (
              <Badge variant="outline">no snapshot</Badge>
            )}
            {diff ? (
              <Badge variant="secondary" data-testid="diff-summary">
                diff {diffSummary(diff)}
              </Badge>
            ) : (
              <Badge variant="ghost">no diff yet</Badge>
            )}
            <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="rounded px-1.5 py-0.5 node-added">added</span>
              <span className="rounded px-1.5 py-0.5 node-removed">removed</span>
              <span className="rounded px-1.5 py-0.5 node-changed">changed</span>
            </span>
          </div>
          <ScrollArea className="min-h-0 flex-1">
            <div className="p-3">
              {display ? (
                <TreeView root={display} selectedRef={selectedRef} onSelect={setSelectedRef} />
              ) : (
                <p className="text-sm text-muted-foreground">No tree yet.</p>
              )}
            </div>
          </ScrollArea>
          <div className="shrink-0 space-y-2 border-t bg-background px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="text-muted-foreground">Selected</span>
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[12px]" data-testid="selected-ref">
                {selectedRef ?? "—"}
              </code>
              {selectedNode ? (
                <span>
                  {selectedNode.role}
                  {selectedNode.name ? ` “${selectedNode.name}”` : ""}
                </span>
              ) : null}
              {parsedSelected && !parsedSelected.ok ? (
                <Badge variant="destructive">{parsedSelected.reason}</Badge>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button size="sm" data-testid="action-click" disabled={!selectedRef || busy} onClick={onClickRef}>
                Click
              </Button>
              <Input
                className="h-8 w-44"
                value={typeText}
                data-testid="type-text"
                onChange={(event) => setTypeText(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") onTypeRef()
                }}
                placeholder="text to type"
              />
              <Button
                size="sm"
                variant="secondary"
                data-testid="action-type"
                disabled={!selectedRef || busy}
                onClick={onTypeRef}
              >
                Type
              </Button>
              <Button size="sm" variant="outline" disabled={busy || !snapshot} onClick={onResnapshot}>
                Re-snapshot
              </Button>
              {mode === "replay" ? (
                <Button size="sm" variant="outline" data-testid="action-stale" onClick={onStaleDemo}>
                  STALE_REF demo
                </Button>
              ) : null}
              <Button
                size="sm"
                variant="outline"
                disabled={!previousRef || busy}
                onClick={onRetryPrevious}
                data-testid="action-retry-prev"
              >
                Retry previous ref
              </Button>
              {mode === "replay" ? (
                <Button size="sm" variant="ghost" onClick={() => onPickApp(appId)}>
                  Reset
                </Button>
              ) : null}
              {!canClick && selectedNode ? (
                <span className="text-[11px] text-muted-foreground">no Click on this node</span>
              ) : null}
              {canType ? <span className="text-[11px] text-muted-foreground">Type supported</span> : null}
            </div>
          </div>
        </section>

        <section className="flex min-h-0 flex-col overflow-hidden">
          <Card className="rounded-none ring-0">
            <CardHeader className="border-b py-3">
              <CardTitle className="flex items-center gap-2 text-sm">
                Command JSON
                {code ? <Badge variant="destructive">{code}</Badge> : null}
                {inspectedEnvelope?.ok ? <Badge variant="outline">ok</Badge> : null}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <ScrollArea className="h-64">
                <pre
                  data-testid="json-panel"
                  className={cn(
                    "p-3 font-mono text-[11px] leading-5 whitespace-pre-wrap",
                    code && "text-destructive",
                  )}
                >
                  {inspectedEnvelope ? JSON.stringify(inspectedEnvelope, null, 2) : "—"}
                </pre>
              </ScrollArea>
            </CardContent>
          </Card>
          <div className="flex min-h-0 flex-1 flex-col border-t">
            <div className="px-4 py-2 text-sm font-medium">History</div>
            <ScrollArea className="flex-1">
              <ol className="space-y-1 px-3 pb-4" data-testid="history">
                {[...history].reverse().map((entry) => (
                  <li key={entry.id}>
                    <button
                      type="button"
                      className={cn(
                        "flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-[13px] hover:bg-muted",
                        inspectedEnvelope === entry.envelope && "bg-muted",
                      )}
                      onClick={() => inspect(entry.envelope)}
                    >
                      <span
                        className={cn(
                          "mt-1 size-1.5 shrink-0 rounded-full",
                          entry.ok ? "bg-emerald-500" : "bg-red-500",
                        )}
                      />
                      <span className="min-w-0 flex-1 font-mono text-[12px]">{entry.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </ScrollArea>
          </div>
        </section>
      </main>
    </div>
  )
}
