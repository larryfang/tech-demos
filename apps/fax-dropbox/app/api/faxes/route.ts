import { NextRequest, NextResponse } from "next/server";
import { getConfig, listFaxes, sendFax, SinchApiError } from "@/lib/sinch";

function credentialsRequired(missing: string[]) {
  return NextResponse.json(
    { error: "credentials_required", message: `Missing env vars: ${missing.join(", ")}`, missing },
    { status: 503 },
  );
}

function apiError(err: unknown) {
  if (err instanceof SinchApiError) {
    return NextResponse.json({ error: "sinch_api_error", status: err.status, message: err.message }, { status: 502 });
  }
  return NextResponse.json({ error: "internal_error", message: String(err) }, { status: 500 });
}

export async function GET(req: NextRequest) {
  const { config, missing } = getConfig();
  if (!config) return credentialsRequired(missing);
  const direction = req.nextUrl.searchParams.get("direction");
  try {
    const faxes = await listFaxes(config, direction === "INBOUND" || direction === "OUTBOUND" ? direction : undefined);
    return NextResponse.json({ faxes });
  } catch (err) {
    return apiError(err);
  }
}

export async function POST(req: NextRequest) {
  const { config, missing } = getConfig();
  if (!config) return credentialsRequired(missing);
  const form = await req.formData();
  const to = form.get("to");
  const file = form.get("file");
  if (typeof to !== "string" || !/^\+\d{6,15}$/.test(to)) {
    return NextResponse.json({ error: "bad_request", message: "`to` must be E.164, e.g. +19898989898" }, { status: 400 });
  }
  if (!(file instanceof File) || file.type !== "application/pdf") {
    return NextResponse.json({ error: "bad_request", message: "`file` must be a PDF" }, { status: 400 });
  }
  try {
    const fax = await sendFax(config, to, file);
    return NextResponse.json({ fax }, { status: 201 });
  } catch (err) {
    return apiError(err);
  }
}
