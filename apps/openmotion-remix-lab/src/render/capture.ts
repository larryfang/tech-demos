import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { chromium } from "playwright-core"
import { stageInnerHtml, type Remix } from "../engine/remix"
import { findChrome, findFfmpeg, missingToolsMessage } from "./deps"
import { SCENE_STAGE_CSS } from "./sceneCss"

export type RenderResult =
  | { ok: true; path: string; url: string; frames: number; message: string }
  | { ok: false; message: string }

function stageDocument(remix: Remix): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<style>${SCENE_STAGE_CSS}
#om-stage { width: ${remix.width}px; height: ${remix.height}px; }
</style>
</head>
<body>
<div id="om-stage"></div>
</body>
</html>`
}

function run(cmd: string, args: string[]): Promise<{ code: number; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { stdio: ["ignore", "pipe", "pipe"] })
    let stderr = ""
    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8")
    })
    child.on("close", (code) => resolve({ code: code ?? 1, stderr }))
  })
}

export async function renderRemix(remix: Remix, outFile: string, fps = 10): Promise<RenderResult> {
  const ffmpeg = findFfmpeg()
  const chrome = findChrome()
  if (!ffmpeg || !chrome) {
    return { ok: false, message: missingToolsMessage(ffmpeg, chrome) }
  }

  const framesDir = fs.mkdtempSync(path.join(os.tmpdir(), "om-frames-"))
  const outDir = path.dirname(outFile)
  fs.mkdirSync(outDir, { recursive: true })

  let browser: Awaited<ReturnType<typeof chromium.launch>> | null = null
  try {
    browser = await chromium.launch({
      executablePath: chrome,
      headless: true,
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--font-render-hinting=none"],
    })
    const page = await browser.newPage({
      viewport: { width: remix.width, height: remix.height },
      deviceScaleFactor: 1,
    })
    await page.setContent(stageDocument(remix), { waitUntil: "domcontentloaded" })

    const totalFrames = Math.max(1, Math.round((remix.totalDurationMs / 1000) * fps))
    for (let i = 0; i < totalFrames; i += 1) {
      const timeMs = Math.min(remix.totalDurationMs, (i / fps) * 1000)
      const html = stageInnerHtml(remix, timeMs)
      await page.evaluate((inner) => {
        const stage = document.getElementById("om-stage")
        if (stage) stage.innerHTML = inner
      }, html)
      const framePath = path.join(framesDir, `frame-${String(i).padStart(5, "0")}.png`)
      await page.locator("#om-stage").screenshot({ path: framePath, type: "png" })
    }

    const encode = await run(ffmpeg, [
      "-y",
      "-framerate",
      String(fps),
      "-i",
      path.join(framesDir, "frame-%05d.png"),
      "-c:v",
      "libx264",
      "-pix_fmt",
      "yuv420p",
      "-crf",
      "23",
      "-movflags",
      "+faststart",
      outFile,
    ])
    if (encode.code !== 0 || !fs.existsSync(outFile)) {
      return {
        ok: false,
        message: `ffmpeg failed to encode MP4.${encode.stderr ? ` ${encode.stderr.split("\n").at(-2)}` : ""}`,
      }
    }

    const name = path.basename(outFile)
    return {
      ok: true,
      path: outFile,
      url: `/out/${name}`,
      frames: totalFrames,
      message: `Wrote ${name} (${totalFrames} frames @ ${fps}fps).`,
    }
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error)
    return {
      ok: false,
      message: `Headless capture failed: ${detail}`,
    }
  } finally {
    if (browser) await browser.close()
    fs.rmSync(framesDir, { recursive: true, force: true })
  }
}
