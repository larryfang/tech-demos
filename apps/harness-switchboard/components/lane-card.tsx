"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { harnessInfo } from "@/lib/catalog";
import { formatMs, formatUsd } from "@/lib/compare";
import type { HarnessId, LaneView } from "@/lib/types";
import { isTerminalStatus } from "@/lib/uhp";

function statusVariant(status: LaneView["status"]) {
  if (status === "completed") return "default" as const;
  if (status === "failed" || status === "cancelled") return "destructive" as const;
  if (status === "in_progress") return "secondary" as const;
  return "outline" as const;
}

function statusLabel(status: LaneView["status"]) {
  if (status === "in_progress") return "running";
  return status;
}

export function LaneCard({
  lane,
  onCancel,
}: {
  lane: LaneView;
  onCancel: (harnessId: HarnessId) => void;
}) {
  const info = harnessInfo(lane.harnessId);
  const terminal = isTerminalStatus(lane.status);
  return (
    <Card className="min-w-0">
      <CardHeader className="border-b">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-mono text-[11px] tracking-[0.18em] text-muted-foreground uppercase">
              {info.short}
            </p>
            <CardTitle className="truncate">{info.name}</CardTitle>
            <p className="mt-1 truncate font-mono text-xs text-muted-foreground">{info.model}</p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <Badge variant={statusVariant(lane.status)}>{statusLabel(lane.status)}</Badge>
            <Button
              size="xs"
              variant="outline"
              disabled={terminal || lane.status === "queued"}
              onClick={() => onCancel(lane.harnessId)}
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-3">
        <div className="max-h-[28rem] space-y-2 overflow-y-auto pr-1 font-mono text-xs leading-5">
          {lane.steps.length === 0 ? (
            <p className="text-muted-foreground">Waiting for the first UHP event…</p>
          ) : null}
          {lane.steps.map((step) => {
            if (step.kind === "reasoning") {
              return (
                <p key={step.id} className="text-muted-foreground italic">
                  {step.text || "…"}
                </p>
              );
            }
            if (step.kind === "tool") {
              return (
                <div key={step.id} className="rounded-md bg-muted/70 px-2 py-1.5">
                  <p>
                    <span className="text-muted-foreground">tool</span>{" "}
                    <span className="font-medium">{step.name}</span>
                  </p>
                  {step.args ? <p className="break-all text-muted-foreground">{step.args}</p> : null}
                  {step.output ? (
                    <p className="mt-1 line-clamp-4 whitespace-pre-wrap text-foreground/80">{step.output}</p>
                  ) : null}
                </div>
              );
            }
            if (step.kind === "error") {
              return (
                <div
                  key={step.id}
                  className="rounded-md bg-destructive/10 px-2 py-1.5 text-destructive"
                >
                  <p className="font-medium">{step.code}</p>
                  <p>{step.message}</p>
                </div>
              );
            }
            return (
              <p key={step.id} className="whitespace-pre-wrap">
                {step.text || "…"}
              </p>
            );
          })}
        </div>
        {lane.status === "failed" && lane.error ? (
          <div className="mt-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <p className="font-medium text-destructive">Structured failure</p>
            <p className="mt-1 font-mono text-xs">
              {lane.error.code}
              {lane.error.param ? ` · ${lane.error.param}` : ""}
            </p>
            <p className="mt-1 text-sm text-destructive/90">{lane.error.message}</p>
          </div>
        ) : null}
        {terminal && lane.status !== "failed" ? (
          <p className="mt-3 text-xs text-muted-foreground">
            {formatMs(lane.elapsedMs)}
            {lane.costUsd != null ? ` · ${formatUsd(lane.costUsd)}` : ""}
            {lane.usage ? ` · ${lane.usage.total_tokens.toLocaleString()} tok` : ""}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
