import { generateImage, isLiveAvailable } from "@/lib/image";
import type { ImageGenResult } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const liveAvailable = isLiveAvailable();
  try {
    if (!liveAvailable) {
      const payload: ImageGenResult = {
        ok: false,
        error: "Image generation is off. Set OPENAI_API_KEY to enable it.",
      };
      return Response.json(payload, { status: 400 });
    }

    const body = (await request.json()) as { prompt?: string };
    const prompt = body.prompt?.trim();
    if (!prompt) {
      const payload: ImageGenResult = {
        ok: false,
        error: "A prompt is required.",
      };
      return Response.json(payload, { status: 400 });
    }

    const generated = await generateImage(prompt);
    const payload: ImageGenResult = {
      ok: true,
      mode: "live",
      image: generated.image,
      mime: generated.mime,
    };
    return Response.json(payload);
  } catch (error) {
    const payload: ImageGenResult = {
      ok: false,
      error: error instanceof Error ? error.message : "Image generation failed",
    };
    return Response.json(payload, { status: 400 });
  }
}
