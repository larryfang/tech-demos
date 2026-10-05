import { isLiveAvailable } from "@/lib/openai";

export const dynamic = "force-dynamic";

export async function GET() {
  const liveAvailable = isLiveAvailable();
  return Response.json({
    liveAvailable,
    mode: liveAvailable ? "live-ready" : "fixture",
  });
}
