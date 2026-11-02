import { describe, expect, test } from "bun:test";
import { createHash, createHmac } from "node:crypto";
import { basicAuthHeader, buildSendPayload, hmacHeaders, publicConfig, readConfig, requireConfig, CredentialsRequiredError } from "./messagemedia";
import { previewSend } from "./preview";

describe("config", () => {
  test("reports missing credentials by name", () => {
    expect(readConfig({}).missing).toEqual(["MESSAGEMEDIA_API_KEY", "MESSAGEMEDIA_API_SECRET"]);
    expect(() => requireConfig({ MESSAGEMEDIA_API_KEY: "k" })).toThrow(CredentialsRequiredError);
  });

  test("public config never exposes the secret", () => {
    const cfg = publicConfig({ MESSAGEMEDIA_API_KEY: "abcdef123", MESSAGEMEDIA_API_SECRET: "topsecret" });
    expect(JSON.stringify(cfg)).not.toContain("topsecret");
    expect(cfg).toMatchObject({ configured: true, apiKeyHint: "abcd…", authMode: "basic", region: "APAC" });
  });

  test("EU base URL and hmac mode", () => {
    const cfg = publicConfig({ MESSAGEMEDIA_AUTH_MODE: "HMAC", MESSAGEMEDIA_BASE_URL: "https://eu.app.api.sinch.com/" });
    expect(cfg).toMatchObject({ authMode: "hmac", region: "EU", baseUrl: "https://eu.app.api.sinch.com" });
  });
});

describe("auth", () => {
  test("basic header is base64(key:secret)", () => {
    expect(basicAuthHeader("thisisakey", "secret")).toBe(`Basic ${Buffer.from("thisisakey:secret").toString("base64")}`);
  });

  test("hmac signs Date, Content-MD5 and request line with SHA-256", () => {
    const date = new Date("2016-07-30T05:18:52Z");
    const body = JSON.stringify({ messages: [{ content: "Hello World", destination_number: "+61491570156" }] });
    const { headers, signingString } = hmacHeaders({ apiKey: "key", apiSecret: "secret", method: "post", pathWithQuery: "/v1/messages", body, date });
    const md5 = createHash("md5").update(body).digest("hex");
    expect(headers.Date).toBe("Sat, 30 Jul 2016 05:18:52 GMT");
    expect(headers["Content-MD5"]).toBe(md5);
    expect(signingString).toBe(`Date: Sat, 30 Jul 2016 05:18:52 GMT\nContent-MD5: ${md5}\nPOST /v1/messages HTTP/1.1`);
    const signature = createHmac("sha256", "secret").update(signingString).digest("base64");
    expect(headers.Authorization).toBe(`hmac username="key", algorithm="hmac-sha256", headers="Date Content-MD5 request-line", signature="${signature}"`);
  });

  test("hmac without body omits Content-MD5", () => {
    const { headers, signingString } = hmacHeaders({ apiKey: "k", apiSecret: "s", method: "GET", pathWithQuery: "/v1/replies", date: new Date(0) });
    expect(headers["Content-MD5"]).toBeUndefined();
    expect(signingString).toBe("Date: Thu, 01 Jan 1970 00:00:00 GMT\nGET /v1/replies HTTP/1.1");
    expect(headers.Authorization).toContain('headers="Date request-line"');
  });
});

describe("payload", () => {
  test("single SMS with delivery report and typed source number", () => {
    expect(buildSendPayload({ content: "hi", destination_number: "+61491570156" }, "+61491570157")).toEqual({
      messages: [
        { content: "hi", destination_number: "+61491570156", format: "SMS", delivery_report: true, source_number: "+61491570157", source_number_type: "INTERNATIONAL" },
      ],
    });
    expect(buildSendPayload({ content: "hi", destination_number: "+1", source_number: "ACME" }).messages[0].source_number_type).toBe("ALPHANUMERIC");
  });

  test("preview keeps secrets as placeholders", () => {
    const p = previewSend({ content: "hi", destination_number: "+61491570156" }, { MESSAGEMEDIA_AUTH_MODE: "hmac", MESSAGEMEDIA_API_SECRET: "topsecret" });
    expect(JSON.stringify(p)).not.toContain("topsecret");
    expect(p.signingString).toMatch(/^Date: .+\nContent-MD5: [0-9a-f]{32}\nPOST \/v1\/messages HTTP\/1\.1$/);
  });
});
