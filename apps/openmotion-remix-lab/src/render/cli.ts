import fs from "node:fs"
import path from "node:path"
import { buildRemix, type Remix } from "../engine/remix"
import { clipById } from "../fixtures/clips"
import { kitById } from "../fixtures/kits"
import type { EditMap } from "../fixtures/types"
import { renderRemix } from "./capture"
import { findChrome, findFfmpeg, missingToolsMessage } from "./deps"

function flag(args: string[], name: string, fallback?: string): string | undefined {
  const index = args.indexOf(`--${name}`)
  if (index >= 0) return args[index + 1]
  return fallback
}

function has(args: string[], name: string): boolean {
  return args.includes(`--${name}`)
}

const args = process.argv.slice(2)
const asJson = has(args, "json")

function emit(payload: unknown, ok: boolean): never {
  if (asJson) {
    console.log(JSON.stringify(payload))
  } else if (payload && typeof payload === "object" && "message" in payload) {
    console[ok ? "log" : "error"](String((payload as { message: string }).message))
  }
  process.exit(ok ? 0 : 1)
}

if (has(args, "status")) {
  const ffmpeg = findFfmpeg()
  const chrome = findChrome()
  const ready = Boolean(ffmpeg && chrome)
  emit(
    {
      ok: ready,
      ffmpeg: Boolean(ffmpeg),
      chrome: Boolean(chrome),
      ffmpegPath: ffmpeg,
      chromePath: chrome,
      message: ready ? "Ready to render." : missingToolsMessage(ffmpeg, chrome),
    },
    true,
  )
}

const clipId = flag(args, "clip", "launch-teaser") ?? "launch-teaser"
const kitId = flag(args, "kit", "northstar") ?? "northstar"
const fps = Number(flag(args, "fps", "10"))
const editsFile = flag(args, "edits-file")
let edits: EditMap = {}
if (editsFile) {
  edits = JSON.parse(fs.readFileSync(editsFile, "utf8")) as EditMap
}

let remix: Remix
try {
  remix = buildRemix(clipById(clipId), kitById(kitId), edits)
} catch (error) {
  const message = error instanceof Error ? error.message : String(error)
  emit({ ok: false, message }, false)
}

const stamp = new Date().toISOString().replaceAll(/[:.]/g, "-")
const defaultOut = path.join("out", `remix-${clipId}-${kitId}-${stamp}.mp4`)
const outFile = path.resolve(flag(args, "out", defaultOut) ?? defaultOut)

const result = await renderRemix(remix, outFile, Number.isFinite(fps) ? fps : 10)
emit(result, result.ok)
