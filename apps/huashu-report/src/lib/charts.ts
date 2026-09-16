import type { ChartSpec } from "./types"

export const INK = "#231f20"
export const MUTE = "#6b6b6b"
export const RULE = "#d8d8d8"
export const TEAL = "#14505e"
export const TEAL2 = "#3d7f92"
export const TEAL3 = "#8fbecb"
export const TEAL4 = "#cfe3e9"
export const CLAY = "#a4551f"
export const CLAY2 = "#c98f62"
export const SAND = "#e8dcc8"
export const FONT_SANS = "'Helvetica Neue', Arial, sans-serif"

function esc(s: string | number): string {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
}

function textW(s: string, size: number): number {
  return [...s].reduce((w, ch) => w + (ch.charCodeAt(0) > 0x2e80 ? 1 : 0.55), 0) * size
}

function wrap(s: string, n: number): string[] {
  const out: string[] = []
  let cur = ""
  for (const ch of s) {
    cur += ch
    if (cur.length >= n) {
      out.push(cur)
      cur = ""
    }
  }
  if (cur) out.push(cur)
  return out
}

function txt(
  x: number,
  y: number,
  s: string | number,
  size = 8,
  fill = INK,
  anchor = "start",
  weight = "normal",
  opacity = 1,
): string {
  return `<text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-family="${FONT_SANS}" font-size="${size}" fill="${fill}" text-anchor="${anchor}" font-weight="${weight}" opacity="${opacity}">${esc(s)}</text>`
}

function svgOpen(w: number, h: number): string {
  return `<svg viewBox="0 0 ${w} ${h}" width="100%" xmlns="http://www.w3.org/2000/svg" role="img">`
}

function formatValue(fmt: string, v: number): string {
  if (fmt.includes("{:+}")) {
    const signed = v > 0 ? `+${v}` : `${v}`
    return fmt.replace("{:+}", signed)
  }
  return fmt.replace("{}", String(v))
}

export function hbar(
  data: Array<[string, number]>,
  opts: { w?: number; rowh?: number; fmt?: string; note?: string } = {},
): string {
  const w = opts.w ?? 470
  const rowh = opts.rowh ?? 22
  const fmt = opts.fmt ?? "{}%"
  const values = data.map(([, v]) => v)
  const minv = Math.min(0, ...values)
  const maxv = Math.max(0, ...values) * 1.16 || 1
  const span = maxv - minv * 1.16
  const h = rowh * data.length + 22
  const labelW = Math.min(190, Math.max(60, Math.max(...data.map(([lab]) => textW(lab, 8.4))) + 10))
  const valW = Math.max(...data.map(([, v]) => textW(formatValue(fmt, v), 8.4))) + 10
  const bw = Math.max(60, w - labelW - valW)
  const zero = labelW + (bw * (0 - minv * 1.16)) / span
  const parts = [svgOpen(w, h)]
  data.forEach(([lab, v], i) => {
    const y = i * rowh + 8
    const x1 = zero
    const x2 = labelW + (bw * (v - minv * 1.16)) / span
    const x = Math.min(x1, x2)
    const width = Math.max(0.8, Math.abs(x2 - x1))
    const fill = v < 0 ? CLAY : TEAL
    parts.push(txt(labelW - 8, y + 11, lab, 8.4, INK, "end"))
    parts.push(`<rect data-signed="${v}" x="${x.toFixed(1)}" y="${y + 2}" width="${width.toFixed(1)}" height="${rowh - 8}" fill="${fill}"/>`)
    const labelX = v < 0 ? x - 5 : x + width + 5
    parts.push(txt(labelX, y + 11, formatValue(fmt, v), 8.4, INK, v < 0 ? "end" : "start", "bold"))
  })
  parts.push(`<line data-zero="1" x1="${zero.toFixed(1)}" y1="6" x2="${zero.toFixed(1)}" y2="${h - 14}" stroke="${INK}" stroke-width="0.8"/>`)
  if (opts.note) parts.push(txt(labelW, h - 3, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function stackedRow(
  rows: Array<[string, number[]]>,
  opts: { w?: number; legend?: string[]; note?: string } = {},
): string {
  const w = opts.w ?? 470
  const rowh = 26
  const labelW = 104
  const h = rowh * rows.length + (opts.legend ? 30 : 12)
  const bw = w - labelW - 12
  const cols = [TEAL, TEAL2, TEAL3, SAND, CLAY2]
  const parts = [svgOpen(w, h)]
  rows.forEach(([lab, vals], i) => {
    const y = i * rowh + 6
    parts.push(txt(labelW - 8, y + 13, lab, 8.4, INK, "end"))
    let x = labelW
    vals.forEach((v, j) => {
      const seg = (bw * v) / 100
      parts.push(`<rect x="${x.toFixed(1)}" y="${y + 2}" width="${seg.toFixed(1)}" height="${rowh - 10}" fill="${cols[j % cols.length]}"/>`)
      if (seg > 26) {
        parts.push(txt(x + seg / 2, y + 13.5, `${v}%`, 7.6, j < 2 ? "#ffffff" : INK, "middle", "bold"))
      }
      x += seg
    })
  })
  if (opts.legend) {
    const ly = h - 12
    let lx = labelW
    opts.legend.forEach((name, j) => {
      parts.push(`<rect x="${lx}" y="${ly - 6}" width="8" height="8" fill="${cols[j % cols.length]}"/>`)
      parts.push(txt(lx + 11, ly + 1, name, 7.2, MUTE))
      lx += 11 + name.length * 7.4 + 14
    })
  }
  if (opts.note) parts.push(txt(labelW, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function pairedBars(
  groups: Array<[string, number, number]>,
  opts: {
    w?: number
    h?: number
    unit?: string
    series?: [string, string]
    colors?: [string, string]
    note?: string
  } = {},
): string {
  const w = opts.w ?? 470
  const h = opts.h ?? 182
  const unit = opts.unit ?? "%"
  const colors = opts.colors ?? [TEAL, CLAY]
  const series = opts.series ?? ["", ""]
  const padL = 34
  const padB = 34
  const padT = 16
  const vals = groups.flatMap(([, a, b]) => [a, b])
  const ymax = Math.max(...vals) * 1.22
  const ymin = Math.min(0, Math.min(...vals) * 1.25)
  const pw = w - padL - 12
  const ph = h - padB - padT
  const gw = pw / groups.length
  const Y = (v: number) => padT + ph - (ph * (v - ymin)) / (ymax - ymin)
  const zero = Y(0)
  const parts = [svgOpen(w, h)]
  for (let t = 0; t < 5; t++) {
    const v = ymin + ((ymax - ymin) * t) / 4
    const y = Y(v)
    parts.push(`<line x1="${padL}" y1="${y.toFixed(1)}" x2="${w - 12}" y2="${y.toFixed(1)}" stroke="${RULE}" stroke-width="0.5"/>`)
    parts.push(txt(padL - 5, y + 2.6, `${Math.round(v)}`, 7, MUTE, "end"))
  }
  if (ymin < 0) {
    parts.push(`<line data-zero="1" x1="${padL}" y1="${zero.toFixed(1)}" x2="${w - 12}" y2="${zero.toFixed(1)}" stroke="${INK}" stroke-width="0.9"/>`)
  }
  groups.forEach(([lab, a, b], i) => {
    const cx = padL + gw * i + gw / 2
    const bw = Math.min(20, gw * 0.3)
    ;([a, b] as const).forEach((val, k) => {
      const col = colors[k]
      const y0 = val >= 0 ? Y(val) : zero
      const y1 = val >= 0 ? zero : Y(val)
      const bh = Math.abs(y1 - y0)
      const x = cx - bw - 2 + k * (bw + 4)
      const y = Math.min(y0, y1)
      parts.push(`<rect data-signed="${val}" x="${x.toFixed(1)}" y="${y.toFixed(1)}" width="${bw.toFixed(1)}" height="${bh.toFixed(1)}" fill="${col}"/>`)
      const ly = val >= 0 ? Math.min(y0, y1) - 3.5 : Math.max(y0, y1) + 8
      const label = ymin < 0 ? `${val > 0 ? "+" : ""}${val}${unit}` : `${val}${unit}`
      parts.push(txt(x + bw / 2, ly, label, 7.4, INK, "middle", "bold"))
    })
    wrap(lab, 7).forEach((ln, j) => {
      parts.push(txt(cx, padT + ph + 11 + j * 8.6, ln, 7.2, INK, "middle"))
    })
  })
  if (series[0]) {
    let lx = padL
    series.forEach((name, k) => {
      parts.push(`<rect x="${lx}" y="2" width="8" height="8" fill="${colors[k]}"/>`)
      parts.push(txt(lx + 11, 9, name, 7.2, MUTE))
      lx += 11 + name.length * 7.6 + 16
    })
  }
  if (opts.note) parts.push(txt(padL, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function lineChart(
  series: Array<[string, number[], string]>,
  xlabels: string[],
  opts: { w?: number; h?: number; unit?: string; note?: string } = {},
): string {
  const w = opts.w ?? 470
  const h = opts.h ?? 190
  const padL = 32
  const padB = 30
  const padT = 14
  const padR = Math.max(40, Math.max(...series.map(([name]) => textW(name, 7.6))) + 12)
  const vals = series.flatMap(([, ys]) => ys)
  const ymin = 0
  const ymax = Math.max(...vals) * 1.15
  const pw = w - padL - padR
  const ph = h - padB - padT
  const n = xlabels.length
  const X = (i: number) => padL + (pw * i) / Math.max(1, n - 1)
  const Y = (v: number) => padT + ph - (ph * (v - ymin)) / (ymax - ymin)
  const parts = [svgOpen(w, h)]
  for (let t = 0; t < 5; t++) {
    const v = ymin + ((ymax - ymin) * t) / 4
    parts.push(`<line x1="${padL}" y1="${Y(v).toFixed(1)}" x2="${padL + pw}" y2="${Y(v).toFixed(1)}" stroke="${RULE}" stroke-width="0.5"/>`)
    parts.push(txt(padL - 5, Y(v) + 2.6, `${Math.round(v)}`, 7, MUTE, "end"))
  }
  xlabels.forEach((xl, i) => parts.push(txt(X(i), padT + ph + 12, xl, 7, MUTE, "middle")))
  series.forEach(([name, ys, col]) => {
    const pts = ys.map((v, i) => `${X(i).toFixed(1)},${Y(v).toFixed(1)}`).join(" ")
    parts.push(`<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="1.9"/>`)
    ys.forEach((v, i) => {
      parts.push(`<circle cx="${X(i).toFixed(1)}" cy="${Y(v).toFixed(1)}" r="2.2" fill="${col}"/>`)
    })
    parts.push(txt(X(n - 1) + 6, Y(ys[ys.length - 1] ?? 0) + 3, name, 7.6, col, "start", "bold"))
  })
  if (opts.note) parts.push(txt(padL, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function bigStat(
  value: string,
  caption: string,
  opts: { sub?: string; w?: number; color?: string } = {},
): string {
  const color = opts.color ?? TEAL
  const lines = wrap(caption, 11)
  const vw = textW(value, 38)
  const w = Math.max(opts.w ?? 150, vw + 16)
  const h = 66 + lines.length * 11 + (opts.sub ? 11 : 0)
  const parts = [svgOpen(w, h)]
  parts.push(txt(w / 2, 40, value, 38, color, "middle", "bold"))
  lines.forEach((ln, i) => parts.push(txt(w / 2, 56 + i * 11, ln, 8, INK, "middle")))
  if (opts.sub) {
    parts.push(txt(w / 2, 58 + lines.length * 11 + 6, opts.sub, 7, MUTE, "middle"))
  }
  parts.push("</svg>")
  return parts.join("\n")
}

export function diverging(
  rows: Array<[string, number[], number[]]>,
  opts: { w?: number; legend?: string[]; note?: string } = {},
): string {
  const w = opts.w ?? 470
  const rowh = 24
  const labelW = 104
  const h = rowh * rows.length + (opts.legend ? 30 : 14)
  const bw = (w - labelW - 14) / 2
  const negc = [CLAY, CLAY2]
  const posc = [TEAL, TEAL2]
  const mid = labelW + bw
  const parts = [svgOpen(w, h)]
  parts.push(`<line x1="${mid}" y1="4" x2="${mid}" y2="${h - 16}" stroke="${INK}" stroke-width="0.8"/>`)
  rows.forEach(([lab, neg, pos], i) => {
    const y = i * rowh + 8
    parts.push(txt(labelW - 8, y + 12, lab, 8.4, INK, "end"))
    let x = mid
    neg.forEach((v, j) => {
      const seg = (bw * v) / 100
      x -= seg
      parts.push(`<rect x="${x.toFixed(1)}" y="${y + 2}" width="${seg.toFixed(1)}" height="${rowh - 9}" fill="${negc[j % 2]}"/>`)
      if (seg > 22) parts.push(txt(x + seg / 2, y + 13, `${v}%`, 7.4, "#fff", "middle", "bold"))
    })
    x = mid
    pos.forEach((v, j) => {
      const seg = (bw * v) / 100
      parts.push(`<rect x="${x.toFixed(1)}" y="${y + 2}" width="${seg.toFixed(1)}" height="${rowh - 9}" fill="${posc[j % 2]}"/>`)
      if (seg > 22) parts.push(txt(x + seg / 2, y + 13, `${v}%`, 7.4, "#fff", "middle", "bold"))
      x += seg
    })
  })
  if (opts.legend) {
    const ly = h - 12
    let lx = labelW
    const allc = [...negc, ...posc]
    opts.legend.forEach((name, j) => {
      parts.push(`<rect x="${lx}" y="${ly - 6}" width="8" height="8" fill="${allc[j % allc.length]}"/>`)
      parts.push(txt(lx + 11, ly + 1, name, 7.2, MUTE))
      lx += 11 + name.length * 7.4 + 12
    })
  }
  if (opts.note) parts.push(txt(labelW, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function slope(
  pairs: Array<[string, number, number, string]>,
  opts: { w?: number; h?: number; unit?: string; leftLabel?: string; rightLabel?: string; note?: string } = {},
): string {
  const w = opts.w ?? 470
  const h = opts.h ?? 180
  const unit = opts.unit ?? "%"
  const padT = 22
  const padB = 20
  const ph = h - padT - padB
  const xl = 108
  const xr = w - 118
  const vals = pairs.flatMap(([, a, b]) => [a, b])
  const lo = Math.min(...vals) * 0.86
  const hi = Math.max(...vals) * 1.08
  const Y = (v: number) => padT + ph - (ph * (v - lo)) / (hi - lo)
  const parts = [svgOpen(w, h)]
  parts.push(`<line x1="${xl}" y1="${padT - 6}" x2="${xl}" y2="${padT + ph + 6}" stroke="${RULE}" stroke-width="0.6"/>`)
  parts.push(`<line x1="${xr}" y1="${padT - 6}" x2="${xr}" y2="${padT + ph + 6}" stroke="${RULE}" stroke-width="0.6"/>`)
  parts.push(txt(xl, padT - 11, opts.leftLabel ?? "", 7.4, MUTE, "middle"))
  parts.push(txt(xr, padT - 11, opts.rightLabel ?? "", 7.4, MUTE, "middle"))
  pairs.forEach(([name, a, b, col]) => {
    parts.push(`<line x1="${xl}" y1="${Y(a).toFixed(1)}" x2="${xr}" y2="${Y(b).toFixed(1)}" stroke="${col}" stroke-width="1.7"/>`)
    parts.push(`<circle cx="${xl}" cy="${Y(a).toFixed(1)}" r="2.6" fill="${col}"/>`)
    parts.push(`<circle cx="${xr}" cy="${Y(b).toFixed(1)}" r="2.6" fill="${col}"/>`)
    parts.push(txt(xl - 7, Y(a) + 3, `${name} ${a}${unit}`, 7.6, col, "end", "bold"))
    parts.push(txt(xr + 7, Y(b) + 3, `${b}${unit}`, 7.6, col, "start", "bold"))
  })
  if (opts.note) parts.push(txt(xl - 60, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function quadrant(
  points: Array<[string, number, number, string]>,
  opts: {
    w?: number
    h?: number
    xlab?: string
    ylab?: string
    qlabels?: Array<[number, number, string]>
    note?: string
  } = {},
): string {
  const w = opts.w ?? 470
  const h = opts.h ?? 270
  const pad = 40
  const pw = w - pad - 76
  const ph = h - pad - 26
  const X = (v: number) => pad + (pw * v) / 100
  const Y = (v: number) => 14 + ph - (ph * v) / 100
  const parts = [svgOpen(w, h)]
  parts.push(`<rect x="${pad}" y="14" width="${pw}" height="${ph}" fill="none" stroke="${RULE}" stroke-width="0.6"/>`)
  parts.push(`<line x1="${X(50)}" y1="14" x2="${X(50)}" y2="${14 + ph}" stroke="${RULE}" stroke-width="0.6" stroke-dasharray="3,2"/>`)
  parts.push(`<line x1="${pad}" y1="${Y(50)}" x2="${pad + pw}" y2="${Y(50)}" stroke="${RULE}" stroke-width="0.6" stroke-dasharray="3,2"/>`)
  opts.qlabels?.forEach(([qx, qy, t]) => parts.push(txt(X(qx), Y(qy), t, 7, MUTE, "middle", "bold")))
  points.forEach(([name, x, y, col]) => {
    parts.push(`<circle cx="${X(x).toFixed(1)}" cy="${Y(y).toFixed(1)}" r="3.4" fill="${col}" opacity="0.9"/>`)
    parts.push(txt(X(x) + 5.5, Y(y) + 2.6, name, 7.2, INK))
  })
  parts.push(txt(pad + pw / 2, h - 10, opts.xlab ?? "", 7.6, INK, "middle", "bold"))
  parts.push(`<text x="12" y="${14 + ph / 2}" font-family="${FONT_SANS}" font-size="7.6" fill="${INK}" font-weight="bold" text-anchor="middle" transform="rotate(-90 12 ${14 + ph / 2})">${esc(opts.ylab ?? "")}</text>`)
  if (opts.note) parts.push(txt(pad, h - 1, opts.note, 6.6, MUTE))
  parts.push("</svg>")
  return parts.join("\n")
}

export function renderChart(spec: ChartSpec): string {
  switch (spec.mode) {
    case "hbar":
      return hbar(spec.data, { fmt: spec.fmt })
    case "stacked":
      return stackedRow(spec.rows, { legend: spec.legend })
    case "paired":
      return pairedBars(spec.groups, { series: spec.series, unit: spec.unit })
    case "line":
      return lineChart(spec.series, spec.xlabels, { unit: spec.unit })
    case "bigStat":
      return bigStat(spec.value, spec.caption, { sub: spec.sub })
    case "diverging":
      return diverging(spec.rows, { legend: spec.legend })
    case "slope":
      return slope(spec.pairs, {
        leftLabel: spec.leftLabel,
        rightLabel: spec.rightLabel,
        unit: spec.unit,
      })
    case "quadrant":
      return quadrant(spec.points, {
        xlab: spec.xlab,
        ylab: spec.ylab,
        qlabels: spec.qlabels,
      })
  }
}
