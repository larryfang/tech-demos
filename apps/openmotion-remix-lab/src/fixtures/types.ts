export type LayoutKind = "hero" | "split" | "stack" | "lower-third" | "end-card"
export type TransitionKind = "cut" | "fade" | "wipe" | "slide" | "zoom"
export type TextRole = "headline" | "subhead" | "cta" | "caption" | "kicker"
export type PaletteKey =
  | "primary"
  | "secondary"
  | "accent"
  | "background"
  | "foreground"
  | "muted"

export type MotionKeyframe = {
  at: number
  opacity?: number
  x?: number
  y?: number
  scale?: number
  rotate?: number
}

export type TextSlot = {
  id: string
  role: TextRole
  text: string
}

export type Shot = {
  id: string
  label: string
  durationMs: number
  layout: LayoutKind
  textSlots: TextSlot[]
  transitionIn: TransitionKind
  transitionMs: number
  keyframes: MotionKeyframe[]
  panelGlyph?: string
}

export type ReferenceClip = {
  id: string
  title: string
  logline: string
  aspect: "16:9" | "9:16"
  width: number
  height: number
  preview?: string
  shots: Shot[]
}

export type BrandPalette = Record<PaletteKey, string>

export type BrandKit = {
  id: string
  name: string
  tagline: string
  fonts: { heading: string; body: string }
  palette: BrandPalette
  logoSvg: string
}

export type SceneEdit = {
  durationMs?: number
  transitionIn?: TransitionKind
  transitionMs?: number
  text?: Record<string, string>
  colors?: Partial<BrandPalette>
}

export type EditMap = Record<string, SceneEdit>
