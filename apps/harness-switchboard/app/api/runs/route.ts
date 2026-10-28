import { isHarnessId, resolveTask } from "@/lib/catalog";
import { isLiveAvailable } from "@/lib/live";
import { startLanes } from "@/lib/replay";
import { createRunId, putRun } from "@/lib/store";
import type { CreateRunRequest, CreateRunResponse, HarnessId } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const liveAvailable = isLiveAvailable();
  try {
    const body = (await request.json()) as CreateRunRequest;
    const harnesses = Array.from(new Set((body.harnesses ?? []).filter(isHarnessId)));
    if (harnesses.length < 2 || harnesses.length > 3) {
      const payload: CreateRunResponse = {
        ok: false,
        mode: "fixture",
        liveAvailable,
        error: "Select 2 or 3 harnesses.",
      };
      return Response.json(payload, { status: 400 });
    }

    const task = resolveTask({ taskId: body.taskId, prompt: body.prompt });
    const wantLive = Boolean(body.live) && liveAvailable;
    const runId = createRunId();
    const lanes = Object.fromEntries(
      harnesses.map((id) => [id, { abort: new AbortController(), terminal: false }]),
    ) as Record<HarnessId, { abort: AbortController; terminal: boolean }>;

    const run = putRun({
      id: runId,
      mode: wantLive ? "live" : "fixture",
      prompt: task.prompt,
      taskId: task.id,
      harnesses,
      createdAt: Date.now(),
      fallbackReason: wantLive ? undefined : undefined,
      lanes,
      buffer: [],
      listeners: new Set(),
    });

    startLanes({
      run,
      fixtureId: task.fixtureId,
      prompt: task.prompt,
      mode: wantLive ? "live" : "fixture",
    });

    const payload: CreateRunResponse = {
      ok: true,
      runId,
      mode: run.mode,
      liveAvailable,
      prompt: task.prompt,
      taskId: task.id,
      harnesses,
    };
    return Response.json(payload);
  } catch (error) {
    const payload: CreateRunResponse = {
      ok: false,
      mode: "fixture",
      liveAvailable,
      error: error instanceof Error ? error.message : "Dispatch failed.",
    };
    return Response.json(payload, { status: 400 });
  }
}
