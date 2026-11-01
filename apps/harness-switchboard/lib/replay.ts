import { fixtureStream } from "./fixtures";
import { cancelLiveResponse, parseSseChunk, startLiveResponse } from "./live";
import { markLaneTerminal, publish, rememberResponseId, type RunRecord } from "./store";
import type { HarnessId, TaskId, UhpEvent } from "./types";
import { cancelledResponse, isTerminalEvent } from "./uhp";

function sleep(ms: number, signal: AbortSignal): Promise<void> {
  if (ms <= 0) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      signal.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    };
    if (signal.aborted) {
      clearTimeout(timer);
      reject(new DOMException("Aborted", "AbortError"));
    } else {
      signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}

function isAbort(error: unknown): boolean {
  return error instanceof DOMException
    ? error.name === "AbortError"
    : error instanceof Error && error.name === "AbortError";
}

function emitCancel(run: RunRecord, harnessId: HarnessId, last?: UhpEvent): void {
  const base =
    last && "response" in last && last.response
      ? last.response
      : {
          id: run.lanes[harnessId]?.responseId ?? `resp_cancel_${harnessId}`,
          object: "response" as const,
          created_at: Math.floor(Date.now() / 1000),
          status: "in_progress" as const,
          error: null,
          incomplete_details: null,
          previous_response_id: null,
          model: "",
          output: [],
          store: true,
          usage: null,
          metadata: { session_id: "", harness_id: harnessId },
        };
  const response = cancelledResponse({
    ...base,
    metadata: { ...base.metadata, harness_id: harnessId, elapsed_ms: Date.now() - run.createdAt },
  });
  const seq = last && "sequence_number" in last ? last.sequence_number + 1 : 0;
  const event: UhpEvent = { type: "response.failed", sequence_number: seq, response };
  publish(run, { kind: "event", harnessId, event });
  markLaneTerminal(run, harnessId);
}

export async function replayFixtureLane(input: {
  run: RunRecord;
  harnessId: HarnessId;
  fixtureId: TaskId;
  prompt: string;
}): Promise<void> {
  const events = fixtureStream(input.fixtureId, input.harnessId, input.prompt);
  const signal = input.run.lanes[input.harnessId]?.abort.signal;
  if (!signal) return;
  let last: UhpEvent | undefined;
  try {
    for (const timed of events) {
      await sleep(timed.delayMs, signal);
      last = timed.event;
      rememberResponseId(input.run, input.harnessId, timed.event);
      publish(input.run, { kind: "event", harnessId: input.harnessId, event: timed.event });
      if (isTerminalEvent(timed.event)) {
        markLaneTerminal(input.run, input.harnessId);
        return;
      }
    }
  } catch (error) {
    if (isAbort(error)) {
      emitCancel(input.run, input.harnessId, last);
      return;
    }
    throw error;
  }
}

export async function replayLiveLane(input: {
  run: RunRecord;
  harnessId: HarnessId;
  prompt: string;
}): Promise<void> {
  const signal = input.run.lanes[input.harnessId]?.abort.signal;
  if (!signal) return;
  let last: UhpEvent | undefined;
  try {
    const response = await startLiveResponse({
      prompt: input.prompt,
      harnessId: input.harnessId,
      signal,
    });
    const body = response.body;
    if (!body) throw new Error("HarnessRouter returned an empty stream.");
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let rest = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      if (signal.aborted) {
        reader.cancel().catch(() => undefined);
        break;
      }
      const parsed = parseSseChunk(rest + decoder.decode(value, { stream: true }));
      rest = parsed.rest;
      for (const raw of parsed.events) {
        if (!raw || typeof raw !== "object" || !("type" in raw)) continue;
        const event = raw as UhpEvent;
        last = event;
        rememberResponseId(input.run, input.harnessId, event);
        publish(input.run, { kind: "event", harnessId: input.harnessId, event });
        if (isTerminalEvent(event)) {
          markLaneTerminal(input.run, input.harnessId);
          return;
        }
      }
    }
    if (!input.run.lanes[input.harnessId]?.terminal) {
      emitCancel(input.run, input.harnessId, last);
    }
  } catch (error) {
    if (isAbort(error)) {
      const responseId = input.run.lanes[input.harnessId]?.responseId;
      if (responseId) await cancelLiveResponse(responseId);
      emitCancel(input.run, input.harnessId, last);
      return;
    }
    throw error;
  }
}

export async function cancelLane(run: RunRecord, harnessId: HarnessId): Promise<void> {
  const lane = run.lanes[harnessId];
  if (!lane || lane.terminal) return;
  if (run.mode === "live" && lane.responseId) {
    await cancelLiveResponse(lane.responseId);
  }
  lane.abort.abort();
}

export function startLanes(input: {
  run: RunRecord;
  fixtureId: TaskId;
  prompt: string;
  mode: "fixture" | "live";
}): void {
  for (const harnessId of input.run.harnesses) {
    const work =
      input.mode === "live"
        ? replayLiveLane({ run: input.run, harnessId, prompt: input.prompt }).catch((error) => {
            publish(input.run, {
              kind: "notice",
              message: `${harnessId}: ${error instanceof Error ? error.message : "live lane failed"} — replaying fixture`,
            });
            return replayFixtureLane({
              run: input.run,
              harnessId,
              fixtureId: input.fixtureId,
              prompt: input.prompt,
            });
          })
        : replayFixtureLane({
            run: input.run,
            harnessId,
            fixtureId: input.fixtureId,
            prompt: input.prompt,
          });
    void work.catch((error) => {
      publish(input.run, {
        kind: "notice",
        message: `${harnessId} stopped: ${error instanceof Error ? error.message : "unknown error"}`,
      });
      markLaneTerminal(input.run, harnessId);
    });
  }
}
