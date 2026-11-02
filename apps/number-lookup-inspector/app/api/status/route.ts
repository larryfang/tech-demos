import { connection, NextResponse } from "next/server";
import { getCredentials } from "@/lib/sinch";

export async function GET() {
  await connection(); // evaluate env vars per-request, not at build time
  const creds = getCredentials();
  return NextResponse.json({
    configured: creds !== null,
    requiredEnv: ["SINCH_PROJECT_ID", "SINCH_KEY_ID", "SINCH_KEY_SECRET"],
    projectIdHint: creds ? `…${creds.projectId.slice(-4)}` : null,
  });
}
