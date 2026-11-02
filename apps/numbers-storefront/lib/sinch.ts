import "server-only";
import { SinchClient } from "@sinch/sdk-core";

const REQUIRED_ENV_VARS = [
  "SINCH_PROJECT_ID",
  "SINCH_KEY_ID",
  "SINCH_KEY_SECRET",
] as const;

export function missingEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter((name) => !process.env[name]);
}

let client: SinchClient | null = null;

/** Returns a configured Sinch client, or null when credentials are absent. */
export function getSinchClient(): SinchClient | null {
  if (missingEnvVars().length > 0) return null;
  if (!client) {
    client = new SinchClient({
      projectId: process.env.SINCH_PROJECT_ID!,
      keyId: process.env.SINCH_KEY_ID!,
      keySecret: process.env.SINCH_KEY_SECRET!,
    });
  }
  return client;
}

export function credentialsRequiredResponse(): Response {
  return Response.json(
    {
      error: `Sinch credentials are not configured. Set ${missingEnvVars().join(
        ", ",
      )} and restart the server.`,
      code: "credentials_required",
    },
    { status: 503 },
  );
}

/** Normalizes errors thrown by the Sinch SDK into a JSON response. */
export async function sinchErrorResponse(err: unknown): Promise<Response> {
  let message = err instanceof Error ? err.message : String(err);
  // The SDK throws GenericError whose message embeds "[status: NNN]", and
  // sometimes carries the raw Response from fetch.
  let status = Number(message.match(/\[status: (\d{3})\]/)?.[1] ?? 502);
  if (status < 400) status = 502;
  if (err && typeof err === "object" && "response" in err) {
    const response = (err as { response: unknown }).response;
    if (response instanceof Response) {
      status = response.status >= 400 ? response.status : 502;
      try {
        const body = await response.clone().text();
        if (body) message = body;
      } catch {
        // keep the original message
      }
    }
  }
  return Response.json(
    { error: message, code: "sinch_api_error" },
    { status },
  );
}
