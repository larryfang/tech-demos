import type { Cue } from "@/lib/types";

export function formatTimestamp(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
  }
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function cueIndexAt(cues: Cue[], time: number): number {
  if (cues.length === 0) return 0;
  let index = 0;
  for (let i = 0; i < cues.length; i += 1) {
    if (cues[i].start <= time) index = i;
    else break;
  }
  return index;
}

export function clampTime(time: number, duration: number): number {
  if (!Number.isFinite(time)) return 0;
  return Math.min(Math.max(0, time), Math.max(0, duration));
}

export function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || "notes";
}
