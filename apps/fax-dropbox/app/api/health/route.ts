import { connection, NextResponse } from "next/server";
import { getConfig } from "@/lib/sinch";

export async function GET() {
  await connection();
  const { config, missing } = getConfig();
  return NextResponse.json({
    configured: config !== null,
    missing,
    from: config?.from ?? null,
  });
}
