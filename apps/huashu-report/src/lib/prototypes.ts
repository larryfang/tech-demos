import type { ChartMode, Prototype, PrototypeId } from "./types"

export const PROTOTYPES: Prototype[] = [
  {
    id: "academic",
    name: "Academic",
    reader: "Cite your numbers",
    format: "Vertical · Figure N.M · argue against itself",
    titleStyle: "conclusion",
    figureLabel: "Figure",
    chartModes: ["hbar", "line", "paired", "quadrant"],
    skeleton: [
      "Cover, numbered-fact abstract",
      "Research question and evidence base",
      "Findings (one theme per chapter)",
      "Mechanism: competing hypotheses",
      "Limitations and alternative explanations",
      "Conclusion beyond the abstract",
      "Sources (literature table, not a data dump)",
    ],
  },
  {
    id: "deck",
    name: "Consulting deck",
    reader: "Take it into a meeting",
    format: "16:9 · one conclusion per page",
    titleStyle: "conclusion",
    figureLabel: "Figure",
    chartModes: ["bigStat", "slope", "stacked", "diverging"],
    skeleton: [
      "Cover: title is the conclusion",
      "Content map (section / topics / page)",
      "Executive summary (3–5 lines)",
      "Methodology page (sample mix)",
      "Body: one conclusion per page",
      "Actions (3–5)",
      "Closing / disclaimer",
    ],
  },
  {
    id: "survey",
    name: "Survey",
    reader: "Understand a population",
    format: "Two-column · questionnaire item under each chart",
    titleStyle: "conclusion",
    figureLabel: "Figure",
    chartModes: ["bigStat", "diverging", "stacked", "hbar"],
    skeleton: [
      "Foreword",
      "Method digest (markets, N, field dates, weights)",
      "Key findings",
      "Body with embedded charts + original questions",
      "Breakouts by group",
      "Appendix: method, not raw tables",
    ],
  },
  {
    id: "research",
    name: "Research note",
    reader: "Look up a specific number",
    format: "Exhibits · dense tables · neutral titles",
    titleStyle: "neutral",
    figureLabel: "Exhibit",
    chartModes: ["paired", "hbar", "line", "stacked"],
    skeleton: [
      "Timestamp + analyst + thesis",
      "Exhibit 1–N (neutral titles)",
      "Sector / region tables",
      "Valuation and risks",
      "Disclaimer",
    ],
  },
  {
    id: "paper",
    name: "Paper (arXiv)",
    reader: "Peer review / submit",
    format: "IMRaD · English · contributions listed",
    titleStyle: "conclusion",
    figureLabel: "Figure",
    chartModes: ["line", "quadrant", "paired", "slope"],
    skeleton: [
      "Title, authors, abstract",
      "Introduction + contributions (3–5)",
      "Related work",
      "Data & methods",
      "Results",
      "Discussion (competing hypotheses)",
      "Limitations (evidence validity, not tooling)",
      "Conclusion + references",
    ],
  },
  {
    id: "popular",
    name: "Popular science",
    reader: "No background, then act",
    format: "Three-act · scene open · method in the margin",
    titleStyle: "conclusion",
    figureLabel: "Figure",
    chartModes: ["bigStat", "slope", "hbar", "stacked"],
    skeleton: [
      "Act I — a scene, then the question",
      "Act II — evidence, method in the sidebar",
      "Act III — so what, plus a toolbox",
    ],
  },
]

export function prototypeById(id: PrototypeId): Prototype {
  const found = PROTOTYPES.find((p) => p.id === id)
  if (!found) throw new Error(`Unknown prototype: ${id}`)
  return found
}

export const ALL_CHART_MODES: ChartMode[] = [
  "hbar",
  "stacked",
  "paired",
  "line",
  "bigStat",
  "diverging",
  "slope",
  "quadrant",
]

export const CHART_MODE_LABEL: Record<ChartMode, string> = {
  hbar: "Horizontal bars",
  stacked: "100% stacked row",
  paired: "Paired columns",
  line: "Line, labeled at the end",
  bigStat: "Big-number anchor",
  diverging: "Diverging stacked bars",
  slope: "Slope (then → now)",
  quadrant: "Quadrant, labeled in place",
}
