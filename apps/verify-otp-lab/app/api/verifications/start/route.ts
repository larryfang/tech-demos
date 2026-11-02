import { Verification } from "@sinch/sdk-core";
import {
  credentialsRequiredResponse,
  getVerificationService,
  sinchErrorResponse,
} from "@/lib/sinch";


const E164 = /^\+[1-9]\d{6,14}$/;

export async function POST(request: Request) {
  const { method, phoneNumber } = (await request.json()) as {
    method?: string;
    phoneNumber?: string;
  };

  if (method !== "sms" && method !== "flashcall") {
    return Response.json(
      { error: "bad_request", message: "method must be 'sms' or 'flashcall'" },
      { status: 400 },
    );
  }
  if (!phoneNumber || !E164.test(phoneNumber)) {
    return Response.json(
      {
        error: "bad_request",
        message: "phoneNumber must be in E.164 format, e.g. +12025550134",
      },
      { status: 400 },
    );
  }

  const verification = getVerificationService();
  if (!verification) return credentialsRequiredResponse();

  try {
    if (method === "sms") {
      const requestData =
        Verification.startVerificationHelper.buildSmsRequest(phoneNumber);
      const response = await verification.verifications.startSms(requestData);
      return Response.json({
        method,
        request: requestData,
        response,
      });
    }
    const requestData =
      Verification.startVerificationHelper.buildFlashCallRequest(phoneNumber);
    const response = await verification.verifications.startFlashCall(requestData);
    return Response.json({ method, request: requestData, response });
  } catch (error) {
    return sinchErrorResponse(error);
  }
}
