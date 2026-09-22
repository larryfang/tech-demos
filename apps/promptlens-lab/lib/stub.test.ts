import { describe, expect, test } from "bun:test";
import { FIXTURE_PROMPTS } from "@/lib/fixtures";
import { inferScene, stringifyPack, stubPack } from "@/lib/stub";
import { parseVisionJson } from "@/lib/vision";

describe("inferScene", () => {
  test("maps filename hints", () => {
    expect(inferScene("headshot.jpg")).toBe("portrait");
    expect(inferScene("bottle-product.png")).toBe("product");
    expect(inferScene("dashboard-ui.png")).toBe("ui");
    expect(inferScene("lake-dusk.jpg")).toBe("landscape");
    expect(inferScene("random.bin")).toBe("mixed");
  });
});

describe("stubPack", () => {
  test("portrait fixture is deterministic", () => {
    const a = stubPack({ fixtureId: "portrait", source: "fixture" });
    const b = stubPack({ fixtureId: "portrait", source: "fixture" });
    expect(a.scene).toBe("portrait");
    expect(a.chinese).toBe(FIXTURE_PROMPTS.portrait.chinese);
    expect(stringifyPack(a).json).toBe(stringifyPack(b).json);
    expect(stringifyPack(a).json).toContain('"scene": "portrait"');
  });

  test("upload without hints uses mixed generic", () => {
    const pack = stubPack({ filename: "IMG_2048.jpg", source: "upload" });
    expect(pack.scene).toBe("mixed");
    expect(pack.english.toLowerCase()).toContain("composition");
  });
});

describe("parseVisionJson", () => {
  test("accepts fenced model output", () => {
    const pack = parseVisionJson(`Here you go
\`\`\`json
{"scene":"ui","chinese":"浅色仪表盘","english":"light dashboard","json":{"scene":"ui","aspect":"16:10","subject":"app","setting":"desktop","composition":"grid","lighting":"flat","palette":["white"],"materials":["vector"],"style":"ui","camera":"ortho"},"negativeChinese":"水印","negativeEnglish":"watermark"}
\`\`\``);
    expect(pack.scene).toBe("ui");
    expect(pack.chinese).toBe("浅色仪表盘");
  });
});
