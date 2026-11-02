"use client";

import * as React from "react";
import {
  ArrowDown,
  ArrowRight,
  ArrowUp,
  CheckCircle2,
  CircleAlert,
  Loader2,
  Radio,
  Send,
  XCircle,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { CHANNEL_META, SWITCHBOARD_CHANNELS, type SwitchboardChannel } from "@/lib/channels";

type ChannelRow = {
  channel: SwitchboardChannel;
  enabled: boolean;
  identity: string;
};

type CredentialStatus = {
  configured: boolean;
  region: string;
  vars: Record<string, boolean>;
};

type LogEntry = {
  time: string;
  kind: "info" | "success" | "error";
  text: string;
};

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 10;

function now() {
  return new Date().toLocaleTimeString("en-US", { hour12: false });
}

export function Switchboard() {
  const [status, setStatus] = React.useState<CredentialStatus | null>(null);
  const [text, setText] = React.useState("Hello from the Omni Switchboard!");
  const [rows, setRows] = React.useState<ChannelRow[]>(
    SWITCHBOARD_CHANNELS.map((channel, index) => ({
      channel,
      enabled: index === 0,
      identity: "",
    })),
  );
  const [sending, setSending] = React.useState(false);
  const [messageId, setMessageId] = React.useState<string | null>(null);
  const [messageRecord, setMessageRecord] = React.useState<object | null>(null);
  const [log, setLog] = React.useState<LogEntry[]>([]);
  const pollTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    fetch("/api/status")
      .then((response) => response.json())
      .then(setStatus)
      .catch(() => setStatus(null));
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
    };
  }, []);

  const appendLog = React.useCallback((kind: LogEntry["kind"], text: string) => {
    setLog((entries) => [{ time: now(), kind, text }, ...entries]);
  }, []);

  const enabledRows = rows.filter((row) => row.enabled);
  const chain = enabledRows.map((row) => row.channel);
  const readyToSend =
    text.trim().length > 0 &&
    enabledRows.length > 0 &&
    enabledRows.every((row) => row.identity.trim().length > 0);

  const requestPreview = {
    app_id: status?.configured ? "<SINCH_APP_ID>" : "<SINCH_APP_ID (missing)>",
    recipient: {
      identified_by: {
        channel_identities: enabledRows.map((row) => ({
          channel: row.channel,
          identity: row.identity.trim() || CHANNEL_META[row.channel].identityPlaceholder,
        })),
      },
    },
    message: { text_message: { text } },
    channel_priority_order: chain,
  };

  function toggleChannel(channel: SwitchboardChannel, enabled: boolean) {
    setRows((current) =>
      current.map((row) => (row.channel === channel ? { ...row, enabled } : row)),
    );
  }

  function setIdentity(channel: SwitchboardChannel, identity: string) {
    setRows((current) =>
      current.map((row) => (row.channel === channel ? { ...row, identity } : row)),
    );
  }

  function move(channel: SwitchboardChannel, direction: -1 | 1) {
    setRows((current) => {
      const index = current.findIndex((row) => row.channel === channel);
      const target = index + direction;
      if (target < 0 || target >= current.length) return current;
      const next = [...current];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });
  }

  function pollMessage(id: string, attempt: number) {
    if (attempt > POLL_MAX_ATTEMPTS) {
      appendLog(
        "info",
        "Stopped polling. Delivery receipts (DELIVERED/READ) arrive via webhooks, which need a public callback URL.",
      );
      return;
    }
    pollTimer.current = setTimeout(async () => {
      try {
        const response = await fetch(`/api/messages/${encodeURIComponent(id)}`);
        const body = await response.json();
        if (response.ok) {
          setMessageRecord(body.message);
          appendLog("success", `Poll #${attempt}: fetched message record from the API.`);
        } else {
          appendLog(
            "info",
            `Poll #${attempt}: ${body.error}${body.details ? ` (${body.details})` : ""}`,
          );
          pollMessage(id, attempt + 1);
        }
      } catch (error) {
        appendLog("error", `Poll #${attempt} failed: ${String(error)}`);
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleSend() {
    setSending(true);
    setMessageId(null);
    setMessageRecord(null);
    appendLog(
      "info",
      `POST /messages:send — chain [${chain.join(" → ")}] via Sinch Conversation API…`,
    );
    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          identities: enabledRows.map((row) => ({
            channel: row.channel,
            identity: row.identity,
          })),
        }),
      });
      const body = await response.json();
      if (response.ok) {
        setMessageId(body.messageId);
        appendLog(
          "success",
          `Accepted by Conversation API — message_id ${body.messageId}${body.acceptedTime ? ` at ${body.acceptedTime}` : ""}`,
        );
        pollMessage(body.messageId, 1);
      } else if (response.status === 503) {
        appendLog(
          "error",
          `Send blocked: ${body.error} Missing env vars: ${(body.missing ?? []).join(", ")}`,
        );
      } else {
        appendLog(
          "error",
          `Sinch API error: ${body.error}${body.details ? ` (${body.details})` : ""}`,
        );
      }
    } catch (error) {
      appendLog("error", `Request failed: ${String(error)}`);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-10">
      <header className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Radio className="size-6 text-primary" />
          <h1 className="text-2xl font-semibold tracking-tight">Omni Switchboard</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Compose one message, pick channels, order the fallback chain, and send it through
          the Sinch Conversation API.
        </p>
      </header>

      {status && !status.configured && (
        <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200 [&>svg]:text-amber-600">
          <CircleAlert />
          <AlertTitle>Credentials required</AlertTitle>
          <AlertDescription>
            Set the missing SINCH_* environment variables below and restart the dev server to
            enable real sends. Everything else — channel toggles, fallback-chain
            visualization, and the exact request preview — works without them.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Server credentials</CardTitle>
          <CardDescription>
            Read from environment variables on the server — never from the browser.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2">
          {status ? (
            <>
              {Object.entries(status.vars).map(([name, present]) => (
                <Badge key={name} variant={present ? "secondary" : "destructive"}>
                  {present ? <CheckCircle2 /> : <XCircle />}
                  {name}
                </Badge>
              ))}
              <Badge variant="outline">SINCH_REGION: {status.region}</Badge>
            </>
          ) : (
            <span className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Checking…
            </span>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Compose</CardTitle>
            <CardDescription>One message, delivered over the first channel that works.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="message-text">Message</Label>
              <Textarea
                id="message-text"
                value={text}
                onChange={(event) => setText(event.target.value)}
                rows={3}
              />
            </div>
            <Separator />
            <div className="flex flex-col gap-3">
              {rows.map((row, index) => {
                const meta = CHANNEL_META[row.channel];
                return (
                  <div
                    key={row.channel}
                    className="flex flex-col gap-2 rounded-lg border p-3 data-disabled:opacity-60"
                    data-disabled={row.enabled ? undefined : ""}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`size-2.5 rounded-full ${meta.hue}`} />
                      <span className="text-sm font-medium">{meta.label}</span>
                      <span className="text-xs text-muted-foreground">priority {index + 1}</span>
                      <div className="ml-auto flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Move ${meta.label} up`}
                          disabled={index === 0}
                          onClick={() => move(row.channel, -1)}
                        >
                          <ArrowUp />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Move ${meta.label} down`}
                          disabled={index === rows.length - 1}
                          onClick={() => move(row.channel, 1)}
                        >
                          <ArrowDown />
                        </Button>
                        <Switch
                          checked={row.enabled}
                          onCheckedChange={(checked) => toggleChannel(row.channel, checked)}
                          aria-label={`Toggle ${meta.label}`}
                        />
                      </div>
                    </div>
                    {row.enabled && (
                      <Input
                        value={row.identity}
                        onChange={(event) => setIdentity(row.channel, event.target.value)}
                        placeholder={meta.identityPlaceholder}
                        aria-label={`${meta.label} — ${meta.identityLabel}`}
                      />
                    )}
                  </div>
                );
              })}
            </div>
            <Button onClick={handleSend} disabled={!readyToSend || sending}>
              {sending ? <Loader2 className="animate-spin" /> : <Send />}
              Send via Conversation API
            </Button>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fallback chain</CardTitle>
              <CardDescription>
                channel_priority_order — the API tries each channel in order and falls back on
                failure (SWITCHING_CHANNEL).
              </CardDescription>
            </CardHeader>
            <CardContent>
              {chain.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Enable at least one channel to build the chain.
                </p>
              ) : (
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">message</Badge>
                  {chain.map((channel, index) => (
                    <React.Fragment key={channel}>
                      <ArrowRight className="size-4 text-muted-foreground" />
                      <span
                        className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-white ${CHANNEL_META[channel].hue}`}
                      >
                        {index + 1}. {CHANNEL_META[channel].label}
                      </span>
                      {index < chain.length - 1 && (
                        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                          fails?
                        </span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Request preview</CardTitle>
              <CardDescription>
                The exact body POSTed to /v1/projects/&#123;project&#125;/messages:send.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
                {JSON.stringify(requestPreview, null, 2)}
              </pre>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Message status</CardTitle>
          <CardDescription>
            Real API responses only. Accepted sends are polled via GET /messages/&#123;id&#125;;
            DELIVERED/READ receipts require a public webhook.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {messageId && (
            <div className="flex items-center gap-2 text-sm">
              <Badge variant="secondary">message_id</Badge>
              <code className="text-xs">{messageId}</code>
            </div>
          )}
          {messageRecord && (
            <pre className="max-h-64 overflow-auto rounded-lg bg-muted p-3 text-xs leading-relaxed">
              {JSON.stringify(messageRecord, null, 2)}
            </pre>
          )}
          {log.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No activity yet — send a message to see the live request log.
            </p>
          ) : (
            <ol className="flex flex-col gap-1.5">
              {log.map((entry, index) => (
                <li key={index} className="flex items-start gap-2 text-sm">
                  <span className="font-mono text-xs text-muted-foreground">{entry.time}</span>
                  {entry.kind === "success" && (
                    <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-emerald-600" />
                  )}
                  {entry.kind === "error" && (
                    <XCircle className="mt-0.5 size-3.5 shrink-0 text-red-600" />
                  )}
                  {entry.kind === "info" && (
                    <ArrowRight className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
                  )}
                  <span className={entry.kind === "error" ? "text-red-700 dark:text-red-400" : ""}>
                    {entry.text}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
