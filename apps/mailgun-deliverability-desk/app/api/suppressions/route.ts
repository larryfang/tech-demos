import { NextResponse } from "next/server";
import { getConfig, mailgunFetch, NOT_CONFIGURED, type MailgunConfig } from "@/lib/mailgun";


async function fetchList(config: MailgunConfig, kind: string) {
  const res = await mailgunFetch(config, `/v3/${config.domain}/${kind}?limit=25`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${kind} query failed (HTTP ${res.status}): ${text.slice(0, 200)}`);
  }
  const data = await res.json();
  return Array.isArray(data.items) ? data.items : [];
}

export async function GET() {
  const config = getConfig();
  if (!config) return NextResponse.json(NOT_CONFIGURED, { status: 503 });

  try {
    const [bounces, complaints, unsubscribes] = await Promise.all([
      fetchList(config, "bounces"),
      fetchList(config, "complaints"),
      fetchList(config, "unsubscribes"),
    ]);
    return NextResponse.json({ bounces, complaints, unsubscribes });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : String(err) },
      { status: 502 },
    );
  }
}
