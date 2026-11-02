"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Method = "sms" | "flashcall";

type StepId = "initiate" | "challenge" | "report" | "verified";

const STEPS: { id: StepId; title: string; blurb: string }[] = [
  { id: "initiate", title: "Initiate", blurb: "POST /verifications" },
  { id: "challenge", title: "Challenge", blurb: "PIN or missed call arrives" },
  { id: "report", title: "Report", blurb: "PUT /verifications/id/{id}" },
  { id: "verified", title: "Verified", blurb: "GET status → SUCCESSFUL" },
];

interface Exchange {
  label: string;
  endpoint: string;
  ok: boolean;
  status: number;
  body: unknown;
  at: string;
}

interface ConfigState {
  configured: boolean;
  missing: string[];
}

export default function Page() {
  const [config, setConfig] = useState<ConfigState | null>(null);
  const [method, setMethod] = useState<Method>("sms");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [verificationId, setVerificationId] = useState<string | null>(null);
  const [challengeInput, setChallengeInput] = useState("");
  const [reportStatus, setReportStatus] = useState<string | null>(null);
  const [finalStatus, setFinalStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [exchanges, setExchanges] = useState<Exchange[]>([]);

  useEffect(() => {
    fetch("/api/config")
      .then((r) => r.json())
      .then(setConfig)
      .catch(() => setConfig({ configured: false, missing: ["(unreachable)"] }));
  }, []);

  const pushExchange = useCallback(
    (label: string, endpoint: string, res: Response, body: unknown) => {
      setExchanges((prev) => [
        {
          label,
          endpoint,
          ok: res.ok,
          status: res.status,
          body,
          at: new Date().toLocaleTimeString(),
        },
        ...prev,
      ]);
    },
    [],
  );

  const currentStep: StepId = finalStatus === "SUCCESSFUL"
    ? "verified"
    : reportStatus
      ? "report"
      : verificationId
        ? "challenge"
        : "initiate";

  const stepState = useMemo(() => {
    const order: StepId[] = ["initiate", "challenge", "report", "verified"];
    const activeIdx = order.indexOf(currentStep);
    return (id: StepId) => {
      const idx = order.indexOf(id);
      if (id === "verified" && finalStatus === "SUCCESSFUL") return "done";
      if (id === "report" && reportStatus && reportStatus !== "SUCCESSFUL")
        return "failed";
      if (idx < activeIdx) return "done";
      if (idx === activeIdx) return "active";
      return "todo";
    };
  }, [currentStep, finalStatus, reportStatus]);

  async function startVerification() {
    setBusy(true);
    try {
      const res = await fetch("/api/verifications/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ method, phoneNumber }),
      });
      const body = await res.json();
      pushExchange("Initiate", "POST /verification/v1/verifications", res, body);
      if (res.ok && body.response?.id) {
        setVerificationId(body.response.id);
        setReportStatus(null);
        setFinalStatus(null);
        setChallengeInput("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function reportVerification() {
    if (!verificationId) return;
    setBusy(true);
    try {
      const payload =
        method === "sms"
          ? { method, id: verificationId, code: challengeInput }
          : { method, id: verificationId, cli: challengeInput };
      const res = await fetch("/api/verifications/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json();
      pushExchange(
        "Report",
        `PUT /verification/v1/verifications/id/${verificationId}`,
        res,
        body,
      );
      if (res.ok && body.response?.status) {
        setReportStatus(body.response.status);
        if (body.response.status === "SUCCESSFUL") {
          await checkStatus(false);
        }
      }
    } finally {
      setBusy(false);
    }
  }

  async function checkStatus(toggleBusy = true) {
    if (!verificationId) return;
    if (toggleBusy) setBusy(true);
    try {
      const res = await fetch(`/api/verifications/${verificationId}`);
      const body = await res.json();
      pushExchange(
        "Status",
        `GET /verification/v1/verifications/id/${verificationId}`,
        res,
        body,
      );
      if (res.ok && body.response?.status) {
        setFinalStatus(body.response.status);
      }
    } finally {
      if (toggleBusy) setBusy(false);
    }
  }

  function resetFlow() {
    setVerificationId(null);
    setChallengeInput("");
    setReportStatus(null);
    setFinalStatus(null);
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Verify OTP Lab
            </h1>
            <p className="text-sm text-neutral-400">
              Walk a phone number through a real Sinch Verification flow —
              every payload below comes straight from the API.
            </p>
          </div>
          {config === null ? (
            <Badge variant="outline" className="border-neutral-700 text-neutral-400">
              Checking credentials…
            </Badge>
          ) : config.configured ? (
            <Badge className="bg-emerald-600 text-white hover:bg-emerald-600">
              Live credentials configured
            </Badge>
          ) : (
            <Badge className="bg-amber-500 text-black hover:bg-amber-500">
              Credentials required
            </Badge>
          )}
        </header>

        {config && !config.configured && (
          <Alert className="mb-8 border-amber-500/40 bg-amber-500/10 text-amber-200">
            <AlertTitle>Sinch credentials are not configured</AlertTitle>
            <AlertDescription className="text-amber-200/80">
              <p>
                This lab calls the real Sinch Verification API and never fakes a
                response. To run a live verification, set{" "}
                {config.missing.map((name, i) => (
                  <span key={name}>
                    {i > 0 && " and "}
                    <code className="rounded bg-amber-500/20 px-1 py-0.5 font-mono text-xs">
                      {name}
                    </code>
                  </span>
                ))}{" "}
                (from your Sinch dashboard app) and restart the dev server. You
                can still explore each step below — the server will answer with
                its real &quot;credentials required&quot; response.
              </p>
            </AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-[220px_1fr_minmax(320px,380px)]">
          {/* Step rail */}
          <ol className="flex flex-row gap-4 lg:flex-col">
            {STEPS.map((step, i) => {
              const state = stepState(step.id);
              return (
                <li key={step.id} className="flex items-start gap-3">
                  <span
                    className={
                      "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold " +
                      (state === "done"
                        ? "border-emerald-500 bg-emerald-500 text-black"
                        : state === "active"
                          ? "border-sky-400 text-sky-300"
                          : state === "failed"
                            ? "border-red-500 bg-red-500/20 text-red-300"
                            : "border-neutral-700 text-neutral-500")
                    }
                  >
                    {state === "done" ? "✓" : i + 1}
                  </span>
                  <div className="hidden lg:block">
                    <p
                      className={
                        "text-sm font-medium " +
                        (state === "todo" ? "text-neutral-500" : "text-neutral-100")
                      }
                    >
                      {step.title}
                    </p>
                    <p className="font-mono text-[11px] text-neutral-500">
                      {step.blurb}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>

          {/* Flow cards */}
          <div className="space-y-6">
            <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-base">
                  <span>1 · Initiate verification</span>
                  {verificationId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-neutral-400"
                      onClick={resetFlow}
                    >
                      Start over
                    </Button>
                  )}
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  Pick a method and a phone number. This sends{" "}
                  <code className="font-mono text-xs">
                    POST /verification/v1/verifications
                  </code>
                  .
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs
                  value={method}
                  onValueChange={(v) => setMethod(v as Method)}
                >
                  <TabsList className="bg-neutral-800">
                    <TabsTrigger value="sms">SMS PIN</TabsTrigger>
                    <TabsTrigger value="flashcall">Flashcall</TabsTrigger>
                  </TabsList>
                </Tabs>
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor="phone" className="text-neutral-300">
                      Phone number (E.164)
                    </Label>
                    <Input
                      id="phone"
                      placeholder="+12025550134"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="border-neutral-700 bg-neutral-950 font-mono"
                    />
                  </div>
                  <Button
                    onClick={startVerification}
                    disabled={busy || !phoneNumber || !!verificationId}
                  >
                    {busy && !verificationId ? "Starting…" : "Start verification"}
                  </Button>
                </div>
                {verificationId && (
                  <p className="text-sm text-neutral-400">
                    Verification ID:{" "}
                    <code className="rounded bg-neutral-800 px-1.5 py-0.5 font-mono text-xs text-emerald-300">
                      {verificationId}
                    </code>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
              <CardHeader>
                <CardTitle className="text-base">
                  2 · Challenge &nbsp;→&nbsp; 3 · Report
                </CardTitle>
                <CardDescription className="text-neutral-400">
                  {method === "sms"
                    ? "Sinch texts a PIN to the number. Enter it here to report back."
                    : "Sinch places a missed call. Enter the full caller ID (CLI) of that incoming call, e.g. +46000000000."}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-end gap-3">
                  <div className="grid flex-1 gap-1.5">
                    <Label htmlFor="challenge" className="text-neutral-300">
                      {method === "sms" ? "PIN code from SMS" : "Caller ID (CLI)"}
                    </Label>
                    <Input
                      id="challenge"
                      placeholder={method === "sms" ? "1234" : "+46000000000"}
                      value={challengeInput}
                      onChange={(e) => setChallengeInput(e.target.value)}
                      disabled={!verificationId}
                      className="border-neutral-700 bg-neutral-950 font-mono"
                    />
                  </div>
                  <Button
                    onClick={reportVerification}
                    disabled={busy || !verificationId || !challengeInput}
                  >
                    Report
                  </Button>
                </div>
                {reportStatus && (
                  <p className="text-sm">
                    Report result:{" "}
                    <Badge
                      className={
                        reportStatus === "SUCCESSFUL"
                          ? "bg-emerald-600 text-white hover:bg-emerald-600"
                          : "bg-red-600 text-white hover:bg-red-600"
                      }
                    >
                      {reportStatus}
                    </Badge>
                  </p>
                )}
              </CardContent>
            </Card>

            <Card className="border-neutral-800 bg-neutral-900 text-neutral-100">
              <CardHeader>
                <CardTitle className="text-base">4 · Verified</CardTitle>
                <CardDescription className="text-neutral-400">
                  Query the verification status by ID and confirm it reads{" "}
                  <code className="font-mono text-xs">SUCCESSFUL</code>.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-center gap-4">
                <Button
                  variant="secondary"
                  onClick={() => checkStatus()}
                  disabled={busy || !verificationId}
                >
                  Check status
                </Button>
                {finalStatus && (
                  <Badge
                    className={
                      finalStatus === "SUCCESSFUL"
                        ? "bg-emerald-600 text-white hover:bg-emerald-600"
                        : "bg-neutral-700 text-white hover:bg-neutral-700"
                    }
                  >
                    {finalStatus}
                  </Badge>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Inspector */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-neutral-300">
                API inspector
              </h2>
              <span className="text-[11px] uppercase tracking-wide text-neutral-500">
                live traffic, verbatim
              </span>
            </div>
            <Separator className="mb-4 bg-neutral-800" />
            {exchanges.length === 0 ? (
              <p className="text-sm text-neutral-500">
                No API calls yet. Start a verification to see the real
                request/response payloads here.
              </p>
            ) : (
              <div className="space-y-4">
                {exchanges.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-lg border border-neutral-800 bg-neutral-900"
                  >
                    <div className="flex items-center justify-between gap-2 border-b border-neutral-800 px-3 py-2">
                      <span className="text-xs font-medium">
                        {ex.label}{" "}
                        <span className="font-mono text-[10px] text-neutral-500">
                          {ex.endpoint}
                        </span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Badge
                          variant="outline"
                          className={
                            ex.ok
                              ? "border-emerald-600 text-emerald-400"
                              : "border-red-600 text-red-400"
                          }
                        >
                          {ex.status}
                        </Badge>
                        <span className="text-[10px] text-neutral-500">
                          {ex.at}
                        </span>
                      </span>
                    </div>
                    <pre className="max-h-64 overflow-auto p-3 font-mono text-[11px] leading-relaxed text-neutral-300">
                      {JSON.stringify(ex.body, null, 2)}
                    </pre>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
