import { describe, expect, test } from "bun:test";
import { fixtureStream } from "./fixtures";
import { applyEvents, assertSequence, isTerminalEvent, lineDiff } from "./uhp";

describe("fixture streams", () => {
  const cases = [
    ["slugify", "codex"],
    ["slugify", "claude-code"],
    ["slugify", "hermes"],
    ["softdelete", "codex"],
    ["softdelete", "claude-code"],
    ["softdelete", "hermes"],
  ] as const;

  for (const [taskId, harnessId] of cases) {
    test(`${taskId}/${harnessId} is a valid UHP stream`, () => {
      const timed = fixtureStream(taskId, harnessId, "do the work");
      const events = timed.map((row) => row.event);
      expect(() => assertSequence(events)).not.toThrow();
      expect(events[0]?.type).toBe("response.created");
      expect(isTerminalEvent(events[events.length - 1]!)).toBe(true);
    });
  }

  test("hermes softdelete fails with sandbox_denied", () => {
    const events = fixtureStream("softdelete", "hermes", "soft delete").map((row) => row.event);
    const lane = applyEvents("hermes", events);
    expect(lane.status).toBe("failed");
    expect(lane.error?.code).toBe("sandbox_denied");
    expect(lane.error?.param).toBe("db/schema.sql");
    expect(lane.files).toEqual([]);
  });

  test("codex slugify completes with two files", () => {
    const events = fixtureStream("slugify", "codex", "slugify").map((row) => row.event);
    const lane = applyEvents("codex", events);
    expect(lane.status).toBe("completed");
    expect(lane.files.map((file) => file.path)).toEqual(["src/slugify.ts", "src/slugify.test.ts"]);
    expect(lane.usage?.total_tokens).toBe(3000);
    expect(lane.steps.some((step) => step.kind === "tool" && step.name === "shell")).toBe(true);
    expect(lane.text).toContain("slugify.ts");
  });
});

describe("applyEvent", () => {
  test("concatenates text deltas in order", () => {
    const events = fixtureStream("slugify", "hermes", "slugify").map((row) => row.event);
    const mid = applyEvents(
      "hermes",
      events.filter((event) => event.type !== "response.completed"),
    );
    expect(mid.status).toBe("in_progress");
    const done = applyEvents("hermes", events);
    expect(done.text.length).toBeGreaterThan(20);
    expect(done.status).toBe("completed");
  });
});

describe("lineDiff", () => {
  test("marks a new file as additions", () => {
    const rows = lineDiff("", "one\ntwo");
    expect(rows).toEqual([
      { type: "add", text: "one" },
      { type: "add", text: "two" },
    ]);
  });

  test("keeps equal prefix and shows a changed tail", () => {
    const rows = lineDiff("keep\nold", "keep\nnew");
    expect(rows[0]).toEqual({ type: "eq", text: "keep" });
    expect(rows.some((row) => row.type === "del" && row.text === "old")).toBe(true);
    expect(rows.some((row) => row.type === "add" && row.text === "new")).toBe(true);
  });
});
