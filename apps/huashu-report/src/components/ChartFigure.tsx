import { renderChart } from "@/lib/charts"
import type { ChartStub } from "@/lib/types"

export function ChartFigure({ chart }: { chart: ChartStub }) {
  const svg = renderChart(chart.spec)
  return (
    <figure className="mt-4 border-t border-[#d8d8d8] pt-3">
      {chart.kicker ? (
        <p className="mb-1 text-[11px] tracking-[0.12em] text-[#6b6b6b] uppercase">
          {chart.kicker}
        </p>
      ) : null}
      <figcaption className="mb-3">
        <span className="mr-2 font-medium text-[#14505e]">{chart.number}.</span>
        <span className="font-medium text-[#231f20]">{chart.title}</span>
      </figcaption>
      <div className="max-w-[36rem]" dangerouslySetInnerHTML={{ __html: svg }} />
      {chart.surveyQuestion ? (
        <p className="mt-2 text-[12px] leading-relaxed text-[#6b6b6b]">
          {chart.surveyQuestion} Base: total sample N={chart.n.toLocaleString("en-US")}.
        </p>
      ) : null}
      <p className="mt-2 text-[11px] leading-relaxed text-[#6b6b6b]">
        Source: collected by {chart.collectedBy}; analysis by {chart.analyzedBy}.
        N={chart.n.toLocaleString("en-US")}. Unit: {chart.unit}.
      </p>
    </figure>
  )
}
