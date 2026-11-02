import formData from "form-data";
import Mailgun from "mailgun.js";

export interface MailgunConfig {
  apiKey: string;
  domain: string;
  baseUrl: string;
  from: string;
}

/** Reads Mailgun settings from the environment. Returns null when credentials are absent. */
export function getConfig(): MailgunConfig | null {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  if (!apiKey || !domain) return null;
  const baseUrl = process.env.MAILGUN_API_BASE_URL ?? "https://api.mailgun.net";
  const from = process.env.MAILGUN_FROM ?? `Deliverability Desk <postmaster@${domain}>`;
  return { apiKey, domain, baseUrl, from };
}

export function getClient(config: MailgunConfig) {
  const mailgun = new Mailgun(formData);
  return mailgun.client({
    username: "api",
    key: config.apiKey,
    url: config.baseUrl,
  });
}

/**
 * Raw REST call for endpoints mailgun.js doesn't cover
 * (e.g. the current POST /v1/analytics/logs — the v3 events API is deprecated).
 */
export async function mailgunFetch(
  config: MailgunConfig,
  path: string,
  init?: RequestInit,
): Promise<Response> {
  const auth = Buffer.from(`api:${config.apiKey}`).toString("base64");
  return fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Basic ${auth}`,
      ...(init?.body ? { "Content-Type": "application/json" } : {}),
      ...init?.headers,
    },
    cache: "no-store",
  });
}

export const NOT_CONFIGURED = {
  configured: false as const,
  error:
    "Mailgun credentials are not set. Export MAILGUN_API_KEY and MAILGUN_DOMAIN (and optionally MAILGUN_API_BASE_URL for the EU region, MAILGUN_FROM for the sender address), then restart the dev server.",
};
