import { describe, expect, test } from "bun:test";
import { fixtureStream } from "./fixtures";
import { suggestWinner, toResultRow } from "./compare";
import { applyEvents } from "./uhp";

describe("compare", () => {
  test("suggests the cheapest completed harness", () => {
    const rows = (["codex", "claude-code", "hermes"] as const).map((id) =>
      toResultRow(applyEvents(id, fixtureStream("slugify", id, "slugify").map((row) => row.event))),
    );
    expect(suggestWinner(rows)).toBe("hermes");
    expect(rows.find((row) => row.harnessId === "hermes")?.costUsd).toBe(0.004);
  });

  test("ignores a failed lane when picking a winner", () => {
    const rows = (["codex", "hermes"] as const).map((id) =>
      toResultRow(applyEvents(id, fixtureStream("softdelete", id, "soft delete").map((row) => row.event))),
    );
    expect(rows.find((row) => row.harnessId === "hermes")?.status).toBe("failed");
    expect(suggestWinner(rows)).toBe("codex");
  });
});
