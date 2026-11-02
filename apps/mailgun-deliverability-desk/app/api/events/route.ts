import { NextResponse } from "next/server";
import { getConfig, mailgunFetch, NOT_CONFIGURED } from "@/lib/mailgun";


interface LogItem {
  event?: string;
  "@timestamp"?: string;
  recipient?: string;
  message?: { headers?: { subject?: string; from?: string; "message-id"?: string } };
  "delivery-status"?: { description?: string; message?: string; code?: number };
  reason?: string;
  url?: string;
}

const COUNTER_KEYS = ["accepted", "delivered", "opened", "clicked", "failed", "complained", "unsubscribed"] as const;

export async function GET() {
  const config = getConfig();
  if (!config) return NextResponse.json(NOT_CONFIGURED, { status: 503 });

  // Mailgun wants RFC-2822 dates with numeric offsets; query the last 24 hours.
  const end = new Date();
  const start = new Date(end.getTime() - 24 * 60 * 60 * 1000);
  const rfc2822 = (d: Date) => d.toUTCString().replace("GMT", "+0000");

  try {
    const res = await mailgunFetch(config, "/v1/analytics/logs", {
      method: "POST",
      body: JSON.stringify({
        start: rfc2822(start),
        end: rfc2822(end),
        filter: {
          AND: [
            { attribute: "domain", comparator: "=", values: [{ value: config.domain }] },
          ],
        },
        pagination: { sort: "timestamp:desc", limit: 100 },
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: `Mailgun logs query failed (HTTP ${res.status}): ${text.slice(0, 300)}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    const items: LogItem[] = Array.isArray(data.items) ? data.items : [];

    const counters = Object.fromEntries(COUNTER_KEYS.map((k) => [k, 0])) as Record<
      (typeof COUNTER_KEYS)[number],
      number
    >;
    const events = items.map((item) => {
      const event = item.event ?? "unknown";
      if ((COUNTER_KEYS as readonly string[]).includes(event)) {
        counters[event as (typeof COUNTER_KEYS)[number]] += 1;
      }
      return {
        event,
        timestamp: item["@timestamp"] ?? null,
        recipient: item.recipient ?? null,
        subject: item.message?.headers?.subject ?? null,
        detail:
          item["delivery-status"]?.description ||
          item["delivery-status"]?.message ||
          item.reason ||
          item.url ||
          null,
      };
    });

    return NextResponse.json({ events, counters, windowHours: 24 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
