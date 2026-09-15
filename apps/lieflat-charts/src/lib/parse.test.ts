import { describe, expect, test } from "bun:test"
import { niceMax, parseInput, ranked, tickStep } from "./parse"

describe("parseInput", () => {
  test("parses CSV with inferred label/value columns", () => {
    const result = parseInput(`plan,mrr_k
Enterprise,184
Growth,96`)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dataset.rows).toEqual([
      { label: "Enterprise", value: 184, note: undefined },
      { label: "Growth", value: 96, note: undefined },
    ])
    expect(result.dataset.title).toBe("mrr k by plan")
  })

  test("parses JSON rows with metadata", () => {
    const result = parseInput(
      JSON.stringify({
        title: "Trees planted",
        source: "GREEN OPS",
        unit: "k trees",
        rows: [
          { year: 2019, trees: 12, note: "pilot" },
          { year: 2020, trees: 18 },
        ],
      }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dataset.title).toBe("Trees planted")
    expect(result.dataset.source).toBe("GREEN OPS")
    expect(result.dataset.unit).toBe("k trees")
    expect(result.dataset.rows[0]).toEqual({
      label: "2019",
      value: 12,
      note: "pilot",
    })
  })

  test("parses labels + values JSON", () => {
    const result = parseInput(
      JSON.stringify({ labels: ["A", "B"], values: [3, 7], title: "AB" }),
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.dataset.rows.map((r) => r.value)).toEqual([3, 7])
  })

  test("rejects empty input", () => {
    const result = parseInput("   ")
    expect(result.ok).toBe(false)
  })
})

describe("chart helpers", () => {
  test("ranks rows descending", () => {
    expect(ranked([{ label: "a", value: 2 }, { label: "b", value: 9 }])[0].label).toBe(
      "b",
    )
  })

  test("picks countable tick steps", () => {
    expect(tickStep(10)).toBe(1)
    expect(niceMax(184)).toBe(200)
  })
})
