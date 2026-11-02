import { createHash, createHmac, timingSafeEqual } from "crypto";

/**
 * Sinch Conversation API webhook HMAC scheme.
 * signature = Base64(HMAC-SHA256(secret, rawBody + "." + nonce + "." + timestamp))
 * Delivered in the x-sinch-webhook-signature header, with
 * x-sinch-webhook-signature-nonce / -timestamp / -algorithm alongside.
 * https://developers.sinch.com/docs/conversation/callbacks/ (HMAC section)
 */
export function conversationSignature(
  rawBody: string,
  nonce: string,
  timestamp: string,
  secret: string,
): string {
  const signedData = `${rawBody}.${nonce}.${timestamp}`;
  return createHmac("sha256", secret).update(signedData, "utf8").digest("base64");
}

export function verifyConversationSignature(params: {
  rawBody: string;
  nonce: string;
  timestamp: string;
  signature: string;
  secret: string;
}): boolean {
  const expected = conversationSignature(
    params.rawBody,
    params.nonce,
    params.timestamp,
    params.secret,
  );
  return safeEqual(expected, params.signature);
}

/**
 * Sinch application-signed callback scheme (Verification & Voice APIs).
 * Authorization: Application <key>:<Base64(HMAC-SHA256(Base64Decode(secret), StringToSign))>
 * StringToSign = verb \n Base64(MD5(rawBody)) \n content-type \n x-timestamp:<ts> \n path
 * https://developers.sinch.com/docs/verification/api-reference/authentication/callback-signed-request/
 */
export function contentMd5(rawBody: string | Buffer): string {
  return createHash("md5").update(rawBody).digest("base64");
}

export function applicationStringToSign(params: {
  method: string;
  rawBody: string | Buffer;
  contentType: string;
  xTimestamp: string;
  path: string;
}): string {
  return [
    params.method.toUpperCase(),
    contentMd5(params.rawBody),
    params.contentType,
    `x-timestamp:${params.xTimestamp}`,
    params.path,
  ].join("\n");
}

export function applicationSignature(
  stringToSign: string,
  applicationSecretB64: string,
): string {
  const key = Buffer.from(applicationSecretB64, "base64");
  return createHmac("sha256", key).update(stringToSign, "utf8").digest("base64");
}

export function buildApplicationAuthHeader(params: {
  method: string;
  rawBody: string | Buffer;
  contentType: string;
  xTimestamp: string;
  path: string;
  applicationKey: string;
  applicationSecret: string;
}): string {
  const sig = applicationSignature(
    applicationStringToSign(params),
    params.applicationSecret,
  );
  return `Application ${params.applicationKey}:${sig}`;
}

export type ApplicationVerifyResult =
  | { status: "verified"; detail: string }
  | { status: "failed"; detail: string };

export function verifyApplicationSignedRequest(params: {
  method: string;
  rawBody: string | Buffer;
  contentType: string;
  xTimestamp: string;
  path: string;
  authorizationHeader: string;
  applicationKey: string;
  applicationSecret: string;
}): ApplicationVerifyResult {
  const match = /^Application\s+([^:]+):(.+)$/.exec(params.authorizationHeader.trim());
  if (!match) {
    return { status: "failed", detail: "Authorization header is not an Application signed request" };
  }
  const [, key, providedSig] = match;
  if (key !== params.applicationKey) {
    return { status: "failed", detail: `Unknown application key "${key}"` };
  }
  const expected = applicationSignature(
    applicationStringToSign(params),
    params.applicationSecret,
  );
  if (!safeEqual(expected, providedSig)) {
    return { status: "failed", detail: "HMAC-SHA256 signature mismatch" };
  }
  return { status: "verified", detail: `Signature valid for application key ${key}` };
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}
