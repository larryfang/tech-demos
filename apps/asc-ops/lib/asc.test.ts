import { describe, expect, test } from "bun:test";
import { mapApps, mapBuilds, mapFeedback, mapSubmissions } from "./asc";
import { fixtureSnapshot } from "./fixtures";
import { loadConsole } from "./load-console";

const appsPayload = {
  data: [
    {
      id: "1",
      type: "apps",
      attributes: { name: "Harbor Notes", bundleId: "com.harbor.notes", sku: "HN" },
    },
  ],
};

describe("ASC JSON mappers", () => {
  test("map apps, builds, feedback, and versions", () => {
    expect(mapApps(appsPayload)).toEqual([
      { id: "1", name: "Harbor Notes", bundleId: "com.harbor.notes", sku: "HN" },
    ]);
    expect(
      mapBuilds({
        data: [
          {
            id: "b1",
            attributes: {
              version: "2.4.1",
              uploadedDate: "2026-09-11T16:42:00Z",
              processingState: "VALID",
            },
          },
        ],
      })[0],
    ).toMatchObject({ id: "b1", version: "2.4.1", processingState: "VALID" });
    expect(
      mapFeedback({
        data: [{ id: "f1", attributes: { comment: "lag", email: "a@b.c" } }],
      })[0],
    ).toMatchObject({ id: "f1", comment: "lag", tester: "a@b.c" });
    expect(
      mapSubmissions({
        data: [
          {
            id: "v1",
            attributes: { versionString: "2.4.1", platform: "IOS", appStoreState: "IN_REVIEW" },
          },
        ],
      })[0],
    ).toMatchObject({ id: "v1", version: "2.4.1", state: "IN_REVIEW" });
  });
});

describe("fixture console", () => {
  test("defaults to Harbor Notes and keeps three apps", () => {
    const snap = fixtureSnapshot();
    expect(snap.mode).toBe("fixture");
    expect(snap.apps).toHaveLength(3);
    expect(snap.selectedAppId).toBe("6478123401");
    expect(snap.builds.length).toBeGreaterThan(0);
    expect(snap.feedback[0]?.comment).toContain("Pinch-to-collapse");
    expect(snap.submissions[0]?.state).toBe("WAITING_FOR_REVIEW");
  });

  test("switching app id changes the three panels", () => {
    const drift = fixtureSnapshot("6478123402");
    expect(drift.selectedAppId).toBe("6478123402");
    expect(drift.builds[0]?.version).toBe("1.8.0");
    expect(drift.submissions[0]?.state).toBe("IN_REVIEW");
  });

  test("loadConsole without a key stays on fixtures", async () => {
    const snap = await loadConsole("6478123403");
    expect(snap.mode).toBe("fixture");
    expect(snap.selectedAppId).toBe("6478123403");
    expect(snap.fallbackReason).toBeUndefined();
  });

  test("invalid local key falls back to fixtures", async () => {
    const snap = await loadConsole("6478123401", {
      keyId: "ABC123DEFG",
      issuerId: "12345678-abcd-1234-abcd-123456789012",
      privateKeyPem: "-----BEGIN PRIVATE KEY-----\nnot-a-real-key\n-----END PRIVATE KEY-----",
    });
    expect(snap.mode).toBe("fixture");
    expect(snap.fallbackReason).toBeTruthy();
    expect(snap.apps[0]?.name).toBe("Harbor Notes");
  });
});
