import { NextRequest, NextResponse } from "next/server";
import {
  APPLICATION_HOOK_PATH,
  CONVERSATION_HOOK_PATH,
  tapConfig,
} from "@/lib/config";
import { getSample } from "@/lib/samples";
import { buildApplicationAuthHeader, conversationSignature } from "@/lib/signing";


/**
 * Event simulator: signs a documented sample payload with the configured
 * secrets and delivers it to this app's own receiver over real HTTP —
 * the receiver runs the exact same verification path as for live traffic.
 * With tamper=true it signs with a wrong secret to demonstrate detection.
 */
export async function POST(req: NextRequest) {
  const { sampleId, tamper } = (await req.json()) as {
    sampleId?: string;
    tamper?: boolean;
  };
  const sample = sampleId ? getSample(sampleId) : undefined;
  if (!sample) {
    return NextResponse.json({ error: "Unknown sampleId" }, { status: 400 });
  }

  const origin = new URL(req.url).origin;
  const rawBody = JSON.stringify(sample.body);
  const headers: Record<string, string> = {
    // Unsigned marker so the UI can label this event as a simulated sample.
    "x-signal-tap-simulated": "1",
  };
  let targetPath: string;

  if (sample.endpoint === "conversation") {
    targetPath = CONVERSATION_HOOK_PATH;
    const nonce = crypto.randomUUID();
    const timestamp = Math.floor(Date.now() / 1000).toString();
    const secret = tamper
      ? `${tapConfig.conversationSecret}-tampered`
      : tapConfig.conversationSecret;
    headers["content-type"] = "application/json";
    headers["x-sinch-webhook-signature-nonce"] = nonce;
    headers["x-sinch-webhook-signature-timestamp"] = timestamp;
    headers["x-sinch-webhook-signature-algorithm"] = "HmacSHA256";
    headers["x-sinch-webhook-signature"] = conversationSignature(
      rawBody,
      nonce,
      timestamp,
      secret,
    );
  } else {
    targetPath = APPLICATION_HOOK_PATH;
    const contentType = "application/json; charset=utf-8";
    const xTimestamp = new Date().toISOString();
    const secret = tamper
      ? Buffer.from("not-the-real-secret!").toString("base64")
      : tapConfig.applicationSecret;
    headers["content-type"] = contentType;
    headers["x-timestamp"] = xTimestamp;
    headers["authorization"] = buildApplicationAuthHeader({
      method: "POST",
      rawBody,
      contentType,
      xTimestamp,
      path: targetPath,
      applicationKey: tapConfig.applicationKey,
      applicationSecret: secret,
    });
  }

  const res = await fetch(`${origin}${targetPath}`, {
    method: "POST",
    headers,
    body: rawBody,
  });
  if (!res.ok) {
    return NextResponse.json(
      { error: `Receiver responded ${res.status}` },
      { status: 502 },
    );
  }
  return NextResponse.json({ ok: true, delivered: targetPath, tampered: !!tamper });
}
