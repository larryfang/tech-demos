import { describe, expect, test } from "bun:test";
import { resolveTask } from "./catalog";

describe("resolveTask", () => {
  test("uses a sample prompt when the id is known", () => {
    const task = resolveTask({ taskId: "slugify" });
    expect(task.id).toBe("slugify");
    expect(task.fixtureId).toBe("slugify");
    expect(task.prompt).toContain("slugify");
  });

  test("maps a custom schema prompt onto softdelete fixtures", () => {
    const task = resolveTask({ prompt: "Please add soft-delete to the users table" });
    expect(task.id).toBe("custom");
    expect(task.fixtureId).toBe("softdelete");
  });

  test("rejects an empty prompt", () => {
    expect(() => resolveTask({})).toThrow("Enter a coding task");
  });
});
