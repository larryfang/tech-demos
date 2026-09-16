import { ChartFigure } from "@/components/ChartFigure"
import { prototypeById } from "@/lib/prototypes"
import type { Report } from "@/lib/types"

function Cover({ report }: { report: Report }) {
  const proto = prototypeById(report.prototype)
  return (
    <header className="border-b border-[#d8d8d8] pb-5">
      <p className="text-[11px] tracking-[0.14em] text-[#14505e] uppercase">
        {proto.name} · {report.dateLabel}
      </p>
      <h1 className="mt-2 font-serif text-[1.65rem] leading-tight font-semibold text-[#231f20]">
        {report.title}
      </h1>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[#231f20]">
        {report.oneLiner}
      </p>
    </header>
  )
}

function Sources({ report }: { report: Report }) {
  return (
    <section className="mt-8">
      <h2 className="font-serif text-lg text-[#231f20]">Sources</h2>
      <p className="mt-1 text-[12px] text-[#6b6b6b]">
        Literature table — length follows source count, not data-point count.
      </p>
      <ul className="mt-2 space-y-1 text-[13px] text-[#231f20]">
        {report.sources.map((s) => (
          <li key={`${s.org}-${s.title}`}>
            {s.org} ({s.year}). {s.title}.
          </li>
        ))}
      </ul>
    </section>
  )
}

function Limitations({ report }: { report: Report }) {
  return (
    <section className="mt-8 border-l-2 border-[#14505e] pl-4">
      <h2 className="font-serif text-lg text-[#231f20]">
        Limitations and alternative explanations
      </h2>
      <p className="mt-2 text-[14px] leading-relaxed text-[#231f20]">{report.limitations}</p>
    </section>
  )
}

function Body({ report }: { report: Report }) {
  return (
    <>
      <section className="mt-6">
        <h2 className="font-serif text-lg text-[#231f20]">Numbered facts</h2>
        <ol className="mt-2 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed text-[#231f20]">
          {report.findings.map((f) => (
            <li key={f}>{f}</li>
          ))}
        </ol>
      </section>
      {report.charts.map((chart) => (
        <ChartFigure key={chart.id} chart={chart} />
      ))}
      <section className="mt-8">
        <h2 className="font-serif text-lg text-[#231f20]">Why it would look like this</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#231f20]">{report.mechanism}</p>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-lg text-[#231f20]">Where this sits in the literature</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#231f20]">{report.literature}</p>
      </section>
    </>
  )
}

function DeckPreview({ report }: { report: Report }) {
  const slides = [
    { key: "cover", node: <Cover report={report} /> },
    {
      key: "method",
      node: (
        <>
          <p className="text-[11px] tracking-[0.12em] text-[#6b6b6b] uppercase">Method</p>
          <h2 className="mt-2 font-serif text-2xl text-[#231f20]">
            Reconstructed sample of {report.n.toLocaleString("en-US")} — not a probability census.
          </h2>
          <p className="mt-3 text-[14px] leading-relaxed">{report.findings[0]}</p>
        </>
      ),
    },
    ...report.charts.map((chart) => ({
      key: chart.id,
      node: <ChartFigure chart={chart} />,
    })),
    {
      key: "limit",
      node: <Limitations report={report} />,
    },
    {
      key: "act",
      node: (
        <>
          <p className="text-[11px] tracking-[0.12em] text-[#6b6b6b] uppercase">Actions</p>
          <h2 className="mt-2 font-serif text-2xl text-[#231f20]">Three moves that survive the caveats</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-[15px]">
            {report.actions.map((a) => (
              <li key={a}>{a}</li>
            ))}
          </ol>
        </>
      ),
    },
  ]

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <article
          key={slide.key}
          className="aspect-video overflow-hidden border border-[#d8d8d8] bg-[#fbfaf7] p-8"
        >
          <p className="text-[10px] text-[#6b6b6b]">
            {i + 1} / {slides.length}
          </p>
          <div className="mt-2">{slide.node}</div>
        </article>
      ))}
    </div>
  )
}

function PaperPreview({ report }: { report: Report }) {
  return (
    <>
      <Cover report={report} />
      <section className="mt-6">
        <h2 className="font-serif text-lg italic text-[#231f20]">Abstract</h2>
        <p className="mt-2 text-[14px] leading-relaxed text-[#231f20]">{report.oneLiner}</p>
      </section>
      <section className="mt-6">
        <h2 className="font-serif text-lg text-[#231f20]">1. Contributions</h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5 text-[14px] leading-relaxed">
          {report.contributions.map((c) => (
            <li key={c}>{c}</li>
          ))}
        </ol>
      </section>
      <Body report={report} />
      <Limitations report={report} />
      <Sources report={report} />
    </>
  )
}

function PopularPreview({ report }: { report: Report }) {
  const acts = [
    { name: "Act I — the scene", body: report.findings[0] ?? report.oneLiner },
    { name: "Act II — the evidence", body: report.findings[1] ?? report.mechanism },
    { name: "Act III — the toolbox", body: report.findings[2] ?? report.actions.join(" ") },
  ]
  return (
    <>
      <Cover report={report} />
      <div className="mt-6 grid gap-6 md:grid-cols-[1fr_14rem]">
        <div>
          {acts.map((act) => (
            <section key={act.name} className="mb-6">
              <h2 className="font-serif text-lg text-[#231f20]">{act.name}</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-[#231f20]">{act.body}</p>
            </section>
          ))}
          {report.charts.map((chart) => (
            <ChartFigure key={chart.id} chart={chart} />
          ))}
          <Limitations report={report} />
        </div>
        <aside className="h-fit border border-[#d8d8d8] bg-[#f4f1ea] p-4 text-[12px] leading-relaxed text-[#231f20]">
          <p className="text-[10px] tracking-[0.14em] text-[#14505e] uppercase">Method, in the margin</p>
          <p className="mt-2">N={report.n.toLocaleString("en-US")}. Descriptive, not causal.</p>
          <p className="mt-2">{report.limitations}</p>
        </aside>
      </div>
      <section className="mt-6">
        <h2 className="font-serif text-lg text-[#231f20]">Toolbox</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-[14px]">
          {report.actions.map((a) => (
            <li key={a}>{a}</li>
          ))}
        </ul>
      </section>
      <Sources report={report} />
    </>
  )
}

function SurveyPreview({ report }: { report: Report }) {
  return (
    <>
      <Cover report={report} />
      <p className="mt-3 text-[13px] text-[#6b6b6b]">
        Field reconstructed for this stub · markets mixed · weights: none (declare the gap).
      </p>
      <div className="mt-6 columns-1 gap-8 md:columns-2">
        <section className="mb-4 break-inside-avoid">
          <h2 className="font-serif text-lg text-[#231f20]">Key findings</h2>
          <ol className="mt-2 list-decimal space-y-2 pl-5 text-[14px] leading-relaxed">
            {report.findings.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ol>
        </section>
        {report.charts.map((chart) => (
          <div key={chart.id} className="mb-4 break-inside-avoid">
            <ChartFigure chart={chart} />
          </div>
        ))}
      </div>
      <Limitations report={report} />
      <Sources report={report} />
    </>
  )
}

function ResearchPreview({ report }: { report: Report }) {
  return (
    <>
      <p className="font-mono text-[11px] text-[#6b6b6b]">{report.dateLabel}</p>
      <p className="text-[12px] text-[#6b6b6b]">Analyst: stub desk · thesis follows</p>
      <h1 className="mt-2 font-serif text-2xl text-[#231f20]">{report.topic}</h1>
      <p className="mt-3 text-[14px] leading-relaxed">{report.oneLiner}</p>
      <div className="mt-4 grid gap-6 md:grid-cols-2">
        {report.charts.map((chart) => (
          <ChartFigure key={chart.id} chart={chart} />
        ))}
      </div>
      <section className="mt-8">
        <h2 className="text-sm font-medium tracking-wide text-[#14505e] uppercase">Risks</h2>
        <p className="mt-2 text-[14px] leading-relaxed">{report.limitations}</p>
      </section>
      <Sources report={report} />
    </>
  )
}

export function ReportPreview({ report }: { report: Report }) {
  const inner =
    report.prototype === "deck" ? (
      <DeckPreview report={report} />
    ) : report.prototype === "paper" ? (
      <PaperPreview report={report} />
    ) : report.prototype === "popular" ? (
      <PopularPreview report={report} />
    ) : report.prototype === "survey" ? (
      <SurveyPreview report={report} />
    ) : report.prototype === "research" ? (
      <ResearchPreview report={report} />
    ) : (
      <>
        <Cover report={report} />
        <Body report={report} />
        <Limitations report={report} />
        <Sources report={report} />
      </>
    )

  return (
    <div className="report-paper bg-[#fbfaf7] px-8 py-10 text-[#231f20] shadow-sm ring-1 ring-[#d8d8d8]">
      {inner}
    </div>
  )
}
