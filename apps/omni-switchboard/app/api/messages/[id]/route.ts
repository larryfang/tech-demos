import { NextResponse } from "next/server";
import { getCredentialStatus, getSinchClient, serializeApiError } from "@/lib/sinch";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!getCredentialStatus().configured) {
    return NextResponse.json(
      { error: "Sinch credentials are not configured on the server." },
      { status: 503 },
    );
  }

  try {
    const message = await getSinchClient().conversation.messages.get({ message_id: id });
    return NextResponse.json({ message });
  } catch (error) {
    const serialized = serializeApiError(error);
    return NextResponse.json(
      { error: serialized.message, details: serialized.details },
      { status: 502 },
    );
  }
}
