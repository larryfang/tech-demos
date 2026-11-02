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
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { estimateSegments } from "@/lib/segments";
import type { Campaign, ConfigState } from "@/lib/types";

const POLL_MS = 4000;

function statusVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (status === "Delivered") return "default";
  if (["Failed", "Rejected", "Expired", "Aborted", "Cancelled"].includes(status))
    return "destructive";
  if (status === "Dispatched") return "secondary";
  return "outline";
}

export default function Home() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [body, setBody] = useState("");
  const [recipients, setRecipients] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig(null));
  }, []);

  const refresh = useCallback(async () => {
    try {
      const r = await fetch("/api/campaigns?refresh=1");
      const data = await r.json();
      setCampaigns(data.campaigns ?? []);
    } catch {
      // transient network error; next poll retries
    }
  }, []);

  useEffect(() => {
    const kickoff = setTimeout(refresh, 0);
    const timer = setInterval(refresh, POLL_MS);
    return () => {
      clearTimeout(kickoff);
      clearInterval(timer);
    };
  }, [refresh]);

  const recipientList = useMemo(
    () =>
      [...new Set(recipients.split(/[\n,;]+/).map((r) => r.trim()).filter(Boolean))],
    [recipients],
  );
  const seg = useMemo(() => estimateSegments(body), [body]);

  async function send() {
    setSending(true);
    setError(null);
    try {
      const r = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, from, body, recipients: recipientList }),
      });
      const data = await r.json();
      if (!r.ok) {
        setError(data.error ?? `Request failed (${r.status})`);
        return;
      }
      setName("");
      setBody("");
      setRecipients("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">SMS Blast Console</h1>
          <p className="text-sm text-muted-foreground">
            Compose an SMS campaign, send one real batch via the Sinch SMS API, and
            watch delivery receipts arrive.
          </p>
        </div>
        {config &&
          (config.configured ? (
            <Badge>Live · {config.mode} · region {config.region}</Badge>
          ) : (
            <Badge variant="destructive">Credentials required</Badge>
          ))}
      </header>

      {config && !config.configured && (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardHeader>
            <CardTitle className="text-base">Sinch credentials required</CardTitle>
            <CardDescription>
              Sending is disabled until the server has credentials. Set{" "}
              {config.missing.map((v, i) => (
                <span key={v}>
                  {i > 0 && ", "}
                  <code className="rounded bg-muted px-1 font-mono text-xs">{v}</code>
                </span>
              ))}{" "}
              (or <code className="rounded bg-muted px-1 font-mono text-xs">SINCH_SERVICE_PLAN_ID</code> +{" "}
              <code className="rounded bg-muted px-1 font-mono text-xs">SINCH_API_TOKEN</code>) and
              restart. Nothing here is mocked — no credentials, no sends.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-[2fr_3fr]">
        <Card>
          <CardHeader>
            <CardTitle>Compose campaign</CardTitle>
            <CardDescription>One Sinch batch, one message, many recipients.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Campaign name</Label>
              <Input
                id="name"
                placeholder="November promo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="from">From (sender number or alpha ID)</Label>
              <Input
                id="from"
                placeholder={config?.defaultFrom ?? "+15551230000"}
                value={from}
                onChange={(e) => setFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="body">Message</Label>
              <Textarea
                id="body"
                rows={4}
                placeholder="Hi! Our demo launch is live — reply STOP to opt out."
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {seg.units} chars · {seg.encoding} · {seg.segments} segment
                {seg.segments === 1 ? "" : "s"} per recipient
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="recipients">Recipients (E.164, one per line)</Label>
              <Textarea
                id="recipients"
                rows={4}
                placeholder={"+15551234567\n+15557654321"}
                value={recipients}
                onChange={(e) => setRecipients(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                {recipientList.length} recipient{recipientList.length === 1 ? "" : "s"}
              </p>
            </div>
            {error && (
              <p className="rounded-md border border-destructive/50 bg-destructive/5 p-3 text-sm text-destructive">
                {error}
              </p>
            )}
            <Button className="w-full" onClick={send} disabled={sending}>
              {sending ? "Sending…" : "Send campaign"}
            </Button>
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-medium">Delivery dashboard</h2>
            <p className="text-xs text-muted-foreground">
              receipts polled every {POLL_MS / 1000}s
            </p>
          </div>
          {campaigns.length === 0 && (
            <Card>
              <CardContent className="py-10 text-center text-sm text-muted-foreground">
                No campaigns yet. Send one to see delivery receipts stream in.
              </CardContent>
            </Card>
          )}
          {campaigns.map((c) => {
            const delivered = c.recipients.filter((r) => r.status === "Delivered").length;
            return (
              <Card key={c.id}>
                <CardHeader>
                  <div className="flex items-center justify-between gap-2">
                    <CardTitle className="text-base">{c.name}</CardTitle>
                    <Badge variant={c.settled ? "default" : "secondary"}>
                      {c.settled ? "Settled" : "In flight"}
                    </Badge>
                  </div>
                  <CardDescription className="font-mono text-xs">
                    batch {c.batchId} · from {c.from || "(default originator)"} ·{" "}
                    {delivered}/{c.recipients.length} delivered
                  </CardDescription>
                  <p className="text-sm text-muted-foreground">“{c.body}”</p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Recipient</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Code</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {c.recipients.map((r) => (
                        <TableRow key={r.number}>
                          <TableCell className="font-mono text-xs">{r.number}</TableCell>
                          <TableCell>
                            <Badge variant={statusVariant(r.status)}>{r.status}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono text-xs">
                            {r.code ?? "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </main>
  );
}
