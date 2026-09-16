import { describe, expect, test } from "bun:test"
import { hbar, pairedBars, renderChart } from "./charts"
import { generateReport } from "./generate"
import { reportToMarkdown } from "./markdown"
import { ALL_CHART_MODES, PROTOTYPES } from "./prototypes"
import { CHART_MODES, PROTOTYPE_IDS } from "./types"

describe("generateReport", () => {
  test("is deterministic for the same prototype and topic", () => {
    const a = generateReport("academic", "Enterprise AI agent deployment")
    const b = generateReport("academic", "Enterprise AI agent deployment")
    expect(a.oneLiner).toBe(b.oneLiner)
    expect(a.n).toBe(b.n)
    expect(a.charts.map((c) => c.title)).toEqual(b.charts.map((c) => c.title))
  })

  test("covers six prototypes with filled outlines", () => {
    expect(PROTOTYPE_IDS).toHaveLength(6)
    for (const id of PROTOTYPE_IDS) {
      const report = generateReport(id, "Enterprise AI agent deployment")
      expect(report.outline.length).toBeGreaterThan(2)
      expect(report.charts).toHaveLength(PROTOTYPES.find((p) => p.id === id)?.chartModes.length ?? 0)
      expect(report.limitations.toLowerCase()).toContain("not a causal")
    }
  })

  test("uses conclusion titles except on research notes", () => {
    const academic = generateReport("academic", "Enterprise AI agent deployment")
    const research = generateReport("research", "HBM vs other DRAM wafer share")
    expect(academic.charts[0]?.title.includes("Exhibit")).toBe(false)
    expect(academic.charts.every((c) => c.title.length > 12)).toBe(true)
    expect(research.charts.every((c) => c.number.startsWith("Exhibit"))).toBe(true)
    expect(research.charts.some((c) => /HBM|wafer|share|function|mix|time/i.test(c.title))).toBe(true)
  })

  test("union of prototype chart sets is all eight modes", () => {
    const used = new Set(PROTOTYPES.flatMap((p) => p.chartModes))
    expect([...used].sort()).toEqual([...ALL_CHART_MODES].sort())
    expect(CHART_MODES).toHaveLength(8)
  })

  test("markdown keeps source, N, and conclusion titles", () => {
    const report = generateReport("survey", "News avoidance among under-35s")
    const md = reportToMarkdown(report)
    expect(md).toContain("## Outline")
    expect(md).toContain("## Chart stubs")
    expect(md).toContain(`N=${report.n.toLocaleString("en-US")}`)
    expect(md).toContain("Source:")
    expect(md).toContain(report.charts[0]?.title ?? "missing")
  })
})

describe("charts", () => {
  test("paired bars draw negatives below the zero line", () => {
    const svg = pairedBars(
      [
        ["Licensed", 12, 31],
        ["G&A", 4, -11],
      ],
      { series: ["2024", "2026"], unit: "%" },
    )
    expect(svg).toContain("xmlns=\"http://www.w3.org/2000/svg\"")
    expect(svg).toContain("data-zero=\"1\"")
    expect(svg).toContain('data-signed="-11"')
    expect(svg).toContain("-11%")
    const zero = svg.match(/data-zero="1"[^>]*y1="([\d.]+)"/)
    const neg = svg.match(/data-signed="-11"[^>]*y="([\d.]+)"[^>]*height="([\d.]+)"/)
    expect(zero && neg).toBeTruthy()
    if (zero && neg) {
      const zeroY = Number(zero[1])
      const barY = Number(neg[1])
      const height = Number(neg[2])
      expect(barY).toBeGreaterThanOrEqual(zeroY - 0.05)
      expect(height).toBeGreaterThan(8)
    }
  })

  test("signed horizontal bars keep a zero line and clay negatives", () => {
    const svg = hbar(
      [
        ["R&D", 22],
        ["G&A", -11],
      ],
      { fmt: "{:+}%" },
    )
    expect(svg).toContain("+22%")
    expect(svg).toContain("-11%")
    expect(svg).toContain("data-zero=\"1\"")
    expect(svg).toContain('data-signed="-11"')
  })

  test("renderChart emits svg for every mode", () => {
    const specs = [
      renderChart({ mode: "hbar", data: [["A", 10], ["B", 4]] }),
      renderChart({
        mode: "stacked",
        rows: [["X", [40, 60]]],
        legend: ["Yes", "No"],
      }),
      renderChart({
        mode: "paired",
        groups: [["A", 10, 12]],
        series: ["t0", "t1"],
      }),
      renderChart({
        mode: "line",
        series: [["now", [1, 2, 4], "#14505e"]],
        xlabels: ["a", "b", "c"],
      }),
      renderChart({ mode: "bigStat", value: "42%", caption: "avoid news" }),
      renderChart({
        mode: "diverging",
        rows: [["Ops", [10, 20], [30, 10]]],
        legend: ["down", "up"],
      }),
      renderChart({
        mode: "slope",
        pairs: [["APAC", 11, 22, "#14505e"]],
        leftLabel: "2024",
        rightLabel: "2026",
      }),
      renderChart({
        mode: "quadrant",
        points: [["Support", 80, 20, "#a4551f"]],
        xlab: "x",
        ylab: "y",
        qlabels: [[20, 80, "NW"]],
      }),
    ]
    expect(specs).toHaveLength(8)
    for (const svg of specs) {
      expect(svg.startsWith("<svg")).toBe(true)
      expect(svg).toContain("</svg>")
    }
  })
})
