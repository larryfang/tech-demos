import { NextRequest, NextResponse } from "next/server";
import { getEvent } from "@/lib/store";


const FORWARDED_HEADERS = [
  "content-type",
  "authorization",
  "x-timestamp",
  "x-sinch-webhook-signature",
  "x-sinch-webhook-signature-nonce",
  "x-sinch-webhook-signature-timestamp",
  "x-sinch-webhook-signature-algorithm",
];

/**
 * Replay a captured event to a local handler: forwards the original raw
 * body and signature headers so the handler can run its own verification.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const event = getEvent(id);
  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const { targetUrl } = (await req.json()) as { targetUrl?: string };
  let url: URL;
  try {
    url = new URL(targetUrl ?? "");
  } catch {
    return NextResponse.json({ error: "Invalid target URL" }, { status: 400 });
  }

  const headers: Record<string, string> = { "x-signal-tap-replay": "1" };
  for (const name of FORWARDED_HEADERS) {
    const value = event.headers[name];
    if (value) headers[name] = value;
  }

  const record = {
    at: new Date().toISOString(),
    targetUrl: url.toString(),
    status: null as number | null,
    error: undefined as string | undefined,
  };
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 5000);
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: event.rawBody,
      signal: controller.signal,
    });
    clearTimeout(timer);
    record.status = res.status;
  } catch (err) {
    record.error = err instanceof Error ? err.message : String(err);
  }

  event.replays.unshift(record);
  return NextResponse.json({ replay: record });
}
