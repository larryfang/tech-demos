"use client";

import { useRef, useState } from "react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { BoolBadge, CheckBadge, ResultBadge, RiskBadge } from "@/components/verdict-badges";
import type { ValidateResponse } from "@/lib/validation";

type Row = { email: string; status: "pending" | "done" | "error"; resp: ValidateResponse | null };

function parseCsv(text: string): string[] {
  const lines = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (lines.length === 0) return [];
  const header = lines[0].split(",").map((c) => c.trim().toLowerCase().replace(/^"|"$/g, ""));
  let emailCol = header.findIndex((c) => c === "email" || c === "email_address");
  let dataLines = lines;
  if (emailCol >= 0) {
    dataLines = lines.slice(1);
  } else {
    emailCol = 0;
  }
  const emails: string[] = [];
  for (const line of dataLines) {
    const cell = (line.split(",")[emailCol] ?? "").trim().replace(/^"|"$/g, "");
    if (cell) emails.push(cell);
  }
  return [...new Set(emails)].slice(0, 100);
}

export function BatchValidate({ credentialed }: { credentialed: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [running, setRunning] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function runBatch(emails: string[]) {
    if (emails.length === 0 || running) return;
    const initial: Row[] = emails.map((email) => ({ email, status: "pending", resp: null }));
    setRows(initial);
    setRunning(true);
    let next = 0;
    async function worker() {
      while (next < emails.length) {
        const i = next++;
        try {
          const res = await fetch("/api/validate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: emails[i] }),
          });
          const resp = (await res.json()) as ValidateResponse;
          setRows((prev) => prev.map((r, j) => (j === i ? { ...r, status: "done", resp } : r)));
        } catch {
          setRows((prev) => prev.map((r, j) => (j === i ? { ...r, status: "error" } : r)));
        }
      }
    }
    await Promise.all(Array.from({ length: Math.min(4, emails.length) }, worker));
    setRunning(false);
  }

  async function onFile(file: File) {
    runBatch(parseCsv(await file.text()));
  }

  async function loadSample() {
    const res = await fetch("/sample.csv");
    runBatch(parseCsv(await res.text()));
  }

  function exportCsv() {
    const header = "email,syntax_valid,has_mx,mailgun_result,mailgun_risk,disposable,role,did_you_mean";
    const body = rows
      .map((r) => {
        const l = r.resp?.local;
        const m = r.resp?.mailgun;
        return [
          r.email,
          l?.syntaxValid ?? "",
          l?.mxChecked ? l.hasMx : "",
          m?.result ?? "",
          m?.risk ?? "",
          m?.is_disposable_address ?? "",
          m?.is_role_address ?? "",
          m?.did_you_mean ?? r.resp?.local.didYouMean ?? "",
        ].join(",");
      })
      .join("\n");
    const blob = new Blob([header + "\n" + body], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "validation-results.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  }

  const done = rows.filter((r) => r.status !== "pending").length;
  const deliverable = rows.filter((r) => r.resp?.mailgun?.result === "deliverable").length;
  const risky = rows.filter(
    (r) => r.resp?.mailgun && (r.resp.mailgun.risk === "high" || r.resp.mailgun.is_disposable_address),
  ).length;
  const syntaxFail = rows.filter((r) => r.resp && !r.resp.local.syntaxValid).length;
  const noMx = rows.filter((r) => r.resp?.local.mxChecked && !r.resp.local.hasMx).length;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>CSV batch validation</CardTitle>
          <CardDescription>
            Upload a CSV with an <code className="font-mono">email</code> column (max 100 rows for
            this demo). Each row is validated through the same API route as the signup form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {!credentialed && (
            <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
              <AlertTitle className="text-amber-800">Local pre-checks only</AlertTitle>
              <AlertDescription className="text-amber-800 text-xs">
                <code className="font-mono">MAILGUN_API_KEY</code> is not set, so the Mailgun
                columns stay empty. Syntax and MX checks below are local and labeled as such.
              </AlertDescription>
            </Alert>
          )}
          <div className="flex flex-wrap gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={running}>
              Upload CSV
            </Button>
            <Button variant="outline" onClick={loadSample} disabled={running}>
              Load sample list
            </Button>
            {rows.length > 0 && (
              <Button variant="outline" onClick={exportCsv} disabled={running}>
                Export results CSV
              </Button>
            )}
          </div>
          {rows.length > 0 && (
            <div className="flex flex-wrap gap-2 text-xs">
              <Badge variant="outline">
                {done}/{rows.length} checked
              </Badge>
              {credentialed && (
                <>
                  <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-300">
                    {deliverable} deliverable
                  </Badge>
                  <Badge className="bg-red-100 text-red-800 border border-red-300">
                    {risky} risky/disposable
                  </Badge>
                </>
              )}
              <Badge className="bg-red-100 text-red-800 border border-red-300">
                {syntaxFail} bad syntax
              </Badge>
              <Badge className="bg-amber-100 text-amber-800 border border-amber-300">
                {noMx} no MX
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>

      {rows.length > 0 && (
        <Card>
          <CardContent className="pt-6 overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email</TableHead>
                  <TableHead>Local syntax</TableHead>
                  <TableHead>Local MX</TableHead>
                  <TableHead>Mailgun result</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Flags</TableHead>
                  <TableHead>Did you mean</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => {
                  const l = r.resp?.local;
                  const m = r.resp?.mailgun ?? null;
                  return (
                    <TableRow key={r.email}>
                      <TableCell className="font-mono text-xs">{r.email}</TableCell>
                      <TableCell>
                        {l ? <CheckBadge ok={l.syntaxValid} label="syntax" /> : "…"}
                      </TableCell>
                      <TableCell>
                        {l?.mxChecked ? <CheckBadge ok={l.hasMx} label="MX" /> : l ? "—" : "…"}
                      </TableCell>
                      <TableCell>
                        {m ? (
                          <ResultBadge result={m.result} />
                        ) : r.status === "done" ? (
                          <span className="text-xs text-muted-foreground">
                            {credentialed ? "—" : "needs credentials"}
                          </span>
                        ) : (
                          "…"
                        )}
                      </TableCell>
                      <TableCell>{m ? <RiskBadge risk={m.risk} /> : "—"}</TableCell>
                      <TableCell>
                        {m ? (
                          <div className="flex gap-1">
                            {m.is_disposable_address && <BoolBadge label="disposable" bad />}
                            {m.is_role_address && <BoolBadge label="role" bad />}
                            {!m.is_disposable_address && !m.is_role_address && (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </div>
                        ) : (
                          "—"
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-xs">
                        {m?.did_you_mean ?? r.resp?.local.didYouMean ?? "—"}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
