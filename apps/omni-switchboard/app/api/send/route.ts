import { NextResponse } from "next/server";
import { isSwitchboardChannel } from "@/lib/channels";
import {
  getAppId,
  getCredentialStatus,
  getSinchClient,
  serializeApiError,
} from "@/lib/sinch";

type SendPayload = {
  text?: string;
  identities?: { channel: string; identity: string }[];
};

export async function POST(request: Request) {
  const payload = (await request.json()) as SendPayload;
  const text = payload.text?.trim();
  const identities = (payload.identities ?? []).filter(
    (entry) => isSwitchboardChannel(entry.channel) && entry.identity.trim(),
  );

  if (!text || identities.length === 0) {
    return NextResponse.json(
      { error: "A message text and at least one channel with an identity are required." },
      { status: 400 },
    );
  }

  const credentials = getCredentialStatus();
  if (!credentials.configured) {
    const missing = Object.entries(credentials.vars)
      .filter(([, present]) => !present)
      .map(([name]) => name);
    return NextResponse.json(
      {
        error: "Sinch credentials are not configured on the server.",
        missing,
      },
      { status: 503 },
    );
  }

  try {
    const response = await getSinchClient().conversation.messages.send({
      sendMessageRequestBody: {
        app_id: getAppId(),
        recipient: {
          identified_by: {
            channel_identities: identities.map(({ channel, identity }) => ({
              channel,
              identity: identity.trim(),
            })),
          },
        },
        message: { text_message: { text } },
        channel_priority_order: identities.map(({ channel }) => channel),
      },
    });
    return NextResponse.json({
      messageId: response.message_id,
      acceptedTime: response.accepted_time,
    });
  } catch (error) {
    const serialized = serializeApiError(error);
    return NextResponse.json(
      { error: serialized.message, details: serialized.details },
      { status: 502 },
    );
  }
}
