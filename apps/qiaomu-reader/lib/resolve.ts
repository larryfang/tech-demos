import { getFixture } from "@/lib/fixtures";
import { stubTalkForVideo } from "@/lib/stub";
import type { ResolvedSource } from "@/lib/types";
import { parseYouTubeInput } from "@/lib/youtube";

export function resolveSource(raw: string): ResolvedSource {
  const input = raw.trim();
  if (!input) return { ok: false, error: "Paste a YouTube URL or pick a sample." };

  const fixture = getFixture(input);
  if (fixture) return { ok: true, talk: fixture, youtubeId: fixture.youtubeId };

  const id = parseYouTubeInput(input);
  if (!id) return { ok: false, error: "Could not read a YouTube id from that URL." };

  const aliased = getFixture(id);
  if (aliased) return { ok: true, talk: aliased, youtubeId: aliased.youtubeId };

  const talk = stubTalkForVideo(id);
  return { ok: true, talk, youtubeId: id };
}
