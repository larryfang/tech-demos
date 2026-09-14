import { describe, expect, test } from "bun:test";
import { buildDryRunCall, estimateCostUsd, estimateMinutes } from "@/lib/dry-run";
import { isE164, normalizePhone } from "@/lib/phone";
import { buildSendCallBody } from "@/lib/bland";

const draft = {
  phoneNumber: "5550101234",
  task: "Call Harbor Kitchen and book a dinner reservation for two tomorrow at 7:30.",
  voice: "Maya",
  firstSentence: "Hi, I'm calling to make a dinner reservation.",
  waitForGreeting: true,
};

describe("dry-run", () => {
  test("returns a completed mock transcript and cost estimate", () => {
    const call = buildDryRunCall(draft);
    expect(call.mode).toBe("dry-run");
    expect(call.status).toBe("completed");
    expect(call.phoneNumber).toBe("+15550101234");
    expect(call.transcripts.length).toBeGreaterThan(2);
    expect(call.priceUsd).toBe(estimateCostUsd(call.estimatedMinutes));
    expect(call.summary?.toLowerCase()).toContain("dry-run");
    expect(call.concatenatedTranscript).toContain("assistant:");
  });

  test("estimates minutes from task length and prices at $0.09/min", () => {
    expect(estimateMinutes("short")).toBeGreaterThanOrEqual(0.5);
    expect(estimateCostUsd(1)).toBe(0.09);
  });
});

describe("phone", () => {
  test("normalizes US numbers to E.164", () => {
    expect(normalizePhone("(555) 010-1234")).toBe("+15550101234");
    expect(isE164("+15550101234")).toBe(true);
    expect(isE164("5550101234")).toBe(false);
  });
});

describe("bland request", () => {
  test("shapes the documented send-call body", () => {
    expect(buildSendCallBody(draft)).toEqual({
      phone_number: "+15550101234",
      task: draft.task,
      voice: "Maya",
      first_sentence: draft.firstSentence,
      wait_for_greeting: true,
    });
  });
});
