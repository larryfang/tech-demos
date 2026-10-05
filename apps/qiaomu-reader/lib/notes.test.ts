import { describe, expect, test } from "bun:test";
import { HARBOR_TALK } from "@/lib/fixtures";
import { buildMarkdown, noteFilename } from "@/lib/notes";

const DATE = new Date("2026-10-05T12:00:00.000Z");

describe("noteFilename", () => {
  test("prefixes an iso date and slugs the title", () => {
    expect(noteFilename(HARBOR_TALK, DATE)).toBe("2026-10-05-the-90-second-tasting-menu.md");
  });
});

describe("buildMarkdown", () => {
  test("emits Obsidian frontmatter plus clips and asks", () => {
    const md = buildMarkdown({
      talk: HARBOR_TALK,
      date: DATE,
      freeform: "Protect the pass.",
      clips: [
        {
          id: "c1",
          start: 33,
          en: "The pass is a scheduler.",
          zh: "出餐台是调度器。",
          comment: "Queueing, not poetry.",
        },
      ],
      asks: [
        {
          id: "a1",
          selection: "The pass is a scheduler.",
          question: "Why?",
          answer: "Latency budget.",
          mode: "fixture",
        },
      ],
    });

    expect(md).toContain("title: The 90-second tasting menu");
    expect(md).toContain("source: fixture:harbor-tasting");
    expect(md).toContain("tags:");
    expect(md).toContain("### 00:33 — The pass is a scheduler.");
    expect(md).toContain("> Queueing, not poetry.");
    expect(md).toContain("**Answer (fixture):** Latency budget.");
    expect(md).toContain("Protect the pass.");
  });
});
