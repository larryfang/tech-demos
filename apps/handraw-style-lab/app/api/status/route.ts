import { isLiveAvailable } from "@/lib/image";

export const dynamic = "force-dynamic";

export async function GET() {
  const liveAvailable = isLiveAvailable();
  return Response.json({
    liveAvailable,
    mode: liveAvailable ? "live-ready" : "fixture",
  });
}
