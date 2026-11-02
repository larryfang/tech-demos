import { connection, NextResponse } from "next/server";
import { getSinchConfig } from "@/lib/sinch";

export async function GET() {
  await connection(); // read env at request time, never at build time
  const cfg = getSinchConfig();
  return NextResponse.json({
    configured: cfg.configured,
    hasApplicationKey: cfg.applicationKey.length > 0,
    hasApplicationSecret: cfg.applicationSecret.length > 0,
    region: cfg.region,
    defaultCli: cfg.defaultCli,
  });
}
