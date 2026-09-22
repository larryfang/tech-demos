import { getFixture } from "@/lib/fixtures";
import { fixtureDataUrl } from "@/lib/image";
import { stringifyPack, stubPack } from "@/lib/stub";
import type { AnalyzeError, AnalyzeRequest, AnalyzeResult, AnalyzeSource } from "@/lib/types";
import { analyzeWithVision, isLiveAvailable } from "@/lib/vision";

export const dynamic = "force-dynamic";

function result(input: {
  pack: ReturnType<typeof stubPack>;
  source: AnalyzeSource;
  fixtureId?: string;
  mode: AnalyzeResult["mode"];
  fallbackReason?: string;
}): AnalyzeResult {
  return {
    ok: true,
    mode: input.mode,
    liveAvailable: isLiveAvailable(),
    source: input.source,
    fixtureId: input.fixtureId,
    scene: input.pack.scene,
    prompts: stringifyPack(input.pack),
    fallbackReason: input.fallbackReason,
  };
}

export async function POST(request: Request) {
  const liveAvailable = isLiveAvailable();
  try {
    const body = (await request.json()) as AnalyzeRequest;
    const fixture = getFixture(body.fixtureId);
    const source: AnalyzeSource = fixture ? "fixture" : body.source === "paste" ? "paste" : "upload";
    const stub = stubPack({
      fixtureId: fixture?.id,
      filename: body.filename ?? fixture?.filename,
      source,
    });

    const wantLive = Boolean(body.live) && liveAvailable;
    if (!wantLive) {
      return Response.json(
        result({
          pack: stub,
          source,
          fixtureId: fixture?.id,
          mode: "fixture",
        }),
      );
    }

    try {
      const image = body.image?.startsWith("data:image/")
        ? body.image
        : fixture
          ? await fixtureDataUrl(fixture.id)
          : undefined;
      if (!image) {
        return Response.json(
          result({
            pack: stub,
            source,
            fixtureId: fixture?.id,
            mode: "fixture",
            fallbackReason: "Live vision needs an image data URL or a shipped fixture.",
          }),
        );
      }
      const pack = await analyzeWithVision(image);
      return Response.json(
        result({
          pack,
          source,
          fixtureId: fixture?.id,
          mode: "live",
        }),
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Vision API failed";
      return Response.json(
        result({
          pack: stub,
          source,
          fixtureId: fixture?.id,
          mode: "fixture",
          fallbackReason: message,
        }),
      );
    }
  } catch (error) {
    const payload: AnalyzeError = {
      ok: false,
      liveAvailable,
      error: error instanceof Error ? error.message : "Analyze failed",
    };
    return Response.json(payload, { status: 400 });
  }
}
