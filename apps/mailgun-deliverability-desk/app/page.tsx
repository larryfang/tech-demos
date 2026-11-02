"use client";

import { useCallback, useEffect, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

interface Status {
  configured: boolean;
  domain?: string;
  from?: string;
  baseUrl?: string;
  domainState?: string;
  domainType?: string;
  error?: string;
}

interface DeskEvent {
  event: string;
  timestamp: string | null;
  recipient: string | null;
  subject: string | null;
  detail: string | null;
}

interface EventsPayload {
  events: DeskEvent[];
  counters: Record<string, number>;
  windowHours: number;
  error?: string;
}

interface SuppressionItem {
  address?: string;
  created_at?: string;
  error?: string;
  code?: string;
  tag?: string;
}

interface SuppressionsPayload {
  bounces: SuppressionItem[];
  complaints: SuppressionItem[];
  unsubscribes: SuppressionItem[];
  error?: string;
}

const EVENT_STYLES: Record<string, string> = {
  accepted: "bg-sky-100 text-sky-800",
  delivered: "bg-emerald-100 text-emerald-800",
  opened: "bg-violet-100 text-violet-800",
  clicked: "bg-indigo-100 text-indigo-800",
  failed: "bg-red-100 text-red-800",
  complained: "bg-amber-100 text-amber-900",
  unsubscribed: "bg-zinc-200 text-zinc-800",
};

const COUNTER_ORDER = ["accepted", "delivered", "opened", "clicked", "failed", "complained"];

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [events, setEvents] = useState<EventsPayload | null>(null);
  const [suppressions, setSuppressions] = useState<SuppressionsPayload | null>(null);
  const [to, setTo] = useState("");
  const [subject, setSubject] = useState("Deliverability Desk test");
  const [text, setText] = useState(
    "Hello from the Mailgun Deliverability Desk demo. Open this email and click the tracked link to light up the dashboard.",
  );
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [lastPoll, setLastPoll] = useState<string | null>(null);

  const configured = status?.configured === true;

  const refresh = useCallback(async () => {
    const [eventsRes, suppRes] = await Promise.all([
      fetch("/api/events"),
      fetch("/api/suppressions"),
    ]);
    setEvents(await eventsRes.json());
    setSuppressions(await suppRes.json());
    setLastPoll(new Date().toLocaleTimeString());
  }, []);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus({ configured: false, error: "Status check failed" }));
  }, []);

  useEffect(() => {
    if (!configured) return;
    refresh();
    const timer = setInterval(refresh, 5000);
    return () => clearInterval(timer);
  }, [configured, refresh]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    setSending(true);
    setSendResult(null);
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to, subject, text }),
      });
      const data = await res.json();
      setSendResult(
        res.ok
          ? { ok: true, message: `${data.message} — Mailgun message id ${data.id}` }
          : { ok: false, message: data.error ?? `HTTP ${res.status}` },
      );
      if (res.ok) setTimeout(refresh, 1500);
    } catch (err) {
      setSendResult({ ok: false, message: err instanceof Error ? err.message : String(err) });
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6 md:p-10">
      <header className="space-y-1">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Mailgun Deliverability Desk</h1>
          {status === null ? (
            <Badge variant="outline">checking…</Badge>
          ) : configured ? (
            <Badge className="bg-emerald-100 text-emerald-800">
              connected · {status.domain} ({status.domainState})
            </Badge>
          ) : (
            <Badge className="bg-red-100 text-red-800">credentials required</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Send real email through the Mailgun API and watch opens, clicks, bounces and complaints
          stream in from the Mailgun analytics logs API.
        </p>
      </header>

      {status !== null && !configured && (
        <Alert>
          <AlertTitle>Mailgun credentials required</AlertTitle>
          <AlertDescription className="space-y-2">
            <p>
              This demo talks to the real Mailgun API and found no credentials in the environment.
              Nothing below is mocked — the send form and dashboard activate once you provide:
            </p>
            <pre className="rounded bg-muted p-3 text-xs leading-relaxed">
{`export MAILGUN_API_KEY=key-...        # Mailgun private API key
export MAILGUN_DOMAIN=mg.example.com  # verified sending domain (or sandbox domain)
# optional:
export MAILGUN_API_BASE_URL=https://api.eu.mailgun.net   # EU region accounts
export MAILGUN_FROM="Desk <postmaster@mg.example.com>"   # sender address`}
            </pre>
            <p>
              Then restart <code className="font-mono">bun run dev</code>. Sandbox domains only
              deliver to recipients you pre-authorize in the Mailgun dashboard.
            </p>
          </AlertDescription>
        </Alert>
      )}

      {configured && status?.error && (
        <Alert>
          <AlertTitle>Domain check warning</AlertTitle>
          <AlertDescription>{status.error}</AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Compose &amp; send</CardTitle>
            <CardDescription>
              Sends via <code className="font-mono text-xs">POST /v3/{"{domain}"}/messages</code>{" "}
              (mailgun.js) with open &amp; click tracking enabled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSend} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="to">To</Label>
                <Input
                  id="to"
                  type="email"
                  placeholder="recipient@example.com"
                  value={to}
                  onChange={(e) => setTo(e.target.value)}
                  disabled={!configured}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  disabled={!configured}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="body">Body</Label>
                <Textarea
                  id="body"
                  rows={6}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  disabled={!configured}
                  required
                />
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={!configured || sending}>
                  {sending ? "Sending…" : "Send tracked email"}
                </Button>
                {configured && status?.from && (
                  <span className="text-xs text-muted-foreground">from {status.from}</span>
                )}
              </div>
              {sendResult && (
                <p
                  className={`text-sm ${sendResult.ok ? "text-emerald-700" : "text-red-700"}`}
                  data-testid="send-result"
                >
                  {sendResult.message}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Deliverability dashboard</CardTitle>
            <CardDescription>
              Live from <code className="font-mono text-xs">POST /v1/analytics/logs</code>, last 24
              h, refreshed every 5 s{lastPoll ? ` · last poll ${lastPoll}` : ""}.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
              {COUNTER_ORDER.map((key) => (
                <div key={key} className="rounded-lg border p-2 text-center">
                  <div className="text-lg font-semibold tabular-nums">
                    {configured && events?.counters ? events.counters[key] ?? 0 : "—"}
                  </div>
                  <div className="text-[11px] uppercase tracking-wide text-muted-foreground">
                    {key}
                  </div>
                </div>
              ))}
            </div>

            <Tabs defaultValue="events">
              <TabsList>
                <TabsTrigger value="events">Events</TabsTrigger>
                <TabsTrigger value="suppressions">Suppressions</TabsTrigger>
              </TabsList>

              <TabsContent value="events">
                {!configured ? (
                  <EmptyState text="Waiting for credentials — the event feed queries the real Mailgun logs API." />
                ) : events?.error ? (
                  <EmptyState text={events.error} />
                ) : !events ? (
                  <EmptyState text="Loading events…" />
                ) : events.events.length === 0 ? (
                  <EmptyState text="No events in the last 24 hours. Send an email to generate some." />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Event</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Subject</TableHead>
                        <TableHead>Detail</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {events.events.map((ev, i) => (
                        <TableRow key={i}>
                          <TableCell>
                            <Badge className={EVENT_STYLES[ev.event] ?? "bg-zinc-100 text-zinc-800"}>
                              {ev.event}
                            </Badge>
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs">
                            {ev.timestamp ? new Date(ev.timestamp).toLocaleTimeString() : "—"}
                          </TableCell>
                          <TableCell className="text-xs">{ev.recipient ?? "—"}</TableCell>
                          <TableCell className="max-w-40 truncate text-xs">
                            {ev.subject ?? "—"}
                          </TableCell>
                          <TableCell className="max-w-56 truncate text-xs text-muted-foreground">
                            {ev.detail ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="suppressions">
                {!configured ? (
                  <EmptyState text="Waiting for credentials — suppressions come from /v3/{domain}/bounces, /complaints and /unsubscribes." />
                ) : suppressions?.error ? (
                  <EmptyState text={suppressions.error} />
                ) : !suppressions ? (
                  <EmptyState text="Loading suppressions…" />
                ) : (
                  <div className="space-y-4">
                    <SuppressionList title="Bounces" items={suppressions.bounces} />
                    <SuppressionList title="Complaints" items={suppressions.complaints} />
                    <SuppressionList title="Unsubscribes" items={suppressions.unsubscribes} />
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function SuppressionList({ title, items }: { title: string; items: SuppressionItem[] }) {
  return (
    <div>
      <h3 className="mb-1 text-sm font-medium">
        {title} <span className="text-muted-foreground">({items.length})</span>
      </h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">None — clean list.</p>
      ) : (
        <ul className="space-y-1">
          {items.map((item, i) => (
            <li key={i} className="text-xs">
              <span className="font-mono">{item.address}</span>
              {item.error ? ` — ${item.error}` : item.tag ? ` — ${item.tag}` : ""}
              {item.created_at ? ` · ${item.created_at}` : ""}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
