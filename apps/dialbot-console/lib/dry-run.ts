import type { CallDraft, CallRecord, TranscriptLine } from "@/lib/types";
import { normalizePhone } from "@/lib/phone";

/** Bland's documented public rate is about $0.09 / minute. */
export const DRY_RUN_RATE_PER_MINUTE = 0.09;

export function estimateMinutes(task: string): number {
  const words = task.trim().split(/\s+/).filter(Boolean).length;
  const minutes = Math.min(2.5, Math.max(0.5, 0.5 + words / 80));
  return Math.round(minutes * 100) / 100;
}

export function estimateCostUsd(minutes: number): number {
  return Math.round(minutes * DRY_RUN_RATE_PER_MINUTE * 1000) / 1000;
}

function nowIso(offsetMs = 0): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

function linesToConcat(lines: TranscriptLine[]): string {
  return lines.map((line) => `${line.user}: ${line.text}`).join("\n");
}

function scenarioLines(draft: CallDraft): {
  opening: TranscriptLine[];
  middle: TranscriptLine[];
  closing: TranscriptLine[];
  summary: string;
} {
  const task = draft.task.toLowerCase();
  const greeting =
    draft.firstSentence?.trim() ||
    "Hi, this is an assistant calling on behalf of a customer. Do you have a moment?";
  const wait = Boolean(draft.waitForGreeting);

  const opening: TranscriptLine[] = wait
    ? [
        { user: "user", text: "Hello?", createdAt: nowIso(800) },
        { user: "assistant", text: greeting, createdAt: nowIso(2200) },
      ]
    : [
        { user: "assistant", text: greeting, createdAt: nowIso(800) },
        { user: "user", text: "Yes, who is this?", createdAt: nowIso(2600) },
      ];

  let middle: TranscriptLine[];
  let closing: TranscriptLine[];
  let summary: string;

  if (/(restaurant|dinner|table|reservation|book)/.test(task)) {
    middle = [
      {
        user: "assistant",
        text: "I'd like to book a table for two tomorrow at 7:30pm, under Alex Chen. Patio seating if you have it.",
        createdAt: nowIso(5000),
      },
      {
        user: "user",
        text: "We can do 7:30 on the patio. I'll put Alex Chen down for two.",
        createdAt: nowIso(8200),
      },
    ];
    closing = [
      {
        user: "assistant",
        text: "Perfect — two at 7:30 tomorrow on the patio, name Alex Chen. Thank you.",
        createdAt: nowIso(11000),
      },
      { user: "user", text: "You're all set. See you then.", createdAt: nowIso(13000) },
    ];
    summary =
      "Dry-run: booked a table for two tomorrow at 7:30pm under Alex Chen, patio seating confirmed.";
  } else if (/(dentist|doctor|appointment|clinic|dental)/.test(task)) {
    middle = [
      {
        user: "assistant",
        text: "I'm calling to confirm tomorrow's 10am appointment and ask if we should arrive early for paperwork.",
        createdAt: nowIso(5000),
      },
      {
        user: "user",
        text: "Yes, still on the book. Fifteen minutes early is plenty.",
        createdAt: nowIso(8000),
      },
    ];
    closing = [
      {
        user: "assistant",
        text: "Great, we'll be there at 9:45. Thanks for confirming.",
        createdAt: nowIso(11000),
      },
    ];
    summary = "Dry-run: confirmed the appointment and noted a 9:45 arrival.";
  } else {
    middle = [
      {
        user: "assistant",
        text: `Calling about this task: ${draft.task.slice(0, 180)}${draft.task.length > 180 ? "…" : ""}`,
        createdAt: nowIso(5000),
      },
      {
        user: "user",
        text: "Got it — I can help with that. Let's mark it done.",
        createdAt: nowIso(8000),
      },
    ];
    closing = [
      {
        user: "assistant",
        text: "Thanks, that's all I needed. Have a good one.",
        createdAt: nowIso(11000),
      },
    ];
    summary = `Dry-run: completed the outbound task using the ${draft.voice} voice.`;
  }

  return { opening, middle, closing, summary };
}

export function buildDryRunCall(draft: CallDraft, fallbackReason?: string): CallRecord {
  const createdAt = nowIso();
  const { opening, middle, closing, summary } = scenarioLines(draft);
  const transcripts = [...opening, ...middle, ...closing];
  const estimatedMinutes = estimateMinutes(draft.task);
  const phoneNumber = normalizePhone(draft.phoneNumber);

  return {
    id: `dry-${crypto.randomUUID()}`,
    mode: "dry-run",
    status: "completed",
    phoneNumber,
    task: draft.task.trim(),
    voice: draft.voice.trim() || "Maya",
    firstSentence: draft.firstSentence?.trim() || undefined,
    waitForGreeting: Boolean(draft.waitForGreeting),
    transcripts,
    concatenatedTranscript: linesToConcat(transcripts),
    summary,
    priceUsd: estimateCostUsd(estimatedMinutes),
    estimatedMinutes,
    createdAt,
    completedAt: nowIso(14000),
    fallbackReason,
  };
}
