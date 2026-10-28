"use client";

import { useEffect, useMemo, useState } from "react";
import { LaneCard } from "@/components/lane-card";
import { ResultsPanel } from "@/components/results-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { HARNESSES, SAMPLE_TASKS } from "@/lib/catalog";
import type {
  CreateRunResponse,
  HarnessId,
  LaneView,
  RunMode,
  StatusResponse,
  StreamMessage,
  TaskId,
} from "@/lib/types";
import { applyEvent, emptyLane, isTerminalStatus } from "@/lib/uhp";

const DEFAULT_HARNESSES: HarnessId[] = ["codex", "claude-code", "hermes"];

export function Switchboard({ liveAvailable: initialLive }: { liveAvailable: boolean }) {
  const [liveAvailable, setLiveAvailable] = useState(initialLive);
  const [wantLive, setWantLive] = useState(false);
  const [taskId, setTaskId] = useState<TaskId | "custom">("slugify");
  const [prompt, setPrompt] = useState(SAMPLE_TASKS[0]?.prompt ?? "");
  const [selected, setSelected] = useState<HarnessId[]>(DEFAULT_HARNESSES);
  const [mode, setMode] = useState<RunMode>("fixture");
  const [runId, setRunId] = useState<string | null>(null);
  const [lanes, setLanes] = useState<LaneView[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/status", { cache: "no-store" })
      .then((response) => response.json() as Promise<StatusResponse>)
      .then((data) => setLiveAvailable(data.liveAvailable))
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!runId) return;
    const source = new EventSource(`/api/runs/${runId}/stream`);
    source.onmessage = (event) => {
      const message = JSON.parse(event.data) as StreamMessage;
      if (message.kind === "notice") {
        setNotice(message.message);
        return;
      }
      if (message.kind === "run.done") {
        source.close();
        setBusy(false);
        return;
      }
      setLanes((current) =>
        current.map((lane) =>
          lane.harnessId === message.harnessId ? applyEvent(lane, message.event) : lane,
        ),
      );
    };
    source.onerror = () => {
      source.close();
      setBusy(false);
    };
    return () => source.close();
  }, [runId]);

  const finished = lanes.length > 0 && lanes.every((lane) => isTerminalStatus(lane.status));

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  function toggleHarness(id: HarnessId) {
    setSelected((current) => {
      if (current.includes(id)) {
        if (current.length <= 2) return current;
        return current.filter((row) => row !== id);
      }
      if (current.length >= 3) return current;
      return [...current, id];
    });
  }

  function pickSample(id: TaskId) {
    const sample = SAMPLE_TASKS.find((task) => task.id === id);
    if (!sample) return;
    setTaskId(sample.id);
    setPrompt(sample.prompt);
  }

  async function dispatch() {
    setBusy(true);
    setError(null);
    setNotice(null);
    setLanes(selected.map((id) => emptyLane(id)));
    setRunId(null);
    try {
      const response = await fetch("/api/runs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskId,
          prompt,
          harnesses: selected,
          live: wantLive,
        }),
      });
      const data = (await response.json()) as CreateRunResponse;
      setLiveAvailable(data.liveAvailable);
      if (!data.ok || !data.runId) {
        setError(data.error ?? "Dispatch failed.");
        setBusy(false);
        return;
      }
      setMode(data.mode);
      if (data.fallbackReason) setNotice(data.fallbackReason);
      setLanes((data.harnesses ?? selected).map((id) => emptyLane(id)));
      setRunId(data.runId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Dispatch failed.");
      setBusy(false);
    }
  }

  async function cancel(harnessId: HarnessId) {
    if (!runId) return;
    await fetch(`/api/runs/${runId}/cancel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ harnessId }),
    });
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-8 sm:px-6">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-mono text-[11px] tracking-[0.22em] text-muted-foreground uppercase">
            Unified Harness Protocol
          </p>
          <h1 className="text-2xl font-semibold tracking-tight">Harness Switchboard</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Dispatch one coding task to Codex, Claude Code, and Hermes. Fixture streams replay by
            default. Inspired by HarnessRouter — not a fork.
          </p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge variant={mode === "live" ? "default" : "secondary"}>
            {mode === "live" ? "Live" : "Fixture"}
          </Badge>
          {liveAvailable ? (
            <Badge variant="outline">Live ready</Badge>
          ) : (
            <Badge variant="outline">No HARNESSROUTER_URL</Badge>
          )}
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Task</CardTitle>
          <CardDescription>
            Pick a sample or type your own, then select 2–3 harnesses.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {SAMPLE_TASKS.map((task) => (
              <Button
                key={task.id}
                size="sm"
                variant={taskId === task.id ? "default" : "outline"}
                onClick={() => pickSample(task.id)}
              >
                {task.title}
              </Button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {SAMPLE_TASKS.find((task) => task.id === taskId)?.hint ??
              "Custom prompt still replays the closest recorded UHP fixture."}
          </p>
          <div className="space-y-2">
            <Label htmlFor="prompt">Coding task</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(event) => {
                setPrompt(event.target.value);
                setTaskId("custom");
              }}
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label>Harnesses</Label>
            <div className="grid gap-2 sm:grid-cols-3">
              {HARNESSES.map((harness) => {
                const on = selectedSet.has(harness.id);
                return (
                  <button
                    key={harness.id}
                    type="button"
                    onClick={() => toggleHarness(harness.id)}
                    className={
                      on
                        ? "rounded-lg border border-foreground/40 bg-foreground text-background px-3 py-2 text-left"
                        : "rounded-lg border border-border bg-background px-3 py-2 text-left text-muted-foreground hover:bg-muted/50"
                    }
                  >
                    <p className={`text-sm font-medium ${on ? "text-background" : "text-foreground"}`}>
                      {harness.name}
                    </p>
                    <p className="mt-0.5 text-xs">{harness.blurb}</p>
                  </button>
                );
              })}
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="size-4 accent-foreground"
              checked={wantLive}
              disabled={!liveAvailable}
              onChange={(event) => setWantLive(event.target.checked)}
            />
            Use live HarnessRouter
            <span className="text-xs text-muted-foreground">
              {liveAvailable
                ? "POSTs /v1/responses on HARNESSROUTER_URL"
                : "off — set HARNESSROUTER_URL to enable"}
            </span>
          </label>
          <div className="flex flex-wrap items-center gap-3">
            <Button onClick={() => void dispatch()} disabled={busy || selected.length < 2}>
              {busy ? "Dispatching…" : "Dispatch"}
            </Button>
            <p className="text-xs text-muted-foreground">{selected.length} lanes</p>
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          {notice ? <p className="text-sm text-muted-foreground">{notice}</p> : null}
        </CardContent>
      </Card>

      {lanes.length > 0 ? (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between gap-3">
            <h2 className="text-sm font-medium tracking-wide uppercase">Lanes</h2>
            <p className="font-mono text-xs text-muted-foreground">
              {runId ?? "awaiting run id"}
            </p>
          </div>
          <div className="grid gap-3 lg:grid-cols-3">
            {lanes.map((lane) => (
              <LaneCard key={lane.harnessId} lane={lane} onCancel={(id) => void cancel(id)} />
            ))}
          </div>
        </section>
      ) : null}

      {finished ? <ResultsPanel key={runId ?? "results"} lanes={lanes} /> : null}
    </div>
  );
}
