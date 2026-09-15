import { useMemo, useState } from "react"
import { formatNumber, niceMax, tickStep, type Dataset } from "@/lib/parse"
import type { Palette } from "@/lib/tokens"

type Props = {
  dataset: Dataset
  palette: Palette
}

const W = 640
const H = 360
const PAD = { t: 18, r: 16, b: 44, l: 46 }

export function LupiBasicsChart({ dataset, palette }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const [replay, setReplay] = useState(0)
  const max = niceMax(Math.max(...dataset.rows.map((row) => row.value)))
  const step = tickStep(max)
  const ticks = useMemo(() => {
    const values: number[] = []
    for (let v = 0; v <= max; v += step) values.push(v)
    return values
  }, [max, step])

  const innerW = W - PAD.l - PAD.r
  const innerH = H - PAD.t - PAD.b
  const band = innerW / dataset.rows.length
  const barW = Math.min(28, band * 0.42)
  const hovered = hover == null ? null : dataset.rows[hover]

  return (
    <div style={{ color: palette.ink }}>
      <p
        className="mb-1 text-[10px] font-semibold tracking-[0.14em]"
        style={{ color: palette.faint }}
      >
        LUPI BASICS · COUNTABLE BAR
      </p>
      <h2 className="text-[19px] leading-tight font-bold tracking-[-0.02em]">
        {dataset.title}
      </h2>
      <p className="mt-1 text-[11.5px]" style={{ color: palette.muted }}>
        {dataset.subtitle ||
          `one tick = ${step} ${dataset.unit || dataset.valueKey} · hover a bar for the record`}
      </p>

      <svg
        key={replay}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`${dataset.title} editorial bar chart`}
        className="mt-3 w-full"
        onClick={() => setReplay((n) => n + 1)}
      >
        {ticks.map((tick) => {
          const y = PAD.t + innerH - (tick / max) * innerH
          return (
            <g key={tick}>
              <line
                x1={PAD.l}
                x2={W - PAD.r}
                y1={y}
                y2={y}
                stroke={palette.grid}
                strokeWidth={tick === 0 ? 1 : 0.6}
              />
              <text
                x={PAD.l - 8}
                y={y + 3}
                textAnchor="end"
                fill={palette.faint}
                fontSize="9.5"
                fontWeight="600"
              >
                {tick}
              </text>
            </g>
          )
        })}

        {dataset.rows.map((row, i) => {
          const h = (row.value / max) * innerH
          const x = PAD.l + band * i + (band - barW) / 2
          const y = PAD.t + innerH - h
          const active = hover === i
          return (
            <g
              key={`${row.label}-${i}`}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
            >
              <rect
                x={x}
                y={y}
                width={barW}
                height={h}
                rx="2"
                fill={active ? palette.hero : palette.data}
                opacity={hover == null || active ? 1 : 0.35}
                className="lf-bar"
                style={{ animationDelay: `${i * 90}ms` }}
              />
              <text
                x={x + barW / 2}
                y={H - 16}
                textAnchor="middle"
                fill={palette.muted}
                fontSize="10"
                fontWeight="600"
              >
                {row.label}
              </text>
              <title>
                {row.label}: {formatNumber(row.value)}
                {dataset.unit ? ` ${dataset.unit}` : ""}
                {row.note ? ` — ${row.note}` : ""}
              </title>
            </g>
          )
        })}
      </svg>

      <div className="mt-1 min-h-[36px] text-[12px]" style={{ color: palette.muted }}>
        {hovered ? (
          <>
            <span className="font-semibold" style={{ color: palette.ink }}>
              {hovered.label}
            </span>
            {" · "}
            {formatNumber(hovered.value)}
            {dataset.unit ? ` ${dataset.unit}` : ""}
            {hovered.note ? ` · ${hovered.note}` : ""}
          </>
        ) : (
          "Hover a column to read the record. Click the chart to replay."
        )}
      </div>
      <p
        className="mt-2 text-[9.5px] font-medium tracking-[0.08em] uppercase"
        style={{ color: palette.faint }}
      >
        {dataset.source}
      </p>
    </div>
  )
}
