import { isLiveAvailable } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  return Response.json({
    liveAvailable: isLiveAvailable(),
    mode: isLiveAvailable() ? "live-ready" : "dry-run",
  });
}
