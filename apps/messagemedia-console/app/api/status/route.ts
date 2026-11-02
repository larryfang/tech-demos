import { connection } from "next/server";
import { publicConfig } from "@/lib/messagemedia";
import { snapshot } from "@/lib/store";

export async function GET() {
  await connection();
  return Response.json({ config: publicConfig(), ...snapshot() });
}
