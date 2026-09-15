export type PaletteName = "mono" | "porcelain"

export type Palette = {
  name: PaletteName
  label: string
  ink: string
  paper: string
  muted: string
  faint: string
  grid: string
  data: string
  dataSoft: string
  hero: string
  ladder: readonly string[]
}

/** Adapted from lieflat-charts `mono-tokens.js` — paper gray + charcoal ink. */
export const MONO: Palette = {
  name: "mono",
  label: "Mono",
  ink: "#1C1C1A",
  paper: "#F0EFEB",
  muted: "#8F8E88",
  faint: "#C6C5BF",
  grid: "#DEDDD6",
  data: "#1C1C1A",
  dataSoft: "#4A4944",
  hero: "#1C1C1A",
  ladder: ["#1C1C1A", "#4A4944", "#6A6963", "#8F8E88", "#B0AFA9"],
}

/** Adapted from lieflat-charts `color-presets.js` — Porcelain / 青瓷蓝. */
export const PORCELAIN: Palette = {
  name: "porcelain",
  label: "Porcelain",
  ink: "#081F5C",
  paper: "#F7F2EB",
  muted: "rgba(8,31,92,0.60)",
  faint: "rgba(8,31,92,0.32)",
  grid: "rgba(8,31,92,0.16)",
  data: "#334EAC",
  dataSoft: "#7096D1",
  hero: "#081F5C",
  ladder: ["#081F5C", "#334EAC", "#7096D1", "#BAD6EB"],
}

export const PALETTES = { mono: MONO, porcelain: PORCELAIN } as const

export function paletteOf(name: PaletteName): Palette {
  return PALETTES[name]
}
