import { FIXTURE_CALLS } from "@/lib/fixtures";
import type { CallRecord, ConsoleSnapshot } from "@/lib/types";

let sessionCalls: CallRecord[] = [];

export function isLiveAvailable(): boolean {
  return Boolean(process.env.BLAND_API_KEY?.trim());
}

export function getApiKey(): string | undefined {
  const key = process.env.BLAND_API_KEY?.trim();
  return key || undefined;
}

export function listCalls(): CallRecord[] {
  return [...sessionCalls, ...FIXTURE_CALLS];
}

export function getCall(id: string): CallRecord | undefined {
  return sessionCalls.find((call) => call.id === id) ?? FIXTURE_CALLS.find((call) => call.id === id);
}

export function addCall(call: CallRecord): CallRecord {
  sessionCalls = [call, ...sessionCalls];
  return call;
}

export function updateCall(id: string, patch: Partial<CallRecord>): CallRecord | undefined {
  const index = sessionCalls.findIndex((call) => call.id === id);
  if (index === -1) return getCall(id);
  const next = { ...sessionCalls[index], ...patch };
  sessionCalls = sessionCalls.map((call) => (call.id === id ? next : call));
  return next;
}

export function getSnapshot(): ConsoleSnapshot {
  return {
    liveAvailable: isLiveAvailable(),
    calls: listCalls(),
  };
}
