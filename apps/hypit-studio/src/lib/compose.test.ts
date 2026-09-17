import { describe, expect, test } from "bun:test"
import { composeClone, defaultPicks } from "./compose"
import { CLONES, cloneById } from "./fixtures"
import { renderSvml } from "./svml"

describe("fixtures", () => {
  test("seeds ranking and podcast clones with three variable kinds", () => {
    expect(CLONES.map((clone) => clone.id)).toEqual([
      "ranking-goat",
      "podcast-creatine",
    ])
    for (const clone of CLONES) {
      expect(clone.invariants.length).toBeGreaterThanOrEqual(3)
      expect(clone.variables.map((slot) => slot.kind).sort()).toEqual([
        "broll",
        "caption",
        "effect",
      ])
      expect(clone.anchors.length).toBeGreaterThanOrEqual(4)
      expect(clone.anchors.every((anchor) => anchor.word.length > 0)).toBe(true)
    }
  })
})

describe("composeClone", () => {
  test("defaults to the first option in each slot", () => {
    const clone = cloneById("ranking-goat")
    const composed = composeClone(clone, defaultPicks(clone))
    expect(composed.slots.map((slot) => slot.option.id)).toEqual([
      "comedy-sports",
      "color-box",
      "board-slide",
    ])
    const hat = composed.anchors.find((anchor) => anchor.id === "hat-trick")
    expect(hat?.broll?.id).toBe("comedy-sports")
    expect(hat?.effect?.id).toBe("board-slide")
  })

  test("swapping B-roll / caption / effect recomposes only those slots", () => {
    const clone = cloneById("podcast-creatine")
    const picks = {
      ...defaultPicks(clone),
      broll: "skincare",
      caption: "nameplates",
      effect: "sticker-burst",
    }
    const composed = composeClone(clone, picks)
    expect(composed.slots.find((slot) => slot.kind === "broll")?.option.id).toBe(
      "skincare",
    )
    expect(composed.anchors.find((anchor) => anchor.id === "creatine")?.broll?.insert).toContain(
      "dropper",
    )
    expect(composed.anchors.find((anchor) => anchor.id === "flour")?.effect?.id).toBe(
      "sticker-burst",
    )
    expect(composed.clone.invariants[0]?.id).toBe("split-screen")
  })
})

describe("renderSvml", () => {
  test("writes invariants, selected variables, and word anchors", () => {
    const clone = cloneById("ranking-goat")
    const svml = renderSvml(
      composeClone(clone, { broll: "founders", caption: "sticker-punch", effect: "glitch-sting" }),
    )
    expect(svml.startsWith("svml ranking-goat 20s 9:16")).toBe(true)
    expect(svml).toContain("invariant shot shot-right")
    expect(svml).toContain("variable broll broll = founders")
    expect(svml).toContain('event @ "hat trick"')
    expect(svml).toContain("effect glitch-sting")
    expect(svml).toContain("hoodie-keynote")
    expect(svml).not.toContain("comedy-sports")
  })
})
