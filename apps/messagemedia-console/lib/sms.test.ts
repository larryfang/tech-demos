import { expect, test } from "bun:test";
import { isE164, segmentInfo } from "./sms";

test("E.164 validation", () => {
  expect(isE164("+61491570156")).toBe(true);
  expect(isE164("0491570156")).toBe(false);
  expect(isE164("+0123456789")).toBe(false);
});

test("GSM-7 segments, with extension chars counting double", () => {
  expect(segmentInfo("a".repeat(160))).toMatchObject({ encoding: "GSM-7", segments: 1 });
  expect(segmentInfo("a".repeat(161))).toMatchObject({ encoding: "GSM-7", segments: 2 });
  expect(segmentInfo("€".repeat(80))).toMatchObject({ encoding: "GSM-7", units: 160, segments: 1 });
});

test("UCS-2 segments for non-GSM text", () => {
  expect(segmentInfo("héllo 👋")).toMatchObject({ encoding: "UCS-2", units: 8, segments: 1 });
  expect(segmentInfo("👋".repeat(36))).toMatchObject({ encoding: "UCS-2", units: 72, segments: 2 });
});
