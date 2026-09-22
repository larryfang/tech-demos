import { FIXTURE_PROMPTS, GENERIC_PROMPTS, getFixture } from "@/lib/fixtures";
import type { AnalyzeSource, PromptPack, SceneTag } from "@/lib/types";

const SCENE_HINTS: Array<[RegExp, SceneTag]> = [
  [/(portrait|face|person|headshot|selfie)/i, "portrait"],
  [/(product|bottle|shoe|watch|pack|sku)/i, "product"],
  [/(ui|dashboard|screen|app|wire|saas)/i, "ui"],
  [/(landscape|mountain|sky|valley|beach|lake|dusk)/i, "landscape"],
  [/(illustrat|poster|comic|sticker)/i, "illustration"],
  [/(arch|building|interior|facade)/i, "architecture"],
];

export function inferScene(filename?: string): SceneTag {
  const name = filename ?? "";
  for (const [pattern, scene] of SCENE_HINTS) {
    if (pattern.test(name)) return scene;
  }
  return "mixed";
}

export function clonePack(pack: PromptPack): PromptPack {
  return {
    ...pack,
    json: {
      ...pack.json,
      palette: [...pack.json.palette],
      materials: [...pack.json.materials],
    },
  };
}

export function stubPack(input: {
  fixtureId?: string;
  filename?: string;
  source?: AnalyzeSource;
}): PromptPack {
  const fixture = getFixture(input.fixtureId);
  if (fixture) {
    return clonePack(FIXTURE_PROMPTS[fixture.id]);
  }
  const scene = inferScene(input.filename);
  return clonePack(GENERIC_PROMPTS[scene]);
}

export function stringifyPack(pack: PromptPack): {
  chinese: string;
  english: string;
  json: string;
  negativeChinese: string;
  negativeEnglish: string;
} {
  return {
    chinese: pack.chinese,
    english: pack.english,
    json: `${JSON.stringify(pack.json, null, 2)}\n`,
    negativeChinese: pack.negativeChinese,
    negativeEnglish: pack.negativeEnglish,
  };
}
