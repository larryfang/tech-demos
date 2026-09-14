"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DEFAULT_DRAFT_TASK, VOICES } from "@/lib/fixtures";
import { formatPhone } from "@/lib/phone";
import type { CallRecord, ConsoleSnapshot, SendCallResponse } from "@/lib/types";

const EMPTY_DRAFT = {
  phoneNumber: "+15550123456",
  task: DEFAULT_DRAFT_TASK,
  voice: "Maya",
  firstSentence: "Hi, I'm calling to make a dinner reservation.",
  waitForGreeting: true,
  live: false,
};

function formatWhen(iso?: string) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatUsd(amount: number) {
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(amount);
}

function statusTone(status: CallRecord["status"]) {
  if (status === "completed") return "default" as const;
  if (status === "failed" || status === "busy" || status === "canceled" || status === "no-answer") {
    return "destructive" as const;
  }
  return "secondary" as const;
}

export function ConsoleView({ initial }: { initial: ConsoleSnapshot }) {
  const [liveAvailable, setLiveAvailable] = useState(initial.liveAvailable);
  const [calls, setCalls] = useState(initial.calls);
  const [selectedId, setSelectedId] = useState(initial.calls[0]?.id ?? "");
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  const selected = useMemo(
    () => calls.find((call) => call.id === selectedId) ?? calls[0],
    [calls, selectedId],
  );

  useEffect(() => {
    if (!selected || selected.mode !== "live") return;
    if (selected.status !== "queued" && selected.status !== "started") return;
    let cancelled = false;
    const timer = window.setInterval(async () => {
      const response = await fetch(`/api/calls/${selected.id}`, { cache: "no-store" });
      const data = (await response.json()) as { call?: CallRecord; error?: string };
      if (cancelled || !data.call) return;
      setCalls((current) => current.map((call) => (call.id === data.call!.id ? data.call! : call)));
      if (data.call.status !== "queued" && data.call.status !== "started") {
        window.clearInterval(timer);
      }
    }, 2500);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [selected]);

  function upsert(call: CallRecord) {
    setCalls((current) => [call, ...current.filter((row) => row.id !== call.id)]);
    setSelectedId(call.id);
  }

  async function send() {
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      const response = await fetch("/api/calls", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      });
      const data = (await response.json()) as SendCallResponse;
      setLiveAvailable(data.liveAvailable);
      if (data.call) upsert(data.call);
      if (!data.ok || data.error) {
        setError(data.error ?? "Send failed.");
        return;
      }
      if (data.call?.mode === "dry-run") {
        setNotice("Dry-run complete — mock transcript and cost estimate. No Bland minutes were used.");
      }
    } catch {
      setError("Request failed. Is the dev server still running?");
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Dialbot Console</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Compose an outbound Bland voice call the way{" "}
            <a
              href="https://x.com/mattyp/status/2098155792327381294"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              Dialbot
            </a>{" "}
            does — number, task, optional voice. Dry-run is the default so this
            demo works with zero API keys.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={selected?.mode === "live" ? "default" : "secondary"}>
            {selected?.mode === "live" ? "Live" : "Dry-run"}
          </Badge>
          {liveAvailable ? (
            <Badge variant="outline">Live ready</Badge>
          ) : (
            <Badge variant="outline">No Bland key</Badge>
          )}
        </div>
      </header>

      {notice && (
        <p className="rounded-lg border bg-muted/50 px-3 py-2 text-sm">{notice}</p>
      )}
      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px_minmax(0,1.1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Compose call</CardTitle>
            <CardDescription>Outbound task for a Bland voice agent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="phone">To number</Label>
              <Input
                id="phone"
                inputMode="tel"
                placeholder="+15550123456"
                value={draft.phoneNumber}
                onChange={(event) =>
                  setDraft({ ...draft, phoneNumber: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="task">Task / prompt</Label>
              <Textarea
                id="task"
                className="min-h-36"
                value={draft.task}
                onChange={(event) => setDraft({ ...draft, task: event.target.value })}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="first">First sentence (optional)</Label>
              <Input
                id="first"
                value={draft.firstSentence}
                onChange={(event) =>
                  setDraft({ ...draft, firstSentence: event.target.value })
                }
              />
            </div>
            <div className="space-y-1.5">
              <Label>Voice</Label>
              <Select
                value={draft.voice}
                onValueChange={(value) => {
                  if (typeof value === "string") setDraft({ ...draft, voice: value });
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {VOICES.map((voice) => (
                    <SelectItem key={voice} value={voice}>
                      {voice}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={draft.waitForGreeting}
                onChange={(event) =>
                  setDraft({ ...draft, waitForGreeting: event.target.checked })
                }
              />
              Wait for greeting
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input
                type="checkbox"
                className="mt-0.5"
                checked={draft.live}
                disabled={!liveAvailable}
                onChange={(event) => setDraft({ ...draft, live: event.target.checked })}
              />
              <span>
                Place live Bland call
                <span className="mt-0.5 block text-xs text-muted-foreground">
                  {liveAvailable
                    ? "Uses BLAND_API_KEY and may incur cost."
                    : "Set BLAND_API_KEY to enable. Send stays dry-run."}
                </span>
              </span>
            </label>
            <Button className="w-full" onClick={() => void send()} disabled={sending}>
              {sending ? "Sending…" : draft.live ? "Send live call" : "Send dry-run"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Recent calls</CardTitle>
            <CardDescription>{calls.length} in this session</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {calls.map((call) => {
              const active = call.id === selected?.id;
              return (
                <Button
                  key={call.id}
                  variant={active ? "default" : "outline"}
                  className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                  onClick={() => setSelectedId(call.id)}
                >
                  <span className="font-medium">{formatPhone(call.phoneNumber)}</span>
                  <span className={`text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {call.mode === "dry-run" ? "Dry-run" : "Live"} · {call.status}
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <CardTitle>Call detail</CardTitle>
                <CardDescription>
                  {selected ? formatPhone(selected.phoneNumber) : "Select a call"}
                </CardDescription>
              </div>
              {selected && (
                <Badge variant={selected.mode === "dry-run" ? "secondary" : "default"}>
                  {selected.mode === "dry-run" ? "Dry-run" : "Live"}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selected ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={statusTone(selected.status)}>{selected.status}</Badge>
                  <Badge variant="outline">{selected.voice}</Badge>
                  <Badge variant="outline">
                    {selected.mode === "dry-run" ? "est. " : ""}
                    {formatUsd(selected.priceUsd)}
                    {selected.estimatedMinutes
                      ? ` · ${selected.estimatedMinutes} min`
                      : ""}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatWhen(selected.createdAt)}
                  {selected.completedAt ? ` → ${formatWhen(selected.completedAt)}` : ""}
                </p>
                {selected.summary && (
                  <p className="text-sm leading-relaxed">{selected.summary}</p>
                )}
                {selected.fallbackReason && (
                  <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
                    {selected.fallbackReason}
                  </p>
                )}
                <div className="space-y-2">
                  <p className="text-sm font-medium">Transcript</p>
                  {selected.transcripts.length ? (
                    <ol className="space-y-2">
                      {selected.transcripts.map((line, index) => (
                        <li key={`${selected.id}-${index}`} className="rounded-lg border px-3 py-2">
                          <p className="text-xs font-medium capitalize text-muted-foreground">
                            {line.user}
                          </p>
                          <p className="text-sm leading-relaxed">{line.text}</p>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {selected.status === "queued" || selected.status === "started"
                        ? "Waiting for Bland to finish the call…"
                        : "No transcript yet."}
                    </p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">No calls yet.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
