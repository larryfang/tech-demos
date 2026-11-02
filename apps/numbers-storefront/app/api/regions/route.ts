import { NextRequest } from "next/server";
import { Numbers } from "@sinch/sdk-core";
import {
  credentialsRequiredResponse,
  getSinchClient,
  sinchErrorResponse,
} from "@/lib/sinch";

export async function GET(request: NextRequest) {
  const sinch = getSinchClient();
  if (!sinch) return credentialsRequiredResponse();

  const type = request.nextUrl.searchParams.get("type");
  try {
    const response = await sinch.numbers.availableRegions.list(
      type ? { types: [type as Numbers.NumberTypeEnum] } : {},
    );
    const regions = (response.availableRegions ?? [])
      .map((region) => ({
        regionCode: region.regionCode ?? "",
        regionName: region.regionName ?? region.regionCode ?? "",
        types: region.types ?? [],
      }))
      .filter((region) => region.regionCode)
      .sort((a, b) => a.regionName.localeCompare(b.regionName));
    return Response.json({ regions });
  } catch (err) {
    return sinchErrorResponse(err);
  }
}
