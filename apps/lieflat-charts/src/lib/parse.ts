export type ChartRow = {
  label: string
  value: number
  note?: string
}

export type Dataset = {
  title: string
  subtitle: string
  source: string
  unit: string
  labelKey: string
  valueKey: string
  rows: ChartRow[]
}

export type ParseResult =
  | { ok: true; dataset: Dataset }
  | { ok: false; error: string }

type Meta = {
  title?: unknown
  subtitle?: unknown
  source?: unknown
  unit?: unknown
}

function asText(value: unknown, fallback = ""): string {
  if (value == null) return fallback
  return String(value).trim()
}

function isNumeric(value: unknown): boolean {
  if (value == null || value === "") return false
  if (typeof value === "boolean") return false
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""))
  return Number.isFinite(n)
}

function toNumber(value: unknown): number {
  if (typeof value === "number") return value
  return Number(String(value).replace(/,/g, ""))
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let cur = ""
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i + 1] === '"') {
        cur += '"'
        i++
      } else {
        quoted = !quoted
      }
      continue
    }
    if (ch === "," && !quoted) {
      out.push(cur.trim())
      cur = ""
      continue
    }
    cur += ch
  }
  out.push(cur.trim())
  return out
}

function titleFromKeys(valueKey: string, labelKey: string): string {
  return `${valueKey.replace(/_/g, " ")} by ${labelKey.replace(/_/g, " ")}`
}

const LABEL_KEY = /^(label|name|plan|year|queue|category|country|product|x)$/i
const VALUE_KEY = /^(value|mrr|mrr_k|count|amount|total|n|trees|tickets|y)$/i
const NOTE_KEY = /^(note|notes|comment|annotation)$/i

function inferKeys(
  rows: Array<Record<string, unknown>>,
): { labelKey: string; valueKey: string; noteKey?: string } | null {
  if (!rows[0]) return null
  const keys = Object.keys(rows[0]).filter((k) => k.length > 0)
  const noteKey = keys.find((k) => NOTE_KEY.test(k))
  const valueKey =
    keys.find((k) => VALUE_KEY.test(k)) ??
    keys.find((k) => !NOTE_KEY.test(k) && !LABEL_KEY.test(k) && rows.every((row) => isNumeric(row[k]))) ??
    keys.find((k) => !NOTE_KEY.test(k) && rows.every((row) => isNumeric(row[k])))
  if (!valueKey) return null
  const labelKey =
    keys.find((k) => k !== valueKey && LABEL_KEY.test(k)) ??
    keys.find((k) => k !== valueKey && k !== noteKey && !rows.every((row) => isNumeric(row[k]))) ??
    keys.find((k) => k !== valueKey && k !== noteKey)
  if (!labelKey) return null
  return { labelKey, valueKey, noteKey }
}

function fromObjects(
  raw: Array<Record<string, unknown>>,
  meta: Meta = {},
): ParseResult {
  const keys = inferKeys(raw)
  if (!keys) {
    return {
      ok: false,
      error: "Need at least one label column and one numeric value column.",
    }
  }
  const rows: ChartRow[] = []
  for (const row of raw) {
    const label = asText(row[keys.labelKey])
    if (!label || !isNumeric(row[keys.valueKey])) continue
    const note = keys.noteKey ? asText(row[keys.noteKey]) : ""
    rows.push({
      label,
      value: toNumber(row[keys.valueKey]),
      note: note || undefined,
    })
  }
  if (rows.length === 0) {
    return { ok: false, error: "No usable rows after parsing." }
  }
  return {
    ok: true,
    dataset: {
      title: asText(meta.title, titleFromKeys(keys.valueKey, keys.labelKey)),
      subtitle: asText(meta.subtitle),
      source: asText(meta.source, "LOCAL SAMPLE"),
      unit: asText(meta.unit),
      labelKey: keys.labelKey,
      valueKey: keys.valueKey,
      rows,
    },
  }
}

function parseCsv(text: string): ParseResult {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0 && !line.startsWith("#"))
  if (lines.length < 2) {
    return { ok: false, error: "CSV needs a header row and at least one data row." }
  }
  const headers = splitCsvLine(lines[0]).map((h) => h.replace(/^\uFEFF/, ""))
  if (headers.some((h) => !h)) {
    return { ok: false, error: "CSV header row has an empty column name." }
  }
  const raw = lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const obj: Record<string, unknown> = {}
    headers.forEach((header, i) => {
      obj[header] = cells[i] ?? ""
    })
    return obj
  })
  return fromObjects(raw)
}

function parseJson(text: string): ParseResult {
  let data: unknown
  try {
    data = JSON.parse(text)
  } catch {
    return { ok: false, error: "Invalid JSON." }
  }
  if (Array.isArray(data)) {
    if (data.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
      return fromObjects(data as Array<Record<string, unknown>>)
    }
    return { ok: false, error: "JSON arrays must contain objects." }
  }
  if (!data || typeof data !== "object") {
    return { ok: false, error: "JSON must be an object or an array of objects." }
  }
  const obj = data as Record<string, unknown> & Meta
  if (Array.isArray(obj.labels) && Array.isArray(obj.values)) {
    const values = obj.values
    const rows = obj.labels.map((label, i) => ({
      label: asText(label, `item ${i + 1}`),
      value: values[i],
    }))
    return fromObjects(rows as Array<Record<string, unknown>>, obj)
  }
  const list = Array.isArray(obj.rows)
    ? obj.rows
    : Array.isArray(obj.data)
      ? obj.data
      : null
  if (!list) {
    return {
      ok: false,
      error: "JSON must be an array of objects, or { rows | data | labels+values }.",
    }
  }
  if (!list.every((row) => row && typeof row === "object" && !Array.isArray(row))) {
    return { ok: false, error: "rows/data must be an array of objects." }
  }
  return fromObjects(list as Array<Record<string, unknown>>, obj)
}

export function parseInput(text: string): ParseResult {
  const trimmed = text.trim()
  if (!trimmed) {
    return { ok: false, error: "Paste CSV or JSON, or pick a sample." }
  }
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    return parseJson(trimmed)
  }
  return parseCsv(trimmed)
}

export function formatNumber(value: number): string {
  if (Number.isInteger(value)) return value.toLocaleString("en-US")
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 })
}

export function ranked(rows: ChartRow[]): ChartRow[] {
  return [...rows].sort((a, b) => b.value - a.value)
}

export function tickStep(max: number): number {
  if (max <= 12) return 1
  if (max <= 40) return 5
  if (max <= 100) return 10
  if (max <= 200) return 20
  if (max <= 500) return 50
  return 100
}

export function niceMax(max: number): number {
  const step = tickStep(max)
  return Math.max(step, Math.ceil(max / step) * step)
}
