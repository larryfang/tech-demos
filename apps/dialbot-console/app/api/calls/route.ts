import { buildDryRunCall } from "@/lib/dry-run";
import { isE164, normalizePhone } from "@/lib/phone";
import { getBlandCall, mapBlandDetail, sendBlandCall } from "@/lib/bland";
import { addCall, getApiKey, getSnapshot, isLiveAvailable, updateCall } from "@/lib/store";
import type { CallDraft, SendCallResponse } from "@/lib/types";
import { VOICES } from "@/lib/fixtures";

export const dynamic = "force-dynamic";

function parseDraft(body: unknown): CallDraft | { error: string } {
  if (!body || typeof body !== "object") return { error: "Expected a JSON body." };
  const value = body as Record<string, unknown>;
  const phoneNumber = typeof value.phoneNumber === "string" ? value.phoneNumber : "";
  const task = typeof value.task === "string" ? value.task : "";
  const voice = typeof value.voice === "string" ? value.voice : "Maya";
  const firstSentence =
    typeof value.firstSentence === "string" ? value.firstSentence : undefined;
  const waitForGreeting = Boolean(value.waitForGreeting);
  const live = Boolean(value.live);
  if (!normalizePhone(phoneNumber)) return { error: "Enter a destination phone number." };
  if (!isE164(normalizePhone(phoneNumber))) {
    return { error: "Use an E.164 number, e.g. +15550123456." };
  }
  if (!task.trim()) return { error: "Write a task / prompt for the agent." };
  if (task.trim().length > 2000) return { error: "Keep the task under 2,000 characters." };
  if (voice && !VOICES.includes(voice as (typeof VOICES)[number])) {
    return { error: `Unknown voice. Choose one of: ${VOICES.join(", ")}.` };
  }
  return { phoneNumber, task, voice, firstSentence, waitForGreeting, live };
}

export async function GET() {
  return Response.json(getSnapshot());
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const payload: SendCallResponse = {
      ok: false,
      liveAvailable: isLiveAvailable(),
      error: "Invalid JSON.",
    };
    return Response.json(payload, { status: 400 });
  }

  const draft = parseDraft(body);
  if ("error" in draft) {
    const payload: SendCallResponse = {
      ok: false,
      liveAvailable: isLiveAvailable(),
      error: draft.error,
    };
    return Response.json(payload, { status: 400 });
  }

  const liveRequested = Boolean(draft.live);
  const apiKey = getApiKey();

  if (!liveRequested || !apiKey) {
    const fallbackReason = liveRequested
      ? "BLAND_API_KEY is not set. Staying in dry-run — no live call was placed."
      : undefined;
    const call = addCall(buildDryRunCall(draft, fallbackReason));
    const payload: SendCallResponse = {
      ok: true,
      liveAvailable: isLiveAvailable(),
      call,
      error: fallbackReason,
    };
    return Response.json(payload);
  }

  try {
    const sent = await sendBlandCall(draft, apiKey);
    if ("error" in sent) {
      const call = addCall(
        buildDryRunCall(draft, `Bland send-call failed. ${sent.error}`),
      );
      const payload: SendCallResponse = {
        ok: false,
        liveAvailable: true,
        call,
        error: sent.error,
      };
      return Response.json(payload, { status: 502 });
    }

    const createdAt = new Date().toISOString();
    let call = addCall({
      id: sent.callId,
      mode: "live",
      status: "queued",
      phoneNumber: normalizePhone(draft.phoneNumber),
      task: draft.task.trim(),
      voice: draft.voice,
      firstSentence: draft.firstSentence?.trim() || undefined,
      waitForGreeting: Boolean(draft.waitForGreeting),
      transcripts: [],
      priceUsd: 0,
      estimatedMinutes: 0,
      createdAt,
      liveCallId: sent.callId,
    });

    const polled = await getBlandCall(sent.callId, apiKey);
    if ("detail" in polled) {
      call = updateCall(sent.callId, mapBlandDetail(polled.detail, call)) ?? call;
    }

    const payload: SendCallResponse = {
      ok: true,
      liveAvailable: true,
      call,
    };
    return Response.json(payload);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Bland request failed.";
    const call = addCall(buildDryRunCall(draft, `Live Bland call failed. ${message}`));
    const payload: SendCallResponse = {
      ok: false,
      liveAvailable: true,
      call,
      error: message,
    };
    return Response.json(payload, { status: 502 });
  }
}
