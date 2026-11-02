import type { DeliveryReport, Message, Reply } from "./messagemedia";

export interface SentMessage {
  message: Message;
  sentAt: string;
  statusCheckedAt?: string;
  deliveryReports: DeliveryReport[];
}

interface Store {
  sent: SentMessage[];
  unmatchedReports: DeliveryReport[];
  replies: Reply[];
}

const globalStore = globalThis as typeof globalThis & { __messagemediaStore?: Store };

export function store(): Store {
  globalStore.__messagemediaStore ??= { sent: [], unmatchedReports: [], replies: [] };
  return globalStore.__messagemediaStore;
}

export function recordSent(message: Message) {
  const entry: SentMessage = { message, sentAt: new Date().toISOString(), deliveryReports: [] };
  store().sent.unshift(entry);
  return entry;
}

export function updateStatus(message: Message) {
  const entry = store().sent.find((s) => s.message.message_id === message.message_id);
  if (!entry) return undefined;
  entry.message = { ...entry.message, ...message };
  entry.statusCheckedAt = new Date().toISOString();
  return entry;
}

export function attachReports(reports: DeliveryReport[]) {
  const s = store();
  for (const report of reports) {
    const entry = s.sent.find((m) => m.message.message_id === report.message_id);
    if (!entry) {
      s.unmatchedReports.unshift(report);
      continue;
    }
    if (entry.deliveryReports.some((r) => r.delivery_report_id === report.delivery_report_id)) continue;
    entry.deliveryReports.push(report);
    entry.deliveryReports.sort((a, b) => a.date_received.localeCompare(b.date_received));
    entry.message = { ...entry.message, status: entry.deliveryReports.at(-1)!.status };
  }
}

export function addReplies(replies: Reply[]) {
  const s = store();
  for (const reply of replies) {
    if (!s.replies.some((r) => r.reply_id === reply.reply_id)) s.replies.unshift(reply);
  }
}

export function snapshot() {
  return structuredClone(store());
}
