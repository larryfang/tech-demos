import { connection } from "next/server";
import { errorResponse, getMessage, requireConfig } from "@/lib/messagemedia";
import { updateStatus } from "@/lib/store";

export async function GET(_request: Request, { params }: RouteContext<"/api/messages/[id]">) {
  await connection();
  const { id } = await params;
  try {
    const message = await getMessage(requireConfig(), id);
    return Response.json(updateStatus(message) ?? { message });
  } catch (error) {
    return errorResponse(error);
  }
}
