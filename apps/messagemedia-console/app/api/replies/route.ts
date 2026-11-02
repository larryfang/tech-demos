import { checkReplies, confirmReplies, errorResponse, requireConfig } from "@/lib/messagemedia";
import { addReplies } from "@/lib/store";

export async function POST() {
  try {
    const config = requireConfig();
    const replies = await checkReplies(config);
    addReplies(replies);
    await confirmReplies(config, replies.map((r) => r.reply_id));
    return Response.json({ received: replies.length, confirmed: replies.length });
  } catch (error) {
    return errorResponse(error);
  }
}
