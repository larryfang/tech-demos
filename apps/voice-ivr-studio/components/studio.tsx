"use client";

import { useEffect, useMemo, useState } from "react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import {
  buildSvaml,
  validateFlow,
  LOCALES,
  type Flow,
  type MenuOption,
  type SayStep,
  type TerminalAction,
} from "@/lib/svaml";

type Status = {
  configured: boolean;
  hasApplicationKey: boolean;
  hasApplicationSecret: boolean;
  region: string;
  defaultCli: string;
};

type CallResult =
  | { state: "idle" }
  | { state: "calling" }
  | { state: "success"; callId: string | null; raw: unknown }
  | { state: "error"; message: string; details?: unknown };

let nextId = 1;
const uid = () => `s${nextId++}`;

const ACTION_LABELS: Record<TerminalAction["kind"], string> = {
  hangup: "Hang up",
  connectPstn: "Connect to number",
  menu: "IVR menu (DTMF)",
  collect: "Collect digits",
};

function defaultAction(kind: TerminalAction["kind"]): TerminalAction {
  switch (kind) {
    case "hangup":
      return { kind: "hangup" };
    case "connectPstn":
      return { kind: "connectPstn", number: "" };
    case "menu":
      return {
        kind: "menu",
        prompt: "Press 1 for sales or 2 for support.",
        options: [
          { id: uid(), dtmf: "1", label: "sales" },
          { id: uid(), dtmf: "2", label: "support" },
        ],
      };
    case "collect":
      return { kind: "collect", prompt: "Enter your 4 digit order number.", maxDigits: 4 };
  }
}

export function Studio() {
  const [status, setStatus] = useState<Status | null>(null);
  const [saySteps, setSaySteps] = useState<SayStep[]>([
    { id: uid(), text: "Welcome to the Voice IVR Studio demo." },
  ]);
  const [action, setAction] = useState<TerminalAction>(defaultAction("menu"));
  const [locale, setLocale] = useState<string>("en-US");
  const [destination, setDestination] = useState("");
  const [cli, setCli] = useState("");
  const [result, setResult] = useState<CallResult>({ state: "idle" });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s: Status) => {
        setStatus(s);
        if (s.defaultCli) setCli(s.defaultCli);
      })
      .catch(() => setStatus(null));
  }, []);

  const flow: Flow = useMemo(
    () => ({ locale, saySteps, action }),
    [locale, saySteps, action],
  );
  const svaml = useMemo(() => buildSvaml(flow), [flow]);
  const svamlJson = useMemo(() => JSON.stringify(svaml, null, 2), [svaml]);
  const problems = useMemo(() => validateFlow(flow), [flow]);

  const updateSay = (id: string, text: string) =>
    setSaySteps((steps) => steps.map((s) => (s.id === id ? { ...s, text } : s)));
  const removeSay = (id: string) =>
    setSaySteps((steps) => steps.filter((s) => s.id !== id));
  const moveSay = (id: string, dir: -1 | 1) =>
    setSaySteps((steps) => {
      const i = steps.findIndex((s) => s.id === id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= steps.length) return steps;
      const next = [...steps];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const updateOption = (id: string, patch: Partial<MenuOption>) => {
    if (action.kind !== "menu") return;
    setAction({
      ...action,
      options: action.options.map((o) => (o.id === id ? { ...o, ...patch } : o)),
    });
  };

  const placeCall = async () => {
    setResult({ state: "calling" });
    try {
      const res = await fetch("/api/callout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destination, cli, flow }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ state: "error", message: data.error ?? `HTTP ${res.status}`, details: data.details });
      } else {
        setResult({ state: "success", callId: data.callId, raw: data.sinchResponse });
      }
    } catch (err) {
      setResult({ state: "error", message: err instanceof Error ? err.message : String(err) });
    }
  };

  const copySvaml = async () => {
    await navigator.clipboard.writeText(svamlJson);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const configured = status?.configured ?? false;

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Voice IVR Studio</h1>
          <p className="text-sm text-muted-foreground">
            Compose a Sinch SVAML call flow, preview the JSON, place a real callout.
          </p>
        </div>
        {status === null ? (
          <Badge variant="outline">Checking credentials…</Badge>
        ) : configured ? (
          <Badge>Sinch connected · {status.region}</Badge>
        ) : (
          <Badge variant="destructive">Credentials required</Badge>
        )}
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* ------------- Flow composer ------------- */}
        <Card>
          <CardHeader>
            <CardTitle>Call flow</CardTitle>
            <CardDescription>
              Say steps become SVAML <code>instructions</code>; the terminal step is the
              single <code>action</code>. This is the ACE response — it runs when the
              callee answers.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center gap-3">
              <Label className="shrink-0">Voice locale</Label>
              <Select value={locale} onValueChange={(v) => v && setLocale(v)}>
                <SelectTrigger className="w-36" data-testid="locale-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LOCALES.map((l) => (
                    <SelectItem key={l} value={l}>
                      {l}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Say steps (text-to-speech)</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSaySteps((s) => [...s, { id: uid(), text: "" }])}
                >
                  + Add say step
                </Button>
              </div>
              {saySteps.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  No say steps — the call jumps straight to the action below.
                </p>
              )}
              {saySteps.map((step, i) => (
                <div key={step.id} className="flex items-start gap-2 rounded-md border p-3">
                  <Badge variant="secondary" className="mt-2 shrink-0">
                    say {i + 1}
                  </Badge>
                  <Textarea
                    value={step.text}
                    rows={2}
                    placeholder="Text spoken to the callee…"
                    onChange={(e) => updateSay(step.id, e.target.value)}
                  />
                  <div className="flex shrink-0 flex-col gap-1">
                    <Button variant="ghost" size="icon-sm" aria-label="Move up" onClick={() => moveSay(step.id, -1)} disabled={i === 0}>
                      ↑
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Move down" onClick={() => moveSay(step.id, 1)} disabled={i === saySteps.length - 1}>
                      ↓
                    </Button>
                    <Button variant="ghost" size="icon-sm" aria-label="Remove" onClick={() => removeSay(step.id)}>
                      ✕
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Label className="shrink-0">Then (one action)</Label>
                <Select
                  value={action.kind}
                  onValueChange={(k) => k && setAction(defaultAction(k as TerminalAction["kind"]))}
                >
                  <SelectTrigger className="w-48" data-testid="action-trigger">
                    <SelectValue>{ACTION_LABELS[action.kind]}</SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ACTION_LABELS) as TerminalAction["kind"][]).map((k) => (
                      <SelectItem key={k} value={k}>
                        {ACTION_LABELS[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {action.kind === "connectPstn" && (
                <div className="space-y-1.5">
                  <Label htmlFor="connect-number">Connect to (E.164)</Label>
                  <Input
                    id="connect-number"
                    placeholder="+14045009000"
                    value={action.number}
                    onChange={(e) => setAction({ ...action, number: e.target.value })}
                  />
                </div>
              )}

              {action.kind === "menu" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="menu-prompt">Menu prompt</Label>
                    <Textarea
                      id="menu-prompt"
                      rows={2}
                      value={action.prompt}
                      onChange={(e) => setAction({ ...action, prompt: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>DTMF options</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          setAction({
                            ...action,
                            options: [...action.options, { id: uid(), dtmf: "", label: "" }],
                          })
                        }
                      >
                        + Option
                      </Button>
                    </div>
                    {action.options.map((o) => (
                      <div key={o.id} className="flex items-center gap-2">
                        <Input
                          className="w-16 text-center"
                          placeholder="1"
                          maxLength={1}
                          value={o.dtmf}
                          onChange={(e) => updateOption(o.id, { dtmf: e.target.value })}
                        />
                        <Input
                          placeholder="return value (e.g. sales)"
                          value={o.label}
                          onChange={(e) => updateOption(o.id, { label: e.target.value })}
                        />
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label="Remove option"
                          onClick={() =>
                            setAction({
                              ...action,
                              options: action.options.filter((x) => x.id !== o.id),
                            })
                          }
                        >
                          ✕
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {action.kind === "collect" && (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="collect-prompt">Prompt</Label>
                    <Textarea
                      id="collect-prompt"
                      rows={2}
                      value={action.prompt}
                      onChange={(e) => setAction({ ...action, prompt: e.target.value })}
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <Label htmlFor="max-digits" className="shrink-0">
                      Max digits
                    </Label>
                    <Input
                      id="max-digits"
                      type="number"
                      min={1}
                      max={20}
                      className="w-24"
                      value={action.maxDigits}
                      onChange={(e) =>
                        setAction({ ...action, maxDigits: Math.max(1, Number(e.target.value) || 1) })
                      }
                    />
                  </div>
                </div>
              )}

              {(action.kind === "menu" || action.kind === "collect") && (
                <p className="text-xs text-muted-foreground">
                  On a real call the prompt plays and digits are collected; the result is
                  delivered via a PIE webhook, which needs a public callback URL (not part
                  of this local demo).
                </p>
              )}
            </div>

            {problems.length > 0 && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {problems.map((p) => (
                  <div key={p}>{p}</div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ------------- Preview + callout ------------- */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>SVAML preview</CardTitle>
                  <CardDescription>Generated live from the flow — works fully offline.</CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={copySvaml}>
                  {copied ? "Copied!" : "Copy JSON"}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <pre
                className="max-h-105 overflow-auto rounded-md bg-muted p-4 font-mono text-xs leading-relaxed"
                data-testid="svaml-preview"
              >
                {svamlJson}
              </pre>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Place a real callout</CardTitle>
              <CardDescription>
                POSTs to the Sinch Voice API <code>/calling/v1/callouts</code> as a{" "}
                <code>customCallout</code> with this flow as the ACE SVAML.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {status !== null && !configured && (
                <div className="space-y-2 rounded-md border border-amber-500/50 bg-amber-500/10 p-4 text-sm">
                  <p className="font-medium">Sinch credentials required for live calls</p>
                  <p className="text-muted-foreground">
                    Set these environment variables and restart <code>bun run dev</code>:
                  </p>
                  <ul className="list-disc space-y-1 pl-5 font-mono text-xs">
                    <li>
                      SINCH_APPLICATION_KEY{" "}
                      {status.hasApplicationKey ? "(set)" : "(missing)"}
                    </li>
                    <li>
                      SINCH_APPLICATION_SECRET{" "}
                      {status.hasApplicationSecret ? "(set)" : "(missing)"}
                    </li>
                    <li>SINCH_VOICE_REGION (optional, default global)</li>
                    <li>SINCH_CLI (optional default caller id)</li>
                  </ul>
                  <p className="text-muted-foreground">
                    Everything above — the builder and SVAML preview — works without them.
                  </p>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="destination">Destination (E.164)</Label>
                  <Input
                    id="destination"
                    placeholder="+14045005000"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="cli">CLI / caller id (E.164)</Label>
                  <Input
                    id="cli"
                    placeholder="+14045001000"
                    value={cli}
                    onChange={(e) => setCli(e.target.value)}
                  />
                </div>
              </div>

              <Button
                className="w-full"
                disabled={!configured || result.state === "calling" || problems.length > 0}
                onClick={placeCall}
              >
                {result.state === "calling"
                  ? "Placing call…"
                  : configured
                    ? "Place call via Sinch"
                    : "Credentials required"}
              </Button>

              {result.state === "success" && (
                <div className="space-y-1 rounded-md border border-green-600/50 bg-green-600/10 p-3 text-sm">
                  <p className="font-medium">Callout accepted by Sinch</p>
                  <p className="font-mono text-xs">callId: {result.callId ?? "(none returned)"}</p>
                </div>
              )}
              {result.state === "error" && (
                <div className="space-y-1 rounded-md border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                  <p className="font-medium">{result.message}</p>
                  {result.details != null && (
                    <pre className="overflow-auto font-mono text-xs">
                      {JSON.stringify(result.details, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
