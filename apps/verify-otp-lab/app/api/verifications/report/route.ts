import { Verification } from "@sinch/sdk-core";
import {
  credentialsRequiredResponse,
  getVerificationService,
  sinchErrorResponse,
} from "@/lib/sinch";


export async function POST(request: Request) {
  const { method, id, code, cli } = (await request.json()) as {
    method?: string;
    id?: string;
    code?: string;
    cli?: string;
  };

  if (!id) {
    return Response.json(
      { error: "bad_request", message: "id (verification ID) is required" },
      { status: 400 },
    );
  }
  if (method === "sms" && !code) {
    return Response.json(
      { error: "bad_request", message: "code is required for SMS report" },
      { status: 400 },
    );
  }
  if (method === "flashcall" && !cli) {
    return Response.json(
      {
        error: "bad_request",
        message:
          "cli (the full caller ID of the missed call) is required for flashcall report",
      },
      { status: 400 },
    );
  }
  if (method !== "sms" && method !== "flashcall") {
    return Response.json(
      { error: "bad_request", message: "method must be 'sms' or 'flashcall'" },
      { status: 400 },
    );
  }

  const verification = getVerificationService();
  if (!verification) return credentialsRequiredResponse();

  try {
    if (method === "sms") {
      const requestData =
        Verification.reportVerificationByIdHelper.buildSmsRequest(id, code!);
      const response =
        await verification.verifications.reportSmsById(requestData);
      return Response.json({ method, request: requestData, response });
    }
    const requestData =
      Verification.reportVerificationByIdHelper.buildFlashCallRequest(id, cli!);
    const response =
      await verification.verifications.reportFlashCallById(requestData);
    return Response.json({ method, request: requestData, response });
  } catch (error) {
    return sinchErrorResponse(error);
  }
}
