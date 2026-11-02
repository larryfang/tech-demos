import { NextRequest } from "next/server";
import { Numbers } from "@sinch/sdk-core";
import {
  credentialsRequiredResponse,
  getSinchClient,
  sinchErrorResponse,
} from "@/lib/sinch";

const NUMBER_TYPES = ["LOCAL", "MOBILE", "TOLL_FREE"];
const CAPABILITIES = ["SMS", "VOICE"];

export async function GET(request: NextRequest) {
  const sinch = getSinchClient();
  if (!sinch) return credentialsRequiredResponse();

  const params = request.nextUrl.searchParams;
  const regionCode = params.get("regionCode")?.trim().toUpperCase() ?? "";
  const type = params.get("type") ?? "";
  if (!/^[A-Z]{2}$/.test(regionCode) || !NUMBER_TYPES.includes(type)) {
    return Response.json(
      {
        error:
          "regionCode must be an ISO 3166-1 alpha-2 code and type one of LOCAL, MOBILE, TOLL_FREE.",
        code: "bad_request",
      },
      { status: 400 },
    );
  }

  const capabilities = (params.get("capabilities") ?? "")
    .split(",")
    .filter((capability) => CAPABILITIES.includes(capability));
  const pattern = params.get("pattern")?.trim();

  try {
    const response = await sinch.numbers.availableNumber.list({
      regionCode,
      type: type as Numbers.NumberTypeEnum,
      ...(capabilities.length > 0 && {
        capabilities: capabilities as Numbers.CapabilitiesEnum[],
      }),
      ...(pattern && {
        "numberPattern.pattern": pattern,
        "numberPattern.searchPattern": "CONTAIN" as const,
      }),
      size: 24,
    });
    return Response.json({ numbers: response.availableNumbers ?? [] });
  } catch (err) {
    return sinchErrorResponse(err);
  }
}
