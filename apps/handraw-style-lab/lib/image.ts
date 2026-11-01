export function isLiveAvailable(): boolean {
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}

export function imageConfig() {
  return {
    apiKey: process.env.OPENAI_API_KEY?.trim() ?? "",
    baseUrl: (process.env.OPENAI_BASE_URL?.trim() || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    ),
    model: process.env.OPENAI_IMAGE_MODEL?.trim() || "dall-e-3",
  };
}

export async function generateImage(prompt: string): Promise<{ image: string; mime: string }> {
  const { apiKey, baseUrl, model } = imageConfig();
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const response = await fetch(`${baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model,
      prompt,
      size: "1024x1024",
      n: 1,
    }),
  });

  const payload = (await response.json()) as {
    error?: { message?: string };
    data?: Array<{ b64_json?: string; url?: string }>;
  };

  if (!response.ok) {
    throw new Error(payload.error?.message || `Image API ${response.status}`);
  }

  const first = payload.data?.[0];
  if (first?.b64_json) {
    return { image: `data:image/png;base64,${first.b64_json}`, mime: "image/png" };
  }
  if (first?.url) {
    return { image: first.url, mime: "image/url" };
  }
  throw new Error("Image API returned no image");
}
