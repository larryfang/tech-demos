"use client";

import { useEffect, useMemo, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  deriveRisk,
  parseOffline,
  SWAP_PERIOD_LABELS,
  type OfflineParse,
  type RiskAssessment,
  type SinchLookup,
} from "@/lib/inspect";
import { cn } from "@/lib/utils";

type LookupState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "done"; result: SinchLookup }
  | { status: "error"; code: string; message: string };

async function runLookup(number: string): Promise<LookupState> {
  try {
    const res = await fetch("/api/lookup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ number }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        status: "error",
        code: data.error ?? "unknown",
        message: data.message ?? "Lookup failed",
      };
    }
    return { status: "done", result: data.result as SinchLookup };
  } catch {
    return { status: "error", code: "network_error", message: "Request failed" };
  }
}

function RiskBadge({ risk }: { risk: RiskAssessment }) {
  const styles: Record<RiskAssessment["level"], string> = {
    low: "bg-emerald-100 text-emerald-900 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-200 dark:border-emerald-800",
    elevated:
      "bg-amber-100 text-amber-900 border-amber-300 dark:bg-amber-950 dark:text-amber-200 dark:border-amber-800",
    high: "bg-red-100 text-red-900 border-red-300 dark:bg-red-950 dark:text-red-200 dark:border-red-800",
    unknown: "bg-muted text-muted-foreground",
  };
  const labels: Record<RiskAssessment["level"], string> = {
    low: "Low risk",
    elevated: "Elevated risk",
    high: "High risk",
    unknown: "Risk unknown",
  };
  return (
    <Badge variant="outline" className={cn("font-medium", styles[risk.level])}>
      {labels[risk.level]}
    </Badge>
  );
}

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-0.5 font-mono text-sm">{value ?? "—"}</dd>
    </div>
  );
}

function OfflineCard({ parse }: { parse: OfflineParse }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Parsed number</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={parse.valid ? "default" : "destructive"}>
              {parse.valid ? "Valid" : "Invalid"}
            </Badge>
            <Badge variant="secondary">Offline — libphonenumber</Badge>
          </div>
        </div>
        <CardDescription>
          Computed locally by libphonenumber-js; no API call involved.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
          <Field label="E.164" value={parse.e164} />
          <Field label="International" value={parse.international} />
          <Field label="National" value={parse.national} />
          <Field label="Country" value={parse.country} />
          <Field
            label="Calling code"
            value={parse.callingCode ? `+${parse.callingCode}` : undefined}
          />
          <Field label="Number type (heuristic)" value={parse.numberType} />
        </dl>
      </CardContent>
    </Card>
  );
}

function FeatureError({
  feature,
  error,
}: {
  feature: string;
  error: { status?: number; title?: string; detail?: string };
}) {
  return (
    <p className="text-sm text-muted-foreground">
      {feature} unavailable
      {error.status ? ` (${error.status})` : ""}
      {error.title ? `: ${error.title}` : ""}
    </p>
  );
}

function LookupReport({ result }: { result: SinchLookup }) {
  const risk = deriveRisk(result);
  const line = result.line;
  const simSwap = result.simSwap;
  const voip = result.voIPDetection;
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Sinch lookup report</CardTitle>
          <div className="flex items-center gap-2">
            <RiskBadge risk={risk} />
            <Badge>Live API response</Badge>
          </div>
        </div>
        <CardDescription>
          Returned by the Sinch Number Lookup API for{" "}
          <span className="font-mono">{result.number}</span>
          {result.countryCode ? ` (${result.countryCode})` : ""}.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <section>
          <h3 className="mb-2 text-sm font-medium">Line</h3>
          {line && !line.error ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3">
              <Field label="Carrier" value={line.carrier} />
              <Field label="Line type" value={line.type} />
              <Field
                label="MCC / MNC"
                value={
                  line.mobileCountryCode
                    ? `${line.mobileCountryCode} / ${line.mobileNetworkCode ?? "—"}`
                    : undefined
                }
              />
              <Field
                label="Ported"
                value={
                  line.ported === undefined ? undefined : line.ported ? "Yes" : "No"
                }
              />
              <Field label="Porting date" value={line.portingDate} />
            </dl>
          ) : line?.error ? (
            <FeatureError feature="LineType" error={line.error} />
          ) : (
            <p className="text-sm text-muted-foreground">Not returned.</p>
          )}
        </section>
        <Separator />
        <section>
          <h3 className="mb-2 text-sm font-medium">Risk signals</h3>
          <div className="space-y-2">
            {simSwap && !simSwap.error ? (
              <p className="text-sm">
                SIM swap:{" "}
                <span className="font-medium">
                  {simSwap.swapped
                    ? `swapped ${
                        SWAP_PERIOD_LABELS[simSwap.swapPeriod ?? ""] ??
                        simSwap.swapPeriod ??
                        ""
                      }`
                    : "not swapped"}
                </span>
              </p>
            ) : simSwap?.error ? (
              <FeatureError feature="SimSwap" error={simSwap.error} />
            ) : null}
            {voip && !voip.error ? (
              <p className="text-sm">
                VoIP probability:{" "}
                <span className="font-medium">{voip.probability ?? "Unknown"}</span>{" "}
                <span className="text-muted-foreground">(alpha feature)</span>
              </p>
            ) : voip?.error ? (
              <FeatureError feature="VoIPDetection" error={voip.error} />
            ) : null}
            <ul className="list-inside list-disc text-sm text-muted-foreground">
              {risk.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground">
              Risk level is derived locally from the returned simSwap and
              voIPDetection fields.
            </p>
          </div>
        </section>
        {result.traceId ? (
          <>
            <Separator />
            <p className="text-xs text-muted-foreground">
              traceId: <span className="font-mono">{result.traceId}</span>
            </p>
          </>
        ) : null}
      </CardContent>
    </Card>
  );
}

function CredentialsAlert() {
  return (
    <Alert className="border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
      <AlertTitle>Sinch credentials required</AlertTitle>
      <AlertDescription className="text-amber-900/80 dark:text-amber-200/80">
        Live lookups need <code className="font-mono">SINCH_PROJECT_ID</code>,{" "}
        <code className="font-mono">SINCH_KEY_ID</code> and{" "}
        <code className="font-mono">SINCH_KEY_SECRET</code> in the environment
        (Sinch dashboard → Settings → Access Keys). Offline parsing below still
        works without them. No fake API data is ever shown.
      </AlertDescription>
    </Alert>
  );
}

function SingleLookup() {
  const [input, setInput] = useState("");
  const [lookup, setLookup] = useState<LookupState>({ status: "idle" });

  const parse = useMemo(
    () => (input.trim() ? parseOffline(input) : null),
    [input],
  );

  async function onInspect() {
    if (!parse?.e164) return;
    setLookup({ status: "loading" });
    setLookup(await runLookup(parse.e164));
  }

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="number">Phone number (E.164, e.g. +14155552671)</Label>
          <Input
            id="number"
            placeholder="+14155552671"
            value={input}
            autoComplete="off"
            onChange={(e) => {
              setInput(e.target.value);
              setLookup({ status: "idle" });
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") onInspect();
            }}
          />
        </div>
        <Button
          onClick={onInspect}
          disabled={!parse?.valid || lookup.status === "loading"}
        >
          {lookup.status === "loading" ? "Looking up…" : "Inspect with Sinch"}
        </Button>
      </div>
      {parse ? <OfflineCard parse={parse} /> : null}
      {lookup.status === "error" ? (
        lookup.code === "credentials_required" ? (
          <CredentialsAlert />
        ) : (
          <Alert variant="destructive">
            <AlertTitle>Lookup failed</AlertTitle>
            <AlertDescription>{lookup.message}</AlertDescription>
          </Alert>
        )
      ) : null}
      {lookup.status === "done" ? <LookupReport result={lookup.result} /> : null}
    </div>
  );
}

interface BatchRow {
  input: string;
  parse: OfflineParse;
  lookup: LookupState;
}

function extractNumbers(text: string): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const first = line.split(",")[0]?.trim().replace(/^["']|["']$/g, "");
    if (!first || /[a-z]{3,}/i.test(first)) continue; // skip header-ish rows
    if (!seen.has(first)) {
      seen.add(first);
      out.push(first);
    }
  }
  return out.slice(0, 50);
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  fn: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (next < items.length) {
      const index = next++;
      await fn(items[index], index);
    }
  });
  await Promise.all(workers);
}

function BatchLookup({ configured }: { configured: boolean }) {
  const [rows, setRows] = useState<BatchRow[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    const text = await file.text();
    const numbers = extractNumbers(text);
    setFileName(file.name);
    setRows(
      numbers.map((input) => ({
        input,
        parse: parseOffline(input),
        lookup: { status: "idle" },
      })),
    );
  }

  async function onRunAll() {
    const targets = rows
      .map((row, index) => ({ row, index }))
      .filter(({ row }) => row.parse.valid && row.parse.e164);
    setRunning(true);
    setRows((prev) =>
      prev.map((row) =>
        row.parse.valid ? { ...row, lookup: { status: "loading" } } : row,
      ),
    );
    await runWithConcurrency(targets, 3, async ({ row, index }) => {
      const state = await runLookup(row.parse.e164!);
      setRows((prev) =>
        prev.map((r, i) => (i === index ? { ...r, lookup: state } : r)),
      );
    });
    setRunning(false);
  }

  const validCount = rows.filter((r) => r.parse.valid).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end gap-2">
        <div className="flex-1 space-y-1.5">
          <Label htmlFor="csv">
            CSV file (one number per line; first column is used)
          </Label>
          <Input
            id="csv"
            type="file"
            accept=".csv,.txt,text/csv,text/plain"
            onChange={(e) => onFile(e.target.files?.[0])}
          />
        </div>
        <Button
          onClick={onRunAll}
          disabled={!configured || validCount === 0 || running}
        >
          {running
            ? "Running lookups…"
            : `Run Sinch lookups (${validCount})`}
        </Button>
      </div>
      {!configured && rows.length > 0 ? <CredentialsAlert /> : null}
      {rows.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Batch report{fileName ? ` — ${fileName}` : ""}
            </CardTitle>
            <CardDescription>
              {rows.length} unique numbers (max 50). Offline columns are local;
              carrier and risk columns come from live Sinch lookups, one request
              per number.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Input</TableHead>
                  <TableHead>E.164 (offline)</TableHead>
                  <TableHead>Country</TableHead>
                  <TableHead>Carrier (Sinch)</TableHead>
                  <TableHead>Line type</TableHead>
                  <TableHead>Ported</TableHead>
                  <TableHead>Risk</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.input}>
                    <TableCell className="font-mono text-xs">{row.input}</TableCell>
                    <TableCell className="font-mono text-xs">
                      {row.parse.valid ? (
                        row.parse.e164
                      ) : (
                        <Badge variant="destructive">invalid</Badge>
                      )}
                    </TableCell>
                    <TableCell>{row.parse.country ?? "—"}</TableCell>
                    {row.lookup.status === "done" ? (
                      <>
                        <TableCell>{row.lookup.result.line?.carrier ?? "—"}</TableCell>
                        <TableCell>{row.lookup.result.line?.type ?? "—"}</TableCell>
                        <TableCell>
                          {row.lookup.result.line?.ported === undefined
                            ? "—"
                            : row.lookup.result.line.ported
                              ? "Yes"
                              : "No"}
                        </TableCell>
                        <TableCell>
                          <RiskBadge risk={deriveRisk(row.lookup.result)} />
                        </TableCell>
                      </>
                    ) : row.lookup.status === "loading" ? (
                      <TableCell colSpan={4} className="text-muted-foreground">
                        Looking up…
                      </TableCell>
                    ) : row.lookup.status === "error" ? (
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {row.lookup.code === "credentials_required"
                          ? "Credentials required"
                          : row.lookup.message}
                      </TableCell>
                    ) : (
                      <TableCell colSpan={4} className="text-muted-foreground">
                        {row.parse.valid ? "Pending" : "Skipped (invalid number)"}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}

export function Inspector() {
  const [tab, setTab] = useState<"single" | "batch">("single");
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((res) => res.json())
      .then((data) => setConfigured(Boolean(data.configured)))
      .catch(() => setConfigured(null));
  }, []);

  return (
    <div className="space-y-6">
      {configured === false ? <CredentialsAlert /> : null}
      <div className="inline-flex rounded-lg border bg-muted p-1">
        <Button
          size="sm"
          variant={tab === "single" ? "default" : "ghost"}
          onClick={() => setTab("single")}
        >
          Single number
        </Button>
        <Button
          size="sm"
          variant={tab === "batch" ? "default" : "ghost"}
          onClick={() => setTab("batch")}
        >
          CSV batch
        </Button>
      </div>
      {tab === "single" ? (
        <SingleLookup />
      ) : (
        <BatchLookup configured={configured === true} />
      )}
    </div>
  );
}
