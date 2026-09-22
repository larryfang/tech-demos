import { isLiveAvailable } from "@/lib/vision";

export const dynamic = "force-dynamic";

export async function GET() {
  const liveAvailable = isLiveAvailable();
  return Response.json({
    liveAvailable,
    mode: liveAvailable ? "live-ready" : "fixture",
  });
}
