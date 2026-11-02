export interface ComparisonRow {
  topic: string;
  messagemedia: string;
  sinchBuild: string;
}

export const comparisonRows: ComparisonRow[] = [
  {
    topic: "Credentials",
    messagemedia: "API key + secret from the MessageMedia / Sinch Engage hub (per account).",
    sinchBuild: "API token per SMS service plan, or project access key ID + secret (OAuth 2.0, US/EU) from the Sinch Build dashboard.",
  },
  {
    topic: "Auth header",
    messagemedia: "Authorization: Basic base64(key:secret) — or HMAC-SHA256 over Date, Content-MD5 and the request line.",
    sinchBuild: "Authorization: Bearer {API token} (or a short-lived OAuth access token).",
  },
  {
    topic: "Base URL",
    messagemedia: "https://api.messagemedia.com (APAC) · https://eu.app.api.sinch.com (EU)",
    sinchBuild: "https://{us|eu|au|br|ca}.sms.api.sinch.com",
  },
  {
    topic: "Send",
    messagemedia: "POST /v1/messages",
    sinchBuild: "POST /xms/v1/{service_plan_id}/batches",
  },
  {
    topic: "Unit of sending",
    messagemedia: "messages[] — one object per destination, up to 100 per request; each gets its own message_id.",
    sinchBuild: "A batch — one body sent to to[] recipients; one batch id for the whole send.",
  },
  {
    topic: "Status",
    messagemedia: "GET /v1/messages/{message_id} → status (enroute, submitted, delivered, …)",
    sinchBuild: "GET /xms/v1/{service_plan_id}/batches/{batch_id}/delivery_report → per-status counts / recipients",
  },
  {
    topic: "Delivery reports",
    messagemedia: "Opt in with delivery_report: true. Pull: GET /v1/delivery_reports then POST /v1/delivery_reports/confirmed (or webhook to callback_url).",
    sinchBuild: "delivery_report: none | summary | full | per_recipient. Callback to callback_url, or query the delivery_report endpoints.",
  },
  {
    topic: "Inbound",
    messagemedia: "Pull: GET /v1/replies then POST /v1/replies/confirmed. Replies link back to the original message_id.",
    sinchBuild: "GET /xms/v1/{service_plan_id}/inbounds (list) or an inbound callback on the service plan.",
  },
  {
    topic: "Numbers in responses",
    messagemedia: "E.164 with leading +.",
    sinchBuild: "MSISDN without + or 00.",
  },
];

export const messagemediaPayload = `POST https://api.messagemedia.com/v1/messages
Authorization: Basic base64(API_KEY:API_SECRET)

{
  "messages": [
    {
      "content": "Hello from MessageMedia",
      "destination_number": "+61491570156",
      "format": "SMS",
      "delivery_report": true
    }
  ]
}`;

export const sinchBuildPayload = `POST https://us.sms.api.sinch.com/xms/v1/{SERVICE_PLAN_ID}/batches
Authorization: Bearer {API_TOKEN}

{
  "from": "+12025550123",
  "to": ["+12025550199"],
  "body": "Hello from Sinch Build",
  "delivery_report": "full"
}`;
