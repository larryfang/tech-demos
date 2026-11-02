import { resolveMx } from "node:dns/promises";
import { NextRequest, NextResponse } from "next/server";
import {
  checkSyntax,
  localDidYouMean,
  type LocalChecks,
  type MailgunValidation,
  type ValidateResponse,
} from "@/lib/validation";

const MAILGUN_BASE = process.env.MAILGUN_API_BASE ?? "https://api.mailgun.net";

async function runLocalChecks(address: string): Promise<LocalChecks> {
  const syntax = checkSyntax(address);
  const local: LocalChecks = {
    syntaxValid: syntax.valid,
    syntaxReason: syntax.reason,
    didYouMean: localDidYouMean(address),
    mxChecked: false,
    hasMx: false,
    mxRecords: [],
  };
  if (syntax.valid) {
    const domain = address.slice(address.lastIndexOf("@") + 1);
    try {
      const records = await resolveMx(domain);
      local.mxChecked = true;
      local.hasMx = records.length > 0;
      local.mxRecords = records
        .sort((a, b) => a.priority - b.priority)
        .slice(0, 3)
        .map((r) => r.exchange);
    } catch {
      // NXDOMAIN / no MX records — the domain can't receive mail.
      local.mxChecked = true;
    }
  }
  return local;
}

async function callMailgun(
  address: string,
  apiKey: string,
): Promise<{ mailgun: MailgunValidation | null; error: string | null }> {
  const url = `${MAILGUN_BASE}/v4/address/validate?address=${encodeURIComponent(address)}`;
  const auth = Buffer.from(`api:${apiKey}`).toString("base64");
  for (let attempt = 0; attempt < 2; attempt++) {
    const res = await fetch(url, { headers: { Authorization: `Basic ${auth}` } });
    if (res.status === 429 && attempt === 0) {
      await new Promise((r) => setTimeout(r, 1500));
      continue;
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { mailgun: null, error: `Mailgun API error ${res.status}: ${body.slice(0, 200)}` };
    }
    return { mailgun: (await res.json()) as MailgunValidation, error: null };
  }
  return { mailgun: null, error: "Mailgun API rate limited (429) after retry" };
}

export async function POST(req: NextRequest) {
  let address: unknown;
  try {
    ({ address } = await req.json());
  } catch {
    return NextResponse.json({ error: "invalid JSON body" }, { status: 400 });
  }
  if (typeof address !== "string" || !address.trim()) {
    return NextResponse.json({ error: "address (string) is required" }, { status: 400 });
  }
  const trimmed = address.trim();

  const apiKey = process.env.MAILGUN_API_KEY;
  const local = await runLocalChecks(trimmed);

  let mailgun: MailgunValidation | null = null;
  let mailgunError: string | null = null;
  if (!apiKey) {
    mailgunError = "missing_credentials";
  } else if (local.syntaxValid) {
    ({ mailgun, error: mailgunError } = await callMailgun(trimmed, apiKey));
  }

  const payload: ValidateResponse = {
    address: trimmed,
    local,
    credentialed: Boolean(apiKey),
    mailgun,
    mailgunError,
  };
  return NextResponse.json(payload);
}
