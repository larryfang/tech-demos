import { getRun, subscribe } from "@/lib/store";
import type { StreamMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(
  request: Request,
  ctx: RouteContext<"/api/runs/[runId]/stream">,
) {
  const { runId } = await ctx.params;
  const run = getRun(runId);
  if (!run) {
    return Response.json({ error: "Run not found." }, { status: 404 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (message: StreamMessage) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(message)}\n\n`));
        if (message.kind === "run.done") {
          try {
            controller.close();
          } catch {
            // already closed
          }
        }
      };

      const snapshot = run.buffer.slice();
      const alreadyDone = run.harnesses.every((id) => run.lanes[id]?.terminal);
      const unsubscribe = alreadyDone ? () => undefined : subscribe(run, send);
      for (const message of snapshot) send(message);
      if (alreadyDone) {
        try {
          controller.close();
        } catch {
          // already closed
        }
        return;
      }

      const onAbort = () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // already closed
        }
      };
      request.signal.addEventListener("abort", onAbort);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
