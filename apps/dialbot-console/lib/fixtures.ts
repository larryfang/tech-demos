import type { CallRecord } from "@/lib/types";

export const DEFAULT_DRAFT_TASK =
  "You are Dialbot, calling Harbor Kitchen to book a table for two tomorrow at 7:30pm under Alex Chen. Confirm the reservation and ask about patio seating. If they are full, take the next available time after 7pm. Be brief and polite.";

export const FIXTURE_CALLS: CallRecord[] = [
  {
    id: "fix-harbor",
    mode: "dry-run",
    status: "completed",
    phoneNumber: "+15550101010",
    task: DEFAULT_DRAFT_TASK,
    voice: "Maya",
    firstSentence: "Hi, I'm calling to make a dinner reservation.",
    waitForGreeting: true,
    transcripts: [
      { user: "user", text: "Harbor Kitchen, how can I help you?" },
      {
        user: "assistant",
        text: "Hi, I'm calling to make a dinner reservation.",
      },
      {
        user: "assistant",
        text: "A table for two tomorrow at 7:30pm under Alex Chen — patio if you have it.",
      },
      {
        user: "user",
        text: "Patio at 7:30 works. You're booked.",
      },
      {
        user: "assistant",
        text: "Wonderful. Two at 7:30 tomorrow on the patio, Alex Chen. Thank you.",
      },
    ],
    concatenatedTranscript:
      "user: Harbor Kitchen, how can I help you?\nassistant: Hi, I'm calling to make a dinner reservation.\nassistant: A table for two tomorrow at 7:30pm under Alex Chen — patio if you have it.\nuser: Patio at 7:30 works. You're booked.\nassistant: Wonderful. Two at 7:30 tomorrow on the patio, Alex Chen. Thank you.",
    summary:
      "Booked two for 7:30pm tomorrow at Harbor Kitchen under Alex Chen, patio seating.",
    priceUsd: 0.072,
    estimatedMinutes: 0.8,
    createdAt: "2026-09-13T18:12:00.000Z",
    completedAt: "2026-09-13T18:12:48.000Z",
  },
  {
    id: "fix-dental",
    mode: "dry-run",
    status: "completed",
    phoneNumber: "+15550101919",
    task: "Call Northside Dental to confirm Jordan Lee's cleaning tomorrow at 10am. Ask if they should arrive early.",
    voice: "Josh",
    firstSentence: "Hi, calling to confirm an appointment.",
    transcripts: [
      { user: "assistant", text: "Hi, calling to confirm an appointment." },
      { user: "user", text: "Sure — name and time?" },
      {
        user: "assistant",
        text: "Jordan Lee, cleaning tomorrow at 10am. Should they arrive early?",
      },
      {
        user: "user",
        text: "Confirmed. Fifteen minutes early is enough.",
      },
    ],
    concatenatedTranscript:
      "assistant: Hi, calling to confirm an appointment.\nuser: Sure — name and time?\nassistant: Jordan Lee, cleaning tomorrow at 10am. Should they arrive early?\nuser: Confirmed. Fifteen minutes early is enough.",
    summary: "Confirmed Jordan Lee's 10am cleaning; arrive at 9:45.",
    priceUsd: 0.054,
    estimatedMinutes: 0.6,
    createdAt: "2026-09-12T15:40:00.000Z",
    completedAt: "2026-09-12T15:40:36.000Z",
  },
];

export const VOICES = ["Maya", "Josh", "Florian", "Derek", "June", "Nat", "Paige"] as const;
