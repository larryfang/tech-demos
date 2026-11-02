import { connection, NextResponse } from "next/server";
import { getConfig, mailgunFetch, NOT_CONFIGURED } from "@/lib/mailgun";

export async function GET() {
  await connection();
  const config = getConfig();
  if (!config) return NextResponse.json(NOT_CONFIGURED, { status: 200 });

  try {
    const res = await mailgunFetch(config, `/v4/domains/${config.domain}`);
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({
        configured: true,
        domain: config.domain,
        from: config.from,
        baseUrl: config.baseUrl,
        domainState: "error",
        error: `Mailgun rejected the domain lookup (HTTP ${res.status}): ${text.slice(0, 200)}`,
      });
    }
    const data = await res.json();
    return NextResponse.json({
      configured: true,
      domain: config.domain,
      from: config.from,
      baseUrl: config.baseUrl,
      domainState: data?.domain?.state ?? "unknown",
      domainType: data?.domain?.type ?? "unknown",
    });
  } catch (err) {
    return NextResponse.json({
      configured: true,
      domain: config.domain,
      from: config.from,
      baseUrl: config.baseUrl,
      domainState: "error",
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
