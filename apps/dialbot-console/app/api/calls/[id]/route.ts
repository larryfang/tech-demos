import { getBlandCall, mapBlandDetail } from "@/lib/bland";
import { getApiKey, getCall, getSnapshot, isLiveAvailable, updateCall } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  let call = getCall(id);
  if (!call) {
    return Response.json({ error: "Call not found.", ...getSnapshot() }, { status: 404 });
  }

  const apiKey = getApiKey();
  if (call.mode === "live" && call.liveCallId && apiKey && (call.status === "queued" || call.status === "started")) {
    const polled = await getBlandCall(call.liveCallId, apiKey);
    if ("detail" in polled) {
      call = updateCall(call.id, mapBlandDetail(polled.detail, call)) ?? call;
    } else {
      return Response.json({
        liveAvailable: isLiveAvailable(),
        call,
        error: polled.error,
      });
    }
  }

  return Response.json({
    liveAvailable: isLiveAvailable(),
    call,
  });
}
