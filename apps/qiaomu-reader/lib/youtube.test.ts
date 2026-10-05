import { describe, expect, test } from "bun:test";
import { parseYouTubeInput, youtubeEmbedSrc } from "@/lib/youtube";

describe("parseYouTubeInput", () => {
  test("reads watch, short, embed, and raw ids", () => {
    expect(parseYouTubeInput("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBe("dQw4w9WgXcQ");
    expect(parseYouTubeInput("https://youtu.be/smpHarbor01")).toBe("smpHarbor01");
    expect(parseYouTubeInput("youtube.com/embed/smpBookLab1")).toBe("smpBookLab1");
    expect(parseYouTubeInput("https://www.youtube.com/shorts/abcdefghijk")).toBe("abcdefghijk");
    expect(parseYouTubeInput("smpHarbor01")).toBe("smpHarbor01");
  });

  test("rejects empty or unrelated text", () => {
    expect(parseYouTubeInput("")).toBeNull();
    expect(parseYouTubeInput("https://example.com/watch?v=abc")).toBeNull();
    expect(parseYouTubeInput("not a url")).toBeNull();
  });
});

describe("youtubeEmbedSrc", () => {
  test("enables the iframe API", () => {
    expect(youtubeEmbedSrc("dQw4w9WgXcQ", 12)).toContain("enablejsapi=1");
    expect(youtubeEmbedSrc("dQw4w9WgXcQ", 12)).toContain("start=12");
  });
});
