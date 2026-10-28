import type { HarnessId, RunMode, StreamMessage, UhpEvent } from "./types";

export type RunRecord = {
  id: string;
  mode: RunMode;
  prompt: string;
  taskId: string;
  harnesses: HarnessId[];
  createdAt: number;
  fallbackReason?: string;
  lanes: Record<
    HarnessId,
    {
      abort: AbortController;
      responseId?: string;
      terminal: boolean;
    }
  >;
  buffer: StreamMessage[];
  listeners: Set<(message: StreamMessage) => void>;
};

const runs = new Map<string, RunRecord>();

export function createRunId(): string {
  return `run_${crypto.randomUUID().replaceAll("-", "").slice(0, 16)}`;
}

export function putRun(run: RunRecord): RunRecord {
  runs.set(run.id, run);
  return run;
}

export function getRun(id: string): RunRecord | undefined {
  return runs.get(id);
}

export function publish(run: RunRecord, message: StreamMessage): void {
  run.buffer.push(message);
  for (const listener of run.listeners) listener(message);
}

export function subscribe(run: RunRecord, listener: (message: StreamMessage) => void): () => void {
  run.listeners.add(listener);
  return () => {
    run.listeners.delete(listener);
  };
}

export function markLaneTerminal(run: RunRecord, harnessId: HarnessId): void {
  const lane = run.lanes[harnessId];
  if (lane) lane.terminal = true;
  const allDone = run.harnesses.every((id) => run.lanes[id]?.terminal);
  if (allDone) publish(run, { kind: "run.done" });
}

export function rememberResponseId(run: RunRecord, harnessId: HarnessId, event: UhpEvent): void {
  if (event.type !== "response.created") return;
  const lane = run.lanes[harnessId];
  if (lane) lane.responseId = event.response.id;
}
