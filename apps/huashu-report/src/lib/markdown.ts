import { CHART_MODE_LABEL, prototypeById } from "./prototypes"
import type { Report } from "./types"

function sourceLine(report: Report, index: number): string {
  const chart = report.charts[index]
  if (!chart) return ""
  return `Source: collected by ${chart.collectedBy}; analysis by ${chart.analyzedBy}. N=${chart.n.toLocaleString("en-US")}. Unit: ${chart.unit}.`
}

export function reportToMarkdown(report: Report): string {
  const proto = prototypeById(report.prototype)
  const lines: string[] = []
  lines.push(`# ${report.title}`)
  lines.push("")
  lines.push(`*${proto.name} · ${report.dateLabel} · stub, N=${report.n.toLocaleString("en-US")}*`)
  lines.push("")
  lines.push(report.oneLiner)
  lines.push("")
  lines.push("## Outline")
  for (const item of report.outline) {
    lines.push(`- **${item.title}** — ${item.bullets[0] ?? ""}`)
  }
  lines.push("")
  lines.push("## Chart stubs")
  report.charts.forEach((chart, i) => {
    lines.push(`### ${chart.number}. ${chart.title}`)
    lines.push("")
    lines.push(`Mode: ${CHART_MODE_LABEL[chart.mode]} (\`${chart.mode}\`).`)
    if (chart.surveyQuestion) lines.push(`Questionnaire: ${chart.surveyQuestion}`)
    lines.push(sourceLine(report, i))
    lines.push("")
    lines.push("_SVG renders in the HTML preview; markdown keeps the conclusion title, mode, N, and source._")
    lines.push("")
  })
  lines.push("## Findings")
  report.findings.forEach((f, i) => lines.push(`${i + 1}. ${f}`))
  lines.push("")
  lines.push("## Mechanism")
  lines.push(report.mechanism)
  lines.push("")
  lines.push("## Literature position")
  lines.push(report.literature)
  lines.push("")
  if (report.prototype === "paper") {
    lines.push("## Contributions")
    report.contributions.forEach((c, i) => lines.push(`${i + 1}. ${c}`))
    lines.push("")
  }
  lines.push("## Limitations (argue against itself)")
  lines.push(report.limitations)
  lines.push("")
  if (report.prototype === "deck" || report.prototype === "popular") {
    lines.push("## What to do")
    report.actions.forEach((a) => lines.push(`- ${a}`))
    lines.push("")
  }
  lines.push("## Sources")
  report.sources.forEach((s) => {
    lines.push(`- ${s.org} (${s.year}). ${s.title}.`)
  })
  lines.push("")
  lines.push("> Appendix is a literature table, not a reprint of the data grid. Length follows source count, not data-point count.")
  return lines.join("\n")
}
