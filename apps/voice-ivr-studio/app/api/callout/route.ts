import { NextResponse } from "next/server";
import { getSinchConfig } from "@/lib/sinch";
import { buildSvaml, validateFlow, type Flow } from "@/lib/svaml";

type CalloutBody = {
  destination: string;
  cli: string;
  flow: Flow;
};

/**
 * Places a REAL callout via the Sinch Voice API (`POST /calling/v1/callouts`,
 * method `customCallout`, Basic Auth with application key/secret).
 *
 * ICE dials the destination; ACE (built from the flow) runs when answered.
 * https://developers.sinch.com/docs/voice/api-reference/voice/callouts/callouts.md
 */
export async function POST(request: Request) {
  const cfg = getSinchConfig();
  if (!cfg.configured) {
    return NextResponse.json(
      {
        error:
          "Sinch credentials are not configured. Set SINCH_APPLICATION_KEY and SINCH_APPLICATION_SECRET and restart the server.",
      },
      { status: 503 },
    );
  }

  const body = (await request.json()) as CalloutBody;
  const destination = body.destination?.trim() ?? "";
  const cli = (body.cli?.trim() || cfg.defaultCli).trim();

  if (!/^\+\d{6,15}$/.test(destination)) {
    return NextResponse.json(
      { error: "Destination must be an E.164 number, e.g. +14045005000." },
      { status: 400 },
    );
  }
  if (!/^\+\d{6,15}$/.test(cli)) {
    return NextResponse.json(
      {
        error:
          "CLI (caller id) must be an E.164 number assigned to your Sinch Voice app — without it the call never connects.",
      },
      { status: 400 },
    );
  }
  const flowProblems = validateFlow(body.flow);
  if (flowProblems.length > 0) {
    return NextResponse.json({ error: flowProblems.join(" ") }, { status: 400 });
  }

  const ace = buildSvaml(body.flow);
  const ice = {
    action: { name: "connectPstn", number: destination, cli },
  };

  const calloutRequest = {
    method: "customCallout",
    customCallout: {
      cli,
      destination: { type: "number", endpoint: destination },
      ice: JSON.stringify(ice),
      ace: JSON.stringify(ace),
      enableAce: true,
    },
  };

  const auth = Buffer.from(`${cfg.applicationKey}:${cfg.applicationSecret}`).toString("base64");

  let response: Response;
  try {
    response = await fetch(`${cfg.baseUrl}/calling/v1/callouts`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(calloutRequest),
    });
  } catch (err) {
    return NextResponse.json(
      { error: `Network error reaching Sinch: ${err instanceof Error ? err.message : String(err)}` },
      { status: 502 },
    );
  }

  const text = await response.text();
  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    payload = { raw: text };
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: `Sinch API error (HTTP ${response.status})`, details: payload },
      { status: response.status },
    );
  }

  return NextResponse.json({
    callId: (payload as { callId?: string }).callId ?? null,
    sinchResponse: payload,
    region: cfg.region,
  });
}
