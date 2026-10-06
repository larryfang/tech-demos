import { DEFAULT_NARRATION, styleLabel, structureLabel } from "@/lib/catalog";
import type { Beat, Motif, ScenePlan, StructureId, StyleId } from "@/lib/types";

const MOTIFS: Motif[] = ["rise", "pan", "pulse", "scatter", "reveal"];

export function splitClauses(text: string): string[] {
  const cleaned = text.replace(/\s+/g, " ").trim();
  if (!cleaned) return [DEFAULT_NARRATION];

  const parts = cleaned
    .split(/(?<=[.!?])\s+|(?<=;)\s+/)
    .map((part) => part.replace(/[.,;:]+$/g, "").trim())
    .filter(Boolean);

  if (parts.length === 0) return [DEFAULT_NARRATION];
  if (parts.length === 1) {
    const words = parts[0].split(/\s+/);
    if (words.length >= 8) {
      const mid = Math.ceil(words.length / 2);
      return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
    }
  }
  return parts.slice(0, 6);
}

function chunkWords(text: string, size: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  if (words.length === 0) return [DEFAULT_NARRATION];
  const chunks: string[] = [];
  for (let i = 0; i < words.length; i += size) {
    chunks.push(words.slice(i, i + size).join(" "));
  }
  return chunks.slice(0, 6);
}

function coda(style: StyleId): string {
  switch (style) {
    case "cave":
      return "The torch keeps the wall awake.";
    case "monet":
      return "Water holds the last color.";
    case "ukiyo":
      return "The block prints the sea again.";
    case "eightbit":
      return "Another brick. Another jump.";
    case "bauhaus":
      return "Form is the only plot.";
    case "starry":
      return "The sky refuses to sit still.";
  }
}

function questionFor(style: StyleId, first: string): string {
  if (first.includes("?")) return first;
  return `What still moves in a ${styleLabel(style).toLowerCase()}?`;
}

export function captionsFor(
  narration: string,
  style: StyleId,
  structure: StructureId,
): string[] {
  const clauses = splitClauses(narration);
  const first = clauses[0] ?? DEFAULT_NARRATION;
  const rest = clauses.slice(1);

  switch (structure) {
    case "storytime": {
      const setup = first;
      const turn = rest[0] ?? `${first} — then it leans.`;
      const close = rest[1] ?? coda(style);
      return [setup, turn, close];
    }
    case "kinetic":
      return chunkWords(clauses.join(" "), 3);
    case "whiteboard": {
      const steps = [...clauses, coda(style)].slice(0, 4);
      return steps.map((step, index) => `${index + 1}. ${step}`);
    }
    case "vox": {
      const context = rest[0] ?? `${first} is only the opening cut.`;
      const kicker = rest[1] ?? coda(style);
      return [questionFor(style, first), context, kicker];
    }
  }
}

function placeBeats(captions: string[]): Beat[] {
  const count = Math.max(1, captions.length);
  const duration = Math.min(14, Math.max(8, count * 2.2));
  const start = 0.28;
  const span = duration - start - 1.35;
  return captions.map((caption, index) => ({
    at: Number((start + (span * index) / Math.max(1, count - 1 || 1)).toFixed(2)),
    caption,
    motif: MOTIFS[index % MOTIFS.length],
  }));
}

export function stubPlan(input: {
  narration: string;
  style: StyleId;
  structure: StructureId;
}): ScenePlan {
  const captions = captionsFor(input.narration, input.style, input.structure);
  const beats = placeBeats(captions);
  const last = beats[beats.length - 1];
  const duration = Number(Math.max(8, (last?.at ?? 6) + 2.1).toFixed(2));
  return {
    title: `${styleLabel(input.style)} · ${structureLabel(input.structure)}`,
    duration,
    beats,
  };
}

export function currentBeatIndex(beats: Beat[], time: number): number {
  if (beats.length === 0) return -1;
  let index = 0;
  for (let i = 0; i < beats.length; i += 1) {
    if (time >= beats[i].at) index = i;
  }
  return index;
}

export function formatClock(seconds: number): string {
  const safe = Math.max(0, seconds);
  const tenths = Math.round(safe * 10);
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  const t = tenths % 10;
  return `${m}:${s.toString().padStart(2, "0")}.${t}`;
}

export function isStyleId(value: string): value is StyleId {
  return ["cave", "monet", "ukiyo", "eightbit", "bauhaus", "starry"].includes(value);
}

export function isStructureId(value: string): value is StructureId {
  return ["storytime", "kinetic", "whiteboard", "vox"].includes(value);
}

export function sanitizePlan(raw: unknown, fallback: ScenePlan): ScenePlan {
  if (!raw || typeof raw !== "object") return fallback;
  const plan = raw as Partial<ScenePlan>;
  if (!Array.isArray(plan.beats) || plan.beats.length === 0) return fallback;

  const motifs = new Set<Motif>(MOTIFS);
  const beats: Beat[] = plan.beats
    .map((beat) => {
      if (!beat || typeof beat !== "object") return null;
      const at = Number(beat.at);
      const caption = typeof beat.caption === "string" ? beat.caption.trim() : "";
      const motif = motifs.has(beat.motif as Motif) ? (beat.motif as Motif) : "pulse";
      if (!Number.isFinite(at) || !caption) return null;
      return {
        at: Math.max(0, at),
        caption: caption.slice(0, 120),
        motif,
      };
    })
    .filter((beat): beat is Beat => beat !== null)
    .sort((a, b) => a.at - b.at)
    .slice(0, 8);

  if (beats.length === 0) return fallback;

  const duration = Number(plan.duration);
  const lastAt = beats[beats.length - 1].at;
  return {
    title:
      typeof plan.title === "string" && plan.title.trim()
        ? plan.title.trim().slice(0, 80)
        : fallback.title,
    duration: Number.isFinite(duration)
      ? Math.min(20, Math.max(lastAt + 1.2, duration))
      : Math.max(8, lastAt + 2),
    beats,
  };
}
