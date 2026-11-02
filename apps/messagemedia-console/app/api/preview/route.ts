import { previewSend } from "@/lib/preview";

export async function POST(request: Request) {
  const { destination_number = "", content = "" } = await request.json();
  return Response.json(previewSend({ destination_number, content, metadata: { app: "messagemedia-console" } }));
}
