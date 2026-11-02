import { NextResponse } from "next/server";
import { getConfig, getFax, SinchApiError } from "@/lib/sinch";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { config, missing } = getConfig();
  if (!config) {
    return NextResponse.json({ error: "credentials_required", missing }, { status: 503 });
  }
  const { id } = await params;
  try {
    const fax = await getFax(config, id);
    return NextResponse.json({ fax });
  } catch (err) {
    if (err instanceof SinchApiError) {
      return NextResponse.json({ error: "sinch_api_error", status: err.status, message: err.message }, { status: 502 });
    }
    return NextResponse.json({ error: "internal_error", message: String(err) }, { status: 500 });
  }
}
