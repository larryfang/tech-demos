import { describe, expect, test } from "bun:test";
import {
  LAYOUTS,
  PALETTES,
  STYLES,
  layoutById,
  paletteById,
  styleById,
} from "@/lib/catalog";
import { assemblePair, pickContrastingStyles, surpriseCards } from "@/lib/compose";
import { filterCatalog } from "@/lib/search";

describe("catalog fixtures", () => {
  test("has the planned counts", () => {
    expect(STYLES.length).toBe(36);
    expect(LAYOUTS.length).toBe(15);
    expect(PALETTES.length).toBe(10);
  });

  test("ids are unique", () => {
    const ids = [...STYLES, ...LAYOUTS, ...PALETTES].map((item) => item.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  test("every palette has four hex swatches", () => {
    for (const palette of PALETTES) {
      expect(palette.swatches).toHaveLength(4);
      for (const swatch of palette.swatches) {
        expect(swatch).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    }
  });
});

describe("assemblePair", () => {
  test("includes topic, ids, and both languages", () => {
    const pair = assemblePair({
      topic: "第一杯热可可",
      style: styleById("SL-06"),
      layout: layoutById("LY-06"),
      palette: paletteById("PA-09"),
    });
    expect(pair.zh).toContain("主题：第一杯热可可");
    expect(pair.zh).toContain("SL-06");
    expect(pair.zh).toContain("LY-06");
    expect(pair.zh).toContain("PA-09");
    expect(pair.en).toContain("Topic: 第一杯热可可");
    expect(pair.en).toContain("Burnt-Ink Dry Brush");
    expect(pair.en).toContain("Festival Poster");
    expect(pair.en).toContain("Kiln Clay");
  });

  test("empty topic falls back to the sample", () => {
    const pair = assemblePair({
      topic: "   ",
      style: styleById("SL-01"),
      layout: layoutById("LY-01"),
      palette: paletteById("PA-01"),
    });
    expect(pair.zh).toContain("雨天窗台上的橘猫");
  });
});

describe("surprise", () => {
  test("picks five contrasting families", () => {
    const picked = pickContrastingStyles(STYLES, 5);
    expect(picked).toHaveLength(5);
    const families = picked.map((style) => style.family);
    expect(new Set(families).size).toBe(5);
  });

  test("reuses topic, layout, and palette", () => {
    const cards = surpriseCards({
      topic: "书店夜读",
      styles: STYLES,
      layout: layoutById("LY-12"),
      palette: paletteById("PA-04"),
    });
    expect(cards).toHaveLength(5);
    for (const card of cards) {
      expect(card.pair.zh).toContain("书店夜读");
      expect(card.pair.zh).toContain("LY-12");
      expect(card.pair.en).toContain("Night Indigo");
    }
    expect(new Set(cards.map((card) => card.style.id)).size).toBe(5);
  });
});

describe("filterCatalog", () => {
  test("matches id, english name, and chinese name", () => {
    expect(filterCatalog(STYLES, "SL-33")[0]?.id).toBe("SL-33");
    expect(filterCatalog(STYLES, "blueprint").some((item) => item.id === "SL-33")).toBe(true);
    expect(filterCatalog(LAYOUTS, "四格").some((item) => item.id === "LY-05")).toBe(true);
    expect(filterCatalog(PALETTES, "matcha")[0]?.id).toBe("PA-07");
  });

  test("blank query returns everything", () => {
    expect(filterCatalog(STYLES, "  ")).toHaveLength(STYLES.length);
  });
});
