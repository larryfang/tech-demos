import { NextRequest } from "next/server";
import { Numbers } from "@sinch/sdk-core";
import {
  credentialsRequiredResponse,
  getSinchClient,
  sinchErrorResponse,
} from "@/lib/sinch";
import type { RentRequestDto } from "@/lib/types";

export async function POST(request: NextRequest) {
  const sinch = getSinchClient();
  if (!sinch) return credentialsRequiredResponse();

  let body: RentRequestDto;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body.", code: "bad_request" },
      { status: 400 },
    );
  }

  if (!body.phoneNumber || !/^\+\d{6,17}$/.test(body.phoneNumber)) {
    return Response.json(
      {
        error: "phoneNumber must be in E.164 format with a leading +.",
        code: "bad_request",
      },
      { status: 400 },
    );
  }

  const rentNumberRequestBody: Numbers.RentNumberRequest = {};
  if (body.smsServicePlanId?.trim()) {
    rentNumberRequestBody.smsConfiguration = {
      servicePlanId: body.smsServicePlanId.trim(),
    };
  }
  if (body.voiceAppId?.trim()) {
    rentNumberRequestBody.voiceConfiguration = {
      type: "RTC",
      appId: body.voiceAppId.trim(),
    };
  }
  if (body.callbackUrl?.trim()) {
    rentNumberRequestBody.callbackUrl = body.callbackUrl.trim();
  }

  try {
    const activeNumber = await sinch.numbers.availableNumber.rent({
      phoneNumber: body.phoneNumber,
      rentNumberRequestBody,
    });
    return Response.json({ activeNumber });
  } catch (err) {
    return sinchErrorResponse(err);
  }
}
