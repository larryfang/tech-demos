import { describe, expect, test } from "bun:test";
import {
  applicationSignature,
  applicationStringToSign,
  buildApplicationAuthHeader,
  contentMd5,
  conversationSignature,
  verifyApplicationSignedRequest,
  verifyConversationSignature,
} from "./signing";

// Official worked example from
// https://developers.sinch.com/docs/conversation/callbacks/ (HMAC section)
const CONVERSATION_VECTOR = {
  secret: "foo_secret1234",
  rawBody:
    '{"app_id":"","accepted_time":"2021-10-18T17:49:13.813615Z","project_id":"e2df3a34-a71b-4448-9db5-a8d2baad28e4","contact_create_notification":{"contact":{"id":"01FJA8B466Y0R2GNXD78MD9SM1","channel_identities":[{"channel":"SMS","identity":"48123456789","app_id":""}],"display_name":"New Test Contact","email":"new.contact@email.com","external_id":"","metadata":"","language":"EN_US"}},"message_metadata":""}',
  nonce: "01FJA8B4A7BM43YGWSG9GBV067",
  timestamp: "1634579353",
  expectedSignature: "6bpJoRmFoXVjfJIVglMoJzYXxnoxRujzR4k2GOXewOE=",
};

describe("Conversation API HMAC webhook signature", () => {
  test("matches the official documentation example", () => {
    expect(
      conversationSignature(
        CONVERSATION_VECTOR.rawBody,
        CONVERSATION_VECTOR.nonce,
        CONVERSATION_VECTOR.timestamp,
        CONVERSATION_VECTOR.secret,
      ),
    ).toBe(CONVERSATION_VECTOR.expectedSignature);
  });

  test("verifies the documented signature", () => {
    expect(
      verifyConversationSignature({
        rawBody: CONVERSATION_VECTOR.rawBody,
        nonce: CONVERSATION_VECTOR.nonce,
        timestamp: CONVERSATION_VECTOR.timestamp,
        signature: CONVERSATION_VECTOR.expectedSignature,
        secret: CONVERSATION_VECTOR.secret,
      }),
    ).toBe(true);
  });

  test("rejects a tampered body", () => {
    expect(
      verifyConversationSignature({
        rawBody: CONVERSATION_VECTOR.rawBody.replace("48123456789", "48999999999"),
        nonce: CONVERSATION_VECTOR.nonce,
        timestamp: CONVERSATION_VECTOR.timestamp,
        signature: CONVERSATION_VECTOR.expectedSignature,
        secret: CONVERSATION_VECTOR.secret,
      }),
    ).toBe(false);
  });

  test("rejects a wrong secret", () => {
    expect(
      verifyConversationSignature({
        rawBody: CONVERSATION_VECTOR.rawBody,
        nonce: CONVERSATION_VECTOR.nonce,
        timestamp: CONVERSATION_VECTOR.timestamp,
        signature: CONVERSATION_VECTOR.expectedSignature,
        secret: "wrong_secret",
      }),
    ).toBe(false);
  });
});

// Official worked example from
// https://developers.sinch.com/docs/verification/api-reference/authentication/callback-signed-request/
// Body bytes are exactly as documented: 2-space indentation, \n endings, no trailing newline.
const APPLICATION_VECTOR = {
  applicationKey: "669E367E-6BBA-48AB-AF15-266871C28135",
  applicationSecret: "BeIukql3pTKJ8RGL5zo0DA==",
  rawBody: [
    "{",
    '  "id": "1234567890",',
    '  "event": "VerificationResultEvent",',
    '  "method": "sms",',
    '  "identity": {',
    '    "type": "number",',
    '    "endpoint": "+11235551234"',
    "  },",
    '  "status": "PENDING",',
    '  "reason": "Fraud",',
    '  "reference": "12345",',
    '  "source": "intercept",',
    '  "custom": "string"',
    "}",
  ].join("\n"),
  contentType: "application/json; charset=utf-8",
  xTimestamp: "2014-09-24T10:59:41Z",
  path: "/sinch/callback/result",
  expectedMd5: "SI5URNZQlDbGI6BP5BgmYQ==",
  expectedSignature: "TwNofUj4kCL0mhWaMGhqF1jVR5NGK3Fly9g5gkxPg+c=",
};

describe("Application-signed callback (Verification/Voice)", () => {
  test("Content-MD5 matches the official documentation example", () => {
    expect(contentMd5(APPLICATION_VECTOR.rawBody)).toBe(APPLICATION_VECTOR.expectedMd5);
  });

  test("signature matches the official documentation example", () => {
    const sig = applicationSignature(
      applicationStringToSign({
        method: "POST",
        rawBody: APPLICATION_VECTOR.rawBody,
        contentType: APPLICATION_VECTOR.contentType,
        xTimestamp: APPLICATION_VECTOR.xTimestamp,
        path: APPLICATION_VECTOR.path,
      }),
      APPLICATION_VECTOR.applicationSecret,
    );
    expect(sig).toBe(APPLICATION_VECTOR.expectedSignature);
  });

  test("verifies the documented Authorization header", () => {
    const result = verifyApplicationSignedRequest({
      method: "POST",
      rawBody: APPLICATION_VECTOR.rawBody,
      contentType: APPLICATION_VECTOR.contentType,
      xTimestamp: APPLICATION_VECTOR.xTimestamp,
      path: APPLICATION_VECTOR.path,
      authorizationHeader: `Application ${APPLICATION_VECTOR.applicationKey}:${APPLICATION_VECTOR.expectedSignature}`,
      applicationKey: APPLICATION_VECTOR.applicationKey,
      applicationSecret: APPLICATION_VECTOR.applicationSecret,
    });
    expect(result.status).toBe("verified");
  });

  test("round-trips through buildApplicationAuthHeader", () => {
    const header = buildApplicationAuthHeader({
      method: "POST",
      rawBody: APPLICATION_VECTOR.rawBody,
      contentType: APPLICATION_VECTOR.contentType,
      xTimestamp: APPLICATION_VECTOR.xTimestamp,
      path: APPLICATION_VECTOR.path,
      applicationKey: APPLICATION_VECTOR.applicationKey,
      applicationSecret: APPLICATION_VECTOR.applicationSecret,
    });
    expect(header).toBe(
      `Application ${APPLICATION_VECTOR.applicationKey}:${APPLICATION_VECTOR.expectedSignature}`,
    );
  });

  test("rejects a tampered body", () => {
    const result = verifyApplicationSignedRequest({
      method: "POST",
      rawBody: APPLICATION_VECTOR.rawBody.replace("PENDING", "SUCCESSFUL"),
      contentType: APPLICATION_VECTOR.contentType,
      xTimestamp: APPLICATION_VECTOR.xTimestamp,
      path: APPLICATION_VECTOR.path,
      authorizationHeader: `Application ${APPLICATION_VECTOR.applicationKey}:${APPLICATION_VECTOR.expectedSignature}`,
      applicationKey: APPLICATION_VECTOR.applicationKey,
      applicationSecret: APPLICATION_VECTOR.applicationSecret,
    });
    expect(result.status).toBe("failed");
  });

  test("rejects a wrong application key", () => {
    const result = verifyApplicationSignedRequest({
      method: "POST",
      rawBody: APPLICATION_VECTOR.rawBody,
      contentType: APPLICATION_VECTOR.contentType,
      xTimestamp: APPLICATION_VECTOR.xTimestamp,
      path: APPLICATION_VECTOR.path,
      authorizationHeader: `Application some-other-key:${APPLICATION_VECTOR.expectedSignature}`,
      applicationKey: APPLICATION_VECTOR.applicationKey,
      applicationSecret: APPLICATION_VECTOR.applicationSecret,
    });
    expect(result.status).toBe("failed");
  });
});
