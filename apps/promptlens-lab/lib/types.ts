export const SCENE_TAGS = [
  "portrait",
  "product",
  "ui",
  "landscape",
  "illustration",
  "architecture",
  "mixed",
] as const;

export type SceneTag = (typeof SCENE_TAGS)[number];

export type AnalyzeMode = "fixture" | "live";
export type AnalyzeSource = "fixture" | "upload" | "paste";

export type StructuredPrompt = {
  scene: SceneTag;
  aspect: string;
  subject: string;
  setting: string;
  composition: string;
  lighting: string;
  palette: string[];
  materials: string[];
  style: string;
  camera: string;
};

export type PromptPack = {
  scene: SceneTag;
  chinese: string;
  english: string;
  json: StructuredPrompt;
  negativeChinese: string;
  negativeEnglish: string;
};

export type AnalyzeRequest = {
  fixtureId?: string;
  image?: string;
  filename?: string;
  source?: AnalyzeSource;
  live?: boolean;
};

export type AnalyzeResult = {
  ok: true;
  mode: AnalyzeMode;
  liveAvailable: boolean;
  source: AnalyzeSource;
  fixtureId?: string;
  scene: SceneTag;
  prompts: {
    chinese: string;
    english: string;
    json: string;
    negativeChinese: string;
    negativeEnglish: string;
  };
  fallbackReason?: string;
};

export type AnalyzeError = {
  ok: false;
  liveAvailable: boolean;
  error: string;
};

export type StatusSnapshot = {
  liveAvailable: boolean;
  mode: "fixture" | "live-ready";
};
