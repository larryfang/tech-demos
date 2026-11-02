import { createHash, createHmac } from "node:crypto";

export const APAC_BASE_URL = "https://api.messagemedia.com";
export const EU_BASE_URL = "https://eu.app.api.sinch.com";

export type AuthMode = "basic" | "hmac";

export type MessageStatus =
  | "enroute"
  | "submitted"
  | "delivered"
  | "expired"
  | "rejected"
  | "undeliverable"
  | "queued"
  | "processed"
  | "cancelled"
  | "scheduled"
  | "failed";

export interface OutboundMessage {
  content: string;
  destination_number: string;
  format?: "SMS" | "MMS" | "TTS";
  delivery_report?: boolean;
  source_number?: string;
  source_number_type?: "INTERNATIONAL" | "ALPHANUMERIC" | "SHORTCODE";
  callback_url?: string;
  metadata?: Record<string, string>;
}

export interface Message extends OutboundMessage {
  message_id: string;
  status: MessageStatus;
  scheduled?: string;
  message_expiry_timestamp?: string;
}

export interface DeliveryReport {
  delivery_report_id: string;
  message_id: string;
  status: MessageStatus;
  source_number?: string;
  date_received: string;
  submitted_date?: string;
  delay?: number;
  billing_units?: number;
  original_text?: string;
  metadata?: Record<string, string>;
}

export interface Reply {
  reply_id: string;
  message_id?: string;
  content: string;
  source_number: string;
  destination_number: string;
  date_received: string;
  metadata?: Record<string, string>;
}

export interface MessageMediaConfig {
  apiKey: string;
  apiSecret: string;
  authMode: AuthMode;
  baseUrl: string;
  sourceNumber?: string;
}

const KEY_VAR = "MESSAGEMEDIA_API_KEY";
const SECRET_VAR = "MESSAGEMEDIA_API_SECRET";

export function readConfig(env: Record<string, string | undefined> = process.env) {
  const apiKey = env[KEY_VAR]?.trim() ?? "";
  const apiSecret = env[SECRET_VAR]?.trim() ?? "";
  const authMode: AuthMode = env.MESSAGEMEDIA_AUTH_MODE?.trim().toLowerCase() === "hmac" ? "hmac" : "basic";
  const baseUrl = (env.MESSAGEMEDIA_BASE_URL?.trim() || APAC_BASE_URL).replace(/\/+$/, "");
  const sourceNumber = env.MESSAGEMEDIA_SOURCE_NUMBER?.trim() || undefined;
  const missing = [!apiKey && KEY_VAR, !apiSecret && SECRET_VAR].filter(Boolean) as string[];
  return { apiKey, apiSecret, authMode, baseUrl, sourceNumber, missing };
}

export function publicConfig(env: Record<string, string | undefined> = process.env) {
  const { apiKey, authMode, baseUrl, sourceNumber, missing } = readConfig(env);
  return {
    configured: missing.length === 0,
    missing,
    authMode,
    baseUrl,
    region: baseUrl === EU_BASE_URL ? "EU" : baseUrl === APAC_BASE_URL ? "APAC" : "custom",
    sourceNumber: sourceNumber ?? null,
    apiKeyHint: apiKey ? `${apiKey.slice(0, 4)}…` : null,
  };
}

export class CredentialsRequiredError extends Error {
  constructor(public missing: string[]) {
    super(`MessageMedia credentials required: set ${missing.join(" and ")}`);
  }
}

export class MessageMediaApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public details: string[] = [],
    public requestId?: string,
  ) {
    super(message);
  }
}

export function requireConfig(env: Record<string, string | undefined> = process.env): MessageMediaConfig {
  const { missing, ...config } = readConfig(env);
  if (missing.length) throw new CredentialsRequiredError(missing);
  return config;
}

export function contentMd5(body: string) {
  return createHash("md5").update(body, "utf8").digest("hex");
}

/**
 * HMAC scheme from the MessageMedia spec: sign `Date`, `Content-MD5` (only when there is a body)
 * and the request line with HMAC-SHA256, base64-encode, and list the signed headers in the same
 * order and casing used in the signing string.
 */
export function hmacHeaders(opts: {
  apiKey: string;
  apiSecret: string;
  method: string;
  pathWithQuery: string;
  body?: string;
  date?: Date;
}) {
  const date = (opts.date ?? new Date()).toUTCString();
  const requestLine = `${opts.method.toUpperCase()} ${opts.pathWithQuery} HTTP/1.1`;
  const headers: Record<string, string> = { Date: date };
  const lines = [`Date: ${date}`];
  let signed = "Date";
  if (opts.body) {
    headers["Content-MD5"] = contentMd5(opts.body);
    lines.push(`Content-MD5: ${headers["Content-MD5"]}`);
    signed += " Content-MD5";
  }
  lines.push(requestLine);
  const signingString = lines.join("\n");
  const signature = createHmac("sha256", opts.apiSecret).update(signingString, "utf8").digest("base64");
  headers.Authorization = `hmac username="${opts.apiKey}", algorithm="hmac-sha256", headers="${signed} request-line", signature="${signature}"`;
  return { headers, signingString };
}

export function basicAuthHeader(apiKey: string, apiSecret: string) {
  return `Basic ${Buffer.from(`${apiKey}:${apiSecret}`, "utf8").toString("base64")}`;
}

async function call<T>(
  config: MessageMediaConfig,
  method: "GET" | "POST" | "PUT",
  pathWithQuery: string,
  payload?: unknown,
): Promise<T> {
  const body = payload === undefined ? undefined : JSON.stringify(payload);
  const headers: Record<string, string> = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  if (config.authMode === "hmac") {
    Object.assign(headers, hmacHeaders({ ...config, method, pathWithQuery, body }).headers);
  } else {
    headers.Authorization = basicAuthHeader(config.apiKey, config.apiSecret);
  }

  const res = await fetch(`${config.baseUrl}${pathWithQuery}`, { method, headers, body, cache: "no-store" });
  const text = await res.text();
  let json: unknown = undefined;
  try {
    json = text ? JSON.parse(text) : undefined;
  } catch {
    json = undefined;
  }
  if (!res.ok) {
    const err = (json ?? {}) as { message?: string; details?: string[]; request_id?: string };
    throw new MessageMediaApiError(res.status, err.message || text || res.statusText, err.details ?? [], err.request_id);
  }
  return json as T;
}

export function buildSendPayload(input: OutboundMessage, sourceNumber?: string) {
  const message: OutboundMessage = {
    content: input.content,
    destination_number: input.destination_number,
    format: "SMS",
    delivery_report: input.delivery_report ?? true,
  };
  const source = input.source_number || sourceNumber;
  if (source) {
    message.source_number = source;
    message.source_number_type = /^\+\d+$/.test(source) ? "INTERNATIONAL" : /^\d+$/.test(source) ? "SHORTCODE" : "ALPHANUMERIC";
  }
  if (input.callback_url) message.callback_url = input.callback_url;
  if (input.metadata && Object.keys(input.metadata).length) message.metadata = input.metadata;
  return { messages: [message] };
}

export async function sendMessage(config: MessageMediaConfig, input: OutboundMessage) {
  const res = await call<{ messages: Message[] }>(config, "POST", "/v1/messages", buildSendPayload(input, config.sourceNumber));
  return res.messages[0];
}

export function getMessage(config: MessageMediaConfig, messageId: string) {
  return call<Message>(config, "GET", `/v1/messages/${encodeURIComponent(messageId)}`);
}

export async function checkDeliveryReports(config: MessageMediaConfig) {
  const res = await call<{ delivery_reports?: DeliveryReport[] }>(config, "GET", "/v1/delivery_reports");
  return res?.delivery_reports ?? [];
}

export async function confirmDeliveryReports(config: MessageMediaConfig, ids: string[]) {
  if (ids.length) await call(config, "POST", "/v1/delivery_reports/confirmed", { delivery_report_ids: ids });
}

export async function checkReplies(config: MessageMediaConfig) {
  const res = await call<{ replies?: Reply[] }>(config, "GET", "/v1/replies");
  return res?.replies ?? [];
}

export async function confirmReplies(config: MessageMediaConfig, ids: string[]) {
  if (ids.length) await call(config, "POST", "/v1/replies/confirmed", { reply_ids: ids });
}

export function errorResponse(error: unknown) {
  if (error instanceof CredentialsRequiredError) {
    return Response.json({ error: "credentials_required", message: error.message, missing: error.missing }, { status: 503 });
  }
  if (error instanceof MessageMediaApiError) {
    return Response.json(
      { error: "messagemedia_error", status: error.status, message: error.message, details: error.details, requestId: error.requestId },
      { status: 502 },
    );
  }
  return Response.json({ error: "internal_error", message: error instanceof Error ? error.message : String(error) }, { status: 500 });
}
