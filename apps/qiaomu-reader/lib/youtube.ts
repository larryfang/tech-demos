const ID_RE = /^[\w-]{6,16}$/;

export function parseYouTubeInput(raw: string): string | null {
  const input = raw.trim();
  if (!input) return null;

  if (ID_RE.test(input) && !input.includes(".")) return input;

  try {
    const withProto = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    const url = new URL(withProto);
    const host = url.hostname.replace(/^www\./, "");

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id && ID_RE.test(id) ? id : null;
    }

    if (host === "youtube.com" || host === "m.youtube.com" || host === "music.youtube.com") {
      const fromQuery = url.searchParams.get("v");
      if (fromQuery && ID_RE.test(fromQuery)) return fromQuery;

      const parts = url.pathname.split("/").filter(Boolean);
      if (
        (parts[0] === "embed" || parts[0] === "shorts" || parts[0] === "live" || parts[0] === "v") &&
        parts[1] &&
        ID_RE.test(parts[1])
      ) {
        return parts[1];
      }
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeEmbedSrc(id: string, start = 0): string {
  const params = new URLSearchParams({
    enablejsapi: "1",
    rel: "0",
    modestbranding: "1",
    playsinline: "1",
  });
  if (start > 0) params.set("start", String(Math.floor(start)));
  return `https://www.youtube.com/embed/${id}?${params.toString()}`;
}
