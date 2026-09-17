export type Category =
  | "opening"
  | "typography"
  | "ui-entrance"
  | "camera"
  | "data"
  | "interaction"
  | "transition"
  | "rhythm"
  | "effects"
  | "outro"

export type ProductId = "inspect" | "agent-tools" | "library"

export type EnergyLevel = "low" | "mid" | "high" | "peak"

export interface RecipeParam {
  name: string
  typical: string
  feel: string
}

export interface Shot {
  id: string
  name: string
  summary: string
  use: string
  duration: string
  energy: string
  energyLevel: EnergyLevel
  category: Category
  tags: string[]
  products: ProductId[]
  featured?: boolean
  params: RecipeParam[]
  pitfalls: string[]
  sfx: string[]
}

export interface StoryboardBeat {
  id: string
  index: number
  shotId: string
  title: string
  start: string
  duration: string
  caption: string
  sfx: string
  track: "problem" | "product" | "preview" | "ship"
}

export interface WorkbenchClip {
  id: string
  track: "shot" | "caption" | "sfx"
  label: string
  from: number
  frames: number
  beatId: string
}

export interface GalleryQuery {
  q: string
  category: Category | "all"
  product: ProductId | "all"
}
