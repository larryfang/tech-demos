import type { CallDraft, CallRecord, CallStatus, TranscriptLine } from "@/lib/types";
import { normalizePhone } from "@/lib/phone";

export const BLAND_API_BASE = "https://api.bland.ai/v1";
export const BLAND_SEND_PATH = "/calls";

export type BlandSendResponse = {
  status?: string;
  message?: string;
  call_id?: string;
  errors?: unknown;
  error?: unknown;
};

export type BlandCallDetail = {
  call_id?: string;
  c_id?: string;
  status?: string;
  queue_status?: string;
  completed?: boolean;
  error_message?: string | null;
  price?: number;
  call_length?: number;
  summary?: string | null;
  concatenated_transcript?: string | null;
  transcripts?: Array<{
    user?: string;
    text?: string;
    created_at?: string;
  }>;
  to?: string;
  voice?: string;
};

export function blandHeaders(apiKey: string): HeadersInit {
  return {
    authorization: apiKey,
    "Content-Type": "application/json",
  };
}

export function buildSendCallBody(draft: CallDraft): Record<string, unknown> {
  const body: Record<string, unknown> = {
    phone_number: normalizePhone(draft.phoneNumber),
    task: draft.task.trim(),
    voice: draft.voice.trim() || "Maya",
  };
  if (draft.firstSentence?.trim()) {
    body.first_sentence = draft.firstSentence.trim();
  }
  if (draft.waitForGreeting) {
    body.wait_for_greeting = true;
  }
  return body;
}

function errorFromUnknown(value: unknown): string | undefined {
  if (!value) return undefined;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) return value.map(String).join("; ");
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function blandErrorMessage(payload: BlandSendResponse, fallback: string): string {
  return (
    errorFromUnknown(payload.errors) ||
    errorFromUnknown(payload.error) ||
    payload.message ||
    fallback
  );
}

export function mapQueueStatus(detail: BlandCallDetail): CallStatus {
  const raw = (detail.status || detail.queue_status || "").toLowerCase();
  if (detail.completed === true || raw === "complete" || raw === "completed") {
    return "completed";
  }
  if (raw.includes("no-answer") || raw.includes("no_answer")) return "no-answer";
  if (raw.includes("busy")) return "busy";
  if (raw.includes("cancel")) return "canceled";
  if (raw.includes("fail") || raw.includes("error")) return "failed";
  if (raw.includes("start") || raw === "allocated") return "started";
  return "queued";
}

function mapSpeaker(user: string | undefined): TranscriptLine["user"] {
  if (user === "user" || user === "assistant" || user === "robot" || user === "agent-action") {
    return user;
  }
  return "assistant";
}

export function mapBlandDetail(
  detail: BlandCallDetail,
  draft: Pick<CallRecord, "phoneNumber" | "task" | "voice" | "firstSentence" | "waitForGreeting" | "createdAt" | "id">,
): CallRecord {
  const transcripts: TranscriptLine[] = (detail.transcripts ?? []).map((line) => ({
    user: mapSpeaker(line.user),
    text: line.text ?? "",
    createdAt: line.created_at,
  }));
  const minutes =
    typeof detail.call_length === "number" && detail.call_length > 0
      ? Math.round(detail.call_length * 100) / 100
      : 0;
  const status = mapQueueStatus(detail);
  const done = status !== "queued" && status !== "started";

  return {
    id: draft.id,
    mode: "live",
    status,
    phoneNumber: detail.to || draft.phoneNumber,
    task: draft.task,
    voice: draft.voice,
    firstSentence: draft.firstSentence,
    waitForGreeting: draft.waitForGreeting,
    transcripts,
    concatenatedTranscript: detail.concatenated_transcript ?? undefined,
    summary: detail.summary ?? undefined,
    priceUsd: typeof detail.price === "number" ? detail.price : 0,
    estimatedMinutes: minutes,
    createdAt: draft.createdAt,
    completedAt: done ? new Date().toISOString() : undefined,
    errorMessage: detail.error_message ?? undefined,
    liveCallId: detail.call_id || detail.c_id,
  };
}

export async function sendBlandCall(
  draft: CallDraft,
  apiKey: string,
): Promise<{ callId: string } | { error: string }> {
  const response = await fetch(`${BLAND_API_BASE}${BLAND_SEND_PATH}`, {
    method: "POST",
    headers: blandHeaders(apiKey),
    body: JSON.stringify(buildSendCallBody(draft)),
  });
  let payload: BlandSendResponse = {};
  try {
    payload = (await response.json()) as BlandSendResponse;
  } catch {
    payload = { message: await response.text() };
  }
  if (!response.ok || !payload.call_id) {
    return {
      error: blandErrorMessage(
        payload,
        `Bland send-call failed (${response.status})`,
      ),
    };
  }
  return { callId: payload.call_id };
}

export async function getBlandCall(
  callId: string,
  apiKey: string,
): Promise<{ detail: BlandCallDetail } | { error: string }> {
  const response = await fetch(`${BLAND_API_BASE}/calls/${callId}`, {
    headers: blandHeaders(apiKey),
    cache: "no-store",
  });
  let payload: BlandCallDetail & BlandSendResponse = {};
  try {
    payload = (await response.json()) as BlandCallDetail & BlandSendResponse;
  } catch {
    return { error: `Bland call details failed (${response.status})` };
  }
  if (!response.ok) {
    return {
      error: blandErrorMessage(payload, `Bland call details failed (${response.status})`),
    };
  }
  return { detail: payload };
}
