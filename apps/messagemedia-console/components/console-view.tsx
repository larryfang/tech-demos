"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { comparisonRows, messagemediaPayload, sinchBuildPayload } from "@/lib/comparison";
import type { DeliveryReport, MessageStatus, Reply } from "@/lib/messagemedia";
import type { previewSend } from "@/lib/preview";
import { isE164, segmentInfo } from "@/lib/sms";
import type { SentMessage } from "@/lib/store";

interface PublicConfig {
  configured: boolean;
  missing: string[];
  authMode: "basic" | "hmac";
  baseUrl: string;
  region: string;
  sourceNumber: string | null;
  apiKeyHint: string | null;
}

interface StatusPayload {
  config: PublicConfig;
  sent: SentMessage[];
  unmatchedReports: DeliveryReport[];
  replies: Reply[];
}

interface ApiError {
  error: string;
  message: string;
  status?: number;
  details?: string[];
  missing?: string[];
}

type Preview = ReturnType<typeof previewSend>;

const FAILED: MessageStatus[] = ["failed", "rejected", "undeliverable", "expired", "cancelled"];

function StatusBadge({ status }: { status: MessageStatus }) {
  if (status === "delivered") return <Badge className="bg-emerald-600 text-white">delivered</Badge>;
  if (FAILED.includes(status)) return <Badge variant="destructive">{status}</Badge>;
  return <Badge variant="secondary">{status}</Badge>;
}

function time(iso?: string) {
  return iso ? new Date(iso).toLocaleTimeString() : "—";
}

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { "Content-Type": "application/json" } });
  const json = await res.json();
  if (!res.ok) throw json as ApiError;
  return json as T;
}

function errorText(error: unknown) {
  const e = error as ApiError;
  if (e?.error === "messagemedia_error") return `MessageMedia ${e.status}: ${e.message}${e.details?.length ? ` — ${e.details.join("; ")}` : ""}`;
  return e?.message ?? String(error);
}

export function ConsoleView() {
  const [state, setState] = useState<StatusPayload | null>(null);
  const [to, setTo] = useState("+61491570156");
  const [content, setContent] = useState("Hi! Your table at Harbour Kitchen is confirmed for 7pm. Reply YES to keep it or NO to cancel.");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [autoCheck, setAutoCheck] = useState(false);

  const refresh = useCallback(async () => setState(await api<StatusPayload>("/api/status")), []);

  useEffect(() => {
    let active = true;
    api<StatusPayload>("/api/status").then((s) => active && setState(s));
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const id = setTimeout(async () => {
      setPreview(await api<Preview>("/api/preview", { method: "POST", body: JSON.stringify({ destination_number: to, content }) }));
    }, 250);
    return () => clearTimeout(id);
  }, [to, content]);

  const configured = state?.config.configured ?? false;
  const segments = useMemo(() => segmentInfo(content), [content]);
  const validTo = isE164(to);

  const run = useCallback(
    async (label: string, fn: () => Promise<string>) => {
      setBusy(label);
      setNotice(null);
      try {
        setNotice({ kind: "ok", text: await fn() });
      } catch (error) {
        setNotice({ kind: "error", text: errorText(error) });
      } finally {
        setBusy(null);
        await refresh();
      }
    },
    [refresh],
  );

  const send = () =>
    run("send", async () => {
      const sent = await api<SentMessage>("/api/messages", {
        method: "POST",
        body: JSON.stringify({ destination_number: to, content }),
      });
      return `Accepted by MessageMedia: ${sent.message.message_id} (${sent.message.status})`;
    });

  const checkReports = useCallback(
    () =>
      run("reports", async () => {
        const r = await api<{ received: number }>("/api/delivery-reports", { method: "POST" });
        return `GET /v1/delivery_reports returned ${r.received} report(s); confirmed ${r.received}.`;
      }),
    [run],
  );

  const checkReplies = useCallback(
    () =>
      run("replies", async () => {
        const r = await api<{ received: number }>("/api/replies", { method: "POST" });
        return `GET /v1/replies returned ${r.received} repl${r.received === 1 ? "y" : "ies"}; confirmed ${r.received}.`;
      }),
    [run],
  );

  const refreshStatus = (id: string) =>
    run(`status-${id}`, async () => {
      const r = await api<SentMessage>(`/api/messages/${id}`);
      return `GET /v1/messages/${id.slice(0, 8)}… → ${r.message.status}`;
    });

  useEffect(() => {
    if (!autoCheck || !configured) return;
    const id = setInterval(async () => {
      await checkReports();
      await checkReplies();
    }, 10_000);
    return () => clearInterval(id);
  }, [autoCheck, configured, checkReports, checkReplies]);

  const missing = state?.config.missing ?? ["MESSAGEMEDIA_API_KEY", "MESSAGEMEDIA_API_SECRET"];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">MessageMedia SMS Console</h1>
          <p className="text-sm text-muted-foreground">Sinch MessageMedia (Sinch Engage) Messages API — send, track delivery, read replies.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {state &&
            (configured ? (
              <Badge className="bg-emerald-600 text-white">Live · key {state.config.apiKeyHint}</Badge>
            ) : (
              <Badge variant="destructive">Credentials required</Badge>
            ))}
          {state && <Badge variant="outline">{state.config.authMode === "hmac" ? "HMAC-SHA256" : "Basic"} auth</Badge>}
          {state && (
            <Badge variant="outline">
              {state.config.region} · {state.config.baseUrl.replace("https://", "")}
            </Badge>
          )}
        </div>
      </header>

      {state && !configured && (
        <Card className="border-destructive/40 bg-destructive/5" data-testid="credentials-required">
          <CardHeader>
            <CardTitle>Credentials required</CardTitle>
            <CardDescription>
              Sending, status checks, delivery reports and replies all call the real MessageMedia API, so they stay disabled until the server has an API key and secret. Nothing on
              this page is simulated.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              Missing: {missing.map((m) => <code key={m} className="mr-2 rounded bg-muted px-1.5 py-0.5 font-mono text-xs">{m}</code>)}
            </p>
            <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-xs">{`# apps/messagemedia-console/.env.local
MESSAGEMEDIA_API_KEY=...
MESSAGEMEDIA_API_SECRET=...
# optional: basic (default) or hmac — must match the key type you created
MESSAGEMEDIA_AUTH_MODE=basic
# optional: EU accounts use https://eu.app.api.sinch.com
MESSAGEMEDIA_BASE_URL=https://api.messagemedia.com`}</pre>
          </CardContent>
        </Card>
      )}

      {notice && (
        <div
          role="status"
          className={`rounded-md border px-3 py-2 text-sm ${notice.kind === "ok" ? "border-emerald-600/40 bg-emerald-600/5" : "border-destructive/40 bg-destructive/5 text-destructive"}`}
        >
          {notice.text}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Compose SMS</CardTitle>
              <CardDescription>
                <code className="font-mono text-xs">POST /v1/messages</code> with <code className="font-mono text-xs">delivery_report: true</code>
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label htmlFor="to">To (E.164)</Label>
                <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} aria-invalid={!validTo} />
                {!validTo && <p className="text-xs text-destructive">Use international format, e.g. +61491570156</p>}
              </div>
              <div className="flex flex-col gap-2">
                <Label htmlFor="content">Message</Label>
                <Textarea id="content" rows={4} value={content} onChange={(e) => setContent(e.target.value)} />
                <p className="text-xs text-muted-foreground" data-testid="segments">
                  {segments.units} chars · {segments.encoding} · {segments.segments} segment{segments.segments === 1 ? "" : "s"} ({segments.perSegment}/segment)
                </p>
              </div>
              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-muted-foreground">
                  From: {state?.config.sourceNumber ?? "account default sender"}
                </p>
                <Button onClick={send} disabled={!configured || !validTo || !content.trim() || busy !== null}>
                  {!configured ? "Send (credentials required)" : busy === "send" ? "Sending…" : "Send SMS"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Request preview</CardTitle>
              <CardDescription>Built by the server from your input — not sent. Secret-derived values stay as placeholders.</CardDescription>
            </CardHeader>
            <CardContent>
              {preview && (
                <pre className="max-h-[28rem] overflow-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed break-all whitespace-pre-wrap" data-testid="request-preview">
                  {`${preview.method} ${preview.url}\n${Object.entries(preview.headers)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join("\n")}\n\n${JSON.stringify(preview.body, null, 2)}`}
                  {preview.signingString && `\n\n# HMAC signing string\n${preview.signingString}`}
                </pre>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Messages & replies</CardTitle>
            <CardDescription>Pull model: check, then confirm so MessageMedia stops returning the same items.</CardDescription>
            <CardAction>
              <div className="flex items-center gap-2 text-xs">
                <Switch id="auto" checked={autoCheck} onCheckedChange={setAutoCheck} disabled={!configured} />
                <Label htmlFor="auto" className="text-xs">
                  Auto-check every 10s
                </Label>
              </div>
            </CardAction>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="messages">
              <TabsList>
                <TabsTrigger value="messages">Sent messages ({state?.sent.length ?? 0})</TabsTrigger>
                <TabsTrigger value="replies">Inbound replies ({state?.replies.length ?? 0})</TabsTrigger>
              </TabsList>

              <TabsContent value="messages" className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-xs text-muted-foreground">GET /v1/delivery_reports → POST /v1/delivery_reports/confirmed</code>
                  <Button size="sm" variant="outline" onClick={checkReports} disabled={!configured || busy !== null}>
                    {busy === "reports" ? "Checking…" : "Check delivery reports"}
                  </Button>
                </div>
                {!state?.sent.length ? (
                  <EmptyState configured={configured} text="No messages sent this session." endpoint="POST /v1/messages" />
                ) : (
                  <div className="flex flex-col gap-3">
                    {state.sent.map((s) => (
                      <div key={s.message.message_id} className="rounded-md border p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={s.message.status} />
                            <span className="font-mono text-xs">{s.message.destination_number}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>sent {time(s.sentAt)}</span>
                            {s.statusCheckedAt && <span>· checked {time(s.statusCheckedAt)}</span>}
                            <Button size="xs" variant="ghost" onClick={() => refreshStatus(s.message.message_id)} disabled={busy !== null}>
                              Refresh status
                            </Button>
                          </div>
                        </div>
                        <p className="mt-2 text-sm">{s.message.content}</p>
                        <p className="mt-1 font-mono text-[11px] text-muted-foreground">message_id {s.message.message_id}</p>
                        {s.deliveryReports.length > 0 && (
                          <ol className="mt-2 space-y-1 border-l pl-3 text-xs">
                            {s.deliveryReports.map((r) => (
                              <li key={r.delivery_report_id} className="flex items-center gap-2">
                                <StatusBadge status={r.status} />
                                <span>{time(r.date_received)}</span>
                                {r.billing_units !== undefined && <span className="text-muted-foreground">· {r.billing_units} billing unit(s)</span>}
                              </li>
                            ))}
                          </ol>
                        )}
                      </div>
                    ))}
                  </div>
                )}
                {!!state?.unmatchedReports.length && (
                  <ReportsTable title="Reports for messages sent outside this session" reports={state.unmatchedReports} />
                )}
              </TabsContent>

              <TabsContent value="replies" className="flex flex-col gap-3 pt-2">
                <div className="flex items-center justify-between gap-2">
                  <code className="font-mono text-xs text-muted-foreground">GET /v1/replies → POST /v1/replies/confirmed</code>
                  <Button size="sm" variant="outline" onClick={checkReplies} disabled={!configured || busy !== null}>
                    {busy === "replies" ? "Checking…" : "Check replies"}
                  </Button>
                </div>
                {!state?.replies.length ? (
                  <EmptyState configured={configured} text="No replies received yet." endpoint="GET /v1/replies" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>From</TableHead>
                        <TableHead>Reply</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead>In reply to</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {state.replies.map((r) => (
                        <TableRow key={r.reply_id}>
                          <TableCell className="font-mono text-xs">{r.source_number}</TableCell>
                          <TableCell className="whitespace-normal">{r.content}</TableCell>
                          <TableCell className="text-xs">{time(r.date_received)}</TableCell>
                          <TableCell className="font-mono text-[11px]">{r.message_id ? `${r.message_id.slice(0, 8)}…` : "dedicated number"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>MessageMedia vs Sinch Build SMS API</CardTitle>
          <CardDescription>Same company, two different SMS APIs. Summarised from each API&apos;s public reference docs.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-36"></TableHead>
                <TableHead>MessageMedia / Sinch Engage</TableHead>
                <TableHead>Sinch Build SMS (XMS)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonRows.map((row) => (
                <TableRow key={row.topic}>
                  <TableCell className="align-top font-medium">{row.topic}</TableCell>
                  <TableCell className="align-top whitespace-normal">{row.messagemedia}</TableCell>
                  <TableCell className="align-top whitespace-normal">{row.sinchBuild}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="grid gap-4 md:grid-cols-2">
            <PayloadBlock title="MessageMedia send" code={messagemediaPayload} />
            <PayloadBlock title="Sinch Build send" code={sinchBuildPayload} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function EmptyState({ configured, text, endpoint }: { configured: boolean; text: string; endpoint: string }) {
  return (
    <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
      {configured ? text : <>Credentials required to call <code className="font-mono text-xs">{endpoint}</code>.</>}
    </div>
  );
}

function ReportsTable({ title, reports }: { title: string; reports: DeliveryReport[] }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium">{title}</p>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Status</TableHead>
            <TableHead>Message</TableHead>
            <TableHead>Received</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {reports.map((r) => (
            <TableRow key={r.delivery_report_id}>
              <TableCell>
                <StatusBadge status={r.status} />
              </TableCell>
              <TableCell className="whitespace-normal">{r.original_text ?? `${r.message_id.slice(0, 8)}…`}</TableCell>
              <TableCell className="text-xs">{time(r.date_received)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function PayloadBlock({ title, code }: { title: string; code: string }) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium">{title}</p>
      <pre className="overflow-x-auto rounded-md bg-muted p-3 font-mono text-[11px] leading-relaxed">{code}</pre>
    </div>
  );
}
