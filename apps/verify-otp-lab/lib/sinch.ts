import "server-only";
import {
  RequestFailedError,
  SinchClient,
  VerificationService,
} from "@sinch/sdk-core";

export const REQUIRED_ENV_VARS = [
  "SINCH_APPLICATION_KEY",
  "SINCH_APPLICATION_SECRET",
] as const;

export function missingEnvVars(): string[] {
  return REQUIRED_ENV_VARS.filter((name) => !process.env[name]?.trim());
}

export function isConfigured(): boolean {
  return missingEnvVars().length === 0;
}

let cached: VerificationService | null = null;

/**
 * The Verification API authenticates with an Application key/secret pair
 * (not project-level OAuth2). Returns null when credentials are absent so
 * callers can surface a "credentials required" state instead of failing.
 */
export function getVerificationService(): VerificationService | null {
  if (!isConfigured()) return null;
  if (!cached) {
    cached = new SinchClient({
      applicationKey: process.env.SINCH_APPLICATION_KEY!,
      applicationSecret: process.env.SINCH_APPLICATION_SECRET!,
    }).verification;
  }
  return cached;
}

export function credentialsRequiredResponse() {
  return Response.json(
    {
      error: "credentials_required",
      message:
        "Sinch credentials are not configured on the server. Set the missing environment variables and restart.",
      missing: missingEnvVars(),
    },
    { status: 503 },
  );
}

/**
 * Normalizes SDK/API errors into a JSON response, passing the real Sinch
 * error payload through verbatim when one exists.
 */
export function sinchErrorResponse(error: unknown): Response {
  if (error instanceof RequestFailedError) {
    let sinchBody: unknown = error.data ?? null;
    if (typeof sinchBody === "string") {
      try {
        sinchBody = JSON.parse(sinchBody);
      } catch {
        // keep the raw string body
      }
    }
    return Response.json(
      {
        error: "sinch_api_error",
        status: error.statusCode,
        message: error.message,
        sinch: sinchBody,
      },
      { status: error.statusCode >= 400 ? error.statusCode : 502 },
    );
  }
  const message = error instanceof Error ? error.message : String(error);
  return Response.json({ error: "request_failed", message }, { status: 502 });
}
