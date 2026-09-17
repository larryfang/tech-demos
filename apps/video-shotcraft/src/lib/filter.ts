import type { GalleryQuery, Shot } from "./types"

export function normalizeQuery(q: string) {
  return q.trim().toLowerCase()
}

export function matchesShot(shot: Shot, query: GalleryQuery) {
  if (query.category !== "all" && shot.category !== query.category) return false
  if (query.product !== "all" && !shot.products.includes(query.product)) {
    return false
  }
  const needle = normalizeQuery(query.q)
  if (!needle) return true
  const hay = [
    shot.name,
    shot.summary,
    shot.use,
    shot.energy,
    shot.category,
    ...shot.tags,
    ...shot.products,
  ]
    .join(" ")
    .toLowerCase()
  return hay.includes(needle)
}

export function filterShots(shots: readonly Shot[], query: GalleryQuery) {
  return shots.filter((shot) => matchesShot(shot, query))
}

export function featuredFirst(shots: readonly Shot[]) {
  return [...shots].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)))
}
