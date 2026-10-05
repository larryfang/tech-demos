export function isLiveAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function chatConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(/\/$/, ""),
    model: process.env.OPENAI_ASK_MODEL?.trim() || "gpt-4o-mini",
  };
}

const SYSTEM_PROMPT = `You are a study assistant in a bilingual video-transcript lab.
Answer only from the selected transcript lines plus the user's question.
Keep the answer under 120 words. Add one short Chinese recap line at the end prefixed with 中文复述：.
Do not invent timestamps, speakers, or facts that are not in the selection.`;

export async function askLive(selection: string, question?: string): Promise<string> {
  const { apiKey, baseUrl, model } = chatConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const user = [
    `Selection:\n${selection.trim()}`,
    question?.trim() ? `Question:\n${question.trim()}` : "Question:\nExplain this selection as a study note.",
  ].join("\n\n");

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
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
    throw new Error(payload.error?.message || `Ask API ${response.status}`);
  }

  const content = payload.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("Ask API returned an empty completion");
  }
  return content;
}
