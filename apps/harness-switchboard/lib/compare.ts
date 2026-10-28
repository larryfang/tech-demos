import type { HarnessId, LaneView, ResultRow } from "./types";

export function toResultRow(lane: LaneView): ResultRow {
  return {
    harnessId: lane.harnessId,
    status: lane.status,
    elapsedMs: lane.elapsedMs,
    costUsd: lane.costUsd,
    tokens: lane.usage?.total_tokens ?? null,
    filesTouched: lane.files.length,
    filePaths: lane.files.map((file) => file.path),
  };
}

export function formatMs(ms: number | null): string {
  if (ms == null) return "—";
  if (ms < 1000) return `${ms} ms`;
  return `${(ms / 1000).toFixed(1)} s`;
}

export function formatUsd(amount: number | null): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 3,
  }).format(amount);
}

export function formatTokens(tokens: number | null): string {
  if (tokens == null) return "—";
  return tokens.toLocaleString();
}

export function suggestWinner(rows: ResultRow[]): HarnessId | null {
  const completed = rows.filter((row) => row.status === "completed");
  if (completed.length === 0) return null;
  return [...completed].sort((a, b) => {
    const cost = (a.costUsd ?? Number.POSITIVE_INFINITY) - (b.costUsd ?? Number.POSITIVE_INFINITY);
    if (cost !== 0) return cost;
    return (a.elapsedMs ?? Number.POSITIVE_INFINITY) - (b.elapsedMs ?? Number.POSITIVE_INFINITY);
  })[0]?.harnessId ?? null;
}
