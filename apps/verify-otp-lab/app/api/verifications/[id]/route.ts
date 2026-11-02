import {
  credentialsRequiredResponse,
  getVerificationService,
  sinchErrorResponse,
} from "@/lib/sinch";


export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const verification = getVerificationService();
  if (!verification) return credentialsRequiredResponse();

  try {
    const response = await verification.verificationStatus.getById({ id });
    return Response.json({ request: { id }, response });
  } catch (error) {
    return sinchErrorResponse(error);
  }
}
