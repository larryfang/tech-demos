import { SCENE_TAGS, type PromptPack, type SceneTag, type StructuredPrompt } from "@/lib/types";

export function isLiveAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function visionConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.OPENAI_VISION_MODEL?.trim() || "gpt-4o-mini",
  };
}

const SYSTEM_PROMPT = `You reverse an image into prompts for text-to-image models.
Return ONLY compact JSON with this shape:
{
  "scene": "portrait|product|ui|landscape|illustration|architecture|mixed",
  "chinese": "one Chinese generation prompt",
  "english": "one English generation prompt",
  "json": {
    "scene": "same scene tag",
    "aspect": "e.g. 3:4",
    "subject": "",
    "setting": "",
    "composition": "",
    "lighting": "",
    "palette": ["..."],
    "materials": ["..."],
    "style": "",
    "camera": ""
  },
  "negativeChinese": "comma-separated Chinese negatives",
  "negativeEnglish": "comma-separated English negatives"
}
Describe what is visible. Do not invent logos or readable on-image text that is not there.
Chinese and English prompts must be generation-ready, not captions.`;

type VisionJson = {
  scene?: string;
  chinese?: string;
  english?: string;
  json?: Partial<StructuredPrompt> & { palette?: unknown; materials?: unknown };
  negativeChinese?: string;
  negativeEnglish?: string;
};

function asScene(value: unknown, fallback: SceneTag): SceneTag {
  return typeof value === "string" && (SCENE_TAGS as readonly string[]).includes(value)
    ? (value as SceneTag)
    : fallback;
}

function asStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return fallback;
  const items = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return items.length > 0 ? items : fallback;
}

export function parseVisionJson(raw: string): PromptPack {
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new Error("Vision model did not return JSON");
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as VisionJson;
  const scene = asScene(parsed.scene ?? parsed.json?.scene, "mixed");
  const json: StructuredPrompt = {
    scene: asScene(parsed.json?.scene, scene),
    aspect: String(parsed.json?.aspect ?? "1:1"),
    subject: String(parsed.json?.subject ?? ""),
    setting: String(parsed.json?.setting ?? ""),
    composition: String(parsed.json?.composition ?? ""),
    lighting: String(parsed.json?.lighting ?? ""),
    palette: asStringArray(parsed.json?.palette, ["source-led"]),
    materials: asStringArray(parsed.json?.materials, ["source-led"]),
    style: String(parsed.json?.style ?? ""),
    camera: String(parsed.json?.camera ?? ""),
  };
  if (!parsed.chinese || !parsed.english) {
    throw new Error("Vision model omitted language prompts");
  }
  return {
    scene,
    chinese: parsed.chinese,
    english: parsed.english,
    json,
    negativeChinese: parsed.negativeChinese || "水印，畸形，低分辨率",
    negativeEnglish: parsed.negativeEnglish || "watermark, deformed, low resolution",
  };
}

export async function analyzeWithVision(imageDataUrl: string): Promise<PromptPack> {
  const { apiKey, baseUrl, model } = visionConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  if (!imageDataUrl.startsWith("data:image/")) {
    throw new Error("Live analyze needs a data-URL image");
  }

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Analyze this image and return the JSON object." },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ],
        },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Vision API ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error("Vision API returned an empty completion");
  }
  return parseVisionJson(content);
}
