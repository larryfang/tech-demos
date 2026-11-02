// Server-side Sinch Fax API v3 client.
// Auth: project-scoped OAuth2 client-credentials (https://auth.sinch.com/oauth2/token),
// API: https://fax.api.sinch.com/v3/projects/{projectId}/...
// Docs: https://developers.sinch.com/docs/fax/

const AUTH_URL = "https://auth.sinch.com/oauth2/token";
const FAX_API_BASE = process.env.SINCH_FAX_API_BASE ?? "https://fax.api.sinch.com/v3";

export interface SinchConfig {
  projectId: string;
  keyId: string;
  keySecret: string;
  from?: string;
}

export function getConfig(): { config: SinchConfig | null; missing: string[] } {
  const projectId = process.env.SINCH_PROJECT_ID;
  const keyId = process.env.SINCH_KEY_ID;
  const keySecret = process.env.SINCH_KEY_SECRET;
  const missing = [
    !projectId && "SINCH_PROJECT_ID",
    !keyId && "SINCH_KEY_ID",
    !keySecret && "SINCH_KEY_SECRET",
  ].filter((v): v is string => Boolean(v));
  if (missing.length > 0) return { config: null, missing };
  return {
    config: { projectId: projectId!, keyId: keyId!, keySecret: keySecret!, from: process.env.SINCH_FAX_FROM },
    missing: [],
  };
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getAccessToken(config: SinchConfig): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60_000) return cachedToken.token;
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${config.keyId}:${config.keySecret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    throw new SinchApiError(res.status, `OAuth token request failed: ${await res.text()}`);
  }
  const data = (await res.json()) as { access_token: string; expires_in: number };
  cachedToken = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return data.access_token;
}

export class SinchApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = "SinchApiError";
  }
}

export interface Fax {
  id: string;
  direction: "OUTBOUND" | "INBOUND";
  status: "QUEUED" | "IN_PROGRESS" | "COMPLETED" | "FAILURE";
  to: string;
  from?: string;
  numberOfPages?: number;
  createTime?: string;
  completedTime?: string;
  errorType?: string;
  errorCode?: number;
  errorMessage?: string;
}

async function sinchFetch(config: SinchConfig, path: string, init?: RequestInit): Promise<Response> {
  const token = await getAccessToken(config);
  const res = await fetch(`${FAX_API_BASE}/projects/${config.projectId}${path}`, {
    ...init,
    headers: { ...init?.headers, Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    throw new SinchApiError(res.status, await res.text());
  }
  return res;
}

/** Send a fax by uploading the PDF as multipart/form-data. */
export async function sendFax(config: SinchConfig, to: string, file: File): Promise<Fax> {
  const form = new FormData();
  form.append("to", to);
  if (config.from) form.append("from", config.from);
  form.append("file", file, file.name);
  const res = await sinchFetch(config, "/faxes", { method: "POST", body: form });
  return (await res.json()) as Fax;
}

export async function getFax(config: SinchConfig, id: string): Promise<Fax> {
  const res = await sinchFetch(config, `/faxes/${encodeURIComponent(id)}`);
  return (await res.json()) as Fax;
}

export async function listFaxes(config: SinchConfig, direction?: "INBOUND" | "OUTBOUND"): Promise<Fax[]> {
  const query = direction ? `?direction=${direction}&pageSize=50` : "?pageSize=50";
  const res = await sinchFetch(config, `/faxes${query}`);
  const data = (await res.json()) as { faxes?: Fax[] };
  return data.faxes ?? [];
}

/** Download the stored fax document as a PDF stream. */
export async function getFaxFile(config: SinchConfig, id: string): Promise<Response> {
  return sinchFetch(config, `/faxes/${encodeURIComponent(id)}/file.pdf`);
}
