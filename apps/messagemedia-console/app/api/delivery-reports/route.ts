import { checkDeliveryReports, confirmDeliveryReports, errorResponse, requireConfig } from "@/lib/messagemedia";
import { attachReports } from "@/lib/store";

export async function POST() {
  try {
    const config = requireConfig();
    const reports = await checkDeliveryReports(config);
    attachReports(reports);
    await confirmDeliveryReports(config, reports.map((r) => r.delivery_report_id));
    return Response.json({ received: reports.length, confirmed: reports.length });
  } catch (error) {
    return errorResponse(error);
  }
}
