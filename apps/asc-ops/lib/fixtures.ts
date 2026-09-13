import type {
  AppSummary,
  BuildRow,
  ConsoleSnapshot,
  FeedbackRow,
  SubmissionRow,
} from "./types";

export const FIXTURE_APPS: AppSummary[] = [
  {
    id: "6478123401",
    name: "Harbor Notes",
    bundleId: "com.harbor.notes",
    sku: "HARBOR_NOTES",
  },
  {
    id: "6478123402",
    name: "Drift Radio",
    bundleId: "com.drift.radio",
    sku: "DRIFT_RADIO",
  },
  {
    id: "6478123403",
    name: "Lenskit Camera",
    bundleId: "com.lenskit.camera",
    sku: "LENSKIT_CAM",
  },
];

const BUILDS: Record<string, BuildRow[]> = {
  "6478123401": [
    {
      id: "build-hn-188",
      version: "2.4.1",
      buildNumber: "188",
      uploadedDate: "2026-09-11T16:42:00Z",
      processingState: "VALID",
    },
    {
      id: "build-hn-181",
      version: "2.4.0",
      buildNumber: "181",
      uploadedDate: "2026-09-04T09:18:00Z",
      processingState: "VALID",
    },
    {
      id: "build-hn-176",
      version: "2.3.9",
      buildNumber: "176",
      uploadedDate: "2026-08-28T21:05:00Z",
      processingState: "PROCESSING",
    },
  ],
  "6478123402": [
    {
      id: "build-dr-92",
      version: "1.8.0",
      buildNumber: "92",
      uploadedDate: "2026-09-10T13:20:00Z",
      processingState: "VALID",
    },
    {
      id: "build-dr-88",
      version: "1.7.4",
      buildNumber: "88",
      uploadedDate: "2026-08-22T11:01:00Z",
      processingState: "VALID",
    },
  ],
  "6478123403": [
    {
      id: "build-lk-310",
      version: "5.0.2",
      buildNumber: "310",
      uploadedDate: "2026-09-08T07:55:00Z",
      processingState: "VALID",
    },
    {
      id: "build-lk-304",
      version: "5.0.1",
      buildNumber: "304",
      uploadedDate: "2026-09-01T19:12:00Z",
      processingState: "INVALID",
    },
  ],
};

const FEEDBACK: Record<string, FeedbackRow[]> = {
  "6478123401": [
    {
      id: "fb-hn-1",
      tester: "Maya Chen",
      comment:
        "Pinch-to-collapse on long notes still jumps the caret to the end on iPad. Repro on 2.4.1 (188).",
      createdDate: "2026-09-12T08:14:00Z",
      device: "iPad Pro 13-inch",
      os: "iPadOS 26.0",
    },
    {
      id: "fb-hn-2",
      tester: "Owen Blake",
      comment:
        "Love the new Harbor tags. Sync from Mac to iPhone took ~40s after airplane mode — is that expected?",
      createdDate: "2026-09-11T22:03:00Z",
      device: "iPhone 16 Pro",
      os: "iOS 26.0",
    },
    {
      id: "fb-hn-3",
      tester: "Priya Nair",
      comment:
        "Voice memo → transcript dropped the last sentence twice this week. Attached a clip.",
      createdDate: "2026-09-09T17:40:00Z",
      device: "iPhone 15",
      os: "iOS 18.6",
    },
  ],
  "6478123402": [
    {
      id: "fb-dr-1",
      tester: "Luis Ortega",
      comment:
        "CarPlay now resumes the last station after a phone call. Thank you — this was the #1 request in our group.",
      createdDate: "2026-09-11T15:28:00Z",
      device: "iPhone 16",
      os: "iOS 26.0",
    },
    {
      id: "fb-dr-2",
      tester: "Hannah Cole",
      comment:
        "Sleep timer fired but audio kept playing for ~20s on AirPods. Build 92.",
      createdDate: "2026-09-10T23:51:00Z",
      device: "iPhone 14 Pro",
      os: "iOS 18.6",
    },
  ],
  "6478123403": [
    {
      id: "fb-lk-1",
      tester: "Jonah Reed",
      comment:
        "ProRAW bracket looks correct, but the histogram overlay lags one frame behind on 120fps preview.",
      createdDate: "2026-09-09T10:06:00Z",
      device: "iPhone 16 Pro Max",
      os: "iOS 26.0",
    },
    {
      id: "fb-lk-2",
      tester: "Aiko Sato",
      comment:
        "Export to Files failed once with “disk full” even though I had 18 GB free. Retry worked.",
      createdDate: "2026-09-08T18:33:00Z",
      device: "iPhone 15 Pro",
      os: "iOS 18.6",
    },
  ],
};

const SUBMISSIONS: Record<string, SubmissionRow[]> = {
  "6478123401": [
    {
      id: "ver-hn-241",
      version: "2.4.1",
      platform: "IOS",
      state: "WAITING_FOR_REVIEW",
      createdDate: "2026-09-11T17:10:00Z",
    },
    {
      id: "ver-hn-240",
      version: "2.4.0",
      platform: "IOS",
      state: "READY_FOR_SALE",
      createdDate: "2026-09-04T12:00:00Z",
    },
  ],
  "6478123402": [
    {
      id: "ver-dr-180",
      version: "1.8.0",
      platform: "IOS",
      state: "IN_REVIEW",
      createdDate: "2026-09-10T14:02:00Z",
    },
    {
      id: "ver-dr-174",
      version: "1.7.4",
      platform: "IOS",
      state: "READY_FOR_SALE",
      createdDate: "2026-08-23T08:40:00Z",
    },
  ],
  "6478123403": [
    {
      id: "ver-lk-510",
      version: "5.1.0",
      platform: "IOS",
      state: "PREPARE_FOR_SUBMISSION",
      createdDate: "2026-09-12T09:00:00Z",
    },
    {
      id: "ver-lk-502",
      version: "5.0.2",
      platform: "IOS",
      state: "READY_FOR_SALE",
      createdDate: "2026-09-08T11:20:00Z",
    },
  ],
};

export function fixtureSnapshot(appId?: string): ConsoleSnapshot {
  const selectedAppId =
    FIXTURE_APPS.some((app) => app.id === appId) ? appId! : FIXTURE_APPS[0].id;
  return {
    mode: "fixture",
    source: "seeded fixtures (no ASC key)",
    apps: FIXTURE_APPS,
    selectedAppId,
    builds: BUILDS[selectedAppId] ?? [],
    feedback: FEEDBACK[selectedAppId] ?? [],
    submissions: SUBMISSIONS[selectedAppId] ?? [],
  };
}
