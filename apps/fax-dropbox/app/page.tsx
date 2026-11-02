"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface Health {
  configured: boolean;
  missing: string[];
  from: string | null;
}

interface Fax {
  id: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILURE";
  to: string;
  from?: string;
  numberOfPages?: number;
  createTime?: string;
  errorMessage?: string;
}

/** A locally queued send attempt. `faxId` is set only once Sinch accepts it. */
interface OutboxItem {
  localId: string;
  fileName: string;
  fileSize: number;
  to: string;
  state: "BLOCKED_NO_CREDENTIALS" | "SENDING" | "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILURE" | "SEND_ERROR";
  faxId?: string;
  detail?: string;
  queuedAt: string;
}

const TEST_NUMBER = "+19898989898";

function formatBytes(n: number) {
  return n < 1024 * 1024 ? `${(n / 1024).toFixed(1)} KB` : `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function StatusBadge({ state }: { state: OutboxItem["state"] | Fax["status"] }) {
  const styles: Record<string, string> = {
    COMPLETED: "bg-green-100 text-green-800 border-green-200",
    FAILURE: "bg-red-100 text-red-800 border-red-200",
    SEND_ERROR: "bg-red-100 text-red-800 border-red-200",
    IN_PROGRESS: "bg-blue-100 text-blue-800 border-blue-200",
    QUEUED: "bg-amber-100 text-amber-800 border-amber-200",
    SENDING: "bg-amber-100 text-amber-800 border-amber-200",
    BLOCKED_NO_CREDENTIALS: "bg-zinc-100 text-zinc-600 border-zinc-200",
  };
  const labels: Record<string, string> = {
    BLOCKED_NO_CREDENTIALS: "NOT SENT — credentials required",
    SEND_ERROR: "SEND ERROR",
  };
  return (
    <Badge variant="outline" className={styles[state] ?? ""}>
      {labels[state] ?? state.replace(/_/g, " ")}
    </Badge>
  );
}

export default function Home() {
  const [health, setHealth] = useState<Health | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [to, setTo] = useState(TEST_NUMBER);
  const [dragOver, setDragOver] = useState(false);
  const [outbox, setOutbox] = useState<OutboxItem[]>([]);
  const [inbound, setInbound] = useState<Fax[] | null>(null);
  const [inboundError, setInboundError] = useState<string | null>(null);
  const [selectedInbound, setSelectedInbound] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/health")
      .then((r) => r.json())
      .then(setHealth)
      .catch(() => setHealth({ configured: false, missing: ["(health check failed)"], from: null }));
  }, []);

  // Poll Sinch for status of outbox items that have a real fax id and aren't terminal.
  useEffect(() => {
    const active = outbox.filter((o) => o.faxId && (o.state === "QUEUED" || o.state === "IN_PROGRESS"));
    if (active.length === 0) return;
    const timer = setInterval(async () => {
      for (const item of active) {
        try {
          const res = await fetch(`/api/faxes/${item.faxId}`);
          if (!res.ok) continue;
          const { fax } = (await res.json()) as { fax: Fax };
          setOutbox((prev) =>
            prev.map((o) =>
              o.localId === item.localId ? { ...o, state: fax.status, detail: fax.errorMessage } : o,
            ),
          );
        } catch {
          // transient network error; next tick retries
        }
      }
    }, 3000);
    return () => clearInterval(timer);
  }, [outbox]);

  const loadInbound = useCallback(async () => {
    setInboundError(null);
    try {
      const res = await fetch("/api/faxes?direction=INBOUND");
      const data = await res.json();
      if (!res.ok) {
        setInbound(null);
        setInboundError(
          data.error === "credentials_required"
            ? "Sinch credentials are required to list received faxes."
            : data.message ?? "Failed to load received faxes.",
        );
        return;
      }
      setInbound(data.faxes);
    } catch (err) {
      setInbound(null);
      setInboundError(String(err));
    }
  }, []);

  useEffect(() => {
    loadInbound();
  }, [loadInbound]);

  const acceptFile = useCallback(
    (f: File | undefined) => {
      if (!f) return;
      if (f.type !== "application/pdf") {
        alert("Only PDF files are supported.");
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(f);
      setPreviewUrl(URL.createObjectURL(f));
    },
    [previewUrl],
  );

  const send = useCallback(async () => {
    if (!file) return;
    const localId = crypto.randomUUID();
    const base: OutboxItem = {
      localId,
      fileName: file.name,
      fileSize: file.size,
      to,
      state: health?.configured ? "SENDING" : "BLOCKED_NO_CREDENTIALS",
      detail: health?.configured
        ? undefined
        : `Queued locally only. Set ${health?.missing.join(", ") ?? "SINCH_* env vars"} and restart to send for real.`,
      queuedAt: new Date().toLocaleTimeString(),
    };
    setOutbox((prev) => [base, ...prev]);
    if (!health?.configured) return;

    const form = new FormData();
    form.append("to", to);
    form.append("file", file);
    try {
      const res = await fetch("/api/faxes", { method: "POST", body: form });
      const data = await res.json();
      if (!res.ok) {
        setOutbox((prev) =>
          prev.map((o) => (o.localId === localId ? { ...o, state: "SEND_ERROR", detail: data.message } : o)),
        );
        return;
      }
      const fax = data.fax as Fax;
      setOutbox((prev) =>
        prev.map((o) => (o.localId === localId ? { ...o, state: fax.status, faxId: fax.id } : o)),
      );
    } catch (err) {
      setOutbox((prev) =>
        prev.map((o) => (o.localId === localId ? { ...o, state: "SEND_ERROR", detail: String(err) } : o)),
      );
    }
  }, [file, to, health]);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-6 py-8 space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sinch Fax Dropbox</h1>
          <p className="text-sm text-muted-foreground">
            Drop a PDF, fax it for real via the Sinch Fax API, track it, and browse received faxes.
          </p>
        </div>
        {health &&
          (health.configured ? (
            <Badge className="bg-green-100 text-green-800 border-green-200" variant="outline">
              Sinch connected
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-amber-100 text-amber-800 border-amber-200">
              Credentials required
            </Badge>
          ))}
      </header>

      {health && !health.configured && (
        <Card className="border-amber-300 bg-amber-50">
          <CardContent className="text-sm text-amber-900 space-y-1">
            <p className="font-medium">Running without Sinch credentials — nothing will actually be faxed.</p>
            <p>
              Set <code className="font-mono">{health.missing.join(", ")}</code> (and optionally{" "}
              <code className="font-mono">SINCH_FAX_FROM</code>) in the environment, then restart{" "}
              <code className="font-mono">bun run dev</code>. Upload, preview, and local queueing below still work;
              sends are blocked and clearly marked, never faked.
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>1 · Drop a PDF</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              role="button"
              tabIndex={0}
              aria-label="Drop a PDF here or click to browse"
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) => e.key === "Enter" && fileInputRef.current?.click()}
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                acceptFile(e.dataTransfer.files[0]);
              }}
              className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed text-sm transition-colors ${
                dragOver ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-muted-foreground/50"
              }`}
            >
              <span className="text-3xl">📠</span>
              <span className="mt-2 font-medium">{file ? file.name : "Drag & drop a PDF here"}</span>
              <span className="text-muted-foreground">
                {file ? formatBytes(file.size) : "or click to browse"}
              </span>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={(e) => acceptFile(e.target.files?.[0])}
            />

            <div className="space-y-2">
              <label htmlFor="to" className="text-sm font-medium">
                Destination fax number
              </label>
              <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="+19898989898" />
              <p className="text-xs text-muted-foreground">
                {TEST_NUMBER} is Sinch&apos;s test number — emulates a real fax without charges.
              </p>
            </div>

            <Button className="w-full" disabled={!file || !/^\+\d{6,15}$/.test(to)} onClick={send}>
              {health?.configured ? "Send fax via Sinch" : "Queue (blocked: credentials required)"}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>2 · Preview</CardTitle>
          </CardHeader>
          <CardContent>
            {previewUrl ? (
              <iframe title="PDF preview" src={previewUrl} className="h-80 w-full rounded-md border" />
            ) : (
              <div className="flex h-80 items-center justify-center rounded-md border border-dashed text-sm text-muted-foreground">
                PDF preview appears here
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="outbox">
        <TabsList>
          <TabsTrigger value="outbox">3 · Outbox ({outbox.length})</TabsTrigger>
          <TabsTrigger value="received" onClick={loadInbound}>
            4 · Received
          </TabsTrigger>
        </TabsList>

        <TabsContent value="outbox">
          <Card>
            <CardContent className="pt-6">
              {outbox.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nothing queued yet. Drop a PDF and hit send.</p>
              ) : (
                <ul className="divide-y">
                  {outbox.map((o) => (
                    <li key={o.localId} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                      <span className="font-medium">{o.fileName}</span>
                      <span className="text-muted-foreground">{formatBytes(o.fileSize)}</span>
                      <span className="text-muted-foreground">→ {o.to}</span>
                      <span className="text-muted-foreground">{o.queuedAt}</span>
                      <StatusBadge state={o.state} />
                      {o.faxId && <span className="font-mono text-xs text-muted-foreground">sinch id: {o.faxId}</span>}
                      {o.detail && <span className="w-full text-xs text-muted-foreground">{o.detail}</span>}
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="received">
          <Card>
            <CardContent className="pt-6 space-y-4">
              {inboundError && <p className="text-sm text-amber-700">{inboundError}</p>}
              {inbound && inbound.length === 0 && (
                <p className="text-sm text-muted-foreground">No inbound faxes on this Sinch project yet.</p>
              )}
              {inbound && inbound.length > 0 && (
                <ul className="divide-y">
                  {inbound.map((f) => (
                    <li key={f.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-3 text-sm">
                      <span className="font-mono text-xs">{f.id}</span>
                      <span className="text-muted-foreground">from {f.from ?? "unknown"}</span>
                      {f.numberOfPages != null && (
                        <span className="text-muted-foreground">{f.numberOfPages} page(s)</span>
                      )}
                      <StatusBadge state={f.status} />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInbound(selectedInbound === f.id ? null : f.id)}
                      >
                        {selectedInbound === f.id ? "Hide preview" : "Preview"}
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedInbound && (
                <iframe
                  title="Received fax preview"
                  src={`/api/faxes/${selectedInbound}/file`}
                  className="h-96 w-full rounded-md border"
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}
