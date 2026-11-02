import { errorResponse, requireConfig, sendMessage } from "@/lib/messagemedia";
import { isE164 } from "@/lib/sms";
import { recordSent } from "@/lib/store";

export async function POST(request: Request) {
  const { destination_number = "", content = "" } = await request.json();
  if (!isE164(destination_number)) {
    return Response.json({ error: "invalid_input", message: "Destination must be E.164, e.g. +61491570156" }, { status: 400 });
  }
  if (!content.trim()) {
    return Response.json({ error: "invalid_input", message: "Message content is required" }, { status: 400 });
  }
  try {
    const config = requireConfig();
    const message = await sendMessage(config, {
      destination_number: destination_number.trim(),
      content,
      delivery_report: true,
      metadata: { app: "messagemedia-console" },
    });
    return Response.json(recordSent(message), { status: 201 });
  } catch (error) {
    return errorResponse(error);
  }
}
