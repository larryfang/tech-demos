import { NextResponse } from "next/server";
import { parsePhoneNumberFromString } from "libphonenumber-js";
import { getCredentials, lookupNumber, SinchApiError } from "@/lib/sinch";

export async function POST(request: Request) {
  let body: { number?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  if (typeof body.number !== "string" || body.number.trim() === "") {
    return NextResponse.json(
      { error: "missing_number", message: "Provide a phone number" },
      { status: 400 },
    );
  }

  const parsed = parsePhoneNumberFromString(body.number.trim());
  if (!parsed?.isValid()) {
    return NextResponse.json(
      {
        error: "invalid_number",
        message: "Not a valid phone number — Sinch requires a single E.164 number",
      },
      { status: 400 },
    );
  }

  const creds = getCredentials();
  if (!creds) {
    return NextResponse.json(
      {
        error: "credentials_required",
        message:
          "Sinch credentials are not configured. Set SINCH_PROJECT_ID, SINCH_KEY_ID and SINCH_KEY_SECRET.",
      },
      { status: 503 },
    );
  }

  try {
    const result = await lookupNumber(creds, parsed.number);
    return NextResponse.json({ result });
  } catch (err) {
    if (err instanceof SinchApiError) {
      return NextResponse.json(
        { error: "sinch_error", message: err.message, detail: err.detail },
        { status: err.status >= 400 && err.status < 600 ? err.status : 502 },
      );
    }
    return NextResponse.json(
      { error: "network_error", message: "Could not reach the Sinch API" },
      { status: 502 },
    );
  }
}
