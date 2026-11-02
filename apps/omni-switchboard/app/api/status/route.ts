import { NextResponse } from "next/server";
import { getCredentialStatus } from "@/lib/sinch";

export async function GET() {
  return NextResponse.json(getCredentialStatus());
}
