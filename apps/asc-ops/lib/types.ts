export type DataMode = "fixture" | "live";

export type AppSummary = {
  id: string;
  name: string;
  bundleId: string;
  sku?: string;
};

export type BuildRow = {
  id: string;
  version: string;
  buildNumber: string;
  uploadedDate: string;
  processingState: string;
};

export type FeedbackRow = {
  id: string;
  comment: string;
  tester: string;
  createdDate: string;
  device?: string;
  os?: string;
};

export type SubmissionRow = {
  id: string;
  version: string;
  platform: string;
  state: string;
  createdDate?: string;
};

export type AscCredentials = {
  keyId: string;
  issuerId?: string;
  keyType?: "team" | "individual";
  privateKeyPath?: string;
  privateKeyPem?: string;
};

export type ConsoleSnapshot = {
  mode: DataMode;
  source: string;
  fallbackReason?: string;
  apps: AppSummary[];
  selectedAppId: string;
  builds: BuildRow[];
  feedback: FeedbackRow[];
  submissions: SubmissionRow[];
};
