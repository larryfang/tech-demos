"use client";

import { useMemo, useState } from "react";
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
import { Textarea } from "@/components/ui/textarea";
import type { AscCredentials, ConsoleSnapshot } from "@/lib/types";

const EMPTY_CREDS = { keyId: "", issuerId: "", privateKeyPath: "", privateKeyPem: "" };

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

function stateTone(state: string) {
  const value = state.toUpperCase();
  if (value.includes("SALE") || value === "VALID") return "default" as const;
  if (value.includes("REVIEW") || value === "PROCESSING") return "secondary" as const;
  if (value.includes("REJECT") || value === "INVALID") return "destructive" as const;
  return "outline" as const;
}

export function ConsoleView({ initial }: { initial: ConsoleSnapshot }) {
  const [snapshot, setSnapshot] = useState(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [creds, setCreds] = useState(EMPTY_CREDS);
  const [showKey, setShowKey] = useState(false);
  const [useLocalKey, setUseLocalKey] = useState(false);

  const selected = useMemo(
    () => snapshot.apps.find((app) => app.id === snapshot.selectedAppId),
    [snapshot],
  );

  async function load(appId?: string, liveCreds?: Partial<AscCredentials>) {
    setLoading(true);
    setError(null);
    try {
      const credentials =
        liveCreds && liveCreds.keyId?.trim()
          ? {
              keyId: liveCreds.keyId.trim(),
              issuerId: liveCreds.issuerId?.trim() || undefined,
              privateKeyPath: liveCreds.privateKeyPath?.trim() || undefined,
              privateKeyPem: liveCreds.privateKeyPem?.trim() || undefined,
            }
          : undefined;
      const response = await fetch("/api/console", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId, credentials }),
      });
      const data = (await response.json()) as ConsoleSnapshot & { error?: string };
      if (!response.ok) {
        setError(data.error ?? "Failed to load console.");
        return;
      }
      setSnapshot(data);
    } catch {
      setError("Request failed. Is the dev server still running?");
    } finally {
      setLoading(false);
    }
  }

  function pickApp(appId: string) {
    void load(appId, useLocalKey ? creds : undefined);
  }

  function tryLive() {
    if (!creds.keyId.trim() || (!creds.privateKeyPath.trim() && !creds.privateKeyPem.trim())) {
      setError("Live mode needs a Key ID and either a .p8 path or PEM.");
      return;
    }
    setUseLocalKey(true);
    void load(snapshot.selectedAppId, creds);
  }

  function useFixtures() {
    setUseLocalKey(false);
    void load(snapshot.selectedAppId);
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-4 py-10">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">ASC Ops</h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            Single-user console for{" "}
            <a
              href="https://github.com/rorkai/App-Store-Connect-CLI"
              className="underline underline-offset-4"
              target="_blank"
              rel="noreferrer"
            >
              App Store Connect CLI
            </a>
            . Pick an app to inspect TestFlight builds, tester feedback, and
            submission status.
          </p>
        </div>
        <Badge variant={snapshot.mode === "live" ? "default" : "secondary"}>
          {snapshot.mode === "live" ? "Live" : "Fixture"}
        </Badge>
      </header>

      {snapshot.fallbackReason && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          Live ASC failed — showing fixtures. {snapshot.fallbackReason}
        </p>
      )}

      {error && (
        <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Apps</CardTitle>
            <CardDescription>{snapshot.source}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            {snapshot.apps.map((app) => {
              const active = app.id === snapshot.selectedAppId;
              return (
                <Button
                  key={app.id}
                  variant={active ? "default" : "outline"}
                  className="h-auto w-full flex-col items-start gap-0.5 py-2 text-left whitespace-normal"
                  onClick={() => pickApp(app.id)}
                  disabled={loading}
                >
                  <span className="font-medium">{app.name}</span>
                  <span className={`text-xs ${active ? "opacity-80" : "text-muted-foreground"}`}>
                    {app.bundleId}
                  </span>
                </Button>
              );
            })}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-medium tracking-tight">
              {selected?.name ?? "Select an app"}
            </h2>
            {selected && (
              <p className="text-sm text-muted-foreground">
                {selected.bundleId}
                {selected.sku ? ` · SKU ${selected.sku}` : ""} · ID {selected.id}
              </p>
            )}
          </div>

          <Card>
            <CardHeader>
              <CardTitle>TestFlight builds</CardTitle>
              <CardDescription>{snapshot.builds.length} recent uploads</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.builds.length ? (
                snapshot.builds.map((build) => (
                  <div
                    key={build.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {build.version}{" "}
                        <span className="text-muted-foreground">({build.buildNumber})</span>
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Uploaded {formatWhen(build.uploadedDate)}
                      </p>
                    </div>
                    <Badge variant={stateTone(build.processingState)}>
                      {build.processingState}
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading builds…" : "No builds."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>TestFlight feedback</CardTitle>
              <CardDescription>{snapshot.feedback.length} recent snippets</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.feedback.length ? (
                snapshot.feedback.map((row) => (
                  <div key={row.id} className="space-y-1 rounded-lg border px-3 py-2">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <p className="text-sm font-medium">{row.tester}</p>
                      <p className="text-xs text-muted-foreground">{formatWhen(row.createdDate)}</p>
                    </div>
                    <p className="text-sm leading-relaxed">{row.comment}</p>
                    {(row.device || row.os) && (
                      <p className="text-xs text-muted-foreground">
                        {[row.device, row.os].filter(Boolean).join(" · ")}
                      </p>
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading feedback…" : "No TestFlight feedback."}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Submission status</CardTitle>
              <CardDescription>App Store versions from `asc versions list`</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {snapshot.submissions.length ? (
                snapshot.submissions.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2"
                  >
                    <div>
                      <p className="font-medium">
                        {row.version}{" "}
                        <span className="text-muted-foreground">{row.platform}</span>
                      </p>
                      <p className="text-xs text-muted-foreground">{formatWhen(row.createdDate)}</p>
                    </div>
                    <Badge variant={stateTone(row.state)}>{row.state}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">
                  {loading ? "Loading versions…" : "No App Store versions."}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Live ASC key</CardTitle>
          <CardDescription>
            Optional. Leave empty to stay in fixture mode. Same fields as{" "}
            <code className="text-xs">ASC_KEY_ID</code>,{" "}
            <code className="text-xs">ASC_ISSUER_ID</code>, and{" "}
            <code className="text-xs">ASC_PRIVATE_KEY_PATH</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button variant="outline" size="sm" onClick={() => setShowKey((open) => !open)}>
            {showKey ? "Hide key fields" : "Configure live key"}
          </Button>
          {showKey && (
            <div className="grid gap-3 md:grid-cols-2">
              <Input
                placeholder="Key ID"
                value={creds.keyId}
                onChange={(event) => setCreds({ ...creds, keyId: event.target.value })}
              />
              <Input
                placeholder="Issuer ID (team keys)"
                value={creds.issuerId}
                onChange={(event) => setCreds({ ...creds, issuerId: event.target.value })}
              />
              <Input
                placeholder="Path to AuthKey_XXXX.p8"
                className="md:col-span-2"
                value={creds.privateKeyPath}
                onChange={(event) =>
                  setCreds({ ...creds, privateKeyPath: event.target.value })
                }
              />
              <Textarea
                placeholder="Or paste .p8 PEM (not saved to disk)"
                className="min-h-28 font-mono text-xs md:col-span-2"
                value={creds.privateKeyPem}
                onChange={(event) =>
                  setCreds({ ...creds, privateKeyPem: event.target.value })
                }
              />
              <div className="flex flex-wrap gap-2 md:col-span-2">
                <Button onClick={tryLive} disabled={loading}>
                  Try live
                </Button>
                <Button variant="outline" onClick={useFixtures} disabled={loading}>
                  Back to fixtures
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
