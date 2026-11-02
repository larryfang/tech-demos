const GSM7 =
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM7_EXT = "^{}\\[~]|€";

/** Estimate SMS encoding, length in septets/code units, and segment count. */
export function estimateSegments(body: string): {
  encoding: "GSM-7" | "UCS-2";
  units: number;
  segments: number;
} {
  let gsm = true;
  let units = 0;
  for (const ch of body) {
    if (GSM7.includes(ch)) units += 1;
    else if (GSM7_EXT.includes(ch)) units += 2;
    else {
      gsm = false;
      break;
    }
  }
  if (!gsm) {
    units = [...body].length;
    const segments = units === 0 ? 0 : units <= 70 ? 1 : Math.ceil(units / 67);
    return { encoding: "UCS-2", units, segments };
  }
  const segments = units === 0 ? 0 : units <= 160 ? 1 : Math.ceil(units / 153);
  return { encoding: "GSM-7", units, segments };
}
