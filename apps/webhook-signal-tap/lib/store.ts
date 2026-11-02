export type Verdict = "verified" | "failed" | "unsigned";

export type ReplayRecord = {
  at: string;
  targetUrl: string;
  status: number | null;
  error?: string;
};

export type TapEvent = {
  id: string;
  receivedAt: string;
  endpoint: "conversation" | "application";
  scheme: "conversation-hmac" | "application-signed" | "none";
  verdict: Verdict;
  verdictDetail: string;
  category: string;
  eventType: string;
  summary: string;
  simulated: boolean;
  headers: Record<string, string>;
  rawBody: string;
  replays: ReplayRecord[];
};

// Module state survives between route invocations within one dev-server
// process via globalThis (single-user, in-memory by design).
const g = globalThis as typeof globalThis & { __tapEvents?: TapEvent[] };
const events: TapEvent[] = (g.__tapEvents ??= []);

const MAX_EVENTS = 200;

export function addEvent(event: TapEvent): void {
  events.unshift(event);
  if (events.length > MAX_EVENTS) events.length = MAX_EVENTS;
}

export function listEvents(): TapEvent[] {
  return events;
}

export function getEvent(id: string): TapEvent | undefined {
  return events.find((e) => e.id === id);
}

export function clearEvents(): void {
  events.length = 0;
}

export function newId(): string {
  return `evt_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}
