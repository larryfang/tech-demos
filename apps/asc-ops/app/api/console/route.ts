import { NextResponse } from "next/server";
import { loadConsole } from "@/lib/load-console";
import type { AscCredentials } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ConsoleRequest = {
  appId?: string;
  credentials?: Partial<AscCredentials>;
};

async function readBody(request: Request): Promise<ConsoleRequest> {
  try {
    return (await request.json()) as ConsoleRequest;
  } catch {
    return {};
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const snapshot = await loadConsole(url.searchParams.get("appId") ?? undefined);
  return NextResponse.json(snapshot);
}

export async function POST(request: Request) {
  const body = await readBody(request);
  const snapshot = await loadConsole(body.appId, body.credentials);
  return NextResponse.json(snapshot);
}
