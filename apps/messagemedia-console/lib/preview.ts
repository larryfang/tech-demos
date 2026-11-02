import { buildSendPayload, contentMd5, readConfig, type OutboundMessage } from "./messagemedia";

/** The exact request `sendMessage` would make, with the secret-derived parts left as placeholders. */
export function previewSend(input: OutboundMessage, env: Record<string, string | undefined> = process.env) {
  const config = readConfig(env);
  const path = "/v1/messages";
  const body = JSON.stringify(buildSendPayload(input, config.sourceNumber));
  const keyLabel = config.apiKey ? `${config.apiKey.slice(0, 4)}…` : "<MESSAGEMEDIA_API_KEY>";
  const headers: Record<string, string> = { Accept: "application/json", "Content-Type": "application/json" };
  let signingString: string | null = null;
  if (config.authMode === "hmac") {
    const date = new Date().toUTCString();
    const md5 = contentMd5(body);
    headers.Date = date;
    headers["Content-MD5"] = md5;
    headers.Authorization = `hmac username="${keyLabel}", algorithm="hmac-sha256", headers="Date Content-MD5 request-line", signature="<HMAC-SHA256 with MESSAGEMEDIA_API_SECRET>"`;
    signingString = `Date: ${date}\nContent-MD5: ${md5}\nPOST ${path} HTTP/1.1`;
  } else {
    headers.Authorization = `Basic base64(${keyLabel}:<MESSAGEMEDIA_API_SECRET>)`;
  }
  return {
    method: "POST",
    url: `${config.baseUrl}${path}`,
    authMode: config.authMode,
    headers,
    body: JSON.parse(body),
    signingString,
  };
}
