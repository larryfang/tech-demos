import { missingEnvVars } from "@/lib/sinch";

export function GET() {
  const missing = missingEnvVars();
  return Response.json({ configured: missing.length === 0, missing });
}
