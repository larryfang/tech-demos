import { SinchClient } from "@sinch/sdk-core";
import type { ConfigState } from "./types";

/**
 * Credentials are read from the environment, never from the client:
 * - Unified (OAuth, US/EU regions): SINCH_PROJECT_ID + SINCH_KEY_ID + SINCH_KEY_SECRET
 * - Service plan (API token, all regions): SINCH_SERVICE_PLAN_ID + SINCH_API_TOKEN
 * Optional: SINCH_SMS_REGION (default "us"), SINCH_FROM_NUMBER (default sender).
 */
export function getConfigState(): ConfigState {
  const region = process.env.SINCH_SMS_REGION ?? "us";
  const defaultFrom = process.env.SINCH_FROM_NUMBER ?? null;

  const unified = {
    SINCH_PROJECT_ID: process.env.SINCH_PROJECT_ID,
    SINCH_KEY_ID: process.env.SINCH_KEY_ID,
    SINCH_KEY_SECRET: process.env.SINCH_KEY_SECRET,
  };
  const servicePlan = {
    SINCH_SERVICE_PLAN_ID: process.env.SINCH_SERVICE_PLAN_ID,
    SINCH_API_TOKEN: process.env.SINCH_API_TOKEN,
  };

  if (Object.values(unified).every(Boolean)) {
    return { configured: true, mode: "unified", missing: [], region, defaultFrom };
  }
  if (Object.values(servicePlan).every(Boolean)) {
    return { configured: true, mode: "servicePlan", missing: [], region, defaultFrom };
  }

  // Report the credential set the user got furthest with; default to unified.
  const servicePlanStarted = Object.values(servicePlan).some(Boolean);
  const missing = servicePlanStarted
    ? Object.entries(servicePlan).filter(([, v]) => !v).map(([k]) => k)
    : Object.entries(unified).filter(([, v]) => !v).map(([k]) => k);

  return { configured: false, mode: null, missing, region, defaultFrom };
}

let client: SinchClient | null = null;

/** Returns a live Sinch client, or null when credentials are not configured. */
export function getSinchClient(): SinchClient | null {
  if (client) return client;
  const state = getConfigState();
  if (!state.configured) return null;

  client =
    state.mode === "unified"
      ? new SinchClient({
          projectId: process.env.SINCH_PROJECT_ID!,
          keyId: process.env.SINCH_KEY_ID!,
          keySecret: process.env.SINCH_KEY_SECRET!,
          smsRegion: state.region,
        })
      : new SinchClient({
          servicePlanId: process.env.SINCH_SERVICE_PLAN_ID!,
          apiToken: process.env.SINCH_API_TOKEN!,
          smsRegion: state.region,
        });
  return client;
}
