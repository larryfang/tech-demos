import { isLiveAvailable } from "@/lib/live";

export const dynamic = "force-dynamic";

export async function GET() {
  const liveAvailable = isLiveAvailable();
  return Response.json({
    liveAvailable,
    mode: liveAvailable ? "live-ready" : "fixture",
  });
}
