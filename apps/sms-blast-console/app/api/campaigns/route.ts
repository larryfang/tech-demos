import { NextRequest, NextResponse } from "next/server";
import { getConfigState, getSinchClient } from "@/lib/sinch";
import { listCampaigns, saveCampaign } from "@/lib/store";
import { PENDING_STATUSES, type Campaign, type RecipientState } from "@/lib/types";

/** List campaigns; with ?refresh=1, re-fetch delivery reports for unsettled batches. */
export async function GET(request: NextRequest) {
  const refresh = request.nextUrl.searchParams.get("refresh") === "1";
  const sinch = getSinchClient();

  if (refresh && sinch) {
    await Promise.all(
      listCampaigns()
        .filter((c) => !c.settled)
        .map(async (campaign) => {
          try {
            const report = await sinch.sms.deliveryReports.get({
              batch_id: campaign.batchId,
              type: "full",
            });
            const byNumber = new Map<string, RecipientState>();
            for (const s of report.statuses ?? []) {
              for (const number of s.recipients ?? []) {
                byNumber.set(number, { number, status: s.status, code: Number(s.code) });
              }
            }
            campaign.recipients = campaign.recipients.map(
              (r) => byNumber.get(r.number) ?? r,
            );
            campaign.settled = campaign.recipients.every(
              (r) => !PENDING_STATUSES.has(r.status),
            );
            saveCampaign(campaign);
          } catch {
            // Report may not be available yet right after send; keep last known state.
          }
        }),
    );
  }

  return NextResponse.json({ campaigns: listCampaigns() });
}

/** Create a campaign: submits one real SMS batch to Sinch. */
export async function POST(request: NextRequest) {
  const config = getConfigState();
  const sinch = getSinchClient();
  if (!sinch) {
    return NextResponse.json(
      {
        error: `Sinch credentials required — set ${config.missing.join(", ")} (see README). No message was sent.`,
      },
      { status: 503 },
    );
  }

  const payload = (await request.json()) as {
    name?: string;
    from?: string;
    body?: string;
    recipients?: string[];
  };

  const name = payload.name?.trim();
  const from = payload.from?.trim() || config.defaultFrom || "";
  const body = payload.body ?? "";
  const recipients = [
    ...new Set((payload.recipients ?? []).map((r) => r.trim()).filter(Boolean)),
  ];

  if (!name || !body.trim() || recipients.length === 0) {
    return NextResponse.json(
      { error: "Campaign name, message body, and at least one recipient are required." },
      { status: 400 },
    );
  }
  const badNumbers = recipients.filter((r) => !/^\+?[1-9]\d{6,14}$/.test(r));
  if (badNumbers.length > 0) {
    return NextResponse.json(
      { error: `Recipients must be E.164 numbers (e.g. +15551234567). Invalid: ${badNumbers.join(", ")}` },
      { status: 400 },
    );
  }

  try {
    const response = await sinch.sms.batches.sendTextMessage({
      sendSMSRequestBody: {
        to: recipients,
        ...(from ? { from } : {}),
        body,
        type: "mt_text",
        delivery_report: "full",
        client_reference: name,
      },
    });

    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name,
      from: response.from ?? from,
      body,
      batchId: response.id ?? "",
      createdAt: new Date().toISOString(),
      recipients: recipients.map((number) => ({ number, status: "Queued" })),
      settled: false,
    };
    saveCampaign(campaign);
    return NextResponse.json({ campaign }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Sinch API rejected the batch: ${message}` },
      { status: 502 },
    );
  }
}
