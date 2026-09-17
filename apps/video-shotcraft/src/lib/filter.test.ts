import { describe, expect, test } from "bun:test"
import { featuredFirst, filterShots } from "./filter"
import { STORYBOARD, WORKBENCH, WORKBENCH_TOTAL_FRAMES } from "./ink-press"
import { SHOTS, shotById } from "./shots"

describe("gallery fixtures", () => {
  test("seeds a library, not a single card", () => {
    expect(SHOTS.length).toBeGreaterThanOrEqual(20)
    const categories = new Set(SHOTS.map((shot) => shot.category))
    expect(categories.size).toBeGreaterThanOrEqual(6)
  })

  test("Mailgun Inspect is the featured product", () => {
    const featured = SHOTS.filter((shot) => shot.featured)
    expect(featured.length).toBeGreaterThanOrEqual(8)
    expect(featured.every((shot) => shot.products.includes("inspect"))).toBe(true)
    expect(featuredFirst(SHOTS)[0]?.products).toContain("inspect")
  })

  test("Agent Tools stays a secondary card", () => {
    const agent = SHOTS.filter((shot) => shot.products.includes("agent-tools"))
    expect(agent.length).toBeGreaterThanOrEqual(1)
    expect(agent.every((shot) => !shot.featured)).toBe(true)
  })
})

describe("filterShots", () => {
  test("search finds Inspect recipe names", () => {
    const found = filterShots(SHOTS, {
      q: "spotlight",
      category: "all",
      product: "all",
    })
    expect(found.map((shot) => shot.id)).toContain("spotlight-hero-card")
  })

  test("category + product narrow the library", () => {
    const found = filterShots(SHOTS, {
      q: "",
      category: "interaction",
      product: "inspect",
    })
    expect(found.map((shot) => shot.id)).toEqual(["type-and-filter"])
  })

  test("Agent Tools filter hides the Inspect hero", () => {
    const found = filterShots(SHOTS, {
      q: "",
      category: "all",
      product: "agent-tools",
    })
    expect(found.every((shot) => shot.products.includes("agent-tools"))).toBe(true)
    expect(found.map((shot) => shot.id)).not.toContain("brand-ink-open")
  })
})

describe("Ink Press storyboard", () => {
  test("walks problem → Salesforce → previews → ship", () => {
    expect(STORYBOARD).toHaveLength(10)
    expect(STORYBOARD.map((beat) => beat.shotId)).toEqual([
      "brand-ink-open",
      "paper-title-card",
      "crane-rise-reveal",
      "spotlight-hero-card",
      "deck-deal-flyin",
      "type-and-filter",
      "row-embed",
      "list-stack-press",
      "document-typewriter-reveal",
      "outro-group-photo-launch",
    ])
    expect(STORYBOARD.map((beat) => beat.track)).toEqual([
      "product",
      "problem",
      "problem",
      "product",
      "preview",
      "preview",
      "preview",
      "preview",
      "preview",
      "ship",
    ])
    for (const beat of STORYBOARD) {
      expect(shotById(beat.shotId).products).toContain("inspect")
    }
  })

  test("workbench tracks cover the 36.2s reel", () => {
    expect(WORKBENCH.filter((clip) => clip.track === "shot")).toHaveLength(10)
    expect(WORKBENCH_TOTAL_FRAMES).toBe(1085)
  })
})
