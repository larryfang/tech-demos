import type { BrandKit } from "./types"

const northstarLogo = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><circle cx="32" cy="32" r="30" stroke="currentColor" stroke-width="2"/><path d="M32 10 L36 28 L54 32 L36 36 L32 54 L28 36 L10 32 L28 28 Z" fill="currentColor"/></svg>`

const voltLogo = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect x="4" y="4" width="56" height="56" rx="14" stroke="currentColor" stroke-width="2"/><path d="M36 10 L22 34 H34 L28 54 L46 28 H32 Z" fill="currentColor"/></svg>`

const harborLogo = `<svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M12 44 C20 28 28 28 32 40 C36 28 44 28 52 44" stroke="currentColor" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M18 20 L46 20 L40 48 L24 48 Z" stroke="currentColor" stroke-width="2" fill="none"/><path d="M24 20 L28 12 L36 12 L40 20" stroke="currentColor" stroke-width="2" fill="none" stroke-linejoin="round"/></svg>`

export const BRAND_KITS: BrandKit[] = [
  {
    id: "northstar",
    name: "Northstar Labs",
    tagline: "Quiet tools for loud ideas.",
    fonts: {
      heading: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
      body: '"Gill Sans", "Trebuchet MS", "Segoe UI", sans-serif',
    },
    palette: {
      primary: "#c9a227",
      secondary: "#1c3a5f",
      accent: "#e8d5a3",
      background: "#0b1c33",
      foreground: "#f4efe4",
      muted: "#8ea0b8",
    },
    logoSvg: northstarLogo,
  },
  {
    id: "volt",
    name: "Volt & Co",
    tagline: "Ship the spark.",
    fonts: {
      heading: '"Avenir Next", "Segoe UI", system-ui, sans-serif',
      body: '"Avenir Next", "Segoe UI", system-ui, sans-serif',
    },
    palette: {
      primary: "#d6ff3f",
      secondary: "#1a1a1a",
      accent: "#7dffb3",
      background: "#111111",
      foreground: "#f5f5f0",
      muted: "#8c8c86",
    },
    logoSvg: voltLogo,
  },
  {
    id: "harbor",
    name: "Harbor Paper",
    tagline: "Stories, folded once.",
    fonts: {
      heading: '"Source Serif 4", "Iowan Old Style", Georgia, serif',
      body: '"Source Sans 3", "Segoe UI", sans-serif',
    },
    palette: {
      primary: "#c45c3e",
      secondary: "#2c2420",
      accent: "#e8b89a",
      background: "#f3eadc",
      foreground: "#2a211c",
      muted: "#8a7468",
    },
    logoSvg: harborLogo,
  },
]

export function kitById(id: string): BrandKit {
  const kit = BRAND_KITS.find((item) => item.id === id)
  if (!kit) throw new Error(`Unknown brand kit: ${id}`)
  return kit
}
