/** Normalize a typed number toward E.164. US 10-digit numbers get +1. */
export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return "";
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  if (hasPlus) return `+${digits}`;
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return `+${digits}`;
}

export function isE164(phone: string): boolean {
  return /^\+[1-9]\d{7,14}$/.test(phone);
}

export function formatPhone(phone: string): string {
  const normalized = normalizePhone(phone);
  const match = /^\+1(\d{3})(\d{3})(\d{4})$/.exec(normalized);
  if (match) return `+1 ${match[1]} ${match[2]} ${match[3]}`;
  return normalized || phone;
}
