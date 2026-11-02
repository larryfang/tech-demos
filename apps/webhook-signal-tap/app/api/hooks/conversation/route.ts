import { NextRequest, NextResponse } from "next/server";
import { categorizeConversation } from "@/lib/categorize";
import { tapConfig } from "@/lib/config";
import { verifyConversationSignature } from "@/lib/signing";
import { addEvent, newId, type Verdict } from "@/lib/store";


/** Receiver for Sinch Conversation API webhooks (HMAC-signed). */
export async function POST(req: NextRequest) {
  // Signature must be computed over the raw body bytes, before any parsing.
  const rawBody = await req.text();

  const signature = req.headers.get("x-sinch-webhook-signature");
  const nonce = req.headers.get("x-sinch-webhook-signature-nonce");
  const timestamp = req.headers.get("x-sinch-webhook-signature-timestamp");

  let verdict: Verdict;
  let verdictDetail: string;
  if (!signature || !nonce || !timestamp) {
    verdict = "unsigned";
    verdictDetail =
      "No x-sinch-webhook-signature headers — webhook has no secret configured, or sender is not Sinch";
  } else if (
    verifyConversationSignature({
      rawBody,
      nonce,
      timestamp,
      signature,
      secret: tapConfig.conversationSecret,
    })
  ) {
    verdict = "verified";
    verdictDetail = "HMAC-SHA256(rawBody.nonce.timestamp) matches x-sinch-webhook-signature";
  } else {
    verdict = "failed";
    verdictDetail = "Signature mismatch — wrong secret or tampered payload";
  }

  const { category, eventType, summary } = categorizeConversation(rawBody);
  addEvent({
    id: newId(),
    receivedAt: new Date().toISOString(),
    endpoint: "conversation",
    scheme: signature ? "conversation-hmac" : "none",
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
