/**
 * Sample webhook payloads taken from Sinch developer documentation.
 * These are SIMULATED events — the UI must always label them as samples,
 * never as live traffic. Sources:
 * - Conversation API callbacks: https://developers.sinch.com/docs/conversation/callbacks/
 * - Verification callback signing: https://developers.sinch.com/docs/verification/api-reference/authentication/callback-signed-request/
 * - Voice callbacks: https://developers.sinch.com/docs/voice/api-reference/voice/callbacks/
 */

export type Sample = {
  id: string;
  label: string;
  description: string;
  endpoint: "conversation" | "application";
  body: Record<string, unknown>;
};

export const SAMPLES: Sample[] = [
  {
    id: "sms-delivery-receipt",
    label: "SMS delivery receipt",
    description: "Conversation API MESSAGE_DELIVERY — message delivered on the SMS channel",
    endpoint: "conversation",
    body: {
      app_id: "01HSAMPLEAPP0000000000000",
      accepted_time: "2024-06-15T14:25:10.456Z",
      event_time: "2024-06-15T14:25:09.123Z",
      project_id: "e2df3a34-a71b-4448-9db5-a8d2baad28e4",
      message_delivery_report: {
        message_id: "01HSAMPLEMSG0000000000000",
        conversation_id: "01HSAMPLECONV000000000000",
        status: "DELIVERED",
        channel_identity: {
          channel: "SMS",
          identity: "46732001122",
          app_id: "01HSAMPLEAPP0000000000000",
        },
        contact_id: "01HSAMPLECONTACT000000000",
        metadata: "order_confirmation_12345",
        processing_mode: "CONVERSATION",
      },
    },
  },
  {
    id: "inbound-sms",
    label: "Inbound SMS message",
    description: "Conversation API MESSAGE_INBOUND — contact texted your app",
    endpoint: "conversation",
    body: {
      app_id: "01HSAMPLEAPP0000000000000",
      accepted_time: "2024-06-15T14:23:45.123Z",
      event_time: "2024-06-15T14:23:44.890Z",
      project_id: "e2df3a34-a71b-4448-9db5-a8d2baad28e4",
      message: {
        id: "01HSAMPLEMSG1111111111111",
        conversation_id: "01HSAMPLECONV000000000000",
        contact_id: "01HSAMPLECONTACT000000000",
        channel: "SMS",
        direction: "TO_APP",
        contact_message: {
          text_message: { text: "Hi, I need help with my order #12345" },
        },
        accept_time: "2024-06-15T14:23:44.890Z",
        channel_identity: {
          channel: "SMS",
          identity: "46732001122",
          app_id: "01HSAMPLEAPP0000000000000",
        },
      },
    },
  },
  {
    id: "verification-result",
    label: "Verification result event",
    description: "Verification API VerificationResultEvent (signed callback example)",
    endpoint: "application",
    body: {
      id: "1234567890",
      event: "VerificationResultEvent",
      method: "sms",
      identity: { type: "number", endpoint: "+11235551234" },
      status: "SUCCESSFUL",
      reference: "12345",
      source: "intercept",
    },
  },
  {
    id: "verification-request",
    label: "Verification request event",
    description: "Verification API VerificationRequestEvent — verification initiated",
    endpoint: "application",
    body: {
      id: "1234567891",
      event: "VerificationRequestEvent",
      method: "sms",
      identity: { type: "number", endpoint: "+11235551234" },
      price: { amount: 0.005, currencyId: "USD" },
      reference: "12345",
    },
  },
  {
    id: "voice-ice",
    label: "Voice incoming call (ICE)",
    description: "Voice API Incoming Call Event",
    endpoint: "application",
    body: {
      event: "ice",
      callId: "4398599d1ba84ef3bde0a82dfb61abed",
      callResourceUrl:
        "https://calling-euc1.api.sinch.com/calling/v1/calls/id/4398599d1ba84ef3bde0a82dfb61abed",
      timestamp: "2024-01-15T10:30:00Z",
      version: 1,
      custom: "",
      applicationKey: "94983f76-1161-6655-9515-4785c7b67dd8",
      cli: "+14045001000",
      to: { type: "number", endpoint: "+14045005000" },
      domain: "pstn",
      originationType: "pstn",
      userRate: { currencyId: "USD", amount: 0.0 },
    },
  },
  {
    id: "voice-dice",
    label: "Voice call ended (DICE)",
    description: "Voice API Disconnected Call Event",
    endpoint: "application",
    body: {
      event: "dice",
      callId: "4398599d1ba84ef3bde0a82dfb61abed",
      timestamp: "2024-01-15T10:35:00Z",
      version: 1,
      custom: "",
      applicationKey: "94983f76-1161-6655-9515-4785c7b67dd8",
      reason: "CALLEEHANGUP",
      result: "ANSWERED",
      duration: 295,
      debit: { currencyId: "USD", amount: 0.05 },
      userRate: { currencyId: "USD", amount: 0.01 },
    },
  },
];

export function getSample(id: string): Sample | undefined {
  return SAMPLES.find((s) => s.id === id);
}
