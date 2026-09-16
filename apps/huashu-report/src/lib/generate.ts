import { CLAY, TEAL, TEAL2, TEAL3 } from "./charts"
import { prototypeById } from "./prototypes"
import type {
  ChartMode,
  ChartSpec,
  ChartStub,
  OutlineItem,
  PrototypeId,
  Report,
  Source,
} from "./types"

function hashString(s: string): number {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

function mulberry32(seed: number): () => number {
  let a = seed | 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function jitter(rng: () => number, base: number, spread: number): number {
  return Math.round(base + (rng() * 2 - 1) * spread)
}

interface Pack {
  headline: (topic: string, pct: number, n: number) => string
  findings: (topic: string, pct: number, n: number) => string[]
  mechanism: (topic: string) => string
  literature: (topic: string) => string
  limitation: (topic: string, n: number) => string
  actions: (topic: string) => string[]
  contributions: (topic: string) => string[]
  titles: Record<ChartMode, { conclusion: string; neutral: string }>
  specs: (rng: () => number, pct: number) => Record<ChartMode, ChartSpec>
}

function defaultPack(topic: string): Pack {
  const short = topic.replace(/\.$/, "")
  return {
    headline: (_t, pct, n) =>
      `${pct}% of observed cases in ${short} moved in the same direction (N=${n.toLocaleString("en-US")}).`,
    findings: (_t, pct, n) => [
      `In a reconstructed sample of ${n.toLocaleString("en-US")}, ${pct}% of units show the same directional shift — a descriptive fact, not a causal claim.`,
      `The gap is concentrated in a few functions; averaging them into a single “AI adoption” rate hides the split.`,
      `External benchmarks (industry medians, not internal last-year comps) still sit above the in-sample median.`,
    ],
    mechanism: () =>
      `Competing hypothesis A: capability is the bottleneck. Competing hypothesis B: workflow redesign is. The stub data is consistent with B — teams that report “full autonomy” remain a single-digit share even where tools are licensed.`,
    literature: () =>
      `Relative to 2026 institution-grade surveys, this finding corroborates the “tools in, workflows lag” pattern, revises the idea that headcount cuts are uniform, and surfaces a dimension those frames rarely model: who is allowed to skip the human checkpoint.`,
    limitation: (_t, n) =>
      `This is a descriptive indicator, not a causal estimate. The reconstructed sample (N=${n.toLocaleString("en-US")}) is not a probability sample of the whole industry; we cannot rule out selection on firms that already publish numbers. We did not identify an instrument for “who adopted first.”`,
    actions: () => [
      "Publish the denominator next to every rate.",
      "Separate licensed tools from production autonomy.",
      "Track one external benchmark, not only last quarter.",
    ],
    contributions: () => [
      "A function-level split instead of a single adoption rate.",
      "An explicit competing-hypothesis paragraph, not a single story.",
      "A reconstructed N with inclusion rules stated up front.",
    ],
    titles: {
      hbar: {
        conclusion: `R&D, sales, and product are still hiring; service and G&A are not.`,
        neutral: `${short}: planned headcount change by function`,
      },
      stacked: {
        conclusion: `Most organizations sit in “pilot,” not “autonomous.”`,
        neutral: `${short}: maturity mix`,
      },
      paired: {
        conclusion: `Licensed access rose; fully autonomous runs did not keep pace.`,
        neutral: `${short}: licensed vs autonomous, two years`,
      },
      line: {
        conclusion: `The series steepens after 2024; it does not jump to majority share.`,
        neutral: `${short}: share over time`,
      },
      bigStat: {
        conclusion: `Only a single-digit share reports fully autonomous production agents.`,
        neutral: `${short}: headline rate`,
      },
      diverging: {
        conclusion: `Net hiring intent is positive in product, negative in G&A.`,
        neutral: `${short}: hiring intent (Likert)`,
      },
      slope: {
        conclusion: `Every tracked region moved up; the rank order barely changed.`,
        neutral: `${short}: region, then vs now`,
      },
      quadrant: {
        conclusion: `High-exposure, low-redesign roles cluster in the lower-right — the uncomfortable quadrant.`,
        neutral: `${short}: exposure vs redesign`,
      },
    },
    specs: (rng, pct) => {
      const p = (base: number, spread: number) => jitter(rng, base, spread)
      return {
        hbar: {
          mode: "hbar",
          data: [
            ["R&D", p(22, 4)],
            ["Sales", p(14, 3)],
            ["Product", p(11, 3)],
            ["Customer success", p(2, 2)],
            ["Marketing", p(-1, 2)],
            ["Support", p(-8, 3)],
            ["G&A", p(-11, 3)],
          ],
          fmt: "{:+}%",
        },
        stacked: {
          mode: "stacked",
          rows: [
            ["Enterprise", [p(18, 4), p(44, 5), p(31, 5), p(7, 2)]],
            ["Mid-market", [p(11, 3), p(39, 5), p(41, 5), p(9, 2)]],
            ["Public sector", [p(6, 2), p(28, 4), p(52, 5), p(14, 3)]],
          ].map(([lab, vals]) => {
            const nums = vals as number[]
            const sum = nums.reduce((a, b) => a + b, 0)
            const scaled = nums.map((v) => Math.max(1, Math.round((v / sum) * 100)))
            const drift = 100 - scaled.reduce((a, b) => a + b, 0)
            scaled[1] += drift
            return [lab, scaled] as [string, number[]]
          }),
          legend: ["Autonomous", "Supervised", "Pilot", "None"],
        },
        paired: {
          mode: "paired",
          groups: [
            ["Licensed", p(39, 5), p(65, 6)],
            ["In production", p(18, 4), p(31, 5)],
            ["Autonomous", p(4, 2), p(Math.max(5, pct - 8), 2)],
          ],
          series: ["2024", "2026"],
          unit: "%",
        },
        line: {
          mode: "line",
          series: [
            [`${pct}% now`, [8, 11, 16, 24, pct], TEAL],
            ["Industry median", [12, 14, 18, 22, p(28, 4)], TEAL3],
          ],
          xlabels: ["2022", "2023", "2024", "2025", "2026"],
          unit: "%",
        },
        bigStat: {
          mode: "bigStat",
          value: `${pct}%`,
          caption: `share in ${short} at the headline cut`,
          sub: `up from ${Math.max(5, pct - 13)}% two years earlier`,
        },
        diverging: {
          mode: "diverging",
          rows: [
            ["Product", [6, 11], [38, 22]],
            ["R&D", [8, 14], [33, 18]],
            ["Sales", [12, 18], [28, 16]],
            ["Support", [24, 31], [12, 8]],
            ["G&A", [29, 34], [9, 5]],
          ],
          legend: ["Decrease a lot", "Decrease", "Increase", "Increase a lot"],
        },
        slope: {
          mode: "slope",
          pairs: [
            ["Americas", p(19, 3), p(31, 4), TEAL],
            ["EMEA", p(14, 3), p(24, 4), TEAL2],
            ["APAC", p(11, 3), p(22, 4), CLAY],
          ],
          leftLabel: "2024",
          rightLabel: "2026",
          unit: "%",
        },
        quadrant: {
          mode: "quadrant",
          points: [
            ["Support ops", 78, 22, CLAY],
            ["Claims desk", 71, 28, CLAY],
            ["Sales ops", 64, 41, TEAL3],
            ["Analyst", 58, 62, TEAL2],
            ["Product", 44, 71, TEAL],
            ["Research", 39, 77, TEAL],
            ["Legal intake", 81, 18, CLAY],
            ["Design", 36, 68, TEAL2],
          ],
          xlab: "Task exposure →",
          ylab: "Workflow redesign →",
          qlabels: [
            [22, 82, "Redesigned, low exposure"],
            [78, 82, "Redesigned, high exposure"],
            [22, 18, "Neither"],
            [78, 18, "Exposed, not redesigned"],
          ],
        },
      }
    },
  }
}

function packFor(topic: string): Pack {
  const t = topic.toLowerCase()
  const pack = defaultPack(topic)
  if (t.includes("news") || t.includes("avoid")) {
    pack.headline = (_t, pct, n) =>
      `${pct}% of under-35 respondents say they sometimes or often avoid news (N=${n.toLocaleString("en-US")}).`
    pack.titles.bigStat.conclusion =
      "Younger readers are not “uninformed”; a growing share is choosing to look away."
    pack.titles.diverging.conclusion =
      "Avoidance is up across markets; the increase is largest where trust was already thin."
    pack.findings = (_t, pct, n) => [
      `${pct}% of under-35s in a reconstructed ${n.toLocaleString("en-US")}-person field sometimes or often avoid news — up 13pp from 2017, not 13%.`,
      `The questionnaire item matters: “avoid” is not “uninterested.” The original wording has to travel with the chart.`,
      `Markets with the highest avoidance are not the ones with the lowest supply; they are the ones with the lowest trust.`,
    ]
  }
  if (t.includes("hbm") || t.includes("dram") || t.includes("wafer") || t.includes("memory")) {
    pack.headline = (_t, pct) =>
      `HBM’s wafer claim is the ${pct}% that matters; the rest of DRAM is the gray remainder.`
    pack.titles.stacked.conclusion =
      "Color answers one question: how much of this wafer is reserved for AI."
    pack.titles.paired.conclusion =
      "Spot prices after the cutover dwarf the pre-announcement band."
  }
  if (t.includes("headcount") || t.includes("hiring") || t.includes("function")) {
    pack.headline = () =>
      "Growing teams and declining teams are both “AI strategy”; mixing them into one rate is the mistake."
  }
  return pack
}

function figureNumber(prototype: PrototypeId, index: number): string {
  const proto = prototypeById(prototype)
  if (proto.figureLabel === "Exhibit") return `Exhibit ${index + 1}`
  if (prototype === "academic") return `Figure 2.${index + 1}.1`
  return `Figure ${index + 1}`
}

function outlineFor(id: PrototypeId, topic: string, pack: Pack, pct: number, n: number): OutlineItem[] {
  const proto = prototypeById(id)
  const findings = pack.findings(topic, pct, n)
  return proto.skeleton.map((title, i) => ({
    id: `${id}-${i}`,
    title,
    bullets:
      i === 0
        ? [pack.headline(topic, pct, n)]
        : i === proto.skeleton.length - 2
          ? [pack.limitation(topic, n)]
          : [findings[i % findings.length] ?? title],
  }))
}

function sourcesFor(topic: string): Source[] {
  return [
    { org: "Stanford HAI", title: `AI Index — reconstructed notes on ${topic}`, year: 2026 },
    { org: "McKinsey", title: "The state of AI in 2026 (global survey)", year: 2026 },
    { org: "BCG", title: "Headcount and agent operating models", year: 2026 },
    { org: "Reuters Institute", title: "Digital News Report", year: 2026 },
  ]
}

function chartStub(
  prototype: PrototypeId,
  mode: ChartMode,
  index: number,
  pack: Pack,
  spec: ChartSpec,
  n: number,
): ChartStub {
  const proto = prototypeById(prototype)
  const titles = pack.titles[mode]
  const collectedBy = sourcesFor("")[index % 4]?.org ?? "Survey field"
  return {
    id: `${prototype}-${mode}-${index}`,
    number: figureNumber(prototype, index),
    mode,
    title: proto.titleStyle === "neutral" ? titles.neutral : titles.conclusion,
    kicker: prototype === "deck" ? proto.skeleton[Math.min(4, index + 3)] : undefined,
    surveyQuestion:
      prototype === "survey"
        ? `Q${index + 1}. Thinking about ${mode === "bigStat" ? "the last 12 months" : "your team"}, which comes closest to your situation?`
        : undefined,
    n,
    unit: mode === "paired" || mode === "line" || mode === "slope" || mode === "hbar" ? "%" : mode === "bigStat" ? "pp / %" : "share",
    collectedBy,
    analyzedBy: "Huashu Report stub",
    spec,
  }
}

export function generateReport(prototype: PrototypeId, topic: string): Report {
  const trimmed = topic.trim() || "Untitled inquiry"
  const proto = prototypeById(prototype)
  const seed = hashString(`${prototype}::${trimmed.toLowerCase()}`)
  const rng = mulberry32(seed)
  const n = 420 + Math.floor(rng() * 2400)
  const pct = 7 + Math.floor(rng() * 42)
  const pack = packFor(trimmed)
  const specs = pack.specs(rng, pct)
  const charts = proto.chartModes.map((mode, i) =>
    chartStub(prototype, mode, i, pack, specs[mode], n),
  )
  const date =
    prototype === "research"
      ? "16 September 2026 11:18 AM GMT"
      : "16 September 2026"

  return {
    prototype,
    topic: trimmed,
    title:
      prototype === "deck" || proto.titleStyle === "conclusion"
        ? pack.headline(trimmed, pct, n).replace(/\s*\(N=.*$/, ".")
        : trimmed,
    oneLiner: pack.headline(trimmed, pct, n),
    dateLabel: date,
    n,
    outline: outlineFor(prototype, trimmed, pack, pct, n),
    charts,
    findings: pack.findings(trimmed, pct, n),
    mechanism: pack.mechanism(trimmed),
    literature: pack.literature(trimmed),
    limitations: pack.limitation(trimmed, n),
    actions: pack.actions(trimmed),
    sources: sourcesFor(trimmed),
    contributions: pack.contributions(trimmed),
  }
}

export function optionalLlmHint(): string | null {
  const key = import.meta.env.VITE_OPENAI_API_KEY as string | undefined
  if (key && key.trim()) {
    return "An API key is present; this MVP still uses the local stub so the happy path never depends on a network call."
  }
  return null
}
