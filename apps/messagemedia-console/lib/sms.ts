const GSM7_BASIC =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞ\x1bÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXTENDED = "^{}\\[~]|€\f";

export type Encoding = "GSM-7" | "UCS-2";

export function isE164(number: string) {
  return /^\+[1-9]\d{6,14}$/.test(number.trim());
}

export function segmentInfo(text: string) {
  const chars = Array.from(text);
  const gsm = chars.every((c) => GSM7_BASIC.includes(c) || GSM7_EXTENDED.includes(c));
  if (gsm) {
    const units = chars.reduce((n, c) => n + (GSM7_EXTENDED.includes(c) ? 2 : 1), 0);
    const segments = units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153);
    return { encoding: "GSM-7" as Encoding, units, segments, perSegment: segments > 1 ? 153 : 160 };
  }
  const units = text.length;
  const segments = units <= 70 ? 1 : Math.ceil(units / 67);
  return { encoding: "UCS-2" as Encoding, units, segments, perSegment: segments > 1 ? 67 : 70 };
}
