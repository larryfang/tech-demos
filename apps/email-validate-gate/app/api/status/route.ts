import { connection, NextResponse } from "next/server";

export async function GET() {
  await connection();
  return NextResponse.json({
    credentialed: Boolean(process.env.MAILGUN_API_KEY),
    apiBase: process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net",
  });
}
