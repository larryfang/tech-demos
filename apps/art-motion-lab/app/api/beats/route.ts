import { isStyleId, isStructureId, stubPlan } from "@/lib/beats";
import { composeLive, isLiveAvailable } from "@/lib/openai";
import type { BeatsError, BeatsRequest, BeatsResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const liveAvailable = isLiveAvailable();
  try {
    const body = (await request.json()) as BeatsRequest;
    const narration = body.narration?.trim();
    if (!narration) {
      const payload: BeatsError = {
        ok: false,
        liveAvailable,
        error: "Write a short narration first.",
      };
      return Response.json(payload, { status: 400 });
    }
    if (!isStyleId(body.style) || !isStructureId(body.structure)) {
      const payload: BeatsError = {
        ok: false,
        liveAvailable,
        error: "Pick an art style and a narration structure.",
      };
      return Response.json(payload, { status: 400 });
    }

    const stub = stubPlan({
      narration,
      style: body.style,
      structure: body.structure,
    });
    const wantLive = Boolean(body.live) && liveAvailable;
    if (!wantLive) {
      const payload: BeatsResult = {
        ok: true,
        mode: "fixture",
        liveAvailable,
        plan: stub,
      };
      return Response.json(payload);
    }

    try {
      const plan = await composeLive({
        narration,
        style: body.style,
        structure: body.structure,
      });
      const payload: BeatsResult = {
        ok: true,
        mode: "live",
        liveAvailable,
        plan,
      };
      return Response.json(payload);
    } catch (error) {
      const payload: BeatsResult = {
        ok: true,
        mode: "fixture",
        liveAvailable,
        plan: stub,
        fallbackReason: error instanceof Error ? error.message : "Beats API failed",
      };
      return Response.json(payload);
    }
  } catch (error) {
    const payload: BeatsError = {
      ok: false,
      liveAvailable,
      error: error instanceof Error ? error.message : "Compose failed",
    };
    return Response.json(payload, { status: 400 });
  }
}
