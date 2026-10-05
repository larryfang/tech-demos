import { askLive, isLiveAvailable } from "@/lib/openai";
import { stubAnswer } from "@/lib/stub";
import type { AskError, AskRequest, AskResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const liveAvailable = isLiveAvailable();
  try {
    const body = (await request.json()) as AskRequest;
    const selection = body.selection?.trim();
    if (!selection) {
      const payload: AskError = {
        ok: false,
        liveAvailable,
        error: "Select some transcript text first.",
      };
      return Response.json(payload, { status: 400 });
    }

    const stub = stubAnswer(selection, body.question);
    const wantLive = Boolean(body.live) && liveAvailable;
    if (!wantLive) {
      const payload: AskResult = {
        ok: true,
        mode: "fixture",
        liveAvailable,
        answer: stub,
      };
      return Response.json(payload);
    }

    try {
      const answer = await askLive(selection, body.question);
      const payload: AskResult = {
        ok: true,
        mode: "live",
        liveAvailable,
        answer,
      };
      return Response.json(payload);
    } catch (error) {
      const payload: AskResult = {
        ok: true,
        mode: "fixture",
        liveAvailable,
        answer: stub,
        fallbackReason: error instanceof Error ? error.message : "Ask API failed",
      };
      return Response.json(payload);
    }
  } catch (error) {
    const payload: AskError = {
      ok: false,
      liveAvailable,
      error: error instanceof Error ? error.message : "Ask failed",
    };
    return Response.json(payload, { status: 400 });
  }
}
