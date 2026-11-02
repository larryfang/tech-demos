export type RecipientState = {
  number: string;
  /** Simplified Sinch delivery status, e.g. Queued, Dispatched, Delivered, Failed */
  status: string;
  /** Detailed Sinch delivery receipt code, e.g. 0 (Delivered), 401 (Dispatched) */
  code?: number;
};

export type Campaign = {
  id: string;
  name: string;
  from: string;
  body: string;
  batchId: string;
  createdAt: string;
  recipients: RecipientState[];
  /** True once every recipient has reached a final delivery status */
  settled: boolean;
};

export type ConfigState = {
  configured: boolean;
  mode: "unified" | "servicePlan" | null;
  missing: string[];
  region: string;
  defaultFrom: string | null;
};

/** Simplified statuses Sinch considers non-final. */
export const PENDING_STATUSES = new Set(["Queued", "Dispatched"]);
