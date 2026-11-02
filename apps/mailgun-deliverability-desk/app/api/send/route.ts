import { NextResponse } from "next/server";
import { getClient, getConfig, NOT_CONFIGURED } from "@/lib/mailgun";


export async function POST(request: Request) {
  const config = getConfig();
  if (!config) return NextResponse.json(NOT_CONFIGURED, { status: 503 });

  const body = await request.json();
  const to = typeof body.to === "string" ? body.to.trim() : "";
  const subject = typeof body.subject === "string" ? body.subject.trim() : "";
  const text = typeof body.text === "string" ? body.text : "";
  if (!to || !subject || !text) {
    return NextResponse.json(
      { error: "to, subject and text are all required" },
      { status: 400 },
    );
  }

  try {
    const mg = getClient(config);
    const result = await mg.messages.create(config.domain, {
      from: config.from,
      to: [to],
      subject,
      text,
      html: `<p>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/\n/g, "<br/>")}</p><p><a href="https://documentation.mailgun.com/docs/mailgun/">Tracked link: Mailgun docs</a></p>`,
      "o:tracking": "yes",
      "o:tracking-opens": "yes",
      "o:tracking-clicks": "yes",
      "o:tag": ["deliverability-desk"],
    });
    return NextResponse.json({ id: result.id, message: result.message });
  } catch (err) {
    const e = err as { status?: number; details?: string; message?: string };
    return NextResponse.json(
      { error: e.details ?? e.message ?? "Mailgun send failed" },
      { status: e.status && e.status >= 400 ? e.status : 502 },
    );
  }
}
