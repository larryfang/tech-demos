import { NextRequest, NextResponse } from "next/server";
import { categorizeApplication } from "@/lib/categorize";
import { APPLICATION_HOOK_PATH, tapConfig } from "@/lib/config";
import { verifyApplicationSignedRequest } from "@/lib/signing";
import { addEvent, newId, type Verdict } from "@/lib/store";


/** Receiver for Sinch Verification & Voice callbacks (application-signed). */
export async function POST(req: NextRequest) {
  // Signature covers the raw body bytes (via Content-MD5) — read before parsing.
  const rawBody = await req.text();

  const authorization = req.headers.get("authorization");
  const xTimestamp = req.headers.get("x-timestamp");
  const contentType = req.headers.get("content-type") ?? "";

  let verdict: Verdict;
  let verdictDetail: string;
  if (!authorization) {
    verdict = "unsigned";
    verdictDetail = "No Authorization header — Sinch signs all Verification/Voice callbacks";
  } else if (!xTimestamp) {
    verdict = "failed";
    verdictDetail = "Missing x-timestamp header (required part of the signed string)";
  } else {
    const result = verifyApplicationSignedRequest({
      method: "POST",
      rawBody,
      contentType,
      xTimestamp,
      path: APPLICATION_HOOK_PATH,
      authorizationHeader: authorization,
      applicationKey: tapConfig.applicationKey,
      applicationSecret: tapConfig.applicationSecret,
    });
    verdict = result.status;
    verdictDetail = result.detail;
  }

  const { category, eventType, summary } = categorizeApplication(rawBody);
  addEvent({
    id: newId(),
    receivedAt: new Date().toISOString(),
    endpoint: "application",
    scheme: authorization ? "application-signed" : "none",
    verdict,
    verdictDetail,
    category,
    eventType,
    summary,
    simulated: req.headers.get("x-signal-tap-simulated") === "1",
    headers: Object.fromEntries(req.headers.entries()),
    rawBody,
    replays: [],
  });

  return NextResponse.json({ ok: true });
}
