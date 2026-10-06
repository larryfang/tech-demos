import { sanitizePlan, stubPlan } from "@/lib/beats";
import { styleLabel, structureLabel } from "@/lib/catalog";
import type { ScenePlan, StructureId, StyleId } from "@/lib/types";

export function isLiveAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function chatConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_BEATS_MODEL?.trim() || "gpt-4o-mini",
  };
}

const SYSTEM_PROMPT = `You write timed scene beats for a short art-style canvas animation.
Return ONLY JSON with this shape:
{"title":"string","duration":number,"beats":[{"at":number,"caption":"string","motif":"rise"|"pan"|"pulse"|"scatter"|"reveal"}]}
Rules:
- 3 to 6 beats
- duration between 8 and 14 seconds
- first beat at >= 0.2
- last beat starts at least 1.4 seconds before the end
- captions <= 90 characters, no markdown
- follow the requested narration structure
- do not mention being an AI`;

export async function composeLive(input: {
  narration: string;
  style: StyleId;
  structure: StructureId;
}): Promise<ScenePlan> {
  const { apiKey, baseUrl, model } = chatConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const fallback = stubPlan(input);
  const user = [
    `Narration:\n${input.narration.trim()}`,
    `Art style: ${styleLabel(input.style)} (${input.style})`,
    `Narration structure: ${structureLabel(input.structure)} (${input.structure})`,
  ].join("\n\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.4,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: user },
      ],
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: Array<{ message?: { content?: string } }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Beats API ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Beats API returned an empty completion");
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    throw new Error("Beats API returned invalid JSON");
  }

  return sanitizePlan(parsed, fallback);
}
