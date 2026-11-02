import { NextResponse, connection } from "next/server";
import { getConfigState } from "@/lib/sinch";

export async function GET() {
  // Credentials are read per-request, never frozen into the build.
  await connection();
  return NextResponse.json(getConfigState());
}
