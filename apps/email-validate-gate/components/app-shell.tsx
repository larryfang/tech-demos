"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BatchValidate } from "@/components/batch-validate";
import { SignupGate } from "@/components/signup-gate";

export function AppShell() {
  const [credentialed, setCredentialed] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then((s) => setCredentialed(Boolean(s.credentialed)))
      .catch(() => setCredentialed(false));
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold tracking-tight">Email Validate Gate</h1>
        {credentialed === null ? (
          <Badge variant="outline">checking…</Badge>
        ) : credentialed ? (
          <Badge className="bg-emerald-600 text-white">Mailgun: live</Badge>
        ) : (
          <Badge className="bg-amber-500 text-white">Mailgun: credentials required</Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground max-w-2xl -mt-5">
        A signup form gated by the{" "}
        <a
          className="underline underline-offset-2"
          href="https://documentation.mailgun.com/docs/inboxready/mailgun-validate/"
          target="_blank"
          rel="noreferrer"
        >
          Mailgun Validate API
        </a>{" "}
        — real-time risk scoring, disposable/role detection, and did-you-mean suggestions — plus a
        CSV batch mode. Local syntax/MX pre-checks run without Mailgun and are labeled.
      </p>

      <Tabs defaultValue="signup">
        <TabsList>
          <TabsTrigger value="signup">Signup gate</TabsTrigger>
          <TabsTrigger value="batch">CSV batch</TabsTrigger>
        </TabsList>
        <TabsContent value="signup" className="pt-4">
          <SignupGate credentialed={credentialed ?? false} />
        </TabsContent>
        <TabsContent value="batch" className="pt-4">
          <BatchValidate credentialed={credentialed ?? false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
