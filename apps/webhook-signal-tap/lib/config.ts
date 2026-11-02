/**
 * Secrets used to verify incoming webhooks. The demo defaults let the
 * simulator work out of the box; set these env vars to your real values
 * when pointing actual Sinch webhooks at this app.
 */
/** The canonicalized resource Sinch signs for Verification/Voice callbacks is this route's path. */
export const APPLICATION_HOOK_PATH = "/api/hooks/application";
export const CONVERSATION_HOOK_PATH = "/api/hooks/conversation";

export const tapConfig = {
  /** Secret configured on the Conversation API webhook (dashboard or /webhooks API). */
  conversationSecret:
    process.env.CONVERSATION_WEBHOOK_SECRET ?? "demo_conversation_secret",
  /** Verification/Voice application key (dashboard.sinch.com → Apps). */
  applicationKey: process.env.SINCH_APPLICATION_KEY ?? "demo-application-key",
  /** Verification/Voice application secret — base64-encoded, as shown in the dashboard. */
  applicationSecret:
    process.env.SINCH_APPLICATION_SECRET ??
    Buffer.from("webhook-signal-tap-demo!").toString("base64"),
};
