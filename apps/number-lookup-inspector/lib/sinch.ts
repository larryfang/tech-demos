import "server-only";

const AUTH_URL = "https://auth.sinch.com/oauth2/token";
const LOOKUP_BASE = "https://lookup.api.sinch.com";

export const LOOKUP_FEATURES = ["LineType", "SimSwap", "VoIPDetection"] as const;

export interface FeatureError {
  status?: number;
  title?: string;
  detail?: string;
  type?: string;
}

export interface LookupResult {
  number: string;
  countryCode?: string;
  traceId?: string;
  line?: {
    carrier?: string;
    type?: string;
    mobileCountryCode?: string;
    mobileNetworkCode?: string;
    ported?: boolean;
    portingDate?: string;
    error?: FeatureError | null;
  } | null;
  simSwap?: {
    swapped?: boolean;
    swapPeriod?: string;
    error?: FeatureError | null;
  } | null;
  voIPDetection?: {
    probability?: "Unknown" | "Low" | "Likely" | "High";
    error?: FeatureError | null;
  } | null;
}

export class SinchApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly detail?: string,
  ) {
    super(message);
  }
}

interface Credentials {
  projectId: string;
  keyId: string;
  keySecret: string;
}

export function getCredentials(): Credentials | null {
  const projectId = process.env.SINCH_PROJECT_ID;
  const keyId = process.env.SINCH_KEY_ID;
  const keySecret = process.env.SINCH_KEY_SECRET;
  if (!projectId || !keyId || !keySecret) return null;
  return { projectId, keyId, keySecret };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(creds: Credentials): Promise<string> {
  // Tokens last 3600s; refresh one minute early.
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token;
  }
  const basic = Buffer.from(`${creds.keyId}:${creds.keySecret}`).toString("base64");
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${basic}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) {
    throw new SinchApiError(
      `Sinch OAuth token request failed (HTTP ${res.status}) — check SINCH_KEY_ID / SINCH_KEY_SECRET`,
      res.status,
      await res.text().catch(() => undefined),
    );
  }
  const data = (await res.json()) as { access_token: string; expires_in?: number };
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };
  return cachedToken.token;
}

function describeHttpError(status: number): string {
  switch (status) {
    case 400:
      return "Bad request — the number must be a single E.164 number with a + prefix";
    case 401:
      return "Unauthorized — token rejected; verify the access key belongs to this project";
    case 402:
      return "Account locked (Sinch returns 402 for locked accounts, not payment)";
    case 403:
      return "Number Lookup API is disabled for this project — declare an intended use case in the Sinch dashboard";
    case 429:
      return "Rate limited by Sinch (429 Too Many Requests)";
    default:
      return `Sinch Number Lookup request failed (HTTP ${status})`;
  }
}

export async function lookupNumber(
  creds: Credentials,
  number: string,
  features: readonly string[] = LOOKUP_FEATURES,
): Promise<LookupResult> {
  const token = await getAccessToken(creds);
  const res = await fetch(
    `${LOOKUP_BASE}/v2/projects/${encodeURIComponent(creds.projectId)}/lookups`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ number, features }),
      cache: "no-store",
    },
  );
  if (!res.ok) {
    throw new SinchApiError(
      describeHttpError(res.status),
      res.status,
      await res.text().catch(() => undefined),
    );
  }
  return (await res.json()) as LookupResult;
}
