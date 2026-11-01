export function isLiveAvailable(): boolean {
  return Boolean(process.env.HARNESSROUTER_URL?.trim());
}

export function routerBaseUrl(): string | null {
  const raw = process.env.HARNESSROUTER_URL?.trim();
  if (!raw) return null;
  return raw.replace(/\/$/, "");
}

export function routerHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "text/event-stream, application/json",
  };
  const key = process.env.HARNESSROUTER_API_KEY?.trim();
  if (key) headers.authorization = `Bearer ${key}`;
  return headers;
}

type ListedHarness = {
  id?: string;
  harness_id?: string;
  name?: string;
  title?: string;
  display_name?: string;
};

export async function resolveLiveHarnessId(slug: string): Promise<string> {
  const base = routerBaseUrl();
  if (!base) throw new Error("HARNESSROUTER_URL is not set.");
  try {
    const response = await fetch(`${base}/v1/harnesses`, {
      headers: routerHeaders(),
      cache: "no-store",
    });
    if (!response.ok) return slug;
    const body = (await response.json()) as { harnesses?: ListedHarness[] } | ListedHarness[];
    const list = Array.isArray(body) ? body : (body.harnesses ?? []);
    const needle = slug.toLowerCase().replace(/[-_\s]/g, "");
    const match = list.find((row) => {
      const hay = [row.id, row.harness_id, row.name, row.title, row.display_name]
        .filter(Boolean)
        .join(" ")
        .toLowerCase()
        .replace(/[-_\s]/g, "");
      return hay.includes(needle);
    });
    return match?.id ?? match?.harness_id ?? slug;
  } catch {
    return slug;
  }
}

export async function startLiveResponse(input: {
  prompt: string;
  harnessId: string;
  signal?: AbortSignal;
}): Promise<Response> {
  const base = routerBaseUrl();
  if (!base) throw new Error("HARNESSROUTER_URL is not set.");
  const harnessId = await resolveLiveHarnessId(input.harnessId);
  const response = await fetch(`${base}/v1/responses`, {
    method: "POST",
    headers: routerHeaders(),
    body: JSON.stringify({
      input: input.prompt,
      stream: true,
      metadata: { harness_id: harnessId },
    }),
    signal: input.signal,
    cache: "no-store",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HarnessRouter ${response.status}: ${text.slice(0, 240) || response.statusText}`);
  }
  return response;
}

export async function cancelLiveResponse(responseId: string): Promise<void> {
  const base = routerBaseUrl();
  if (!base || !responseId) return;
  await fetch(`${base}/v1/responses/${encodeURIComponent(responseId)}/cancel`, {
    method: "POST",
    headers: routerHeaders(),
    cache: "no-store",
  }).catch(() => undefined);
}

export function parseSseChunk(buffer: string): { events: unknown[]; rest: string } {
  const events: unknown[] = [];
  const parts = buffer.split("\n\n");
  const rest = parts.pop() ?? "";
  for (const block of parts) {
    const dataLines = block
      .split("\n")
      .filter((line) => line.startsWith("data:"))
      .map((line) => line.slice(5).trim())
      .filter((line) => line && line !== "[DONE]");
    if (dataLines.length === 0) continue;
    const payload = dataLines.join("\n");
    try {
      events.push(JSON.parse(payload));
    } catch {
      events.push({ type: "error", sequence_number: -1, code: "parse_error", message: payload.slice(0, 200) });
    }
  }
  return { events, rest };
}
