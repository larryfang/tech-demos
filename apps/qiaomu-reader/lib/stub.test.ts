import { describe, expect, test } from "bun:test";
import { resolveSource } from "@/lib/resolve";
import { stubAnswer, stubTalkForVideo } from "@/lib/stub";

describe("resolveSource", () => {
  test("maps sample aliases onto shipped fixtures", () => {
    const harbor = resolveSource("https://youtu.be/smpHarbor01");
    expect(harbor.ok).toBe(true);
    if (harbor.ok) {
      expect(harbor.talk.id).toBe("harbor-tasting");
      expect(harbor.talk.kind).toBe("fixture");
    }

    const book = resolveSource("smpBookLab1");
    expect(book.ok).toBe(true);
    if (book.ok) expect(book.talk.id).toBe("video-as-book");
  });

  test("unknown youtube ids get a stub talk", () => {
    const resolved = resolveSource("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.talk.kind).toBe("youtube");
      expect(resolved.talk.youtubeId).toBe("dQw4w9WgXcQ");
      expect(resolved.talk.cues[0].en).toContain("dQw4w9WgXcQ");
    }
  });

  test("rejects blank input", () => {
    expect(resolveSource("").ok).toBe(false);
  });
});

describe("stubTalkForVideo", () => {
  test("is deterministic for an id", () => {
    const a = stubTalkForVideo("abcDEF12345");
    const b = stubTalkForVideo("abcDEF12345");
    expect(a.title).toBe(b.title);
    expect(a.cues).toEqual(b.cues);
    expect(a.duration).toBe(64);
  });
});

describe("stubAnswer", () => {
  test("kitchen selection mentions the latency budget", () => {
    const answer = stubAnswer("The pass is a scheduler.", "Why drop a course?");
    expect(answer).toContain("Question: Why drop a course?");
    expect(answer.toLowerCase()).toContain("latency");
    expect(answer).toContain("中文复述");
  });

  test("study-method selection mentions reading", () => {
    const answer = stubAnswer("A transcript beside the player turns time into a page.");
    expect(answer.toLowerCase()).toContain("reading");
  });
});
