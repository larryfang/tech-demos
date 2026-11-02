import { NextResponse } from "next/server";
import {
  APPLICATION_HOOK_PATH,
  CONVERSATION_HOOK_PATH,
  tapConfig,
} from "@/lib/config";


// Local single-user debugger: exposing the configured secrets to its own UI
// is intentional, so the user can mirror them in the Sinch dashboard.
export async function GET() {
  return NextResponse.json({
    conversationHookPath: CONVERSATION_HOOK_PATH,
    applicationHookPath: APPLICATION_HOOK_PATH,
    conversationSecret: tapConfig.conversationSecret,
    applicationKey: tapConfig.applicationKey,
    applicationSecret: tapConfig.applicationSecret,
    usingDemoDefaults:
      !process.env.CONVERSATION_WEBHOOK_SECRET && !process.env.SINCH_APPLICATION_KEY,
  });
}
