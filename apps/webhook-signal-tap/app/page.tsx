"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { SAMPLES } from "@/lib/samples";
import type { TapEvent } from "@/lib/store";

type TapConfig = {
  conversationHookPath: string;
  applicationHookPath: string;
  conversationSecret: string;
  applicationKey: string;
  applicationSecret: string;
  usingDemoDefaults: boolean;
};

const CATEGORY_STYLES: Record<string, string> = {
  "Delivery receipt": "bg-sky-500/15 text-sky-400 border-sky-500/30",
  "Inbound message": "bg-violet-500/15 text-violet-400 border-violet-500/30",
  Verification: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  Voice: "bg-orange-500/15 text-orange-400 border-orange-500/30",
  Contact: "bg-pink-500/15 text-pink-400 border-pink-500/30",
  Other: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const VERDICT_STYLES: Record<string, string> = {
  verified: "bg-green-500/15 text-green-400 border-green-500/30",
  failed: "bg-red-500/15 text-red-400 border-red-500/30",
  unsigned: "bg-zinc-500/15 text-zinc-400 border-zinc-500/30",
};

const VERDICT_ICONS: Record<string, string> = {
  verified: "✓",
  failed: "✕",
  unsigned: "–",
};

export default function Home() {
  const [events, setEvents] = useState<TapEvent[]>([]);
  const [config, setConfig] = useState<TapConfig | null>(null);
  const [tamper, setTamper] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [origin, setOrigin] = useState("");

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/events");
      const data = await r.json();
      setEvents(data.events ?? []);
    } catch {
      // dev server restarting; keep last state
    }
  }, []);

  useEffect(() => {
    const boot = setTimeout(() => {
      setOrigin(window.location.origin);
      fetch("/api/config")
        .then((r) => r.json())
        .then(setConfig)
        .catch(() => {});
      refresh();
    }, 0);
    const poll = setInterval(refresh, 2000);
    return () => {
      clearTimeout(boot);
      clearInterval(poll);
    };
  }, [refresh]);

  const simulate = async (sampleId: string) => {
    setSending(sampleId);
    try {
      await fetch("/api/simulate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ sampleId, tamper }),
      });
      await refresh();
    } finally {
      setSending(null);
    }
  };

  const clearAll = async () => {
    await fetch("/api/events", { method: "DELETE" });
    await refresh();
  };

  const stats = useMemo(() => {
    const s = { verified: 0, failed: 0, unsigned: 0 };
    for (const e of events) s[e.verdict]++;
    return s;
  }, [events]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <header className="border-b border-zinc-800 bg-zinc-900/60 backdrop-blur sticky top-0 z-10">
        <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-emerald-400 to-sky-500 flex items-center justify-center font-bold text-zinc-950">
              ⌁
            </div>
            <div>
              <h1 className="text-lg font-semibold leading-tight">Webhook Signal Tap</h1>
              <p className="text-xs text-zinc-400">
                Sinch callback receiver &amp; debugger — HMAC + application-signed verification
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="rounded-full border border-green-500/30 bg-green-500/10 px-2 py-1 text-green-400">
              {stats.verified} verified
            </span>
            <span className="rounded-full border border-red-500/30 bg-red-500/10 px-2 py-1 text-red-400">
              {stats.failed} failed
            </span>
            <span className="rounded-full border border-zinc-500/30 bg-zinc-500/10 px-2 py-1 text-zinc-400">
              {stats.unsigned} unsigned
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-6 grid gap-6 lg:grid-cols-[380px_1fr]">
        <div className="space-y-6">
          <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base">Event simulator</CardTitle>
                <Badge className="border-amber-500/40 bg-amber-500/15 text-amber-400">
                  SAMPLES — not live traffic
                </Badge>
              </div>
              <CardDescription className="text-zinc-400">
                Sample payloads from Sinch docs, signed with the configured secrets and
                delivered to this app&apos;s receivers over real HTTP.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="flex items-center gap-2 text-sm text-zinc-300 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={tamper}
                  onChange={(e) => setTamper(e.target.checked)}
                  className="accent-red-500"
                />
                Tamper mode — sign with a wrong secret (should be flagged{" "}
                <span className="text-red-400 font-medium">failed</span>)
              </label>
              <div className="grid gap-2">
                {SAMPLES.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => simulate(s.id)}
                    disabled={sending !== null}
                    className="group rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-left hover:border-zinc-600 hover:bg-zinc-800/80 transition disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {sending === s.id ? "Sending…" : s.label}
                      </span>
                      <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                        {s.endpoint === "conversation" ? "HMAC" : "App-signed"}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500">{s.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100">
            <CardHeader>
              <CardTitle className="text-base">Receiver endpoints</CardTitle>
              <CardDescription className="text-zinc-400">
                Point real Sinch webhooks here (via a tunnel for public reachability).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-xs">
              <Endpoint
                label="Conversation API (SMS delivery receipts, inbound messages)"
                url={`${origin}${config?.conversationHookPath ?? "/api/hooks/conversation"}`}
              />
              <Endpoint
                label="Verification / Voice (application-signed callbacks)"
                url={`${origin}${config?.applicationHookPath ?? "/api/hooks/application"}`}
              />
              {config && (
                <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-3 space-y-1 font-mono text-[11px] text-zinc-400">
                  <div className="font-sans text-zinc-300 mb-1">
                    Verification secrets{" "}
                    {config.usingDemoDefaults && (
                      <span className="text-amber-400">(demo defaults — set env vars for real traffic)</span>
                    )}
                  </div>
                  <div>CONVERSATION_WEBHOOK_SECRET={config.conversationSecret}</div>
                  <div>SINCH_APPLICATION_KEY={config.applicationKey}</div>
                  <div>SINCH_APPLICATION_SECRET={config.applicationSecret}</div>
                </div>
              )}
              <p className="text-zinc-500">
                Tunnel example:{" "}
                <code className="text-zinc-300">cloudflared tunnel --url http://localhost:3000</code>{" "}
                then use the public URL + path above in the Sinch dashboard.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-300">
              Timeline{" "}
              <span className="text-zinc-500 font-normal">
                — {events.length} event{events.length === 1 ? "" : "s"}, newest first
              </span>
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              disabled={events.length === 0}
              className="border-zinc-700 bg-transparent text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
            >
              Clear timeline
            </Button>
          </div>

          {events.length === 0 ? (
            <Card className="border-dashed border-zinc-800 bg-zinc-900/30 text-zinc-500">
              <CardContent className="py-16 text-center text-sm">
                No events captured yet. Fire a sample from the simulator, or point a real
                Sinch webhook at a receiver endpoint.
              </CardContent>
            </Card>
          ) : (
            events.map((e) => <EventCard key={e.id} event={e} onReplayed={refresh} />)
          )}
        </div>
      </main>
    </div>
  );
}

function Endpoint({ label, url }: { label: string; url: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="space-y-1">
      <div className="text-zinc-400">{label}</div>
      <div className="flex items-center gap-2">
        <code className="flex-1 truncate rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1.5 font-mono text-[11px] text-emerald-400">
          POST {url}
        </code>
        <Button
          variant="outline"
          size="sm"
          className="h-7 border-zinc-700 bg-transparent px-2 text-[11px] text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100"
          onClick={() => {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
        >
          {copied ? "Copied" : "Copy"}
        </Button>
      </div>
    </div>
  );
}

function EventCard({ event, onReplayed }: { event: TapEvent; onReplayed: () => void }) {
  const [open, setOpen] = useState(false);
  const [replayUrl, setReplayUrl] = useState("http://localhost:4000/webhook");
  const [replaying, setReplaying] = useState(false);

  const prettyBody = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(event.rawBody), null, 2);
    } catch {
      return event.rawBody;
    }
  }, [event.rawBody]);

  const replay = async () => {
    setReplaying(true);
    try {
      await fetch(`/api/events/${event.id}/replay`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ targetUrl: replayUrl }),
      });
      onReplayed();
    } finally {
      setReplaying(false);
    }
  };

  const lastReplay = event.replays[0];

  return (
    <Card className="border-zinc-800 bg-zinc-900/60 text-zinc-100 overflow-hidden py-0 gap-0">
      <button
        className="w-full px-4 py-3 text-left hover:bg-zinc-800/40 transition"
        onClick={() => setOpen(!open)}
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={`border ${VERDICT_STYLES[event.verdict]}`}>
            {VERDICT_ICONS[event.verdict]} {event.verdict}
          </Badge>
          <Badge className={`border ${CATEGORY_STYLES[event.category] ?? CATEGORY_STYLES.Other}`}>
            {event.category}
          </Badge>
          <span className="font-mono text-xs text-zinc-400">{event.eventType}</span>
          {event.simulated ? (
            <Badge className="border border-amber-500/40 bg-amber-500/15 text-amber-400">
              SIMULATED SAMPLE
            </Badge>
          ) : (
            <Badge className="border border-sky-500/40 bg-sky-500/15 text-sky-400">EXTERNAL</Badge>
          )}
          <span className="ml-auto text-xs text-zinc-500">
            {new Date(event.receivedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="mt-1.5 text-sm text-zinc-300">{event.summary}</div>
        <div className="mt-0.5 text-xs text-zinc-500">
          {event.endpoint === "conversation" ? "Conversation receiver" : "Application receiver"} ·{" "}
          {event.scheme} · {event.verdictDetail}
        </div>
      </button>

      {open && (
        <div className="border-t border-zinc-800 bg-zinc-950/60 px-4 py-3 space-y-3">
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Payload
            </div>
            <pre className="max-h-72 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] leading-relaxed text-emerald-300">
              {prettyBody}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Signature headers
            </div>
            <pre className="max-h-40 overflow-auto rounded-lg border border-zinc-800 bg-zinc-950 p-3 font-mono text-[11px] text-zinc-400">
              {Object.entries(event.headers)
                .filter(
                  ([k]) =>
                    k.startsWith("x-sinch") ||
                    k === "authorization" ||
                    k === "x-timestamp" ||
                    k === "content-type" ||
                    k.startsWith("x-signal-tap"),
                )
                .map(([k, v]) => `${k}: ${v}`)
                .join("\n") || "(none)"}
            </pre>
          </div>
          <div>
            <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-zinc-500">
              Replay to local handler
            </div>
            <div className="flex gap-2">
              <Input
                value={replayUrl}
                onChange={(e) => setReplayUrl(e.target.value)}
                placeholder="http://localhost:4000/webhook"
                className="h-8 border-zinc-700 bg-zinc-950 font-mono text-xs text-zinc-200"
              />
              <Button
                size="sm"
                onClick={replay}
                disabled={replaying}
                className="h-8 bg-emerald-500 text-zinc-950 hover:bg-emerald-400"
              >
                {replaying ? "Replaying…" : "Replay"}
              </Button>
            </div>
            {lastReplay && (
              <p className="mt-1.5 text-xs text-zinc-400">
                Last replay → {lastReplay.targetUrl}:{" "}
                {lastReplay.error ? (
                  <span className="text-red-400">{lastReplay.error}</span>
                ) : (
                  <span className="text-green-400">HTTP {lastReplay.status}</span>
                )}{" "}
                <span className="text-zinc-600">
                  ({new Date(lastReplay.at).toLocaleTimeString()})
                </span>
              </p>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}
