"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { BoolBadge, CheckBadge, ResultBadge, RiskBadge } from "@/components/verdict-badges";
import type { ValidateResponse } from "@/lib/validation";

export function SignupGate({ credentialed }: { credentialed: boolean }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [checking, setChecking] = useState(false);
  const [resp, setResp] = useState<ValidateResponse | null>(null);
  const [created, setCreated] = useState<string | null>(null);
  const seq = useRef(0);

  const validate = useCallback(async (address: string) => {
    const mySeq = ++seq.current;
    if (!address.trim()) {
      setResp(null);
      setChecking(false);
      return;
    }
    setChecking(true);
    try {
      const res = await fetch("/api/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address }),
      });
      const data = (await res.json()) as ValidateResponse;
      if (mySeq === seq.current) setResp(data);
    } finally {
      if (mySeq === seq.current) setChecking(false);
    }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => void validate(email), 500);
    return () => clearTimeout(t);
  }, [email, validate]);

  const mg = resp?.mailgun ?? null;
  const gateOpen =
    !!mg &&
    mg.result === "deliverable" &&
    mg.risk !== "high" &&
    !mg.is_disposable_address;
  const suggestion = mg?.did_you_mean ?? resp?.local.didYouMean ?? null;

  if (created) {
    return (
      <Card className="border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30">
        <CardHeader>
          <CardTitle className="text-emerald-700">Account created 🎉</CardTitle>
          <CardDescription>
            <span className="font-mono">{created}</span> passed the Mailgun gate
            (deliverable, not high-risk, not disposable).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => { setCreated(null); setEmail(""); setName(""); setResp(null); }}>
            Start over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Sign up</CardTitle>
          <CardDescription>
            The Create account button unlocks only when Mailgun says the address is
            deliverable, not high-risk, and not disposable.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input id="name" placeholder="Ada Lovelace" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              autoComplete="off"
              onChange={(e) => setEmail(e.target.value)}
            />
            {checking && <p className="text-xs text-muted-foreground">Validating…</p>}
            {suggestion && suggestion !== email && (
              <button
                type="button"
                className="text-xs text-blue-600 underline underline-offset-2"
                onClick={() => setEmail(suggestion)}
              >
                Did you mean {suggestion}?{" "}
                <span className="text-muted-foreground no-underline">
                  ({mg?.did_you_mean ? "Mailgun" : "local"} suggestion)
                </span>
              </button>
            )}
          </div>
          <Button className="w-full" disabled={!gateOpen || !name.trim()} onClick={() => setCreated(email)}>
            Create account
          </Button>
          <p className="text-xs text-muted-foreground">
            {gateOpen
              ? "Gate open — Mailgun verdict accepted."
              : credentialed
                ? "Gate locked — waiting for a deliverable, low-risk, non-disposable address."
                : "Gate locked — a Mailgun verdict is required, but MAILGUN_API_KEY is not set."}
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Local pre-checks{" "}
              <span className="font-normal text-muted-foreground">(run on this server, no Mailgun)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {resp ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <CheckBadge ok={resp.local.syntaxValid} label="syntax" />
                  {resp.local.mxChecked && <CheckBadge ok={resp.local.hasMx} label="MX records" />}
                </div>
                {!resp.local.syntaxValid && resp.local.syntaxReason && (
                  <p className="text-xs text-red-600">Syntax: {resp.local.syntaxReason}</p>
                )}
                {resp.local.hasMx && (
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    MX: {resp.local.mxRecords.join(", ")}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">Type an email to run checks.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">
              Mailgun Validate{" "}
              <span className="font-normal text-muted-foreground">(live API verdict)</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!credentialed ? (
              <Alert className="border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                <AlertTitle className="text-amber-800">Credentials required</AlertTitle>
                <AlertDescription className="text-amber-800 text-xs">
                  Set <code className="font-mono">MAILGUN_API_KEY</code> (and optionally{" "}
                  <code className="font-mono">MAILGUN_API_BASE</code> for EU) and restart to get
                  real verdicts. Nothing is mocked — this panel stays empty without credentials.
                </AlertDescription>
              </Alert>
            ) : resp?.mailgunError ? (
              <Alert className="border-red-300 bg-red-50 dark:bg-red-950/30">
                <AlertTitle className="text-red-800">Mailgun error</AlertTitle>
                <AlertDescription className="text-red-800 text-xs">{resp.mailgunError}</AlertDescription>
              </Alert>
            ) : mg ? (
              <>
                <div className="flex flex-wrap gap-2">
                  <ResultBadge result={mg.result} />
                  <RiskBadge risk={mg.risk} />
                  <BoolBadge label="disposable" bad={mg.is_disposable_address} />
                  <BoolBadge label="role" bad={mg.is_role_address} />
                </div>
                {mg.reason.length > 0 && (
                  <p className="text-xs text-muted-foreground">Reasons: {mg.reason.join(", ")}</p>
                )}
                {mg.engagement && (
                  <p className="text-xs text-muted-foreground">
                    Engagement: {mg.engagement.engaged ? "engaged" : "not engaged"}
                    {mg.engagement.is_bot ? " · bot" : ""}
                  </p>
                )}
              </>
            ) : (
              <p className="text-xs text-muted-foreground">
                {checking ? "Calling Mailgun…" : "Awaiting a syntactically valid address."}
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
