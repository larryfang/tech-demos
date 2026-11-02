export type Categorized = {
  category: string;
  eventType: string;
  summary: string;
};

/** Categorize a Conversation API callback by its payload shape. */
export function categorizeConversation(rawBody: string): Categorized {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { category: "Other", eventType: "unparseable", summary: "Body is not valid JSON" };
  }

  if (isObj(body.message_delivery_report)) {
    const r = body.message_delivery_report as Record<string, unknown>;
    const channel = pick(r, "channel_identity", "channel") ?? "?";
    return {
      category: "Delivery receipt",
      eventType: "MESSAGE_DELIVERY",
      summary: `${channel} message ${r.message_id ?? "?"} → ${r.status ?? "?"}`,
    };
  }
  if (isObj(body.message)) {
    const m = body.message as Record<string, unknown>;
    const text = pick(m, "contact_message", "text_message", "text");
    return {
      category: "Inbound message",
      eventType: "MESSAGE_INBOUND",
      summary: text ? `${m.channel ?? "?"}: “${text}”` : `${m.channel ?? "?"} inbound message`,
    };
  }
  if (isObj(body.event_delivery_report)) {
    return { category: "Delivery receipt", eventType: "EVENT_DELIVERY", summary: "Event delivery report" };
  }
  if (isObj(body.contact_create_notification)) {
    return { category: "Contact", eventType: "CONTACT_CREATE", summary: "Contact created" };
  }
  const knownKey = Object.keys(body).find((k) => k.endsWith("_notification") || k.endsWith("_event"));
  return {
    category: "Other",
    eventType: knownKey ?? "unknown",
    summary: knownKey ? `Conversation callback (${knownKey})` : "Unrecognized Conversation callback",
  };
}

/** Categorize an application-signed callback (Verification or Voice). */
export function categorizeApplication(rawBody: string): Categorized {
  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return { category: "Other", eventType: "unparseable", summary: "Body is not valid JSON" };
  }

  const event = typeof body.event === "string" ? body.event : "unknown";
  if (event === "VerificationRequestEvent" || event === "VerificationResultEvent") {
    const endpoint = pick(body, "identity", "endpoint") ?? "?";
    const detail = body.status ? `status ${body.status}` : `method ${body.method ?? "?"}`;
    return { category: "Verification", eventType: event, summary: `${endpoint} — ${detail}` };
  }
  const voiceEvents: Record<string, string> = {
    ice: "Incoming Call Event",
    ace: "Answered Call Event",
    dice: "Disconnected Call Event",
    pie: "Prompt Input Event",
    notify: "Notification Event",
  };
  if (event in voiceEvents) {
    const parts = [voiceEvents[event]];
    if (body.callId) parts.push(`call ${String(body.callId).slice(0, 8)}…`);
    if (body.result) parts.push(String(body.result));
    return { category: "Voice", eventType: event.toUpperCase(), summary: parts.join(" — ") };
  }
  return { category: "Other", eventType: event, summary: `Application-signed callback (${event})` };
}

function isObj(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null;
}

function pick(obj: Record<string, unknown>, ...path: string[]): string | undefined {
  let cur: unknown = obj;
  for (const key of path) {
    if (!isObj(cur)) return undefined;
    cur = cur[key];
  }
  return typeof cur === "string" ? cur : undefined;
}
