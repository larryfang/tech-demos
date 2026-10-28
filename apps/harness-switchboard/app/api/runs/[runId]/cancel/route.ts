import { isHarnessId } from "@/lib/catalog";
import { cancelLane } from "@/lib/replay";
import { getRun } from "@/lib/store";
import type { CancelRequest } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  ctx: RouteContext<"/api/runs/[runId]/cancel">,
) {
  const { runId } = await ctx.params;
  const run = getRun(runId);
  if (!run) {
    return Response.json({ ok: false, error: "Run not found." }, { status: 404 });
  }
  const body = (await request.json()) as CancelRequest;
  if (!isHarnessId(body.harnessId) || !run.harnesses.includes(body.harnessId)) {
    return Response.json({ ok: false, error: "Unknown lane." }, { status: 400 });
  }
  await cancelLane(run, body.harnessId);
  return Response.json({ ok: true, harnessId: body.harnessId });
}
