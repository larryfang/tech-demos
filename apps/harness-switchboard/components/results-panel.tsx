"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { harnessInfo } from "@/lib/catalog";
import { formatMs, formatTokens, formatUsd, suggestWinner, toResultRow } from "@/lib/compare";
import type { HarnessId, LaneView, ProducedFile } from "@/lib/types";
import { lineDiff } from "@/lib/uhp";

export function ResultsPanel({ lanes }: { lanes: LaneView[] }) {
  const rows = useMemo(() => lanes.map(toResultRow), [lanes]);
  const files = useMemo(() => {
    const list: { harnessId: HarnessId; file: ProducedFile }[] = [];
    for (const lane of lanes) {
      for (const file of lane.files) list.push({ harnessId: lane.harnessId, file });
    }
    return list;
  }, [lanes]);
  const [winner, setWinner] = useState<HarnessId | null>(null);
  const [selected, setSelected] = useState(0);
  const current = files[selected];
  const diff = current ? lineDiff(current.file.before, current.file.after) : [];
  const hinted = suggestWinner(rows);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            Time, cost, tokens, and files from the terminal UHP response on each lane.
          </CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead className="text-xs text-muted-foreground">
              <tr className="border-b">
                <th className="py-2 pr-3 font-medium">Harness</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Time</th>
                <th className="py-2 pr-3 font-medium">Cost</th>
                <th className="py-2 pr-3 font-medium">Tokens</th>
                <th className="py-2 pr-3 font-medium">Files</th>
                <th className="py-2 font-medium">Winner</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const picked = winner === row.harnessId;
                return (
                  <tr
                    key={row.harnessId}
                    className={picked ? "bg-primary/5" : "border-b last:border-0"}
                  >
                    <td className="py-2.5 pr-3 font-medium">{harnessInfo(row.harnessId).name}</td>
                    <td className="py-2.5 pr-3">
                      <Badge variant={row.status === "completed" ? "default" : "destructive"}>
                        {row.status}
                      </Badge>
                    </td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{formatMs(row.elapsedMs)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{formatUsd(row.costUsd)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">{formatTokens(row.tokens)}</td>
                    <td className="py-2.5 pr-3 font-mono text-xs">
                      {row.filesTouched}{" "}
                      <span className="text-muted-foreground">{row.filePaths.join(", ")}</span>
                    </td>
                    <td className="py-2.5">
                      <Button
                        size="xs"
                        variant={picked ? "default" : "outline"}
                        disabled={row.status !== "completed"}
                        onClick={() => setWinner(row.harnessId)}
                      >
                        {picked ? "Winner" : "Pick winner"}
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {winner ? (
            <p className="mt-3 text-sm">
              Winner: <span className="font-medium">{harnessInfo(winner).name}</span>
            </p>
          ) : hinted ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Cheapest completed lane is {harnessInfo(hinted).name}. Pick a winner to lock it.
            </p>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">No completed lane to crown.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Diff viewer</CardTitle>
          <CardDescription>Files each harness produced or changed.</CardDescription>
        </CardHeader>
        <CardContent>
          {files.length === 0 ? (
            <p className="text-sm text-muted-foreground">No files in this run.</p>
          ) : (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {files.map((entry, index) => (
                  <Button
                    key={`${entry.harnessId}-${entry.file.path}`}
                    size="xs"
                    variant={index === selected ? "default" : "outline"}
                    onClick={() => setSelected(index)}
                  >
                    {harnessInfo(entry.harnessId).short} · {entry.file.path}
                  </Button>
                ))}
              </div>
              {current ? (
                <div>
                  <p className="mb-2 text-xs text-muted-foreground">
                    {current.file.action === "create" ? "created" : "updated"} · {current.file.path}
                  </p>
                  <pre className="max-h-80 overflow-auto rounded-lg bg-muted/70 p-3 font-mono text-[11px] leading-5">
                    {diff.map((row, index) => (
                      <div
                        key={`${index}-${row.type}-${row.text.slice(0, 24)}`}
                        className={
                          row.type === "add"
                            ? "bg-emerald-500/10 text-emerald-800 dark:text-emerald-300"
                            : row.type === "del"
                              ? "bg-destructive/10 text-destructive"
                              : "text-foreground/80"
                        }
                      >
                        <span className="inline-block w-4 select-none text-muted-foreground">
                          {row.type === "add" ? "+" : row.type === "del" ? "−" : " "}
                        </span>
                        {row.text || " "}
                      </div>
                    ))}
                  </pre>
                </div>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
