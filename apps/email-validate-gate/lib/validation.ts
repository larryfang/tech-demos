export type MailgunValidation = {
  address: string;
  is_disposable_address: boolean;
  is_role_address: boolean;
  reason: string[];
  result: "deliverable" | "undeliverable" | "do_not_send" | "catch_all" | "unknown";
  risk: "low" | "medium" | "high" | "unknown";
  did_you_mean: string | null;
  engagement?: { engaged: boolean; is_bot: boolean } | null;
  root_address?: string | null;
};

export type LocalChecks = {
  syntaxValid: boolean;
  syntaxReason: string | null;
  didYouMean: string | null;
  mxChecked: boolean;
  hasMx: boolean;
  mxRecords: string[];
};

export type ValidateResponse = {
  address: string;
  local: LocalChecks;
  credentialed: boolean;
  mailgun: MailgunValidation | null;
  mailgunError: string | null;
};

// Pragmatic RFC 5322-ish check; Mailgun does the authoritative validation.
const EMAIL_RE =
  /^[A-Za-z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?(?:\.[A-Za-z0-9](?:[A-Za-z0-9-]{0,61}[A-Za-z0-9])?)+$/;

export function checkSyntax(address: string): { valid: boolean; reason: string | null } {
  if (!address) return { valid: false, reason: "empty address" };
  if (address.length > 512) return { valid: false, reason: "longer than 512 characters" };
  if (!address.includes("@")) return { valid: false, reason: "missing @" };
  if (!EMAIL_RE.test(address)) return { valid: false, reason: "not a valid address format" };
  return { valid: true, reason: null };
}

const POPULAR_DOMAINS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "icloud.com",
  "aol.com",
  "proton.me",
  "live.com",
];

function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp = Array.from({ length: m + 1 }, (_, i) => [i, ...Array(n).fill(0)]);
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1),
      );
    }
  }
  return dp[m][n];
}

/** Local typo suggestion against a short list of popular domains (distance <= 2). */
export function localDidYouMean(address: string): string | null {
  const at = address.lastIndexOf("@");
  if (at < 1) return null;
  const localPart = address.slice(0, at);
  const domain = address.slice(at + 1).toLowerCase();
  if (!domain || POPULAR_DOMAINS.includes(domain)) return null;
  let best: { domain: string; dist: number } | null = null;
  for (const candidate of POPULAR_DOMAINS) {
    const dist = levenshtein(domain, candidate);
    if (dist <= 2 && (!best || dist < best.dist)) best = { domain: candidate, dist };
  }
  return best ? `${localPart}@${best.domain}` : null;
}
