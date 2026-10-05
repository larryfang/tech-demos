import { describe, expect, test } from "bun:test";
import { HARBOR_TALK } from "@/lib/fixtures";
import { clampTime, cueIndexAt, formatTimestamp, slugify } from "@/lib/playback";

describe("formatTimestamp", () => {
  test("pads minutes and seconds", () => {
    expect(formatTimestamp(0)).toBe("00:00");
    expect(formatTimestamp(7)).toBe("00:07");
    expect(formatTimestamp(75)).toBe("01:15");
    expect(formatTimestamp(3661)).toBe("1:01:01");
  });
});

describe("cueIndexAt", () => {
  test("tracks the last cue whose start is due", () => {
    expect(cueIndexAt(HARBOR_TALK.cues, 0)).toBe(0);
    expect(cueIndexAt(HARBOR_TALK.cues, 14.9)).toBe(1);
    expect(cueIndexAt(HARBOR_TALK.cues, 15)).toBe(2);
    expect(cueIndexAt(HARBOR_TALK.cues, 200)).toBe(HARBOR_TALK.cues.length - 1);
  });
});

describe("clampTime and slugify", () => {
  test("clamps to the talk duration", () => {
    expect(clampTime(-3, 96)).toBe(0);
    expect(clampTime(40, 96)).toBe(40);
    expect(clampTime(120, 96)).toBe(96);
  });

  test("slugifies titles", () => {
    expect(slugify("The 90-second tasting menu")).toBe("the-90-second-tasting-menu");
    expect(slugify("   ")).toBe("notes");
  });
});
