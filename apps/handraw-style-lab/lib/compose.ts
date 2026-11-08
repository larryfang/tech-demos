import { DEFAULT_TOPIC } from "@/lib/catalog";
import type { Layout, Palette, PromptPair, Style, SurpriseCard } from "@/lib/types";

export function normalizeTopic(topic: string): string {
  const trimmed = topic.trim();
  return trimmed.length > 0 ? trimmed : DEFAULT_TOPIC;
}

export function assemblePair(input: {
  topic: string;
  style: Style;
  layout: Layout;
  palette: Palette;
}): PromptPair {
  const topic = normalizeTopic(input.topic);
  const { style, layout, palette } = input;

  const zh = [
    `主题：${topic}`,
    `画风：${style.id} · ${style.name.zh}。${style.prompt.zh}。`,
    `构图：${layout.id} · ${layout.name.zh}。${layout.prompt.zh}。`,
    `色彩：${palette.id} · ${palette.name.zh}。${palette.prompt.zh}。`,
    "手绘感优先，避免照片写实和塑料高光。",
  ].join("\n");

  const en = [
    `Topic: ${topic}`,
    `Style: ${style.id} · ${style.name.en}. ${style.prompt.en}.`,
    `Layout: ${layout.id} · ${layout.name.en}. ${layout.prompt.en}.`,
    `Palette: ${palette.id} · ${palette.name.en}. ${palette.prompt.en}.`,
    "Keep it hand-drawn; avoid photorealism and plastic highlights.",
  ].join("\n");

  return { zh, en };
}

export function pickContrastingStyles(styles: Style[], count = 5): Style[] {
  const byFamily = new Map<string, Style[]>();
  for (const style of styles) {
    const bucket = byFamily.get(style.family) ?? [];
    bucket.push(style);
    byFamily.set(style.family, bucket);
  }

  const families = [...byFamily.keys()].sort();
  const picked: Style[] = [];

  for (const family of families) {
    if (picked.length >= count) break;
    const bucket = byFamily.get(family);
    if (bucket?.[0]) picked.push(bucket[0]);
  }

  if (picked.length < count) {
    for (const style of styles) {
      if (picked.length >= count) break;
      if (!picked.some((item) => item.id === style.id)) picked.push(style);
    }
  }

  return picked.slice(0, count);
}

export function surpriseCards(input: {
  topic: string;
  styles: Style[];
  layout: Layout;
  palette: Palette;
  count?: number;
}): SurpriseCard[] {
  return pickContrastingStyles(input.styles, input.count ?? 5).map((style) => ({
    style,
    pair: assemblePair({
      topic: input.topic,
      style,
      layout: input.layout,
      palette: input.palette,
    }),
  }));
}
