import { useEffect, useRef, useState } from "react"
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  LinearScale,
  Tooltip,
} from "chart.js"
import { formatNumber, ranked, type Dataset } from "@/lib/parse"
import type { Palette } from "@/lib/tokens"

Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip)
Chart.defaults.font.family = "Geist Variable, ui-sans-serif, system-ui, sans-serif"

type Props = {
  dataset: Dataset
  palette: Palette
}

export function GlanceChart({ dataset, palette }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const chartRef = useRef<Chart<"bar"> | null>(null)
  const [picked, setPicked] = useState(0)
  const rows = ranked(dataset.rows)
  const hero = rows[Math.min(picked, rows.length - 1)] ?? rows[0]

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const series = ranked(dataset.rows)

    chartRef.current?.destroy()
    const colors = series.map((_, i) => {
      if (i === 0) return palette.hero
      return palette.ladder[Math.min(i, palette.ladder.length - 1)]
    })

    chartRef.current = new Chart(canvas, {
      type: "bar",
      data: {
        labels: series.map((row) => row.label),
        datasets: [
          {
            data: series.map((row) => row.value),
            backgroundColor: colors,
            hoverBackgroundColor: palette.hero,
            borderSkipped: false,
            borderRadius: { topRight: 99, bottomRight: 99, topLeft: 0, bottomLeft: 0 },
            barPercentage: 0.78,
            categoryPercentage: 0.72,
          },
        ],
      },
      options: {
        indexAxis: "y",
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 900, easing: "easeOutQuart" },
        onClick: (_event, elements) => {
          if (elements[0]) setPicked(elements[0].index)
        },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: palette.ink,
            titleColor: palette.paper,
            bodyColor: palette.paper,
            padding: { top: 10, bottom: 10, left: 14, right: 14 },
            cornerRadius: 12,
            displayColors: false,
            callbacks: {
              label: (item) => {
                const row = series[item.dataIndex]
                const unit = dataset.unit ? ` ${dataset.unit}` : ""
                const note = row?.note ? ` · ${row.note}` : ""
                const raw = item.parsed.x
                const value = raw == null ? 0 : raw
                return `${formatNumber(value)}${unit}${note}`
              },
            },
          },
        },
        scales: {
          x: {
            display: false,
            grid: { display: false },
            border: { display: false },
          },
          y: {
            grid: { display: false },
            border: { display: false },
            ticks: {
              color: palette.muted,
              font: { size: 11, weight: 600 },
            },
          },
        },
      },
    })

    return () => {
      chartRef.current?.destroy()
      chartRef.current = null
    }
  }, [dataset, palette])

  return (
    <div style={{ color: palette.ink }}>
      <p
        className="mb-1 text-[10px] font-semibold tracking-[0.14em]"
        style={{ color: palette.faint }}
      >
        GLANCE · RANKED BAR
      </p>
      <h2 className="text-[19px] leading-tight font-bold tracking-[-0.02em]">
        {dataset.title}
      </h2>
      {dataset.subtitle ? (
        <p className="mt-1 text-[11.5px]" style={{ color: palette.muted }}>
          {dataset.subtitle}
        </p>
      ) : (
        <p className="mt-1 text-[11.5px]" style={{ color: palette.muted }}>
          Sorted high → low · hover a bar, click to pin the lead number
        </p>
      )}
      <div className="mt-4 mb-1">
        <p className="text-[44px] leading-none font-extrabold tracking-[-0.04em]">
          {formatNumber(hero.value)}
          {dataset.unit ? (
            <span className="ml-2 text-[13px] font-semibold" style={{ color: palette.muted }}>
              {dataset.unit}
            </span>
          ) : null}
        </p>
        <p className="mt-2 text-[12px]" style={{ color: palette.muted }}>
          {hero.label} leads
          {hero.note ? ` · ${hero.note}` : ""}
        </p>
      </div>
      <div className="relative mt-3 h-[280px]">
        <canvas
          ref={canvasRef}
          aria-label={`${dataset.title} ranked bar chart`}
        />
      </div>
      <p
        className="mt-3 text-[9.5px] font-medium tracking-[0.08em] uppercase"
        style={{ color: palette.faint }}
      >
        {dataset.source}
      </p>
    </div>
  )
}
