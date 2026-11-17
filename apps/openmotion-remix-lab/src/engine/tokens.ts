import type { BrandKit, BrandPalette, PaletteKey } from "../fixtures/types"

const TOKEN_RE = /\{\{(brand|tagline)\}\}/g

export function applyTextTokens(text: string, kit: BrandKit): string {
  return text.replace(TOKEN_RE, (_full, key: string) => {
    if (key === "brand") return kit.name
    if (key === "tagline") return kit.tagline
    return _full
  })
}

export function mergePalette(
  kit: BrandKit,
  overrides?: Partial<BrandPalette>,
): BrandPalette {
  return { ...kit.palette, ...overrides }
}

export function tokenCss(palette: BrandPalette, kit: BrandKit): string {
  return [
    `--om-primary:${palette.primary}`,
    `--om-secondary:${palette.secondary}`,
    `--om-accent:${palette.accent}`,
    `--om-bg:${palette.background}`,
    `--om-fg:${palette.foreground}`,
    `--om-muted:${palette.muted}`,
    `--om-heading:${kit.fonts.heading}`,
    `--om-body:${kit.fonts.body}`,
  ].join(";")
}

export function colorFor(palette: BrandPalette, key: PaletteKey): string {
  return palette[key]
}
