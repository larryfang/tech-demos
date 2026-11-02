import { parsePhoneNumberFromString } from "libphonenumber-js";

export interface OfflineParse {
  input: string;
  valid: boolean;
  e164?: string;
  international?: string;
  national?: string;
  country?: string;
  callingCode?: string;
  numberType?: string;
  possible?: boolean;
}

/** Local parse via libphonenumber-js — runs fully offline, no API involved. */
export function parseOffline(input: string, defaultCountry?: string): OfflineParse {
  const trimmed = input.trim();
  const parsed = parsePhoneNumberFromString(
    trimmed,
    defaultCountry as Parameters<typeof parsePhoneNumberFromString>[1],
  );
  if (!parsed) {
    return { input: trimmed, valid: false };
  }
  return {
    input: trimmed,
    valid: parsed.isValid(),
    possible: parsed.isPossible(),
    e164: parsed.number,
    international: parsed.formatInternational(),
    national: parsed.formatNational(),
    country: parsed.country,
    callingCode: parsed.countryCallingCode,
    numberType: parsed.getType() ?? undefined,
  };
}

export interface SinchLookup {
  number: string;
  countryCode?: string;
  traceId?: string;
  line?: {
    carrier?: string;
    type?: string;
    mobileCountryCode?: string;
    mobileNetworkCode?: string;
    ported?: boolean;
    portingDate?: string;
    error?: { status?: number; title?: string; detail?: string } | null;
  } | null;
  simSwap?: {
    swapped?: boolean;
    swapPeriod?: string;
    error?: { status?: number; title?: string; detail?: string } | null;
  } | null;
  voIPDetection?: {
    probability?: "Unknown" | "Low" | "Likely" | "High";
    error?: { status?: number; title?: string; detail?: string } | null;
  } | null;
}

export type RiskLevel = "low" | "elevated" | "high" | "unknown";

export interface RiskAssessment {
  level: RiskLevel;
  reasons: string[];
}

const RECENT_SWAP_PERIODS = new Set(["SP4H", "SP12H", "SP24H", "SP48H"]);

export const SWAP_PERIOD_LABELS: Record<string, string> = {
  SP4H: "within 4 hours",
  SP12H: "within 12 hours",
  SP24H: "within 24 hours",
  SP48H: "within 48 hours",
  SP5D: "within 5 days",
  SP7D: "within 7 days",
  SP14D: "within 14 days",
  SP30D: "within 30 days",
  SPMAX: "beyond 30 days",
  Undefined: "undetermined period",
};

/**
 * Risk summary derived from real Sinch response fields only
 * (simSwap.swapped/swapPeriod and voIPDetection.probability).
 */
export function deriveRisk(result: SinchLookup): RiskAssessment {
  const reasons: string[] = [];
  let high = false;
  let elevated = false;
  let signals = 0;

  const simSwap = result.simSwap;
  if (simSwap && !simSwap.error) {
    signals++;
    if (simSwap.swapped) {
      const period = SWAP_PERIOD_LABELS[simSwap.swapPeriod ?? ""] ?? simSwap.swapPeriod;
      if (RECENT_SWAP_PERIODS.has(simSwap.swapPeriod ?? "")) {
        high = true;
        reasons.push(`SIM swap detected ${period}`);
      } else {
        elevated = true;
        reasons.push(`SIM swap detected (${period ?? "period unknown"})`);
      }
    }
  }

  const voip = result.voIPDetection;
  if (voip && !voip.error && voip.probability && voip.probability !== "Unknown") {
    signals++;
    if (voip.probability === "High") {
      high = true;
      reasons.push("High probability the number is VoIP");
    } else if (voip.probability === "Likely") {
      elevated = true;
      reasons.push("Number is likely VoIP");
    }
  }

  const level: RiskLevel = high ? "high" : elevated ? "elevated" : "low";

  if (signals === 0) {
    return {
      level: "unknown",
      reasons: ["No risk features returned usable data for this number"],
    };
  }
  if (reasons.length === 0) {
    reasons.push("No SIM swap detected and no VoIP signal");
  }
  return { level, reasons };
}
