export const PROTOTYPE_IDS = [
  "academic",
  "deck",
  "survey",
  "research",
  "paper",
  "popular",
] as const

export type PrototypeId = (typeof PROTOTYPE_IDS)[number]

export const CHART_MODES = [
  "hbar",
  "stacked",
  "paired",
  "line",
  "bigStat",
  "diverging",
  "slope",
  "quadrant",
] as const

export type ChartMode = (typeof CHART_MODES)[number]

export const PIPELINE_STEPS = ["outline", "charts", "preview"] as const
export type PipelineStep = (typeof PIPELINE_STEPS)[number]

export type TitleStyle = "conclusion" | "neutral"

export interface Prototype {
  id: PrototypeId
  name: string
  reader: string
  format: string
  titleStyle: TitleStyle
  figureLabel: "Figure" | "Exhibit"
  chartModes: ChartMode[]
  skeleton: string[]
}

export interface OutlineItem {
  id: string
  title: string
  bullets: string[]
}

export interface Source {
  org: string
  title: string
  year: number
}

export type ChartSpec =
  | {
      mode: "hbar"
      data: Array<[string, number]>
      fmt?: string
    }
  | {
      mode: "stacked"
      rows: Array<[string, number[]]>
      legend: string[]
    }
  | {
      mode: "paired"
      groups: Array<[string, number, number]>
      series: [string, string]
      unit?: string
    }
  | {
      mode: "line"
      series: Array<[string, number[], string]>
      xlabels: string[]
      unit?: string
    }
  | {
      mode: "bigStat"
      value: string
      caption: string
      sub?: string
    }
  | {
      mode: "diverging"
      rows: Array<[string, number[], number[]]>
      legend: string[]
    }
  | {
      mode: "slope"
      pairs: Array<[string, number, number, string]>
      leftLabel: string
      rightLabel: string
      unit?: string
    }
  | {
      mode: "quadrant"
      points: Array<[string, number, number, string]>
      xlab: string
      ylab: string
      qlabels: Array<[number, number, string]>
    }

export interface ChartStub {
  id: string
  number: string
  mode: ChartMode
  title: string
  kicker?: string
  surveyQuestion?: string
  n: number
  unit: string
  collectedBy: string
  analyzedBy: string
  spec: ChartSpec
}

export interface Report {
  prototype: PrototypeId
  topic: string
  title: string
  oneLiner: string
  dateLabel: string
  n: number
  outline: OutlineItem[]
  charts: ChartStub[]
  findings: string[]
  mechanism: string
  literature: string
  limitations: string
  actions: string[]
  sources: Source[]
  contributions: string[]
}
