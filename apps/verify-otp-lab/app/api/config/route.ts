import { connection } from "next/server";
import { isConfigured, missingEnvVars } from "@/lib/sinch";

export async function GET() {
  await connection();
  return Response.json({
    configured: isConfigured(),
    missing: missingEnvVars(),
  });
}
