import { SinchClient } from "@sinch/sdk-core";

export const REQUIRED_ENV_VARS = [
  "SINCH_PROJECT_ID",
  "SINCH_KEY_ID",
  "SINCH_KEY_SECRET",
  "SINCH_APP_ID",
] as const;

export type CredentialStatus = {
  configured: boolean;
  region: string;
  vars: Record<(typeof REQUIRED_ENV_VARS)[number], boolean>;
};

export function getCredentialStatus(): CredentialStatus {
  const vars = Object.fromEntries(
    REQUIRED_ENV_VARS.map((name) => [name, Boolean(process.env[name]?.trim())]),
  ) as CredentialStatus["vars"];
  return {
    configured: REQUIRED_ENV_VARS.every((name) => vars[name]),
    region: process.env.SINCH_REGION?.trim() || "us",
    vars,
  };
}

export function getAppId(): string {
  return process.env.SINCH_APP_ID!.trim();
}

let client: SinchClient | null = null;

/** Throws if credentials are missing — callers must check getCredentialStatus() first. */
export function getSinchClient(): SinchClient {
  if (!client) {
    client = new SinchClient({
      projectId: process.env.SINCH_PROJECT_ID!.trim(),
      keyId: process.env.SINCH_KEY_ID!.trim(),
      keySecret: process.env.SINCH_KEY_SECRET!.trim(),
      conversationRegion: process.env.SINCH_REGION?.trim() || "us",
    });
  }
  return client;
}

/** Serialize a real SDK/API error into something we can show verbatim in the UI. */
export function serializeApiError(error: unknown): { message: string; details?: string } {
  if (error instanceof Error) {
    const withExtras = error as Error & { statusCode?: number; data?: unknown };
    const parts: string[] = [];
    if (withExtras.statusCode) parts.push(`HTTP ${withExtras.statusCode}`);
    if (withExtras.data) parts.push(JSON.stringify(withExtras.data));
    return { message: error.message, details: parts.join(" — ") || undefined };
  }
  return { message: String(error) };
}
