import { describe, expect, test } from "bun:test";
import {
  captionsFor,
  currentBeatIndex,
  formatClock,
  sanitizePlan,
  splitClauses,
  stubPlan,
} from "@/lib/beats";
import { DEFAULT_NARRATION } from "@/lib/catalog";

describe("splitClauses", () => {
  test("splits two sentences", () => {
    expect(splitClauses(DEFAULT_NARRATION)).toEqual([
      "A lantern drifts across the river",
      "The night remembers every brushstroke",
    ]);
  });

  test("empty input falls back to the default line", () => {
    expect(splitClauses("   ")).toEqual([DEFAULT_NARRATION]);
  });
});

describe("captionsFor", () => {
  test("storytime always has three acts", () => {
    const captions = captionsFor(DEFAULT_NARRATION, "monet", "storytime");
    expect(captions).toHaveLength(3);
    expect(captions[2]).toContain("Water");
  });

  test("whiteboard numbers the steps", () => {
    const captions = captionsFor("First the grid. Then the circle finds the square.", "bauhaus", "whiteboard");
    expect(captions[0]?.startsWith("1. ")).toBe(true);
    expect(captions.some((line) => line.includes("Form"))).toBe(true);
  });

  test("vox opens with a question", () => {
    const captions = captionsFor(
      "Who carved the wave before the mountain? The printer did, one block at a time.",
      "ukiyo",
      "vox",
    );
    expect(captions[0]?.includes("?")).toBe(true);
    expect(captions).toHaveLength(3);
  });

  test("kinetic chunks the line", () => {
    const captions = captionsFor(
      "Coins hop out of the brick. The pipe leads somewhere louder.",
      "eightbit",
      "kinetic",
    );
    expect(captions.length).toBeGreaterThanOrEqual(3);
    expect(captions.every((line) => line.split(/\s+/).length <= 3)).toBe(true);
  });
});

describe("stubPlan", () => {
  test("is deterministic", () => {
    const a = stubPlan({
      narration: DEFAULT_NARRATION,
      style: "monet",
      structure: "storytime",
    });
    const b = stubPlan({
      narration: DEFAULT_NARRATION,
      style: "monet",
      structure: "storytime",
    });
    expect(a).toEqual(b);
    expect(a.beats.length).toBe(3);
    expect(a.duration).toBeGreaterThan(a.beats[a.beats.length - 1].at);
  });
});

describe("currentBeatIndex", () => {
  test("tracks the last beat at or before time", () => {
    const beats = [
      { at: 0.3, caption: "a", motif: "rise" as const },
      { at: 3, caption: "b", motif: "pan" as const },
    ];
    expect(currentBeatIndex(beats, 0)).toBe(0);
    expect(currentBeatIndex(beats, 3.2)).toBe(1);
    expect(currentBeatIndex([], 1)).toBe(-1);
  });
});

describe("sanitizePlan", () => {
  const fallback = stubPlan({
    narration: DEFAULT_NARRATION,
    style: "cave",
    structure: "storytime",
  });

  test("rejects empty payloads", () => {
    expect(sanitizePlan(null, fallback)).toEqual(fallback);
    expect(sanitizePlan({ beats: [] }, fallback)).toEqual(fallback);
  });

  test("keeps valid live beats", () => {
    const plan = sanitizePlan(
      {
        title: "Live night",
        duration: 10,
        beats: [{ at: 0.5, caption: "The swirl starts", motif: "pulse" }],
      },
      fallback,
    );
    expect(plan.title).toBe("Live night");
    expect(plan.beats).toHaveLength(1);
    expect(plan.beats[0].motif).toBe("pulse");
  });
});

describe("formatClock", () => {
  test("formats tenths", () => {
    expect(formatClock(8.2)).toBe("0:08.2");
  });
});
